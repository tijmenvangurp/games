import {
  BASE_ELEMENT_IDS,
  categoryLabel,
  elementFact,
  elementName,
  findRecipesFor,
  getElement,
  recipesUsing,
  type AlchemyElement,
  type ElementId,
} from "@entities/alchemy";
import { useLanguage, useTexts } from "@shared/i18n";
import { ArrowLeft, Button } from "@shared/ui";
import { ElementToken } from "./element-token";
import { alchemyTexts } from "./texts";

function ElementChip({
  elementId,
  discovered,
  mystery = false,
}: {
  elementId: ElementId;
  discovered: ReadonlySet<ElementId>;
  mystery?: boolean;
}) {
  const language = useLanguage();
  const t = useTexts(alchemyTexts);
  const element = getElement(elementId);
  if (!element) {
    return null;
  }

  if (mystery && !discovered.has(elementId)) {
    return (
      <span
        aria-label={t.unknownElement}
        className="inline-flex min-h-8 items-center rounded-full border border-border bg-muted px-2 text-xs font-black text-muted-foreground"
      >
        ?
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-bold">
      <img alt="" className="size-5" draggable={false} src={element.icon} />
      {elementName(element.id, language)}
    </span>
  );
}

interface ElementDetailProps {
  element: AlchemyElement;
  discovered: ReadonlySet<ElementId>;
  onBack: () => void;
}

export function ElementDetail({ element, discovered, onBack }: ElementDetailProps) {
  const language = useLanguage();
  const t = useTexts(alchemyTexts);
  const madeFrom = findRecipesFor(element.id);
  const combinations = recipesUsing(element.id);
  const knownUses = combinations
    .map((recipe) => ({
      recipe,
      otherId: recipe.a === element.id ? recipe.b : recipe.a,
    }))
    .filter(({ recipe, otherId }) => discovered.has(otherId) && discovered.has(recipe.result));
  const hiddenUses = combinations.length - knownUses.length;
  const isBase = BASE_ELEMENT_IDS.includes(element.id);

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" variant="outline" onClick={onBack}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t.backToLabBook}
      </Button>

      <div className="flex items-center gap-3">
        <ElementToken element={element} showLabel={false} variant="board" />
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {categoryLabel(element.category, language)}
          </p>
          <h3 className="text-2xl font-black">{elementName(element.id, language)}</h3>
          <p className="text-sm text-muted-foreground">{elementFact(element.id, language)}</p>
        </div>
      </div>

      <section>
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {t.madeFrom}
        </h4>
        {isBase ? (
          <p className="mt-1 text-sm">{t.baseElement}</p>
        ) : madeFrom.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {madeFrom.map((recipe) => (
              <div key={`${recipe.a}-${recipe.b}`} className="flex flex-wrap items-center gap-1.5">
                <ElementChip discovered={discovered} elementId={recipe.a} mystery />
                <span aria-hidden="true" className="text-xs font-black text-muted-foreground">
                  +
                </span>
                <ElementChip discovered={discovered} elementId={recipe.b} mystery />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{t.noRecipeYet}</p>
        )}
      </section>

      {combinations.length > 0 ? (
        <section>
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t.successfulMixes}
          </h4>
          {knownUses.length > 0 ? (
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {knownUses.map(({ recipe, otherId }) => (
                <div
                  key={`${recipe.a}-${recipe.b}-${recipe.result}`}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <ElementChip discovered={discovered} elementId={otherId} />
                  <span aria-hidden="true" className="text-xs font-black text-muted-foreground">
                    →
                  </span>
                  <ElementChip discovered={discovered} elementId={recipe.result} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{t.nothingMadeYet}</p>
          )}
          {hiddenUses > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t.hiddenMixes(hiddenUses)}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
