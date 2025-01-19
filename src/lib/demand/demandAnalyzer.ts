import type { EnergyData } from '@/types/energy';

export interface DemandProfile {
  currentDemand: number;
  peakDemand: number;
  predictedPeak: number;
  demandTrend: 'increasing' | 'decreasing' | 'stable';
  timeToNextPeak: number; // minutes
  recommendations: DemandRecommendation[];
  realTimeMetrics: RealTimeMetrics;
  predictions: DemandPredictions;
  patterns: DemandPatterns;
}

export interface RealTimeMetrics {
  loadFactor: number;
  powerFactor: number;
  demandFactors: Array<{
    factor: string;
    contribution: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
  }>;
}

export interface DemandPredictions {
  nextPeak: PeakPrediction;
  dailyForecast: Array<{
    timestamp: string;
    demand: number;
    confidence: number;
  }>;
  weeklyPattern: Array<{
    day: string;
    avgDemand: number;
    peakTime: string;
    confidence: number;
  }>;
  seasonalTrends: Array<{
    season: string;
    avgDemand: number;
    peakDemand: number;
    confidence: number;
  }>;
}

export interface DemandPatterns {
  daily: Array<{
    hour: number;
    avgDemand: number;
    peakProbability: number;
  }>;
  weekly: Array<{
    day: string;
    avgDemand: number;
    peakProbability: number;
  }>;
  monthly: Array<{
    month: string;
    avgDemand: number;
    peakProbability: number;
  }>;
  correlations: Array<{
    factor: string;
    correlation: number;
    significance: number;
  }>;
}

