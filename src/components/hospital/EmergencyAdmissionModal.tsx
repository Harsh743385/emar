'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import { X, UserPlus, AlertTriangle, ShieldAlert, CheckCircle, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient, Gender, Ward } from '@/lib/types';

interface EmergencyAdmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

export function EmergencyAdmissionModal({ open, onClose, onSuccess }: EmergencyAdmissionModalProps) {
  const { store, updateStore, selectPatient } = useEMR();

  const [triage, setTriage] = useState<'Red' | 'Yellow' | 'Green'>('Red');
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male' as Gender,
    bloodGroup: 'B+',
    contactNo: '',
    address: '',
    emergencyContact: '',
    emergencyContactName: '',
    allergies: 'NKDA (No Known Drug Allergies)',
    chiefComplaint: '',
    modeOfArrival: '108 Ambulance',
    doctorAssigned: 'Dr. Sagar Dhonde',
  });

  if (!open) return null;

  // Find suitable bed based on triage
  const beds = store.beds || [];
  const targetWard: Ward = triage === 'Red' ? 'ICU' : triage === 'Yellow' ? 'CCU' : 'Emergency';
  const availableBed = beds.find(b => b.ward === targetWard && b.status === 'Available')
    || beds.find(b => b.status === 'Available')
    || { bedNo: `${targetWard}-1`, ward: targetWard, id: 'FALLBACK' };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter patient name');
      return;
    }

    const patientId = generateId();
    const currentYear = new Date().getFullYear();
    const uhid = `NHC/${currentYear}-${(currentYear + 1).toString().slice(-2)}/${Math.floor(100 + Math.random() * 900)}`;
    const ipdNo = `IPD/${currentYear}-${(currentYear + 1).toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: Patient = {
      id: patientId,
      uhid,
      ipdNo,
      name: form.name.trim(),
      age: parseInt(form.age) || 45,
      gender: form.gender,
      ward: availableBed.ward as Ward,
      bed: availableBed.bedNo,
      department: availableBed.ward === 'ICU' ? 'Critical Care' : availableBed.ward === 'CCU' ? 'Cardiology' : 'Emergency Medicine',
      admissionDate: nowDateStr(),
      admissionTime: nowTimeStr(),
      consultantDoctor: form.doctorAssigned,
      diagnosis: form.chiefComplaint || 'Acute Respiratory Distress & Hemodynamic Instability',
      bloodGroup: form.bloodGroup,
      contactNo: form.contactNo || '9876500000',
      address: form.address || 'Ahmedabad, Gujarat',
      emergencyContact: form.emergencyContact || '9876500001',
      emergencyContactName: form.emergencyContactName || 'Family Member',
      status: 'Active',
    };

    updateStore(prev => {
      const updatedBeds = (prev.beds || []).map(b =>
        b.bedNo === availableBed.bedNo ? { ...b, status: 'Occupied' as const, patientId } : b
      );
      return {
        ...prev,
        patients: [newPatient, ...prev.patients],
        beds: updatedBeds,
      };
    });

    selectPatient(newPatient);
    onSuccess(newPatient);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-lg text-white">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Emergency Patient Admission & Bed Allocation</h3>
              <p className="text-xs text-slate-400">Rapid triage intake for acute ICU, CCU & Trauma patients</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Triage Level Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Clinical Triage Level (Determines Bed & Urgency)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => setTriage('Red')}
                className={cn(
                  'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center',
                  triage === 'Red'
                    ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                )}
              >
                <ShieldAlert size={20} className="text-red-600 mb-1" />
                <span className="font-bold text-sm">RED: CRITICAL</span>
                <span className="text-[11px] text-red-600 font-medium">Immediate ICU Bed</span>
              </div>

              <div
                onClick={() => setTriage('Yellow')}
                className={cn(
                  'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center',
                  triage === 'Yellow'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                )}
              >
                <AlertTriangle size={20} className="text-amber-500 mb-1" />
                <span className="font-bold text-sm">YELLOW: SERIOUS</span>
                <span className="text-[11px] text-amber-600 font-medium">Urgent CCU Bed</span>
              </div>

              <div
                onClick={() => setTriage('Green')}
                className={cn(
                  'p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center',
                  triage === 'Green'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                )}
              >
                <CheckCircle size={20} className="text-emerald-600 mb-1" />
                <span className="font-bold text-sm">GREEN: STABLE</span>
                <span className="text-[11px] text-emerald-600 font-medium">Emergency Observation</span>
              </div>
            </div>

            {/* Allocated Bed Preview */}
            <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <BedDouble size={14} className="text-teal-600" />
                Target Allocation:
              </span>
              <span className="font-bold text-slate-900">
                {availableBed.bedNo} ({availableBed.ward} Ward) — Available
              </span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Identification</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshchandra Trivedi"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 56"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Arrival Mode</label>
                <select
                  value={form.modeOfArrival}
                  onChange={e => setForm(f => ({ ...f, modeOfArrival: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="108 Ambulance">108 Ambulance</option>
                  <option value="Private Ambulance">Private Ambulance</option>
                  <option value="Walk-in Emergency">Walk-in</option>
                  <option value="Hospital Transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Consultant</label>
                <select
                  value={form.doctorAssigned}
                  onChange={e => setForm(f => ({ ...f, doctorAssigned: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Dr. Sagar Dhonde">Dr. Sagar Dhonde (ICU)</option>
                  <option value="Dr. Anand Bhanushali">Dr. Anand Bhanushali (CCU)</option>
                  <option value="Dr. Deepak Yadav">Dr. Deepak Yadav (ER)</option>
                  <option value="Dr. Manoj Chawla">Dr. Manoj Chawla (RMO)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Presentation */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Presentation</div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chief Complaint & Provisional Diagnosis *</label>
              <textarea
                rows={2}
                placeholder="e.g. Sudden severe retrosternal chest pain with diaphoresis, dyspnea, hypotension SBP 85 mmHg..."
                value={form.chiefComplaint}
                onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, NSAIDs, or NKDA"
                  value={form.allergies}
                  onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Primary Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 9823456789"
                  value={form.contactNo}
                  onChange={e => setForm(f => ({ ...f, contactNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Sunita Trivedi (Wife)"
                value={form.emergencyContactName}
                onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Number</label>
              <input
                type="text"
                placeholder="e.g. 9823456780"
                value={form.emergencyContact}
                onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
            >
              <UserPlus size={16} />
              <span>Admit & Open ICU Chart</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
