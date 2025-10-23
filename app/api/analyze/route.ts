import { NextRequest, NextResponse } from 'next/server';
import { computeStats, fetchChannelFeed } from '../../../lib/youtube';

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const { channel, items } = await fetchChannelFeed(url);

    // Optionally augment views by scraping individual video pages best-effort for last N
    // (kept minimal to avoid heavy requests and keep zero-integration cost)

    const stats = computeStats(items);

    const recommendations: string[] = [
      `Post ~${stats.avgUploadsPerWeek.toFixed(1)}/week on top days: ${top3Days(stats.postDaysHeatmap).join(', ')}`,
      `Target median views ≥ ${Intl.NumberFormat().format(Math.max(1, Math.round(stats.medianViews)))}`,
      `Aim titles around top keywords: ${stats.topKeywords.slice(0,5).map(k=>k.keyword).join(', ')}`,
      `Optimize RPM with longer retention; CPM range $${stats.estCpmUsd[0]}–$${stats.estCpmUsd[1]}`,
    ];

    return NextResponse.json({
      channel,
      summary: {
        avgUploadsPerWeek: stats.avgUploadsPerWeek,
        medianViews: stats.medianViews,
        estCpmUsd: stats.estCpmUsd,
        estRevenuePerVideoUsd: stats.estRevenuePerVideoUsd,
        postDaysHeatmap: stats.postDaysHeatmap,
        topKeywords: stats.topKeywords,
      },
      timeseries: stats.timeseries,
      recommendations
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}

function top3Days(map: Record<string, number>): string[] {
  return Object.entries(map)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,3)
    .map(([k])=>k);
}
