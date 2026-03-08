import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BidDeed.AI | Agentic AI Ecosystem for Foreclosure Intelligence',
  description:
    'AI-powered foreclosure auction intelligence platform. Analyze properties, assess risks, and make informed bidding decisions with The Everest Ascent™ pipeline.',
  keywords: [
    'foreclosure auction',
    'real estate AI',
    'property analysis',
    'BidDeed',
    'Brevard County',
    'foreclosure investing',
  ],
  authors: [{ name: 'Everest Capital USA' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-body antialiased bg-slate-950 text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
