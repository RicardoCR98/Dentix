import * as RSelect from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "../../lib/cn";

export const SelectRoot = RSelect.Root;

export function SelectTrigger({ className, ...props }: RSelect.SelectTriggerProps) {
  return (
    <RSelect.Trigger
      className={cn('select-trigger', className)}
      {...props}
    >
      <RSelect.Value placeholder="Selecciona…" />
      <RSelect.Icon className="ml-2 opacity-80">
        <ChevronDown size={16} />
      </RSelect.Icon>
    </RSelect.Trigger>
  );
}

export function SelectContent(
  { className, children, sideOffset = 6, ...props }: RSelect.SelectContentProps
) {
  return (
    <RSelect.Portal>
      <RSelect.Content
        className={cn(
          "z-50 min-w-[var(--radix-select-trigger-width)] rounded-lg",
          "border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
          "shadow-lg overflow-hidden",
          // micro-animación respetando preferencias de movimiento
          "motion-safe:data-[state=open]:animate-[scaleIn_120ms_ease-out] motion-safe:data-[state=closed]:animate-[fadeOut_90ms_ease-in]",
          className
        )}
        position="popper"
        sideOffset={sideOffset}
        {...props}
      >
        <RSelect.ScrollUpButton className="flex items-center justify-center py-1 text-[hsl(var(--muted-foreground))]">
          <ChevronUp size={16} />
        </RSelect.ScrollUpButton>

        <RSelect.Viewport className="p-1">
          {children}
        </RSelect.Viewport>

        <RSelect.ScrollDownButton className="flex items-center justify-center py-1 text-[hsl(var(--muted-foreground))]">
          <ChevronDown size={16} />
        </RSelect.ScrollDownButton>
      </RSelect.Content>
    </RSelect.Portal>
  );
}

export function SelectItem(
  { className, children, ...props }: RSelect.SelectItemProps
) {
  return (
    <RSelect.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2",
        "rounded-md py-2 pl-8 pr-3 text-sm outline-none",
        "text-[hsl(var(--foreground))]",
        "data-[highlighted]:bg-[hsl(var(--muted))] data-[highlighted]:text-[hsl(var(--foreground))]",
        "data-[state=checked]:font-medium",
        "transition-colors",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 top-1/2 -translate-y-1/2">
        <RSelect.ItemIndicator className="text-[hsl(var(--brand))]">
          <Check size={16} />
        </RSelect.ItemIndicator>
      </span>
      <RSelect.ItemText>{children ?? props.value}</RSelect.ItemText>
    </RSelect.Item>
  );
}
