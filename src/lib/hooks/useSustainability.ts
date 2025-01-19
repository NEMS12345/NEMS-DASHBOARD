import { useCallback, useEffect, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { sustainabilityAnalyzer, type SustainabilityMetrics } from '../sustainability/sustainabilityAnalyzer';
import type { EnergyData } from '@/types/energy';

interface UseSustainabilityOptions {
  locationId: string;
  interval?: number; // Update interval in seconds
}

interface UseSustainabilityResult {
  metrics: SustainabilityMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSustainability({
  locationId,
  interval = 300, // 5 minutes default
}: UseSustainabilityOptions): UseSustainabilityResult {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time energy data updates
  const { data: realtimeData, error: realtimeError } = useRealtimeUpdates<EnergyData>({
    channel: `energy_data:${locationId}`,
    interval,
  });

  // Fetch historical data for the location
  const fetchHistoricalData = useCallback(async () => {
    try {
      const response = await fetch(`/api/energy/historical?locationId=${locationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      const data: EnergyData[] = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching historical data:', err);
      throw err;
    }
  }, [locationId]);

  // Update sustainability metrics
  const updateMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch historical data if needed
      let historicalData: EnergyData[] = [];
      try {
        historicalData = await fetchHistoricalData();
      } catch {
        console.warn('Failed to fetch historical data, proceeding with real-time only');
      }

      // Combine historical and real-time data
      const allData = [...historicalData];
      if (realtimeData) {
        allData.push(realtimeData);
      }

      // Calculate sustainability metrics if we have data
      if (allData.length > 0) {
        const newMetrics = sustainabilityAnalyzer.analyzeSustainability(allData);
        setMetrics(newMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update sustainability metrics'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoricalData, realtimeData]);

  // Initial load and periodic updates
  useEffect(() => {
    updateMetrics();

    // Set up periodic updates
    const intervalId = setInterval(updateMetrics, interval * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateMetrics, interval]);

  // Handle real-time errors
  useEffect(() => {
    if (realtimeError) {
      setError(new Error('Real-time updates error: ' + realtimeError.message));
    }
  }, [realtimeError]);

  return {
    metrics,
    isLoading,
    error,
    refresh: updateMetrics,
  };
}
