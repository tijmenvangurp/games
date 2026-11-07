# Agent-harness: skills en MCP's

Deze repository is met OpenCode V2 ingericht. Deze pagina beschrijft welke
skills en MCP-servers iedere contributor nodig heeft, welke data de deur uit
gaat en wat privé blijft.

De app zelf is en blijft statisch: ze doet tijdens het spelen geen externe
requests. MCP-servers zijn **ontwikkeltooling**. Ze draaien naast de agent en
veranderen niets aan de CSP of de runtime van de app.

## Eerste keer

```sh
corepack pnpm install
opencode mcp list
```

`corepack pnpm install` installeert ook `fallow-mcp` en `nx-mcp`. Daarna start
OpenCode de servers uit `opencode.jsonc` automatisch. Gebruik `/mcps` in de TUI
om de status te zien en om je aan te melden.

## Skills

Er zijn twee soorten skills:

| Soort            | Locatie                            | Beheer                                           |
| ---------------- | ---------------------------------- | ------------------------------------------------ |
| Projectspecifiek | `.opencode/skills/<naam>/SKILL.md` | Handmatig, in deze repo                          |
| Upstream         | `.agents/skills/<naam>/SKILL.md`   | Via `npx skills`, herkomst in `skills-lock.json` |

OpenCode leest beide automatisch. `.opencode/skills` heeft voorrang op
`.agents/skills` als dezelfde id twee keer bestaat.

Gebruik je Claude Code? Maak dan eenmalig de links naar de gedeelde set:

```sh
npx --yes skills@latest experimental_sync -a claude-code -y
```

`.claude/skills/` staat in `.gitignore`; de inhoud blijft in `.agents/skills/`.

### Projectspecifieke skills

| Skill             | Waarvoor                                                        |
| ----------------- | --------------------------------------------------------------- |
| `spellen-game`    | Een spel end-to-end toevoegen of uitbreiden.                    |
| `spellen-quality` | De kwaliteitsgate draaien en veelvoorkomende fouten oplossen.   |
| `spellen-ui`      | Design system volgen en het resultaat visueel controleren.      |
| `spellen-audio`   | Spraakcatalogus, audio genereren en de coverage-test.           |
| `spellen-deps`    | Een bibliotheek kiezen volgens "bibliotheken eerst".            |
| `spellen-review`  | Een diff reviewen langs de harde regels van deze repo.          |
| `spellen-adr`     | Een architectuur-, privacy- of deploymentbeslissing vastleggen. |

### Upstream-skills bijwerken

De inhoud staat in de repo, zodat een clone direct dezelfde skills heeft. De
herkomst en hashes staan in `skills-lock.json`.

```sh
npx --yes skills@latest list
npx --yes skills@latest update -p -y
git diff --stat
```

Controleer de diff vóór je commit. Upstream kan een skill hernoemen of een
bestand toevoegen. Een upstream-skill die je lokaal aanpast, wordt bij de
volgende update overschreven; zet eigen regels liever in een `spellen-*`-skill.

Zet bij het installeren of bijwerken `DISABLE_TELEMETRY=1` en
`DO_NOT_TRACK=1`. De CLI stuurt dan geen telemetrie.

De gebruikte upstream-bronnen zijn [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT) en [cloudflare/skills](https://github.com/cloudflare/skills) (Apache 2.0).
De licentieteksten staan in `LICENSES/`.

## MCP-servers

Deze drie staan in `opencode.jsonc` en zijn voor iedereen bruikbaar:

| Server     | Type   | Authenticatie | Waarvoor                                          |
| ---------- | ------ | ------------- | ------------------------------------------------- |
| `fallow`   | local  | geen          | Dead code, grenzen en CSS-regels.                 |
| `nx`       | local  | geen          | Projectgraaf, generators en workspace-informatie. |
| `context7` | remote | OAuth         | Actuele documentatie van bibliotheken.            |

`context7` vraagt bij de eerste keer om een browser-login. Klik in `/mcps` op
de server en doorloop de OAuth-flow. Er staat geen API-key in de repo.

### Optioneel en privé

Deze servers horen **niet** in deze publieke repo:

| Server                 | Waarom niet                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `cloudflare-api`       | Geeft toegang tot een Cloudflare-account. Alleen voor de eigenaar of een maintainer met OAuth-scopes.   |
| `firecrawl`            | Vereist een account of een privé-endpoint. `webfetch` en `websearch` zijn genoeg voor gewoon onderzoek. |
| `clio-rag`             | Wijst naar een privé-knowledgebase en een privé-host.                                                   |
| TTS- en Telegram-tools | Bevatten privé-credentials en privépaden.                                                               |

Zet zulke servers in je **globale** `~/.config/opencode/opencode.json`, nooit in
deze repo. Gebruik geen hostnames, tokens, `.env`-waarden, chat-ID's of
persoonsgegevens in een commit, screenshot of prompt.

## Welke data verlaat de machine?

| Server                 | Data                                         | Waar naartoe                               |
| ---------------------- | -------------------------------------------- | ------------------------------------------ |
| `fallow`               | Bestanden en analyse-uitvoer                 | Lokaal                                     |
| `nx`                   | Projectgraaf en workspace-info; `nx_docs`    | Lokaal; `nx_docs` haalt Nx-documentatie op |
| `context7`             | Zoekvraag, bibliotheeknaam en codefragmenten | context7.com                               |
| `webfetch`/`websearch` | De opgevraagde URL of zoekvraag              | De gekozen publieke bron                   |

Plaats dus geen secrets, privépaden of kindgegevens in een MCP-prompt. De app
verstuurt zelf nog steeds niets.

## Permissies

De regels staan in `opencode.jsonc`. MCP-tools draaien standaard via Code Mode
en vallen daarmee onder de bestaande `execute`-permissie. Voeg geen brede
`allow`-regels toe voor een MCP die je niet nodig hebt; zet de server dan
gewoon niet aan.

Fallow en Nx niet tegelijk draaien: Fallow schrijft `.fallow/` en kan de
Nx-daemon laten stoppen. Zie `docs/tooling.md`.

## Een skill toevoegen

1. Maak `.opencode/skills/<naam>/SKILL.md`.
2. Zet bovenaan:

   ```md
   ---
   name: <naam>
   description: <wanneer de agent deze skill moet gebruiken>
   ---
   ```

3. Houd de skill kort en verwijs naar een bestaand document in plaats van het
   te kopiëren. Zo blijft er één bron van waarheid.
4. Noem geen geheimen, privéhosts of persoonsgegevens.
5. Draai `corepack pnpm run quality:full`.

Een skill zonder `description` wordt niet aan de agent aangeboden. De mapnaam
is de id en moet gelijk zijn aan de `name` in de frontmatter.
