export interface CostBreakdown {
  id: string;
  energy_data_id: string;
  peak_cost: number;
  off_peak_cost: number;
  demand_charges: number;
  fixed_charges: number;
  taxes: number;
  other_charges: number;
  created_at: string;
}

export interface CostMetrics {
  averageCostPerKwh: number;
  peakCostPerKwh: number;
  offPeakCostPerKwh: number;
  demandCostPerKw: number;
}

export interface CostComparison {
  currentPeriod: {
    totalCost: number;
    averageCost: number;
    peakCosts: number;
    offPeakCosts: number;
  };
  previousPeriod: {
    totalCost: number;
    averageCost: number;
    peakCosts: number;
    offPeakCosts: number;
  };
  percentageChange: {
    totalCost: number;
    averageCost: number;
    peakCosts: number;
    offPeakCosts: number;
  };
}

export interface CostForecast {
  date: string;
  predictedCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface CostAnomaly {
  date: string;
  actualCost: number;
  expectedCost: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
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
  rootCause: string;
}

export interface MLUsagePattern {
  daily: Array<{
    hour: number;
    avgUsage: number;
    confidence: number;
  }>;
  weekly: Array<{
    day: number;
    avgUsage: number;
    confidence: number;
  }>;
  seasonal: Array<{
    month: number;
    avgUsage: number;
    confidence: number;
  }>;
}

export interface CostDriver {
  factor: string;
  impact: number;
  confidence: number;
}

export interface OptimizationPotential {
  total: number;
  breakdown: Array<{
    category: string;
    amount: number;
    confidence: number;
  }>;
}

export interface MLInsights {
  usagePatterns: MLUsagePattern;
  costDrivers: CostDriver[];
  optimizationPotential: OptimizationPotential;
}

export interface TimeOfUseCost {
  hour: number;
  weekday: number;
  cost: number;
}

export interface CostSavingOpportunity {
  id: string;
  description: string;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriod: number;
  category: 'peak-reduction' | 'efficiency' | 'rate-optimization' | 'demand-response';
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

export interface CostAnalysisResponse {
  breakdown: CostBreakdown;
  metrics: CostMetrics;
  comparison: CostComparison;
  forecast: CostForecast[];
  anomalies: CostAnomaly[];
  timeOfUse: TimeOfUseCost[];
  savingOpportunities: CostSavingOpportunity[];
  mlInsights: MLInsights;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
