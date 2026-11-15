# Pendentes para o Cristiano

Estado no fim da Fase 8 (15 nov 2026). O site está completo e publicado; o que falta aqui é conteúdo que só tu podes dar. Nada disto parte o site: cada campo, link ou captura em falta simplesmente não aparece (ou mostra a ilustração), e passa a aparecer quando o acrescentares.

## 1. Links pessoais (`content/site.json → person.links`)

Todos estão a `null`, por isso hoje só aparece o GitHub. Quando preencheres, aparecem o botão "CV (PDF)" na barra e os botões no contacto, e entram no `sameAs` do JSON-LD.

| Campo | O que pôr |
|---|---|
| `email` | o endereço (sem `mailto:`) |
| `linkedin` | URL do perfil |
| `orcid` | URL do ORCID (`https://orcid.org/...`) |
| `googleScholar` | URL do perfil no Scholar |
| `cvPdf` | caminho do PDF (por exemplo `/cv.pdf`, depois de o pores em `public/`) ou um URL |

## 2. Links dos projetos (`content/projects.json`)

As etiquetas existem, os URLs não. Para cada projeto, acrescenta um mapa `"urls"` ao lado de `"stack"`, com a posição da etiqueta na lista `links` (igual em PT e EN). Exemplo para o LUNA: `"urls": { "0": "https://.../tese.pdf", "2": "https://github.com/..." }`.

| Projeto | Etiquetas à espera de URL |
|---|---|
| LUNA | Dissertação (PDF), Slides CANDO-EPE, Repositório |
| AI X Lab | AI X Lab |
| Gémeos digitais | Repositório, Tutorial (PDF) |
| PUREPOLIS | Aplicação, Artigo (quando publicado) |
| cir4fun-reuse | Showcase, Artigo (quando publicado) |
| Luzes por gestos | Repositório |
| TRMNL | Código do plugin |
| Painel de luzes | Repositório |
| TigTag | Repositório, Vídeo |
| Árvore QR | Experimentar |
| Planner da equipa | Aplicação, Repositório |
| Gerador Institucional | Aplicação |
| LusoNutri | Aplicação |
| HomeHunter | Repositório |
| Mapa 3D da EXPO FCT | Protótipo |

## 3. Lacunas de texto (`todo` em `content/projects.json`)

| Projeto | Campo | O que falta |
|---|---|---|
| LusoNutri | Problema | Descrever o problema que o LusoNutri resolve. |
| LusoNutri | O que construí | Descrever o que faz e como está construído. |
| LusoNutri | Resultado | Resultado ou estado atual. |
| Luzes por gestos | Resultado | Vídeo de demonstração. |
| Painel de luzes | Resultado | Fotografia do painel na secretária. |
| TigTag | Resultado | Vídeo curto de demonstração. |
| Árvore QR | Resultado | Incorporar o gerador ao vivo. |
| Planner da equipa | Resultado | Números de utilização da equipa. |
| Gerador Institucional | Resultado | Quanto tempo poupa por edição. |
| Mapa 3D da EXPO FCT | Resultado | Edição de estreia e número de visitantes. |

Para cada um, escreve o texto em `en` e `pt` e apaga a chave correspondente dentro de `todo`.

## 4. Capturas de ecrã

As 14 continuam em falta; a lista completa, com o que cada uma deve mostrar, está em [CAPTURAS.md](CAPTURAS.md). Resumo:
- **A teu cargo (8):** LUNA, gémeos digitais, TRMNL, P30, TigTag, newsletter em Word, HomeHunter, mapa da EXPO (só se houver protótipo).
- **Com link, capturo eu (3):** Árvore QR, agenda do Gerador Institucional, LusoNutri.
- **Com conta de demonstração (2):** PUREPOLIS (e o URL atual), Planner.
- **Bloqueada (1):** Showcase do cir4fun, por causa do certificado TLS de `fun4monster.cir4fun.grisenergia.pt`.

## 5. Publicações

Nenhuma tem URL ou DOI. Quando tiverem, acrescenta `"url"` à entrada em `site.json → publications`: o título passa a link e entra como `ScholarlyArticle` no JSON-LD.

## 6. Depois de 25 nov 2026

A tese aparece como "Defesa marcada, 25 nov 2026" no LUNA e nas publicações. Depois da defesa, diz-me o resultado e a redação exata; não muda sozinho.

## 7. Verificações que não consegui fazer daqui

- **Safari real (macOS ou iPhone).** O WebKit de teste no Windows não tem composição 3D (até um cubo CSS mínimo e o protótipo aparecem achatados), por isso não consigo ver a bancada como o Safari a mostra. Abre o site no iPhone e mexe na bancada.
- **Firefox.** O Windows bloqueou o Firefox de testes do Playwright; não desliguei essa proteção. Abre o site no teu Firefox.
- **Leitor de ecrã (NVDA ou TalkBack).** Verifiquei a árvore de acessibilidade (marcos, títulos, botões com nome, diálogo com título) e o axe não encontra nada, mas um teste com NVDA ou TalkBack a sério ainda é teu.
- **Android médio real.** Medi com o CPU 4× mais lento no Chrome; um telemóvel real é a confirmação final.
