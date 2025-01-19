import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { CostForecast } from '@/types/cost-analysis';

interface CostTrendChartProps {
  data: {
    date: string;
    actualCost: number;
    predictedCost?: number;
    confidenceUpper?: number;
    confidenceLower?: number;
  }[];
  height?: number;
  showForecast?: boolean;
}

export function CostTrendChart({
  data,
  height = 400,
  showForecast = true,
}: CostTrendChartProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const formatCost = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatCost}
          label={{ value: 'Cost (USD)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number) => formatCost(value)}
          labelFormatter={formatDate}
        />
        <Legend />

        {/* Confidence interval area */}
        {showForecast && (
          <Area
            type="monotone"
            dataKey="confidenceUpper"
            stroke="none"
            fill="#82ca9d"
            fillOpacity={0.1}
          />
        )}
        {showForecast && (
          <Area
            type="monotone"
            dataKey="confidenceLower"
            stroke="none"
            fill="#82ca9d"
            fillOpacity={0.1}
          />
        )}

        {/* Actual cost line */}
        <Line
          type="monotone"
          dataKey="actualCost"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Actual Cost"
        />

        {/* Predicted cost line */}
        {showForecast && (
          <Line
            type="monotone"
            dataKey="predictedCost"
            stroke="#82ca9d"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Predicted Cost"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Helper function to transform forecast data
export function transformForecastData(
  actualData: { date: string; cost: number }[],
  forecast: CostForecast[]
): CostTrendChartProps['data'] {
  return [
    ...actualData.map(d => ({
      date: d.date,
      actualCost: d.cost,
      predictedCost: undefined,
      confidenceUpper: undefined,
      confidenceLower: undefined,
    })),
    ...forecast.map(f => ({
      date: f.date,
      actualCost: 0, // Use 0 for forecast points
      predictedCost: f.predictedCost,
      confidenceUpper: f.confidenceInterval.upper,
      confidenceLower: f.confidenceInterval.lower,
    })),
  ];
}