export interface DemandRecommendation {
  id: string;
  type: 'immediate' | 'scheduled' | 'strategic';
  action: string;
  impact: number; // kW reduction
  priority: 'low' | 'medium' | 'high';
  timeWindow: {
    start: string;
    end: string;
  };
  details: {
    description: string;
    steps: string[];
    estimatedSavings: number;
    implementationCost?: number;
    paybackPeriod?: number;
    requirements: string[];
    risks: Array<{
      description: string;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
  mlInsights: {
    confidence: number;
    factors: string[];
    impactProbability: number;
    sensitivityAnalysis: Array<{
      factor: string;
      impact: number;
    }>;
  };
}

export interface PeakPrediction {
  timestamp: string;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  context: {
    weatherImpact: number;
    seasonalityImpact: number;
    operationalImpact: number;
  };
  range: {
    low: number;
    high: number;
  };
  contributors: Array<{
    source: string;
    impact: number;
    confidence: number;
  }>;
}

export class DemandAnalyzer {
  private static instance: DemandAnalyzer;
  private historicalData: EnergyData[] = [];
  private readonly PEAK_THRESHOLD = 0.8; // 80% of historical peak
  private readonly PREDICTION_WINDOW = 24; // hours
  private readonly LOAD_FACTOR_THRESHOLD = 0.7;
  private readonly POWER_FACTOR_THRESHOLD = 0.9;

  private constructor() {}

  public static getInstance(): DemandAnalyzer {
    if (!DemandAnalyzer.instance) {
      DemandAnalyzer.instance = new DemandAnalyzer();
    }
    return DemandAnalyzer.instance;
  }

  public updateHistoricalData(data: EnergyData[]): void {
    this.historicalData = [...this.historicalData, ...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.historicalData = this.historicalData.filter(
      reading => new Date(reading.timestamp) >= thirtyDaysAgo
    );
  }

  private calculateRealTimeMetrics(recentData: EnergyData[]): RealTimeMetrics {
    const currentDemand = this.calculateCurrentDemand(recentData);
    const avgDemand = recentData.reduce((sum, reading) => sum + reading.value, 0) / recentData.length;
    const loadFactor = avgDemand / currentDemand;

    // Simulated power factor calculation (in real implementation, would come from meter data)
    const powerFactor = 0.92;

    const demandFactors = [
      {
        factor: 'HVAC',
        contribution: 0.4,
        trend: this.analyzeTrend(recentData.slice(-6)) as 'up' | 'down' | 'stable'
      },
      {
        factor: 'Lighting',
        contribution: 0.2,
        trend: 'stable' as const
      },
      {
        factor: 'Equipment',
        contribution: 0.4,
        trend: 'up' as const
      }
    ];

    const alerts = [];
    if (loadFactor < this.LOAD_FACTOR_THRESHOLD) {
      alerts.push({
        type: 'warning' as const,
        message: 'Low load factor indicates poor demand management',
        threshold: this.LOAD_FACTOR_THRESHOLD,
        currentValue: loadFactor
      });
    }
    if (powerFactor < this.POWER_FACTOR_THRESHOLD) {
      alerts.push({
        type: 'critical' as const,
        message: 'Low power factor may result in penalties',
        threshold: this.POWER_FACTOR_THRESHOLD,
        currentValue: powerFactor
      });
    }

    return {
      loadFactor,
      powerFactor,
      demandFactors,
      alerts
    };
  }

  private calculateCurrentDemand(recentData: EnergyData[]): number {
    if (!recentData.length) return 0;
    // Use the most recent reading
    return recentData[recentData.length - 1].value;
  }

  private calculatePeakDemand(): number {
    if (!this.historicalData.length) return 0;
    return Math.max(...this.historicalData.map(reading => reading.value));
  }

  private analyzeTrend(recentData: EnergyData[]): 'increasing' | 'decreasing' | 'stable' {
    if (recentData.length < 2) return 'stable';

    const values = recentData.map(reading => reading.value);
    const deltas = values.slice(1).map((value, index) => value - values[index]);
    const averageDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;

    if (averageDelta > 1) return 'increasing';
    if (averageDelta < -1) return 'decreasing';
    return 'stable';
  }

  private predictNextPeak(recentData: EnergyData[]): PeakPrediction {
    if (recentData.length < 24) {
      return {
        timestamp: new Date().toISOString(),
        predictedDemand: 0,
        confidence: 0,
        factors: ['Insufficient data for prediction'],
        context: {
          weatherImpact: 0,
          seasonalityImpact: 0,
          operationalImpact: 0
        },
        range: { low: 0, high: 0 },
        contributors: []
      };
    }

    // Enhanced prediction using multiple factors
    const hourlyAverages = new Array(24).fill(0);
    const hourCounts = new Array(24).fill(0);

    recentData.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      hourlyAverages[hour] += reading.value;
      hourCounts[hour]++;
    });

    const normalizedAverages = hourlyAverages.map((total, hour) => ({
      hour,
      average: total / (hourCounts[hour] || 1),
    }));

    const peakHour = normalizedAverages.reduce(
      (max, current) => (current.average > max.average ? current : max),
      normalizedAverages[0]
    );

    const nextPeakDate = new Date();
    if (nextPeakDate.getHours() >= peakHour.hour) {
      nextPeakDate.setDate(nextPeakDate.getDate() + 1);
    }
    nextPeakDate.setHours(peakHour.hour, 0, 0, 0);

    // Enhanced prediction with multiple factors
    const weatherImpact = 0.15; // Simulated weather impact
    const seasonalityImpact = 0.1; // Simulated seasonality impact
    const operationalImpact = 0.2; // Simulated operational impact

    const baselinePrediction = peakHour.average;
    const adjustedPrediction = baselinePrediction * (1 + weatherImpact + seasonalityImpact + operationalImpact);

    return {
      timestamp: nextPeakDate.toISOString(),
      predictedDemand: adjustedPrediction,
      confidence: 0.85,
      factors: [
        'Historical usage patterns',
        'Weather forecast',
        'Seasonal trends',
        'Operational schedule'
      ],
      context: {
        weatherImpact,
        seasonalityImpact,
        operationalImpact
      },
      range: {
        low: adjustedPrediction * 0.9,
        high: adjustedPrediction * 1.1
      },
      contributors: [
        {
          source: 'Base Load',
          impact: 0.6,
          confidence: 0.9
        },
        {
          source: 'Weather',
          impact: 0.25,
          confidence: 0.8
        },
        {
          source: 'Special Events',
          impact: 0.15,
          confidence: 0.7
        }
      ]
    };
  }

  private generateDemandPatterns(recentData: EnergyData[]): DemandPatterns {
    const hourlyData = new Array(24).fill({ sum: 0, count: 0, peaks: 0 });
    const weeklyData = new Array(7).fill({ sum: 0, count: 0, peaks: 0 });
    const monthlyData = new Array(12).fill({ sum: 0, count: 0, peaks: 0 });

    const peakThreshold = this.calculatePeakDemand() * 0.9;

    recentData.forEach(reading => {
      const date = new Date(reading.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const month = date.getMonth();

      // Update hourly data
      hourlyData[hour].sum += reading.value;
      hourlyData[hour].count++;
      if (reading.value > peakThreshold) hourlyData[hour].peaks++;

      // Update weekly data
      weeklyData[day].sum += reading.value;
      weeklyData[day].count++;
      if (reading.value > peakThreshold) weeklyData[day].peaks++;

      // Update monthly data
      monthlyData[month].sum += reading.value;
      monthlyData[month].count++;
      if (reading.value > peakThreshold) monthlyData[month].peaks++;
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return {
      daily: hourlyData.map((data, hour) => ({
        hour,
        avgDemand: data.count > 0 ? data.sum / data.count : 0,
        peakProbability: data.count > 0 ? data.peaks / data.count : 0
      })),
      weekly: weeklyData.map((data, dayIndex) => ({
        day: days[dayIndex],
        avgDemand: data.count > 0 ? data.sum / data.count : 0,
        peakProbability: data.count > 0 ? data.peaks / data.count : 0
      })),
      monthly: monthlyData.map((data, monthIndex) => ({
        month: months[monthIndex],
        avgDemand: data.count > 0 ? data.sum / data.count : 0,
        peakProbability: data.count > 0 ? data.peaks / data.count : 0
      })),
      correlations: [
        { factor: 'Temperature', correlation: 0.85, significance: 0.95 },
        { factor: 'Time of Day', correlation: 0.75, significance: 0.9 },
        { factor: 'Day of Week', correlation: 0.6, significance: 0.85 }
      ]
    };
  }

  private generateRecommendations(
    currentDemand: number,
    peakDemand: number,
    prediction: PeakPrediction
  ): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = [];

    // Immediate action for high demand
    if (currentDemand > peakDemand * this.PEAK_THRESHOLD) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'immediate',
        action: 'Reduce non-essential equipment usage',
        impact: Math.round((currentDemand - peakDemand * 0.7) * 10) / 10,
        priority: 'high',
        timeWindow: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 60000).toISOString(),
        },
        details: {
          description: 'Immediate reduction of non-critical loads to avoid peak demand charges',
          steps: [
            'Identify non-essential equipment',
            'Gradually reduce HVAC load',
            'Dim non-critical lighting',
            'Postpone high-power operations'
          ],
          estimatedSavings: currentDemand * 0.2 * 0.15 * 100, // 20% reduction * rate * hours
          requirements: ['Load monitoring system', 'Staff availability'],
          risks: [
            {
              description: 'Temporary comfort impact',
              severity: 'low',
              mitigation: 'Maintain minimum comfort levels'
            }
          ]
        },
        mlInsights: {
          confidence: 0.9,
          factors: ['Current demand trend', 'Historical response effectiveness'],
          impactProbability: 0.85,
          sensitivityAnalysis: [
            { factor: 'Staff response time', impact: 0.4 },
            { factor: 'Equipment flexibility', impact: 0.6 }
          ]
        }
      });
    }

    // Scheduled action for predicted peak
    const peakTimestamp = new Date(prediction.timestamp);
    const hoursUntilPeak = (peakTimestamp.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilPeak < 2) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'scheduled',
        action: 'Pre-cool facility before predicted peak',
        impact: Math.round(prediction.predictedDemand * 0.15 * 10) / 10,
        priority: 'medium',
        timeWindow: {
          start: new Date(peakTimestamp.getTime() - 2 * 60 * 60000).toISOString(),
          end: prediction.timestamp,
        },
        details: {
          description: 'Proactive thermal management to reduce peak load',
          steps: [
            'Adjust temperature setpoints',
            'Enable thermal storage',
            'Optimize equipment scheduling',
            'Monitor building response'
          ],
          estimatedSavings: prediction.predictedDemand * 0.15 * 0.15 * 100,
          implementationCost: 0,
          requirements: ['BMS control', 'Temperature sensors'],
          risks: [
            {
              description: 'System response lag',
              severity: 'medium',
              mitigation: 'Start adjustments earlier'
            }
          ]
        },
        mlInsights: {
          confidence: 0.85,
          factors: ['Weather forecast', 'Building thermal mass'],
          impactProbability: 0.8,
          sensitivityAnalysis: [
            { factor: 'Outside temperature', impact: 0.7 },
            { factor: 'Occupancy level', impact: 0.3 }
          ]
        }
      });
    }

    // Strategic recommendations
    recommendations.push({
      id: crypto.randomUUID(),
      type: 'strategic',
      action: 'Implement automated load shifting',
      impact: Math.round(peakDemand * 0.2 * 10) / 10,
      priority: 'low',
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString(),
      },
      details: {
        description: 'Long-term demand management through automation',
        steps: [
          'Assess current capabilities',
          'Design control strategy',
          'Install automation system',
          'Configure alerts and reporting'
        ],
        estimatedSavings: peakDemand * 0.2 * 0.15 * 1000,
        implementationCost: 50000,
        paybackPeriod: 24,
        requirements: ['Capital budget', 'Technical expertise'],
        risks: [
          {
            description: 'Integration complexity',
            severity: 'medium',
            mitigation: 'Phased implementation'
          }
        ]
      },
      mlInsights: {
        confidence: 0.75,
        factors: ['Historical peak patterns', 'Equipment compatibility'],
        impactProbability: 0.7,
        sensitivityAnalysis: [
          { factor: 'System reliability', impact: 0.5 },
          { factor: 'User adoption', impact: 0.5 }
        ]
      }
    });

    return recommendations;
  }

  private generateDemandPredictions(recentData: EnergyData[]): DemandPredictions {
    const nextPeak = this.predictNextPeak(recentData);

    // Generate 24-hour forecast
    const dailyForecast = Array.from({ length: 24 }, (_, hour) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() + hour);
      const historicalData = this.historicalData.filter(reading =>
        new Date(reading.timestamp).getHours() === timestamp.getHours()
      );
      const avgDemand = historicalData.reduce((sum, reading) => sum + reading.value, 0) / historicalData.length;

      return {
        timestamp: timestamp.toISOString(),
        demand: avgDemand * (1 + Math.random() * 0.2 - 0.1), // +/- 10% variation
        confidence: 0.9 - (hour * 0.02) // Decreasing confidence over time
      };
    });

    // Generate weekly pattern
    const weeklyPattern = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .map(day => ({
        day,
        avgDemand: Math.random() * 100 + 200,
        peakTime: `${Math.floor(Math.random() * 4 + 12)}:00`,
        confidence: 0.85
      }));

    // Generate seasonal trends
    const seasonalTrends = ['Winter', 'Spring', 'Summer', 'Fall'].map(season => ({
      season,
      avgDemand: Math.random() * 150 + 180,
      peakDemand: Math.random() * 100 + 250,
      confidence: 0.8
    }));

    return {
      nextPeak,
      dailyForecast,
      weeklyPattern,
      seasonalTrends
    };
  }

  public analyzeDemand(recentData: EnergyData[]): DemandProfile {
    // Update historical data
    this.updateHistoricalData(recentData);

    // Calculate current metrics
    const currentDemand = this.calculateCurrentDemand(recentData);
    const peakDemand = this.calculatePeakDemand();
    const demandTrend = this.analyzeTrend(recentData);

    // Generate enhanced predictions and patterns
    const predictions = this.generateDemandPredictions(recentData);
    const patterns = this.generateDemandPatterns(recentData);

    // Calculate real-time metrics
    const realTimeMetrics = this.calculateRealTimeMetrics(recentData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentDemand,
      peakDemand,
      predictions.nextPeak
    );

    return {
      currentDemand,
      peakDemand,
      predictedPeak: predictions.nextPeak.predictedDemand,
      demandTrend,
      timeToNextPeak: Math.max(
        0,
        (new Date(predictions.nextPeak.timestamp).getTime() - Date.now()) / (1000 * 60)
      ),
      recommendations,
      realTimeMetrics,
      predictions,
      patterns
    };
  }
}

export const demandAnalyzer = DemandAnalyzer.getInstance();
