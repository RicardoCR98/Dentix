// src/components/sessions/DebouncedReasonTextarea.tsx
import { memo, useState, useEffect, useCallback } from "react";
import { Textarea } from "../ui/Textarea";

interface DebouncedReasonTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const DebouncedReasonTextarea = memo(
  ({ value, onChange, disabled }: DebouncedReasonTextareaProps) => {
    const [localValue, setLocalValue] = useState(value);

    // Sincronizar cuando el valor externo cambie (ej: cambio de sesión)
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Debounce manual simple
    useEffect(() => {
      const timer = setTimeout(() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }, 500);

      return () => clearTimeout(timer);
    }, [localValue, value, onChange]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
      },
      [],
    );

    return (
      <Textarea
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Describe el motivo de la sesión o el diagnóstico realizado..."
        className="h-20 resize-none"
      />
    );
  },
);

DebouncedReasonTextarea.displayName = "DebouncedReasonTextarea";
