import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
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

// Geist font (local)
const geist = localFont({
  src: [
    {
      path: '../fonts/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Geist-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Geist-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Geist-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
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
  openGraph: {
    title: 'BidDeed.AI | Foreclosure Intelligence',
    description: 'AI-powered foreclosure auction analysis',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakarta.variable} ${geist.variable} ${jetbrainsMono.variable} font-body bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
