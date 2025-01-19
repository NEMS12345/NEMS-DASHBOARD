import React from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const TimeDistributionChart = () => {
  const data = [
    { name: 'Off-Peak', value: 25, color: '#22c55e' },  // Green
    { name: 'Shoulder', value: 40, color: '#f59e0b' },  // Amber
    { name: 'Peak Hours', value: 35, color: '#3b82f6' }, // Blue
  ];

  return (
    <div className="w-full h-96 p-4">
      <div className="text-lg font-semibold mb-2">Time of Use Distribution</div>
      <div className="text-sm text-gray-600 mb-4">Energy usage by time period</div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="square"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeDistributionChart;
