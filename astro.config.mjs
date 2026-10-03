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
  integrations: [sitemap({ filter: (page) => !page.includes('/pitch') })],
  redirects: {
    '/people': '/research#people',
    '/publications': '/research#papers',
    '/opensource': '/research',
    '/benchmarks': '/research',
    '/vision': '/',
    '/contact': '/',
    '/blog': '/',
    '/blog/operating-systems-not-frameworks': '/',
  },
});