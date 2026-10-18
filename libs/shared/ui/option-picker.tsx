import { cn } from "../lib";
import { ChoiceCard } from "./choice-card";

interface PickerOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
  emoji: string;
}

const COLUMN_CLASSES = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const;

interface OptionPickerProps<T extends string | number> {
  legend: string;
  options: readonly PickerOption<T>[];
  selected: T;
  /** Number of columns; defaults to three. */
  columns?: keyof typeof COLUMN_CLASSES;
  onSelect: (value: T) => void;
}

export function OptionPicker<T extends string | number>({
  legend,
  options,
  selected,
  columns = 3,
  onSelect,
}: OptionPickerProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className={cn("grid gap-2", COLUMN_CLASSES[columns])}>
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            emoji={option.emoji}
            hint={option.hint}
            label={option.label}
            selected={selected === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
