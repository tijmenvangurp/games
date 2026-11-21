import { cn } from "@shared/lib";
import {
  progressFillRecipe,
  progressTrackRecipe,
  type ProgressFillVariants,
  type ProgressTrackVariants,
} from "./progress-bar.css";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  size?: ProgressTrackVariants["size"];
  tone?: ProgressFillVariants["tone"];
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  size = "sm",
  tone = "primary",
  className,
}: ProgressBarProps) {
  const clampedMax = Math.max(max, 0);
  const ratio = clampedMax === 0 ? 0 : Math.min(Math.max(value / clampedMax, 0), 1);

  return (
    <div
      aria-label={label}
      aria-valuemax={clampedMax}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn(progressTrackRecipe({ size }), className)}
      role="progressbar"
    >
      <div className={progressFillRecipe({ tone })} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
