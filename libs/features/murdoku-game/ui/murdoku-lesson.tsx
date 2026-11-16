import { useState } from "react";
import { Button, ChevronLeft, ChevronRight } from "@shared/ui";
import { MURDOKU_GLOSSARY, MURDOKU_LESSON_STEPS, MURDOKU_LESSON_TIPS } from "../lib/lesson";
import { murdokuObjectName } from "../lib/legend";
import { MurdokuDiagram } from "./murdoku-diagram";
import { MurdokuObjectLegend } from "./murdoku-object-legend";

/** De knoppen om met de hand van scherm te wisselen. */
function StepNavigation({ index, onSelect }: { index: number; onSelect: (index: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button
        className="min-h-11"
        disabled={index === 0}
        variant="outline"
        onClick={() => onSelect(index - 1)}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
        Vorige stap
      </Button>
      <p className="text-sm font-semibold text-muted-foreground">
        Stap {index + 1} van {MURDOKU_LESSON_STEPS.length}
      </p>
      <Button
        className="min-h-11"
        disabled={index === MURDOKU_LESSON_STEPS.length - 1}
        onClick={() => onSelect(index + 1)}
      >
        Volgende stap
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}

/** De zes genummerde knoppen waarmee je meteen naar een scherm springt. */
function StepPicker({ index, onSelect }: { index: number; onSelect: (index: number) => void }) {
  return (
    <ol aria-label="Kies een scherm" className="flex flex-wrap justify-center gap-2">
      {MURDOKU_LESSON_STEPS.map((step, stepIndex) => {
        const active = stepIndex === index;

        return (
          <li key={step.id}>
            <button
              aria-label={`Stap ${stepIndex + 1}: ${step.title}`}
              aria-pressed={active}
              className={
                active
                  ? "grid size-11 place-items-center rounded-lg border border-primary bg-primary/10 font-bold text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                  : "grid size-11 place-items-center rounded-lg border border-border bg-card font-semibold text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
              }
              type="button"
              onClick={() => onSelect(stepIndex)}
            >
              {stepIndex + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** De stappenblokken: één scherm per stap, met een keuze boven en pijlen onder. */
function LessonStepper() {
  const [index, setIndex] = useState(0);
  const step = MURDOKU_LESSON_STEPS[index];

  return (
    <section aria-labelledby="murdoku-les-titel" className="flex flex-col gap-3">
      <StepPicker index={index} onSelect={setIndex} />
      <article className="game-panel flex flex-col items-center gap-3 p-4 text-center sm:p-6">
        <h2 className="font-display text-2xl leading-tight" id="murdoku-les-titel">
          {step.title}
        </h2>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{step.body}</p>
        <MurdokuDiagram diagram={step.diagram} maxCell={4.5} objectName={murdokuObjectName} />
        {step.tip ? (
          <p className="max-w-prose rounded-lg bg-warning/15 px-3 py-2 text-sm font-medium leading-relaxed">
            {step.tip}
          </p>
        ) : null}
      </article>
      <StepNavigation index={index} onSelect={setIndex} />
    </section>
  );
}

/** Alle woorden uit de aanwijzingen, elk met een eigen klein diagram. */
function Glossary() {
  return (
    <section aria-labelledby="murdoku-woordenlijst" className="flex flex-col gap-3">
      <h2 className="font-display text-2xl" id="murdoku-woordenlijst">
        Woordenlijst
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        Elk woord uit een aanwijzing betekent altijd hetzelfde. Tik op een woord in een aanwijzing
        om het op het bord te zien.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {MURDOKU_GLOSSARY.map((entry) => (
          <li key={entry.id} className="game-panel flex flex-col gap-3 p-3 sm:flex-row sm:gap-4">
            <MurdokuDiagram
              className="mx-auto sm:mx-0 sm:shrink-0"
              diagram={entry.diagram}
              objectName={murdokuObjectName}
            />
            <div className="min-w-0">
              <h3 className="font-display text-lg leading-tight">{entry.term}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.meaning}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** De vaste objectlegenda en de twee tips voor het werken met een zaak. */
function LegendAndTips() {
  return (
    <>
      <section aria-labelledby="murdoku-uitleg-legenda" className="flex flex-col gap-2.5">
        <h2 className="font-display text-2xl" id="murdoku-uitleg-legenda">
          Waar mag je staan?
        </h2>
        <MurdokuObjectLegend />
      </section>

      <section aria-labelledby="murdoku-uitleg-tips" className="flex flex-col gap-2.5">
        <h2 className="font-display text-2xl" id="murdoku-uitleg-tips">
          Twee tips
        </h2>
        <ul className="flex flex-col gap-2">
          {MURDOKU_LESSON_TIPS.map((tip) => (
            <li
              key={tip}
              className="game-panel px-3 py-2 text-sm leading-relaxed text-muted-foreground"
            >
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * De uitleg van Wie was het?: zes schermen en een woordenlijst.
 *
 * De opbouw volgt de schaaktutorial: per scherm één onderwerp, een korte zin en
 * een diagram. De woordenlijst staat eronder en is altijd te bereiken, ook als
 * het kind een scherm heeft overgeslagen. De uitleg gebruikt geen opslag; de
 * pagina opent hem opnieuw via de ?-knop.
 */
export function MurdokuLesson() {
  return (
    <div className="flex flex-col gap-8 pb-2">
      <LessonStepper />
      <Glossary />
      <LegendAndTips />
    </div>
  );
}
