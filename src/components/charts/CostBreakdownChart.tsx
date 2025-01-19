import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CostBreakdown } from '@/types/cost-analysis';

interface CostBreakdownChartProps {
  data: CostBreakdown;
  height?: number;
}

const COLORS = [
  '#0088FE', // Peak Cost
  '#00C49F', // Off-Peak Cost
  '#FFBB28', // Demand Charges
  '#FF8042', // Fixed Charges
  '#8884D8', // Taxes
  '#82CA9D', // Other
];

const RADIAN = Math.PI / 180;

// Custom label for pie chart segments
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CostBreakdownChart({ data, height = 400 }: CostBreakdownChartProps) {
  // Transform the data for the pie chart
  const chartData = [
    { name: 'Peak Cost', value: data.peak_cost },
    { name: 'Off-Peak Cost', value: data.off_peak_cost },
    { name: 'Demand Charges', value: data.demand_charges },
    { name: 'Fixed Charges', value: data.fixed_charges },
    { name: 'Taxes', value: data.taxes },
    { name: 'Other', value: data.other_charges },
  ].filter(item => item.value > 0); // Only show non-zero values

  const formatCost = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  interface TooltipProps {
    active?: boolean;
    payload?: {
      name: string;
      value: number;
      payload: { name: string; value: number };
    }[];
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{formatCost(payload[0].value)}</p>
          <p className="text-xs text-gray-500">
            {`${((payload[0].value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={height * 0.4}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
