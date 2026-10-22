import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EMRProvider } from '@/context/EMRContext';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital Nursing Care EMR – Demo',
  description: 'Digital Nursing Care Web Application Demo. This is a demonstration application for testing and UI review only. Not for clinical use.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900`}>
        <EMRProvider>
          {children}
        </EMRProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
