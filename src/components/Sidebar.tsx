'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ClipboardList, Activity, FileText, Droplets,
  AlertTriangle, Stethoscope, Shield, ArrowLeftRight, ShoppingBag,
  Heart, Sun, UserCheck, Dumbbell, Pill, BarChart2, Zap, GitBranch,
  ChevronDown, ChevronRight, Settings, BookOpen, RefreshCw,
  Users, TestTube, Wind
} from 'lucide-react';
import type { Patient } from '@/lib/types';

interface NavChild {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  {
    id: 'assessments-group',
    label: 'Patient Assessment',
    icon: <ClipboardList size={16} />,
    children: [
      { id: 'initial-assessment', label: 'Initial Nursing Assessment', icon: <ClipboardList size={14} /> },
      { id: 'reassessment', label: 'Nursing Reassessment', icon: <RefreshCw size={14} /> },
      { id: 'final-assessment', label: 'Final Assessment', icon: <FileText size={14} /> },
      { id: 'emergency-assessment', label: 'Emergency Assessment', icon: <AlertTriangle size={14} /> },
      { id: 'daycare-assessment', label: 'Daycare Assessment', icon: <Sun size={14} /> },
    ],
  },
  {
    id: 'monitoring-group',
    label: 'Clinical Monitoring',
    icon: <Activity size={16} />,
    children: [
      { id: 'vital-signs', label: 'Vital Signs', icon: <Activity size={14} /> },
      { id: 'io-chart', label: 'I/O Chart', icon: <Droplets size={14} /> },
      { id: 'icu-chart', label: 'ICU/CCU Chart', icon: <BarChart2 size={14} /> },
      { id: 'diabetic-chart', label: 'Diabetic Flow Chart', icon: <TestTube size={14} /> },
    ],
  },
  {
    id: 'care-group',
    label: 'Care Plans & Notes',
    icon: <FileText size={16} />,
    children: [
      { id: 'nursing-notes', label: 'Progress Notes', icon: <FileText size={14} /> },
      { id: 'care-plan', label: 'Nursing Care Plan', icon: <Heart size={14} /> },
      { id: 'mar', label: 'Medication Admin (MAR)', icon: <Pill size={14} /> },
    ],
  },
  {
    id: 'specialized-group',
    label: 'Specialised Assessments',
    icon: <Stethoscope size={16} />,
    children: [
      { id: 'pressure-ulcer', label: 'Pressure Ulcer', icon: <Shield size={14} /> },
      { id: 'catheter-care', label: 'Urinary Catheter Care', icon: <Droplets size={14} /> },
      { id: 'bundle-care', label: 'Bundle Care', icon: <GitBranch size={14} /> },
      { id: 'phlebitis', label: 'Phlebitis Assessment', icon: <Zap size={14} /> },
      { id: 'mini-nutrition', label: 'Mini Nutritional Assessment', icon: <Users size={14} /> },
    ],
  },
  {
    id: 'procedures-group',
    label: 'Procedures & Safety',
    icon: <Shield size={16} />,
    children: [
      { id: 'pre-op', label: 'Pre-Operative Checklist', icon: <ClipboardList size={14} /> },
      { id: 'patient-transfer', label: 'Patient Transfer & SBAR', icon: <ArrowLeftRight size={14} /> },
      { id: 'valuables', label: 'Valuable Items', icon: <ShoppingBag size={14} /> },
    ],
  },
  {
    id: 'handovers-group',
    label: 'Handovers',
    icon: <ArrowLeftRight size={16} />,
    children: [
      { id: 'shift-handover', label: 'Shift Handover', icon: <ArrowLeftRight size={14} /> },
      { id: 'rmo-handover', label: 'RMO Handover', icon: <UserCheck size={14} /> },
    ],
  },
  {
    id: 'physio-group',
    label: 'Physiotherapy',
    icon: <Dumbbell size={16} />,
    children: [
      { id: 'physio-assessment', label: 'PT Assessment', icon: <Dumbbell size={14} /> },
      { id: 'physio-sessions', label: 'PT Session Notes', icon: <FileText size={14} /> },
    ],
  },
  {
    id: 'medications-group',
    label: 'Medications',
    icon: <Pill size={16} />,
    children: [
      { id: 'med-reconciliation', label: 'Med. Reconciliation', icon: <RefreshCw size={14} /> },
      { id: 'own-medications', label: 'Home Medications', icon: <Pill size={14} /> },
    ],
  },
  {
    id: 'admin-group',
    label: 'Administration',
    icon: <Settings size={16} />,
    children: [
      { id: 'form-master', label: 'Form Master', icon: <BookOpen size={14} /> },
      { id: 'field-master', label: 'Field Master', icon: <Settings size={14} /> },
    ],
  },
];

// Admin tabs don't require patient
const ADMIN_TABS = ['dashboard', 'form-master', 'field-master'];

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedPatient: Patient | null;
  collapsed: boolean;
}

export function SidebarNav({ activeTab, onTabChange, selectedPatient, collapsed }: SidebarNavProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['assessments-group', 'monitoring-group'])
  );

  function toggleGroup(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {NAV_GROUPS.map(group => {
        if (!group.children) {
          return (
            <button
              key={group.id}
              onClick={() => onTabChange(group.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-sm font-medium',
                activeTab === group.id
                  ? 'bg-teal-600/30 text-teal-300 border-r-2 border-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              )}
            >
              <span className="flex-shrink-0">{group.icon}</span>
              {!collapsed && <span>{group.label}</span>}
            </button>
          );
        }

        return (
          <div key={group.id}>
            <button
              onClick={() => !collapsed && toggleGroup(group.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                'hover:bg-slate-700 text-slate-400 hover:text-slate-200',
                'text-xs font-semibold uppercase tracking-wider mt-1'
              )}
            >
              <span className="flex-shrink-0">{group.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1">{group.label}</span>
                  {expanded.has(group.id) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </>
              )}
            </button>
            {!collapsed && expanded.has(group.id) && (
              <div className="ml-4 border-l border-slate-700">
                {group.children.map(child => {
                  const disabled = !selectedPatient && !ADMIN_TABS.includes(child.id);
                  return (
                    <button
                      key={child.id}
                      onClick={() => !disabled && onTabChange(child.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                        activeTab === child.id
                          ? 'bg-teal-600/30 text-teal-300 border-r-2 border-teal-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700',
                        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      )}
                    >
                      <span className="flex-shrink-0 ml-1">{child.icon}</span>
                      <span className="text-xs">{child.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  open: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedPatient: Patient | null;
}

export function Sidebar({ open, activeTab, onTabChange, selectedPatient }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-800 text-slate-100 flex-shrink-0 h-full transition-all duration-300',
        open ? 'w-60' : 'w-12'
      )}
      style={{ minWidth: open ? 240 : 48 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-700 flex-shrink-0">
        <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Wind size={14} className="text-white" />
        </div>
        {open && (
          <div className="overflow-hidden min-w-0">
            <div className="text-sm font-bold text-white whitespace-nowrap">Digital Nursing</div>
            <div className="text-xs text-teal-400 whitespace-nowrap">Care EMR – Demo</div>
          </div>
        )}
      </div>

      <SidebarNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        selectedPatient={selectedPatient}
        collapsed={!open}
      />

      {open && (
        <div className="px-3 py-3 border-t border-slate-700 flex-shrink-0">
          <div className="text-xs text-slate-500 text-center">Demo v1.0 • Not for clinical use</div>
        </div>
      )}
    </aside>
  );
}
