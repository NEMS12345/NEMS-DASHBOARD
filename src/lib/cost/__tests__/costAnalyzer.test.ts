import { describe, it, expect } from 'vitest';
import { costAnalyzer } from '../costAnalyzer';
import type { EnergyData } from '@/types/energy';

describe('Cost Analyzer', () => {
  const mockData: EnergyData[] = [
    // Peak hours (9am-5pm)
    {
      timestamp: '2024-03-01T10:00:00Z', // 10am
      value: 100
    },
    {
      timestamp: '2024-03-01T14:00:00Z', // 2pm
      value: 150
    },
    // Off-peak hours
    {
      timestamp: '2024-03-01T06:00:00Z', // 6am
      value: 50
    },
    {
      timestamp: '2024-03-01T20:00:00Z', // 8pm
      value: 75
    },
    {
      timestamp: '2024-03-01T23:00:00Z', // 11pm
      value: 25
    }
  ];

  const previousData: EnergyData[] = [
    // Similar pattern but lower usage
    {
      timestamp: '2024-02-01T10:00:00Z',
      value: 80
    },
    {
      timestamp: '2024-02-01T14:00:00Z',
      value: 120
    },
    {
      timestamp: '2024-02-01T06:00:00Z',
      value: 40
    },
    {
      timestamp: '2024-02-01T20:00:00Z',
      value: 60
    },
    {
      timestamp: '2024-02-01T23:00:00Z',
      value: 20
    }
  ];

  it('should analyze costs correctly', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData, previousData);

    // Verify basic structure
    expect(analysis).toBeDefined();
    expect(analysis.breakdown).toBeDefined();
    expect(analysis.metrics).toBeDefined();
    expect(analysis.comparison).toBeDefined();
    expect(analysis.forecast).toBeDefined();
    expect(analysis.anomalies).toBeDefined();
    expect(analysis.timeOfUse).toBeDefined();
    expect(analysis.savingOpportunities).toBeDefined();
  });

  it('should calculate cost breakdown correctly', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const breakdown = analysis.breakdown;

    // Peak cost: (100 + 150) * 0.15 = 37.5
    // Off-peak cost: (50 + 75 + 25) * 0.08 = 12
    expect(breakdown.peak_cost).toBeCloseTo(37.5);
    expect(breakdown.off_peak_cost).toBeCloseTo(12);
    expect(breakdown.fixed_charges).toBeGreaterThan(0);
    expect(breakdown.taxes).toBeGreaterThan(0);
  });

  it('should calculate metrics correctly', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const metrics = analysis.metrics;

    expect(metrics.averageCostPerKwh).toBeGreaterThan(0);
    expect(metrics.peakCostPerKwh).toBeGreaterThan(metrics.offPeakCostPerKwh);
    expect(metrics.demandCostPerKw).toBeGreaterThan(0);
  });

  it('should calculate period comparison correctly', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData, previousData);
    const comparison = analysis.comparison;

    // Current period should have higher costs (25% more usage)
    expect(comparison.currentPeriod.totalCost).toBeGreaterThan(comparison.previousPeriod.totalCost);
    expect(comparison.percentageChange.totalCost).toBeCloseTo(25, 1);

    // Verify structure
    expect(comparison.currentPeriod.peakCosts).toBeGreaterThan(0);
    expect(comparison.currentPeriod.offPeakCosts).toBeGreaterThan(0);
    expect(comparison.previousPeriod.peakCosts).toBeGreaterThan(0);
    expect(comparison.previousPeriod.offPeakCosts).toBeGreaterThan(0);
  });

  it('should detect cost anomalies', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const anomalies = analysis.anomalies;

    expect(Array.isArray(anomalies)).toBe(true);
    expect(anomalies.length).toBeGreaterThan(0);

    anomalies.forEach(anomaly => {
      expect(anomaly.date).toBeDefined();
      expect(anomaly.actualCost).toBeGreaterThan(0);
      expect(anomaly.expectedCost).toBeGreaterThan(0);
      expect(anomaly.deviation).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(anomaly.severity);
    });
  });

  it('should generate cost forecasts', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const forecast = analysis.forecast;

    expect(Array.isArray(forecast)).toBe(true);
    expect(forecast.length).toBe(24); // One forecast per hour

    forecast.forEach(prediction => {
      expect(prediction.date).toBeDefined();
      expect(prediction.predictedCost).toBeGreaterThanOrEqual(0);
      expect(prediction.confidenceInterval.lower).toBeLessThanOrEqual(prediction.predictedCost);
      expect(prediction.confidenceInterval.upper).toBeGreaterThanOrEqual(prediction.predictedCost);
    });
  });

  it('should generate time-of-use costs', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const timeOfUse = analysis.timeOfUse;

    expect(Array.isArray(timeOfUse)).toBe(true);
    expect(timeOfUse.length).toBe(24 * 7); // 24 hours * 7 days

    timeOfUse.forEach(tou => {
      expect(tou.hour).toBeGreaterThanOrEqual(0);
      expect(tou.hour).toBeLessThan(24);
      expect(tou.weekday).toBeGreaterThanOrEqual(0);
      expect(tou.weekday).toBeLessThan(7);
      expect(tou.cost).toBeGreaterThanOrEqual(0);
    });

    // Peak hours should have higher costs
    const peakHourCosts = timeOfUse.filter(tou => tou.hour >= 9 && tou.hour <= 17);
    const offPeakCosts = timeOfUse.filter(tou => tou.hour < 9 || tou.hour > 17);
    const avgPeakCost = peakHourCosts.reduce((sum, tou) => sum + tou.cost, 0) / peakHourCosts.length;
    const avgOffPeakCost = offPeakCosts.reduce((sum, tou) => sum + tou.cost, 0) / offPeakCosts.length;
    expect(avgPeakCost).toBeGreaterThan(avgOffPeakCost);
  });

  it('should generate saving opportunities', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);
    const opportunities = analysis.savingOpportunities;

    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities.length).toBeGreaterThan(0);

    opportunities.forEach(opportunity => {
      expect(opportunity.id).toBeDefined();
      expect(opportunity.description).toBeDefined();
      expect(opportunity.potentialSavings).toBeGreaterThan(0);
      expect(['peak-reduction', 'efficiency', 'rate-optimization', 'demand-response']).toContain(opportunity.category);
      expect(['low', 'medium', 'high']).toContain(opportunity.priority);

      // High priority opportunities should have implementation details
      if (opportunity.priority === 'high') {
        expect(opportunity.implementationCost).toBeDefined();
        if (opportunity.implementationCost) {
          expect(opportunity.paybackPeriod).toBeDefined();
        }
      }
    });
  });

  it('should handle empty data gracefully', () => {
    const analysis = costAnalyzer.analyzeCosts([]);

    expect(analysis.breakdown.peak_cost).toBe(0);
    expect(analysis.breakdown.off_peak_cost).toBe(0);
    expect(analysis.metrics.averageCostPerKwh).toBe(0);
    expect(analysis.anomalies).toHaveLength(0);
    expect(analysis.savingOpportunities).toHaveLength(0);
  });

  it('should handle missing previous data gracefully', () => {
    const analysis = costAnalyzer.analyzeCosts(mockData);

    expect(analysis.comparison.previousPeriod).toBeDefined();
    expect(analysis.comparison.percentageChange).toBeDefined();
    expect(analysis.comparison.percentageChange.totalCost).toBe(0);
  });
});
