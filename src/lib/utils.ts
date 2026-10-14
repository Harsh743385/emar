import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d}-${months[parseInt(m) - 1]}-${y}`;
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  return `${formatDate(dateStr)} ${timeStr || ''}`.trim();
}

export function getShiftFromTime(time: string): 'Morning' | 'Afternoon' | 'Night' {
  if (!time) return 'Morning';
  const h = parseInt(time.substring(0, 2));
  if (h >= 6 && h < 14) return 'Morning';
  if (h >= 14 && h < 22) return 'Afternoon';
  return 'Night';
}

export function getGlucoseStatus(glucose: number): { label: string; color: string } {
  // Thresholds below are demo placeholders only.
  // Hospital-approved values must be configured before clinical use.
  if (glucose < 70) return { label: 'Low ⚠', color: 'text-blue-700' };
  if (glucose <= 140) return { label: 'Normal', color: 'text-green-700' };
  if (glucose <= 200) return { label: 'Elevated', color: 'text-amber-700' };
  return { label: 'High ⚠', color: 'text-red-700' };
}

export function calcMNAResult(score: number): string {
  if (score >= 12) return 'Normal Nutritional Status';
  if (score >= 8) return 'At Risk of Malnutrition';
  return 'Malnourished';
}

export function getPhlebitisGrade(grade: number): { label: string; color: string } {
  const grades: Record<number, { label: string; color: string }> = {
    0: { label: 'Grade 0 - No symptoms', color: 'text-green-700' },
    1: { label: 'Grade 1 - Erythema at site', color: 'text-yellow-700' },
    2: { label: 'Grade 2 - Pain, erythema, swelling', color: 'text-amber-700' },
    3: { label: 'Grade 3 - Hardness, thrombophlebitis', color: 'text-orange-700' },
    4: { label: 'Grade 4 - Purulent thrombophlebitis', color: 'text-red-700' },
    5: { label: 'Grade 5 - Severe thrombophlebitis with systemic symptoms', color: 'text-rose-700' },
  };
  return grades[grade] || { label: 'Unknown', color: 'text-gray-700' };
}
