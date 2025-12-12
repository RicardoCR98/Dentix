// src/components/Section.tsx
import React, { forwardRef } from 'react';
import { cn } from '../lib/cn';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Section = forwardRef<HTMLElement, SectionProps>(({
  title,
  icon,
  right,
  children,
  className
}, ref) => {
  return (
    <section ref={ref} className={cn('mb-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-[hsl(var(--brand))]">
              {icon}
            </div>
          )}
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            {title}
          </h2>
        </div>
        {right && (
          <div className="flex items-center gap-2">
            {right}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="card p-6">
        {children}
      </div>
    </section>
  );
});

Section.displayName = 'Section';

export default Section;