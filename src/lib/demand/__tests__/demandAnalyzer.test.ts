import { describe, it, expect, beforeEach } from 'vitest';
import { demandAnalyzer } from '../demandAnalyzer';
import type { EnergyData } from '@/types/energy';

describe('Demand Analyzer', () => {
  const mockData: EnergyData[] = [
    {
      timestamp: '2024-03-01T00:00:00Z',
      value: 45.5
    },
    {
      timestamp: '2024-03-01T01:00:00Z',
      value: 42.3
    },
    {
      timestamp: '2024-03-01T02:00:00Z',
      value: 38.7
    },
    {
      timestamp: '2024-03-01T03:00:00Z',
      value: 65.2 // Anomaly - unusual spike
    },
    {
      timestamp: '2024-03-01T04:00:00Z',
      value: 41.1
    }
  ];

  beforeEach(() => {
    // Reset historical data before each test
    demandAnalyzer.updateHistoricalData([]);
  });

  it('should analyze demand data correctly', () => {
    const profile = demandAnalyzer.analyzeDemand(mockData);

    // Verify basic structure
    expect(profile).toBeDefined();
    expect(profile.currentDemand).toBeDefined();
    expect(profile.peakDemand).toBeDefined();
    expect(profile.predictedPeak).toBeDefined();
    expect(profile.demandTrend).toBeDefined();
    expect(profile.timeToNextPeak).toBeDefined();
    expect(profile.recommendations).toBeDefined();

    // Verify calculations
    expect(profile.currentDemand).toBe(41.1); // Last value
    expect(profile.peakDemand).toBe(65.2); // Highest value
    expect(profile.demandTrend).toBe('decreasing'); // Last values show decrease
    expect(profile.recommendations.length).toBeGreaterThan(0);
  });

  it('should detect increasing trend', () => {
    const increasingData: EnergyData[] = [
      { timestamp: '2024-03-01T00:00:00Z', value: 40 },
      { timestamp: '2024-03-01T01:00:00Z', value: 42 },
      { timestamp: '2024-03-01T02:00:00Z', value: 45 },
      { timestamp: '2024-03-01T03:00:00Z', value: 48 },
      { timestamp: '2024-03-01T04:00:00Z', value: 52 }
    ];

    const profile = demandAnalyzer.analyzeDemand(increasingData);
    expect(profile.demandTrend).toBe('increasing');
  });

  it('should detect stable trend', () => {
    const stableData: EnergyData[] = [
      { timestamp: '2024-03-01T00:00:00Z', value: 40 },
      { timestamp: '2024-03-01T01:00:00Z', value: 40.5 },
      { timestamp: '2024-03-01T02:00:00Z', value: 40.2 },
      { timestamp: '2024-03-01T03:00:00Z', value: 40.8 },
      { timestamp: '2024-03-01T04:00:00Z', value: 40.3 }
    ];

    const profile = demandAnalyzer.analyzeDemand(stableData);
    expect(profile.demandTrend).toBe('stable');
  });

  it('should generate appropriate recommendations for high demand', () => {
    const highDemandData: EnergyData[] = [
      { timestamp: '2024-03-01T00:00:00Z', value: 90 }, // Very high demand
      { timestamp: '2024-03-01T01:00:00Z', value: 95 },
      { timestamp: '2024-03-01T02:00:00Z', value: 92 },
      { timestamp: '2024-03-01T03:00:00Z', value: 98 },
      { timestamp: '2024-03-01T04:00:00Z', value: 96 }
    ];

    const profile = demandAnalyzer.analyzeDemand(highDemandData);

    // Should have immediate action recommendations
    const immediateRecs = profile.recommendations.filter(rec => rec.type === 'immediate');
    expect(immediateRecs.length).toBeGreaterThan(0);
    expect(immediateRecs[0].priority).toBe('high');
  });

  it('should handle empty data gracefully', () => {
    const profile = demandAnalyzer.analyzeDemand([]);

    expect(profile.currentDemand).toBe(0);
    expect(profile.peakDemand).toBe(0);
    expect(profile.predictedPeak).toBe(0);
    expect(profile.demandTrend).toBe('stable');
    expect(profile.recommendations).toHaveLength(0);
  });

  it('should maintain historical data window', () => {
    // Add old data
    const oldData: EnergyData[] = Array.from({ length: 40 }, (_, i) => ({
      timestamp: new Date(Date.now() - (i + 31) * 24 * 60 * 60 * 1000).toISOString(),
      value: 40 + i
    }));

    // Add recent data
    const recentData: EnergyData[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      value: 50 + i
    }));

    demandAnalyzer.updateHistoricalData([...oldData, ...recentData]);
    const profile = demandAnalyzer.analyzeDemand(recentData);

    // Should only use recent data for peak calculation
    expect(profile.peakDemand).toBeLessThanOrEqual(60); // Max of recent data
  });
});
