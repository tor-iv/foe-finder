import type { Metadata, Viewport } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
});

const spaceMono = Space_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'FoeFinder - Find Your Perfect Nemesis',
  description:
    'The only honest dating app. We match you with people who have the opposite opinions. Challenge your echo chamber.',
  keywords: ['dating', 'matching', 'opinions', 'debate', 'conversation'],
  authors: [{ name: 'FoeFinder' }],
  openGraph: {
    title: 'FoeFinder - Find Your Perfect Nemesis',
    description: 'The only honest dating app that matches opposites.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#d4d4d4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
