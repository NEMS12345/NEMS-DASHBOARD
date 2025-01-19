import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  RawEnergyReading,
  EnergyData,
  AggregatedData,
  EnergyDataResponse
} from '@/types/energy';

export function useEnergyData(
  locationId: string | null,
  startDate: Date,
  endDate: Date
): EnergyDataResponse {
  const {
    data: rawData,
    isLoading,
    isError,
    error
  } = useQuery<RawEnergyReading[], Error>({
    queryKey: ['energyData'], // Only use base key to prevent unnecessary refetches
    queryFn: async () => {
      const query = supabase
        .from('energy_data')
        .select('*')
        .order('bill_date', { ascending: true });

      // Only add location filter if a specific location is selected
      if (locationId && locationId !== 'all') {
        query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) throw new Error('No data returned from the server');

      // Filter data client-side by date range
      return data.filter(reading => {
        const readingDate = new Date(reading.bill_date);
        return readingDate >= startDate && readingDate <= endDate;
      });
    },
    enabled: true, // Always enabled since we handle 'all' locations in the query
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2, // Retry failed requests twice
  });

  // Transform data for components
  const data: EnergyData[] = rawData?.map(reading => ({
    timestamp: reading.bill_date,
    value: reading.peak_demand_kw
  })) || [];

  // Calculate aggregated data if we have raw data
  const aggregatedData: AggregatedData | undefined = rawData?.length ? {
    total: rawData.reduce((sum, reading) => sum + reading.peak_demand_kw, 0),
    average: rawData.reduce((sum, reading) => sum + reading.peak_demand_kw, 0) / rawData.length,
  } : undefined;

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    aggregatedData
  };
}
