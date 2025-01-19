import { supabase } from './client';
import { CostBreakdown, CostMetrics, CostComparison, TimeOfUseCost } from '../../types/cost-analysis';
import { subMonths } from 'date-fns';

export async function getLocations() {
  const result = await supabase
    .from('locations')
    .select('id, name')
    .limit(1);

  if (result.error) throw result.error;
  if (!result.data?.length) throw new Error('No locations found');
  return result.data;
}

export async function getEnergyData(clientId: string, locationId?: string) {
  let query = supabase
    .from('energy_data')
    .select(`
      *,
      cost_breakdowns (*)
    `);

  query = query.eq('client_id', clientId);

  if (locationId && locationId !== 'all') {
    query = query.eq('location_id', locationId);
  }

  const result = await query.order('bill_date', { ascending: true });

  if (result.error) throw result.error;
  if (!result.data?.length) throw new Error('No energy data found');
  return result.data;
}

export async function getCostBreakdown(energyDataId: string): Promise<CostBreakdown> {
  const { data, error } = await supabase
    .from('cost_breakdowns')
    .select('*')
    .eq('energy_data_id', energyDataId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('No cost breakdown found');
  return data;
}

export async function getCostMetrics(
  clientId: string,
  locationId: string,
  startDate: Date,
  endDate: Date
): Promise<CostMetrics> {
  const { data: energyData, error } = await supabase
    .from('energy_data')
    .select(`
      *,
      cost_breakdowns (*)
    `)
    .eq('client_id', clientId)
    .eq('location_id', locationId)
    .gte('bill_date', startDate.toISOString())
    .lte('bill_date', endDate.toISOString());

  if (error) throw error;
  if (!energyData?.length) throw new Error('No energy data found for period');

  const totalUsage = energyData.reduce((sum, record) => sum + record.usage_kwh, 0);
  const totalCost = energyData.reduce((sum, record) => sum + record.total_cost, 0);
  const totalPeakCost = energyData.reduce((sum, record) =>
    sum + (record.cost_breakdowns?.[0]?.peak_cost || 0), 0);
  const totalOffPeakCost = energyData.reduce((sum, record) =>
    sum + (record.cost_breakdowns?.[0]?.off_peak_cost || 0), 0);
  const totalDemand = energyData.reduce((sum, record) => sum + record.peak_demand_kw, 0);

  return {
    averageCostPerKwh: totalCost / totalUsage,
    peakCostPerKwh: totalPeakCost / totalUsage,
    offPeakCostPerKwh: totalOffPeakCost / totalUsage,
    demandCostPerKw: totalDemand ?
      energyData.reduce((sum, record) =>
        sum + (record.cost_breakdowns?.[0]?.demand_charges || 0), 0) / totalDemand : 0
  };
}

export async function getCostComparison(
  clientId: string,
  locationId: string,
  currentStartDate: Date,
  currentEndDate: Date
): Promise<CostComparison> {
  // Calculate previous period dates
  const previousStartDate = subMonths(currentStartDate, 1);
  const previousEndDate = subMonths(currentEndDate, 1);

  // Fetch current period metrics
  const currentMetrics = await getCostMetrics(
    clientId,
    locationId,
    currentStartDate,
    currentEndDate
  );

  // Fetch previous period metrics
  const previousMetrics = await getCostMetrics(
    clientId,
    locationId,
    previousStartDate,
    previousEndDate
  );

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number) =>
    previous === 0 ? 0 : ((current - previous) / previous) * 100;

  return {
    currentPeriod: {
      totalCost: currentMetrics.averageCostPerKwh * 1000, // Normalized to 1000 kWh
      averageCost: currentMetrics.averageCostPerKwh,
      peakCosts: currentMetrics.peakCostPerKwh,
      offPeakCosts: currentMetrics.offPeakCostPerKwh
    },
    previousPeriod: {
      totalCost: previousMetrics.averageCostPerKwh * 1000,
      averageCost: previousMetrics.averageCostPerKwh,
      peakCosts: previousMetrics.peakCostPerKwh,
      offPeakCosts: previousMetrics.offPeakCostPerKwh
    },
    percentageChange: {
      totalCost: calculatePercentageChange(
        currentMetrics.averageCostPerKwh,
        previousMetrics.averageCostPerKwh
      ),
      averageCost: calculatePercentageChange(
        currentMetrics.averageCostPerKwh,
        previousMetrics.averageCostPerKwh
      ),
      peakCosts: calculatePercentageChange(
        currentMetrics.peakCostPerKwh,
        previousMetrics.peakCostPerKwh
      ),
      offPeakCosts: calculatePercentageChange(
        currentMetrics.offPeakCostPerKwh,
        previousMetrics.offPeakCostPerKwh
      )
    }
  };
}

export async function getTimeOfUseCosts(
  clientId: string,
  locationId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeOfUseCost[]> {
  const { data: energyData, error } = await supabase
    .from('energy_data')
    .select(`
      reading_time,
      total_cost,
      usage_kwh
    `)
    .eq('client_id', clientId)
    .eq('location_id', locationId)
    .gte('reading_time', startDate.toISOString())
    .lte('reading_time', endDate.toISOString());

  if (error) throw error;
  if (!energyData?.length) return [];

  // Aggregate costs by hour and weekday
  const hourlyCosts = energyData.reduce((acc: TimeOfUseCost[], record) => {
    const date = new Date(record.reading_time);
    const hour = date.getHours();
    const weekday = date.getDay();
    const costPerKwh = record.total_cost / record.usage_kwh;

    const existingEntry = acc.find(entry =>
      entry.hour === hour && entry.weekday === weekday);

    if (existingEntry) {
      existingEntry.cost = (existingEntry.cost + costPerKwh) / 2; // Average
    } else {
      acc.push({ hour, weekday, cost: costPerKwh });
    }

    return acc;
  }, []);

  return hourlyCosts;
}
