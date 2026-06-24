import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { RoutePanel } from '@/components/d4d/RoutePanel';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash: apply theme before render */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('biddeed-theme') || 'light';
              if (t === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body
        className={`${GeistSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        {children}
        <RoutePanel />
      </body>
    </html>
  );
}
