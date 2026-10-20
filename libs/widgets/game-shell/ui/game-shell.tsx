import { useEffect, type ReactNode } from "react";
import { stopSpeech } from "@shared/lib";
import { Button, PageHeader, Plus, SoundToggle, SpeechToggle } from "@shared/ui";

interface GameShellProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  backLabel?: string;
  onNewGame?: () => void;
  titleClassName?: string;
  /** Games zonder spraak verbergen de voorleesknop expliciet. */
  showSpeech?: boolean;
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
  children,
}: GameShellProps) {
  useEffect(() => () => stopSpeech(), []);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-4 px-5 pb-safe pt-safe sm:px-6">
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
