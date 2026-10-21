'use client';

import React, { useState, useMemo } from 'react';
import { useEMR } from '@/context/EMRContext';
import {
  FileText, Sparkles, Layers, CheckCircle2,
  Calendar, Clock, AlertCircle, Plus, ChevronRight, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicNursingFormRenderer } from '@/components/DynamicNursingFormRenderer';

export function DynamicFormsPatientTab() {
  const { store, selectedPatient } = useEMR();
  const forms = useMemo(() => store.formMaster.filter(f => f.isActive), [store.formMaster]);

  // Default to FM008 (Post-Operative Recovery) or the first available form
  const [selectedFormId, setSelectedFormId] = useState<string>(() => {
    const defaultForm = forms.find(f => f.formCode === 'PORA') || forms[0];
    return defaultForm?.id || '';
  });

  const [moduleFilter, setModuleFilter] = useState<string>('All');

  const selectedForm = useMemo(() => {
    return forms.find(f => f.id === selectedFormId);
  }, [forms, selectedFormId]);

  // Distinct modules
  const modules = useMemo(() => {
    const set = new Set<string>();
    forms.forEach(f => {
      if (f.nursingModule) set.add(f.nursingModule);
    });
    return ['All', ...Array.from(set)];
  }, [forms]);

  const filteredForms = useMemo(() => {
    if (moduleFilter === 'All') return forms;
    return forms.filter(f => f.nursingModule === moduleFilter);
  }, [forms, moduleFilter]);

  // Count patient submissions across all dynamic forms
  const patientSubmissionCount = useMemo(() => {
    if (!selectedPatient?.id) return 0;
    return (store.dynamicFormSubmissions || []).filter(s => s.patientId === selectedPatient.id).length;
  }, [store.dynamicFormSubmissions, selectedPatient]);

  if (!selectedPatient) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-800">No Patient Selected</h3>
        <p className="text-xs text-slate-500">Please select an admitted patient from the patient directory to chart dynamic nursing forms.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">Dynamic Nursing Forms</h2>
              <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[11px] border border-teal-200">
                NABH V1 Engine
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              Chart, validate, and record specialized nursing assessments configured via Form Master and Field Master.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-teal-200 shadow-2xs text-center">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Patient Submissions</span>
            <span className="font-mono text-sm font-bold text-teal-700">{patientSubmissionCount} Records</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-lg border border-teal-200 shadow-2xs text-center">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Forms</span>
            <span className="font-mono text-sm font-bold text-slate-800">{forms.length} Configured</span>
          </div>
        </div>
      </div>

      {/* Form Selector Carousel / Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Module:</span>
            {modules.map(mod => (
              <button
                key={mod}
                onClick={() => setModuleFilter(mod)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs transition',
                  moduleFilter === mod
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Form Selector Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {filteredForms.map(f => {
            const isSelected = selectedFormId === f.id;
            const fieldCount = store.fieldMaster.filter(fld => fld.formId === f.id && fld.isActive).length;
            const patientSubCount = (store.dynamicFormSubmissions || []).filter(
              s => s.formId === f.id && s.patientId === selectedPatient.id
            ).length;

            return (
              <button
                key={f.id}
                onClick={() => setSelectedFormId(f.id)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between shadow-xs',
                  isSelected
                    ? 'bg-gradient-to-br from-teal-50 to-white border-teal-500 ring-2 ring-teal-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      'font-mono text-[10px] font-bold px-1.5 py-0.5 rounded',
                      isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                    )}>
                      {f.formCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {fieldCount} fields
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{f.formName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{f.nursingModule}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className={cn(
                    'font-medium',
                    patientSubCount > 0 ? 'text-teal-700 font-bold' : 'text-slate-400'
                  )}>
                    {patientSubCount > 0 ? `✓ ${patientSubCount} saved` : 'No entries yet'}
                  </span>
                  <span className="text-teal-600 font-semibold flex items-center">
                    Select <ChevronRight size={10} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Dynamic Form */}
      {selectedForm ? (
        <div className="pt-2">
          <DynamicNursingFormRenderer
            formId={selectedForm.id}
            patientId={selectedPatient.id}
            showHistory={true}
          />
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
          Please select a dynamic nursing form above to view or enter data.
        </div>
      )}
    </div>
  );
}
