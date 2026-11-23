import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WhatFood Wangige — Supper Planner',
    short_name: 'WhatFood',
    description:
      'Budget-smart Kenyan supper roulette & Wangige Market shopping list (300–500 KES).',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF9EB',
    theme_color: '#FFC244',
    icons: [
      {
        src: '/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}