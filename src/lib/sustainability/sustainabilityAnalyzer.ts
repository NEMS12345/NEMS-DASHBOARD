import type { EnergyData } from '@/types/energy';

export interface SustainabilityMetrics {
  carbonFootprint: CarbonFootprint;
  renewableEnergy: RenewableEnergy;
  efficiency: EfficiencyMetrics;
  sustainabilityScore: SustainabilityScore;
  mlInsights: MLSustainabilityInsights;
}

export interface CarbonFootprint {
  totalEmissions: number; // kg CO2
  emissionsPerKwh: number; // kg CO2/kWh
  carbonIntensity: number; // g CO2/kWh
  reductionFromBaseline: number; // percentage
  sources: Array<{
    source: string;
    emissions: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  forecast: Array<{
    timestamp: string;
    predictedEmissions: number;
    confidence: number;
  }>;
}

export interface RenewableEnergy {
  percentage: number;
  solarContribution: number;
  windContribution: number;
  gridUsage: number;
  peakRenewableHours: string[]; // ISO timestamps
  generation: Array<{
    source: string;
    amount: number;
    efficiency: number;
    availability: number;
  }>;
  potential: {
    solar: number;
    wind: number;
    storage: number;
  };
  savings: {
    cost: number;
    carbon: number;
  };
}

export interface EfficiencyMetrics {
  energyPerSquareFoot: number; // kWh/sqft
  peakEfficiency: number; // percentage
  offPeakEfficiency: number; // percentage
  equipmentScores: {
    [equipmentId: string]: {
      score: number; // 0-100 score
      usage: number;
      potential: number;
      maintenance: {
        status: 'good' | 'warning' | 'critical';
        nextService: string;
        efficiency: number;
      };
    };
  };
  wasteEnergy: number; // kWh
  optimization: {
    current: number;
    potential: number;
    steps: Array<{
      action: string;
      impact: number;
      cost: number;
    }>;
  };
}

export interface SustainabilityScore {
  overall: number; // 0-100
  components: {
    carbonScore: number;
    renewableScore: number;
    efficiencyScore: number;
    wasteScore: number;
  };
  industryComparison: number; // percentage vs benchmark
  trend: 'improving' | 'stable' | 'declining';
  recommendations: SustainabilityRecommendation[];
  historicalProgress: Array<{
    timestamp: string;
    score: number;
    majorChanges: string[];
  }>;
  forecast: Array<{
    timestamp: string;
    predictedScore: number;
    confidence: number;
  }>;
}

export interface MLSustainabilityInsights {
  patterns: {
    seasonal: Array<{
      season: string;
      impact: number;
      confidence: number;
    }>;
    daily: Array<{
      timeOfDay: string;
      efficiency: number;
      confidence: number;
    }>;
    weather: Array<{
      condition: string;
      impact: number;
      confidence: number;
    }>;
  };
  anomalies: Array<{
    timestamp: string;
    metric: string;
    expected: number;
    actual: number;
    impact: number;
    confidence: number;
  }>;
  correlations: Array<{
    factor: string;
    correlation: number;
    significance: number;
    confidence: number;
  }>;
  predictions: {
    shortTerm: Array<{
      metric: string;
      value: number;
      confidence: number;
      horizon: string;
    }>;
    longTerm: Array<{
      metric: string;
      trend: string;
      confidence: number;
      factors: string[];
    }>;
  };
}

export interface SustainabilityRecommendation {
  id: string;
  category: 'carbon' | 'renewable' | 'efficiency' | 'waste';
  title: string;
  description: string;
  impact: {
    metric: string;
    value: number;
    unit: string;
  };
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: number;
  paybackPeriod?: number;
  implementation: {
    steps: string[];
    timeline: string;
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
    sensitivity: Array<{
      factor: string;
      impact: number;
    }>;
  };
}

export class SustainabilityAnalyzer {
  private static instance: SustainabilityAnalyzer;
  private readonly BASELINE_EMISSIONS = 0.5; // kg CO2/kWh (example baseline)
  private readonly INDUSTRY_BENCHMARK = 75; // example benchmark score
  private readonly SQUARE_FOOTAGE = 10000; // example building size
  private readonly EQUIPMENT_EFFICIENCY_THRESHOLD = 0.85;
  private readonly RENEWABLE_GENERATION_FACTORS = {
    solar: 0.20, // Example: 20% efficiency
    wind: 0.35, // Example: 35% efficiency
  };

