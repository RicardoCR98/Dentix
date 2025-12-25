// src/lib/pdf-generator.ts
// PDF generation utilities using html2pdf.js

import html2pdf from "html2pdf.js";
import type { Patient, Session } from "./types";
import { formatDate } from "./print-utils";

export interface PDFOptions {
  patient: Patient;
  session: Session;
  filename?: string;
}

/**
 * Generate and download PDF from print template
 * Uses html2pdf.js to convert the print-wrapper HTML to PDF
 */
export async function downloadPDF(options: PDFOptions): Promise<void> {
  const { patient, session, filename } = options;

  // Get the print wrapper element
  const element = document.querySelector(".print-wrapper");

  if (!element) {
    console.error("Print template not found");
    throw new Error("No se pudo encontrar la plantilla de impresión");
  }

  // Generate filename
  const defaultFilename = generateFilename(patient, session);
  const finalFilename = filename || defaultFilename;

  // Configure html2pdf options
  const opt = {
    margin: [15, 15, 12, 15], // top, right, bottom, left in mm
    filename: finalFilename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2, // Higher scale = better quality
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Make it visible temporarily for html2canvas
    clonedElement.style.display = "block";
    clonedElement.style.position = "absolute";
    clonedElement.style.left = "-9999px";
    clonedElement.style.top = "0";
    document.body.appendChild(clonedElement);

    // Generate PDF
    await html2pdf().set(opt).from(clonedElement).save();

    // Clean up
    document.body.removeChild(clonedElement);

    console.log("[PDF] Generated successfully:", finalFilename);
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error);
    throw new Error("Error al generar el PDF");
  }
}

/**
 * Generate PDF filename from patient and session data
 * Format: HistoriaClinica_{PatientName}_{Date}.pdf
 */
function generateFilename(patient: Patient, session: Session): string {
  // Clean patient name (remove special characters)
  const cleanName = patient.full_name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 30); // Limit length

  // Format date as YYYYMMDD
  const date = new Date(session.date);
  const dateStr = date
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "");

  return `HistoriaClinica_${cleanName}_${dateStr}.pdf`;
}

/**
 * Preview PDF in new tab (opens print dialog)
 * Alternative to downloading
 */
export async function previewPDF(): Promise<void> {
  window.print();
}
