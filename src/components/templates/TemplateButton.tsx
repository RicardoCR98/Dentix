// src/components/templates/TemplateButton.tsx
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { PopoverRoot, PopoverTrigger, PopoverContent } from '../ui/Popover';
import { TemplateSelector } from './TemplateSelector';
import { TemplatesManagerModal } from '../TemplatesManagerModal';
import type { TemplateContext } from '../../lib/templates/templateProcessor';

interface TemplateButtonProps {
  kind: string;
  onInsert: (text: string) => void;
  context: TemplateContext;
  className?: string;
}

export function TemplateButton({ kind, onInsert, context, className }: TemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const handleSelect = (processedText: string) => {
    onInsert(processedText);
    setOpen(false);
  };

  const handleOpenSettings = () => {
    setOpen(false); // Cerrar el popover de selección
    setShowManager(true); // Abrir el modal de gestión
  };

  return (
    <>
      <PopoverRoot open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={className}
            type="button"
            title="Insertar plantilla"
          >
            <FileText size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96">
          <TemplateSelector
            kind={kind}
            onSelect={handleSelect}
            context={context}
            onOpenSettings={handleOpenSettings}
          />
        </PopoverContent>
      </PopoverRoot>

      <TemplatesManagerModal
        open={showManager}
        onOpenChange={setShowManager}
        defaultCategory={kind as any}
      />
    </>
  );
}
