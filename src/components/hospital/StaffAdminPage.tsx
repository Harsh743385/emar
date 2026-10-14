'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import {
  Users, Stethoscope, BedDouble, Wind, ShieldCheck,
  CheckCircle2, Plus, Edit2, Clock, Phone, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HospitalStaff, HospitalBed, VentilatorDevice } from '@/lib/types';

export function StaffAdminPage() {
  const { store, updateStore } = useEMR();
  const [activeTab, setActiveTab] = useState<'staff' | 'beds' | 'ventilators' | 'roles'>('beds');
  const [currentRole, setCurrentRole] = useState<'Admin' | 'Doctor' | 'Nurse' | 'Reception'>('Doctor');

  const beds = store.beds || [];
  const ventilators = store.ventilators || [];
  const staff = store.staff || [];

  const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = beds.filter(b => b.status === 'Available').length;
  const cleaningBeds = beds.filter(b => b.status === 'Cleaning' || b.status === 'Maintenance').length;

  function toggleBedStatus(bedId: string) {
    updateStore(prev => {
      const updated = (prev.beds || []).map(b => {
        if (b.id === bedId) {
          const nextStatus = b.status === 'Available' ? 'Occupied' : b.status === 'Occupied' ? 'Cleaning' : 'Available';
          return { ...b, status: nextStatus as HospitalBed['status'] };
        }
        return b;
      });
      return { ...prev, beds: updated };
    });
  }

  function toggleStaffDuty(staffId: string) {
    updateStore(prev => {
      const updated = (prev.staff || []).map(s => {
        if (s.id === staffId) return { ...s, onDuty: !s.onDuty };
        return s;
      });
      return { ...prev, staff: updated };
    });
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header & Role Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-teal-600" />
            <span>Hospital Administration & Resource Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bed occupancy, ventilator allocation, staff shift assignments, and role permissions
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <span className="text-slate-400 text-[10px] uppercase font-bold px-2">Role:</span>
          {(['Admin', 'Doctor', 'Nurse', 'Reception'] as const).map(r => (
            <button
              key={r}
              onClick={() => setCurrentRole(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all',
                currentRole === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('beds')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all',
            activeTab === 'beds' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <BedDouble size={14} />
          <span>Bed Management ({beds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ventilators')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all',
            activeTab === 'ventilators' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Wind size={14} />
          <span>Ventilator Devices ({ventilators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all',
            activeTab === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Users size={14} />
          <span>Staff & Roster ({staff.length})</span>
        </button>
      </div>

      {/* Bed Management Tab */}
      {activeTab === 'beds' && (
        <div className="space-y-4">
          {/* Bed Occupancy Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-800 uppercase">Available Ready Beds</span>
              <div className="text-3xl font-extrabold text-emerald-900 mt-1">{availableBeds}</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-xs font-bold text-blue-800 uppercase">Occupied Beds</span>
              <div className="text-3xl font-extrabold text-blue-900 mt-1">{occupiedBeds}</div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xs font-bold text-amber-800 uppercase">Cleaning / Maintenance</span>
              <div className="text-3xl font-extrabold text-amber-900 mt-1">{cleaningBeds}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-slate-900 text-white text-xs font-bold flex justify-between items-center">
              <span>HOSPITAL BEDS & EQUIPMENT DIRECTORY</span>
              <span className="text-slate-400">Click status badge to toggle occupancy</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">BED NO</th>
                  <th className="p-3">WARD</th>
                  <th className="p-3">VENTILATOR</th>
                  <th className="p-3">DIALYSIS CAPABLE</th>
                  <th className="p-3">ASSIGNED PATIENT</th>
                  <th className="p-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map(bed => {
                  const patient = bed.patientId ? store.patients.find(p => p.id === bed.patientId) : null;
                  return (
                    <tr key={bed.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{bed.bedNo}</td>
                      <td className="p-3 font-semibold text-slate-700">{bed.ward}</td>
                      <td className="p-3">
                        {bed.hasVentilator ? (
                          <span className="text-blue-600 font-semibold flex items-center gap-1">
                            <Wind size={13} /> Attached
                          </span>
                        ) : <span className="text-slate-400">No</span>}
                      </td>
                      <td className="p-3">
                        {bed.hasDialysis ? <span className="text-purple-600 font-semibold">Yes</span> : <span className="text-slate-400">No</span>}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {patient ? `${patient.name} (${patient.ipdNo})` : <span className="text-slate-400">Vacant</span>}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleBedStatus(bed.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform active:scale-95',
                            bed.status === 'Available' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                            bed.status === 'Occupied' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          )}
                        >
                          {bed.status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ventilator Devices Tab */}
      {activeTab === 'ventilators' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-900 text-white text-xs font-bold flex justify-between items-center">
            <span>VENTILATOR FLEET STATUS</span>
            <span className="text-slate-400">Total 8 Units</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">CODE</th>
                <th className="p-3">MODEL</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3">MODE</th>
                <th className="p-3">FiO₂ / PEEP</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventilators.map(vent => (
                <tr key={vent.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{vent.deviceCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{vent.model}</td>
                  <td className="p-3 text-slate-600">{vent.ward} {vent.bedNo ? `(${vent.bedNo})` : ''}</td>
                  <td className="p-3 font-semibold text-blue-700">{vent.mode}</td>
                  <td className="p-3 text-slate-700">{vent.fio2}% / {vent.peep} cmH₂O</td>
                  <td className="p-3">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      vent.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                      vent.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {vent.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-900 text-white text-xs font-bold flex justify-between items-center">
            <span>MEDICAL & NURSING ROSTER</span>
            <span className="text-slate-400">Morning Shift (07:00 - 15:00)</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">NAME</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">DEPARTMENT</th>
                <th className="p-3">SHIFT</th>
                <th className="p-3">ASSIGNED BEDS</th>
                <th className="p-3 text-right">ON DUTY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map(stf => (
                <tr key={stf.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{stf.name}</td>
                  <td className="p-3 font-semibold text-teal-700">{stf.role}</td>
                  <td className="p-3 text-slate-600">{stf.department}</td>
                  <td className="p-3 text-slate-700">{stf.shift}</td>
                  <td className="p-3 font-mono text-slate-600">
                    {stf.assignedBeds ? stf.assignedBeds.join(', ') : '-'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleStaffDuty(stf.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-bold transition-all',
                        stf.onDuty ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {stf.onDuty ? 'On Duty' : 'Off Duty'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
