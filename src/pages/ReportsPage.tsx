// src/pages/ReportsPage.tsx
import { BarChart3, Calendar, TrendingUp, Users } from "lucide-react";
import Section from "../components/Section";
import { Alert } from "../components/ui/Alert";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Reportes</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Estadísticas y análisis de la clínica
        </p>
      </div>

      <Alert variant="info">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} />
          <div>
            <p className="font-medium">Sección en desarrollo</p>
            <p className="text-sm mt-1">
              Los reportes y gráficos estadísticos estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder Cards */}
        <Section title="Pacientes por Mes" icon={<Users size={20} />}>
          <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <Calendar size={48} className="mx-auto mb-2 opacity-50" />
              <p>Gráfico de pacientes atendidos</p>
            </div>
          </div>
        </Section>

        <Section title="Ingresos Mensuales" icon={<TrendingUp size={20} />}>
          <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>Gráfico de ingresos</p>
            </div>
          </div>
        </Section>

        <Section title="Procedimientos Más Comunes" icon={<BarChart3 size={20} />}>
          <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>Top 10 procedimientos</p>
            </div>
          </div>
        </Section>

        <Section title="Tasa de Retención" icon={<Users size={20} />}>
          <div className="h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>Pacientes recurrentes vs nuevos</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
