import React, { useState } from 'react';
import type { DateRangePickerValue } from '@tremor/react';
import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];

interface HeaderUser {
  initials: string;
  name: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface DashboardHeaderProps {
  selectedLocation?: string;
  onLocationChange?: (locationId: string) => void;
  dateRange?: DateRangePickerValue;
  onDateRangeChange?: (range: DateRangePickerValue) => void;
  locations?: Location[];
  loading?: boolean;
  user?: User | null;
}
import {
  Bell,
  Building2,
  ChevronDown,
  Calendar,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const dateRanges = [
  { label: 'Last 7 Days', value: 'last-7' },
  { label: 'Last 30 Days', value: 'last-30' },
  { label: 'Last 90 Days', value: 'last-90' },
  { label: 'Custom Range', value: 'custom' },
];

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'usage', label: 'Usage' },
  { id: 'demand', label: 'Demand' },
  { id: 'cost', label: 'Cost' },
  { id: 'reports', label: 'Reports' },
] as const;

type NavItem = typeof navItems[number]['id'];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedLocation,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  locations,
  loading = false,
  user
}) => {
  // Convert date range value to a label for display
  const getDateRangeLabel = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) return 'Select date range';

    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 7) return 'Last 7 Days';
    if (diffDays === 30) return 'Last 30 Days';
    if (diffDays === 90) return 'Last 90 Days';

    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  };

  // Handle date range selection
  const handleDateRangeSelect = (value: string) => {
    const now = new Date();
    let from: Date;

    switch (value) {
      case 'last-7':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last-30':
        from = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'last-90':
        from = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        return;
    }

    onDateRangeChange?.({ from, to: new Date() });
    setIsDatePickerOpen(false);
  };
  const [activeNav, setActiveNav] = useState<NavItem>('overview');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const defaultUser: HeaderUser = {
    initials: 'JD',
    name: 'John Doe',
    role: 'Administrator',
  };

  const displayUser = user ? {
    initials: user.name.split(' ').map((n: string) => n[0]).join(''),
    name: user.name,
    role: 'User'
  } : defaultUser;

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col">
          {/* Company and User Bar */}
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 border-b">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-gray-900">NEMS Energy</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                Enterprise
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-900"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 group"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{displayUser.initials}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-2 px-4 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{displayUser.name}</div>
                      <div className="text-xs text-gray-500">{displayUser.role}</div>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Settings
                      </button>
                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Controls Bar */}
          <div className="flex items-center justify-between py-3 px-4">
            {/* Location Selector */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={selectedLocation}
                  onChange={(e) => onLocationChange?.(e.target.value)}
                  disabled={loading}
                  className="pl-9 pr-4 py-2 bg-white border rounded-lg text-sm w-full appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Controls */}
            <div className="flex items-center space-x-4 ml-6">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-gray-100"
                  aria-label="Previous period"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-gray-50"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    aria-expanded={isDatePickerOpen}
                    aria-haspopup="true"
                  >
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {getDateRangeLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isDatePickerOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        {dateRanges.map((range) => (
                          <button
                            key={range.value}
                            type="button"
                            className={`block w-full px-4 py-2 text-sm text-left ${
                              getDateRangeLabel() === range.label
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              handleDateRangeSelect(range.value);
                            }}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-gray-100"
                  aria-label="Next period"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <button
                type="button"
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 border-t">
            <nav className="flex space-x-1" role="navigation">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    activeNav === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  aria-label="Search"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
