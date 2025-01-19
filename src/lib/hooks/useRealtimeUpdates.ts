import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseRealtimeUpdatesOptions<TData> {
  channel: string;
  interval?: number;
  table?: string;
  filter?: string;
  cacheTime?: number; // Time in seconds to keep data in cache
  retryAttempts?: number;
  alertThresholds?: {
    [key: string]: {
      min?: number;
      max?: number;
      callback?: (value: number) => void;
    };
  };
}

interface UseRealtimeUpdatesResult<TData> {
  data: TData | null;
  error: Error | null;
  status: 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastUpdated: Date | null;
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  refresh: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<Record<string, unknown>>>();

export function useRealtimeUpdates<TData extends Record<string, unknown>>({
  channel,
  interval = 60,
  table = 'energy_data',
  filter,
  cacheTime = 300, // 5 minutes default cache time
  retryAttempts = 3,
  alertThresholds
}: UseRealtimeUpdatesOptions<TData>): UseRealtimeUpdatesResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }>>([]);

  const retryCount = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const cacheKey = `${channel}:${table}:${filter || ''}`;

  // Check cache and alert thresholds
  const processData = useCallback((newData: TData) => {
    // Update cache
    cache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });

    // Check alert thresholds
    if (alertThresholds && typeof newData === 'object') {
      Object.entries(alertThresholds).forEach(([key, threshold]) => {
        const value = (newData as Record<string, unknown>)[key];
        if (typeof value === 'number') {
          if (threshold.max !== undefined && value > threshold.max) {
            setAlerts(prev => [...prev, {
              type: 'critical',
              message: `${key} exceeded maximum threshold: ${value} > ${threshold.max}`,
              timestamp: new Date()
            }]);
            threshold.callback?.(value);
          }
          if (threshold.min !== undefined && value < threshold.min) {
            setAlerts(prev => [...prev, {
              type: 'warning',
              message: `${key} below minimum threshold: ${value} < ${threshold.min}`,
              timestamp: new Date()
            }]);
            threshold.callback?.(value);
          }
        }
      });
    }

    setData(newData);
    setLastUpdated(new Date());
    setError(null);
    setStatus('connected');
  }, [alertThresholds, cacheKey]);

  // Websocket fallback implementation
  const setupWebsocketFallback = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(`ws://${window.location.host}/api/realtime`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        processData(newData);
      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (status === 'connected') {
        setStatus('reconnecting');
      }
    };

    ws.onerror = () => {
      wsRef.current = null;
      setStatus('error');
    };
  }, [status, processData]);

  // Fetch latest data with smart caching
  const fetchLatestData = useCallback(async () => {
    try {
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime * 1000) {
        processData(cached.data as TData);
        return;
      }

      const { data: latestData, error: queryError } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      if (latestData) {
        processData(latestData as TData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch latest data'));
      setStatus('error');

      // Implement retry logic
      if (retryCount.current < retryAttempts) {
        retryCount.current++;
        setTimeout(fetchLatestData, 1000 * Math.pow(2, retryCount.current)); // Exponential backoff
      } else {
        setupWebsocketFallback(); // Try websocket as fallback
      }
    }
  }, [table, cacheKey, cacheTime, retryAttempts, processData, setupWebsocketFallback]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    retryCount.current = 0; // Reset retry count
    await fetchLatestData();
  }, [fetchLatestData]);

  useEffect(() => {
    // Subscribe to real-time updates
    const realtimeChannel = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          processData(payload.new as TData);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channel}`);
          setStatus('connected');
        } else if (status === 'CLOSED') {
          console.log(`Channel ${channel} closed`);
          setStatus('reconnecting');
          setupWebsocketFallback();
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error in channel ${channel}`);
          setStatus('error');
          setupWebsocketFallback();
        }
      });

    // Initial fetch
    fetchLatestData();

    // Set up periodic fetching
    const intervalId = setInterval(fetchLatestData, interval * 1000);

    // Clean up old cache entries periodically
    const cacheCleanupId = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > cacheTime * 1000) {
          cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearInterval(cacheCleanupId);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      supabase.removeChannel(realtimeChannel);
    };
  }, [channel, interval, table, filter, cacheTime, processData, fetchLatestData, setupWebsocketFallback]);

  return {
    data,
    error,
    status,
    lastUpdated,
    alerts,
    refresh
  };
}
