# Plan: Franse lessen schaalbaar maken

- **Datum:** 2026-10-18
- **Status:** Fase 1 afgerond; fase 2 is de volgende stap
- **Doel:** van één hardcoded les naar een curriculum waarin nieuwe lessen data + audio zijn, zonder page-, generator- of testwerk per les.

## Uitgangspunt

De huidige les is een verticale slice: `FrenchPage`, de quiz-store en `scripts/generate-french-audio.ts` kennen allemaal `LESSON_ANIMAUX`. Dat werkt voor één les, maar niet voor tien.

We maken vier **deep modules** met een kleine interface:

```text
FrenchCurriculum    welke lessen en items bestaan er, in welke volgorde?
FrenchSession       start les, stel vraag, antwoord, volgende
FrenchProgress      SRS, sterren en review-queue in localStorage
FrenchAudioCatalog  welk audiobestand hoort bij een item of contextzin?
```

De UI en de generator praten alleen met die interfaces. Een nieuwe les is dan data + audio, geen nieuwe pagina of quizcode.

## Fase 1 — fundament

- [x] `FrenchLesson` krijgt een `status: "draft" | "reviewed"`.
- [x] `theme` en `level` verhuizen naar de les; items erven die context.
- [x] `defineLesson`-helper en `lessons/animaux.ts`.
- [x] `FRENCH_CURRICULUM` met `listPublishedLessons()` en `getLesson(id)`.
- [x] `validateCurriculum()` als content-contract:
  - unieke les- en item-id's, met `<les>-`-prefix;
  - elk woord heeft een contextzin;
  - elke zin heeft drie unieke afleiders;
  - geen dubbele Nederlandse vertalingen binnen een les;
  - elk `reviewed` item heeft woord- en contextaudio;
  - minimaal 10 woorden + 5 zinnen per gepubliceerde les.
- [x] Dynamische route `/frans/$lessonId` en een leskeuze op `/frans`.
- [x] Audio-generator loopt over de curriculum en heeft `--check` (CI via de content-contracttest).
- [x] Tests: één content-contracttest over alle lessen, plus de bestaande quiz- en UI-tests.

**Klaar als:** een tweede les toevoegen alleen `lessons/<id>.ts`, een regel in `curriculum.ts` en audio vereist. Dat is nu het geval.

## Fase 2 — content

- [ ] Salutations
- [ ] Famille
- [ ] Nourriture
- [ ] École
- [ ] Météo / vrije tijd
- [ ] Corps

Per les: 10 woorden, 5 zinnen, een contextzin per woord, Nederlandse vertalingen en audio. Liever 90 goede items dan 500 matige.

## Fase 3 — leren over lessen heen

- [ ] `FrenchProgress`: box, `dueAt`, eerste-poging-correct per item.
- [ ] Sterren per les en een “review due”-modus over alle lessen.
- [ ] Eén localStorage-key met schema-versie en migratie.
- [ ] Optioneel: meerdere lokale profielen.

## Fase 4 — meer oefenvormen

- [ ] Zin bouwen/sorteren.
- [ ] Langere zinnen, snellere audio en een “meester”-modus.
- [ ] Optioneel: drag-and-drop met `@dnd-kit/core` + `@dnd-kit/sortable`.

## Ontwerpregels

- **Geen backend of CMS.** De app blijft statisch; content staat in TypeScript-bestanden.
- **Geen les-specifieke UI.** Eén leskeuze, één quiz, één flipcard- en sorteerfeature voor alle lessen.
- **Geen audio in CI of runtime.** Audio wordt lokaal gegenereerd met de private TTS-skill en gecommit; CI controleert alleen de bestanden.
- **Geen nieuwe dependency zonder noodzaak.** De validator is een pure TypeScript-functie; geen Zod of schema-library.
- **Afleiders zijn beleid, geen content per vraag.** Woorden gebruiken `contrastWith`/tags; zinnen houden handmatige afleiders.
- **Review is een status, geen aanname.** Alleen `reviewed` lessen komen in de app en in de audio-check.

## Eerste PR

Deze PR bevat fase 1: curriculum, validator, dynamische route, leskeuze, generator over de curriculum en de content-contracttests. Nog geen nieuwe lessen.
