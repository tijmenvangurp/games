import { useTexts } from "@shared/i18n";
import { BookOpen, Disclosure } from "@shared/ui";
import { ganzenbordUiTexts } from "../model/texts";

export function GanzenbordRules() {
  const t = useTexts(ganzenbordUiTexts).rules;

  return (
    <Disclosure icon={<BookOpen className="size-4 text-primary" />} summary={t.summary}>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        <p>{t.intro}</p>
        <ul className="space-y-1.5">
          {t.items.map((item) => (
            <li key={item.term}>
              <strong className="text-foreground">{item.term}</strong> {item.text}
            </li>
          ))}
        </ul>
        <p className="text-xs">{t.draw}</p>
      </div>
    </Disclosure>
  );
}
