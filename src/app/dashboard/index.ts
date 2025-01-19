// src/app/dashboard/index.ts
import dynamic from 'next/dynamic';
import React from 'react';

interface EnergyData {
  // TODO: Replace with actual energy data structure
  timestamp: string;
  value: number;
}

interface DashboardComponentProps {
  data: EnergyData[];
  aggregatedData?: {
    total: number;
    average: number;
  };
}

export const DemandProfile = dynamic<DashboardComponentProps>(
  () => import('../../components/dashboard/DemandProfile').then(mod => mod.default),
  {
    loading: () => React.createElement(
      'div',
      { className: "w-full h-64 animate-pulse bg-gray-100 rounded-lg" },
      React.createElement(
        'div',
        { className: "h-full w-full flex items-center justify-center" },
        React.createElement(
          'span',
          { className: "text-gray-500" },
          "Loading demand profile..."
        )
      )
    ),
    ssr: false
  }
);

export const UsageAnalysis = dynamic<DashboardComponentProps>(
  () => import('../../components/dashboard/UsageAnalysis').then(mod => mod.default),
  {
    loading: () => React.createElement(
      'div',
      { className: "w-full h-96 animate-pulse bg-gray-100 rounded-lg" },
      React.createElement(
        'div',
        { className: "h-full w-full flex items-center justify-center" },
        React.createElement(
          'span',
          { className: "text-gray-500" },
          "Loading usage analysis..."
        )
      )
    ),
    ssr: false
  }
);

export const CostAnalysis = dynamic<DashboardComponentProps>(
  () => import('../../components/dashboard/CostAnalysis').then(mod => mod.default),
  {
    loading: () => React.createElement(
      'div',
      { className: "w-full h-96 animate-pulse bg-gray-100 rounded-lg" },
      React.createElement(
        'div',
        { className: "h-full w-full flex items-center justify-center" },
        React.createElement(
          'span',
          { className: "text-gray-500" },
          "Loading cost analysis..."
        )
      )
    ),
    ssr: false
  }
);
