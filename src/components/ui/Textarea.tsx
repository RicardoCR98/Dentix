// src/components/ui/Textarea.tsx
import React, { useMemo } from "react";
import { cn } from "../../lib/cn";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

let textareaCounter = 0;

export const Textarea = React.memo(function Textarea({
  error,
  label,
  helperText,
  className,
  id,
  required,
  ...props
}: TextareaProps) {
  const textareaId = useMemo(
    () => id || `textarea-${++textareaCounter}`,
    [id]
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn("input", error && "input-error", className)}
        {...props}
      />
      {helperText && (
        <p
          className={cn(
            "text-xs mt-1",
            error ? "text-red-500" : "text-[hsl(var(--muted-foreground))]",
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
