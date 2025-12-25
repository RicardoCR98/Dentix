// src/lib/pdf-generator-tauri.ts
// PDF generation using Tauri backend with headless Chrome

import { invoke } from "@tauri-apps/api/core";
import type { Patient, Session, SessionItem, DoctorProfile } from "./types";

export interface TauriPDFOptions {
  patient: Patient;
  session: Session;
  sessionItems: SessionItem[];
  doctorProfile: DoctorProfile;
}

/**
 * Generate PDF using Tauri backend with "Save As" dialog
 * Uses headless Chrome for high-quality PDF generation
 */
export async function generatePDFWithDialog(options: TauriPDFOptions): Promise<string> {
  const { patient, session } = options;

  // Get the print wrapper element
  const printWrapper = document.querySelector(".print-wrapper");
  if (!printWrapper) {
    throw new Error("No se pudo encontrar la plantilla de impresión");
  }

  // Clone the print wrapper to get its HTML
  const clonedWrapper = printWrapper.cloneNode(true) as HTMLElement;

  // Get all computed styles and inline CSS
  const styles = await getInlineStyles();

  // Generate complete HTML document
  const htmlContent = generateCompleteHTML(clonedWrapper.innerHTML, styles);

  // Generate filename
  const filename = generateFilename(patient, session);

  try {
    // Call Tauri backend command
    const result = await invoke<{ file_path: string }>("generate_pdf_with_dialog", {
      htmlContent,
      defaultFilename: filename,
    });

    return result.file_path;
  } catch (error) {
    if (error === "User cancelled save dialog") {
      throw new Error("Generación de PDF cancelada");
    }
    console.error("[PDF] Error generating PDF:", error);
    throw new Error("Error al generar el PDF");
  }
}

/**
 * Get all print styles inline for PDF generation
 * Extracts CSS from print.css and adapts it for direct rendering
 */
async function getInlineStyles(): Promise<string> {
  // Get all stylesheets
  const styleSheets = Array.from(document.styleSheets);

  let printStyles = "";

  for (const sheet of styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);

      for (const rule of rules) {
        const cssText = rule.cssText;

        // Extract print media styles and remove @media wrapper
        if (cssText.includes("@media print")) {
          // Extract content between @media print { ... }
          const match = cssText.match(/@media print\s*\{([\s\S]*)\}/);
          if (match) {
            printStyles += match[1] + "\n";
          }
        }

        // Also include styles from print.css that aren't in @media queries
        if (cssText.includes(".print-")) {
          // Skip @media screen rules
          if (!cssText.includes("@media screen")) {
            printStyles += cssText + "\n";
          }
        }
      }
    } catch (e) {
      // Skip stylesheets we can't access (CORS)
      continue;
    }
  }

  // Add base styles for PDF rendering
  const baseStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: white;
    }

    .print-wrapper {
      display: block !important;
      visibility: visible !important;
      position: relative !important;
      width: 100%;
    }

    .print-template {
      display: block !important;
    }
  `;

  return baseStyles + "\n" + printStyles;
}

/**
 * Generate complete HTML document for PDF generation
 */
function generateCompleteHTML(bodyContent: string, styles: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historia Clínica Odontológica</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <div class="print-wrapper">
    ${bodyContent}
  </div>
</body>
</html>`;
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
