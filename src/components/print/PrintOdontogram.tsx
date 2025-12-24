// src/components/print/PrintOdontogram.tsx
import { memo } from "react";
import type { ToothDx } from "../../lib/types";
import {
  getPermanentTeethRanges,
  getDeciduousTeethRanges,
  getToothStatusColor,
  groupTeethByType,
} from "../../lib/print-utils";

interface PrintOdontogramProps {
  toothDx: ToothDx;
  autoDiagnosis: string;
  manualDiagnosis: string;
}

export const PrintOdontogram = memo(function PrintOdontogram({
  toothDx,
  autoDiagnosis,
  manualDiagnosis,
}: PrintOdontogramProps) {
  const { permanent, deciduous } = groupTeethByType(toothDx);
  const hasPermanent = Object.keys(permanent).length > 0 || Object.keys(toothDx).length === 0;
  const hasDeciduous = Object.keys(deciduous).length > 0;

  const permanentRanges = getPermanentTeethRanges();
  const deciduousRanges = getDeciduousTeethRanges();

  // Render tooth box
  const renderTooth = (toothNumber: string, diagnoses?: string[]) => {
    if (!diagnoses || diagnoses.length === 0) {
      return (
        <div key={toothNumber} className="print-tooth-box">
          {toothNumber}
        </div>
      );
    }

    const statusColor = getToothStatusColor(diagnoses);
    const isMissing = diagnoses.some((d) =>
      d.toLowerCase().includes("falta")
    );

    return (
      <div
        key={toothNumber}
        className={`print-tooth-box tooth-${isMissing ? "missing" : statusColor}`}
      >
        {!isMissing && toothNumber}
      </div>
    );
  };

  return (
    <section className="print-section-professional">
      <div className="print-section-title-box">
        <div className="print-section-title">III. ODONTOGRAMA Y DIAGNÓSTICO</div>
      </div>

      {/* Permanent Teeth */}
      {(hasPermanent || !hasDeciduous) && (
        <div className="print-odontogram-container">
          <div className="print-odontogram-label">Dentición Permanente</div>

          {/* Upper */}
          <div className="print-odontogram-row">
            <span className="print-odontogram-position">Superior:</span>
            <div className="print-teeth-grid-professional">
              {permanentRanges.upper.map((tooth) =>
                renderTooth(tooth, permanent[tooth])
              )}
            </div>
          </div>

          {/* Lower */}
          <div className="print-odontogram-row">
            <span className="print-odontogram-position">Inferior:</span>
            <div className="print-teeth-grid-professional">
              {permanentRanges.lower.map((tooth) =>
                renderTooth(tooth, permanent[tooth])
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deciduous Teeth */}
      {hasDeciduous && (
        <div className="print-odontogram-container">
          <div className="print-odontogram-label">Dentición Decidua</div>

          {/* Upper */}
          <div className="print-odontogram-row">
            <span className="print-odontogram-position">Superior:</span>
            <div className="print-teeth-grid-professional print-teeth-grid-deciduous">
              {deciduousRanges.upper.map((tooth) =>
                renderTooth(tooth, deciduous[tooth])
              )}
            </div>
          </div>

          {/* Lower */}
          <div className="print-odontogram-row">
            <span className="print-odontogram-position">Inferior:</span>
            <div className="print-teeth-grid-professional print-teeth-grid-deciduous">
              {deciduousRanges.lower.map((tooth) =>
                renderTooth(tooth, deciduous[tooth])
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="print-odontogram-legend-professional">
        <span className="print-legend-title">Simbología:</span>
        <div className="print-legend-items">
          <span className="print-legend-item-pro">
            <span className="print-legend-box success"></span> Sano
          </span>
          <span className="print-legend-item-pro">
            <span className="print-legend-box warning"></span> Con tratamiento
          </span>
          <span className="print-legend-item-pro">
            <span className="print-legend-box danger"></span> Problema
          </span>
          <span className="print-legend-item-pro">
            <span className="print-legend-box neutral"></span> Ausente
          </span>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="print-diagnosis-professional">
        <div className="print-diagnosis-header">Diagnóstico Clínico:</div>

        <div className="print-diagnosis-content">
          {autoDiagnosis && (
            <div className="print-diagnosis-text">{autoDiagnosis}</div>
          )}

          {manualDiagnosis && (
            <div className="print-diagnosis-notes">
              <strong>Observaciones adicionales:</strong> {manualDiagnosis}
            </div>
          )}

          {!autoDiagnosis && !manualDiagnosis && (
            <div className="print-diagnosis-empty">Sin diagnóstico registrado en esta consulta.</div>
          )}
        </div>
      </div>
    </section>
  );
});
