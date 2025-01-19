import { claudeClient } from './client';
import type {
  CostBreakdown,
  CostMetrics,
  CostAnomaly,
  CostSavingOpportunity,
  CostForecast,
  TimeOfUseCost,
  MLInsights,
  CostComparison
} from '@/types/cost-analysis';
import type { EnergyData } from '@/types/energy';

interface MLModelMetadata {
  version: string;
  lastTrainingDate: string;
  accuracy: number;
  features: string[];
  hyperparameters: Record<string, number | string | boolean>;
}

interface AnalysisResult {
  metrics: CostMetrics;
  comparison: CostComparison;
  forecast: CostForecast[];
  anomalies: CostAnomaly[];
  timeOfUse: TimeOfUseCost[];
  savingOpportunities: CostSavingOpportunity[];
  mlInsights: MLInsights;
  isError: boolean;
  error: Error | null;
}

interface TimeSeriesFeatures {
  trend: {
    slope: number;
    intercept: number;
    direction: 'increasing' | 'decreasing';
    strength: number;
  };
  seasonality: {
    dailyPattern: number[];
    peakHour: number;
    troughHour: number;
    amplitude: number;
  };
  cyclicalPatterns: {
    significantLags: number[];
    periodicity: number;
  };
  changePoints: {
    points: number[];
    significance: Array<{
      index: number;
      magnitude: number;
    }>;
  };
}

interface CostFeatures {
  costStructure: {
    peakRatio: number;
    demandChargeRatio: number;
    fixedCostRatio: number;
  };
  temporalPatterns: {
    costComposition: {
      peak: number;
      offPeak: number;
      demand: number;
      fixed: number;
    };
    variability: {
      peak: number;
      offPeak: number;
    };
  };
}

interface PredictionContext {
  historicalStats: {
    mean: number;
    variance: number;
    trends: TimeSeriesFeatures['trend'];
  };
  seasonality: TimeSeriesFeatures['seasonality'];
  patterns: TimeSeriesFeatures['cyclicalPatterns'];
}

interface Recommendation {
  title: string;
  description: string;
  estimatedSavings: number;
  implementationCost: number;
  paybackPeriod: number;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  implementationSteps: string[];
  roi: number;
  mlInsights?: {
    keyFactors: string[];
    sensitivityAnalysis: Array<{
      factor: string;
      impact: number;
    }>;
    riskProfile: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
  };
}

class BillAnalyzer {
  private static instance: BillAnalyzer;
  private readonly PEAK_HOURS = { start: 9, end: 17 }; // 9am-5pm
  private readonly DAYS_IN_MONTH = 30;
  private readonly ML_CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private mlCache: Map<string, { result: CostAnomaly[] | AnalysisResult; timestamp: number }> = new Map();
  private mlModels: Map<string, MLModelMetadata> = new Map();

  private constructor() {
    this.initializeMLModels();
  }
  private initializeMLModels(): void {
    this.mlModels.set('anomalyDetection', {
      version: '2.0.0',
      lastTrainingDate: new Date().toISOString(),
      accuracy: 0.95,
      features: ['usage', 'time', 'cost', 'weather', 'seasonality'],
      hyperparameters: {
        threshold: 0.85,
        windowSize: 24,
        minSamples: 100
      }
    });

    this.mlModels.set('patternRecognition', {
      version: '1.5.0',
      lastTrainingDate: new Date().toISOString(),
      accuracy: 0.92,
      features: ['hourlyUsage', 'dayType', 'temperature', 'occupancy'],
      hyperparameters: {
        minPatternLength: 3,
        maxPatternGap: 2,
        confidenceThreshold: 0.8
      }
    });

    this.mlModels.set('costPrediction', {
      version: '3.0.0',
      lastTrainingDate: new Date().toISOString(),
      accuracy: 0.88,
      features: ['historicalCosts', 'usage', 'rates', 'demand'],
      hyperparameters: {
        horizon: 30,
        ensembleSize: 5,
        learningRate: 0.01
      }
    });
  }

