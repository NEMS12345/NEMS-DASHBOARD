import { describe, it, expect, vi } from 'vitest';
import { billAnalyzer } from '../billAnalyzer';
import { claudeClient } from '../client';
import type { CostBreakdown } from '@/types/cost-analysis';
import type { EnergyData } from '@/types/energy';

// Mock Claude client
vi.mock('../client', () => ({
  claudeClient: {
    analyzeBill: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        anomalies: [{
          description: 'Unusual peak usage',
          severity: 'high',
          impact: 'Increased demand charges',
          confidence: 0.85
        }],
        savings: [{
          description: 'Shift peak load to off-peak hours',
          potentialAmount: 500,
          effort: 'medium',
          confidence: 0.9
        }],
        recommendations: [{
          title: 'Peak Load Management',
          description: 'Implement automated load shifting',
          priority: 'high',
          implementationSteps: ['Install controls', 'Configure schedules'],
          estimatedCost: 5000,
          expectedSavings: 1000,
          paybackPeriod: 5
        }],
        patterns: [{
          type: 'daily',
          description: 'Morning peak pattern',
          significance: 'high',
          trend: 0.05,
          seasonality: 0.2,
          confidence: 0.95
        }]
      })
    }),
    detectAnomalies: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        anomalies: [{
          timestamp: '2024-03-01T03:00:00Z',
          type: 'spike',
          severity: 'high',
          expectedValue: 40,
          actualValue: 65.2,
          deviation: 0.63,
          potentialCauses: ['Equipment malfunction'],
          confidence: 0.9,
          impact: {
            cost: 25.2,
            efficiency: -15,
            description: 'Significant cost increase'
          }
        }]
      })
    }),
    generateRecommendations: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        recommendations: [{
          title: 'Load Shifting Program',
          description: 'Implement automated load shifting',
          category: 'peak-reduction',
          estimatedSavings: 1000,
          implementationCost: 5000,
          paybackPeriod: 5,
          priority: 'high',
          confidence: 0.9,
          requirements: {
            technical: ['Control system'],
            operational: ['Staff training'],
            resources: ['Budget allocation']
          },
          implementation: {
            steps: ['Install controls', 'Configure schedules'],
            timeline: '3 months',
            risks: ['Equipment compatibility'],
            mitigations: ['Pre-installation assessment']
          },
          impact: {
            cost: 1000,
            efficiency: 15,
            sustainability: 10
          }
        }]
      })
    })
  }
}));

