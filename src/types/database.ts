// src/types/database.ts

export interface Database {
    public: {
      Tables: {
        locations: {
          Row: {
            id: string;
            name: string;
            client_id: string;
          };
        };
        energy_data: {
          Row: {
            id: string;
            client_id: string;
            location_id: string;
            bill_date: string;
            usage_kwh: number;
            peak_demand_kw: number;
            total_cost: number;
            rate_type: string;
            reading_time: string;
            created_at?: string;
          };
        };
      };
    };
  }
