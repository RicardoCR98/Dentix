// src/components/ui/Input.tsx
import React from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({ 
  error,
  label,
  helperText,
  icon,
  className,
  id,
  required,
  ...props 
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
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
            'input',
            error && 'input-error',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      
      {helperText && (
        <p className={cn(
          'text-xs mt-1',
          error ? 'text-red-500' : 'text-[hsl(var(--muted-foreground))]'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
}