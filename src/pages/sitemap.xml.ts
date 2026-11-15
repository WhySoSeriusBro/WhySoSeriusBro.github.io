/** sitemap.xml with hreflang alternates for every page pair (SPEC §12). The root router page is not listed. */
import type { APIRoute } from 'astro';
import { allProjects, homePath, projectPath, site, type Lang } from '../lib/content';

const abs = (p: string) => new URL(p, site.person.siteUrl).href;

export const GET: APIRoute = () => {
  const pairs: Record<Lang, string>[] = [
    { en: homePath('en'), pt: homePath('pt') },
    ...allProjects.map((p) => ({ en: projectPath('en', p.id), pt: projectPath('pt', p.id) })),
  ];
  const alt = (paths: Record<Lang, string>) =>
    `<xhtml:link rel="alternate" hreflang="en" href="${abs(paths.en)}"/>` +
    `<xhtml:link rel="alternate" hreflang="pt-PT" href="${abs(paths.pt)}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(paths.en)}"/>`;
  const urls = pairs.flatMap((paths) => (['en', 'pt'] as const).map((l) => `<url><loc>${abs(paths[l])}</loc>${alt(paths)}</url>`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
