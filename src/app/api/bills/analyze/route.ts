import { NextRequest, NextResponse } from 'next/server';
import { billAnalyzer } from '@/lib/claude/billAnalyzer';
import type { CostBreakdown } from '@/types/cost-analysis';
import type { EnergyData } from '@/types/energy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { breakdown, usageData } = body as {
      breakdown: CostBreakdown;
      usageData: EnergyData[];
    };

    if (!breakdown || !usageData) {
      return NextResponse.json(
        { error: 'Missing required fields: breakdown and usageData' },
        { status: 400 }
      );
    }

    const analysis = await billAnalyzer.analyze(breakdown, usageData);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in bill analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze bill' },
      { status: 500 }
    );
  }
}
