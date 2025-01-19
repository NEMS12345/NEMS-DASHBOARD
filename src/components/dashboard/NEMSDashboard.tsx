'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  AlertTriangle, Battery, Zap, DollarSign,
  Leaf, ChevronDown,
  RefreshCw
} from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import {
  Card, Title, Text, Metric, Grid,
  type DateRangePickerValue, Select, SelectItem,
  Tab, TabList, TabGroup, TabPanels, TabPanel,
  AreaChart, BadgeDelta, ProgressBar
} from '@tremor/react';
import TimeDistributionChart from '../charts/TimeDistributionChart';
import type { Database } from '@/types/database';
import { useEnergyData } from '@/lib/hooks/useEnergyData';
import { CostAnalysis } from './CostAnalysis';

// These types are used in the component's type system
type EnergyDataPoint = Database['public']['Tables']['energy_data']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

type TremorColor = "blue" | "amber" | "green" | "emerald" | "rose" | "violet";

interface MetricCardProps {
  title: string;
  value: number;
  delta: number;
  format: (n: number) => string;
  icon: React.ElementType;
  color: TremorColor;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

// Utility functions
const formatKWH = (value: number) => `${value.toFixed(1)} kWh`;
const formatKW = (value: number) => `${value.toFixed(1)} kW`;
const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  format,
  icon: Icon,
  color,
  trend = 'neutral',
  subtext
}) => {
  const getDeltaType = (delta: number, trend: string) => {
    if (trend === 'up') return delta > 0 ? "increase" : "decrease";
    if (trend === 'down') return delta < 0 ? "increase" : "decrease";
    if (delta > 5) return "increase";
    if (delta < -5) return "decrease";
    return "moderateIncrease";
  };

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 text-${color}-500`} />
            <Text className="text-sm font-medium text-gray-600">{title}</Text>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <Metric className="text-2xl font-bold">{format(value)}</Metric>
              <BadgeDelta
                deltaType={getDeltaType(delta, trend)}
                size="sm"
                className="font-medium"
              >
                {delta}%
              </BadgeDelta>
            </div>
            {subtext && (
              <Text className="text-xs text-gray-500 mt-1">{subtext}</Text>
            )}
          </div>
        </div>
      </div>
      <ProgressBar
        value={75}
        className="mt-4 h-1.5"
        color={color}
        tooltip="Current utilization: 75%"
      />
    </Card>
  );
};

const NEMSDashboard: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'hourly' | 'daily' | 'weekly'>('daily');

  // Use React Query for locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Use the shared useEnergyData hook
  const {
    data: energyData = [],
    isLoading: energyLoading,
    error
  } = useEnergyData(
    selectedLocation === 'all' ? null : selectedLocation,
    dateRange.from || new Date(),
    dateRange.to || new Date()
  );

  // Transform energy data to match EnergyDataPoint type
  const filteredData = useMemo<EnergyDataPoint[]>(() => {
    return energyData.map(item => ({
      id: '',
      client_id: '',
      location_id: selectedLocation,
      bill_date: item.timestamp,
      usage_kwh: item.value,
      peak_demand_kw: item.value,
      total_cost: 0,
      rate_type: '',
      reading_time: item.timestamp,
      created_at: new Date().toISOString()
    }));
  }, [energyData, selectedLocation]);

  const isLoading = energyLoading || locationsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <Text>Loading dashboard...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md mx-auto">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <Text>Error loading dashboard: {error.message}</Text>
          </div>
        </Card>
      </div>
    );
  }

  const latestData = filteredData[filteredData.length - 1] || {
    usage_kwh: 0,
    peak_demand_kw: 0,
    total_cost: 0
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        locations={locations}
        loading={isLoading}
      />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metrics */}
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
          <MetricCard
            title="Energy Usage"
            value={latestData.usage_kwh}
            delta={2.5}
            format={formatKWH}
            icon={Zap}
            color="blue"
            trend="down"
            subtext="vs. previous period"
          />
          <MetricCard
            title="Peak Demand"
            value={latestData.peak_demand_kw}
            delta={-1.8}
            format={formatKW}
            icon={Battery}
            color="amber"
            trend="up"
            subtext="vs. previous period"
          />
          <MetricCard
            title="Total Cost"
            value={latestData.total_cost}
            delta={3.2}
            format={formatCurrency}
            icon={DollarSign}
            color="green"
            trend="neutral"
            subtext="vs. previous period"
          />
          <MetricCard
            title="Efficiency Score"
            value={85}
            delta={4.5}
            format={formatPercent}
            icon={Leaf}
            color="emerald"
            trend="up"
            subtext="vs. target"
          />
        </Grid>

        {/* Tabs and Charts */}
        <Card className="bg-white">
          <TabGroup>
            <div className="border-b border-gray-200">
              <div className="px-6">
                <TabList className="flex -mb-px">
                  {['Overview', 'Usage', 'Demand', 'Cost', 'Reports'].map((tab) => (
                    <Tab
                      key={tab}
                      className="relative py-3 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 ui-selected:text-blue-600 ui-selected:border-b-2 ui-selected:border-blue-600"
                    >
                      {tab}
                    </Tab>
                  ))}
                </TabList>
              </div>
            </div>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel className="p-6">
                <div className="flex flex-col items-center justify-center h-72 text-gray-500 space-y-2">
                  <Text>Overview Coming Soon</Text>
                </div>
              </TabPanel>

              {/* Usage Tab */}
              <TabPanel className="p-6">
                <Grid numItems={1} numItemsLg={2} className="gap-6">
                  <Card className="bg-white">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <Title className="text-gray-900 font-medium">Energy Usage Trend</Title>
                        <Text className="text-gray-500 text-sm">Daily consumption patterns</Text>
                      </div>
                      <Select
                        className="w-40"
                        value={selectedPeriod}
                        onValueChange={(value) => setSelectedPeriod(value as typeof selectedPeriod)}
                        icon={ChevronDown}
                      >
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </Select>
                    </div>
                    <AreaChart
                      className="h-72"
                      data={filteredData}
                      index="bill_date"
                      categories={["usage_kwh"]}
                      colors={["blue"]}
                      valueFormatter={formatKWH}
                      showLegend={false}
                      curveType="monotone"
                    />
                  </Card>

                  <Card className="bg-white">
                    <TimeDistributionChart />
                  </Card>
                </Grid>
              </TabPanel>

              {/* Demand Tab */}
              <TabPanel className="p-6">
                <div className="flex flex-col items-center justify-center h-72 text-gray-500 space-y-2">
                  <Battery className="h-12 w-12 text-gray-300" />
                  <Text>Demand Profile Coming Soon</Text>
                </div>
              </TabPanel>

              {/* Cost Tab */}
              <TabPanel className="p-6">
                <CostAnalysis />
              </TabPanel>

              {/* Reports Tab */}
              <TabPanel className="p-6">
                <div className="flex flex-col items-center justify-center h-72 text-gray-500 space-y-2">
                  <Text>Reports Coming Soon</Text>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      </div>
    </main>
  );
};

export default NEMSDashboard;
