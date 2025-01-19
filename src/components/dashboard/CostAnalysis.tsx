'use client';

import React from 'react';
import {
  Card,
  Grid,
  Title,
  Text,
  Metric,
  BadgeDelta,
  Color,
} from '@tremor/react';
import { CostTrendChart, transformForecastData } from '../charts/CostTrendChart';
import { CostBreakdownChart } from '../charts/CostBreakdownChart';
import { TimeOfUseCostHeatmap } from '../charts/TimeOfUseCostHeatmap';
import { useCostAnalysis } from '@/lib/hooks/useCostAnalysis';

export function CostAnalysis() {
  const {
    metrics,
    comparison,
    forecast,
    anomalies,
    timeOfUse,
    breakdown,
    savingOpportunities,
    isLoading,
    isError,
  } = useCostAnalysis({
    clientId: 'current-user', // TODO: Get from auth context
    locationId: 'all',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Grid numItems={1} numItemsLg={2} className="gap-6">
          <Card>
            <div className="h-64 bg-gray-200 rounded"></div>
          </Card>
          <Card>
            <div className="h-64 bg-gray-200 rounded"></div>
          </Card>
        </Grid>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center text-red-500">
          Error loading cost data
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: number | undefined) =>
    value === undefined
      ? '$0.00'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(value);

  const formatPercentage = (value: number | undefined) =>
    value === undefined ? '0.0%' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card>
          <Text className="text-sm font-medium text-gray-500">Average Cost/kWh</Text>
          <div className="mt-2 flex justify-between items-baseline">
            <Metric color={comparison?.percentageChange.averageCost > 0 ? "red" : "green" as Color}>
              {formatCurrency(metrics?.averageCostPerKwh)}
            </Metric>
            <BadgeDelta
              deltaType={comparison?.percentageChange.averageCost > 0 ? "decrease" : "increase"}
              size="sm"
            >
              {formatPercentage(comparison?.percentageChange.averageCost)}
            </BadgeDelta>
          </div>
        </Card>

        <Card>
          <Text className="text-sm font-medium text-gray-500">Peak Cost/kWh</Text>
          <div className="mt-2 flex justify-between items-baseline">
            <Metric color={comparison?.percentageChange.peakCosts > 0 ? "red" : "green" as Color}>
              {formatCurrency(metrics?.peakCostPerKwh)}
            </Metric>
            <BadgeDelta
              deltaType={comparison?.percentageChange.peakCosts > 0 ? "decrease" : "increase"}
              size="sm"
            >
              {formatPercentage(comparison?.percentageChange.peakCosts)}
            </BadgeDelta>
          </div>
        </Card>

        <Card>
          <Text className="text-sm font-medium text-gray-500">Off-Peak Cost/kWh</Text>
          <div className="mt-2 flex justify-between items-baseline">
            <Metric color={comparison?.percentageChange.offPeakCosts > 0 ? "red" : "green" as Color}>
              {formatCurrency(metrics?.offPeakCostPerKwh)}
            </Metric>
            <BadgeDelta
              deltaType={comparison?.percentageChange.offPeakCosts > 0 ? "decrease" : "increase"}
              size="sm"
            >
              {formatPercentage(comparison?.percentageChange.offPeakCosts)}
            </BadgeDelta>
          </div>
        </Card>

        <Card>
          <Text className="text-sm font-medium text-gray-500">Demand Cost/kW</Text>
          <div className="mt-2 flex justify-between items-baseline">
            <Metric>{formatCurrency(metrics?.demandCostPerKw)}</Metric>
          </div>
        </Card>
      </Grid>

      {/* Cost Trend Chart */}
      <Card>
        <div className="mb-4">
          <Title>Cost Trends & Forecast</Title>
        </div>
        <CostTrendChart
          data={transformForecastData(
            timeOfUse.map(t => ({ date: `${t.weekday}-${t.hour}`, cost: t.cost })),
            forecast
          )}
          height={400}
        />
      </Card>

      {/* Cost Breakdown and Time-of-Use */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <Card>
          <div className="mb-4">
            <Title>Cost Breakdown</Title>
          </div>
          <CostBreakdownChart data={breakdown} height={300} />
        </Card>

        <Card>
          <div className="mb-4">
            <Title>Time-of-Use Analysis</Title>
          </div>
          <TimeOfUseCostHeatmap data={timeOfUse} height={300} />
        </Card>
      </Grid>

      {/* Cost Saving Opportunities */}
      <Card>
        <div className="mb-4">
          <Title>Cost Saving Opportunities</Title>
        </div>
        <div className="space-y-4">
          {savingOpportunities.map(opportunity => (
            <div
              key={opportunity.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <Text className="font-medium">{opportunity.description}</Text>
                <Text className="text-sm text-gray-500">
                  Category: {opportunity.category.replace('-', ' ')}
                </Text>
              </div>
              <div className="text-right">
                <Text className="text-lg font-medium text-green-600">
                  {formatCurrency(opportunity.potentialSavings)}
                </Text>
                <Text
                  className={`text-sm ${
                    opportunity.priority === 'high'
                      ? 'text-red-500'
                      : opportunity.priority === 'medium'
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }`}
                >
                  {opportunity.priority} priority
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Anomalies */}
      <Card>
        <div className="mb-4">
          <Title>Cost Anomalies</Title>
        </div>
        <div className="space-y-4">
          {anomalies
            .filter(a => a.severity !== 'low')
            .map((anomaly, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <Text className="font-medium">
                    Unusual cost detected on {anomaly.date}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {formatCurrency(anomaly.actualCost)} vs expected{' '}
                    {formatCurrency(anomaly.expectedCost)}
                  </Text>
                </div>
                <Text
                  className={`text-sm ${
                    anomaly.severity === 'high'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {anomaly.severity} severity
                </Text>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
