// src/components/ui/DatePicker.tsx
import { useState } from "react";
import { PopoverRoot, PopoverTrigger, PopoverContent } from "./Popover";
import { Button } from "./Button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import * as Select from "@radix-ui/react-select";

interface DatePickerProps {
  value?: string; // Formato YYYY-MM-DD
  onChange?: (date: string) => void; // Formato YYYY-MM-DD
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  mode?: "default" | "birthdate"; // Modo para fechas de nacimiento
  minYear?: number; // Año mínimo para el selector
  maxYear?: number; // Año máximo para el selector
}

// Función auxiliar para formato de fecha DD/MM/YYYY
function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr || dateStr.length !== 10) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Función para obtener días en un mes
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Función para obtener el primer día de la semana (0 = domingo)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Seleccionar fecha",
  mode = "default",
  minYear,
  maxYear,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Configurar años basado en el modo
  const currentYear = new Date().getFullYear();
  const defaultMinYear = mode === "birthdate" ? 1920 : currentYear - 10;
  const defaultMaxYear = mode === "birthdate" ? currentYear : currentYear + 10;

  const yearMin = minYear ?? defaultMinYear;
  const yearMax = maxYear ?? defaultMaxYear;

  // Usar la fecha seleccionada o una fecha por defecto según el modo
  const defaultDate =
    mode === "birthdate"
      ? new Date(currentYear - 30, 0, 1) // 30 años atrás para fechas de nacimiento
      : new Date();
  const selectedDate = value ? new Date(value + "T00:00:00") : defaultDate;
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handleDateSelect = (day: number) => {
    const month = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${month}-${dayStr}`;
    onChange?.(dateStr);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = `${today.getFullYear()}-${month}-${day}`;
    onChange?.(dateStr);
    setOpen(false);
  };

  // Generar array de años para el selector
  const years: number[] = [];
  for (let y = yearMax; y >= yearMin; y--) {
    years.push(y);
  }

  const handleYearChange = (year: string) => {
    setViewYear(parseInt(year));
  };

  const handleMonthChange = (month: string) => {
    setViewMonth(parseInt(month));
  };

  // Generar array de días (incluyendo espacios vacíos al inicio)
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Verificar si un día está seleccionado
  const isSelectedDay = (day: number): boolean => {
    if (!value) return false;
    const selected = new Date(value + "T00:00:00");
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewMonth &&
      selected.getFullYear() === viewYear
    );
  };

  // Verificar si es hoy
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full h-11 px-3 rounded-md border border-[hsl(var(--border))]",
            "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-sm",
            "hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand))]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !value && "text-[hsl(var(--muted-foreground))]",
            className,
          )}
        >
          <span>{value ? formatDateToDDMMYYYY(value) : placeholder}</span>
          <Calendar size={16} className="ml-2 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header con navegación de mes/año */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 shrink-0"
            >
              <ChevronLeft size={16} />
            </Button>

            <div className="flex items-center gap-2 flex-1">
              {/* Selector de Mes */}
              <Select.Root
                value={String(viewMonth)}
                onValueChange={handleMonthChange}
              >
                <Select.Trigger
                  className={cn(
                    "flex-1 h-8 px-2 text-sm font-semibold rounded-md",
                    "border border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                    "hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]",
                  )}
                >
                  <Select.Value>{MONTHS[viewMonth]}</Select.Value>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className={cn(
                      "overflow-hidden rounded-lg bg-[hsl(var(--surface))]",
                      "border border-[hsl(var(--border))] shadow-lg z-50",
                    )}
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {MONTHS.map((month, idx) => (
                        <Select.Item
                          key={idx}
                          value={String(idx)}
                          className={cn(
                            "relative flex items-center px-6 py-1.5 text-sm rounded-md",
                            "hover:bg-[hsl(var(--muted))] cursor-pointer outline-none",
                            "data-[state=checked]:bg-[hsl(var(--brand))] data-[state=checked]:text-white",
                          )}
                        >
                          <Select.ItemText>{month}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* Selector de Año */}
              <Select.Root
                value={String(viewYear)}
                onValueChange={handleYearChange}
              >
                <Select.Trigger
                  className={cn(
                    "w-20 h-8 px-2 text-sm font-semibold rounded-md",
                    "border border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                    "hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]",
                  )}
                >
                  <Select.Value>{viewYear}</Select.Value>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className={cn(
                      "overflow-hidden rounded-lg bg-[hsl(var(--surface))]",
                      "border border-[hsl(var(--border))] shadow-lg z-50",
                    )}
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1 max-h-[200px]">
                      {years.map((year) => (
                        <Select.Item
                          key={year}
                          value={String(year)}
                          className={cn(
                            "relative flex items-center px-6 py-1.5 text-sm rounded-md",
                            "hover:bg-[hsl(var(--muted))] cursor-pointer outline-none",
                            "data-[state=checked]:bg-[hsl(var(--brand))] data-[state=checked]:text-white",
                          )}
                        >
                          <Select.ItemText>{year}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 shrink-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-[hsl(var(--muted-foreground))] h-8 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <div key={idx} className="flex items-center justify-center">
                {day === null ? (
                  <div className="h-8 w-8" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm font-medium",
                      "hover:bg-[hsl(var(--muted))] transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]",
                      isSelectedDay(day) &&
                        "bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]",
                      isToday(day) &&
                        !isSelectedDay(day) &&
                        "border border-[hsl(var(--brand))] text-[hsl(var(--brand))]",
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón Hoy (solo en modo default) */}
          {mode === "default" && (
            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="w-full"
              >
                Hoy
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}
