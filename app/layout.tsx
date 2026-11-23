import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhatFood Wangige | Personal Supper Planner',
  description:
    'Budget-smart, balanced supper roulette & Wangige Market shopping list (300–500 KES) by Maurice Okeyo.',
};

export const viewport: Viewport = {
  themeColor: '#FFC244',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} antialiased min-h-screen bg-glovo-cream text-gray-900`}>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}