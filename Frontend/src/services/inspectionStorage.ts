import type { Inspection } from "../types/inspection";

const STORAGE_KEY = "nirikshak_inspections";

export function getInspections(): Inspection[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveInspection(
  inspection: Inspection
): Inspection[] {

  const existing = getInspections();

  // Add newest inspection at the beginning
  const updated = [
    inspection,
    ...existing
  ];

  // Keep ONLY the latest 10
  const latestTen = updated.slice(0, 10);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(latestTen)
  );

  return latestTen;
}

export function getInspectionById(
  id: string
): Inspection | undefined {

  const inspections = getInspections();

  return inspections.find(
    (inspection) => inspection.id === id
  );
}