// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.volnlabs.com',
  output: 'static',
  trailingSlash: 'never',
  adapter: vercel(),
  integrations: [sitemap()],
  redirects: {
    '/people': '/about',
    '/publications': '/research#papers',
    '/opensource': '/about#open-source',
    '/benchmarks': '/research',
    '/vision': '/axiomos',
    '/blog': '/',
    '/blog/operating-systems-not-frameworks': '/',
  },
});
