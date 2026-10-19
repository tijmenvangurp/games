# Prototype: klanken met TTS

Op 2026-10-19 is de klankset voor Letterpret gekozen met een TTS-prototype. Deze map bewaart de volledige vergelijking, zodat de keuze later te herleiden en opnieuw te beluisteren is.

## Archief

- `klanken-prototype-2026-10-19.tar.gz` — volledige Nathalie-snapshot: 36 klankeenheden met alle varianten (losse letter, fonetisch, langzaam, aangehouden, woord, IPA/SSML en de knipvarianten), plus `index.html`, `sounds.json` en `LICENSES.md`.

Uitpakken en openen:

```sh
tar -xzf docs/prototype/klanken-prototype-2026-10-19.tar.gz -C /tmp/klankprototype
corepack pnpm exec tsx scripts/generate-sounds.ts --serve-only --out=/tmp/klankprototype
```

Open daarna de URL die het script noemt. `index.html` rechtstreeks openen kan ook.

## Bron en reproductie

- Generator en keuzes: `scripts/sounds-data.ts`, `scripts/generate-sounds.ts`, `scripts/wav.ts` en `scripts/finalize-sounds.ts`.
- Definitieve set: `apps/games/public/audio/letters/v1/sounds/` met `manifest.json`.
- De gebruikte stem is Piper `speaches-ai/piper-nl_BE-nathalie-medium`; de stemdataset is CC0 1.0. Zie `LICENSES.md` in het archief.
- De woordopnames in de app blijven afkomstig van Wikimedia Commons; zie [ADR 0017](../adr/0017-letterklanken-en-audio.md).

De snapshot is bedoeld voor vergelijking en onderzoek. De app gebruikt alleen de gekozen bestanden; de kwaliteitsroute blijft een menselijke opname-set (ADR 0017, route B).
