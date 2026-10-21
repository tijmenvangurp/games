import { useEffect, type ReactNode } from "react";
import { cn, stopSpeech } from "@shared/lib";
import { Button, PageHeader, Plus, SoundToggle, SpeechToggle } from "@shared/ui";

interface GameShellProps {
  title: string;
  /** Weglaten geeft een compactere paginakop, bijvoorbeeld tijdens een potje. */
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  onNewGame?: () => void;
  titleClassName?: string;
  /** Games zonder spraak verbergen de voorleesknop expliciet. */
  showSpeech?: boolean;
  /** Geeft de pagina meer breedte, bijvoorbeeld voor een werkbank met zijpaneel. */
  wide?: boolean;
  /** Houdt de pagina op een tablet in landschap binnen één scherm. */
  fitViewport?: boolean;
  children: ReactNode;
}

export function GameShell({
  title,
  subtitle,
  onBack,
  backLabel,
  onNewGame,
  titleClassName,
  showSpeech = true,
  wide = false,
  fitViewport = false,
  children,
}: GameShellProps) {
  useEffect(() => () => stopSpeech(), []);

  return (
    <div
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-4 px-5 pb-safe pt-safe sm:px-6",
        wide && "max-w-6xl",
        fitViewport && "lg:h-svh lg:min-h-0 lg:overflow-hidden",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 border-b border-border pb-3">
        <PageHeader
          actions={
            <div className="flex items-center gap-0.5">
              {showSpeech ? <SpeechToggle /> : null}
              <SoundToggle />
              {onNewGame ? (
                <Button aria-label="Nieuw spel" size="icon" variant="outline" onClick={onNewGame}>
                  <Plus aria-hidden="true" className="size-5" />
                </Button>
              ) : null}
            </div>
          }
          onBack={onBack}
          backLabel={backLabel}
          subtitle={subtitle}
          title={title}
          titleClassName={titleClassName}
        />
      </div>
      {children}
    </div>
  );
}
