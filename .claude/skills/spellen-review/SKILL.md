---
name: spellen-review
description: "Review een branch of pull request van Spellen langs de harde regels en de kwaliteitsgate. Gebruik bij 'review deze PR', 'review sinds main', een laatste controle vóór merge, of een tweede paar ogen op een spelwijziging."
---

# Review van een Spellen-wijziging

Gebruik bij voorkeur ook de upstream-skill `code-review` voor de twee-assige
review (Standards en Spec). Deze skill vult de repo-specifieke checklist aan.

## Voorbereiden

```sh
git fetch origin main
git diff origin/main...HEAD
git log origin/main..HEAD --oneline
```

Zoek de oorspronkelijke issue, het plan of de ADR. Ontbreekt die, benoem dat en
review alleen de Standards-as.

## Checklist

**TypeScript en structuur**

- [ ] Alleen `.ts`/`.tsx`; geen `.js`, `.mjs`, `.cjs`, `.jsx` of `.py`.
- [ ] Juiste FSD-laag; geen import van een hogere laag.
- [ ] Import via de public API en de aliassen.
- [ ] Geen React of opslag in `libs/entities`.
- [ ] Geen nieuwe `!important`; cascade layers of een specifiekere selector.

**App en privacy**

- [ ] Geen analytics, tracker, CDN, webfont of remote image.
- [ ] CSP in `apps/games/public/_headers` ongewijzigd of bewust aangepast.
- [ ] Geen backend, account of netwerkdienst zonder ADR en akkoord.
- [ ] Geen secrets, `.env`-waarden, privéhosts, tailnet-namen, IP's of
      persoonsgegevens.
- [ ] LocalStorage-keys zijn versiegebonden en opgeruimd waar nodig.

**Spel en UI**

- [ ] `gameCatalog`, `GameIcon`, thumbnail en route kloppen.
- [ ] Spraakverklaring is expliciet; `audio:check` en `speech-coverage` groen.
- [ ] Touch-targets ≥ 44 px, 390 px en 1024 px gecontroleerd.
- [ ] Safe areas, toetsenbord, schermlezer en reduced motion.
- [ ] Copy is Nederlands, kort en kindgericht.

**Tests en docs**

- [ ] Pure regels hebben een test in `tests/node`.
- [ ] Nieuwe interactie heeft een test in `tests/web`.
- [ ] Belangrijke reis heeft e2e waar nodig.
- [ ] Coverage blijft ≥ 80%.
- [ ] Nieuwe beslissing heeft een ADR; `docs/README.md` en
      `docs/adr/README.md` zijn bijgewerkt.
- [ ] `README.md`, `AGENTS.md` of de relevante docs zijn bijgewerkt.

**Gate**

- [ ] `corepack pnpm run quality:full` is groen.
- [ ] CI is groen (`quality`, `e2e`, Workers Builds).
- [ ] De eigenaar heeft expliciet merge-akkoord gegeven.

## Rapporteren

Rapporteer per punt: wat je zag, waar (bestand:regel), en waarom het een
probleem is. Scheid **harde overtredingen** van **suggesties**. Noem geen
stijlvoorkeur als de tooling het al afdwingt.

## Grenzen

- Merge nooit zelfstandig, ook niet bij groene CI.
- Verander geen code tijdens een review tenzij de gebruiker dat vraagt.
- Vraag om bevestiging als de spec of het merge-akkoord ontbreekt.
