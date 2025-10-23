import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Channel Analyser Agent',
  description: 'Analyze YouTube competitor channels to follow their footprint profitably.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
