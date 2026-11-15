// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://whysoseriusbro.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Keep screenshots as separate cacheable files (never base64 in the HTML).
  vite: { build: { assetsInlineLimit: 0 } },
});
