import { LANGUAGES, setLanguage, useLanguage, useTranslation, type Language } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Button } from "./button";
import { Languages } from "./icons";

const SHORT_LABEL: Record<Language, string> = { nl: "NL", en: "EN" };

interface LanguageSwitcherProps {
  className?: string;
}

/** Wisselt tussen Nederlands en Engels; de keuze blijft bewaard op dit apparaat. */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  return (
    <div
      aria-label={t("language.label")}
      className={cn(
        "flex items-center gap-0.5 rounded-xl border border-border/80 bg-card/85 p-0.5 shadow-xs",
        className,
      )}
      role="group"
    >
      <Languages aria-hidden="true" className="mx-1.5 size-4 text-muted-foreground" />
      {LANGUAGES.map((item) => (
        <Button
          key={item}
          aria-label={t(`language.${item}`)}
          aria-pressed={language === item}
          lang={item}
          size="sm"
          title={t(`language.${item}`)}
          variant={language === item ? "default" : "ghost"}
          onClick={() => setLanguage(item)}
        >
          {SHORT_LABEL[item]}
        </Button>
      ))}
    </div>
  );
}
