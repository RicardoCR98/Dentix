// src/components/ui/Input.tsx
import React, { useMemo } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

let idCounter = 0;

export const Input = React.memo(function Input({
  error,
  label,
  helperText,
  icon,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const inputId = useMemo(
    () => id || `input-${++idCounter}`,
    [id]
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "input",
            error && "input-error",
            icon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>

      {helperText && (
        <p
          className={cn(
            "text-sm mt-1",
            error ? "text-red-500" : "text-[hsl(var(--muted-foreground))]",
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
