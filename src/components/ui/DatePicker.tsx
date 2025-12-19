// src/components/ui/DatePicker.tsx
import { useEffect, useRef, useState } from "react";
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

const PLACEHOLDER = "dd/mm/yyyy";
const DIGIT_POSITIONS = [0, 1, 3, 4, 6, 7, 8, 9];

const getDigitIndexBeforeCaret = (caret: number): number | null => {
  for (let i = DIGIT_POSITIONS.length - 1; i >= 0; i--) {
    if (DIGIT_POSITIONS[i] < caret) return i;
  }
  return null;
};

const getDigitIndexAfterCaret = (caret: number): number | null => {
  for (let i = 0; i < DIGIT_POSITIONS.length; i++) {
    if (DIGIT_POSITIONS[i] >= caret) return i;
  }
  return null;
};

const getCaretPositionForDigitCount = (digitCount: number) =>
  digitCount >= DIGIT_POSITIONS.length
    ? PLACEHOLDER.length
    : DIGIT_POSITIONS[digitCount];

function isoToDigits(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  if (!year || !month || !day) return "";
  return `${day}${month}${year}`;
}

function buildMaskedValue(digits: string): string {
  const chars = PLACEHOLDER.split("");
  digits
    .slice(0, 8)
    .split("")
    .forEach((digit, idx) => {
      const position = DIGIT_POSITIONS[idx];
      if (typeof position === "number") {
        chars[position] = digit;
      }
    });
  return chars.join("");
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = PLACEHOLDER,
  mode = "default",
  minYear,
  maxYear,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [rawDigits, setRawDigits] = useState(() =>
    value ? isoToDigits(value) : "",
  );
  const displayValue = buildMaskedValue(rawDigits);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);

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
  const selectedDayRef = useRef<HTMLButtonElement | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handleDateSelect = (day: number) => {
    const month = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${month}-${dayStr}`;
    onChange?.(dateStr);
    setRawDigits(isoToDigits(dateStr));
    syncCalendarWithIso(dateStr);
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
    setRawDigits(isoToDigits(dateStr));
    syncCalendarWithIso(dateStr);
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

  const clampNumber = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  };

  const getMaxDayForMonth = (month: number) => {
    const DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return DAYS_PER_MONTH[month - 1] ?? 31;
  };

  const formatInputDigits = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (!digits) return "";

    const daySegment = digits.slice(0, 2);
    const monthSegment = digits.slice(2, 4);
    const yearSegment = digits.slice(4, 8);

    const segments: string[] = [];

    if (daySegment) {
      let dayText = daySegment;
      if (daySegment.length === 2) {
        const rawDay = Number(daySegment);
        const monthNum =
          monthSegment.length === 2
            ? clampNumber(Number(monthSegment) || 1, 1, 12)
            : undefined;
        const maxDay =
          monthNum !== undefined ? getMaxDayForMonth(monthNum) : 31;
        const clamped = clampNumber(rawDay || 1, 1, maxDay);
        dayText = clamped.toString().padStart(2, "0");
      }
      segments.push(dayText);
    }

    if (monthSegment) {
      let monthText = monthSegment;
      if (monthSegment.length === 2) {
        const clampedMonth = clampNumber(Number(monthSegment) || 1, 1, 12);
        monthText = clampedMonth.toString().padStart(2, "0");
      }
      segments.push(monthText);
    }

    if (yearSegment) {
      segments.push(yearSegment);
    }

    return segments.join("");
  };

  const isValidDateParts = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      year >= yearMin &&
      year <= yearMax
    );
  };

  const digitsToIso = (digits: string): string | null => {
    if (digits.length !== 8) return null;
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);
    if (isValidDateParts(yearNum, monthNum, dayNum)) {
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const parseDateFromInput = (text: string): string | null => {
    const cleaned = text.trim();
    if (!cleaned) return null;

    const normalized = cleaned.replace(/[./]/g, "-");
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const yearNum = Number(year);
      const monthNum = Number(month);
      const dayNum = Number(day);
      if (isValidDateParts(yearNum, monthNum, dayNum)) {
        return `${year}-${month}-${day}`;
      }
    }

    const dmyMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const yearNum = Number(year);
      const monthNum = Number(month);
      const dayNum = Number(day);
      if (isValidDateParts(yearNum, monthNum, dayNum)) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }

    const looseMatch = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (looseMatch) {
      const [, day, month, year] = looseMatch;
      const currentYear = new Date().getFullYear();
      const shortYear = Number(year);
      let yearNum = shortYear;

      if (year.length === 2) {
        const century = currentYear - (currentYear % 100);
        yearNum = century + shortYear;
        if (yearNum > currentYear) {
          yearNum -= 100;
        }
      }

      const monthNum = Number(month);
      const dayNum = Number(day);
      if (isValidDateParts(yearNum, monthNum, dayNum)) {
        return `${yearNum}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }

    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      if (isValidDateParts(year, Number(month), Number(day))) {
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  };

  const syncCalendarWithIso = (iso: string) => {
    const parsed = new Date(iso + "T00:00:00");
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  };

  useEffect(() => {
    if (value) {
      setRawDigits(isoToDigits(value));
      syncCalendarWithIso(value);
    } else {
      setRawDigits("");
    }
  }, [value]);

  useEffect(() => {
    if (caretRef.current !== null && inputRef.current) {
      const clamped = Math.min(
        Math.max(caretRef.current, 0),
        displayValue.length,
      );
      inputRef.current.setSelectionRange(clamped, clamped);
      caretRef.current = null;
    }
  }, [displayValue]);

  const focusNextField = (element: HTMLInputElement) => {
    const form = element.form;
    if (!form) return;
    const controls = Array.from(form.elements).filter(
      (control): control is HTMLElement =>
        control instanceof HTMLElement && !control.hasAttribute("disabled"),
    );
    const currentIndex = controls.findIndex((control) => control === element);
    const next = controls[currentIndex + 1];
    if (next?.focus) {
      next.focus();
    }
  };

  useEffect(() => {
    if (open && selectedDayRef.current) {
      selectedDayRef.current.focus();
    }
  }, [open, viewMonth, viewYear, value]);

  const handleManualInput = (text: string, digitsOverride?: string) => {
    const digits = digitsOverride ?? formatInputDigits(text);
    caretRef.current = getCaretPositionForDigitCount(digits.length);
    setRawDigits(digits);
    if (digits.length === 8) {
      const parsedIso = digitsToIso(digits);
      if (parsedIso) {
        onChange?.(parsedIso);
        const isoDigits = isoToDigits(parsedIso);
        caretRef.current = getCaretPositionForDigitCount(isoDigits.length);
        setRawDigits(isoDigits);
        syncCalendarWithIso(parsedIso);
      }
    }
  };

  const handleInputCommit = () => {
    if (!rawDigits) {
      onChange?.("");
      return;
    }
    const isoFromDigits = digitsToIso(rawDigits);
    if (isoFromDigits) {
      onChange?.(isoFromDigits);
      setRawDigits(isoToDigits(isoFromDigits));
      syncCalendarWithIso(isoFromDigits);
      return;
    }
    const fallback = parseDateFromInput(displayValue);
    if (fallback) {
      onChange?.(fallback);
      setRawDigits(isoToDigits(fallback));
      syncCalendarWithIso(fallback);
    }
  };

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          ref={inputRef}
          onChange={(event) => {
            handleManualInput(event.target.value);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData?.getData("text/plain") ?? "";
            const digits = formatInputDigits(pasted);
            handleManualInput(pasted, digits);
          }}
          onBlur={handleInputCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleInputCommit();
              focusNextField(event.currentTarget as HTMLInputElement);
              return;
            }
            const caret =
              inputRef.current?.selectionStart ?? displayValue.length;
            if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              const targetIndex =
                event.key === "Backspace"
                  ? getDigitIndexBeforeCaret(caret)
                  : getDigitIndexAfterCaret(caret);
              if (targetIndex === null) return;
              setRawDigits((current) => {
                if (targetIndex >= current.length) return current;
                const next = current.split("");
                next.splice(targetIndex, 1);
                caretRef.current = getCaretPositionForDigitCount(targetIndex);
                return next.join("");
              });
            }
          }}
          className={cn(
            "flex-1 h-11 px-3 rounded-md border border-[hsl(var(--border))]",
            "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] text-sm",
            "hover:border-[hsl(var(--brand))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand))]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          )}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "h-11 w-11 flex items-center justify-center rounded-md border border-[hsl(var(--border))]",
              "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
              "hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand))]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            aria-label="Abrir calendario"
          >
            <Calendar size={16} className="opacity-70" />
          </button>
        </PopoverTrigger>
      </div>
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
                    ref={isSelectedDay(day) ? selectedDayRef : null}
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
