import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ClaudeResponse {
  content: string;
  error?: string;
}

export class ClaudeClient {
  private static instance: ClaudeClient;
  private constructor() {}

  public static getInstance(): ClaudeClient {
    if (!ClaudeClient.instance) {
      ClaudeClient.instance = new ClaudeClient();
    }
    return ClaudeClient.instance;
  }

  async analyze(prompt: string): Promise<ClaudeResponse> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = message.content[0].type === 'text'
        ? message.content[0].text
        : '';
      return {
        content,
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async analyzeBill(billData: string): Promise<ClaudeResponse> {
    const prompt = `Analyze this energy bill data using advanced ML techniques and provide comprehensive insights:

    1. Pattern Analysis:
    - Apply time series decomposition to identify trends, seasonality, and cycles
    - Calculate autocorrelation and cross-correlation coefficients
    - Perform frequency domain analysis
    - Evaluate pattern statistical significance using p-values
    - Identify key factors influencing patterns

    2. Anomaly Detection:
    - Use statistical process control methods
    - Apply isolation forest algorithm concepts
    - Calculate Mahalanobis distances
    - Perform change point detection
    - Evaluate anomaly confidence levels

    3. Cost Optimization:
    - Analyze rate structure optimization opportunities
    - Calculate load factor improvements
    - Evaluate demand response potential
    - Assess time-of-use optimization
    - Quantify savings with confidence intervals

    4. ML-Based Insights:
    - Generate usage pattern predictions
    - Identify cost drivers through feature importance
    - Calculate optimization potential using predictive models
    - Provide confidence scores for all predictions

    Bill Data:
    ${billData}

    Please format your response as JSON with the following structure:
    {
      "anomalies": [{
        "description": string,
        "severity": "low" | "medium" | "high",
        "impact": string,
        "confidence": number,
        "rootCause": string,
        "suggestedActions": string[]
      }],
      "savings": [{
        "description": string,
        "potentialAmount": number,
        "effort": "low" | "medium" | "high",
        "confidence": number,
        "implementationSteps": string[],
        "roi": number
      }],
      "recommendations": [{
        "title": string,
        "description": string,
        "priority": "low" | "medium" | "high",
        "implementationSteps": string[],
        "estimatedCost": number,
        "expectedSavings": number,
        "paybackPeriod": number
      }],
      "patterns": [{
        "type": string,
        "description": string,
        "significance": string,
        "trend": number,
        "seasonality": number,
        "confidence": number,
        "factors": string[],
        "impact": {
          "cost": number,
          "efficiency": number
        }
      }],
      "mlInsights": {
        "usagePatterns": {
          "daily": [{ "hour": number, "avgUsage": number, "confidence": number }],
          "weekly": [{ "day": number, "avgUsage": number, "confidence": number }],
          "seasonal": [{ "month": number, "avgUsage": number, "confidence": number }]
        },
        "costDrivers": [{
          "factor": string,
          "impact": number,
          "confidence": number
        }],
        "optimizationPotential": {
          "total": number,
          "breakdown": [{
            "category": string,
            "amount": number,
            "confidence": number
          }]
        }
      }
    }`;

    return this.analyze(prompt);
  }

  async detectAnomalies(usageData: string): Promise<ClaudeResponse> {
    const prompt = `Analyze this energy usage data for anomalies using advanced ML techniques:

    1. Statistical Analysis:
    - Apply Extreme Value Theory (EVT) methods
    - Calculate robust statistical measures (MAD, IQR)
    - Use ARIMA modeling for baseline predictions
    - Implement exponential smoothing
    - Calculate confidence intervals

    2. Pattern Recognition:
    - Apply Dynamic Time Warping (DTW)
    - Use Symbolic Aggregate Approximation (SAX)
    - Implement change point detection
    - Calculate pattern similarity scores
    - Identify seasonal adjustments

    3. ML-Based Detection:
    - Apply isolation forest concepts
    - Use Local Outlier Factor (LOF) principles
    - Calculate anomaly probability scores
    - Implement ensemble detection methods
    - Generate confidence metrics

    4. Contextual Analysis:
    - Evaluate temporal context
    - Consider operational patterns
    - Analyze environmental factors
    - Calculate contextual baselines
    - Generate impact assessments

    Usage Data:
    ${usageData}

    Please format your response as JSON with the following structure:
    {
      "anomalies": [{
        "timestamp": string,
        "type": "spike" | "drop" | "pattern" | "trend",
        "severity": "low" | "medium" | "high",
        "expectedValue": number,
        "actualValue": number,
        "deviation": number,
        "potentialCauses": string[],
        "confidence": number,
        "impact": {
          "cost": number,
          "efficiency": number,
          "description": string
        },
        "context": {
          "timeOfDay": string,
          "dayOfWeek": string,
          "seasonality": string
        }
      }]
    }`;

    return this.analyze(prompt);
  }

  async generateRecommendations(analysisData: string): Promise<ClaudeResponse> {
    const prompt = `Based on this energy analysis data, generate ML-driven, actionable recommendations:

    1. Advanced Analytics:
    - Apply regression analysis for savings predictions
    - Use clustering to identify optimization groups
    - Calculate feature importance for cost drivers
    - Generate confidence intervals for savings
    - Perform sensitivity analysis

    2. Implementation Strategy:
    - Generate phased implementation plans
    - Calculate resource optimization metrics
    - Analyze technical dependencies
    - Evaluate implementation risks
    - Provide contingency recommendations

    3. Financial Modeling:
    - Use Monte Carlo simulation for ROI
    - Calculate risk-adjusted returns
    - Generate probabilistic payback periods
    - Model scenario-based outcomes
    - Provide confidence-weighted metrics

    4. ML-Based Prioritization:
    - Calculate impact probability scores
    - Generate complexity metrics
    - Analyze resource utilization
    - Evaluate implementation success probability
    - Provide confidence-based rankings

    Analysis Data:
    ${analysisData}

    Please format your response as JSON with the following structure:
    {
      "recommendations": [{
        "title": string,
        "description": string,
        "category": "peak-reduction" | "efficiency" | "rate-optimization" | "demand-response",
        "estimatedSavings": number,
        "implementationCost": number,
        "paybackPeriod": number,
        "priority": "low" | "medium" | "high",
        "confidence": number,
        "requirements": {
          "technical": string[],
          "operational": string[],
          "resources": string[]
        },
        "implementation": {
          "steps": string[],
          "timeline": string,
          "risks": string[],
          "mitigations": string[],
          "successProbability": number
        },
        "impact": {
          "cost": number,
          "efficiency": number,
          "sustainability": number,
          "confidence": number
        },
        "mlInsights": {
          "keyFactors": string[],
          "sensitivityAnalysis": [{
            "factor": string,
            "impact": number
          }],
          "riskProfile": {
            "level": "low" | "medium" | "high",
            "factors": string[]
          }
        }
      }]
    }`;

    return this.analyze(prompt);
  }
}

export const claudeClient = ClaudeClient.getInstance();
