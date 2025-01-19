import { describe, it, expect } from 'vitest';
import { sustainabilityAnalyzer } from '../sustainabilityAnalyzer';
import type { EnergyData } from '@/types/energy';

describe('Sustainability Analyzer', () => {
  const mockData: EnergyData[] = [
    {
      timestamp: '2024-03-01T00:00:00Z',
      value: 100
    },
    {
      timestamp: '2024-03-01T01:00:00Z',
      value: 95
    },
    {
      timestamp: '2024-03-01T02:00:00Z',
      value: 120
    },
    {
      timestamp: '2024-03-01T03:00:00Z',
      value: 85
    },
    {
      timestamp: '2024-03-01T04:00:00Z',
      value: 90
    }
  ];

  it('should analyze sustainability metrics correctly', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);

    // Verify basic structure
    expect(metrics).toBeDefined();
    expect(metrics.carbonFootprint).toBeDefined();
    expect(metrics.renewableEnergy).toBeDefined();
    expect(metrics.efficiency).toBeDefined();
    expect(metrics.sustainabilityScore).toBeDefined();

    // Verify carbon footprint calculations
    expect(metrics.carbonFootprint.totalEmissions).toBeGreaterThan(0);
    expect(metrics.carbonFootprint.emissionsPerKwh).toBeGreaterThan(0);
    expect(metrics.carbonFootprint.carbonIntensity).toBeGreaterThan(0);
    expect(metrics.carbonFootprint.reductionFromBaseline).toBeDefined();

    // Verify renewable energy metrics
    expect(metrics.renewableEnergy.percentage).toBeGreaterThanOrEqual(0);
    expect(metrics.renewableEnergy.percentage).toBeLessThanOrEqual(100);
    expect(metrics.renewableEnergy.solarContribution).toBeGreaterThan(0);
    expect(metrics.renewableEnergy.windContribution).toBeGreaterThan(0);
    expect(metrics.renewableEnergy.gridUsage).toBeGreaterThan(0);
    expect(metrics.renewableEnergy.peakRenewableHours).toHaveLength(5);

    // Verify efficiency metrics
    expect(metrics.efficiency.energyPerSquareFoot).toBeGreaterThan(0);
    expect(metrics.efficiency.peakEfficiency).toBeGreaterThan(0);
    expect(metrics.efficiency.offPeakEfficiency).toBeGreaterThan(0);
    expect(metrics.efficiency.equipmentScores).toBeDefined();
    expect(metrics.efficiency.wasteEnergy).toBeGreaterThanOrEqual(0);

    // Verify sustainability score
    expect(metrics.sustainabilityScore.overall).toBeGreaterThanOrEqual(0);
    expect(metrics.sustainabilityScore.overall).toBeLessThanOrEqual(100);
    expect(metrics.sustainabilityScore.components).toBeDefined();
    expect(metrics.sustainabilityScore.industryComparison).toBeDefined();
    expect(metrics.sustainabilityScore.trend).toBeDefined();
    expect(metrics.sustainabilityScore.recommendations).toBeDefined();
  });

  it('should generate appropriate recommendations for low scores', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);
    const recommendations = metrics.sustainabilityScore.recommendations;

    // Should have recommendations
    expect(recommendations.length).toBeGreaterThan(0);

    // Each recommendation should have required fields
    recommendations.forEach(rec => {
      expect(rec.id).toBeDefined();
      expect(rec.category).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.impact).toBeDefined();
      expect(rec.priority).toBeDefined();
    });

    // Should have high priority recommendations for low scores
    const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high');
    expect(highPriorityRecs.length).toBeGreaterThan(0);
  });

  it('should handle empty data gracefully', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability([]);

    expect(metrics.carbonFootprint.totalEmissions).toBe(0);
    expect(metrics.renewableEnergy.percentage).toBe(0);
    expect(metrics.efficiency.wasteEnergy).toBe(0);
    expect(metrics.sustainabilityScore.recommendations).toHaveLength(0);
  });

  it('should calculate correct renewable percentages', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);
    const renewable = metrics.renewableEnergy;

    // Total renewable should be sum of solar and wind
    const totalRenewable = renewable.solarContribution + renewable.windContribution;
    const calculatedPercentage = (totalRenewable / (totalRenewable + renewable.gridUsage)) * 100;

    expect(renewable.percentage).toBeCloseTo(calculatedPercentage);
    expect(renewable.percentage).toBeLessThanOrEqual(100);
  });

  it('should identify peak renewable hours correctly', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);
    const peakHours = metrics.renewableEnergy.peakRenewableHours;

    // Should have identified peak hours
    expect(peakHours.length).toBeGreaterThan(0);
    expect(peakHours.length).toBeLessThanOrEqual(5);

    // Hours should be valid timestamps
    peakHours.forEach(hour => {
      expect(() => new Date(hour)).not.toThrow();
    });
  });

  it('should calculate waste energy correctly', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);

    // Waste energy should be non-negative
    expect(metrics.efficiency.wasteEnergy).toBeGreaterThanOrEqual(0);

    // Waste should be less than total usage
    const totalUsage = mockData.reduce((sum, reading) => sum + reading.value, 0);
    expect(metrics.efficiency.wasteEnergy).toBeLessThan(totalUsage);
  });

  it('should provide actionable recommendations', () => {
    const metrics = sustainabilityAnalyzer.analyzeSustainability(mockData);
    const recommendations = metrics.sustainabilityScore.recommendations;

    recommendations.forEach(rec => {
      // Each recommendation should have quantifiable impact
      expect(rec.impact.value).toBeGreaterThan(0);
      expect(rec.impact.unit).toBeDefined();

      // High priority recommendations should have estimated costs
      if (rec.priority === 'high') {
        expect(rec.estimatedCost).toBeDefined();
      }
    });
  });
});
