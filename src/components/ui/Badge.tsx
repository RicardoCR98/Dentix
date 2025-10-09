// src/components/ui/Badge.tsx
import React from 'react';
import { cn } from '../../lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <span 
      className={cn(
        'badge',
        variant === 'default' && 'badge-default',
        variant === 'success' && 'badge-success',
        variant === 'warning' && 'badge-warning',
        variant === 'danger' && 'badge-danger',
        variant === 'info' && 'badge-info',
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
}