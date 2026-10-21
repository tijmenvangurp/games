import type { ReactNode } from "react";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

/**
 * Loads only the DOM animation features and forwards the user's reduced-motion
 * preference to every Motion component. Components use the lightweight `m`
 * primitive so the feature bundle stays small.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