describe('Bill Analyzer', () => {
  const mockBreakdown: CostBreakdown = {
    id: 'test-1',
    energy_data_id: 'data-1',
    peak_cost: 150.50,
    off_peak_cost: 75.25,
    demand_charges: 50.00,
    fixed_charges: 25.00,
    taxes: 30.00,
    other_charges: 10.00,
    created_at: new Date().toISOString()
  };

  const mockUsageData: EnergyData[] = [
    {
      timestamp: '2024-03-01T00:00:00Z', // Off-peak
      value: 45.5
    },
    {
      timestamp: '2024-03-01T10:00:00Z', // Peak
      value: 42.3
    },
    {
      timestamp: '2024-03-01T02:00:00Z', // Off-peak
      value: 38.7
    },
    {
      timestamp: '2024-03-01T03:00:00Z', // Off-peak, anomaly
      value: 65.2
    },
    {
      timestamp: '2024-03-01T14:00:00Z', // Peak
      value: 41.1
    }
  ];

  it('should analyze bill data and detect anomalies', async () => {
    const result = await billAnalyzer.analyze(mockBreakdown, mockUsageData);

    // Verify analysis results
    expect(result.isError).toBe(false);
    expect(result.error).toBeNull();

    // Verify metrics calculation
    expect(result.metrics).toBeDefined();
    expect(result.metrics.averageCostPerKwh).toBeGreaterThan(0);
    expect(result.metrics.peakCostPerKwh).toBeGreaterThan(result.metrics.offPeakCostPerKwh);
    expect(result.metrics.demandCostPerKw).toBeGreaterThan(0);

    // Verify anomalies detection
    expect(result.anomalies).toBeDefined();
    expect(Array.isArray(result.anomalies)).toBe(true);
    if (result.anomalies.length > 0) {
      const anomaly = result.anomalies[0];
      expect(anomaly.date).toBeDefined();
      expect(anomaly.actualCost).toBeGreaterThan(0);
      expect(anomaly.expectedCost).toBeGreaterThan(0);
      expect(anomaly.deviation).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(anomaly.severity);
    }

    // Verify saving opportunities
    expect(result.savingOpportunities).toBeDefined();
    expect(Array.isArray(result.savingOpportunities)).toBe(true);
    if (result.savingOpportunities.length > 0) {
      const opportunity = result.savingOpportunities[0];
      expect(opportunity.id).toBeDefined();
      expect(opportunity.description).toBeDefined();
      expect(opportunity.potentialSavings).toBeGreaterThan(0);
      expect(['peak-reduction', 'efficiency', 'rate-optimization', 'demand-response']).toContain(opportunity.category);
      expect(['low', 'medium', 'high']).toContain(opportunity.priority);
      if (opportunity.implementationCost) {
        expect(opportunity.paybackPeriod).toBeDefined();
      }
    }

    // Verify forecast generation
    expect(result.forecast).toBeDefined();
    expect(Array.isArray(result.forecast)).toBe(true);
    if (result.forecast.length > 0) {
      const forecast = result.forecast[0];
      expect(forecast.date).toBeDefined();
      expect(forecast.predictedCost).toBeGreaterThan(0);
      expect(forecast.confidenceInterval.lower).toBeLessThan(forecast.predictedCost);
      expect(forecast.confidenceInterval.upper).toBeGreaterThan(forecast.predictedCost);
    }

    // Verify time-of-use data
    expect(result.timeOfUse).toBeDefined();
    expect(Array.isArray(result.timeOfUse)).toBe(true);
    expect(result.timeOfUse.length).toBe(24 * 7); // 24 hours * 7 days
    if (result.timeOfUse.length > 0) {
      const timeOfUse = result.timeOfUse[0];
      expect(timeOfUse.hour).toBeGreaterThanOrEqual(0);
      expect(timeOfUse.hour).toBeLessThan(24);
      expect(timeOfUse.weekday).toBeGreaterThanOrEqual(0);
      expect(timeOfUse.weekday).toBeLessThan(7);
      expect(timeOfUse.cost).toBeGreaterThanOrEqual(0);
    }

    // Verify peak vs off-peak calculations
    const peakHours = result.timeOfUse.filter(tou => tou.hour >= 9 && tou.hour <= 17);
    const offPeakHours = result.timeOfUse.filter(tou => tou.hour < 9 || tou.hour > 17);
    const avgPeakCost = peakHours.reduce((sum, tou) => sum + tou.cost, 0) / peakHours.length;
    const avgOffPeakCost = offPeakHours.reduce((sum, tou) => sum + tou.cost, 0) / offPeakHours.length;
    expect(avgPeakCost).toBeGreaterThan(avgOffPeakCost);
  });

  it('should handle empty usage data gracefully', async () => {
    const result = await billAnalyzer.analyze(mockBreakdown, []);

    expect(result.isError).toBe(false);
    expect(result.metrics.averageCostPerKwh).toBe(0);
    expect(result.anomalies).toHaveLength(0);
    expect(result.forecast).toHaveLength(0);
    expect(result.timeOfUse).toHaveLength(24 * 7); // Still generates time slots but with 0 cost
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(claudeClient.analyzeBill).mockRejectedValueOnce(new Error('API Error'));

    const result = await billAnalyzer.analyze(mockBreakdown, mockUsageData);

    expect(result.isError).toBe(true);
    expect(result.error).toBeDefined();
    expect(result.metrics.averageCostPerKwh).toBe(0);
    expect(result.anomalies).toHaveLength(0);
    expect(result.savingOpportunities).toHaveLength(0);
  });

  it('should calculate correct period comparisons', async () => {
    const result = await billAnalyzer.analyze(mockBreakdown, mockUsageData);

    expect(result.comparison.currentPeriod.totalCost).toBe(mockBreakdown.peak_cost + mockBreakdown.off_peak_cost);
    expect(result.comparison.currentPeriod.peakCosts).toBe(mockBreakdown.peak_cost);
    expect(result.comparison.currentPeriod.offPeakCosts).toBe(mockBreakdown.off_peak_cost);
    expect(result.comparison.percentageChange.totalCost).toBeDefined();
    expect(result.comparison.percentageChange.averageCost).toBeDefined();
  });

  it('should generate forecasts with increasing uncertainty', async () => {
    const result = await billAnalyzer.analyze(mockBreakdown, mockUsageData);
    const forecasts = result.forecast;

    // Check that uncertainty increases over time
    for (let i = 1; i < forecasts.length; i++) {
      const currentUncertainty = forecasts[i].confidenceInterval.upper - forecasts[i].confidenceInterval.lower;
      const previousUncertainty = forecasts[i-1].confidenceInterval.upper - forecasts[i-1].confidenceInterval.lower;
      expect(currentUncertainty).toBeGreaterThan(previousUncertainty);
    }
  });
});
