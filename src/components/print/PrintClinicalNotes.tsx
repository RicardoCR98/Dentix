// src/components/print/PrintClinicalNotes.tsx
import { memo } from "react";

interface PrintClinicalNotesProps {
  notes: string;
}

export const PrintClinicalNotes = memo(function PrintClinicalNotes({
  notes,
}: PrintClinicalNotesProps) {
  return (
    <section className="print-section-professional">
      <div className="print-section-title-box">
        <div className="print-section-title">V. NOTAS CLÍNICAS Y OBSERVACIONES</div>
      </div>

      <div className="print-clinical-notes-box">
        {notes && notes.trim() !== "" ? (
          <div className="print-clinical-notes-text">{notes}</div>
        ) : (
          <div className="print-empty-message">
            No se registraron notas clínicas adicionales en esta consulta.
          </div>
        )}
      </div>
    </section>
  );
});
