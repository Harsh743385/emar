'use client';
import React from 'react';
import { useEMR } from '@/context/EMRContext';
import { formatDate } from '@/lib/utils';

// Demo MAR - Medication Administration Record
const MAR_DEMO = [
  {
    medicine: 'Metformin 500mg', route: 'Oral', frequency: 'BD', prescribedBy: 'Dr. Anand Bhanushali',
    records: [
      { date: '2026-10-08', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-09', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-10', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-11', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-12', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-13', '08:00': 'given', '20:00': '' },
    ],
  },
  {
    medicine: 'Amlodipine 5mg', route: 'Oral', frequency: 'OD', prescribedBy: 'Dr. Anand Bhanushali',
    records: [
      { date: '2026-10-08', '08:00': 'given', '20:00': '' },
      { date: '2026-10-09', '08:00': 'given', '20:00': '' },
      { date: '2026-10-10', '08:00': 'given', '20:00': '' },
      { date: '2026-10-11', '08:00': 'given', '20:00': '' },
      { date: '2026-10-12', '08:00': 'given', '20:00': '' },
      { date: '2026-10-13', '08:00': 'given', '20:00': '' },
    ],
  },
  {
    medicine: 'Regular Insulin (sliding scale)', route: 'SC', frequency: 'QID (AC & HS)', prescribedBy: 'Dr. Anand Bhanushali',
    records: [
      { date: '2026-10-08', '08:00': 'held', '20:00': 'given' },
      { date: '2026-10-09', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-10', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-11', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-12', '08:00': 'given', '20:00': 'given' },
      { date: '2026-10-13', '08:00': 'given', '20:00': '' },
    ],
  },
  {
    medicine: 'Rosuvastatin 10mg', route: 'Oral', frequency: 'OD at Night', prescribedBy: 'Dr. Anand Bhanushali',
    records: [
      { date: '2026-10-08', '08:00': '', '20:00': 'given' },
      { date: '2026-10-09', '08:00': '', '20:00': 'given' },
      { date: '2026-10-10', '08:00': '', '20:00': 'given' },
      { date: '2026-10-11', '08:00': '', '20:00': 'given' },
      { date: '2026-10-12', '08:00': '', '20:00': 'given' },
      { date: '2026-10-13', '08:00': '', '20:00': '' },
    ],
  },
];

const dates = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];

export function MARTab() {
  const { selectedPatient } = useEMR();

  function statusCell(val: string) {
    if (val === 'given') return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">✓</span>;
    if (val === 'held') return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">H</span>;
    if (val === 'refused') return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">R</span>;
    return <span className="text-slate-300 text-xs">—</span>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700">
        ℹ Demo MAR for <b>{selectedPatient?.name}</b>. In a full implementation, this would be linked to the pharmacy module and updated in real-time.
      </div>

      <div className="ncard">
        <div className="ncard-head">
          <h4 className="text-sm font-bold text-slate-800">Medication Administration Record (MAR)</h4>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">✓ Given</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">H Held</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">R Refused</span>
            <span className="text-slate-400">— Not due</span>
          </div>
        </div>
        <div className="ncard-body overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-3 py-2 border border-slate-200 text-xs font-bold text-slate-600 min-w-48">Medicine / Route / Frequency</th>
                {dates.map(d => (
                  <th key={d} colSpan={2} className="px-2 py-2 border border-slate-200 text-xs font-bold text-slate-600 text-center min-w-24">{formatDate(d)}</th>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <th className="border border-slate-200" />
                {dates.map(d => (
                  <React.Fragment key={d}>
                    <th className="px-2 py-1 border border-slate-200 text-xs text-slate-500 font-medium text-center">08:00</th>
                    <th className="px-2 py-1 border border-slate-200 text-xs text-slate-500 font-medium text-center">20:00</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {MAR_DEMO.map((med, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 border border-slate-200">
                    <div className="font-semibold text-slate-800">{med.medicine}</div>
                    <div className="text-xs text-slate-500">{med.route} · {med.frequency}</div>
                    <div className="text-xs text-slate-400">{med.prescribedBy}</div>
                  </td>
                  {med.records.map(r => (
                    <React.Fragment key={r.date}>
                      <td className="px-2 py-2 border border-slate-100 text-center">{statusCell(r['08:00'])}</td>
                      <td className="px-2 py-2 border border-slate-100 text-center">{statusCell(r['20:00'])}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
