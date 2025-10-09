// src/components/ui/Button.tsx
import React from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  className, 
  children,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={cn(
        // Base
        'btn',
        // Variantes
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        // Tamaños
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}