import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn';

export const TabsRoot = Tabs.Root;

export function TabsList({ className, ...props }: Tabs.TabsListProps) {
  return (
    <Tabs.List
      className={cn(
        'inline-flex gap-1 bg-[hsl(var(--muted))] p-1 rounded-lg',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      className={cn(
        'px-4 py-2 rounded-md text-sm font-medium transition-all',
        'hover:text-[hsl(var(--foreground))]',
        'data-[state=active]:bg-[hsl(var(--surface))] data-[state=active]:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: Tabs.TabsContentProps) {
  return (
    <Tabs.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}