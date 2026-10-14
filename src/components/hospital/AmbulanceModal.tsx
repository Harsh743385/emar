'use client';

import { useState } from 'react';
import { X, Ambulance, PhoneCall, MapPin, Navigation, Clock, CheckCircle2 } from 'lucide-react';

interface AmbulanceModalProps {
  open: boolean;
  onClose: () => void;
}

export function AmbulanceModal({ open, onClose }: AmbulanceModalProps) {
  const [dispatched, setDispatched] = useState(false);
  const [location, setLocation] = useState('Naroda Cross Road, Ahmedabad');
  const [condition, setCondition] = useState('Acute Myocardial Infarction / Unconscious');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-900">
              <Ambulance size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">Emergency Ambulance Dispatch</h3>
              <p className="text-xs text-slate-400">GPS tracked hospital ALS / BLS fleet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!dispatched ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location / Patient Landmark</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Enter pickup address or Google Maps pin..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reported Clinical Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Severe Trauma, Dyspnea, Stroke..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-800 mb-1">ALS Unit 02 (ICU on Wheels)</div>
                  <div className="text-slate-500">Equipped: Hamilton Ventilator, Defibrillator, Syringe Pump</div>
                  <div className="text-emerald-600 font-semibold mt-1">Status: Ready at Base</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-800 mb-1">Estimated ETA</div>
                  <div className="text-2xl font-bold text-teal-600">8 - 12 <span className="text-xs font-normal text-slate-500">mins</span></div>
                  <div className="text-slate-500 mt-1">Traffic optimized routing</div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setDispatched(true)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Navigation size={16} />
                  <span>Dispatch Now</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-900">ALS Unit 02 Dispatched</h4>
              <p className="text-xs text-slate-600">
                Driver & Paramedic crew have acknowledged the emergency call and are en route to {location}.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ambulance Reg:</span>
                  <span className="font-bold text-slate-800">GJ-01-EC-9090</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver / Paramedic:</span>
                  <span className="font-bold text-slate-800">Mahesh Parmar (9876541234)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ETA:</span>
                  <span className="font-bold text-red-600">6 Minutes</span>
                </div>
              </div>
              <button
                onClick={() => { setDispatched(false); onClose(); }}
                className="w-full py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
