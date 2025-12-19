import type { Patient, VisitWithProcedures } from "../lib/types";

type Props = {
  patient: Patient;
  sessions: VisitWithProcedures[];
  diagnosisText?: string;
  attachments?: { name: string }[];
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-ES") : "—";

const ageFromBirth = (d?: string) => {
  if (!d) return "—";
  const birth = new Date(d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? `${age} años` : "—";
};

export function PrintSnapshot({
  patient,
  sessions,
  diagnosisText,
  attachments = [],
}: Props) {
  const activeSessions = sessions.filter((s) => s.session);

  return (
    <div className="text-[13px] text-black">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-gray-600">Logo / Nombre de clínica</p>
          <h1 className="text-2xl font-bold">Registro clínico</h1>
          <p className="text-sm text-gray-700">
            Doctor y datos de clínica configurables (pendiente)
          </p>
        </div>
        <div className="text-right text-xs text-gray-600 leading-5">
          <div>Fecha de impresión: {formatDate(new Date().toISOString())}</div>
          <div>ID paciente: {patient.id ?? "—"}</div>
        </div>
      </div>

      {/* Patient card */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Datos del paciente</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Nombre completo</div>
            <div className="font-semibold text-sm">
              {patient.full_name || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Documento</div>
            <div className="text-sm">{patient.doc_id || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Teléfono</div>
            <div className="text-sm">{patient.phone || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Fecha de nacimiento</div>
            <div className="text-sm">
              {formatDate(patient.date_of_birth)} ({ageFromBirth(patient.date_of_birth)})
            </div>
          </div>
          {patient.allergy_detail && (
            <div className="col-span-2">
              <div className="text-xs text-red-600 font-semibold">Alergias</div>
              <div className="text-sm">{patient.allergy_detail}</div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis */}
      {diagnosisText && (
        <div className="border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Diagnóstico</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
            {diagnosisText}
          </p>
        </div>
      )}

      {/* Sessions */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Sesiones y procedimientos</h2>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-gray-600">Sin sesiones registradas.</p>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((s, idx) => {
              const procs = s.items.filter(
                (it) => (it.is_active ?? it.quantity > 0) && (it.quantity ?? 0) > 0,
              );
              return (
                <div
                  key={s.session.id ?? idx}
                  className="border border-gray-200 rounded-md p-3 break-inside-avoid"
                >
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <div>
                      Fecha: {formatDate(s.session.date)} ·{" "}
                      {s.session.reason_type || "Motivo no especificado"}
                    </div>
                    <div className="text-gray-600">
                      #{s.session.id ?? idx + 1}
                    </div>
                  </div>
                  {s.session.reason_detail && (
                    <div className="text-xs text-gray-700 mb-2">
                      {s.session.reason_detail}
                    </div>
                  )}
                  {procs.length > 0 ? (
                    <table className="w-full text-xs border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-2 border-b border-gray-200">
                            Procedimiento
                          </th>
                          <th className="text-center p-2 border-b border-gray-200 w-16">
                            Cant.
                          </th>
                          <th className="text-right p-2 border-b border-gray-200 w-24">
                            Unitario
                          </th>
                          <th className="text-right p-2 border-b border-gray-200 w-24">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {procs.map((p, i) => (
                          <tr key={p.id ?? i} className="border-b border-gray-100">
                            <td className="p-2">{p.name || "Procedimiento"}</td>
                            <td className="p-2 text-center">{p.quantity}</td>
                            <td className="p-2 text-right">${p.unit_price}</td>
                            <td className="p-2 text-right">${p.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-600">
                      Sin procedimientos activos en esta sesión.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Adjuntos</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            {attachments.map((a, i) => (
              <li key={`${a.name}-${i}`}>{a.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
