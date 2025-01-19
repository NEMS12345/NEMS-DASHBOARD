import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('API: Testing Supabase connection...');
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('API: Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Supabase response:', data);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('API: Caught error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
