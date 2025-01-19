import { useCallback, useEffect, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { demandAnalyzer, type DemandProfile } from '../demand/demandAnalyzer';
import type { EnergyData } from '@/types/energy';

interface UseDemandProfileOptions {
  locationId: string;
  interval?: number; // Update interval in seconds
}

interface UseDemandProfileResult {
  profile: DemandProfile | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useDemandProfile({
  locationId,
  interval = 300, // 5 minutes default
}: UseDemandProfileOptions): UseDemandProfileResult {
  const [profile, setProfile] = useState<DemandProfile | null>(null);
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

  // Update demand profile
  const updateProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch historical data if needed
      let historicalData: EnergyData[] = [];
      try {
        historicalData = await fetchHistoricalData();
      } catch (err) {
        console.warn('Failed to fetch historical data, proceeding with real-time only');
      }

      // Combine historical and real-time data
      const allData = [...historicalData];
      if (realtimeData) {
        allData.push(realtimeData);
      }

      // Analyze demand if we have data
      if (allData.length > 0) {
        const newProfile = demandAnalyzer.analyzeDemand(allData);
        setProfile(newProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update demand profile'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoricalData, realtimeData]);

  // Initial load and periodic updates
  useEffect(() => {
    updateProfile();

    // Set up periodic updates
    const intervalId = setInterval(updateProfile, interval * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateProfile, interval]);

  // Handle real-time errors
  useEffect(() => {
    if (realtimeError) {
      setError(new Error('Real-time updates error: ' + realtimeError.message));
    }
  }, [realtimeError]);

  return {
    profile,
    isLoading,
    error,
    refresh: updateProfile,
  };
}
