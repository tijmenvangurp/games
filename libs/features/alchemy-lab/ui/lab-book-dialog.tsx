import { Button, X } from "@shared/ui";
import { ELEMENTS } from "@entities/alchemy";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { ElementToken } from "./element-token";

interface LabBookDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LabBookDialog({ open, onClose }: LabBookDialogProps) {
  const discovered = useAlchemyStore((state) => state.discovered);

  if (!open) {
    return null;
  }

  const found = new Set(discovered);
  const progress = Math.round((discovered.length / ELEMENTS.length) * 100);

  return (
    <div
      aria-labelledby="lab-book-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div
        className="animate-pop max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-card p-4 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black" id="lab-book-title">
              Labboek
            </h2>
            <p className="text-sm text-muted-foreground">
              {discovered.length} van {ELEMENTS.length} elementen ontdekt
            </p>
          </div>
          <Button aria-label="Sluit labboek" size="icon" variant="ghost" onClick={onClose}>
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">Iconen: Microsoft Fluent Emoji · MIT</p>

        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ELEMENTS.map((element) =>
            found.has(element.id) ? (
              <div key={element.id} className="flex justify-center">
                <ElementToken element={element} />
              </div>
            ) : (
              <div key={element.id} className="flex flex-col items-center gap-1">
                <ElementToken element={element} undiscovered />
                <span className="text-xs font-bold text-muted-foreground">Onbekend</span>
              </div>
            ),
          )}
        </div>

        <Button className="mt-5 w-full" size="lg" onClick={onClose}>
          Terug naar de werkbank
        </Button>
      </div>
    </div>
  );
}
