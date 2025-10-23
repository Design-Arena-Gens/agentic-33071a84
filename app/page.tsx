import AnalyzerClient from '../components/AnalyzerClient';

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Advance YouTube Competitor Channel Analyser</h1>
      <p className="text-gray-600 mb-8">Follow winning footprints: content cadence, topics, thumbnails, keywords, and monetization patterns — at zero integration cost.</p>
      <AnalyzerClient />
      <footer className="mt-16 text-sm text-gray-500">Built for Vercel deployment.</footer>
    </main>
  );
}
