// src/components/templates/TemplateSelector.tsx
import { useState, useEffect } from 'react';
import { Search, Star, Settings } from 'lucide-react';
import { tauriSqliteRepository } from '../../lib/storage/TauriSqliteRepository';
import { processTemplate, type TemplateContext } from '../../lib/templates/templateProcessor';
import type { TextTemplate } from '../../lib/types';

interface TemplateSelectorProps {
  kind: string;
  onSelect: (processedText: string) => void;
  context: TemplateContext;
  onOpenSettings?: () => void;
}

export function TemplateSelector({ kind, onSelect, context, onOpenSettings }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [kind]);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      // Limpiar duplicados si existen
      await tauriSqliteRepository.cleanDuplicateTemplates();

      const data = await tauriSqliteRepository.getTextTemplatesByKind(kind);

      // Ordenar: favoritas primero, luego por sort_order
      const sorted = data.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      setTemplates(sorted);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (template: TextTemplate) => {
    const processedText = processTemplate(template.body, context);
    onSelect(processedText);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Cargando plantillas...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No hay plantillas disponibles para este campo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header con búsqueda y botón de configuración */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
          />
          <input
            type="text"
            placeholder="Buscar plantilla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-[hsl(var(--border))]
              bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
              placeholder:text-[hsl(var(--muted-foreground))]
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
            autoFocus
          />
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-md border border-[hsl(var(--border))]
              bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))]
              transition-colors"
            title="Gestionar plantillas"
          >
            <Settings size={16} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Lista de plantillas */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filteredTemplates.length === 0 ? (
          <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No se encontraron plantillas
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="w-full text-left px-3 py-2 rounded-md text-sm
                hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]
                transition-colors flex items-center gap-2"
              title={template.body}
            >
              {template.is_favorite && (
                <Star
                  size={14}
                  className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                />
              )}
              <span className="flex-1 truncate">{template.title}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
