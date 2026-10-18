'use client';

// ============================================================
// Digital Nursing Care EMR - Local Storage Store
// DEMO APPLICATION - Browser storage only. Not secure clinical storage.
// ============================================================

import type { EMRStore } from './types';
import { SEED_DATA } from './seedData';

const STORAGE_KEY = 'nursing_emr_demo_data';

export function getStore(): EMRStore {
  if (typeof window === 'undefined') return SEED_DATA;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    const parsed = JSON.parse(raw) as EMRStore;
    return {
      ...SEED_DATA,
      ...parsed,
      beds: (parsed.beds && parsed.beds.length > 0) ? parsed.beds : SEED_DATA.beds,
      ventilators: (parsed.ventilators && parsed.ventilators.length > 0) ? parsed.ventilators : SEED_DATA.ventilators,
      staff: (parsed.staff && parsed.staff.length > 0) ? parsed.staff : SEED_DATA.staff,
      alerts: (parsed.alerts && parsed.alerts.length > 0) ? parsed.alerts : SEED_DATA.alerts,
      labReports: (parsed.labReports && parsed.labReports.length > 0) ? parsed.labReports : SEED_DATA.labReports,
      infusions: (parsed.infusions && parsed.infusions.length > 0) ? parsed.infusions : SEED_DATA.infusions,
      procedures: (parsed.procedures && parsed.procedures.length > 0) ? parsed.procedures : SEED_DATA.procedures,
      clinicalScores: (parsed.clinicalScores && parsed.clinicalScores.length > 0) ? parsed.clinicalScores : SEED_DATA.clinicalScores,
      icuCharts: (parsed.icuCharts || []).filter(c => !c.id.startsWith('ICU-24H-')),
      patients: (parsed.patients && parsed.patients.length >= 8) ? parsed.patients : SEED_DATA.patients,
      patientCounsellingForms: (parsed.patientCounsellingForms && parsed.patientCounsellingForms.length > 0)
        ? parsed.patientCounsellingForms
        : SEED_DATA.patientCounsellingForms || [],
      familyEducationRecords: (parsed.familyEducationRecords && parsed.familyEducationRecords.length > 0)
        ? parsed.familyEducationRecords
        : SEED_DATA.familyEducationRecords || [],
    };
  } catch {
    return SEED_DATA;
  }
}

export function saveStore(store: EMRStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function nowDateStr(): string {
  const d = new Date();
  return d.toISOString().substring(0, 10);
}

export function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().substring(0, 5);
}
