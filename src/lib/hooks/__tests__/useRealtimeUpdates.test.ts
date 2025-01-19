import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtimeUpdates } from '../useRealtimeUpdates';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface MockEnergyData extends Record<string, unknown> {
  value: number;
  timestamp: string;
}

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation(callback => {
          if (callback) callback('SUBSCRIBED');
          return channel;
        }),
        unsubscribe: vi.fn(),
        // Required RealtimeChannel properties
        topic: 'test',
        params: {},
        socket: {} as Record<string, never>,
        bindings: {},
        state: 'SUBSCRIBED',
        send: vi.fn(),
      } as unknown as RealtimeChannel;
      return channel;
    }),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { value: 100, timestamp: new Date().toISOString() },
        error: null,
      }),
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      url: new URL('http://localhost:3000'),
      headers: {},
      schema: 'public',
      filter: vi.fn(),
      match: vi.fn(),
      throwOnError: false,
      count: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('useRealtimeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null data and no error', () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should create a Supabase channel subscription', () => {
    renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith('test-channel');
  });

  it('should fetch initial data', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
        table: 'energy_data',
      })
    );

    // Wait for initial data fetch
    await vi.waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(supabase.from).toHaveBeenCalledWith('energy_data');
  });

  it('should handle subscription status updates', () => {
    const mockConsoleLog = vi.spyOn(console, 'log');
    const mockConsoleError = vi.spyOn(console, 'error');

    renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    expect(mockConsoleLog).toHaveBeenCalledWith('Subscribed to test-channel');
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should clean up subscription on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    // Mock database error
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      }),
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      url: new URL('http://localhost:3000'),
      headers: {},
      schema: 'public',
      filter: vi.fn(),
      match: vi.fn(),
      throwOnError: false,
      count: vi.fn(),
      single: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
        table: 'energy_data',
      })
    );

    await vi.waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toBe('Failed to fetch latest data');
  });

  it('should handle channel errors', () => {
    // Mock channel error with proper type casting
    vi.mocked(supabase.channel).mockImplementationOnce(() => {
      const channel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation(callback => {
          if (callback) callback('CHANNEL_ERROR');
          return channel;
        }),
        unsubscribe: vi.fn(),
        topic: 'test',
        params: {},
        socket: {} as Record<string, never>,
        bindings: {},
        state: 'CHANNEL_ERROR',
        send: vi.fn(),
      } as unknown as RealtimeChannel;
      return channel;
    });

    const { result } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    expect(result.current.error?.message).toBe('Real-time connection error');
  });

  it('should update data on real-time changes', async () => {
    let channelCallback: ((payload: RealtimePostgresInsertPayload<MockEnergyData>) => void) | undefined;

    // Mock channel to capture callback with proper type casting
    vi.mocked(supabase.channel).mockImplementationOnce(() => {
      const channel = {
        on: vi.fn().mockImplementation((event, config, callback) => {
          channelCallback = callback;
          return channel;
        }),
        subscribe: vi.fn().mockReturnThis(),
        topic: 'test',
        params: {},
        socket: {} as Record<string, never>,
        bindings: {},
        state: 'SUBSCRIBED',
        unsubscribe: vi.fn(),
        send: vi.fn(),
      } as unknown as RealtimeChannel;
      return channel;
    });

    const { result } = renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    // Ensure callback was set
    expect(channelCallback).toBeDefined();

    if (channelCallback) {
      // Simulate real-time update with proper payload type
      const newData: MockEnergyData = { value: 200, timestamp: new Date().toISOString() };
      channelCallback({
        schema: 'public',
        table: 'energy_data',
        commit_timestamp: new Date().toISOString(),
        eventType: 'INSERT',
        new: newData,
        old: {} as Partial<MockEnergyData>,
        errors: [],
      });

      await vi.waitFor(() => {
        expect(result.current.data).toEqual(newData);
      });
    }
  });

  it('should respect the update interval', async () => {
    vi.useFakeTimers();

    renderHook(() =>
      useRealtimeUpdates<MockEnergyData>({
        channel: 'test-channel',
        interval: 60,
      })
    );

    // Initial fetch
    expect(supabase.from).toHaveBeenCalledTimes(1);

    // Advance time by interval
    await vi.advanceTimersByTimeAsync(60 * 1000);

    // Should fetch again
    expect(supabase.from).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
