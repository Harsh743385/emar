'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
  FormDrawer, FormGroup, FormInput, FormSelect, FormTextarea,
  SectionTitle, StatusBadge, EmptyState, CardHeader, TealButton, SoftButton, YesNoToggle
} from '@/components/FormDrawer';
import { Plus, Edit2, RefreshCw, Trash2, ArrowLeftRight, FileCheck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MedicationReconciliation, MedicationReconciliationEntry } from '@/lib/types';

type RecType = 'Transfer' | 'Discharge' | 'Shift Count';

export function MedReconciliationTab() {
  const { store, selectedPatient, updateStore } = useEMR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | RecType>('All');
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [recType, setRecType] = useState<RecType>('Transfer');
  const [meta, setMeta] = useState({
    date: nowDateStr(),
    time: nowTimeStr(),
    outgoingNurse: '',
    incomingNurse: '',
    transferFrom: 'ICU',
    transferTo: 'General Ward (Male)',
    doctorOrderVerified: true,
    transferRecalculatedBy: '',
    dischargeSummaryVerified: true,
    counseledToPatient: true,
    consultantName: selectedPatient?.consultantDoctor || '',
  });

  const [meds, setMeds] = useState<MedicationReconciliationEntry[]>([
    {
      id: generateId(),
      medicineName: 'Tab. Paracetamol',
      dosage: '500mg',
      frequency: 'TDS (Thrice daily)',
      route: 'Oral',
      previousBalance: 10,
      quantityReceived: 0,
      quantityAdministered: 0,
      remainingQuantity: 10,
      actionDecision: 'Continue',
      source: 'Inpatient Medication',
      daysPrescribed: '3 days',
      dischargeInstructions: 'Take after meals for pain/fever',
      discrepancyRemarks: '',
    }
  ]);

  const patientId = selectedPatient!.id;
  const records = store.medicationReconciliations.filter(r => r.patientId === patientId);

  const filteredRecords = activeFilter === 'All'
    ? records
    : records.filter(r => (r.reconciliationType || 'Shift Count') === activeFilter);

  function addMed() {
    setMeds(prev => [
      ...prev,
      {
        id: generateId(),
        medicineName: '',
        dosage: '',
        frequency: 'OD',
        route: 'Oral',
        previousBalance: 0,
        quantityReceived: 0,
        quantityAdministered: 0,
        remainingQuantity: 0,
        actionDecision: recType === 'Discharge' ? 'Continue at Home' : 'Continue',
        source: 'Inpatient Medication',
        daysPrescribed: '5 days',
        dischargeInstructions: '',
        discrepancyRemarks: '',
      }
    ]);
  }

  function removeMed(id: string) {
    setMeds(prev => prev.filter(m => m.id !== id));
  }

  function updateMed(id: string, k: keyof MedicationReconciliationEntry, v: unknown) {
    setMeds(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [k]: v };
      // Auto-recalculate remaining balance for shift count & transfer
      if (k === 'previousBalance' || k === 'quantityReceived' || k === 'quantityAdministered') {
        const prevBal = typeof updated.previousBalance === 'number' ? updated.previousBalance : parseInt(String(updated.previousBalance)) || 0;
        const recvd = typeof updated.quantityReceived === 'number' ? updated.quantityReceived : parseInt(String(updated.quantityReceived)) || 0;
        const admin = typeof updated.quantityAdministered === 'number' ? updated.quantityAdministered : parseInt(String(updated.quantityAdministered)) || 0;
        updated.remainingQuantity = (prevBal + recvd) - admin;
      }
      return updated;
    }));
  }

  function openNew(type: RecType = 'Transfer') {
    setRecType(type);
    setMeta({
      date: nowDateStr(),
      time: nowTimeStr(),
      outgoingNurse: '',
      incomingNurse: '',
      transferFrom: selectedPatient?.ward || 'ICU',
      transferTo: 'General Ward',
      doctorOrderVerified: true,
      transferRecalculatedBy: '',
      dischargeSummaryVerified: true,
      counseledToPatient: true,
      consultantName: selectedPatient?.consultantDoctor || '',
    });

    if (type === 'Transfer') {
      setMeds([
        {
          id: generateId(),
          medicineName: 'Inj. Ceftriaxone',
          dosage: '1g',
          frequency: 'BD',
          route: 'IV',
          previousBalance: 6,
          quantityReceived: 0,
          quantityAdministered: 2,
          remainingQuantity: 4,
          actionDecision: 'Continue',
          discrepancyRemarks: '4 vials transferred with patient',
        },
        {
          id: generateId(),
          medicineName: 'Tab. Pantoprazole',
          dosage: '40mg',
          frequency: 'OD',
          route: 'Oral',
          previousBalance: 5,
          quantityReceived: 0,
          quantityAdministered: 1,
          remainingQuantity: 4,
          actionDecision: 'Continue',
          discrepancyRemarks: 'Transferred',
        }
      ]);
    } else if (type === 'Discharge') {
      setMeds([
        {
          id: generateId(),
          medicineName: 'Tab. Pantoprazole',
          dosage: '40mg',
          frequency: 'OD (Once daily before breakfast)',
          route: 'Oral',
          previousBalance: 0,
          quantityReceived: 0,
          quantityAdministered: 0,
          remainingQuantity: 10,
          actionDecision: 'Continue at Home',
          source: 'Inpatient Medication',
          daysPrescribed: '10 days',
          dischargeInstructions: 'Take empty stomach 30 mins before breakfast',
          discrepancyRemarks: '',
        },
        {
          id: generateId(),
          medicineName: 'Tab. Paracetamol',
          dosage: '650mg',
          frequency: 'SOS / as needed for pain',
          route: 'Oral',
          previousBalance: 0,
          quantityReceived: 0,
          quantityAdministered: 0,
          remainingQuantity: 10,
          actionDecision: 'New Order Added',
          source: 'Discharge Rx',
          daysPrescribed: '5 days',
          dischargeInstructions: 'Take after food if fever or pain occurs',
          discrepancyRemarks: '',
        }
      ]);
    } else {
      setMeds([
        {
          id: generateId(),
          medicineName: 'Tab. Paracetamol 500mg',
          previousBalance: 20,
          quantityReceived: 10,
          quantityAdministered: 6,
          remainingQuantity: 24,
        }
      ]);
    }

    setEditId(null);
    setDrawerOpen(true);
  }

  function save(status: 'Completed' | 'Draft') {
    updateStore(prev => {
      const rec: MedicationReconciliation = {
        id: editId || generateId(),
        patientId,
        date: meta.date,
        time: meta.time,
        outgoingNurse: meta.outgoingNurse,
        incomingNurse: meta.incomingNurse,
        medications: meds,
        reconciliationType: recType,
        transferFrom: meta.transferFrom,
        transferTo: meta.transferTo,
        doctorOrderVerified: meta.doctorOrderVerified,
        transferRecalculatedBy: meta.transferRecalculatedBy,
        dischargeSummaryVerified: meta.dischargeSummaryVerified,
        counseledToPatient: meta.counseledToPatient,
        consultantName: meta.consultantName,
        status,
        createdAt: new Date().toISOString(),
      };

      if (editId) {
        return {
          ...prev,
          medicationReconciliations: prev.medicationReconciliations.map(r => r.id === editId ? rec : r),
        };
      }
      return {
        ...prev,
        medicationReconciliations: [...prev.medicationReconciliations, rec],
      };
    });
    setDrawerOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Overview Card */}
      <div className="ncard">
        <CardHeader
          title="Medication Reconciliation & Recalculation"
          actions={
            <div className="flex gap-2 flex-wrap">
              <TealButton onClick={() => openNew('Transfer')} size="sm">
                <ArrowLeftRight size={13} /> Transfer Recalculation
              </TealButton>
              <button
                onClick={() => openNew('Discharge')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <FileCheck size={13} /> Discharge Reconciliation
              </button>
              <SoftButton onClick={() => openNew('Shift Count')} size="sm">
                <RefreshCw size={13} /> Shift Count
              </SoftButton>
            </div>
          }
        />
        <div className="ncard-body">
          {/* Filter Pills */}
          <div className="flex gap-2 mb-4 border-b border-slate-200 pb-3 flex-wrap">
            {(['All', 'Transfer', 'Discharge', 'Shift Count'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeFilter === tab
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab === 'All' ? 'All Reconciliation Records' :
                 tab === 'Transfer' ? '🔄 Transfer Recalculations' :
                 tab === 'Discharge' ? '📋 Discharge Reconciliations' : '📦 Shift Counts'}
                <span className="ml-1.5 text-xs opacity-80">
                  ({tab === 'All' ? records.length : records.filter(r => (r.reconciliationType || 'Shift Count') === tab).length})
                </span>
              </button>
            ))}
          </div>

          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={<RefreshCw />}
              title={`No ${activeFilter === 'All' ? 'medication reconciliation' : activeFilter} records found`}
              description="Click above to add Transfer Recalculation or Discharge Reconciliation"
              action={
                <div className="flex gap-2">
                  <TealButton onClick={() => openNew('Transfer')} size="sm"><ArrowLeftRight size={14} /> Transfer Recalculation</TealButton>
                  <SoftButton onClick={() => openNew('Discharge')} size="sm"><FileCheck size={14} /> Discharge Reconciliation</SoftButton>
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredRecords.map(r => {
                const type = (r.reconciliationType || 'Shift Count') as RecType;
                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-slate-800">{formatDate(r.date)} {r.time}</span>
                          <StatusBadge status={r.status} />
                          <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold border",
                            type === 'Transfer' ? "bg-amber-50 text-amber-800 border-amber-200" :
                            type === 'Discharge' ? "bg-blue-50 text-blue-800 border-blue-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {type === 'Transfer' ? '🔄 Transfer Recalculation' :
                             type === 'Discharge' ? '📋 Discharge Reconciliation' : '📦 Shift Count'}
                          </span>
                        </div>
                        {type === 'Transfer' && (
                          <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                            <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{r.transferFrom || 'Origin'}</span>
                            <ArrowLeftRight size={12} className="text-slate-400" />
                            <span className="font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">{r.transferTo || 'Destination'}</span>
                            {r.doctorOrderVerified && <span className="text-green-700 font-medium">✓ Doctor Order Verified</span>}
                          </div>
                        )}
                        {type === 'Discharge' && (
                          <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                            <span><b>Consultant:</b> {r.consultantName || 'Attending Doctor'}</span>
                            {r.dischargeSummaryVerified && <span className="text-green-700 font-medium">✓ Discharge Summary Verified</span>}
                            {r.counseledToPatient && <span className="text-teal-700 font-medium">✓ Patient Counseled</span>}
                          </div>
                        )}
                        {type === 'Shift Count' && (
                          <div className="text-xs text-slate-500 mt-1">
                            Outgoing: <b>{r.outgoingNurse || 'Nurse A'}</b> → Incoming: <b>{r.incomingNurse || 'Nurse B'}</b>
                          </div>
                        )}
                      </div>

                      <SoftButton onClick={() => {
                        setRecType(type);
                        setMeta({
                          date: r.date,
                          time: r.time,
                          outgoingNurse: r.outgoingNurse,
                          incomingNurse: r.incomingNurse,
                          transferFrom: r.transferFrom || 'ICU',
                          transferTo: r.transferTo || 'General Ward',
                          doctorOrderVerified: r.doctorOrderVerified ?? true,
                          transferRecalculatedBy: r.transferRecalculatedBy || '',
                          dischargeSummaryVerified: r.dischargeSummaryVerified ?? true,
                          counseledToPatient: r.counseledToPatient ?? true,
                          consultantName: r.consultantName || '',
                        });
                        setMeds(r.medications.map(m => ({ ...m })));
                        setEditId(r.id);
                        setDrawerOpen(true);
                      }} size="sm">
                        <Edit2 size={12} /> Edit
                      </SoftButton>
                    </div>

                    {/* Table View per Type */}
                    <div className="overflow-x-auto">
                      {type === 'Transfer' ? (
                        <table className="icu-table text-xs">
                          <thead>
                            <tr>
                              <th className="text-left">Medicine Name</th>
                              <th>Dose & Route</th>
                              <th>Pre-Transfer Balance</th>
                              <th>Transfer Qty Sent</th>
                              <th>Action / Decision</th>
                              <th>Recalculated Remaining</th>
                              <th className="text-left">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.medications.map(m => (
                              <tr key={m.id}>
                                <td className="text-left font-bold text-slate-800">{m.medicineName}</td>
                                <td>{m.dosage} {m.route}</td>
                                <td>{m.previousBalance}</td>
                                <td className="text-amber-700 font-bold">{m.quantityAdministered || m.quantityReceived || m.remainingQuantity}</td>
                                <td>
                                  <span className={cn("px-2 py-0.5 rounded font-bold text-xs",
                                    m.actionDecision === 'Continue' ? "bg-green-100 text-green-700" :
                                    m.actionDecision === 'Stop / Discontinue' ? "bg-red-100 text-red-700" :
                                    "bg-blue-100 text-blue-700"
                                  )}>
                                    {m.actionDecision || 'Continue'}
                                  </span>
                                </td>
                                <td className="font-bold text-teal-700">{m.remainingQuantity}</td>
                                <td className="text-left text-slate-500">{m.discrepancyRemarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : type === 'Discharge' ? (
                        <table className="icu-table text-xs">
                          <thead>
                            <tr>
                              <th className="text-left">Medicine & Strength</th>
                              <th>Frequency & Timing</th>
                              <th>Source</th>
                              <th>Status</th>
                              <th>Days</th>
                              <th className="text-left">Discharge Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.medications.map(m => (
                              <tr key={m.id}>
                                <td className="text-left font-bold text-slate-800">{m.medicineName} {m.dosage}</td>
                                <td>{m.frequency}</td>
                                <td className="text-slate-500">{m.source || 'Inpatient Rx'}</td>
                                <td>
                                  <span className={cn("px-2 py-0.5 rounded font-bold text-xs",
                                    m.actionDecision === 'Continue at Home' || m.actionDecision === 'Continue' ? "bg-green-100 text-green-700" :
                                    m.actionDecision === 'Discontinued / Stopped' ? "bg-red-100 text-red-700" :
                                    "bg-blue-100 text-blue-700"
                                  )}>
                                    {m.actionDecision || 'Continue at Home'}
                                  </span>
                                </td>
                                <td>{m.daysPrescribed || '—'}</td>
                                <td className="text-left text-slate-600 font-medium">{m.dischargeInstructions || 'Take as instructed'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="icu-table text-xs">
                          <thead>
                            <tr>
                              <th className="text-left">Medicine</th>
                              <th>Previous Balance</th>
                              <th>Qty Received</th>
                              <th>Qty Administered</th>
                              <th>Remaining Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.medications.map(m => (
                              <tr key={m.id}>
                                <td className="text-left font-medium">{m.medicineName}</td>
                                <td>{m.previousBalance}</td>
                                <td className="text-green-700">{m.quantityReceived}</td>
                                <td className="text-red-700">{m.quantityAdministered}</td>
                                <td className="font-bold text-teal-700">{m.remainingQuantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={
          editId ? `Edit ${recType} Reconciliation` :
          recType === 'Transfer' ? 'Transfer Medication Reconciliation & Recalculation' :
          recType === 'Discharge' ? 'Discharge Medication Reconciliation' :
          'Shift Medication Count & Reconciliation'
        }
        subtitle={`Patient: ${selectedPatient!.name}`}
        onClose={() => setDrawerOpen(false)}
        onSave={() => save('Completed')}
        onSaveDraft={() => save('Draft')}
      >
        {/* Reconciliation Mode Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reconciliation Workflow</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Transfer', 'Discharge', 'Shift Count'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setRecType(t)}
                className={cn(
                  "py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                  recType === t
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                )}
              >
                {t === 'Transfer' ? '🔄 Transfer' : t === 'Discharge' ? '📋 Discharge' : '📦 Shift Count'}
              </button>
            ))}
          </div>
        </div>

        {/* Date / Time */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <FormGroup label="Date"><FormInput type="date" value={meta.date} onChange={v => setMeta(p => ({ ...p, date: v }))} /></FormGroup>
          <FormGroup label="Time"><FormInput type="time" value={meta.time} onChange={v => setMeta(p => ({ ...p, time: v }))} /></FormGroup>
          {recType === 'Transfer' ? (
            <>
              <FormGroup label="Transfer From">
                <FormInput value={meta.transferFrom} onChange={v => setMeta(p => ({ ...p, transferFrom: v }))} placeholder="e.g. ICU" />
              </FormGroup>
              <FormGroup label="Transfer To">
                <FormInput value={meta.transferTo} onChange={v => setMeta(p => ({ ...p, transferTo: v }))} placeholder="e.g. General Ward" />
              </FormGroup>
            </>
          ) : recType === 'Discharge' ? (
            <>
              <FormGroup label="Consultant / Doctor">
                <FormInput value={meta.consultantName} onChange={v => setMeta(p => ({ ...p, consultantName: v }))} placeholder="Dr. Name" />
              </FormGroup>
              <FormGroup label="Discharge Nurse">
                <FormInput value={meta.outgoingNurse} onChange={v => setMeta(p => ({ ...p, outgoingNurse: v }))} placeholder="Nurse Name" />
              </FormGroup>
            </>
          ) : (
            <>
              <FormGroup label="Outgoing Nurse"><FormInput value={meta.outgoingNurse} onChange={v => setMeta(p => ({ ...p, outgoingNurse: v }))} /></FormGroup>
              <FormGroup label="Incoming Nurse"><FormInput value={meta.incomingNurse} onChange={v => setMeta(p => ({ ...p, incomingNurse: v }))} /></FormGroup>
            </>
          )}
        </div>

        {/* Verifications & Checklists */}
        {recType === 'Transfer' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-amber-900">Physician Transfer Medication Orders Verified:</span>
            <div className="flex items-center gap-2">
              <YesNoToggle value={meta.doctorOrderVerified} onChange={v => setMeta(p => ({ ...p, doctorOrderVerified: v }))} />
              <span className="text-xs text-amber-800">{meta.doctorOrderVerified ? 'Verified & Order Matched' : 'Pending Verification'}</span>
            </div>
          </div>
        )}

        {recType === 'Discharge' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">Discharge Summary Verified:</span>
              <YesNoToggle value={meta.dischargeSummaryVerified} onChange={v => setMeta(p => ({ ...p, dischargeSummaryVerified: v }))} />
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-900">Patient / Family Counseled:</span>
              <YesNoToggle value={meta.counseledToPatient} onChange={v => setMeta(p => ({ ...p, counseledToPatient: v }))} />
            </div>
          </div>
        )}

        {/* Dynamic Medications Table per Workflow */}
        <SectionTitle>
          {recType === 'Transfer' ? 'Medications & Recalculation Table' :
           recType === 'Discharge' ? 'Discharge Prescription & Home Medication Plan' :
           'Shift Count Medications'}
        </SectionTitle>

        <div className="space-y-3">
          {meds.map((m, idx) => (
            <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">#{idx + 1} Medication Entry</span>
                <button
                  type="button"
                  onClick={() => removeMed(m.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Medicine Name</label>
                  <input
                    type="text"
                    value={m.medicineName}
                    onChange={e => updateMed(m.id, 'medicineName', e.target.value)}
                    placeholder="e.g. Tab. Paracetamol"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Dose & Route</label>
                  <input
                    type="text"
                    value={m.dosage || ''}
                    onChange={e => updateMed(m.id, 'dosage', e.target.value)}
                    placeholder="500mg Oral"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Frequency</label>
                  <input
                    type="text"
                    value={m.frequency || ''}
                    onChange={e => updateMed(m.id, 'frequency', e.target.value)}
                    placeholder="TDS / BD"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {recType === 'Transfer' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Pre-Transfer Bal</label>
                    <input
                      type="number"
                      value={m.previousBalance}
                      onChange={e => updateMed(m.id, 'previousBalance', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Transfer Qty Sent</label>
                    <input
                      type="number"
                      value={m.quantityAdministered}
                      onChange={e => updateMed(m.id, 'quantityAdministered', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Action / Decision</label>
                    <select
                      value={m.actionDecision || 'Continue'}
                      onChange={e => updateMed(m.id, 'actionDecision', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="Continue">Continue</option>
                      <option value="Stop / Discontinue">Stop / Discontinue</option>
                      <option value="Dose Changed">Dose Changed</option>
                      <option value="New Order Added">New Order Added</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Recalculated Bal</label>
                    <div className="w-full px-2 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-center font-bold text-teal-700">
                      {m.remainingQuantity}
                    </div>
                  </div>
                </div>
              )}

              {recType === 'Discharge' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Status</label>
                    <select
                      value={m.actionDecision || 'Continue at Home'}
                      onChange={e => updateMed(m.id, 'actionDecision', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="Continue at Home">Continue at Home</option>
                      <option value="Discontinued / Stopped">Discontinued / Stopped</option>
                      <option value="Dose Modified">Dose Modified</option>
                      <option value="New Order Added">New Discharge Medicine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Duration</label>
                    <input
                      type="text"
                      value={m.daysPrescribed || ''}
                      onChange={e => updateMed(m.id, 'daysPrescribed', e.target.value)}
                      placeholder="e.g. 5 days, Ongoing"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Discharge Instructions</label>
                    <input
                      type="text"
                      value={m.dischargeInstructions || ''}
                      onChange={e => updateMed(m.id, 'dischargeInstructions', e.target.value)}
                      placeholder="e.g. Take after food with warm water"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}

              {recType === 'Shift Count' && (
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Prev Balance</label>
                    <input
                      type="number"
                      value={m.previousBalance}
                      onChange={e => updateMed(m.id, 'previousBalance', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Received</label>
                    <input
                      type="number"
                      value={m.quantityReceived}
                      onChange={e => updateMed(m.id, 'quantityReceived', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Administered</label>
                    <input
                      type="number"
                      value={m.quantityAdministered}
                      onChange={e => updateMed(m.id, 'quantityAdministered', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-500 font-semibold mb-0.5">Remaining Bal</label>
                    <div className="w-full px-2 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-center font-bold text-teal-700">
                      {m.remainingQuantity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addMed}
            className="w-full py-2 border border-dashed border-teal-300 text-teal-700 text-xs rounded-xl hover:bg-teal-50 transition-colors font-bold"
          >
            + Add Another Medicine to Reconciliation
          </button>
        </div>
      </FormDrawer>
    </div>
  );
}
