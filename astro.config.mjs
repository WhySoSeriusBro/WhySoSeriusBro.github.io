// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://whysoseriusbro.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
