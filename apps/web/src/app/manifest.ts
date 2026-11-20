import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iatrome!',
    short_name: 'iatrome',
    description: 'The party game that speaks fluent medicine.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9f9f9',
    theme_color: '#5aa9e6',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
