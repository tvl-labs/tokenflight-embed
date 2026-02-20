import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

const siteUrl = process.env.SITE_URL || 'https://embed.tokenflight.ai';
const ogImagePath = '/og/tokenflight-docs.png';
const ogImageUrl = new URL(ogImagePath, siteUrl).href;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

export default defineConfig({
  site: siteUrl,
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
      description: 'Build and customize TokenFlight Embed widgets for cross-chain swap and receive flows.',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'TokenFlight',
      },
      favicon: '/favicon.svg',
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: ogImageUrl } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'TokenFlight Embed documentation' } },
        { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: ogImageUrl } },
        { tag: 'meta', attrs: { name: 'twitter:image:alt', content: 'TokenFlight Embed documentation' } },
      ],
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
