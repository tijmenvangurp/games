# Agent-harness: skills en MCP's

Deze repository ondersteunt **OpenCode, Claude Code en Codex**. **APM (Agent
Package Manager)** beheert de skills: het leest `apm.yml`, pint de herkomst in
`apm.lock.yaml` en deployt naar `.agents/skills/` (OpenCode en Codex) en
`.claude/skills/` (Claude Code).

De app zelf is en blijft statisch: ze doet tijdens het spelen geen externe
requests. MCP-servers zijn **ontwikkeltooling**. Ze draaien naast de agent en
veranderen niets aan de CSP of de runtime van de app.

| Tool        | Instructies | Skills            | MCP                  |
| ----------- | ----------- | ----------------- | -------------------- |
| OpenCode    | `AGENTS.md` | `.agents/skills/` | `opencode.jsonc`     |
| Claude Code | `CLAUDE.md` | `.claude/skills/` | `.mcp.json`          |
| Codex       | `AGENTS.md` | `.agents/skills/` | `.codex/config.toml` |

## Eerste keer

Installeer eerst de APM CLI. Gebruik de officiële installer, of op systemen
waar de native binary niet start (glibc < 2.38, zoals Debian 12):

```sh
curl -sSL https://aka.ms/apm-unix | sh
# of:
uv tool install apm-cli==0.35.0
```

Daarna:

```sh
corepack pnpm install
corepack pnpm run harness:install
opencode mcp list
```

`harness:install` draait twee APM-commando's: het installeert de skills voor
alle drie de tools en schrijft de MCP's voor Claude Code en Codex.
`corepack pnpm install` installeert de lokale MCP-binaries `fallow-mcp` en
`nx-mcp`. Voor OpenCode staan de MCP's in `opencode.jsonc`; gebruik `/mcps` in
de TUI om de status te zien en om je voor Context7 aan te melden. Claude Code
leest `.mcp.json`; Codex leest `.codex/config.toml`.

## Skills

Er zijn twee soorten skills:

| Soort            | Bron                          | Gedeployed naar                        |
| ---------------- | ----------------------------- | -------------------------------------- |
| Projectspecifiek | `.apm/skills/<naam>/SKILL.md` | `.agents/skills/` en `.claude/skills/` |
| Upstream         | `apm.yml` + `apm.lock.yaml`   | `.agents/skills/` en `.claude/skills/` |

OpenCode en Codex lezen `.agents/skills/`; Claude Code leest `.claude/skills/`.
De bron is één keer `.apm/skills/`; pas die aan en draai `harness:install` om de
doelen bij te werken.

APM beheert de upstream-set. De bronnen en hun commits staan in `apm.yml`; de
resolved commits, hashes en gedeployde bestanden in `apm.lock.yaml`. Committeer
beide. `apm_modules/` is een cache en staat in `.gitignore`.

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

De gebruikte bronnen zijn [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT) en [cloudflare/skills](https://github.com/cloudflare/skills) (Apache 2.0).
De licentieteksten staan in `LICENSES/`.

```sh
apm update --yes
apm install --only apm --no-policy
git diff --stat
```

Controleer de diff vóór je commit. APM kan een skill hernoemen of een bestand
toevoegen; de lockfile maakt zichtbaar wat er precies is veranderd. Een
upstream-skill die je lokaal aanpast, wordt bij de volgende update
overschreven; zet eigen regels liever in een `spellen-*`-skill.

De commits in `apm.yml` zijn bewust gepind. Verhoog een `ref` alleen bewust en
laat `apm update` daarna de lockfile bijwerken.

### Een upstream-skill toevoegen

Voor een losse skill uit een repository:

```sh
apm install owner/repo/skills/<naam> --target opencode
```

Voor een bundel met een subset:

```sh
apm install owner/repo --skill <naam> --target opencode
```

Daarna staat de afhankelijkheid in `apm.yml`. Controleer de diff en commit
`apm.yml`, `apm.lock.yaml` en de nieuwe bestanden in `.agents/skills/`.

## MCP-servers

APM schrijft de MCP's uit `dependencies.mcp` naar de tools die het ondersteunt:

| Tool        | Bestand              | Beheer                            |
| ----------- | -------------------- | --------------------------------- |
| OpenCode    | `opencode.jsonc`     | Handmatig, tot APM #3112 klaar is |
| Claude Code | `.mcp.json`          | APM                               |
| Codex       | `.codex/config.toml` | APM                               |

OpenCode staat er bewust nog buiten: APM 0.35 schrijft voor OpenCode de
V1-vorm (`mcp: { naam: ... }`), terwijl OpenCode V2 `mcp.servers` leest. Zodra
[microsoft/apm#3112](https://github.com/microsoft/apm/issues/3112) is opgelost
en in een release zit, verhuist OpenCode ook naar de APM-uitvoer. Zie ook
[PR #3414](https://github.com/microsoft/apm/pull/3414).

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

De OpenCode-regels staan in `opencode.jsonc`. MCP-tools draaien standaard via
Code Mode en vallen daarmee onder de bestaande `execute`-permissie. Voeg geen
brede `allow`-regels toe voor een MCP die je niet nodig hebt; zet de server dan
gewoon niet aan. Claude Code en Codex hebben hun eigen configuratie in
`.mcp.json` en `.codex/config.toml`.

Fallow en Nx niet tegelijk draaien: Fallow schrijft `.fallow/` en kan de
Nx-daemon laten stoppen. Zie `docs/tooling.md`.

## Een projectspecifieke skill toevoegen

1. Maak `.apm/skills/<naam>/SKILL.md` en draai `corepack pnpm run harness:install`.
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
