import type { ReactNode, Ref } from "react";
import { cn } from "@shared/lib";
import { disclosureBody, disclosureRoot, disclosureSummary } from "./disclosure.css";
import { ChevronDown } from "./icons";

interface DisclosureProps {
  summary: ReactNode;
  icon?: ReactNode;
  detailsRef?: Ref<HTMLDetailsElement>;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Disclosure({
  summary,
  icon,
  detailsRef,
  className,
  bodyClassName,
  children,
}: DisclosureProps) {
  return (
    <details ref={detailsRef} className={cn("group", disclosureRoot, className)}>
      <summary className={disclosureSummary}>
        <span className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span aria-hidden="true" className="shrink-0">
              {icon}
            </span>
          ) : null}
          <span className="truncate">{summary}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className={cn(disclosureBody, bodyClassName)}>{children}</div>
    </details>
  );
}
