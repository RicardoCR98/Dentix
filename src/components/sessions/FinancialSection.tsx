// src/components/sessions/FinancialSection.tsx
import { memo } from "react";
import { DollarSign, CreditCard } from "lucide-react";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "../ui/Select";
import type { Visit, PaymentMethod } from "../../lib/types";

interface FinancialSectionProps {
  visit: Visit;
  isEditable: boolean;
  previousBalance: number;
  paymentMethods: PaymentMethod[];
  onBudgetChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentChange: (value: number) => void;
  onPaymentMethodChange: (value: number | undefined) => void;
  onPaymentNotesChange: (value: string) => void;
}

/**
 * Sección de información financiera de una sesión
 */
export const FinancialSection = memo(
  ({
    visit,
    isEditable,
    previousBalance,
    paymentMethods,
    onBudgetChange,
    onDiscountChange,
    onPaymentChange,
    onPaymentMethodChange,
    onPaymentNotesChange,
  }: FinancialSectionProps) => {
    return (
      <div className="border-t-2 @[1000px]:border-t-0 @[1000px]:border-l-2 border-blue-200 flex flex-col">
        <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide px-3 py-2.5 border-b-2 border-blue-200 text-center ">
          Información Financiera
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-full px-3 py-2 space-y-2">
            {/* Presupuesto */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-2">
                Presupuesto
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={visit.budget}
                  onChange={(e) =>
                    onBudgetChange(parseInt(e.target.value) || 0)
                  }
                  disabled={!isEditable}
                  icon={<DollarSign size={14} />}
                  className="h-9 text-sm flex-1"
                />
              </div>
            </div>

            {/* Descuento */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                Descuento
              </label>
              <Input
                type="number"
                min={0}
                step={1}
                value={visit.discount || ""}
                onChange={(e) =>
                  onDiscountChange(parseInt(e.target.value) || 0)
                }
                icon={<DollarSign size={14} />}
                placeholder="0"
                disabled={!isEditable}
                className="h-9 text-sm"
              />
            </div>

            {/* Abono */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                Abono
              </label>
              <Input
                type="number"
                min={0}
                step={1}
                value={visit.payment || ""}
                onChange={(e) => onPaymentChange(parseInt(e.target.value) || 0)}
                icon={<DollarSign size={14} />}
                placeholder="0"
                disabled={!isEditable}
                className="h-9 text-sm"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                <CreditCard size={12} />
                Método de pago
              </label>
              <SelectRoot
                value={visit.payment_method_id?.toString() || ""}
                onValueChange={(val) =>
                  onPaymentMethodChange(val ? parseInt(val) : undefined)
                }
                disabled={!isEditable}
              >
                <SelectTrigger className="h-9 text-sm" />
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id!.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            {/* Payment Notes */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                Notas de pago
              </label>
              <Textarea
                value={visit.payment_notes || ""}
                onChange={(e) => onPaymentNotesChange(e.target.value)}
                disabled={!isEditable}
                placeholder="Detalles del pago..."
                className="h-16 text-xs resize-none"
              />
            </div>

            {/* Saldo de esta sesión */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                Saldo sesión
              </label>
              <div className="text-center font-bold rounded-md h-9 flex items-center justify-center text-sm bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                ${visit.balance}
              </div>
            </div>

            {/* Resumen de saldos (solo si hay saldo anterior) */}
            {previousBalance > 0 && (
              <div className="pt-3 mt-3 border-t-2 border-orange-300 space-y-2">
                <div className="text-[10px] font-bold text-orange-700 dark:text-orange-500 uppercase tracking-wide flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Resumen de saldos
                </div>

                {/* Saldo anterior */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 flex justify-between items-center">
                  <span className="text-xs text-orange-900 dark:text-orange-200 font-medium">
                    Saldo anterior
                  </span>
                  <span className="font-bold text-sm text-orange-700 dark:text-orange-400">
                    ${previousBalance}
                  </span>
                </div>

                {/* Esta sesión */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 flex justify-between items-center">
                  <span className="text-xs text-red-900 dark:text-red-200 font-medium">
                    Esta sesión
                  </span>
                  <span className="font-bold text-sm text-red-700 dark:text-red-400">
                    ${visit.balance}
                  </span>
                </div>

                {/* Saldo total destacado */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-3 flex justify-between items-center shadow-md">
                  <span className="text-xs text-white font-bold uppercase tracking-wide">
                    Total debe
                  </span>
                  <span className="text-xl font-black text-white">
                    ${previousBalance + visit.balance}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FinancialSection.displayName = "FinancialSection";
