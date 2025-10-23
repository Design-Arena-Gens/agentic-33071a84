"use client";

import { useState } from 'react';
import { z } from 'zod';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, TimeScale);

const Input = z.object({
  channelUrl: z.string().url()
});

type Analysis = {
  channel: {
    title: string;
    url: string;
    subscriberEstimate: string | null;
  };
  summary: {
    avgUploadsPerWeek: number;
    medianViews: number;
    estCpmUsd: [number, number];
    estRevenuePerVideoUsd: [number, number];
    postDaysHeatmap: { [weekday: string]: number };
    topKeywords: Array<{ keyword: string; score: number }>;
  };
  timeseries: Array<{ date: string; views: number; title: string }>;
  recommendations: string[];
};

export default function AnalyzerClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Analysis | null>(null);

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    const parse = Input.safeParse({ channelUrl: url.trim() });
    if (!parse.success) {
      setError("Enter a valid channel or video URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(parse.data.channelUrl)}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? "Failed to analyze.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <form onSubmit={onAnalyze} className="flex flex-col gap-3 mb-6 md:flex-row">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste YouTube channel or video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {data && (
        <div className="grid gap-6">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="text-xl font-semibold">Channel Overview</h2>
            <p className="text-gray-600">{data.channel.title} — <a className="text-blue-600 underline" href={data.channel.url} target="_blank">Visit</a></p>
            {data.channel.subscriberEstimate && (
              <p className="text-sm text-gray-500">Subscriber estimate: {data.channel.subscriberEstimate}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <StatCard title="Avg uploads/week" value={data.summary.avgUploadsPerWeek.toFixed(2)} />
            <StatCard title="Median views" value={Intl.NumberFormat().format(data.summary.medianViews)} />
            <StatCard title="Est revenue/video" value={`$${data.summary.estRevenuePerVideoUsd[0].toFixed(0)}–$${data.summary.estRevenuePerVideoUsd[1].toFixed(0)}`} />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold mb-2">Posting cadence and views</h3>
            <Line
              data={{
                labels: data.timeseries.map((t) => t.date),
                datasets: [
                  {
                    label: 'Views',
                    data: data.timeseries.map((t) => t.views),
                    fill: false,
                    borderColor: 'rgb(37, 99, 235)'
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const }
                },
                scales: {
                  y: { ticks: { callback: (v) => Intl.NumberFormat().format(Number(v)) } }
                }
              }}
            />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold mb-2">Best posting weekdays</h3>
            <Bar
              data={{
                labels: Object.keys(data.summary.postDaysHeatmap),
                datasets: [
                  {
                    label: 'Uploads',
                    data: Object.values(data.summary.postDaysHeatmap),
                    backgroundColor: 'rgba(37, 99, 235, 0.6)'
                  }
                ]
              }}
              options={{ responsive: true }}
            />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold mb-2">Top keywords</h3>
            <ul className="grid md:grid-cols-2 gap-2">
              {data.summary.topKeywords.map((k) => (
                <li key={k.keyword} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{k.keyword}</span>
                  <span className="text-gray-500">{k.score.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold mb-2">Actionable playbook</h3>
            <ol className="list-decimal ml-5 space-y-2">
              {data.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
