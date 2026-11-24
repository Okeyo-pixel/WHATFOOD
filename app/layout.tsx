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
  title: 'Let Me Cook? | Kenyan Supper & Craving Planner',
  description:
    '112+ Kenyan bachelor & middle-class suppers, regional classics, and street bites from 80 to 500 bob.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/pwa-icon/192',
    apple: '/pwa-icon/192',
  },
  appleWebApp: {
    capable: true,
    title: 'Let Me Cook?',
    statusBarStyle: 'default',
  },
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
      <body
        className={`${jakarta.className} antialiased min-h-screen bg-glovo-cream text-gray-900`}
      >
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}