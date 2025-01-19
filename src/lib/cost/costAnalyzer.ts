import type { EnergyData } from '@/types/energy';
import type {
  CostBreakdown,
  CostMetrics,
  CostComparison,
  CostForecast,
  CostAnomaly,
  TimeOfUseCost,
  CostSavingOpportunity,
  MLInsights
} from '@/types/cost-analysis';

export class CostAnalyzer {
  private static instance: CostAnalyzer;
  private readonly PEAK_RATE = 0.15; // Example: $0.15/kWh during peak
  private readonly OFF_PEAK_RATE = 0.08; // Example: $0.08/kWh during off-peak
  private readonly DEMAND_CHARGE_RATE = 10.00; // Example: $10/kW
  private readonly FIXED_CHARGE = 50.00; // Example: $50 fixed monthly charge
  private readonly TAX_RATE = 0.08; // Example: 8% tax rate

  private constructor() {}

  public static getInstance(): CostAnalyzer {
    if (!CostAnalyzer.instance) {
      CostAnalyzer.instance = new CostAnalyzer();
    }
    return CostAnalyzer.instance;
  }

  private isPeakHour(hour: number): boolean {
    // Example: Peak hours are 9am-5pm (9-17)
    return hour >= 9 && hour <= 17;
  }

  private calculateBreakdown(data: EnergyData[]): CostBreakdown {
    let peakCost = 0;
    let offPeakCost = 0;
    let peakDemand = 0;

    data.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      if (this.isPeakHour(hour)) {
        peakCost += reading.value * this.PEAK_RATE;
        peakDemand = Math.max(peakDemand, reading.value);
      } else {
        offPeakCost += reading.value * this.OFF_PEAK_RATE;
      }
    });

    const demandCharges = peakDemand * this.DEMAND_CHARGE_RATE;
    const subtotal = peakCost + offPeakCost + demandCharges + this.FIXED_CHARGE;
    const taxes = subtotal * this.TAX_RATE;

    return {
      id: crypto.randomUUID(),
      energy_data_id: '',
      peak_cost: peakCost,
      off_peak_cost: offPeakCost,
      demand_charges: demandCharges,
      fixed_charges: this.FIXED_CHARGE,
      taxes,
      other_charges: 0,
      created_at: new Date().toISOString(),
    };
  }

  private calculateMetrics(breakdown: CostBreakdown, totalKwh: number, peakKwh: number): CostMetrics {
    return {
      averageCostPerKwh: (breakdown.peak_cost + breakdown.off_peak_cost) / totalKwh,
      peakCostPerKwh: breakdown.peak_cost / peakKwh,
      offPeakCostPerKwh: breakdown.off_peak_cost / (totalKwh - peakKwh),
      demandCostPerKw: breakdown.demand_charges / (peakKwh / this.PEAK_RATE),
    };
  }

  private calculateComparison(
    currentData: EnergyData[],
    previousData: EnergyData[]
  ): CostComparison {
    const currentBreakdown = this.calculateBreakdown(currentData);
    const previousBreakdown = this.calculateBreakdown(previousData);

    const currentTotal = currentBreakdown.peak_cost + currentBreakdown.off_peak_cost;
    const previousTotal = previousBreakdown.peak_cost + previousBreakdown.off_peak_cost;

    const currentAvg = currentTotal / currentData.length;
    const previousAvg = previousTotal / previousData.length;

    return {
      currentPeriod: {
        totalCost: currentTotal,
        averageCost: currentAvg,
        peakCosts: currentBreakdown.peak_cost,
        offPeakCosts: currentBreakdown.off_peak_cost,
      },
      previousPeriod: {
        totalCost: previousTotal,
        averageCost: previousAvg,
        peakCosts: previousBreakdown.peak_cost,
        offPeakCosts: previousBreakdown.off_peak_cost,
      },
      percentageChange: {
        totalCost: ((currentTotal - previousTotal) / previousTotal) * 100,
        averageCost: ((currentAvg - previousAvg) / previousAvg) * 100,
        peakCosts: ((currentBreakdown.peak_cost - previousBreakdown.peak_cost) / previousBreakdown.peak_cost) * 100,
        offPeakCosts: ((currentBreakdown.off_peak_cost - previousBreakdown.off_peak_cost) / previousBreakdown.off_peak_cost) * 100,
      },
    };
  }

  private detectAnomalies(data: EnergyData[]): CostAnomaly[] {
    const costs = data.map(reading => ({
      timestamp: reading.timestamp,
      cost: reading.value * (this.isPeakHour(new Date(reading.timestamp).getHours()) ? this.PEAK_RATE : this.OFF_PEAK_RATE),
    }));

    const avgCost = costs.reduce((sum, record) => sum + record.cost, 0) / costs.length;
    const stdDev = Math.sqrt(
      costs.reduce((sum, record) => sum + Math.pow(record.cost - avgCost, 2), 0) / costs.length
    );

    return costs.map(record => {
      const deviation = Math.abs(record.cost - avgCost) / stdDev;
      let severity: 'low' | 'medium' | 'high';
      if (deviation > 2) severity = 'high';
      else if (deviation > 1) severity = 'medium';
      else severity = 'low';

      const timestamp = new Date(record.timestamp);
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();

      return {
        date: record.timestamp,
        actualCost: record.cost,
        expectedCost: avgCost,
        deviation,
        severity,
        confidence: Math.max(0.7, 1 - deviation / 4), // Higher deviation = lower confidence
        impact: {
          cost: Math.abs(record.cost - avgCost),
          efficiency: deviation > 1 ? 0.8 : 0.4,
        },
        context: {
          timeOfDay: `${hour}:00`,
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          seasonality: this.determineSeasonality(timestamp),
        },
        rootCause: this.determineRootCause(hour, dayOfWeek, deviation),
      };
    });
  }

  private determineSeasonality(date: Date): string {
    const month = date.getMonth();
    if (month >= 5 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Fall';
    if (month >= 2 && month <= 4) return 'Spring';
    return 'Winter';
  }

  private determineRootCause(hour: number, dayOfWeek: number, deviation: number): string {
    if (this.isPeakHour(hour) && deviation > 2) {
      return 'Significant peak hour usage spike';
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Unusual weekend activity';
    }
    if (hour >= 22 || hour <= 5) {
      return 'Unexpected nighttime consumption';
    }
    return 'Normal operational variation';
  }

  private generateForecast(data: EnergyData[]): CostForecast[] {
    const hourlyAverages = new Array(24).fill({ sum: 0, count: 0 });
    data.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      const cost = reading.value * (this.isPeakHour(hour) ? this.PEAK_RATE : this.OFF_PEAK_RATE);
      hourlyAverages[hour].sum += cost;
      hourlyAverages[hour].count++;
    });

    return hourlyAverages.map((avg, hour) => {
      const baselineCost = avg.count > 0 ? avg.sum / avg.count : 0;
      const variance = baselineCost * 0.2; // 20% variance for confidence interval

      return {
        date: new Date().setHours(hour, 0, 0, 0).toString(),
        predictedCost: baselineCost,
        confidenceInterval: {
          lower: Math.max(0, baselineCost - variance),
          upper: baselineCost + variance,
        },
      };
    });
  }

  private generateTimeOfUseCosts(data: EnergyData[]): TimeOfUseCost[] {
    const timeOfUseCosts: TimeOfUseCost[] = [];

    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        const relevantData = data.filter(reading => {
          const date = new Date(reading.timestamp);
          return date.getDay() === weekday && date.getHours() === hour;
        });

        const avgUsage = relevantData.reduce((sum, reading) => sum + reading.value, 0) / (relevantData.length || 1);
        const cost = avgUsage * (this.isPeakHour(hour) ? this.PEAK_RATE : this.OFF_PEAK_RATE);

        timeOfUseCosts.push({ hour, weekday, cost });
      }
    }

    return timeOfUseCosts;
  }

  private generateSavingOpportunities(
    breakdown: CostBreakdown,
    timeOfUse: TimeOfUseCost[]
  ): CostSavingOpportunity[] {
    const opportunities: CostSavingOpportunity[] = [];
    const totalCost = breakdown.peak_cost + breakdown.off_peak_cost;

    // Peak reduction opportunity
    if (breakdown.peak_cost > breakdown.off_peak_cost * 1.5) {
      opportunities.push({
        id: crypto.randomUUID(),
        description: 'Shift peak usage to off-peak hours',
        potentialSavings: breakdown.peak_cost * 0.2, // 20% reduction potential
        implementationCost: 5000,
        paybackPeriod: 12,
        category: 'peak-reduction',
        priority: 'high',
        confidence: 0.85,
        implementationSteps: [
          'Identify peak usage equipment',
          'Create load shifting schedule',
          'Install automated controls',
          'Train staff on new procedures'
        ],
        roi: (breakdown.peak_cost * 0.2 * 12) / 5000,
        mlInsights: {
          keyFactors: ['peak demand', 'operational schedule', 'equipment efficiency'],
          sensitivityAnalysis: [
            { factor: 'peak hour reduction', impact: 0.6 },
            { factor: 'equipment upgrades', impact: 0.4 }
          ],
          riskProfile: {
            level: 'low' as const,
            factors: ['proven technology', 'minimal disruption']
          }
        }
      });
    }

    // Rate optimization opportunity
    const avgPeakCost = timeOfUse
      .filter(tou => this.isPeakHour(tou.hour))
      .reduce((sum, tou) => sum + tou.cost, 0) / 9; // 9 peak hours
    if (avgPeakCost > this.PEAK_RATE * 1.2) {
      opportunities.push({
        id: crypto.randomUUID(),
        description: 'Optimize rate structure',
        potentialSavings: totalCost * 0.15, // 15% reduction potential
        implementationCost: 2000,
        paybackPeriod: 6,
        category: 'rate-optimization',
        priority: 'medium',
        confidence: 0.9,
        implementationSteps: [
          'Analyze current rate structure',
          'Compare available rate plans',
          'Calculate savings potential',
          'Submit rate change request'
        ],
        roi: (totalCost * 0.15 * 12) / 2000,
        mlInsights: {
          keyFactors: ['rate structure', 'usage patterns', 'peak demand'],
          sensitivityAnalysis: [
            { factor: 'rate differential', impact: 0.7 },
            { factor: 'usage timing', impact: 0.3 }
          ],
          riskProfile: {
            level: 'low' as const,
            factors: ['no operational changes', 'guaranteed savings']
          }
        }
      });
    }

    // Demand response opportunity
    if (breakdown.demand_charges > totalCost * 0.3) {
      opportunities.push({
        id: crypto.randomUUID(),
        description: 'Implement demand response program',
        potentialSavings: breakdown.demand_charges * 0.25, // 25% reduction potential
        implementationCost: 10000,
        paybackPeriod: 18,
        category: 'demand-response',
        priority: 'high',
        confidence: 0.8,
        implementationSteps: [
          'Evaluate demand response programs',
          'Install monitoring equipment',
          'Develop response strategies',
          'Train staff on procedures'
        ],
        roi: (breakdown.demand_charges * 0.25 * 12) / 10000,
        mlInsights: {
          keyFactors: ['peak demand', 'response capability', 'program incentives'],
          sensitivityAnalysis: [
            { factor: 'demand reduction', impact: 0.5 },
            { factor: 'response time', impact: 0.5 }
          ],
          riskProfile: {
            level: 'medium' as const,
            factors: ['operational changes', 'staff training needed']
          }
        }
      });
    }

    return opportunities;
  }

  private generateMLInsights(data: EnergyData[]): MLInsights {
    const hourlyPatterns = new Array(24).fill({ sum: 0, count: 0 });
    const weeklyPatterns = new Array(7).fill({ sum: 0, count: 0 });
    const monthlyPatterns = new Array(12).fill({ sum: 0, count: 0 });

    data.forEach(reading => {
      const date = new Date(reading.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const month = date.getMonth();

      hourlyPatterns[hour].sum += reading.value;
      hourlyPatterns[hour].count++;
      weeklyPatterns[day].sum += reading.value;
      weeklyPatterns[day].count++;
      monthlyPatterns[month].sum += reading.value;
      monthlyPatterns[month].count++;
    });

    return {
      usagePatterns: {
        daily: hourlyPatterns.map((pattern, hour) => ({
          hour,
          avgUsage: pattern.count > 0 ? pattern.sum / pattern.count : 0,
          confidence: Math.min(1, pattern.count / 30) // Higher count = higher confidence
        })),
        weekly: weeklyPatterns.map((pattern, day) => ({
          day,
          avgUsage: pattern.count > 0 ? pattern.sum / pattern.count : 0,
          confidence: Math.min(1, pattern.count / 4) // Higher count = higher confidence
        })),
        seasonal: monthlyPatterns.map((pattern, month) => ({
          month,
          avgUsage: pattern.count > 0 ? pattern.sum / pattern.count : 0,
          confidence: Math.min(1, pattern.count / 30) // Higher count = higher confidence
        }))
      },
      costDrivers: [
        {
          factor: 'Peak Demand',
          impact: 0.4,
          confidence: 0.9
        },
        {
          factor: 'Time of Use',
          impact: 0.3,
          confidence: 0.85
        },
        {
          factor: 'Weather',
          impact: 0.2,
          confidence: 0.75
        },
        {
          factor: 'Day Type',
          impact: 0.1,
          confidence: 0.95
        }
      ],
      optimizationPotential: {
        total: 0.25, // 25% total optimization potential
        breakdown: [
          {
            category: 'Peak Reduction',
            amount: 0.15,
            confidence: 0.85
          },
          {
            category: 'Load Shifting',
            amount: 0.05,
            confidence: 0.9
          },
          {
            category: 'Efficiency',
            amount: 0.05,
            confidence: 0.8
          }
        ]
      }
    };
  }

  public analyzeCosts(currentData: EnergyData[], previousData: EnergyData[] = []) {
    // Calculate total and peak kWh for metrics
    const totalKwh = currentData.reduce((sum, reading) => sum + reading.value, 0);
    const peakKwh = currentData
      .filter(reading => this.isPeakHour(new Date(reading.timestamp).getHours()))
      .reduce((sum, reading) => sum + reading.value, 0);

    // Generate all cost analysis components
    const breakdown = this.calculateBreakdown(currentData);
    const metrics = this.calculateMetrics(breakdown, totalKwh, peakKwh);
    const comparison = this.calculateComparison(currentData, previousData.length ? previousData : currentData);
    const anomalies = this.detectAnomalies(currentData);
    const forecast = this.generateForecast(currentData);
    const timeOfUse = this.generateTimeOfUseCosts(currentData);
    const savingOpportunities = this.generateSavingOpportunities(breakdown, timeOfUse);
    const mlInsights = this.generateMLInsights(currentData);

    return {
      breakdown,
      metrics,
      comparison,
      forecast,
      anomalies,
      timeOfUse,
      savingOpportunities,
      mlInsights,
      isLoading: false,
      isError: false,
      error: null
    };
  }
}

export const costAnalyzer = CostAnalyzer.getInstance();
