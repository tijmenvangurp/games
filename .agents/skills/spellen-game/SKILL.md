---
name: spellen-game
description: "Voeg een spel end-to-end toe of breid een bestaand spel uit in Spellen. Gebruik bij een nieuwe game, een nieuwe speelwijze, een nieuwe niveau- of spraaklaag, of een wijziging die meerdere FSD-lagen raakt."
---

# Een spel toevoegen of uitbreiden

Lees eerst `AGENTS.md` en de relevante ADR's. Volg de stappen hieronder; sla
een stap alleen over met een expliciete reden in de pull request.

## Werkwijze

1. **Bepaal de lagen.** Pure regels en data in `libs/entities/<spel>`; store,
   opslag en UI in `libs/features/<spel>`; het scherm in `libs/pages/<spel>`.
   Een gedeeld blok gaat naar `libs/widgets` of `libs/shared/ui`.
2. **Maak de Nx-projecten.** Elke slice krijgt `project.json`, `tsconfig.json`
   en `index.ts`. Werk de alias bij in `tsconfig.base.json` en
   `tools/aliases.ts`, de zone in `.fallowrc.json` en de Nx-tags.
3. **Sluit aan op de app.** Route in `apps/games/src/app/router.tsx`,
   `gameCatalog` in `libs/entities/game/model/game-catalog.ts`, het `to`-union,
   `GameIcon` en een thumbnail van 800 × 500 JPEG met contenthash.
4. **Kies spraak.** Gebruik `speechGroups` in `model/audio.ts`, een
   `SpeechLine` uit `@shared/lib`, en een expliciete `speech`-verklaring in de
   catalogus. Draai `corepack pnpm run audio:check`.
5. **Test.** Pure regels in `tests/node`, UI in `tests/web`, de kernreis in
   `e2e/`. Dekking minimaal 80%. Zie `README.md` en `package.json`.
6. **Leg de beslissing vast.** Een nieuwe mechanic, assetbron of privacykeuze
   krijgt een ADR volgens `spellen-adr`.
7. **Controleer op een toestel.** 390 px en 1024 px, touch-targets ≥ 44 px,
   safe areas, toetsenbord, schermlezer en reduced motion.
8. **Draai de gate.** `corepack pnpm run quality:full`.

## Grenzen

- Importeer alleen via de public API en de aliassen.
- Geen React in `libs/entities`; geen opslag in pure regels.
- Geen nieuwe backend, analytics of externe request.
- Geen `!important`; gebruik cascade layers of een specifiekere selector.
- Geen geheimen, privépaden of kindgegevens in assets, tests of screenshots.
- Merge nooit zelfstandig; vraag de eigenaar om akkoord.
