// src/lib/print-utils.ts
// Utilities for print template formatting

import type { ToothDx } from "./types";

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date with time to DD/MM/YYYY HH:MM
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "$"): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Parse ToothDx JSON string safely
 */
export function parseToothDx(toothDxJson?: string): ToothDx {
  if (!toothDxJson) return {};
  try {
    return JSON.parse(toothDxJson) as ToothDx;
  } catch (error) {
    console.error("Error parsing tooth_dx_json:", error);
    return {};
  }
}

/**
 * Get tooth classification (permanent/deciduous)
 */
export function getToothClassification(toothNumber: string): "permanent" | "deciduous" | "unknown" {
  const num = parseInt(toothNumber, 10);
  if (isNaN(num)) return "unknown";

  // Permanent teeth: 11-48
  if ((num >= 11 && num <= 18) || (num >= 21 && num <= 28) ||
      (num >= 31 && num <= 38) || (num >= 41 && num <= 48)) {
    return "permanent";
  }

  // Deciduous teeth: 51-85
  if ((num >= 51 && num <= 55) || (num >= 61 && num <= 65) ||
      (num >= 71 && num <= 75) || (num >= 81 && num <= 85)) {
    return "deciduous";
  }

  return "unknown";
}

/**
 * Get tooth quadrant (1-4 for permanent, 5-8 for deciduous)
 */
export function getToothQuadrant(toothNumber: string): number {
  const num = parseInt(toothNumber, 10);
  if (isNaN(num)) return 0;
  return Math.floor(num / 10);
}

/**
 * Group teeth by classification
 */
export function groupTeethByType(toothDx: ToothDx): {
  permanent: Record<string, string[]>;
  deciduous: Record<string, string[]>;
} {
  const permanent: Record<string, string[]> = {};
  const deciduous: Record<string, string[]> = {};

  Object.entries(toothDx).forEach(([tooth, diagnoses]) => {
    const classification = getToothClassification(tooth);
    if (classification === "permanent") {
      permanent[tooth] = diagnoses;
    } else if (classification === "deciduous") {
      deciduous[tooth] = diagnoses;
    }
  });

  return { permanent, deciduous };
}

/**
 * Get tooth status color class for print
 */
export function getToothStatusColor(diagnoses: string[]): "success" | "warning" | "danger" | "neutral" {
  if (!diagnoses || diagnoses.length === 0) return "neutral";

  // Check for problematic diagnoses
  const problematicKeywords = ["caries", "fractura", "infección", "dolor"];
  const hasProblems = diagnoses.some(d =>
    problematicKeywords.some(keyword => d.toLowerCase().includes(keyword))
  );
  if (hasProblems) return "danger";

  // Check for treatments
  const treatmentKeywords = ["obturación", "corona", "puente", "endodoncia"];
  const hasTreatment = diagnoses.some(d =>
    treatmentKeywords.some(keyword => d.toLowerCase().includes(keyword))
  );
  if (hasTreatment) return "warning";

  // Check if healthy
  const healthyKeywords = ["sano", "saludable", "normal"];
  const isHealthy = diagnoses.some(d =>
    healthyKeywords.some(keyword => d.toLowerCase().includes(keyword))
  );
  if (isHealthy) return "success";

  return "neutral";
}

/**
 * Sort teeth numerically for display
 */
export function sortTeeth(teeth: string[]): string[] {
  return teeth.sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    return numA - numB;
  });
}

/**
 * Get permanent teeth ranges for display
 */
export function getPermanentTeethRanges(): { upper: string[]; lower: string[] } {
  const upper: string[] = [];
  const lower: string[] = [];

  // Upper: 18-11 (right to left), 21-28 (left to right)
  for (let i = 18; i >= 11; i--) upper.push(String(i));
  for (let i = 21; i <= 28; i++) upper.push(String(i));

  // Lower: 48-41 (right to left), 31-38 (left to right)
  for (let i = 48; i >= 41; i--) lower.push(String(i));
  for (let i = 31; i <= 38; i++) lower.push(String(i));

  return { upper, lower };
}

/**
 * Get deciduous teeth ranges for display
 */
export function getDeciduousTeethRanges(): { upper: string[]; lower: string[] } {
  const upper: string[] = [];
  const lower: string[] = [];

  // Upper: 55-51 (right to left), 61-65 (left to right)
  for (let i = 55; i >= 51; i--) upper.push(String(i));
  for (let i = 61; i <= 65; i++) upper.push(String(i));

  // Lower: 85-81 (right to left), 71-75 (left to right)
  for (let i = 85; i >= 81; i--) lower.push(String(i));
  for (let i = 71; i <= 75; i++) lower.push(String(i));

  return { upper, lower };
}

/**
 * Generate initials from clinic name
 */
export function getClinicInitials(clinicName: string): string {
  if (!clinicName) return "CD";
  const words = clinicName.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}
