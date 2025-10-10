// src/components/DentalChart.tsx
import { cn } from "../lib/cn";

type Props = {
  /** dientes activos por diagnóstico (ej: con value[tooth].length > 0) */
  activeTeeth?: Set<string>;
  /** diente actualmente enfocado/seleccionado (resalta aunque no tenga diagnóstico) */
  focusedTooth?: string | null;
  /** callback al hacer clic en un diente */
  onToothClick?: (tooth: string) => void;
  /** alto del SVG (el ancho se adapta) */
  height?: number;
};

/**
 * DentalChart: dentadura simplificada en SVG (arco superior e inferior).
 * Cada diente es un "bloque" clickeable que se resalta si está activo o enfocado.
 *
 * FDI mapeado así:
 *  Superior: 18..11 (derecha a izquierda) y 21..28 (izquierda a derecha)
 *  Inferior: 48..41 (derecha a izquierda) y 31..38 (izquierda a derecha)
 */
export default function DentalChart({
  activeTeeth = new Set<string>(),
  focusedTooth = null,
  onToothClick,
  height = 180,
}: Props) {
  // Filas (de izquierda a derecha visual), pero con etiquetas según FDI
  const upperRow = [
    "18","17","16","15","14","13","12","11",
    "21","22","23","24","25","26","27","28",
  ];
  const lowerRow = [
    "48","47","46","45","44","43","42","41",
    "31","32","33","34","35","36","37","38",
  ];

  const PADDING = 12;
  const GAP = 6;
  const TEETH_PER_ROW = 16;
  const width = 800; // canvas base (se escala por CSS si quieres)
  const rowHeight = (height - PADDING * 2 - GAP) / 2;
  const toothWidth = (width - PADDING * 2 - GAP * (TEETH_PER_ROW - 1)) / TEETH_PER_ROW;
  const toothHeight = rowHeight * 0.8; // deja un margen para simular curvatura
  const radius = 8;

  // Curvatura ligera: desplazamos en Y algunos dientes para dar forma de arco
  const archYOffset = (idx: number) => {
    // índice centrado (-7.5 a +7.5)
    const x = idx - (TEETH_PER_ROW - 1) / 2;
    // parábola leve
    return -Math.pow(x / 4.2, 2) + 6;
  };

  const drawRow = (row: string[], yBase: number, isUpper: boolean) => {
    return row.map((tooth, idx) => {
      const x =
        PADDING + idx * (toothWidth + GAP);
      const yCenter = yBase + (isUpper ? archYOffset(idx) : -archYOffset(idx));
      const y = yCenter - toothHeight / 2;

      const isActive = activeTeeth.has(tooth);
      const isFocused = focusedTooth === tooth;

      return (
        <g key={tooth} transform={`translate(${x}, ${y})`}>
          <rect
            width={toothWidth}
            height={toothHeight}
            rx={radius}
            className={cn(
              "transition-all cursor-pointer",
              // base
              "fill-[hsl(var(--surface))] stroke-[hsl(var(--border))]",
              "hover:stroke-[hsl(var(--brand))] hover:shadow-md",
              // activo por diagnóstico
              isActive &&
                "fill-[color-mix(in_oklab,hsl(var(--brand))_18%,transparent)] stroke-[hsl(var(--brand))]",
              // foco/selección (más intenso)
              isFocused &&
                "fill-[color-mix(in_oklab,hsl(var(--brand))_30%,transparent)] stroke-[hsl(var(--brand))] stroke-[2.5]"
            )}
            onClick={() => onToothClick?.(tooth)}
          />
          {/* Número FDI */}
          <text
            x={toothWidth / 2}
            y={toothHeight / 2 + 4}
            textAnchor="middle"
            className={cn(
              "select-none text-[10px] font-semibold",
              isActive || isFocused
                ? "fill-[hsl(var(--brand-foreground, --foreground))]"
                : "fill-[hsl(var(--muted-foreground))]"
            )}
            style={{ userSelect: "none" }}
          >
            {tooth}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Dentadura odontograma"
      >
        {/* Arco superior */}
        {drawRow(upperRow, PADDING + rowHeight / 2, true)}
        {/* Arco inferior */}
        {drawRow(lowerRow, PADDING + rowHeight + GAP + rowHeight / 2, false)}
      </svg>
      <div className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Haz clic en un diente para seleccionarlo / abrir su ficha.
      </div>
    </div>
  );
}
