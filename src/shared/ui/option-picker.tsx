import { ChoiceCard } from "./choice-card";

interface PickerOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
  emoji: string;
}

interface OptionPickerProps<T extends string | number> {
  legend: string;
  options: readonly PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function OptionPicker<T extends string | number>({
  legend,
  options,
  selected,
  onSelect,
}: OptionPickerProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
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
