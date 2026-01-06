// src/components/ConsentsList.tsx
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { FileText, Eye, Printer, Share2 } from "lucide-react";
import type { InformedConsent } from "../lib/types";
import { invoke } from "@tauri-apps/api/core";
import { Dialog } from "./ui/Dialog";
import { useToast } from "../hooks/useToast";

type ConsentsListProps = {
  patientId: number;
  refreshTrigger?: number; // Used to force refresh when a new consent is created
};

export function ConsentsList({ patientId, refreshTrigger }: ConsentsListProps) {
  const toast = useToast();
  const [consents, setConsents] = useState<InformedConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConsent, setSelectedConsent] =
    useState<InformedConsent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadConsents();
  }, [patientId, refreshTrigger]);

  const loadConsents = async () => {
    setLoading(true);
    try {
      const result = await invoke<InformedConsent[]>(
        "get_consents_by_patient",
        {
          patientId,
        },
      );
      setConsents(result);
    } catch (error) {
      console.error("Error loading consents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewConsent = (consent: InformedConsent) => {
    setSelectedConsent(consent);
    setPreviewOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const generateConsentHTML = (consent: InformedConsent) => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Consentimiento Informado - ${consent.consent_template}</title>
        <style>
          @page {
            margin: 2cm;
          }
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
            color: #1a1a1a;
          }
          .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .metadata-item {
            font-size: 14px;
          }
          .metadata-label {
            font-weight: bold;
            color: #555;
          }
          .content {
            white-space: pre-wrap;
            margin-bottom: 30px;
            text-align: justify;
            font-size: 14px;
          }
          .signatures {
            margin-top: 40px;
          }
          .signature-block {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .signature-image {
            border: 1px solid #ccc;
            padding: 10px;
            background: white;
            max-width: 400px;
          }
          .signature-image img {
            max-width: 100%;
            height: auto;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background: #fff9e6;
            border-left: 4px solid #ffc107;
          }
          .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${consent.consent_template}</h1>
        </div>

        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Paciente:</span> ${consent.signed_by}
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Fecha:</span> ${formatDate(consent.signed_at)}
          </div>
          ${
            consent.doctor_name
              ? `
            <div class="metadata-item">
              <span class="metadata-label">Doctor/a:</span> ${consent.doctor_name}
            </div>
          `
              : ""
          }
          ${
            consent.procedure_name
              ? `
            <div class="metadata-item">
              <span class="metadata-label">Procedimiento:</span> ${consent.procedure_name}
            </div>
          `
              : ""
          }
          ${
            consent.witness_name
              ? `
            <div class="metadata-item">
              <span class="metadata-label">Testigo:</span> ${consent.witness_name}
            </div>
          `
              : ""
          }
        </div>

        <div class="content">
${consent.consent_text}
        </div>

        <div class="signatures">
          <div class="signature-block">
            <div class="signature-title">Firma del Paciente:</div>
            <div class="signature-image">
              <img src="${consent.signature_data}" alt="Firma del paciente" />
            </div>
          </div>

          ${
            consent.witness_signature
              ? `
            <div class="signature-block">
              <div class="signature-title">Firma del Testigo:</div>
              <div class="signature-image">
                <img src="${consent.witness_signature}" alt="Firma del testigo" />
              </div>
            </div>
          `
              : ""
          }
        </div>

        ${
          consent.notes
            ? `
          <div class="notes">
            <div class="notes-title">Notas Adicionales:</div>
            <div>${consent.notes}</div>
          </div>
        `
            : ""
        }

        <div class="footer">
          Documento generado electrónicamente - ${formatDate(new Date().toISOString())}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintPDF = async () => {
    if (!selectedConsent) return;

    setGeneratingPDF(true);
    try {
      const htmlContent = generateConsentHTML(selectedConsent);
      const filename = `Consentimiento_${selectedConsent.signed_by.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

      const result = await invoke<{ file_path: string }>(
        "generate_pdf_with_dialog",
        {
          htmlContent,
          defaultFilename: filename,
        },
      );

      toast.success("PDF generado", `Archivo guardado en: ${result.file_path}`);
    } catch (error) {
      if (error === "User cancelled save dialog") {
        toast.warning("Cancelado", "Generación de PDF cancelada");
      } else {
        console.error("Error generating PDF:", error);
        toast.error("Error al generar PDF", String(error));
      }
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!selectedConsent) return;

    try {
      const message =
        `*CONSENTIMIENTO INFORMADO*\n\n` +
        `📋 Tipo: ${selectedConsent.consent_template}\n` +
        `👤 Paciente: ${selectedConsent.signed_by}\n` +
        `📅 Fecha: ${formatDate(selectedConsent.signed_at)}\n` +
        `${selectedConsent.doctor_name ? `👨‍⚕️ Doctor/a: ${selectedConsent.doctor_name}\n` : ""}` +
        `${selectedConsent.procedure_name ? `🔬 Procedimiento: ${selectedConsent.procedure_name}\n` : ""}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

      // Use Tauri opener plugin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTauri = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

      if (isTauri) {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        console.log("Opening WhatsApp URL:", whatsappUrl);
        await openUrl(whatsappUrl);
        console.log("WhatsApp URL opened successfully");
      } else {
        // Fallback for web development
        window.open(whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      toast.error("Error", "No se pudo abrir WhatsApp");
      // Fallback: try window.open if plugin fails
      window.open(`https://wa.me/?text=${encodeURIComponent("*CONSENTIMIENTO INFORMADO*")}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Cargando consentimientos...
      </div>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto mb-2 text-gray-400" size={48} />
        <p>No hay consentimientos informados registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {consents.map((consent) => (
          <div
            key={consent.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-900">
                    {consent.consent_template}
                  </h4>
                </div>

                {consent.procedure_name && (
                  <p className="text-sm text-gray-600 mb-1">
                    Procedimiento: {consent.procedure_name}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>Firmado por: {consent.signed_by}</span>
                  <span>Fecha: {formatDate(consent.signed_at)}</span>
                  {consent.doctor_name && (
                    <span>Dr/a: {consent.doctor_name}</span>
                  )}
                  {consent.witness_name && (
                    <span>Testigo: {consent.witness_name}</span>
                  )}
                </div>

                {consent.notes && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {consent.notes}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewConsent(consent)}
              >
                <Eye size={16} className="mr-1" />
                Ver
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={selectedConsent?.consent_template || "Consentimiento Informado"}
        description={`Firmado el ${selectedConsent ? formatDate(selectedConsent.signed_at) : ""}`}
        size="3xl"
      >
        {selectedConsent && (
          <div className="space-y-6">
            {/* Consent Text */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedConsent.consent_text}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Paciente:</span>{" "}
                {selectedConsent.signed_by}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Fecha:</span>{" "}
                {formatDate(selectedConsent.signed_at)}
              </div>
              {selectedConsent.doctor_name && (
                <div>
                  <span className="font-semibold text-gray-700">Doctor/a:</span>{" "}
                  {selectedConsent.doctor_name}
                </div>
              )}
              {selectedConsent.procedure_name && (
                <div>
                  <span className="font-semibold text-gray-700">
                    Procedimiento:
                  </span>{" "}
                  {selectedConsent.procedure_name}
                </div>
              )}
              {selectedConsent.witness_name && (
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">Testigo:</span>{" "}
                  {selectedConsent.witness_name}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Firma del Paciente
                </h4>
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <img
                    src={selectedConsent.signature_data}
                    alt="Firma del paciente"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>

              {selectedConsent.witness_signature && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Firma del Testigo
                  </h4>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <img
                      src={selectedConsent.witness_signature}
                      alt="Firma del testigo"
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedConsent.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Notas Adicionales
                </h4>
                <p className="text-gray-700 text-sm">{selectedConsent.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleShareWhatsApp}
                  disabled={generatingPDF}
                >
                  <Share2 size={16} className="mr-2" />
                  Compartir por WhatsApp
                </Button>
                <Button onClick={handlePrintPDF} disabled={generatingPDF}>
                  <Printer size={16} className="mr-2" />
                  {generatingPDF ? "Generando..." : "Imprimir PDF"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
