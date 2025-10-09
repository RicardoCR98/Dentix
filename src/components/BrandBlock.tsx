// src/components/BrandBlock.tsx
import { Building2, Clock } from 'lucide-react';
import { cn } from '../lib/cn';

type Props = { 
  name: string; 
  slogan?: string; 
  schedule?: string;
  className?: string;
};

export default function BrandBlock({ name, slogan, schedule, className }: Props) {
  return (
    <section 
      className={cn(
        'card text-center p-8 mb-6',
        'bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--muted))]',
        'border-2 border-[hsl(var(--border))]',
        className
      )}
    >
      {/* Logo/Icono */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center text-white shadow-lg">
          <Building2 size={32} />
        </div>
      </div>

      {/* Nombre de la clínica */}
      <h1 
        className="text-3xl font-bold tracking-wider mb-2 text-[hsl(var(--foreground))]"
        style={{ letterSpacing: '0.15em' }}
      >
        {name}
      </h1>

      {/* Slogan */}
      {slogan && (
        <p className="text-[hsl(var(--brand))] text-lg font-medium mb-3 italic">
          {slogan}
        </p>
      )}

      {/* Horario */}
      {schedule && (
        <div className="flex items-center justify-center gap-2 text-[hsl(var(--muted-foreground))] text-sm">
          <Clock size={14} />
          <span>Horario: {schedule}</span>
        </div>
      )}

      {/* Decoración */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand))]" />
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand))] opacity-60" />
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--brand))] opacity-30" />
      </div>
    </section>
  );
}