import React from 'react';
import { useDemandProfile } from '@/lib/hooks/useDemandProfile';
import { DemandChart } from '@/components/charts/DemandChart';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

interface DemandProfileProps {
  locationId: string;
}

const DemandProfile: React.FC<DemandProfileProps> = ({ locationId }) => {
  const { profile, isLoading, error } = useDemandProfile({
    locationId,
    interval: 300, // 5 minutes
  });

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Demand Profile</h2>
        <Alert variant="destructive">
          Error loading demand profile: {error.message}
        </Alert>
      </Card>
    );
  }

  if (isLoading || !profile) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Demand Profile</h2>
        <div className="h-48 flex items-center justify-center text-gray-500">
          Loading demand profile...
        </div>
      </Card>
    );
  }

  const trendColor = {
    increasing: 'text-red-500',
    decreasing: 'text-green-500',
    stable: 'text-blue-500',
  }[profile.demandTrend];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Demand Profile</h2>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm text-gray-500">Current Demand:</span>
            <span className="ml-2 font-semibold">{profile.currentDemand.toFixed(1)} kW</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Peak Demand:</span>
            <span className="ml-2 font-semibold">{profile.peakDemand.toFixed(1)} kW</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Trend:</span>
            <span className={`ml-2 font-semibold ${trendColor}`}>
              {profile.demandTrend.charAt(0).toUpperCase() + profile.demandTrend.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <DemandChart data={profile} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${
                rec.priority === 'high'
                  ? 'border-red-200 bg-red-50'
                  : rec.priority === 'medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">{rec.action}</span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {rec.type}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Potential Impact: {rec.impact} kW reduction
              </div>
              <div className="text-sm text-gray-600">
                Time Window: {new Date(rec.timeWindow.start).toLocaleTimeString()} -{' '}
                {new Date(rec.timeWindow.end).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DemandProfile;
