/** Structured data and sharing metadata (SPEC §12). */
import { site, t, homePath, htmlLang, type Lang } from './content';

export const OG = { width: 1200, height: 630 } as const;
export const ogLocale: Record<Lang, string> = { en: 'en_GB', pt: 'pt_PT' };

export function ogImage(lang: Lang) {
  return new URL(`/og/${lang}.png`, site.person.siteUrl).href;
}

/** Serialise JSON-LD safely for a <script> element ('<' can never close it). */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}

function sameAs(): string[] {
  const l = site.person.links;
  return [site.person.github, l.linkedin, l.orcid, l.googleScholar].filter((x): x is string => Boolean(x));
}

export function personRef() {
  return { '@type': 'Person', '@id': `${site.person.siteUrl}/#person`, name: site.person.name, url: site.person.siteUrl };
}

/** Home page: a ProfilePage whose main entity is the Person. */
export function homeJsonLd(lang: Lang) {
  const sd = site.person.structuredData;
  const url = new URL(homePath(lang), site.person.siteUrl).href;
  const person = {
    ...personRef(),
    jobTitle: sd.jobTitle,
    description: t(lang, 'hero.lede'),
    worksFor: { '@type': 'Organization', name: sd.worksFor },
    alumniOf: { '@type': 'CollegeOrUniversity', name: sd.alumniOf },
    knowsAbout: sd.knowsAbout,
    sameAs: sameAs(),
    ...(site.person.links.email ? { email: `mailto:${site.person.links.email}` } : {}),
  };
  const graph: unknown[] = [{ '@type': 'ProfilePage', '@id': `${url}#page`, url, name: t(lang, 'meta.title'), inLanguage: htmlLang[lang], mainEntity: person }];
  // Publications become ScholarlyArticle only once they have a URL or DOI.
  for (const pub of site.publications) {
    if (!pub.url) continue;
    graph.push({ '@type': 'ScholarlyArticle', headline: pub.title[lang], datePublished: String(pub.year), url: pub.url, author: personRef() });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
