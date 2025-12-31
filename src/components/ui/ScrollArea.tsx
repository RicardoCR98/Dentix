// src/components/ui/ScrollArea.tsx
import * as React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ScrollArea({ children, className = "", ...props }: ScrollAreaProps) {
  return (
    <div
      className={`overflow-y-auto ${className}`}
      {...props}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "hsl(var(--muted-foreground)) hsl(var(--muted))",
        ...props.style,
      }}
    >
      {children}
    </div>
  );
}
