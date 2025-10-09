// src/components/ui/Alert.tsx
import React from 'react';
import { cn } from '../../lib/cn';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  className, 
  ...props 
}: AlertProps) {
  return (
    <div 
      className={cn(
        'alert',
        variant === 'info' && 'alert-info',
        variant === 'success' && 'alert-success',
        variant === 'warning' && 'alert-warning',
        variant === 'danger' && 'alert-danger',
        className
      )} 
      {...props}
    >
      {title && <div className="alert-title">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}