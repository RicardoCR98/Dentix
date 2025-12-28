// src/components/sessions/DebouncedReasonTextarea.tsx
import { memo, useState, useEffect, useCallback } from "react";
import { Textarea } from "../ui/Textarea";
import { TemplateButton } from "../templates/TemplateButton";
import type { TemplateContext } from "../../lib/templates/templateProcessor";

interface DebouncedReasonTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  templateContext?: TemplateContext;
}

export const DebouncedReasonTextarea = memo(
  ({ value, onChange, disabled, templateContext }: DebouncedReasonTextareaProps) => {
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

    const handleTemplateInsert = useCallback(
      (text: string) => {
        setLocalValue(text);
        onChange(text);
      },
      [onChange],
    );

    return (
      <div className="relative">
        <Textarea
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Describe el motivo de la sesión o el diagnóstico realizado..."
          className="h-20 resize-none pr-10"
        />
        {!disabled && templateContext && (
          <TemplateButton
            kind="reason_detail"
            onInsert={handleTemplateInsert}
            context={templateContext}
            className="absolute top-2 right-2"
          />
        )}
      </div>
    );
  },
);

DebouncedReasonTextarea.displayName = "DebouncedReasonTextarea";
