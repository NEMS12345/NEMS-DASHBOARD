import React from 'react';
import { TimeOfUseCost } from '@/types/cost-analysis';

interface TimeOfUseCostHeatmapProps {
  data: TimeOfUseCost[];
  height?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimeOfUseCostHeatmap({ data, height = 400 }: TimeOfUseCostHeatmapProps) {
  // Create a 2D array for the heatmap data
  const heatmapData = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  // Fill the heatmap data
  data.forEach(({ hour, weekday, cost }) => {
    heatmapData[weekday][hour] = cost;
  });

  // Calculate min and max costs for color scaling
  const costs = data.map(d => d.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // Calculate cell dimensions
  const cellWidth = 900 / 25; // 24 hours + 1 column for labels
  const cellHeight = height / 8; // 7 days + 1 row for labels

  const formatCost = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  // Color scale function
  const getColor = (value: number) => {
    const normalizedValue = (value - minCost) / (maxCost - minCost);
    // Use a gradient from cool blue to warm red
    const hue = ((1 - normalizedValue) * 240).toString(10);
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={height} viewBox={`0 0 900 ${height}`}>
        {/* Hour labels */}
        {HOURS.map((hour) => (
          <text
            key={`hour-${hour}`}
            x={cellWidth * (hour + 1.5)}
            y={20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {hour.toString().padStart(2, '0')}:00
          </text>
        ))}

        {/* Day labels */}
        {DAYS.map((day, i) => (
          <text
            key={`day-${day}`}
            x={20}
            y={cellHeight * (i + 1.5)}
            textAnchor="start"
            className="text-xs fill-gray-600"
          >
            {day}
          </text>
        ))}

        {/* Heatmap cells */}
        {DAYS.map((day, dayIndex) =>
          HOURS.map((hour) => {
            const cost = heatmapData[dayIndex][hour];
            return (
              <g
                key={`cell-${dayIndex}-${hour}`}
                className="group"
                transform={`translate(${cellWidth * (hour + 1)}, ${
                  cellHeight * (dayIndex + 1)
                })`}
              >
                <rect
                  width={cellWidth - 1}
                  height={cellHeight - 1}
                  fill={getColor(cost)}
                  rx={2}
                >
                  <title>{`${day} ${hour}:00 - ${formatCost(cost)}/kWh`}</title>
                </rect>
                <text
                  x={cellWidth / 2}
                  y={cellHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px] fill-white opacity-0 group-hover:opacity-100 pointer-events-none"
                >
                  {formatCost(cost)}
                </text>
              </g>
            );
          })
        )}

        {/* Legend */}
        <g transform={`translate(750, ${height - 60})`}>
          <text x={0} y={-10} className="text-xs fill-gray-600">
            Cost per kWh
          </text>
          <linearGradient id="legend-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(240, 70%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 70%, 50%)" />
          </linearGradient>
          <rect width={100} height={10} fill="url(#legend-gradient)" />
          <text x={0} y={25} className="text-xs fill-gray-600">
            {formatCost(minCost)}
          </text>
          <text x={100} y={25} textAnchor="end" className="text-xs fill-gray-600">
            {formatCost(maxCost)}
          </text>
        </g>
      </svg>
    </div>
  );
}
