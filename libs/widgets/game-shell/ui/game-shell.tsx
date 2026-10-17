import type { ReactNode } from "react";
import { Button, PageHeader, Plus } from "@shared/ui";

interface GameShellProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  onNewGame?: () => void;
  titleClassName?: string;
  children: ReactNode;
}

export function GameShell({
  title,
  subtitle,
  onBack,
  onNewGame,
  titleClassName,
  children,
}: GameShellProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-4 px-3 pb-safe pt-safe sm:px-4">
      <PageHeader
        actions={
          onNewGame ? (
            <Button aria-label="Nieuw spel" size="icon" variant="outline" onClick={onNewGame}>
              <Plus aria-hidden="true" className="size-5" />
            </Button>
          ) : null
        }
        onBack={onBack}
        subtitle={subtitle}
        title={title}
        titleClassName={titleClassName}
      />
      {children}
    </div>
  );
}
