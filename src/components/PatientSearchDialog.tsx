// src/components/PatientSearchDialog.tsx
import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Search, User, Phone, Hash, FileText } from "lucide-react";
import { cn } from "../lib/cn";
import type { Patient } from "../lib/types";

interface PatientSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientSearchDialog({
  open,
  onOpenChange,
  patients,
  onSelectPatient,
}: PatientSearchDialogProps) {
  // Valor que el usuario escribe
  const [inputValue, setInputValue] = useState("");
  // Valor "real" usado para buscar (con debounce)
  const [searchTerm, setSearchTerm] = useState("");

  // 🔄 Debounce de 250 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const hasTyped = searchTerm.length > 0;

  // 🔍 Filtrar pacientes (solo cuando hay texto)
  const filteredPatients = useMemo(() => {
    if (!hasTyped) return [];
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(term) ||
        p.doc_id?.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term),
    );
  }, [patients, hasTyped, searchTerm]);

  // Mostrar máximo 5
  const limitedPatients = filteredPatients.slice(0, 5);

  const handleSelect = (patient: Patient) => {
    onSelectPatient(patient);
    onOpenChange(false);
    setInputValue("");
    setSearchTerm("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setInputValue("");
          setSearchTerm("");
        }
      }}
      size="3xl"
    >
      <DialogContent>
        {/* Barra de búsqueda con efecto spotlight */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl opacity-50" />
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre, cédula, edad, teléfono..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              icon={<Search size={18} />}
              autoFocus
              className="h-14 text-lg bg-[hsl(var(--surface))]/80 backdrop-blur-sm border-[hsl(var(--muted-foreground))]/20 focus:border-[hsl(var(--brand))] focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-6 space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--muted))] scrollbar-track-transparent">
          {/* Estado inicial: sin escribir */}
          {!hasTyped ? (
            <div className="text-center py-16">
              <Search
                size={52}
                className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-60"
              />
              <p className="text-[hsl(var(--muted-foreground))] font-medium">
                Busca a alguien
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Escribe un nombre, cédula, edad o teléfono para ver
                resultados...
              </p>
            </div>
          ) : limitedPatients.length === 0 ? (
            // Sin coincidencias
            <div className="text-center py-12">
              <User
                size={48}
                className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-40"
              />
              <p className="text-[hsl(var(--muted-foreground))]">
                No se encontraron pacientes
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {filteredPatients.length} paciente
                  {filteredPatients.length !== 1 ? "s" : ""} encontrado
                  {filteredPatients.length !== 1 ? "s" : ""}
                </p>
                {filteredPatients.length > 5 && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Mostrando los primeros 5
                  </p>
                )}
              </div>

              {limitedPatients.map((patient) => (
                <Button
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  variant="ghost"
                  className={cn(
                    "h-20 group w-full text-left rounded-xl",
                    "border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
                    "hover:bg-[hsl(var(--muted))]/50 active:scale-[0.995]",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface))]",
                  )}
                >
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Nombre */}
                      <div className="flex items-center gap-2">
                        <User
                          size={18}
                          className="shrink-0 text-[hsl(var(--brand))] opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="font-semibold text-base leading-tight truncate">
                          {patient.full_name}
                        </span>
                      </div>

                      {/* Info adicional */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                        {patient.doc_id && (
                          <div className="inline-flex items-center gap-1.5 min-w-0">
                            <Hash size={14} className="opacity-70" />
                            <span className="truncate">{patient.doc_id}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="inline-flex items-center gap-1.5 min-w-0">
                            <Phone size={14} className="opacity-70" />
                            <span className="truncate">{patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <Badge
                      variant="info"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                    >
                      <FileText size={14} />
                      Ver historial
                    </Badge>
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Footer con atajos de teclado */}
        <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-[hsl(var(--muted))] rounded border border-[hsl(var(--border))]">
              ESC
            </kbd>
            <span>para cerrar</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Click para seleccionar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
