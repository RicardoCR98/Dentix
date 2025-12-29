// src/components/ui/AppointmentPicker.tsx
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/cn";

export interface TimeSlot {
  date: Date;
  hour: number;
  minute: number;
  isAvailable: boolean;
  appointmentId?: number;
}

export interface AppointmentPickerProps {
  /**
   * Currently booked appointments to mark as unavailable
   */
  bookedSlots?: Array<{
    starts_at: string; // ISO datetime
    ends_at: string;
  }>;

  /**
   * Callback when a slot is selected
   */
  onSlotSelect?: (date: Date) => void;

  /**
   * Currently selected slot
   */
  selectedSlot?: Date | null;

  /**
   * Duration of appointments in minutes (default: 30)
   */
  slotDuration?: number;

  /**
   * Work hours (default: 8:00 - 18:00)
   */
  workStartHour?: number;
  workEndHour?: number;

  /**
   * Lunch break hours (default: 12:00 - 13:00)
   */
  lunchStartHour?: number;
  lunchEndHour?: number;
}

export function AppointmentPicker({
  bookedSlots = [],
  onSlotSelect,
  selectedSlot,
  slotDuration = 30,
  workStartHour = 8,
  workEndHour = 18,
  lunchStartHour = 12,
  lunchEndHour = 13,
}: AppointmentPickerProps) {
  // Current month view
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Selected day for showing time slots
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Adjust for Monday start (0 = Sunday, 1 = Monday)
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Generate days array
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month padding to complete weeks
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, isCurrentMonth: false });
      }
    }

    return days;
  }, [currentMonth]);

  // Generate time slots for selected day
  const dayTimeSlots = useMemo(() => {
    if (!selectedDay) return [];

    const slots: TimeSlot[] = [];
    const totalMinutes = (workEndHour - workStartHour) * 60;
    const slotsCount = totalMinutes / slotDuration;

    for (let i = 0; i < slotsCount; i++) {
      const totalMinutesFromStart = i * slotDuration;
      const hour = workStartHour + Math.floor(totalMinutesFromStart / 60);
      const minute = totalMinutesFromStart % 60;

      // Skip lunch break
      const isLunchTime = hour >= lunchStartHour && hour < lunchEndHour;
      if (isLunchTime) continue;

      const slotDate = new Date(selectedDay);
      slotDate.setHours(hour, minute, 0, 0);

      // Check if slot is booked
      const isBooked = bookedSlots.some((booked) => {
        const bookedStart = new Date(booked.starts_at);
        const bookedEnd = new Date(booked.ends_at);
        return slotDate >= bookedStart && slotDate < bookedEnd;
      });

      // Check if slot is in the past
      const isPast = slotDate < new Date();

      slots.push({
        date: slotDate,
        hour,
        minute,
        isAvailable: !isBooked && !isPast,
      });
    }

    return slots;
  }, [selectedDay, bookedSlots, slotDuration, workStartHour, workEndHour, lunchStartHour, lunchEndHour]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable && onSlotSelect) {
      onSlotSelect(slot.date);
    }
  };

  const isSlotSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return slot.date.getTime() === selectedSlot.getTime();
  };

  const isDaySelected = (date: Date) => {
    if (!selectedDay) return false;
    return (
      date.getDate() === selectedDay.getDate() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getFullYear() === selectedDay.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Column 1: Calendar */}
      <div className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </Button>
          <div className="text-sm font-semibold capitalize">
            {formatMonthYear(currentMonth)}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-center text-[hsl(var(--muted-foreground))] py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isPastDay = day.date < new Date(new Date().setHours(0, 0, 0, 0));
              const selected = isDaySelected(day.date);
              const today = isToday(day.date);

              return (
                <button
                  key={idx}
                  onClick={() => day.isCurrentMonth && !isPastDay && handleDayClick(day.date)}
                  disabled={!day.isCurrentMonth || isPastDay}
                  className={cn(
                    "aspect-square rounded-lg text-sm transition-all",
                    "flex items-center justify-center",
                    // Current month days
                    day.isCurrentMonth && !isPastDay && !selected && "hover:bg-[hsl(var(--muted))] cursor-pointer",
                    day.isCurrentMonth && !isPastDay && "text-[hsl(var(--text))]",
                    // Selected day
                    selected && "bg-[hsl(var(--brand))] text-white font-semibold",
                    // Today indicator
                    today && !selected && "ring-2 ring-[hsl(var(--brand))]/30 font-semibold",
                    // Other month or past days
                    (!day.isCurrentMonth || isPastDay) && "text-[hsl(var(--muted-foreground))]/40 cursor-not-allowed"
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="text-xs text-[hsl(var(--text-muted))] space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-[hsl(var(--brand))]/30" />
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[hsl(var(--brand))]" />
            <span>Día seleccionado</span>
          </div>
        </div>
      </div>

      {/* Column 2: Time Slots */}
      <div className="border-l border-[hsl(var(--border))] pl-4">
        {!selectedDay ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[hsl(var(--text-muted))]">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Selecciona un día para ver horarios disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Selected day header */}
            <div className="pb-2 border-b border-[hsl(var(--border))]">
              <div className="text-sm font-semibold">
                {selectedDay.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="text-xs text-[hsl(var(--text-muted))] mt-1">
                {dayTimeSlots.filter((s) => s.isAvailable).length} horarios disponibles
              </div>
            </div>

            {/* Time slots grid */}
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {dayTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--text-muted))]">
                  <Clock size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay horarios configurados para este día</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {dayTimeSlots.map((slot, idx) => {
                    const selected = isSlotSelected(slot);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.isAvailable}
                        className={cn(
                          "px-3 py-2.5 rounded-lg border text-center transition-all",
                          "flex flex-col items-center gap-1",
                          // Available slot
                          slot.isAvailable &&
                            !selected &&
                            "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 cursor-pointer",
                          // Selected slot
                          selected &&
                            "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white font-semibold ring-2 ring-[hsl(var(--brand))]/50",
                          // Unavailable slot
                          !slot.isAvailable &&
                            "bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-not-allowed opacity-60"
                        )}
                      >
                        <span className="font-medium text-sm">
                          {slot.hour.toString().padStart(2, "0")}:
                          {slot.minute.toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs">
                          {slot.isAvailable ? "Disponible" : "Ocupado"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-[hsl(var(--border))] space-y-1 text-xs text-[hsl(var(--text-muted))]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]" />
                <span>Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[hsl(var(--brand))]" />
                <span>Seleccionado</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
