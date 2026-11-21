import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@shared/lib";
import { dialogBackdrop, dialogPanelRecipe, type DialogPanelVariants } from "./dialog.css";

interface DialogProps {
  labelledBy: string;
  describedBy?: string;
  size?: DialogPanelVariants["size"];
  tone?: DialogPanelVariants["tone"];
  /** Sluit bij klikken op de achtergrond. */
  dismissOnBackdrop?: boolean;
  onClose?: () => void;
  /** Optionele overlay achter het dialoogvenster, bijvoorbeeld confetti. */
  overlay?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Dialog({
  labelledBy,
  describedBy,
  size = "sm",
  tone = "default",
  dismissOnBackdrop = false,
  onClose,
  overlay,
  className,
  children,
}: DialogProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      aria-modal="true"
      className={dialogBackdrop}
      role="dialog"
      onClick={dismissOnBackdrop ? onClose : undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onClose) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      {overlay}
      <m.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(dialogPanelRecipe({ size, tone }), className)}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
        transition={{ damping: 26, stiffness: 360, type: "spring" }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </m.div>
    </div>
  );
}
