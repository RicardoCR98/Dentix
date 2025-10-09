// src/components/ui/Divider.tsx
import { cn } from '../../lib/cn';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className, orientation = 'horizontal' }: DividerProps) {
  return (
    <hr 
      className={cn(
        'divider',
        orientation === 'vertical' && 'h-full w-px my-0 mx-4',
        className
      )} 
    />
  );
}