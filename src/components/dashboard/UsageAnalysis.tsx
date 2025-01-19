import React from 'react';

interface EnergyData {
  timestamp: string;
  value: number;
}

interface UsageAnalysisProps {
  data: EnergyData[];
  aggregatedData?: {
    total: number;
    average: number;
  };
}

const UsageAnalysis: React.FC<UsageAnalysisProps> = ({ data, aggregatedData }) => {
  // Basic data validation
  if (!data?.length) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Usage Analysis</h2>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Usage Analysis</h2>
      <div className="h-80">
        {/* Usage analysis content will go here */}
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div>Usage analysis visualization coming soon</div>
          <div className="mt-2 text-sm">
            {aggregatedData ? (
              <>
                Total: {aggregatedData.total.toFixed(2)} kWh
                <br />
                Average: {aggregatedData.average.toFixed(2)} kWh
              </>
            ) : (
              'Aggregated data not available'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageAnalysis;
