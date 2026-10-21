'use client';

import { useEffect, useRef } from 'react';
import { X, Save, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave: () => void;
  onSaveDraft?: () => void;
  children: React.ReactNode;
  saveLabel?: string;
}

export function FormDrawer({
  open, title, subtitle, onClose, onSave, onSaveDraft, children, saveLabel = 'Save'
}: FormDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={ref}
        className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl"
        style={{ width: 'min(700px, 95vw)' }}
      >
        {/* Head */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h4 className="font-bold text-slate-800 text-base">{title}</h4>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg text-sm hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <FileEdit size={14} />
              Save Draft
            </button>
          )}
          <button
            onClick={onSave}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <Save size={14} />
            {saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// Reusable form field components
export function FormGroup({
  label, required, hint, children, className
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-[11px] text-slate-400 -mt-0.5 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

export function FormInput({
  type = 'text', value, onChange, placeholder, required, disabled, min, max, step, className
}: {
  type?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; disabled?: boolean;
  min?: string | number; max?: string | number; step?: string | number; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={cn(
        'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800',
        'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
        'placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
    />
  );
}

export function FormSelect({
  value, onChange, options, required, disabled, className
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  required?: boolean; disabled?: boolean; className?: string;
}) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800',
        'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
        'disabled:bg-slate-50 bg-white',
        className
      )}
    >
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function FormTextarea({
  value, onChange, placeholder, rows = 3, required, className
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean; className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className={cn(
        'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800',
        'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
        'placeholder:text-slate-400 resize-y',
        className
      )}
    />
  );
}

export function YesNoToggle({
  value, onChange
}: {
  value: boolean | null; onChange: (v: boolean) => void; label?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
          value === true
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'
        )}
      >Yes</button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
          value === false
            ? 'bg-red-500 text-white border-red-500'
            : 'bg-white text-slate-600 border-slate-200 hover:border-red-400'
        )}
      >No</button>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2.5 pb-1.5 border-b border-slate-100">
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    'Completed': 'badge-completed',
    'Draft': 'badge-draft',
    'Pending': 'badge-pending',
  };
  return (
    <span className={cn('badge-status', classes[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="empty-state py-16">
      {icon && <div className="text-5xl mb-4 opacity-30">{icon}</div>}
      <h5 className="font-semibold text-slate-600 text-sm">{title}</h5>
      {description && <p className="text-xs mt-1 text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="ncard-head">
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TealButton({ onClick, children, size = 'md', disabled }: {
  onClick: () => void; children: React.ReactNode; size?: 'sm' | 'md'; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      )}
    >
      {children}
    </button>
  );
}

export function SoftButton({ onClick, children, size = 'md' }: {
  onClick: () => void; children: React.ReactNode; size?: 'sm' | 'md';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 rounded-lg transition-colors flex items-center gap-1.5',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      )}
    >
      {children}
    </button>
  );
}
