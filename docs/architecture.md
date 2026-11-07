# Architectuur

Spellen is een Nx-monorepo met Feature-Sliced Design. Elke slice is een eigen
Nx-project met een `project.json`, `tsconfig.json` en public API (`index.ts`).

## Lagen

| Laag     | Pad                  | Mag importeren van                         |
| -------- | -------------------- | ------------------------------------------ |
| App      | `apps/games/src/app` | pages, widgets, features, entities, shared |
| Pages    | `libs/pages/*`       | widgets, features, entities, shared        |
| Widgets  | `libs/widgets/*`     | features, entities, shared                 |
| Features | `libs/features/*`    | entities, shared                           |
| Entities | `libs/entities/*`    | shared                                     |
| Shared   | `libs/shared/*`      | shared                                     |

Deze richting staat in `.fallowrc.json` en wordt door Fallow en Steiger
bewaakt. Een import terug de grafiek in is een fout, geen stylekwestie.

## Aliassen

Importeer via de public API en de aliassen:

```text
@app/...       apps/games/src/app
@pages/...     libs/pages
@widgets/...   libs/widgets
@features/...  libs/features
@entities/...  libs/entities
@shared/...    libs/shared
```

De aliassen staan in `tsconfig.base.json` en `tools/aliases.ts`. Voeg een
nieuwe slice op beide plekken toe.

## Waar hoort code?

- **Pure regels en data** horen in `libs/entities`. Geen React, geen
  `localStorage`, geen `window`.
- **Spelstate en UX** horen in `libs/features`. Zustand-stores staan in
  `model/`, UI in `ui/`.
- **Een scherm** hoort in `libs/pages`. Het stelt widgets en features samen en
  bevat geen spellogica.
- **Een herbruikbaar blok** hoort in `libs/widgets` of `libs/shared/ui`.
- **Een helper zonder UI** hoort in `libs/shared/lib`.
- **De app-shell** (router, providers, globale styles, `public/`) hoort in
  `apps/games`.

## Een slice toevoegen

1. Maak de map met `project.json`, `tsconfig.json` en `index.ts`.
2. Zet de Nx-tags (`layer:*`, `scope:*`, `type:*`).
3. Voeg de alias toe aan `tsconfig.base.json` en `tools/aliases.ts`.
4. Voeg de zone toe aan `.fallowrc.json`.
5. Exporteer alleen wat een andere laag mag gebruiken via `index.ts`.
6. Draai `corepack pnpm run graph`, `corepack pnpm run fsd` en
   `corepack pnpm run boundaries`.

## Grenzen

- Geen cross-import tussen twee features; gebruik een entity of shared API.
- Geen deep import in een andere slice; alleen via `index.ts`.
- Geen React in entities.
- Geen runtime-netwerk, backend of analytics.
- Een nieuwe grens of uitzondering krijgt een ADR.

Zie [ADR 0004](adr/0004-nx-monorepo.md) voor het waarom en
`docs/game-checklist.md` voor de route bij een nieuw spel.
