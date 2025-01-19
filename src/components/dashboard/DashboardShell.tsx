import React from 'react';
import DashboardHeader from './DashboardHeader';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface DashboardShellProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  user: User | null;
}

export function DashboardShell({
  children,
  navigation,
  user,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* Side Navigation */}
      <nav className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white border-r">
        <div className="flex flex-col flex-1 pt-5 pb-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-semibold text-gray-900">NEMS Dashboard</h1>
          </div>

          {/* Navigation Links */}
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {Icon && (
                      <Icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    )}
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <DashboardHeader user={user} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