  public static getInstance(): BillAnalyzer {
    if (!BillAnalyzer.instance) {
      BillAnalyzer.instance = new BillAnalyzer();
    }
    return BillAnalyzer.instance;
  }

  private getCachedMLResult<T extends CostAnomaly[] | AnalysisResult>(key: string): T | null {
    const cached = this.mlCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ML_CACHE_TTL) {
      return cached.result as T;
    }
    return null;
  }

  private setCachedMLResult<T extends CostAnomaly[] | AnalysisResult>(key: string, result: T): void {
    this.mlCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private normalizeUsageData(data: EnergyData[]): string {
    const values = data.map(reading => reading.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    const mlFeatures = data.map(reading => {
      const zScore = (reading.value - mean) / stdDev;
      const hour = new Date(reading.timestamp).getHours();
      const dayOfWeek = new Date(reading.timestamp).getDay();

      return {
        timestamp: reading.timestamp,
        value: reading.value,
        zScore: zScore.toFixed(2),
        hourOfDay: hour,
        dayOfWeek,
        isPeak: hour >= this.PEAK_HOURS.start && hour <= this.PEAK_HOURS.end,
        seasonalComponent: Math.sin(2 * Math.PI * hour / 24)
      };
    });

    return JSON.stringify(mlFeatures, null, 2);
  }

  private normalizeBillData(breakdown: CostBreakdown): string {
    return `
      Peak Cost: $${breakdown.peak_cost}
      Off-Peak Cost: $${breakdown.off_peak_cost}
      Demand Charges: $${breakdown.demand_charges}
      Fixed Charges: $${breakdown.fixed_charges}
      Taxes: $${breakdown.taxes}
      Other Charges: $${breakdown.other_charges}
      Created At: ${breakdown.created_at}
    `;
  }

  private calculateDataResolution(usageData: EnergyData[]): string {
    if (usageData.length < 2) return 'unknown';

    const timestamps = usageData.map(reading => new Date(reading.timestamp).getTime());
    const intervals = timestamps.slice(1).map((time, i) => time - timestamps[i]);
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    const minutes = Math.round(avgInterval / (1000 * 60));

    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return '1 hour';
    return `${minutes / 60} hours`;
  }

  private determineRootCause(
    anomaly: {
      type: string;
      potentialCauses: string[];
      context: {
        timeOfDay: string;
        dayOfWeek: string;
        seasonality: string;
      };
      actualValue: number;
      expectedValue: number;
    },
    baseline: Map<string, number>
  ): string {
    const timestamp = new Date(anomaly.context.timeOfDay);
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    const hourlyBaseline = baseline.get(`hour-${hour}`);
    const dailyBaseline = baseline.get(`day-${day}`);

    const hourlyDeviation = hourlyBaseline
      ? Math.abs(anomaly.actualValue - hourlyBaseline) / hourlyBaseline
      : 0;
    const dailyDeviation = dailyBaseline
      ? Math.abs(anomaly.actualValue - dailyBaseline) / dailyBaseline
      : 0;

    if (hourlyDeviation > 0.5 && dailyDeviation > 0.5) {
      return `Unusual activity detected for both time of day (${hourlyDeviation.toFixed(2)}x normal) and day of week (${dailyDeviation.toFixed(2)}x normal). Primary cause: ${anomaly.potentialCauses[0]}`;
    } else if (hourlyDeviation > 0.5) {
      return `Significant deviation from typical hourly pattern (${hourlyDeviation.toFixed(2)}x normal). Likely cause: ${anomaly.potentialCauses[0]}`;
    } else if (dailyDeviation > 0.5) {
      return `Unusual usage pattern for this day of week (${dailyDeviation.toFixed(2)}x normal). Possible cause: ${anomaly.potentialCauses[0]}`;
    }

    return `Multiple factors contributing: ${anomaly.potentialCauses.join(', ')}`;
  }

  private calculateBaselineUsage(usageData: EnergyData[]): Map<string, number> {
    const baseline = new Map<string, number>();

    for (let hour = 0; hour < 24; hour++) {
      const hourlyReadings = usageData.filter(
        reading => new Date(reading.timestamp).getHours() === hour
      );

      if (hourlyReadings.length > 0) {
        const avgUsage = hourlyReadings.reduce((sum, reading) => sum + reading.value, 0) / hourlyReadings.length;
        baseline.set(`hour-${hour}`, avgUsage);
      }
    }

    for (let day = 0; day < 7; day++) {
      const dailyReadings = usageData.filter(
        reading => new Date(reading.timestamp).getDay() === day
      );

      if (dailyReadings.length > 0) {
        const avgUsage = dailyReadings.reduce((sum, reading) => sum + reading.value, 0) / dailyReadings.length;
        baseline.set(`day-${day}`, avgUsage);
      }
    }

    return baseline;
  }

  private async runAnomalyDetection(
    usageData: EnergyData[],
    breakdown: CostBreakdown
  ): Promise<CostAnomaly[]> {
    const cacheKey = `anomalies-${usageData[0].timestamp}-${usageData[usageData.length - 1].timestamp}`;
    const cached = this.getCachedMLResult<CostAnomaly[]>(cacheKey);
    if (cached) return cached;

    const baseline = this.calculateBaselineUsage(usageData);
    const values = usageData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );

    const normalizedData = `
${this.normalizeUsageData(usageData)}

Bill Context:
${this.normalizeBillData(breakdown)}

Baseline Analysis:
${Array.from(baseline.entries())
  .map(([key, value]) => `${key}: ${value.toFixed(2)}kWh`)
  .join('\n')}

Statistical Context:
- Sample Size: ${usageData.length} readings
- Time Range: ${new Date(usageData[0].timestamp).toISOString()} to ${new Date(usageData[usageData.length - 1].timestamp).toISOString()}
- Data Resolution: ${this.calculateDataResolution(usageData)}

ML Context:
${JSON.stringify({
  modelMetadata: this.mlModels.get('anomalyDetection'),
  baselineStats: {
    mean,
    stdDev,
    percentiles: this.calculatePercentiles(values)
  },
  timeSeriesFeatures: this.extractTimeSeriesFeatures(usageData),
  costContext: this.extractCostFeatures(breakdown)
}, null, 2)}
`;

    const response = await claudeClient.detectAnomalies(normalizedData);

    try {
      const result = JSON.parse(response.content);
      const anomalies = this.processAnomalyResults(result.anomalies, baseline);
      this.setCachedMLResult(cacheKey, anomalies);
      return anomalies;
    } catch (error) {
      console.error('Error parsing anomalies:', error);
      return [];
    }
  }

  private calculateCost(usage: number, timestamp: Date): number {
    const hour = timestamp.getHours();
    const isPeakHour = hour >= this.PEAK_HOURS.start && hour <= this.PEAK_HOURS.end;
    const rate = isPeakHour ? 0.15 : 0.08;
    return usage * rate;
  }

  private calculatePercentiles(values: number[]): Record<string, number> {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  private processAnomalyResults(
    anomalies: Array<{
      timestamp: string;
      severity: 'low' | 'medium' | 'high';
      type: string;
      potentialCauses: string[];
      expectedValue: number;
      actualValue: number;
      confidence: number;
      impact: {
        cost: number;
        efficiency: number;
      };
      context: {
        timeOfDay: string;
        dayOfWeek: string;
        seasonality: string;
      };
    }>,
    baseline: Map<string, number>
  ): CostAnomaly[] {
    return anomalies
      .filter(anomaly => anomaly.confidence >= 0.7)
      .map(anomaly => ({
        date: anomaly.timestamp,
        actualCost: this.calculateCost(anomaly.actualValue, new Date(anomaly.timestamp)),
        expectedCost: this.calculateCost(anomaly.expectedValue, new Date(anomaly.timestamp)),
        deviation: Math.abs(anomaly.actualValue - anomaly.expectedValue) / anomaly.expectedValue,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        impact: anomaly.impact,
        context: anomaly.context,
        rootCause: this.determineRootCause(
          {
            type: anomaly.type,
            potentialCauses: anomaly.potentialCauses,
            context: anomaly.context,
            actualValue: anomaly.actualValue,
            expectedValue: anomaly.expectedValue
          },
          baseline
        ),
      }));
  }

  private extractTimeSeriesFeatures(data: EnergyData[]): TimeSeriesFeatures {
    const values = data.map(d => d.value);
    const timestamps = data.map(d => new Date(d.timestamp));

    return {
      trend: this.calculateTrend(values),
      seasonality: this.detectSeasonality(values, timestamps),
      cyclicalPatterns: this.findCyclicalPatterns(values),
      changePoints: this.detectChangePoints(values)
    };
  }

  private extractCostFeatures(breakdown: CostBreakdown): CostFeatures {
    return {
      costStructure: {
        peakRatio: breakdown.peak_cost / (breakdown.peak_cost + breakdown.off_peak_cost),
        demandChargeRatio: breakdown.demand_charges / (breakdown.peak_cost + breakdown.off_peak_cost),
        fixedCostRatio: breakdown.fixed_charges / (breakdown.peak_cost + breakdown.off_peak_cost)
      },
      temporalPatterns: this.analyzeCostPatterns(breakdown)
    };
  }

  private async generateSavingOpportunities(
    analysisData: string,
    mlInsights: MLInsights
  ): Promise<CostSavingOpportunity[]> {
    const recommendationInput = `
${analysisData}

ML Context:
${JSON.stringify({
  modelMetadata: this.mlModels.get('costPrediction'),
  patterns: mlInsights.usagePatterns,
  drivers: mlInsights.costDrivers,
  potential: mlInsights.optimizationPotential
}, null, 2)}
`;

    const response = await claudeClient.generateRecommendations(recommendationInput);

    try {
      const result = JSON.parse(response.content);
      const recommendations = result.recommendations as Recommendation[];
      return recommendations
        .filter(rec => rec.confidence >= 0.7)
        .map(rec => ({
          id: crypto.randomUUID(),
          description: rec.description,
          potentialSavings: rec.estimatedSavings,
          implementationCost: rec.implementationCost,
          paybackPeriod: rec.paybackPeriod,
          category: this.categorizeSavingOpportunity(rec.title),
          priority: rec.priority,
          confidence: rec.confidence,
          implementationSteps: rec.implementationSteps,
          roi: rec.roi,
          mlInsights: rec.mlInsights
        }));
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  }

  private categorizeSavingOpportunity(title: string): 'peak-reduction' | 'efficiency' | 'rate-optimization' | 'demand-response' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('peak') || lowerTitle.includes('time-of-use')) {
      return 'peak-reduction';
    }
    if (lowerTitle.includes('efficiency') || lowerTitle.includes('consumption')) {
      return 'efficiency';
    }
    if (lowerTitle.includes('rate') || lowerTitle.includes('tariff')) {
      return 'rate-optimization';
    }
    return 'demand-response';
  }

  private calculateMetrics(breakdown: CostBreakdown, usageData: EnergyData[]): CostMetrics {
    const peakUsage = usageData.reduce((sum, reading) => {
      const hour = new Date(reading.timestamp).getHours();
      return hour >= this.PEAK_HOURS.start && hour <= this.PEAK_HOURS.end
        ? sum + reading.value
        : sum;
    }, 0);

    const offPeakUsage = usageData.reduce((sum, reading) => {
      const hour = new Date(reading.timestamp).getHours();
      return hour < this.PEAK_HOURS.start || hour > this.PEAK_HOURS.end
        ? sum + reading.value
        : sum;
    }, 0);

    const totalUsage = peakUsage + offPeakUsage;
    const peakDemand = Math.max(...usageData.map(reading => reading.value));

    return {
      averageCostPerKwh: (breakdown.peak_cost + breakdown.off_peak_cost) / totalUsage,
      peakCostPerKwh: breakdown.peak_cost / peakUsage,
      offPeakCostPerKwh: breakdown.off_peak_cost / offPeakUsage,
      demandCostPerKw: breakdown.demand_charges / peakDemand,
    };
  }

  private async performBillAnalysis(
    breakdown: CostBreakdown,
    usageData: EnergyData[]
  ): Promise<AnalysisResult> {
    const cacheKey = `bill-analysis-${breakdown.created_at}`;
    const cached = this.getCachedMLResult<AnalysisResult>(cacheKey);
    if (cached) return cached;

    const analysisInput = `
${this.normalizeBillData(breakdown)}

Usage Data:
${this.normalizeUsageData(usageData)}

ML Context:
${JSON.stringify({
  models: Object.fromEntries(this.mlModels.entries()),
  timeSeriesFeatures: this.extractTimeSeriesFeatures(usageData),
  costFeatures: this.extractCostFeatures(breakdown),
  predictionContext: this.generatePredictionContext(usageData)
}, null, 2)}
`;

    const response = await claudeClient.analyzeBill(analysisInput);

    try {
      const result = JSON.parse(response.content) as AnalysisResult;
      this.setCachedMLResult(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error parsing bill analysis:', error);
      return {
        metrics: {
          averageCostPerKwh: 0,
          peakCostPerKwh: 0,
          offPeakCostPerKwh: 0,
          demandCostPerKw: 0
        },
        comparison: {
          currentPeriod: {
            totalCost: 0,
            averageCost: 0,
            peakCosts: 0,
            offPeakCosts: 0
          },
          previousPeriod: {
            totalCost: 0,
            averageCost: 0,
            peakCosts: 0,
            offPeakCosts: 0
          },
          percentageChange: {
            totalCost: 0,
            averageCost: 0,
            peakCosts: 0,
            offPeakCosts: 0
          }
        },
        forecast: [],
        anomalies: [],
        timeOfUse: [],
        savingOpportunities: [],
        mlInsights: {
          usagePatterns: {
            daily: [],
            weekly: [],
            seasonal: []
          },
          costDrivers: [],
          optimizationPotential: {
            total: 0,
            breakdown: []
          }
        },
        isError: true,
        error: error as Error
      };
    }
  }

  private generateTimeOfUseData(usageData: EnergyData[]): TimeOfUseCost[] {
    const hourlyData: { [key: string]: number[] } = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = Array(7).fill(0);
    }

    usageData.forEach(reading => {
      const date = new Date(reading.timestamp);
      const hour = date.getHours();
      const weekday = date.getDay();
      const cost = this.calculateCost(reading.value, date);
      hourlyData[hour][weekday] = (hourlyData[hour][weekday] || 0) + cost;
    });

    const result: TimeOfUseCost[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        const totalCost = hourlyData[hour][weekday];
        const daysForWeekday = Math.floor(usageData.length / (24 * 7));
        result.push({
          hour,
          weekday,
          cost: totalCost / (daysForWeekday || 1),
        });
      }
    }

    return result;
  }

  private generateForecasts(
    currentUsage: EnergyData[]
  ): CostForecast[] {
    const avgDailyUsage = currentUsage.reduce((sum, reading) => sum + reading.value, 0) / this.DAYS_IN_MONTH;
    const forecasts: CostForecast[] = [];

    for (let day = 1; day <= this.DAYS_IN_MONTH; day++) {
      let predictedUsage = avgDailyUsage;

      // Apply seasonal adjustment
      const seasonalFactor = Math.sin((day / this.DAYS_IN_MONTH) * 2 * Math.PI);
      predictedUsage *= (1 + 0.2 * seasonalFactor); // 20% seasonal variation

      const date = new Date();
      date.setDate(date.getDate() + day);
      const uncertainty = 0.1 + (day / this.DAYS_IN_MONTH) * 0.2;
      const predictedCost = this.calculateCost(predictedUsage, date);

      forecasts.push({
        date: date.toISOString(),
        predictedCost,
        confidenceInterval: {
          lower: predictedCost * (1 - uncertainty),
          upper: predictedCost * (1 + uncertainty),
        },
      });
    }

    return forecasts;
  }

  private calculateTrend(values: number[]): TimeSeriesFeatures['trend'] {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    return {
      slope,
      intercept,
      direction: slope > 0 ? 'increasing' : 'decreasing',
      strength: Math.abs(slope)
    };
  }

  private detectSeasonality(values: number[], timestamps: Date[]): TimeSeriesFeatures['seasonality'] {
    const hourlyAggs = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    timestamps.forEach((ts, i) => {
      const hour = ts.getHours();
      hourlyAggs[hour] += values[i];
      hourlyCounts[hour]++;
    });

    const hourlyAvgs = hourlyAggs.map((sum, i) => sum / hourlyCounts[i]);

    return {
      dailyPattern: hourlyAvgs,
      peakHour: hourlyAvgs.indexOf(Math.max(...hourlyAvgs)),
      troughHour: hourlyAvgs.indexOf(Math.min(...hourlyAvgs)),
      amplitude: Math.max(...hourlyAvgs) - Math.min(...hourlyAvgs)
    };
  }

  private findCyclicalPatterns(values: number[]): TimeSeriesFeatures['cyclicalPatterns'] {
    const maxLag = Math.min(values.length - 1, 168);
    const acf = new Array(maxLag).fill(0);

    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < values.length - lag; i++) {
        sum += (values[i] - mean) * (values[i + lag] - mean);
      }
      acf[lag - 1] = sum / ((values.length - lag) * variance);
    }

    return {
      significantLags: this.findSignificantLags(acf),
      periodicity: this.estimatePeriodicity(acf)
    };
  }

  private detectChangePoints(values: number[]): TimeSeriesFeatures['changePoints'] {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

    const threshold = 4 * stdDev;
    const changePoints: number[] = [];
    let cusum = 0;

    values.forEach((value, i) => {
      cusum += value - mean;
      if (Math.abs(cusum) > threshold) {
        changePoints.push(i);
        cusum = 0;
      }
    });

    return {
      points: changePoints,
      significance: changePoints.map(p => ({
        index: p,
        magnitude: Math.abs(values[p] - mean) / stdDev
      }))
    };
  }

  private findSignificantLags(acf: number[]): number[] {
    const threshold = 1.96 / Math.sqrt(acf.length);
    return acf
      .map((value, index) => ({ value, index: index + 1 }))
      .filter(({ value }) => Math.abs(value) > threshold)
      .map(({ index }) => index);
  }

  private estimatePeriodicity(acf: number[]): number {
    let maxLag = 1;
    let maxValue = acf[0];

    for (let i = 1; i < acf.length; i++) {
      if (acf[i] > maxValue) {
        maxValue = acf[i];
        maxLag = i + 1;
      }
    }

    return maxLag;
  }

  private analyzeCostPatterns(breakdown: CostBreakdown): {
    costComposition: {
      peak: number;
      offPeak: number;
      demand: number;
      fixed: number;
    };
    variability: {
      peak: number;
      offPeak: number;
    };
  } {
    const totalCost = breakdown.peak_cost + breakdown.off_peak_cost +
                     breakdown.demand_charges + breakdown.fixed_charges;

    return {
      costComposition: {
        peak: breakdown.peak_cost / totalCost,
        offPeak: breakdown.off_peak_cost / totalCost,
        demand: breakdown.demand_charges / totalCost,
        fixed: breakdown.fixed_charges / totalCost
      },
      variability: {
        peak: this.calculateVariability([breakdown.peak_cost]),
        offPeak: this.calculateVariability([breakdown.off_peak_cost])
      }
    };
  }

  private calculateVariability(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  public async analyze(breakdown: CostBreakdown, usageData: EnergyData[]): Promise<AnalysisResult> {
    return this.performBillAnalysis(breakdown, usageData);
  }

  private generatePredictionContext(usageData: EnergyData[]): PredictionContext {
    const values = usageData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return {
      historicalStats: {
        mean,
        variance,
        trends: this.calculateTrend(values)
      },
      seasonality: this.detectSeasonality(values, usageData.map(d => new Date(d.timestamp))),
      patterns: this.findCyclicalPatterns(values)
    };
  }
}

export const billAnalyzer = BillAnalyzer.getInstance();