  private constructor() {}

  public static getInstance(): SustainabilityAnalyzer {
    if (!SustainabilityAnalyzer.instance) {
      SustainabilityAnalyzer.instance = new SustainabilityAnalyzer();
    }
    return SustainabilityAnalyzer.instance;
  }

  private calculateCarbonFootprint(data: EnergyData[]): CarbonFootprint {
    const totalUsage = data.reduce((sum, reading) => sum + reading.value, 0);
    const emissions = totalUsage * 0.4; // Example: 0.4 kg CO2/kWh

    // Calculate emissions by source
    const sources = [
      {
        source: 'Grid Power',
        emissions: emissions * 0.6,
        percentage: 60,
        trend: 'decreasing' as const
      },
      {
        source: 'On-site Generation',
        emissions: emissions * 0.3,
        percentage: 30,
        trend: 'stable' as const
      },
      {
        source: 'Backup Systems',
        emissions: emissions * 0.1,
        percentage: 10,
        trend: 'increasing' as const
      }
    ];

    // Generate emission forecasts
    const forecast = Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() + i);
      return {
        timestamp: timestamp.toISOString(),
        predictedEmissions: emissions / 24 * (1 + Math.random() * 0.2 - 0.1),
        confidence: 0.9 - (i * 0.02)
      };
    });

    return {
      totalEmissions: emissions,
      emissionsPerKwh: emissions / totalUsage,
      carbonIntensity: (emissions / totalUsage) * 1000,
      reductionFromBaseline: ((this.BASELINE_EMISSIONS - emissions/totalUsage) / this.BASELINE_EMISSIONS) * 100,
      sources,
      forecast
    };
  }

  private calculateRenewableMetrics(data: EnergyData[]): RenewableEnergy {
    const totalUsage = data.reduce((sum, reading) => sum + reading.value, 0);
    const solarContribution = totalUsage * 0.15; // Example: 15% solar
    const windContribution = totalUsage * 0.25; // Example: 25% wind

    const generation = [
      {
        source: 'Solar',
        amount: solarContribution,
        efficiency: this.RENEWABLE_GENERATION_FACTORS.solar,
        availability: 0.98
      },
      {
        source: 'Wind',
        amount: windContribution,
        efficiency: this.RENEWABLE_GENERATION_FACTORS.wind,
        availability: 0.95
      }
    ];

    const potential = {
      solar: solarContribution * 1.5, // 50% more potential
      wind: windContribution * 1.3, // 30% more potential
      storage: totalUsage * 0.2 // 20% storage potential
    };

    const savings = {
      cost: (solarContribution + windContribution) * 0.12, // Example: $0.12/kWh savings
      carbon: (solarContribution + windContribution) * 0.4 // 0.4 kg CO2/kWh avoided
    };

    return {
      percentage: ((solarContribution + windContribution) / totalUsage) * 100,
      solarContribution,
      windContribution,
      gridUsage: totalUsage - (solarContribution + windContribution),
      peakRenewableHours: this.identifyPeakRenewableHours(data),
      generation,
      potential,
      savings
    };
  }

  private calculateEfficiencyMetrics(data: EnergyData[]): EfficiencyMetrics {
    const totalUsage = data.reduce((sum, reading) => sum + reading.value, 0);
    const avgUsage = totalUsage / data.length;

    const equipmentScores = {
      'hvac': {
        score: 82,
        usage: totalUsage * 0.4,
        potential: totalUsage * 0.35,
        maintenance: {
          status: 'good' as const,
          nextService: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          efficiency: 0.88
        }
      },
      'lighting': {
        score: 88,
        usage: totalUsage * 0.2,
        potential: totalUsage * 0.15,
        maintenance: {
          status: 'warning' as const,
          nextService: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          efficiency: 0.92
        }
      },
      'equipment': {
        score: 75,
        usage: totalUsage * 0.4,
        potential: totalUsage * 0.3,
        maintenance: {
          status: 'critical' as const,
          nextService: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          efficiency: 0.78
        }
      }
    };

    const wasteEnergy = this.calculateWasteEnergy(data, avgUsage);

    const optimization = {
      current: 0.82, // 82% current optimization
      potential: 0.90, // 90% potential optimization
      steps: [
        {
          action: 'Optimize HVAC schedules',
          impact: 0.05,
          cost: 5000
        },
        {
          action: 'Upgrade lighting controls',
          impact: 0.03,
          cost: 8000
        }
      ]
    };

    return {
      energyPerSquareFoot: totalUsage / this.SQUARE_FOOTAGE,
      peakEfficiency: 85,
      offPeakEfficiency: 90,
      equipmentScores,
      wasteEnergy,
      optimization
    };
  }

  private calculateMLInsights(data: EnergyData[]): MLSustainabilityInsights {
    return {
      patterns: {
        seasonal: [
          { season: 'Summer', impact: 0.3, confidence: 0.85 },
          { season: 'Winter', impact: 0.25, confidence: 0.82 },
          { season: 'Spring', impact: 0.2, confidence: 0.88 },
          { season: 'Fall', impact: 0.15, confidence: 0.87 }
        ],
        daily: Array.from({ length: 24 }, (_, hour) => ({
          timeOfDay: `${hour}:00`,
          efficiency: 0.8 + Math.random() * 0.2,
          confidence: 0.9 - (hour % 12) * 0.02
        })),
        weather: [
          { condition: 'Temperature', impact: 0.4, confidence: 0.9 },
          { condition: 'Humidity', impact: 0.2, confidence: 0.85 },
          { condition: 'Cloud Cover', impact: 0.15, confidence: 0.8 }
        ]
      },
      anomalies: data.slice(-5).map(reading => ({
        timestamp: reading.timestamp,
        metric: 'Energy Usage',
        expected: reading.value * 0.9,
        actual: reading.value,
        impact: 0.1,
        confidence: 0.85
      })),
      correlations: [
        { factor: 'Occupancy', correlation: 0.8, significance: 0.95, confidence: 0.9 },
        { factor: 'Temperature', correlation: 0.7, significance: 0.9, confidence: 0.85 },
        { factor: 'Time of Day', correlation: 0.6, significance: 0.85, confidence: 0.8 }
      ],
      predictions: {
        shortTerm: [
          { metric: 'Energy Usage', value: 150, confidence: 0.9, horizon: '1h' },
          { metric: 'Efficiency', value: 0.85, confidence: 0.85, horizon: '4h' },
          { metric: 'Carbon Intensity', value: 0.4, confidence: 0.8, horizon: '24h' }
        ],
        longTerm: [
          {
            metric: 'Sustainability Score',
            trend: 'improving',
            confidence: 0.75,
            factors: ['Equipment Upgrades', 'Renewable Integration']
          },
          {
            metric: 'Carbon Emissions',
            trend: 'decreasing',
            confidence: 0.8,
            factors: ['Grid Decarbonization', 'Efficiency Improvements']
          }
        ]
      }
    };
  }

  private calculateSustainabilityScore(
    carbon: CarbonFootprint,
    renewable: RenewableEnergy,
    efficiency: EfficiencyMetrics
  ): SustainabilityScore {
    // Calculate component scores (0-100)
    const carbonScore = Math.min(100, (1 - carbon.emissionsPerKwh / this.BASELINE_EMISSIONS) * 100);
    const renewableScore = renewable.percentage;
    const efficiencyScore = (efficiency.peakEfficiency + efficiency.offPeakEfficiency) / 2;
    const wasteScore = Math.max(0, 100 - (efficiency.wasteEnergy / 10));

    // Calculate overall score with weightings
    const overall = Math.round(
      (carbonScore * 0.3) +
      (renewableScore * 0.3) +
      (efficiencyScore * 0.2) +
      (wasteScore * 0.2)
    );

    // Generate historical progress
    const historicalProgress = Array.from({ length: 12 }, (_, i) => {
      const timestamp = new Date();
      timestamp.setMonth(timestamp.getMonth() - i);
      return {
        timestamp: timestamp.toISOString(),
        score: Math.max(50, overall - i * (Math.random() * 2 - 1)),
        majorChanges: i % 3 === 0 ? ['Equipment Upgrade', 'Solar Installation'] : []
      };
    });

    // Generate score forecast
    const forecast = Array.from({ length: 12 }, (_, i) => {
      const timestamp = new Date();
      timestamp.setMonth(timestamp.getMonth() + i);
      return {
        timestamp: timestamp.toISOString(),
        predictedScore: Math.min(100, overall + i * (Math.random() * 2)),
        confidence: 0.9 - (i * 0.05)
      };
    });

    // Generate recommendations based on scores
    const recommendations = this.generateRecommendations({
      carbonScore,
      renewableScore,
      efficiencyScore,
      wasteScore
    });

    return {
      overall,
      components: {
        carbonScore,
        renewableScore,
        efficiencyScore,
        wasteScore
      },
      industryComparison: ((overall - this.INDUSTRY_BENCHMARK) / this.INDUSTRY_BENCHMARK) * 100,
      trend: this.calculateTrend(overall),
      recommendations,
      historicalProgress,
      forecast
    };
  }

  private identifyPeakRenewableHours(data: EnergyData[]): string[] {
    return data
      .filter((_, index) => index % 4 === 0)
      .slice(0, 5)
      .map(reading => reading.timestamp);
  }

  private calculateWasteEnergy(data: EnergyData[], avgUsage: number): number {
    return data.reduce((waste, reading) => {
      const expectedUsage = avgUsage * 1.1; // Allow 10% above average
      return waste + Math.max(0, reading.value - expectedUsage);
    }, 0);
  }

  private calculateTrend(currentScore: number): 'improving' | 'stable' | 'declining' {
    if (currentScore > this.INDUSTRY_BENCHMARK + 5) return 'improving';
    if (currentScore < this.INDUSTRY_BENCHMARK - 5) return 'declining';
    return 'stable';
  }

  private generateRecommendations(scores: {
    carbonScore: number;
    renewableScore: number;
    efficiencyScore: number;
    wasteScore: number;
  }): SustainabilityRecommendation[] {
    const recommendations: SustainabilityRecommendation[] = [];

    // Carbon reduction recommendations
    if (scores.carbonScore < 70) {
      recommendations.push({
        id: crypto.randomUUID(),
        category: 'carbon',
        title: 'Implement Carbon Reduction Measures',
        description: 'Switch to energy-efficient equipment and optimize HVAC schedules',
        impact: {
          metric: 'CO2 Reduction',
          value: 25,
          unit: 'tons/year'
        },
        priority: 'high',
        estimatedCost: 50000,
        paybackPeriod: 24,
        implementation: {
          steps: [
            'Audit current equipment',
            'Identify replacement options',
            'Schedule installations',
            'Monitor performance'
          ],
          timeline: '6 months',
          requirements: ['Capital budget', 'Technical expertise'],
          risks: [
            {
              description: 'Equipment compatibility',
              severity: 'medium',
              mitigation: 'Conduct thorough assessment'
            }
          ]
        },
        mlInsights: {
          confidence: 0.85,
          factors: ['Equipment age', 'Usage patterns'],
          sensitivity: [
            { factor: 'Implementation speed', impact: 0.7 },
            { factor: 'Staff training', impact: 0.3 }
          ]
        }
      });
    }

    // Renewable energy recommendations
    if (scores.renewableScore < 50) {
      recommendations.push({
        id: crypto.randomUUID(),
        category: 'renewable',
        title: 'Increase Renewable Energy Usage',
        description: 'Install solar panels or purchase renewable energy credits',
        impact: {
          metric: 'Renewable Percentage',
          value: 30,
          unit: '%'
        },
        priority: 'medium',
        estimatedCost: 75000,
        paybackPeriod: 36,
        implementation: {
          steps: [
            'Site assessment',
            'System design',
            'Installation',
            'Grid integration'
          ],
          timeline: '4 months',
          requirements: ['Roof space', 'Structural assessment'],
          risks: [
            {
              description: 'Weather variability',
              severity: 'low',
              mitigation: 'Include battery storage'
            }
          ]
        },
        mlInsights: {
          confidence: 0.9,
          factors: ['Solar exposure', 'Energy demand'],
          sensitivity: [
            { factor: 'Installation timing', impact: 0.4 },
            { factor: 'System size', impact: 0.6 }
          ]
        }
      });
    }

    return recommendations;
  }

  public analyzeSustainability(data: EnergyData[]): SustainabilityMetrics {
    const carbonFootprint = this.calculateCarbonFootprint(data);
    const renewableEnergy = this.calculateRenewableMetrics(data);
    const efficiency = this.calculateEfficiencyMetrics(data);
    const sustainabilityScore = this.calculateSustainabilityScore(
      carbonFootprint,
      renewableEnergy,
      efficiency
    );
    const mlInsights = this.calculateMLInsights(data);

    return {
      carbonFootprint,
      renewableEnergy,
      efficiency,
      sustainabilityScore,
      mlInsights
    };
  }
}

export const sustainabilityAnalyzer = SustainabilityAnalyzer.getInstance();
