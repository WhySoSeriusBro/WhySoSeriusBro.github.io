import type { APIRoute } from 'astro';
import { site } from '../lib/content';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site.person.siteUrl).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
