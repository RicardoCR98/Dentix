// src/components/sessions/ObservationsTextarea.tsx
import { useState, useRef, useEffect, memo } from "react";
import { Textarea } from "../ui/Textarea";

interface ObservationsTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

/**
 * Componente optimizado para el textarea de observaciones con debounce
 */
export const ObservationsTextarea = memo(
  ({ value, onChange, disabled }: ObservationsTextareaProps) => {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sincronizar cuando cambia el valor externo
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce de 500ms antes de propagar el cambio
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 500);
    };

    // Limpiar timeout al desmontar
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <Textarea
        value={localValue}
        onChange={handleChange}
        placeholder="Notas adicionales sobre esta sesión..."
        disabled={disabled}
      />
    );
  },
);

ObservationsTextarea.displayName = "ObservationsTextarea";
