import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  getCostBreakdown,
  getCostMetrics,
  getCostComparison,
  getTimeOfUseCosts,
} from '../supabase/queries';
import type {
  CostBreakdown,
  CostMetrics,
  CostComparison,
  TimeOfUseCost,
  CostAnalysisResponse,
} from '../../types/cost-analysis';

interface UseCostAnalysisParams {
  clientId: string;
  locationId: string;
  startDate?: Date;
  endDate?: Date;
}

export function useCostAnalysis({
  clientId,
  locationId,
  startDate = startOfMonth(new Date()),
  endDate = endOfMonth(new Date()),
}: UseCostAnalysisParams): CostAnalysisResponse {
  const metricsQuery = useQuery<CostMetrics, Error>({
    queryKey: ['costMetrics', clientId, locationId, startDate, endDate],
    queryFn: () => getCostMetrics(clientId, locationId, startDate, endDate),
  });

  const comparisonQuery = useQuery<CostComparison, Error>({
    queryKey: ['costComparison', clientId, locationId, startDate, endDate],
    queryFn: () => getCostComparison(clientId, locationId, startDate, endDate),
  });

  const timeOfUseQuery = useQuery<TimeOfUseCost[], Error>({
    queryKey: ['timeOfUseCosts', clientId, locationId, startDate, endDate],
    queryFn: () => getTimeOfUseCosts(clientId, locationId, startDate, endDate),
  });

  // Simple anomaly detection based on statistical analysis
  const anomalies = timeOfUseQuery.data?.map(record => {
    const avgCost = timeOfUseQuery.data.reduce((sum, r) => sum + r.cost, 0) / timeOfUseQuery.data.length;
    const stdDev = Math.sqrt(
      timeOfUseQuery.data.reduce((sum, r) => sum + Math.pow(r.cost - avgCost, 2), 0) / timeOfUseQuery.data.length
    );

    const deviation = Math.abs(record.cost - avgCost) / stdDev;
    const severity: 'high' | 'medium' | 'low' = deviation > 2 ? 'high' : deviation > 1 ? 'medium' : 'low';

    return {
      date: `${record.weekday}-${record.hour}`,
      actualCost: record.cost,
      expectedCost: avgCost,
      deviation,
      severity,
    };
  }) ?? [];

  // Simple linear regression for cost forecasting
  const forecast = timeOfUseQuery.data?.map(record => {
    const trend = 0.02; // Simplified trend calculation
    const seasonality = Math.sin((record.hour / 24) * 2 * Math.PI) * 0.1; // Daily pattern
    const baseline = record.cost;

    return {
      date: `${record.weekday}-${record.hour}`,
      predictedCost: baseline * (1 + trend + seasonality),
      confidenceInterval: {
        lower: baseline * 0.9,
        upper: baseline * 1.1,
      },
    };
  }) ?? [];

  // Identify cost saving opportunities based on patterns
  const savingOpportunities = timeOfUseQuery.data ? [
    {
      id: '1',
      description: 'Shift peak usage to off-peak hours',
      potentialSavings: metricsQuery.data?.peakCostPerKwh ?
        metricsQuery.data.peakCostPerKwh * 1000 * 0.2 : 0, // 20% reduction potential
      category: 'peak-reduction' as const,
      priority: 'high' as const,
    },
    {
      id: '2',
      description: 'Optimize HVAC scheduling',
      potentialSavings: metricsQuery.data?.averageCostPerKwh ?
        metricsQuery.data.averageCostPerKwh * 1000 * 0.15 : 0, // 15% reduction potential
      category: 'efficiency' as const,
      priority: 'medium' as const,
    },
  ] : [];

  const isLoading = metricsQuery.isLoading || comparisonQuery.isLoading || timeOfUseQuery.isLoading;
  const isError = metricsQuery.isError || comparisonQuery.isError || timeOfUseQuery.isError;
  const error = metricsQuery.error || comparisonQuery.error || timeOfUseQuery.error;

  return {
    breakdown: {} as CostBreakdown, // Placeholder until we have actual breakdown data
    metrics: metricsQuery.data as CostMetrics,
    comparison: comparisonQuery.data as CostComparison,
    forecast,
    anomalies,
    timeOfUse: timeOfUseQuery.data || [],
    savingOpportunities,
    isLoading,
    isError,
    error: error || null,
  };
}

// Hook for fetching a single cost breakdown
export function useCostBreakdown(energyDataId: string) {
  return useQuery<CostBreakdown, Error>({
    queryKey: ['costBreakdown', energyDataId],
    queryFn: () => getCostBreakdown(energyDataId),
  });
}
