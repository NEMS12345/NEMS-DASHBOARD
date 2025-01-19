import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DemandProfile } from '@/lib/demand/demandAnalyzer';

interface DemandChartProps {
  data: DemandProfile;
}

export const DemandChart: React.FC<DemandChartProps> = ({ data }) => {
  // Format data for the chart
  const chartData = [
    {
      name: 'Current',
      time: new Date().toLocaleTimeString(),
      demand: data.currentDemand,
    },
    {
      name: 'Peak',
      time: 'Peak',
      demand: data.peakDemand,
    },
    {
      name: 'Predicted',
      time: new Date(Date.now() + data.timeToNextPeak * 60000).toLocaleTimeString(),
      demand: data.predictedPeak,
    },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            label={{ value: 'Demand (kW)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="demand"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{
              stroke: '#2563eb',
              strokeWidth: 2,
              r: 4,
              fill: '#fff',
            }}
            activeDot={{
              stroke: '#2563eb',
              strokeWidth: 2,
              r: 6,
              fill: '#fff',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
