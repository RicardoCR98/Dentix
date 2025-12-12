// src/components/QuickPaymentModal.tsx
import { useState, useEffect } from "react";
import { Save, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { DatePicker } from "./ui/DatePicker";
import { Label } from "./ui/Label";
import { SelectRoot, SelectTrigger, SelectContent, SelectItem } from "./ui/Select";
import type { PaymentMethod } from "../lib/types";

interface QuickPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  paymentMethods: PaymentMethod[];
  onSave: (payment: {
    date: string;
    amount: number;
    payment_method_id?: number;
    payment_notes?: string;
  }) => Promise<void>;
}

/**
 * QuickPaymentModal Component
 *
 * Modal for registering quick payments without clinical information.
 * Allows recording payment date, amount, method, and notes.
 *
 * Usage:
 * ```tsx
 * <QuickPaymentModal
 *   open={quickPaymentOpen}
 *   onOpenChange={setQuickPaymentOpen}
 *   patientId={patient.id}
 *   paymentMethods={paymentMethods}
 *   onSave={handleQuickPayment}
 * />
 * ```
 */
export function QuickPaymentModal({
  open,
  onOpenChange,
  patientId,
  paymentMethods,
  onSave,
}: QuickPaymentModalProps) {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [date, setDate] = useState<string>(getTodayDate());
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setDate(getTodayDate());
      setAmount("");
      setPaymentMethodId("");
      setNotes("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  // Validate form
  const validateForm = (): boolean => {
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum)) {
      setError("El monto es requerido");
      return false;
    }

    if (amountNum <= 0) {
      setError("El monto debe ser mayor a 0");
      return false;
    }

    if (!date) {
      setError("La fecha es requerida");
      return false;
    }

    setError("");
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const payment = {
        date,
        amount: parseFloat(amount),
        payment_method_id: paymentMethodId ? parseInt(paymentMethodId) : undefined,
        payment_notes: notes || undefined,
      };

      await onSave(payment);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el abono");
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar Abono Rápido"
      description="Registra un abono sin necesidad de agregar información clínica"
      size="md"
    >
      <DialogContent className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Date Field */}
        <div>
          <Label required>Fecha</Label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Seleccionar fecha"
            className="mt-1"
          />
        </div>

        {/* Amount Field */}
        <div>
          <Label required>Monto</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="mt-1"
            error={!!error && error.includes("monto")}
            autoFocus
          />
        </div>

        {/* Payment Method Field */}
        <div>
          <Label>Método de Pago</Label>
          <SelectRoot
            value={paymentMethodId}
            onValueChange={setPaymentMethodId}
          >
            <SelectTrigger className="mt-1">
              <span className="flex items-center gap-2">
                <CreditCard size={16} className="opacity-50" />
                {paymentMethodId
                  ? paymentMethods.find((m) => m.id === parseInt(paymentMethodId))?.name
                  : "Seleccionar método"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {paymentMethods
                .filter((m) => m.active !== false)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </SelectRoot>
        </div>

        {/* Notes Field */}
        <div>
          <Label>Notas</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre el pago..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? "Guardando..." : "Guardar Abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
