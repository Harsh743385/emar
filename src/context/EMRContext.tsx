'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Patient, EMRStore } from '@/lib/types';
import { getStore, saveStore, resetStore } from '@/lib/store';

interface EMRContextType {
  store: EMRStore;
  selectedPatient: Patient | null;
  selectPatient: (patient: Patient | null) => void;
  updateStore: (updater: (prev: EMRStore) => EMRStore) => void;
  resetDemo: () => void;
  isLoading: boolean;
}

const EMRContext = createContext<EMRContextType | null>(null);

export function EMRProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<EMRStore | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = getStore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(data);
    setIsLoading(false);
  }, []);

  const updateStore = useCallback((updater: (prev: EMRStore) => EMRStore) => {
    setStore(prev => {
      if (!prev) return prev!;
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const selectPatient = useCallback((patient: Patient | null) => {
    setSelectedPatient(patient);
  }, []);

  const resetDemo = useCallback(() => {
    resetStore();
    const data = getStore();
    setStore(data);
    setSelectedPatient(null);
  }, []);

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Digital Nursing Care...</p>
        </div>
      </div>
    );
  }

  return (
    <EMRContext.Provider value={{ store, selectedPatient, selectPatient, updateStore, resetDemo, isLoading }}>
      {children}
    </EMRContext.Provider>
  );
}

export function useEMR() {
  const ctx = useContext(EMRContext);
  if (!ctx) throw new Error('useEMR must be used within EMRProvider');
  return ctx;
}
