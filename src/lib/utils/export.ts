// src/lib/utils/export.ts

import { DateRangePickerValue } from '@tremor/react';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatExportFilename = (
  type: 'csv' | 'pdf',
  dateRange: DateRangePickerValue,
  location: string
): string => {
  const fromDate = dateRange.from ? formatDate(dateRange.from) : 'start';
  const toDate = dateRange.to ? formatDate(dateRange.to) : 'end';
  const locationStr = location === 'all' ? 'all-locations' : `location-${location}`;

  return `nems-energy-data-${locationStr}-${fromDate}-to-${toDate}.${type}`;
};

export const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string): void => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const cell = row[header];
        // Handle different types of values
        if (cell === null || cell === undefined) {
          return '';
        }
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        if (typeof cell === 'object') {
          return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
        }
        return String(cell);
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
