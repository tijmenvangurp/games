import {
  BASE_ELEMENT_IDS,
  ELEMENT_CATEGORY_LABELS,
  findRecipesFor,
  getElement,
  recipesUsing,
  type AlchemyElement,
  type ElementId,
} from "@entities/alchemy";
import { ArrowLeft, Button } from "@shared/ui";
import { ElementToken } from "./element-token";

function ElementChip({
  elementId,
  discovered,
  mystery = false,
}: {
  elementId: ElementId;
  discovered: ReadonlySet<ElementId>;
  mystery?: boolean;
}) {
  const element = getElement(elementId);
  if (!element) {
    return null;
  }

  if (mystery && !discovered.has(elementId)) {
    return (
      <span
        aria-label="Onbekend element"
        className="inline-flex min-h-8 items-center rounded-full border border-border bg-muted px-2 text-xs font-black text-muted-foreground"
      >
        ?
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-bold">
      <img alt="" className="size-5" draggable={false} src={element.icon} />
      {element.name}
    </span>
  );
}

interface ElementDetailProps {
  element: AlchemyElement;
  discovered: ReadonlySet<ElementId>;
  onBack: () => void;
}

export function ElementDetail({ element, discovered, onBack }: ElementDetailProps) {
  const madeFrom = findRecipesFor(element.id);
  const canMake = recipesUsing(element.id);
  const knownUses = canMake
    .map((recipe) => ({
      recipe,
      otherId: recipe.a === element.id ? recipe.b : recipe.a,
    }))
    .filter(({ otherId }) => discovered.has(otherId));
  const hiddenUses = canMake.length - knownUses.length;
  const isBase = BASE_ELEMENT_IDS.includes(element.id);

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" variant="outline" onClick={onBack}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Terug naar labboek
      </Button>

      <div className="flex items-center gap-3">
        <ElementToken element={element} showLabel={false} variant="board" />
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {ELEMENT_CATEGORY_LABELS[element.category]}
          </p>
          <h3 className="text-2xl font-black">{element.name}</h3>
          <p className="text-sm text-muted-foreground">{element.fact}</p>
        </div>
      </div>

      <section>
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Gemaakt van
        </h4>
        {isBase ? (
          <p className="mt-1 text-sm">Dit is een basiselement.</p>
        ) : madeFrom.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {madeFrom.map((recipe) => (
              <div key={`${recipe.a}-${recipe.b}`} className="flex flex-wrap items-center gap-1.5">
                <ElementChip discovered={discovered} elementId={recipe.a} />
                <span aria-hidden="true" className="text-xs font-black text-muted-foreground">
                  +
                </span>
                <ElementChip discovered={discovered} elementId={recipe.b} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Nog geen recept gevonden.</p>
        )}
      </section>

      <section>
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Kan maken met
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
                <ElementChip discovered={discovered} elementId={recipe.result} mystery />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {hiddenUses > 0
              ? "Probeer meer elementen te ontdekken."
              : "Dit element is nog nergens voor gebruikt."}
          </p>
        )}
        {knownUses.length > 0 && hiddenUses > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Nog {hiddenUses} combinaties te ontdekken.
          </p>
        ) : null}
      </section>
    </div>
  );
}
