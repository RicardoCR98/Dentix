import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";
import { cn } from "../../lib/cn";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-none border-b border-[hsl(var(--border))]",
      "bg-transparent",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap",
      "px-4 py-3 text-sm font-medium",
      "text-[hsl(var(--muted-foreground))]",
      "transition-all duration-300 ease-out",
      "relative",
      // Estado normal
      "hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)]",
      // Estado activo
      "data-[state=active]:text-[hsl(var(--primary))]",
      "data-[state=active]:bg-transparent",
      // Línea indicadora
      "before:absolute before:bottom-0 before:left-0 before:right-0",
      "before:h-1 before:bg-[hsl(var(--primary))]",
      "before:scale-x-0 before:origin-left before:transition-transform before:duration-300",
      "data-[state=active]:before:scale-x-100",
      // Focus visible
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-0 ring-offset-[hsl(var(--background))]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2",
      "animate-in fade-in-50 duration-300",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };