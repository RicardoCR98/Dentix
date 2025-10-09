import { useMemo, useState } from "react";
import { toInt } from "../lib/utils";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";

export type Tariff = Record<string, number>;
export type ProcItem = { name: string; unit: number; qty: number; sub: number };
export type SessionRow = {
  id?: string;
  date: string;
  items: ProcItem[];
  auto: boolean;
  budget: number;
  payment: number;
  balance: number;
  signer?: string;
};

const DEFAULT_PROCS = [
  "Curación","Resinas simples","Resinas compuestas","Extracciones simples","Extracciones complejas",
  "Correctivo inicial","Control mensual","Prótesis total","Prótesis removible","Prótesis fija",
  "Retenedor","Endodoncia simple","Endodoncia compleja","Limpieza simple","Limpieza compleja",
  "Reposición","Pegada"
];

export default function SessionsTable() {
  const [tariff, setTariff] = useState<Tariff>(() =>
    Object.fromEntries(DEFAULT_PROCS.map(p => [p, 0]))
  );
  const [rows, setRows] = useState<SessionRow[]>([]);
  const totals = useMemo(() => {
    const p = rows.reduce((acc, r) => acc + toInt(r.budget), 0);
    const a = rows.reduce((acc, r) => acc + toInt(r.payment), 0);
    const s = rows.reduce((acc, r) => acc + toInt(r.balance), 0);
    return { p, a, s };
  }, [rows]);

  const newRow = (copyFrom?: SessionRow): SessionRow => {
    const baseItems: ProcItem[] = DEFAULT_PROCS.map(name => {
      const prevQty = copyFrom?.items.find(i => i.name === name)?.qty ?? 0;
      const unit = copyFrom?.items.find(i => i.name === name)?.unit ?? toInt(tariff[name]);
      return { name, unit, qty: prevQty, sub: unit * prevQty };
    });
    const today = new Date().toISOString().slice(0, 10);
    const auto = copyFrom?.auto ?? true;
    const budget = auto
      ? baseItems.reduce((sum, it) => sum + toInt(it.unit) * toInt(it.qty), 0)
      : toInt(copyFrom?.budget ?? 0);
    const payment = toInt(copyFrom?.payment ?? 0);
    return {
      id: crypto.randomUUID(),
      date: today,
      items: baseItems,
      auto,
      budget,
      payment,
      balance: Math.max(budget - payment, 0),
      signer: copyFrom?.signer ?? ""
    };
  };

  const addRow = () => setRows(prev => [...prev, newRow(prev.at(-1))]);
  const delLast = () => setRows(prev => prev.slice(0, -1));

  const recalcRow = (idx: number, mutate?: (r: SessionRow) => void) => {
    setRows(prev => {
      const next = [...prev];
      const r = { ...next[idx] };
      mutate?.(r);
      r.items = r.items.map(it => ({ ...it, sub: toInt(it.unit) * toInt(it.qty) }));
      const totalProcs = r.items.reduce((sum, it) => sum + it.sub, 0);
      r.budget = r.auto ? totalProcs : toInt(r.budget);
      r.payment = Math.min(toInt(r.payment), r.budget);
      r.balance = Math.max(r.budget - r.payment, 0);
      next[idx] = r;
      return next;
    });
  };

  const updateTariff = (name: string, price: number) => {
    setTariff(t => {
      const t2 = { ...t, [name]: toInt(price) };
      setRows(prev => prev.map(r => ({
        ...r,
        items: r.items.map(it =>
          it.name === name ? { ...it, unit: toInt(price), sub: toInt(price) * toInt(it.qty) } : it
        )
      })));
      return t2;
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="ml-auto flex gap-2">
          <Button variant="primary" onClick={addRow}>Agregar evento</Button>
          <Button onClick={delLast}>Eliminar última</Button>
          <Button variant="ghost" onClick={()=>alert("Aquí conectaremos guardar en SQLite")}>Guardar cambios</Button>
        </div>
      </div>

      <details className="bg-surface rounded-[var(--radius)] shadow p-3 my-2 open:pb-4">
        <summary className="cursor-pointer select-none font-semibold">Tarifario (USD enteros) <span className="text-text-muted font-normal">— Aplica a todas las sesiones</span></summary>
        <div className="flex flex-wrap gap-4 mt-3">
          {DEFAULT_PROCS.map(p => (
            <div key={p} className="min-w-[240px] flex-1">
              <Label>{p}</Label>
              <Input type="number" min={0} step={1}
                value={tariff[p] || 0}
                onChange={e => updateTariff(p, toInt(e.target.value))}
              />
            </div>
          ))}
        </div>
      </details>

      <div className="overflow-auto">
        <table className="w-full text-[0.95rem] bg-[color-mix(in_oklab,var(--surface)_80%,#000_20%)] rounded-[var(--radius)] overflow-hidden">
          <thead className="bg-surface-soft">
            <tr className="text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2">Procedimiento (con cantidades)</th>
              <th className="p-2 text-center">Presupuesto</th>
              <th className="p-2 text-center">Abono</th>
              <th className="p-2 text-center">Saldo</th>
              <th className="p-2">Firma responsable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-b border-[color-mix(in_oklab,var(--surface)_55%,#fff_45%)]">
                <td className="p-2 align-top">
                  <Input type="date" value={r.date}
                    onChange={e => recalcRow(idx, rr => { rr.date = e.target.value; })}
                  />
                </td>
                <td className="p-2 align-top">
                  <details open className="rounded-md">
                    <summary className="cursor-pointer select-none text-sm">
                      Seleccionar tratamientos <span className="opacity-80 ml-1">
                        {r.items.filter(i=>i.qty>0).map(i=>`${i.name} ×${i.qty}`).join("; ") || "(ninguno)"}
                      </span>
                    </summary>
                    <div className="mt-2">
                      {r.items.map((it, iIdx) => (
                        <div key={it.name} className="grid grid-cols-[1fr_100px_80px_80px] gap-2 items-center my-1.5">
                          <div className="text-sm"><Label className="m-0">{it.name}</Label></div>
                          <Input className="h-9" type="number" min={0} step={1}
                            value={it.unit}
                            onChange={e => recalcRow(idx, rr => { rr.items[iIdx].unit = toInt(e.target.value); })}
                          />
                          <Input className="h-9" type="number" min={0} step={1}
                            value={it.qty}
                            onChange={e => recalcRow(idx, rr => { rr.items[iIdx].qty = toInt(e.target.value); })}
                          />
                          <div className="text-right font-medium">{it.sub}</div>
                        </div>
                      ))}
                      <div className="flex justify-between mt-3 pt-2 border-t border-dashed border-[hsl(var(--border))]">
                        <strong>Total</strong>
                        <strong>{r.items.reduce((sum, it)=>sum+it.sub, 0)}</strong>
                      </div>
                    </div>
                  </details>
                </td>
                <td className="p-2 align-top">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9"
                      type="number" min={0} step={1} value={r.budget}
                      onChange={e => recalcRow(idx, rr => { rr.auto = false; rr.budget = toInt(e.target.value); })}
                    />
                    <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
                      <input type="checkbox" checked={r.auto}
                        onChange={e => recalcRow(idx, rr => { rr.auto = e.target.checked; })} /> auto
                    </label>
                  </div>
                </td>
                <td className="p-2 align-top">
                  <Input className="h-9" type="number" min={0} step={1} value={r.payment}
                    onChange={e => recalcRow(idx, rr => { rr.payment = toInt(e.target.value); })}
                  />
                </td>
                <td className="p-2 align-top">
                  <Input className="h-9" type="number" min={0} step={1} value={r.balance} readOnly />
                </td>
                <td className="p-2 align-top">
                  <Input className="h-9" type="text" value={r.signer || ""} onChange={e => recalcRow(idx, rr => { rr.signer = e.target.value; })}/>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[color-mix(in_oklab,var(--surface)_85%,#fff_15%)] font-semibold">
            <tr>
              <td className="p-2 text-right" colSpan={2}>Totales:</td>
              <td className="p-2 text-center">{totals.p}</td>
              <td className="p-2 text-center">{totals.a}</td>
              <td className="p-2 text-center">{totals.s}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
