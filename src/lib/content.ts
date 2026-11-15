/**
 * Typed loaders for everything in /content. The schemas run at build time,
 * so a malformed entry fails `astro build` with a readable message.
 */
import { z } from 'astro/zod';
import projectsRaw from '../../content/projects.json';
import siteRaw from '../../content/site.json';
import uiRaw from '../../content/ui-strings.json';
import screensRaw from '../../content/screens.json';

export const LANGS = ['en', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

const localized = z.object({ en: z.string().min(1), pt: z.string().min(1) });

const projectLang = z.object({
  hook: z.string().min(1),
  meta: z.string().optional(),
  cat: z.string().min(1),
  status: z.string().min(1),
  role: z.string(),
  problem: z.string(),
  built: z.string(),
  result: z.string(),
  links: z.array(z.string()),
  todo: z.record(z.string(), z.string()).optional(),
});

const project = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localized,
  stack: z.array(z.string()),
  spectrumWavelengthNm: z.number().min(380).max(780).optional(),
  urls: z.record(z.string(), z.url()).optional(),
  en: projectLang,
  pt: projectLang,
});

const projectsFile = z
  .object({
    sections: z.object({ research: z.array(z.string()), workbench: z.array(z.string()) }),
    projects: z.record(z.string(), project),
  })
  .superRefine((data, ctx) => {
    for (const [key, p] of Object.entries(data.projects)) {
      if (p.id !== key) ctx.addIssue({ code: 'custom', message: `projects.${key}.id is "${p.id}"` });
    }
    for (const [section, ids] of Object.entries(data.sections)) {
      for (const id of ids) {
        if (!data.projects[id]) ctx.addIssue({ code: 'custom', message: `sections.${section} lists unknown project "${id}"` });
      }
    }
    for (const id of data.sections.research) {
      if (data.projects[id]?.spectrumWavelengthNm === undefined) {
        ctx.addIssue({ code: 'custom', message: `research project "${id}" has no spectrumWavelengthNm` });
      }
    }
  });

const siteFile = z.object({
  person: z.object({
    name: z.string(),
    github: z.url(),
    siteUrl: z.url(),
    links: z.object({
      email: z.email().nullable(),
      linkedin: z.url().nullable(),
      orcid: z.url().nullable(),
      googleScholar: z.url().nullable(),
      cvPdf: z.string().min(1).nullable(),
    }),
  }),
  publications: z.array(
    z.object({
      year: z.number().int(),
      kind: localized,
      title: localized,
      status: z.enum(['presented', 'defence-scheduled', 'forthcoming', 'published']),
      updateAfter: z.string().optional(),
      url: z.url().optional(),
    }),
  ),
  theatre: z.object({
    group: z.string(),
    festival: z.object({ short: z.string(), full: z.string(), note: localized }),
    intro: localized,
    productions: z.array(
      z.object({
        year: z.number().int(),
        title: z.string(),
        basedOn: localized.optional(),
        role: localized,
        award: localized.optional(),
        sources: z.array(z.url()),
      }),
    ),
    writtenAndDirected: z.array(z.string()),
    doNotList: z.array(z.string()),
  }),
});

const uiFile = z
  .object({ en: z.record(z.string(), z.string()), pt: z.record(z.string(), z.string()) })
  .superRefine((data, ctx) => {
    for (const [a, b] of [['en', 'pt'], ['pt', 'en']] as const) {
      for (const key of Object.keys(data[a])) {
        if (!(key in data[b])) ctx.addIssue({ code: 'custom', message: `ui-strings: "${key}" exists in ${a} but not in ${b}` });
      }
    }
  });

const screensFile = z.object({
  screens: z.array(
    z.object({
      id: z.string(),
      project: z.string(),
      device: z.enum(['phone', 'phone-landscape', 'tablet-portrait', 'tablet-landscape', 'laptop', 'monitor', 'monitor-wide', 'eink-800x480', 'paper-a4', 'print-card']),
      viewport: z.tuple([z.number().int().positive(), z.number().int().positive()]),
      source: z.enum(['manual', 'url-public', 'url-login', 'url-or-manual']),
      how: z.string(),
      url: z.url().nullable(),
      urlNote: z.string().optional(),
      privacy: z.string(),
      redact: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).optional(),
      redactPt: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).optional(),
      /** Optional Playwright settings for scripts/capture.mjs. */
      capture: z
        .object({
          waitFor: z.string().optional(),
          delayMs: z.number().int().nonnegative().optional(),
          login: z
            .object({ url: z.url().optional(), user: z.string().optional(), pass: z.string().optional(), submit: z.string().optional(), after: z.string().optional() })
            .optional(),
          langs: z.record(z.enum(['en', 'pt']), z.object({ click: z.string().nullable().optional(), url: z.url().optional() })).optional(),
        })
        .optional(),
    }),
  ),
});

function parse<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`content/${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const projectsData = parse(projectsFile, projectsRaw, 'projects.json');
export const site = parse(siteFile, siteRaw, 'site.json');
export const ui = parse(uiFile, uiRaw, 'ui-strings.json');
export const screens = parse(screensFile, screensRaw, 'screens.json');

for (const s of screens.screens) {
  if (!projectsData.projects[s.project]) throw new Error(`content/screens.json: "${s.id}" points to unknown project "${s.project}"`);
}

export type Project = z.infer<typeof project>;
export type ProjectLang = z.infer<typeof projectLang>;

export const allProjects: Project[] = Object.values(projectsData.projects);
export const researchProjects = projectsData.sections.research.map((id) => projectsData.projects[id]!);
export const workbenchProjects = projectsData.sections.workbench.map((id) => projectsData.projects[id]!);

/** UI string lookup. Missing keys fail the build instead of rendering blanks. */
export function t(lang: Lang, key: string): string {
  const value = ui[lang][key];
  if (value === undefined) throw new Error(`ui-strings.json: missing key "${key}" for ${lang}`);
  return value;
}

/** Case-study fields in display order. A field with a todo or an empty value is omitted. */
export const CASE_FIELDS = [
  ['role', 'd.role'],
  ['problem', 'd.problem'],
  ['built', 'd.built'],
  ['result', 'd.result'],
] as const;

export function caseFields(p: Project, lang: Lang) {
  const l = p[lang];
  return CASE_FIELDS.filter(([field]) => l[field].trim() !== '' && !l.todo?.[field]).map(([field, labelKey]) => ({
    field,
    label: t(lang, labelKey),
    value: l[field],
  }));
}

/** Links render only when a URL exists for the label (urls map keyed by label index). */
export function projectLinks(p: Project, lang: Lang) {
  const urls = p.urls ?? {};
  return p[lang].links.flatMap((label, i) => {
    const href = urls[String(i)];
    return href ? [{ label, href }] : [];
  });
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'pt' : 'en';
}

export const htmlLang: Record<Lang, string> = { en: 'en', pt: 'pt-PT' };

export function homePath(lang: Lang) {
  return `/${lang}/`;
}
export function projectPath(lang: Lang, id: string) {
  return `/${lang}/projects/${id}/`;
}

/** Open todos, for the end-of-phase report. */
export function openTodos() {
  return allProjects.flatMap((p) => Object.entries(p.en.todo ?? {}).map(([field, note]) => ({ id: p.id, field, note })));
}
