import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: process.env.SITE_URL || 'https://embed.tokenflight.ai',
  output: 'static',
  adapter: cloudflare(),
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
