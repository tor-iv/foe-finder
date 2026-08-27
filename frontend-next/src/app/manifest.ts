import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FoeFinder',
    short_name: 'FoeFinder',
    description: 'The Only Honest Dating App',
    start_url: '/',
    display: 'standalone',
    background_color: '#d4d4d4',
    theme_color: '#0066ff',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  };
}
