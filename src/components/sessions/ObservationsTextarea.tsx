// src/components/sessions/ObservationsTextarea.tsx
import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Textarea } from "../ui/Textarea";
import { TemplateButton } from "../templates/TemplateButton";
import type { TemplateContext } from "../../lib/templates/templateProcessor";

interface ObservationsTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  templateContext?: TemplateContext;
}

/**
 * Componente optimizado para el textarea de observaciones con debounce
 */
export const ObservationsTextarea = memo(
  ({ value, onChange, disabled, templateContext }: ObservationsTextareaProps) => {
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

    const handleTemplateInsert = useCallback(
      (text: string) => {
        setLocalValue(text);
        onChange(text);
      },
      [onChange],
    );

    // Limpiar timeout al desmontar
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <div className="relative">
        <Textarea
          value={localValue}
          onChange={handleChange}
          placeholder="Notas adicionales sobre esta sesión..."
          disabled={disabled}
          className="pr-10"
        />
        {!disabled && templateContext && (
          <TemplateButton
            kind="clinical_notes"
            onInsert={handleTemplateInsert}
            context={templateContext}
            className="absolute top-2 right-2"
          />
        )}
      </div>
    );
  },
);

ObservationsTextarea.displayName = "ObservationsTextarea";
