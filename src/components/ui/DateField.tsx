import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** Wrapper de input date con estilos consistentes */
export const DateField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="date"
      className={cn(
        "w-full h-10 px-3 rounded-md border border-[hsl(var(--border))] bg-surface-soft",
        "text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]",
        "appearance-none ",
        className
      )}
      {...props}
    />
  )
);
DateField.displayName = "DateField";
