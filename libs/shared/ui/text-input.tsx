import type { ComponentProps } from "react";
import { cn } from "@shared/lib";
import { textInput } from "./text-input.css";

export function TextInput({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input className={cn(textInput, className)} type={type} {...props} />;
}
