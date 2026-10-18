'use client';

import { useState } from 'react';
import { useEMR } from '@/context/EMRContext';
import { Menu, Search, Bell, User, RefreshCw, X, ShieldCheck } from 'lucide-react';
import type { Patient } from '@/lib/types';

interface HeaderProps {
  onMenuClick: () => void;
  activeTab?: string;
  onTabChange: (tab: string) => void;
}

export function Header({ onMenuClick, onTabChange }: HeaderProps) {
  const { selectedPatient, selectPatient, store, resetDemo } = useEMR();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = store.patients.filter(p =>
    p.status === 'Active' && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ipdNo.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function handleSelectPatient(patient: Patient) {
    selectPatient(patient);
    setSearchOpen(false);
    setSearchQuery('');
    onTabChange('initial-assessment');
  }

  function handleReset() {
    if (confirm('Reset all demo data to defaults? This cannot be undone.')) {
      resetDemo();
      selectPatient(null);
      onTabChange('dashboard');
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-2.5 flex-shrink-0 no-print" style={{ minHeight: 56 }}>
      {/* Menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
      >
        <Menu size={18} />
      </button>

      {/* Patient info / search area */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {selectedPatient ? (
          <div className="flex items-center gap-3 min-w-0">
            {/* Patient avatar */}
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {selectedPatient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">{selectedPatient.name}</div>
              <div className="text-xs text-slate-500 truncate">
                {selectedPatient.uhid} &nbsp;·&nbsp; {selectedPatient.ipdNo} &nbsp;·&nbsp;
                {selectedPatient.age}Y/{selectedPatient.gender.charAt(0)} &nbsp;·&nbsp;
                {selectedPatient.ward} - {selectedPatient.bed}
              </div>
            </div>
            <button
              onClick={() => { selectPatient(null); onTabChange('dashboard'); }}
              className="flex-shrink-0 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Close patient"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-sm font-semibold text-slate-700">
            Digital Nursing Care — Select a patient to begin
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* NABH Accreditation Center */}
        <button
          onClick={() => onTabChange('nabh-compliance')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-bold text-teal-800 transition-colors"
          title="Open NABH Standards, EMR Field & Module Mapping System"
        >
          <ShieldCheck size={14} className="text-teal-600" />
          <span className="hidden sm:inline">NABH Compliance</span>
        </button>

        {/* Patient search */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Find Patient</span>
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <div className="p-3 border-b border-slate-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <Search size={14} className="text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search name, UHID, IPD no..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">No patients found</div>
                ) : filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                        {p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {p.uhid} · {p.age}Y/{p.gender.charAt(0)} · {p.ward}-{p.bed}
                        </div>
                        <div className="text-xs text-slate-400">{p.diagnosis}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset demo */}
        <button
          onClick={handleReset}
          title="Reset demo data"
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
        >
          <RefreshCw size={15} />
        </button>

        {/* Notification bell */}
        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">Demo Nurse</div>
            <div className="text-xs text-slate-400">Nursing Station</div>
          </div>
        </div>
      </div>
    </header>
  );
}
