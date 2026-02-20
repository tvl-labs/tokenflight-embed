import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

export default defineConfig({
  site: process.env.SITE_URL || 'https://embed.tokenflight.ai',
  output: 'static',
  adapter: cloudflare(),
  vite: {
    // Keep docs optimizer cache isolated from other workspace apps.
    cacheDir: './node_modules/.vite-docs',
    optimizeDeps: {
      include: [
        'prismjs',
        'prismjs/components/prism-markup',
        'prismjs/components/prism-javascript',
        'prismjs/components/prism-jsx',
      ],
    },
    server: {
      headers: noStoreHeaders,
    },
    preview: {
      headers: noStoreHeaders,
    },
  },
  integrations: [
    starlight({
      title: 'TokenFlight Embed',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'TokenFlight',
      },
      favicon: '/favicon.svg',
      customCss: ['./src/custom.css'],
      components: {
        Header: './src/components/Header.astro',
        Search: './src/components/Search.astro',
        Footer: './src/components/StarlightFooter.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/tvl-labs/tokenflight-embed',
        },
      ],
      sidebar: [
        { label: 'Home', slug: '' },
        { label: 'Getting Started', slug: 'getting-started' },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Examples',
          autogenerate: { directory: 'examples' },
        },
      ],
    }),
  ],
});
