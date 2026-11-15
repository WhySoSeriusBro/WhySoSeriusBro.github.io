# Capturas de ecrã: lista para o Cristiano

Cada captura vai para `assets/screens/raw/` com o nome exato da coluna **Ficheiro**. Se a interface em português for diferente, acrescenta também `<id>.pt.png`. Formato PNG, pelo menos do tamanho indicado; maior também serve, o pipeline corta a partir do topo e reduz.

Depois corre `npm run screens` (ou só `npm run build`). O que faltar fica com a ilustração atual da bancada e aparece como aviso, nunca como erro.

**Privacidade:** só dados de demonstração. Se aparecer um nome, email, morada, telefone, avatar, token ou chat id real, não edites a imagem à mão: diz-me as coordenadas (ou deixa-me vê-la) e eu acrescento `"redact": [[x, y, largura, altura]]` ao `content/screens.json`, que desfoca essa zona antes de tudo o resto.

## A teu cargo (8)

| # | Ficheiro | Projeto | Dispositivo na bancada | Tamanho | O que deve mostrar | Atenção |
|---|---|---|---|---|---|---|
| 1 | `luna-dashboard.png` | LUNA | Telemóvel, vertical | 412 × 860 | O dashboard web do ESP32 aberto no telemóvel (rede BarataEletronics, 192.168.4.1), com uma leitura em direto e o gráfico de calibração visíveis. De preferência durante uma medição real. | Nada a esconder. |
| 2 | `twins-dashboard.png` | Gémeos digitais | Monitor largo | 1600 × 800 | O `DEMO.html` do faaast-esp32_v2 a correr localmente (`ARRANCAR.ps1`), com valores em direto e o acordo de contrato. | Esconde tokens ou chaves de API que apareçam. |
| 3 | `trmnl-weather.png` | TRMNL | Ecrã e-ink 7,5" | 800 × 480 | A imagem de 800 × 480 que o Terminus gera para o plugin Open-Meteo (descarrega-a da pré-visualização do Terminus), ou uma foto de frente do aparelho, recortada. | Mostra o nome da cidade, nunca a morada. O pipeline converte para tons de cinzento com aspeto de e-ink. |
| 4 | `p30-lights.png` | Dashboard de luzes P30 | Telemóvel na horizontal, num suporte | 1080 × 500 | Captura no Huawei P30 Pro do dashboard das luzes, na horizontal. | Nada a esconder. |
| 5 | `tigtag-macros.png` | TigTag | Telemóvel, vertical | 412 × 860 | Captura Android da lista de macros do TigTag (luz da cozinha, autocarro para o trabalho). | Se o ecrã de definições estiver visível, esconde o token do GitHub. |
| 6 | `gerador-word.png` | Gerador Institucional | Folha A4 impressa ao lado do monitor | 794 × 1123 | A primeira página de uma newsletter `.docx` gerada, exportada para PNG. | O pipeline passa-a a tinta cinzenta sobre papel. |
| 7 | `homehunter-list.png` | HomeHunter | Portátil | 1440 × 810 | A app a correr localmente (`iniciar.bat`, localhost:8000), com a tabela de anúncios e filtros aplicados. | Os anúncios são públicos; esconde chat ids do Telegram e notas pessoais. |
| 8 | `expo-map.png` | Mapa 3D da EXPO FCT | Tablet, horizontal | 1180 × 820 | A vista 3D do campus no protótipo. | Se ainda não houver protótipo, não mandes nada: fica a ilustração e o projeto aparece como "Em planeamento". |

## Com um link teu, capturo eu (3)

Para estes, basta mandares-me o URL (e confirmar que posso usar a página tal como está). Se preferires, também podes mandar o PNG.

| # | Ficheiro | Projeto | Dispositivo | Tamanho | O que deve mostrar | Atenção |
|---|---|---|---|---|---|---|
| 9 | `arvore-qr.png` | Árvore QR | Cartão impresso | 800 × 800 | Um QR gerado com a sua árvore voxel, exportado da página da Árvore QR (botão de exportar, ou captura do canvas). | O QR deve apontar para `https://whysoseriusbro.github.io`, para quem o ler voltar ao site. |
| 10 | `gerador-agenda.png` | Gerador Institucional | Monitor | 1440 × 820 | A lista da agenda depois da extração, com a ação "Gerar Word" visível. | Só eventos públicos da faculdade. |
| 11 | `lusonutri-home.png` | LusoNutri | Tablet, vertical | 768 × 1024 | O ecrã principal da LusoNutri. | Só dados de demonstração. |

## Com uma conta de demonstração tua (2)

Preciso do URL atual e de uma conta **de demonstração** (nunca uma conta real de cidadão ou de colega). As credenciais ficam só no teu PC, num ficheiro `.env.screens` na raiz do repositório, que o git ignora:

```
SCREEN_PUREPOLIS_CITIZEN_USER=...
SCREEN_PUREPOLIS_CITIZEN_PASS=...
SCREEN_PLANNER_BOARD_USER=...
SCREEN_PLANNER_BOARD_PASS=...
```

Depois corres `npm run capture -- purepolis-citizen planner-board`. Eu não escrevo nem leio as palavras-passe.

| # | Ficheiro | Projeto | Dispositivo | Tamanho | O que deve mostrar | Atenção |
|---|---|---|---|---|---|---|
| 12 | `purepolis-citizen.png` | PUREPOLIS | Telemóvel, vertical | 412 × 860 | Sessão iniciada como cidadão de demonstração, no mapa inicial, dentro de uma zona com questionário ativo, para aparecer o aviso de elegibilidade. | O URL pode ter mudado com a passagem para a UNINOVA/GRIS (`purepolis-app.vercel.app` era o antigo). Nunca uma conta real. |
| 13 | `planner-board.png` | Planner da equipa | Monitor largo | 1600 × 800 | Um plano com várias colunas e cartões. | Plano de demonstração com tarefas inventadas, ou digo-te onde desfocar nomes e avatares de colegas. |

## Automática (1), mas bloqueada

| # | Ficheiro | Projeto | Dispositivo | Tamanho | O que deve mostrar | Estado |
|---|---|---|---|---|---|---|
| 14 | `cir4fun-showcase.png` e `.pt.png` | cir4fun-reuse | Portátil | 1440 × 810 | O catálogo público do Showcase, em EN e em PT, com o seletor de idioma. | **Bloqueada:** `https://fun4monster.cir4fun.grisenergia.pt` apresenta um certificado TLS em que este computador não confia (`ERR_CERT_AUTHORITY_INVALID`). Não desligo a verificação de certificados. Ou o certificado do site é corrigido (GRIS), ou mandas-me as duas capturas tiradas no teu browser. |
