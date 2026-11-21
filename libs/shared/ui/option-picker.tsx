import type { ReactNode } from "react";
import { cn } from "@shared/lib";
import { ChoiceCard } from "./choice-card";

interface PickerOption<T extends string | number> {
  value: T;
  label: string;
  symbol?: string;
  leading?: ReactNode;
  description?: ReactNode;
}

const COLUMN_CLASSES = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  "2-3": "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const;

interface OptionPickerProps<T extends string | number> {
  legend: string;
  options: readonly PickerOption<T>[];
  selected: T;
  /** Number of columns; defaults to three. */
  columns?: keyof typeof COLUMN_CLASSES;
  /** Compact cards for text-only choices. */
  size?: "default" | "compact";
  onSelect: (value: T) => void;
}

export function OptionPicker<T extends string | number>({
  legend,
  options,
  selected,
  columns = 3,
  size = "default",
  onSelect,
}: OptionPickerProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-foreground">{legend}</legend>
      <div className={cn("grid gap-2", COLUMN_CLASSES[columns])}>
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            description={option.description}
            label={option.label}
            leading={
              option.leading ??
              (option.symbol ? (
                <span className="font-display text-2xl leading-none">{option.symbol}</span>
              ) : undefined)
            }
            selected={selected === option.value}
            size={size}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
