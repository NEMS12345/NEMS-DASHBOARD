const { billAnalyzer } = require('../../lib/claude/billAnalyzer');
const { CostBreakdown, EnergyData } = require('../../types/cost-analysis');

async function testBillAnalysis() {
  // Sample test data
  const breakdown: CostBreakdown = {
    id: 'test-1',
    energy_data_id: 'data-1',
    peak_cost: 150.50,
    off_peak_cost: 75.25,
    demand_charges: 50.00,
    fixed_charges: 25.00,
    taxes: 30.00,
    other_charges: 10.00,
    created_at: new Date().toISOString()
  };

  const usageData: EnergyData[] = [
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

  try {
    console.log('Starting bill analysis test...');
    const result = await billAnalyzer.analyze(breakdown, usageData);

    console.log('\nAnalysis Results:');
    console.log('----------------');
    console.log('Metrics:', result.metrics);
    console.log('\nAnomalies:', result.anomalies);
    console.log('\nSaving Opportunities:', result.savingOpportunities);
    console.log('\nForecast:', result.forecast);

    if (result.isError) {
      console.error('Analysis failed:', result.error);
    } else {
      console.log('\nAnalysis completed successfully!');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBillAnalysis();
