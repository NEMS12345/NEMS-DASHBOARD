'use client';

import { useEffect, useState } from 'react';
import { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];

export default function TestPage() {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Location[] | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Fetching from API...');
        const response = await fetch('/api/test');
        const json = await response.json();

        if (!response.ok) {
          console.error('API error:', json);
          setError(json.error || 'API request failed');
          return;
        }

        console.log('API response:', json);
        setData(json.data);
      } catch (err) {
        console.error('Caught error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testConnection();
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-500 mb-2">Error:</h1>
        <pre className="bg-red-50 p-4 rounded">{error}</pre>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Test Page</h1>
      {data ? (
        <pre className="bg-gray-50 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
