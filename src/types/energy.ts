export interface RawEnergyReading {
  id: string;
  location_id: string;
  bill_date: string;
  peak_demand_kw: number;
  created_at: string;
}

export interface EnergyData extends Record<string, unknown> {
  timestamp: string;
  value: number;
  [key: string]: unknown;
}

export interface AggregatedData {
  total: number;
  average: number;
}

export interface EnergyDataResponse {
  data: EnergyData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  aggregatedData?: AggregatedData;
}
