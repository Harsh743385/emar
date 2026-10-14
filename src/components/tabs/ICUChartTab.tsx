'use client';

import { useState, useMemo } from 'react';
import { useEMR } from '@/context/EMRContext';
import { generateId, nowDateStr, nowTimeStr } from '@/lib/store';
import {
  Activity, HeartPulse, Droplets, Wind, Pill, FileText,
  Calculator, Printer, Download, Plus, Edit2, ShieldAlert,
  AlertTriangle, CheckCircle2, ChevronRight, Clock, User,
  Calendar, Stethoscope, BedDouble, ArrowUpRight, BarChart3,
  TrendingUp, RefreshCw, Sparkles, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  calculateGCS,
  calculateNEWS2,
  exportToCSV,
  playAlertSound
} from '@/lib/hospitalData';
import type { ICUChart, IOChartEntry, RecordStatus } from '@/lib/types';

// 24 Hour columns matching ICU.pdf
const ICU_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'
];

export function ICUChartTab() {
  const { store, selectedPatient, updateStore } = useEMR();

  // Selected date
  const [activeDate, setActiveDate] = useState(nowDateStr());
  // Sub-tab: 'paper-sheet' | 'vitals-trend' | 'ventilator' | 'fluid-balance' | 'infusions' | 'labs' | 'procedures' | 'calculators'
  const [activeSubTab, setActiveSubTab] = useState<'paper-sheet' | 'vitals-trend' | 'ventilator' | 'fluid-balance' | 'infusions' | 'labs' | 'procedures' | 'calculators'>('paper-sheet');

  // Entry drawer modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>('08:00');
  const [editChartId, setEditChartId] = useState<string | null>(null);

  // Device days state (persisted per patient / date) - starts empty
  const [deviceDays, setDeviceDays] = useState({
    centralLine: '', arterialLine: '', foley: '', stereicath: '',
    hdCatheter: '', ventiDay: '', ventiFilter: '', intracath: '',
    ettTt: '', ventCircuit: '', drain: '', rtDay: '', ivDay: '',
    icuDay: '', hospitalDay: '', mlc: '', consultant: selectedPatient?.consultantDoctor || ''
  });

  // Observations entry form state - starts empty
  const [form, setForm] = useState({
    time: '08:00',
    bpSys: 0, bpDia: 0, pulse: 0, tempF: 0, rr: 0, spo2: 0, map: 0, cvp: 0,
    bloodSugar: 0, insulinMoa: '', painScore: 0, gcs: 15,
    heartRhythm: '', sedationScore: '', abdominalGirthCm: 0, positionSuction: '',
    bolusIntake: 0, hourlyIvIntake: 0, oralRtFeedType: '', oralRtAmount: 0,
    vomitAspirate: 0, hourlyUrine: 0, bowels: '', drain1Amount: 0, drain2Amount: 0,
    ventilatorMode: '', fio2: 0, peep: 0, tv: 0,
    infusion1Name: '', infusion1Rate: '',
    infusion2Name: '', infusion2Rate: '',
    nursingObservations: '',
  });

  // GCS Calculator interactive modal
  const [gcsEyes, setGcsEyes] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);

  if (!selectedPatient) return null;
  const patientId = selectedPatient.id;

  // Retrieve only saved charts for this patient & date (no fabricated defaults)
  const patientDateRecords = (store.icuCharts || []).filter(
    r => r.patientId === patientId && r.date === activeDate
  );

  // Map hourly records into an index dictionary by time
  const hourMap = useMemo(() => {
    const map: Record<string, ICUChart> = {};
    patientDateRecords.forEach(r => {
      // standardise time prefix (e.g. 07:00:00 -> 07:00)
      const t = r.time.substring(0, 5);
      map[t] = r;
    });
    return map;
  }, [patientDateRecords]);

  // Vitals stats calculations - null if no records yet
  const latestRecord = patientDateRecords.length > 0 ? patientDateRecords[patientDateRecords.length - 1] : null;

  // Fluid Balance Totals across all 24 hours
  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let bowelCount = 0;

    ICU_HOURS.forEach(h => {
      const rec = hourMap[h];
      if (rec) {
        const iv = (rec.hourlyIvIntake ?? 0) + (rec.bolusIntake ?? 0);
        const oral = (rec.oralRtAmount ?? 0);
        totalIn += (iv + oral);

        const urine = (rec.hourlyUrine ?? 0);
        const vomit = (rec.vomitAspirate ?? 0);
        const d1 = (rec.drain1Amount ?? 0);
        const d2 = (rec.drain2Amount ?? 0);
        totalOut += (urine + vomit + d1 + d2);

        if (rec.bowels && rec.bowels !== '-' && rec.bowels.trim() !== '') {
          bowelCount++;
        }
      }
    });

    return {
      totalIntake: totalIn,
      totalOutput: totalOut,
      balance: totalIn - totalOut,
      bowelEntries: bowelCount,
    };
  }, [hourMap]);

  // Line chart trend data
  const chartTrendData = useMemo(() => {
    return ICU_HOURS.map(h => {
      const rec = hourMap[h];
      const hourNum = parseInt(h.split(':')[0], 10);
      const displayLabel = `${hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum} ${hourNum >= 12 ? 'PM' : 'AM'}`;

      return {
        time: displayLabel,
        rawTime: h,
        pulse: rec?.pulse ?? null,
        sbp: rec?.bpSys ?? null,
        dbp: rec?.bpDia ?? null,
        map: rec?.map ?? (rec ? Math.round(((rec.bpDia * 2) + rec.bpSys) / 3) : null),
        temp: rec?.tempF ?? null,
        spo2: rec?.spo2 ?? null,
        rr: rec?.rr ?? null,
        cvp: rec?.cvp ?? null,
        bsl: rec?.bloodSugar ?? null,
        urine: rec?.hourlyUrine ?? null,
        intake: (rec?.hourlyIvIntake ?? 0) + (rec?.oralRtAmount ?? 0),
        output: (rec?.hourlyUrine ?? 0) + (rec?.vomitAspirate ?? 0) + (rec?.drain1Amount ?? 0),
      };
    });
  }, [hourMap]);

  // Open entry form for a specific hour
  function openHourForm(hour: string) {
    const existing = hourMap[hour];
    setSelectedHour(hour);
    if (existing) {
      setEditChartId(existing.id);
      setForm({
        time: hour,
        bpSys: existing.bpSys || 0,
        bpDia: existing.bpDia || 0,
        pulse: existing.pulse || 0,
        tempF: existing.tempF || 0,
        rr: existing.rr || 0,
        spo2: existing.spo2 || 0,
        map: existing.map || 0,
        cvp: existing.cvp || 0,
        bloodSugar: existing.bloodSugar || 0,
        insulinMoa: existing.insulinMoa || '',
        painScore: existing.painScore || 0,
        gcs: existing.gcs || 15,
        heartRhythm: existing.heartRhythm || '',
        sedationScore: existing.sedationScore || '',
        abdominalGirthCm: existing.abdominalGirthCm || 0,
        positionSuction: existing.positionSuction || '',
        bolusIntake: existing.bolusIntake || 0,
        hourlyIvIntake: existing.hourlyIvIntake || 0,
        oralRtFeedType: existing.oralRtFeedType || '',
        oralRtAmount: existing.oralRtAmount || 0,
        vomitAspirate: existing.vomitAspirate || 0,
        hourlyUrine: existing.hourlyUrine || 0,
        bowels: existing.bowels || '',
        drain1Amount: existing.drain1Amount || 0,
        drain2Amount: existing.drain2Amount || 0,
        ventilatorMode: existing.ventilatorMode || '',
        fio2: existing.fio2 || 0,
        peep: existing.peep || 0,
        tv: existing.tv || 0,
        infusion1Name: existing.infusion1Name || '',
        infusion1Rate: existing.infusion1Rate || '',
        infusion2Name: existing.infusion2Name || '',
        infusion2Rate: existing.infusion2Rate || '',
        nursingObservations: existing.nursingObservations || '',
      });
    } else {
      setEditChartId(null);
      setForm({
        time: hour,
        bpSys: 0,
        bpDia: 0,
        pulse: 0,
        tempF: 0,
        rr: 0,
        spo2: 0,
        map: 0,
        cvp: 0,
        bloodSugar: 0,
        insulinMoa: '',
        painScore: 0,
        gcs: 15,
        heartRhythm: '',
        sedationScore: '',
        abdominalGirthCm: 0,
        positionSuction: '',
        bolusIntake: 0,
        hourlyIvIntake: 0,
        oralRtFeedType: '',
        oralRtAmount: 0,
        vomitAspirate: 0,
        hourlyUrine: 0,
        bowels: '',
        drain1Amount: 0,
        drain2Amount: 0,
        ventilatorMode: '',
        fio2: 0,
        peep: 0,
        tv: 0,
        infusion1Name: '',
        infusion1Rate: '',
        infusion2Name: '',
        infusion2Rate: '',
        nursingObservations: '',
      });
    }
    setDrawerOpen(true);
  }

  // Save observation
  function handleSaveObservation(status: RecordStatus = 'Completed') {
    const hourlyTotalIn = form.hourlyIvIntake + form.bolusIntake + form.oralRtAmount;
    const hourlyTotalOut = form.vomitAspirate + form.hourlyUrine + form.drain1Amount + form.drain2Amount;

    updateStore(prev => {
      const newId = editChartId || generateId();
      const newRecord: ICUChart = {
        id: newId,
        patientId,
        date: activeDate,
        time: form.time,
        shift: parseInt(form.time.split(':')[0]) < 14 ? 'Morning' : parseInt(form.time.split(':')[0]) < 22 ? 'Afternoon' : 'Night',
        nurseName: 'Sr. Sampat Jain',
        bpSys: form.bpSys,
        bpDia: form.bpDia,
        map: form.map || Math.round(((form.bpDia * 2) + form.bpSys) / 3),
        pulse: form.pulse,
        tempF: form.tempF,
        rr: form.rr,
        spo2: form.spo2,
        cvp: form.cvp,
        painScore: form.painScore,
        gcs: form.gcs,
        levelOfConsciousness: form.gcs >= 14 ? 'Alert' : 'Sedated',
        bloodSugar: form.bloodSugar,
        insulinMoa: form.insulinMoa,
        heartRhythm: form.heartRhythm,
        rhythm: form.heartRhythm,
        sedationScore: form.sedationScore,
        sedation: form.sedationScore,
        abdominalGirthCm: form.abdominalGirthCm,
        positionSuction: form.positionSuction,
        bolusIntake: form.bolusIntake,
        hourlyIvIntake: form.hourlyIvIntake,
        oralRtFeedType: form.oralRtFeedType,
        oralRtAmount: form.oralRtAmount,
        hourlyTotalIntake: hourlyTotalIn,
        vomitAspirate: form.vomitAspirate,
        hourlyUrine: form.hourlyUrine,
        bowels: form.bowels,
        drain1Name: 'Chest Drain',
        drain1Amount: form.drain1Amount,
        drain2Name: 'Abdominal Drain',
        drain2Amount: form.drain2Amount,
        hourlyTotalOutput: hourlyTotalOut,
        hourlyBalance: hourlyTotalIn - hourlyTotalOut,
        ventilatorStatus: 'Invasive Mechanical Ventilation',
        ventilatorMode: form.ventilatorMode,
        fio2: form.fio2,
        fiO2: form.fio2,
        peep: form.peep,
        tv: form.tv,
        infusion1Name: form.infusion1Name,
        infusion1Rate: form.infusion1Rate,
        infusion2Name: form.infusion2Name,
        infusion2Rate: form.infusion2Rate,
        nursingObservations: form.nursingObservations,
        status,
        createdAt: new Date().toISOString(),
      };

      // Two-way synchronization with IOChart
      const ioEntry: IOChartEntry = {
        id: generateId(),
        patientId,
        date: activeDate,
        time: form.time,
        shift: (newRecord.shift === 'Evening' ? 'Afternoon' : newRecord.shift) as 'Morning' | 'Afternoon' | 'Night',
        nurseName: 'Sr. Sampat Jain',
        oralIntake: form.oralRtAmount,
        rtIntake: 0,
        infusion: form.hourlyIvIntake,
        antibiotic: 0,
        ivFluids: form.hourlyIvIntake + form.bolusIntake,
        intakeOther: 0,
        intakeOtherLabel: '',
        urineOutput: form.hourlyUrine,
        drainOutput: form.drain1Amount + form.drain2Amount,
        vomit: form.vomitAspirate,
        stool: form.bowels !== '-' ? 1 : 0,
        rtAspiration: 0,
        outputOther: 0,
        remarks: `ICU Flow Sheet sync (${form.time})`,
        status,
        createdAt: new Date().toISOString(),
      };

      const existingCharts = prev.icuCharts || [];
      const updatedCharts = editChartId
        ? existingCharts.map(c => c.id === editChartId ? newRecord : c)
        : [...existingCharts.filter(c => !(c.patientId === patientId && c.date === activeDate && c.time === form.time)), newRecord];

      return {
        ...prev,
        icuCharts: updatedCharts,
        ioChart: [ioEntry, ...(prev.ioChart || [])],
      };
    });

    setDrawerOpen(false);
  }

  // Export CSV
  function handleExportCSV() {
    const rows = ICU_HOURS.map(h => {
      const rec = hourMap[h];
      return {
        PatientName: selectedPatient?.name,
        UHID: selectedPatient?.uhid,
        Date: activeDate,
        Hour: h,
        Pulse_bpm: rec?.pulse || '',
        BP_Sys: rec?.bpSys || '',
        BP_Dia: rec?.bpDia || '',
        MAP_mmHg: rec?.map || '',
        Temp_F: rec?.tempF || '',
        RR_min: rec?.rr || '',
        SpO2_pct: rec?.spo2 || '',
        CVP_cmH2O: rec?.cvp || '',
        BSL_mgdL: rec?.bloodSugar || '',
        Insulin: rec?.insulinMoa || '',
        Rhythm: rec?.heartRhythm || '',
        Sedation: rec?.sedationScore || '',
        AbdominalGirth_cm: rec?.abdominalGirthCm || '',
        Position_Suction: rec?.positionSuction || '',
        Hourly_IV_mL: rec?.hourlyIvIntake || '',
        Oral_RT_mL: rec?.oralRtAmount || '',
        Total_Intake_mL: rec?.hourlyTotalIntake || '',
        Urine_mL: rec?.hourlyUrine || '',
        Vomit_mL: rec?.vomitAspirate || '',
        Drain1_mL: rec?.drain1Amount || '',
        Total_Output_mL: rec?.hourlyTotalOutput || '',
        Hourly_Balance_mL: rec?.hourlyBalance || '',
      };
    });
    exportToCSV(`ICU_Chart_${selectedPatient?.name.replace(/\s+/g, '_')}_${activeDate}.csv`, rows);
  }

  // Trigger Print View
  function handlePrint() {
    window.print();
  }

  // Days list for date selector
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 5 + i);
    return d.toISOString().substring(0, 10);
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ============================================================ */}
      {/* SECTION A: Patient & Admission Critical Care Header */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-teal-700 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
              {selectedPatient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedPatient.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                  {selectedPatient.ward} · Bed {selectedPatient.bed}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  CRITICAL CARE MONITORING
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span><b>UHID:</b> {selectedPatient.uhid}</span>
                <span>•</span>
                <span><b>IPD No:</b> {selectedPatient.ipdNo}</span>
                <span>•</span>
                <span><b>Age/Gender:</b> {selectedPatient.age}Y / {selectedPatient.gender}</span>
                <span>•</span>
                <span><b>Blood Group:</b> <span className="font-bold text-red-600">{selectedPatient.bloodGroup}</span></span>
                <span>•</span>
                <span><b>Consultant:</b> {selectedPatient.consultantDoctor}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Print, Export CSV, Add Entry) */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Printer size={15} />
              <span>Print PDF Chart</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => openHourForm('08:00')}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>Record Vitals & I/O</span>
            </button>
          </div>
        </div>

        {/* Clinical Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Diagnosis</span>
            <div className="font-bold text-slate-800 truncate" title={selectedPatient.diagnosis}>
              {selectedPatient.diagnosis}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Allergies</span>
            <div className="font-bold text-red-600 truncate">NKDA (No Known Allergies)</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Resuscitation Status</span>
            <div className="font-bold text-emerald-700">Full Code (Active)</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Isolation Status</span>
            <div className="font-bold text-slate-700">Standard Precautions</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Duty Nurse</span>
            <div className="font-bold text-slate-800">Sr. Sampat Jain</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Admission Date</span>
            <div className="font-bold text-slate-800">{selectedPatient.admissionDate}</div>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 overflow-x-auto no-print">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2">
            Chart Date:
          </span>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                activeDate === d
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {d === nowDateStr() ? `Today (${d})` : d}
            </button>
          ))}
          <input
            type="date"
            value={activeDate}
            onChange={e => setActiveDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none bg-white"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION B: Real-time Stat Cards (Large Font, Color-Coded Abnormalities) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {/* Heart Rate */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          (latestRecord?.pulse || 0) > 110 || (latestRecord?.pulse || 0) < 55
            ? 'bg-red-50/80 border-red-300 text-red-950'
            : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>HEART RATE</span>
            <HeartPulse size={16} className="text-red-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{latestRecord?.pulse || '--'}</span>
            <span className="text-[10px] text-slate-400">bpm</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {latestRecord?.heartRhythm || 'Sinus Rhythm'}
          </div>
        </div>

        {/* Blood Pressure */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          (latestRecord?.bpSys || 0) < 90 || (latestRecord?.bpSys || 0) > 160
            ? 'bg-red-50/80 border-red-300 text-red-950'
            : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>BLOOD PRESSURE</span>
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{latestRecord?.bpSys || '--'}/{latestRecord?.bpDia || '--'}</span>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            MAP: <span className="font-bold text-slate-700">{latestRecord?.map || '--'}</span> mmHg
          </div>
        </div>

        {/* SpO2 */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          (latestRecord?.spo2 || 0) < 92
            ? 'bg-red-50/80 border-red-300 text-red-950'
            : (latestRecord?.spo2 || 0) < 95
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>OXYGEN SAT (SpO₂)</span>
            <Wind size={16} className="text-teal-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-2xl font-black', (latestRecord?.spo2 || 0) < 92 ? 'text-red-600' : 'text-slate-900')}>
              {latestRecord?.spo2 || '--'}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            FiO₂: <b>{latestRecord?.fio2 || 40}%</b> via {latestRecord?.ventilatorMode || 'Vent'}
          </div>
        </div>

        {/* Temperature */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          (latestRecord?.tempF || 0) > 101
            ? 'bg-red-50/80 border-red-300 text-red-950'
            : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>TEMP (AXILLARY)</span>
            <Activity size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{latestRecord?.tempF || '--'}</span>
            <span className="text-[10px] text-slate-400">°F</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            RR: <b>{latestRecord?.rr || '--'}</b> /min
          </div>
        </div>

        {/* Glasgow Coma Scale (GCS) */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          (latestRecord?.gcs || 15) <= 8
            ? 'bg-red-50/80 border-red-300 text-red-950'
            : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>GCS SCORE</span>
            <BrainIcon size={16} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{latestRecord?.gcs || 15}</span>
            <span className="text-[10px] text-slate-400">/ 15</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {latestRecord?.levelOfConsciousness || 'Alert'}
          </div>
        </div>

        {/* 24h Fluid Balance */}
        <div className={cn(
          'p-3.5 rounded-2xl border transition-all',
          totals.balance < -500 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>FLUID BALANCE</span>
            <Droplets size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-2xl font-black', totals.balance >= 0 ? 'text-teal-700' : 'text-amber-700')}>
              {totals.balance >= 0 ? `+${totals.balance}` : totals.balance}
            </span>
            <span className="text-[10px] text-slate-400">mL</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>In: {totals.totalIntake}</span>
            <span>Out: {totals.totalOutput}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Sub-Tabs Navigation (Paper Chart, Graphs, Ventilator, I/O, etc.) */}
      {/* ============================================================ */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm no-print">
        <button
          onClick={() => setActiveSubTab('paper-sheet')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'paper-sheet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Layers size={14} />
          <span>24-Hour Paper Flow Sheet (ICU.pdf)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vitals-trend')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'vitals-trend'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <TrendingUp size={14} />
          <span>Interactive Vital Signs Graph</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ventilator')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'ventilator'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Wind size={14} />
          <span>Ventilator & ABG Flow Sheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fluid-balance')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'fluid-balance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Droplets size={14} />
          <span>Intake & Output Balance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('infusions')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'infusions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Pill size={14} />
          <span>Medications & Infusions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('labs')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'labs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <FileText size={14} />
          <span>Investigation Reports</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calculators')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeSubTab === 'calculators'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Calculator size={14} />
          <span>Clinical Calculators (GCS / NEWS2 / SOFA)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB 1: Authentic 24-Hour Paper Flow Sheet (ICU.pdf Exact Grid) */}
      {/* ============================================================ */}
      {activeSubTab === 'paper-sheet' && (
        <div className="bg-white border border-slate-300 rounded-2xl shadow-md overflow-hidden print:border-none print:shadow-none">
          {/* Paper Header matching ICU.pdf */}
          <div className="p-4 sm:p-5 border-b border-slate-300 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] text-red-600 font-bold uppercase tracking-wider">
                  Patient Name : {selectedPatient.name.toUpperCase()} &nbsp;&nbsp; UHID : {selectedPatient.uhid} &nbsp;&nbsp; IPD : {selectedPatient.ipdNo} &nbsp;&nbsp; Gender : {selectedPatient.gender} &nbsp;&nbsp; Age : {selectedPatient.age}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ASH
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      ANAND SURGICAL HOSPITAL PVT LIMITED
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Memco Cross Road, Naroda Road, Ahmedabad-382345. Mo.: 88662 10666, 88662 12666, 88668 12666
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="text-center px-4 py-1.5 border-2 border-slate-800 rounded-xl">
                  <div className="text-base font-black text-slate-900 tracking-wide uppercase">ICU Chart</div>
                  <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">24-Hour Flow Sheet</div>
                </div>

                <div className="w-28 h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                  ADDRESSOGRAPH
                </div>
              </div>
            </div>

            {/* Device Days & Admission Info Grid matching ICU.pdf */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-300 text-[11px]">
              <div className="space-y-1 bg-white p-2 border border-slate-200 rounded-lg">
                <div className="flex justify-between"><span>CENTRAL LINE DAY:</span> <input value={deviceDays.centralLine} onChange={e => setDeviceDays(p => ({ ...p, centralLine: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>ARTERIAL LINE DAY:</span> <input value={deviceDays.arterialLine} onChange={e => setDeviceDays(p => ({ ...p, arterialLine: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>I.V. DAY:</span> <input value={deviceDays.ivDay} onChange={e => setDeviceDays(p => ({ ...p, ivDay: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>FOLEY&apos;S DAY:</span> <input value={deviceDays.foley} onChange={e => setDeviceDays(p => ({ ...p, foley: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>R. T. DAY:</span> <input value={deviceDays.rtDay} onChange={e => setDeviceDays(p => ({ ...p, rtDay: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
              </div>

              <div className="space-y-1 bg-white p-2 border border-slate-200 rounded-lg">
                <div className="flex justify-between"><span>STEREICATH DAY:</span> <input value={deviceDays.stereicath} onChange={e => setDeviceDays(p => ({ ...p, stereicath: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>H.D. CATHETER DAY:</span> <input value={deviceDays.hdCatheter} onChange={e => setDeviceDays(p => ({ ...p, hdCatheter: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>VENTI. DAY:</span> <input value={deviceDays.ventiDay} onChange={e => setDeviceDays(p => ({ ...p, ventiDay: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>VENTI FILTER DAY:</span> <input value={deviceDays.ventiFilter} onChange={e => setDeviceDays(p => ({ ...p, ventiFilter: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
              </div>

              <div className="space-y-1 bg-white p-2 border border-slate-200 rounded-lg">
                <div className="flex justify-between"><span>INTRACATH DAY:</span> <input value={deviceDays.intracath} onChange={e => setDeviceDays(p => ({ ...p, intracath: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>E.T.T / T.T. DAY:</span> <input value={deviceDays.ettTt} onChange={e => setDeviceDays(p => ({ ...p, ettTt: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>VENT CIRCUIT DAY:</span> <input value={deviceDays.ventCircuit} onChange={e => setDeviceDays(p => ({ ...p, ventCircuit: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
                <div className="flex justify-between"><span>DRAIN DAY:</span> <input value={deviceDays.drain} onChange={e => setDeviceDays(p => ({ ...p, drain: e.target.value }))} className="w-8 text-right font-bold text-slate-900 border-b border-slate-200 outline-none" /></div>
              </div>

              <div className="space-y-1 bg-white p-2 border border-slate-200 rounded-lg">
                <div className="flex justify-between"><span>ICU DAY:</span> <span className="font-bold text-slate-900">{deviceDays.icuDay}</span></div>
                <div className="flex justify-between"><span>DATE:</span> <span className="font-bold text-slate-900">{activeDate}</span></div>
                <div className="flex justify-between"><span>BED NO:</span> <span className="font-bold text-slate-900">{selectedPatient.bed}</span></div>
                <div className="flex justify-between"><span>HOSPITAL DAY:</span> <span className="font-bold text-slate-900">{deviceDays.hospitalDay}</span></div>
                <div className="flex justify-between"><span>MLC:</span> <span className="font-bold text-slate-900">{deviceDays.mlc}</span></div>
              </div>

              <div className="space-y-1 bg-white p-2 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">DIAGNOSES:</span>
                  <div className="font-bold text-slate-800 line-clamp-2">{selectedPatient.diagnosis}</div>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">CONSULTANT:</span>
                  <div className="font-bold text-slate-800 truncate">{selectedPatient.consultantDoctor}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Main 24-Hour Grid Container (Horizontally Scrollable) */}
          {/* ============================================================ */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px] min-w-[1300px]">
              {/* Table Header: Hours 7 AM to 6 AM */}
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center border-b border-slate-800">
                  <th className="p-2 w-48 text-left bg-slate-900 sticky left-0 z-20 shadow-xs border-r border-slate-700">
                    PARAMETER / TIME
                  </th>
                  {ICU_HOURS.map((h, i) => {
                    const hourNum = parseInt(h.split(':')[0], 10);
                    const isNight = i >= 12;
                    return (
                      <th
                        key={h}
                        onClick={() => openHourForm(h)}
                        className={cn(
                          'p-2 w-11 cursor-pointer transition-colors border-r border-slate-800 hover:bg-teal-600',
                          isNight ? 'bg-slate-950 text-amber-200' : 'bg-slate-900 text-white'
                        )}
                        title={`Click to edit observations at ${h}`}
                      >
                        <div className="text-xs font-black">{hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum}</div>
                        <div className="text-[9px] font-normal opacity-60">{hourNum >= 12 ? 'PM' : 'AM'}</div>
                      </th>
                    );
                  })}
                  <th className="p-2 w-28 bg-slate-900 text-center font-bold border-l border-slate-700">
                    SUMMARY
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* SECTION: VITAL SIGNS */}
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={26} className="px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-100 border-y border-slate-300">
                    Vital Signs & Invasive Hemodynamics (Axillary Temp, BP, Pulse, Resp, CVP)
                  </td>
                </tr>

                {/* Axillary Temp */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    AXILLARY TEMP (°F) <span className="text-red-500 font-normal">(X)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.tempF ? (
                        <span className={cn('font-bold', hourMap[h]?.tempF! > 100.4 ? 'text-red-600' : 'text-slate-800')}>
                          {hourMap[h]?.tempF}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-slate-700 bg-slate-50">
                    {latestRecord?.tempF ? `${latestRecord.tempF}°F` : '-'}
                  </td>
                </tr>

                {/* Blood Pressure */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    B.P. (Sys/Dia) <span className="text-blue-500 font-normal">(v / ^)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.bpSys ? (
                        <span className={cn('font-bold text-[10px]', hourMap[h]?.bpSys! < 90 ? 'text-red-600' : 'text-slate-800')}>
                          {hourMap[h]?.bpSys}/{hourMap[h]?.bpDia}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-slate-700 bg-slate-50">
                    {latestRecord?.bpSys ? `${latestRecord.bpSys}/${latestRecord.bpDia}` : '-'}
                  </td>
                </tr>

                {/* MAP */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    MAP (mmHg) <span className="text-purple-600 font-normal">(M)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.map ? (
                        <span className={cn('font-bold text-[10px]', hourMap[h]?.map! < 65 ? 'text-red-600' : 'text-purple-700')}>
                          {hourMap[h]?.map}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-purple-700 bg-slate-50">
                    {latestRecord?.map ? `${latestRecord.map}` : '-'}
                  </td>
                </tr>

                {/* Pulse */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    PULSE (bpm) <span className="text-blue-600 font-normal">(●)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.pulse ? (
                        <span className={cn('font-bold', (hourMap[h]?.pulse || 0) > 110 ? 'text-red-600' : 'text-slate-800')}>
                          {hourMap[h]?.pulse}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-slate-700 bg-slate-50">
                    {latestRecord?.pulse ? `${latestRecord.pulse} bpm` : '-'}
                  </td>
                </tr>

                {/* Resp */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    RESP (/min) <span className="text-emerald-600 font-normal">(+)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.rr ? (
                        <span className="font-semibold text-slate-800">{hourMap[h]?.rr}</span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-slate-700 bg-slate-50">
                    {latestRecord?.rr || '-'}
                  </td>
                </tr>

                {/* CVP */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    CVP (cmH₂O) <span className="text-amber-600 font-normal">(O)</span>
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50">
                      {hourMap[h]?.cvp ? (
                        <span className="font-semibold text-amber-700">{hourMap[h]?.cvp}</span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-amber-700 bg-slate-50">
                    {latestRecord?.cvp || '-'}
                  </td>
                </tr>

                {/* SECTION: ADDITIONAL MONITORING ROWS */}
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={26} className="px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-100 border-y border-slate-300">
                    Additional Clinical Monitoring Rows (Rhythm, Sedation, A.G., FiO₂, SpO₂, POS/SUCT)
                  </td>
                </tr>

                {/* Rhythm */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    RHYTHM
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px] truncate max-w-[45px]">
                      {hourMap[h]?.heartRhythm || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Telemetry</td>
                </tr>

                {/* Sedation */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    SEDATION
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.sedationScore || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">RASS Score</td>
                </tr>

                {/* A.G. (c.m.) - Abdominal Girth */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    A.G. (c.m.)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.abdominalGirthCm ? `${hourMap[h]?.abdominalGirthCm} cm` : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Girth</td>
                </tr>

                {/* FiO2 */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    FiO₂ (%)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.fio2 ? `${hourMap[h]?.fio2}%` : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Oxygen %</td>
                </tr>

                {/* SpO2 */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    SpO₂ (%)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.spo2 ? (
                        <span className={cn('font-bold', (hourMap[h]?.spo2 || 0) < 93 ? 'text-red-600' : 'text-emerald-700')}>
                          {hourMap[h]?.spo2}%
                        </span>
                      ) : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center font-bold text-emerald-700 bg-slate-50">
                    {latestRecord?.spo2 ? `${latestRecord.spo2}%` : '-'}
                  </td>
                </tr>

                {/* POS/SUCT */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    POS / SUCT
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[9px] truncate max-w-[45px]">
                      {hourMap[h]?.positionSuction || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Position</td>
                </tr>

                {/* SECTION: BSL & DRUGS / INFUSIONS */}
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={26} className="px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-100 border-y border-slate-300">
                    Blood Sugar Level & Drugs / Infusions (BSL, M.O.A. / Insulin, Inotropes, Sedation)
                  </td>
                </tr>

                {/* BSL */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    BSL (mg/dL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.bloodSugar ? (
                        <span className={cn('font-bold', (hourMap[h]?.bloodSugar || 0) > 180 ? 'text-red-600' : 'text-slate-800')}>
                          {hourMap[h]?.bloodSugar}
                        </span>
                      ) : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center font-bold text-slate-700 bg-slate-50">
                    {latestRecord?.bloodSugar || '-'}
                  </td>
                </tr>

                {/* M.O.A. / INSULIN */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    M.O.A. / INSULIN
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[9px] text-teal-700 font-medium truncate max-w-[45px]">
                      {hourMap[h]?.insulinMoa || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Sliding scale</td>
                </tr>

                {/* Infusion 1: Noradrenaline */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    INF: Noradrenaline
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[9px] text-slate-700">
                      {hourMap[h]?.infusion1Rate || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-700 bg-slate-50">0.14 mcg/kg</td>
                </tr>

                {/* Infusion 2: Fentanyl */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    INF: Fentanyl
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[9px] text-slate-700">
                      {hourMap[h]?.infusion2Rate || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-700 bg-slate-50">2.5 mL/hr</td>
                </tr>

                {/* SECTION: INTAKE */}
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={26} className="px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-100 border-y border-slate-300">
                    Intake Section (Bolus, Hourly I.V., Cumulative I.V., Oral/R.T., Amount, Cumulative, Total Intake)
                  </td>
                </tr>

                {/* Bolus */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    BOLUS (mL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.bolusIntake || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Bolus</td>
                </tr>

                {/* Hourly I.V. */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    HOURLY I.V. (mL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px] font-semibold text-slate-800">
                      {hourMap[h]?.hourlyIvIntake || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] font-bold text-slate-700 bg-slate-50">Hourly IV</td>
                </tr>

                {/* Cumulative I.V. */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-slate-50/50">
                  <td className="px-3 py-1.5 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    CUMULATIVE I.V. (mL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 text-[10px] font-medium text-slate-600">
                      {hourMap[h]?.cumulativeIvIntake || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] font-bold text-slate-700 bg-slate-50">Running IV</td>
                </tr>

                {/* Oral / R.T. */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    ORAL / R.T. (Feed)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[9px] text-slate-600 truncate max-w-[45px]">
                      {hourMap[h]?.oralRtFeedType || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">RT Feed</td>
                </tr>

                {/* Feed Amount */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    AMOUNT (mL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px] font-semibold text-slate-800">
                      {hourMap[h]?.oralRtAmount || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] font-bold text-slate-700 bg-slate-50">Oral/RT</td>
                </tr>

                {/* TOTAL INTAKE */}
                <tr className="border-b-2 border-slate-300 hover:bg-emerald-50/50 bg-emerald-50/30 font-bold transition-colors">
                  <td className="px-3 py-1.5 font-black text-emerald-900 sticky left-0 bg-emerald-50 z-10 border-r border-slate-300">
                    TOTAL INTAKE (mL)
                  </td>
                  {ICU_HOURS.map(h => {
                    const rec = hourMap[h];
                    const hrIn = rec ? (rec.hourlyIvIntake || 0) + (rec.bolusIntake || 0) + (rec.oralRtAmount || 0) : null;
                    return (
                      <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-300 cursor-pointer text-[10px] font-black text-emerald-800">
                        {hrIn ? hrIn : '-'}
                      </td>
                    );
                  })}
                  <td className="p-1 text-center font-black text-emerald-800 bg-emerald-100">
                    {totals.totalIntake} mL
                  </td>
                </tr>

                {/* SECTION: OUTPUT */}
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={26} className="px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-100 border-y border-slate-300">
                    Output Section (Vomit/Aspirate, Hourly Urine, Cumulative Urine, Bowels, Drain I, Drain II, Total Output)
                  </td>
                </tr>

                {/* Vomit / Aspirate */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    VOMIT / ASPIRATE
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.vomitAspirate ? `${hourMap[h]?.vomitAspirate}` : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Gastric</td>
                </tr>

                {/* Hourly Urine */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    HOURLY URINE (mL)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px] font-bold text-slate-900">
                      {hourMap[h]?.hourlyUrine || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center font-bold text-slate-800 bg-slate-50">Hourly</td>
                </tr>

                {/* Cumulative Urine */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-slate-50/50">
                  <td className="px-3 py-1.5 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    CUMULATIVE URINE
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 text-[10px] font-medium text-slate-600">
                      {hourMap[h]?.cumulativeUrine || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center font-bold text-slate-700 bg-slate-50">Total Urine</td>
                </tr>

                {/* Bowels */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    BOWELS
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px] text-slate-700">
                      {hourMap[h]?.bowels || '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center font-semibold text-slate-700 bg-slate-50">
                    {totals.bowelEntries > 0 ? `${totals.bowelEntries} passed` : '-'}
                  </td>
                </tr>

                {/* Drain - I */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    DRAIN - I (Chest)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.drain1Amount ? `${hourMap[h]?.drain1Amount}` : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Chest Tube</td>
                </tr>

                {/* Drain - II */}
                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                    DRAIN - II (Abdominal)
                  </td>
                  {ICU_HOURS.map(h => (
                    <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-200 cursor-pointer hover:bg-teal-50 text-[10px]">
                      {hourMap[h]?.drain2Amount ? `${hourMap[h]?.drain2Amount}` : '-'}
                    </td>
                  ))}
                  <td className="p-1 text-center text-[10px] text-slate-500 bg-slate-50">Abdo Tube</td>
                </tr>

                {/* TOTAL OUTPUT */}
                <tr className="border-b-2 border-slate-300 hover:bg-rose-50/50 bg-rose-50/30 font-bold transition-colors">
                  <td className="px-3 py-1.5 font-black text-rose-900 sticky left-0 bg-rose-50 z-10 border-r border-slate-300">
                    TOTAL OUTPUT (mL)
                  </td>
                  {ICU_HOURS.map(h => {
                    const rec = hourMap[h];
                    const hrOut = rec ? (rec.hourlyUrine || 0) + (rec.vomitAspirate || 0) + (rec.drain1Amount || 0) + (rec.drain2Amount || 0) : null;
                    return (
                      <td key={h} onClick={() => openHourForm(h)} className="p-1 text-center border-r border-slate-300 cursor-pointer text-[10px] font-black text-rose-800">
                        {hrOut ? hrOut : '-'}
                      </td>
                    );
                  })}
                  <td className="p-1 text-center font-black text-rose-800 bg-rose-100">
                    {totals.totalOutput} mL
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* SECTION 8: FLUID BALANCE SUMMARY BOX (Exact layout from ICU.pdf) */}
          {/* ============================================================ */}
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-lg">
                  Σ
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">24-HOUR RECORD</div>
                  <div className="text-base font-extrabold text-white">FLUID BALANCE SUMMARY</div>
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">24H INTAKE</span>
                <span className="text-xl font-black text-emerald-400">{totals.totalIntake} <span className="text-xs font-normal">mL</span></span>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">24H OUTPUT</span>
                <span className="text-xl font-black text-rose-400">{totals.totalOutput} <span className="text-xs font-normal">mL</span></span>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">NET BALANCE</span>
                  <span className="text-[10px] font-bold text-slate-400">BOWELS: {totals.bowelEntries > 0 ? `${totals.bowelEntries} (+)` : 'Nil'}</span>
                </div>
                <div className={cn(
                  'text-xl font-black flex items-center gap-2',
                  totals.balance >= 0 ? 'text-teal-400' : 'text-amber-400'
                )}>
                  <span>{totals.balance >= 0 ? `+${totals.balance}` : totals.balance} mL</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-700 text-white">
                    {totals.balance >= 0 ? 'Positive' : 'Negative'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: Interactive 24-Hour Vital Signs Chart (Recharts) */}
      {/* ============================================================ */}
      {activeSubTab === 'vitals-trend' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal-600" />
                  <span>24-Hour Hemodynamic & Vitals Graph</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive multi-series telemetry plot with Blood Pressure, MAP, Pulse, Temp, SpO₂
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Showing Date: <span className="font-bold text-slate-700">{activeDate}</span>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} interval={1} angle={-30} textAnchor="end" />
                  <YAxis yAxisId="hrBp" domain={[40, 200]} tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'BP / HR (mmHg / bpm)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748B' } }} />
                  <YAxis yAxisId="temp" orientation="right" domain={[96, 104]} tick={{ fontSize: 10, fill: '#EF4444' }} label={{ value: 'Temp (°F)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#EF4444' } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, border: 'none', color: '#fff', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {/* Systolic BP */}
                  <Line yAxisId="hrBp" type="monotone" dataKey="sbp" name="Systolic BP" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} />
                  {/* Diastolic BP */}
                  <Line yAxisId="hrBp" type="monotone" dataKey="dbp" name="Diastolic BP" stroke="#38BDF8" strokeWidth={1.5} dot={{ r: 2 }} />
                  {/* MAP */}
                  <Line yAxisId="hrBp" type="monotone" dataKey="map" name="MAP" stroke="#9333EA" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  {/* Heart Rate / Pulse */}
                  <Line yAxisId="hrBp" type="monotone" dataKey="pulse" name="Heart Rate (bpm)" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 3 }} />
                  {/* Axillary Temp */}
                  <Line yAxisId="temp" type="monotone" dataKey="temp" name="Temp (°F)" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Graph: Urine & Fluid Trends */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Droplets size={18} className="text-blue-600" />
              <span>Hourly Fluid Intake vs Output Trend</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Hourly fluid balance visualization (Target urine output: &gt; 0.5 mL/kg/hr)
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} interval={1} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'mL', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748B' } }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, border: 'none', color: '#fff', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="intake" name="Hourly Intake (mL)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="output" name="Hourly Output (mL)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: Ventilator & ABG Flow Sheet */}
      {/* ============================================================ */}
      {activeSubTab === 'ventilator' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wind size={18} className="text-blue-600" />
                  <span>Invasive Mechanical Ventilation Telemetry</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Settings, pressure curves, endotracheal tube depth, and wean readiness
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Dräger Evita V800 Connected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Vent Mode</span>
                <div className="text-lg font-black text-blue-900">{latestRecord?.ventilatorMode || 'VC/SIMV'}</div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">FiO₂</span>
                <div className="text-lg font-black text-blue-900">{latestRecord?.fio2 || 40}%</div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">PEEP</span>
                <div className="text-lg font-black text-blue-900">{latestRecord?.peep || 6} <span className="text-xs font-normal">cmH₂O</span></div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tidal Volume</span>
                <div className="text-lg font-black text-blue-900">{latestRecord?.tv || 450} <span className="text-xs font-normal">mL</span></div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tube Size & Depth</span>
                <div className="text-sm font-bold text-slate-800">{latestRecord?.tubeSize || '7.5 mm'} @ {latestRecord?.tubeTiedAt || '21 cm'}</div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Peak Pressure</span>
                <div className="text-lg font-black text-blue-900">26 <span className="text-xs font-normal">cmH₂O</span></div>
              </div>
            </div>

            {/* ABG Parameter Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold flex justify-between">
                <span>LATEST ARTERIAL BLOOD GAS (ABG) ANALYSIS</span>
                <span>Sample Time: 07:30 AM</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 text-center text-xs p-3 bg-slate-50">
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">pH</div>
                  <div className="text-base font-bold text-red-600">7.31 <span className="text-[9px] font-normal text-slate-500">(7.35-7.45)</span></div>
                </div>
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">PaO₂</div>
                  <div className="text-base font-bold text-slate-800">82 <span className="text-[9px] font-normal text-slate-500">mmHg</span></div>
                </div>
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">PaCO₂</div>
                  <div className="text-base font-bold text-blue-600">34 <span className="text-[9px] font-normal text-slate-500">mmHg</span></div>
                </div>
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">HCO₃⁻</div>
                  <div className="text-base font-bold text-red-600">17.2 <span className="text-[9px] font-normal text-slate-500">mEq/L</span></div>
                </div>
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">Lactate</div>
                  <div className="text-base font-bold text-red-600">3.4 <span className="text-[9px] font-normal text-slate-500">mmol/L</span></div>
                </div>
                <div className="p-2">
                  <div className="text-slate-400 text-[10px] font-semibold">Base Excess</div>
                  <div className="text-base font-bold text-red-600">-6.4 <span className="text-[9px] font-normal text-slate-500">mEq/L</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: Fluid Balance & I/O Breakdown */}
      {/* ============================================================ */}
      {activeSubTab === 'fluid-balance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Droplets size={18} className="text-teal-600" />
              <span>Fluid Intake, Output & Cumulative Balance</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Integrated with Hospital I/O Chart module. Two-way synchronization active.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <span className="text-xs font-bold text-emerald-800 uppercase">24-Hour Total Intake</span>
                <div className="text-3xl font-black text-emerald-900 mt-1">{totals.totalIntake} mL</div>
                <div className="text-xs text-emerald-700 mt-2 space-y-1">
                  <div className="flex justify-between"><span>IV Fluids & Bolus:</span> <b>{totals.totalIntake - 800} mL</b></div>
                  <div className="flex justify-between"><span>Oral & RT Peptamen:</span> <b>800 mL</b></div>
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                <span className="text-xs font-bold text-rose-800 uppercase">24-Hour Total Output</span>
                <div className="text-3xl font-black text-rose-900 mt-1">{totals.totalOutput} mL</div>
                <div className="text-xs text-rose-700 mt-2 space-y-1">
                  <div className="flex justify-between"><span>Hourly Urine Output:</span> <b>{totals.totalOutput - 120} mL</b></div>
                  <div className="flex justify-between"><span>Drain & Gastric Aspirate:</span> <b>120 mL</b></div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase">Net Fluid Balance</span>
                <div className={cn('text-3xl font-black mt-1', totals.balance >= 0 ? 'text-teal-400' : 'text-amber-400')}>
                  {totals.balance >= 0 ? `+${totals.balance}` : totals.balance} mL
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Status: <b>{totals.balance >= 0 ? 'Adequate Hydration (Positive)' : 'Negative Balance'}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 5: Medications & Infusions */}
      {/* ============================================================ */}
      {activeSubTab === 'infusions' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill size={18} className="text-purple-600" />
                  <span>Continuous Critical Care Drug Infusions</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Infusion pumps, syringe drivers, dilution, and dosage titrations
                </p>
              </div>
              <button
                onClick={() => alert('Drug order entry available via doctor portal')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                + New Infusion Order
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">DRUG NAME</th>
                    <th className="p-3">DOSE / DILUTION</th>
                    <th className="p-3">INFUSION RATE</th>
                    <th className="p-3">TITRATION</th>
                    <th className="p-3">ROUTE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">NURSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(store.infusions || []).filter(i => i.patientId === patientId).map(inf => (
                    <tr key={inf.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{inf.drugName}</td>
                      <td className="p-3">{inf.dose} ({inf.dilution})</td>
                      <td className="p-3 font-bold text-purple-700">{inf.rateMlHr} mL/hr</td>
                      <td className="p-3 font-semibold text-slate-800">{inf.doseRateMcgKgMin ? `${inf.doseRateMcgKgMin} mcg/kg/min` : '-'}</td>
                      <td className="p-3 text-slate-600">{inf.route}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {inf.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{inf.nurseName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 6: Investigation & Lab Reports */}
      {/* ============================================================ */}
      {activeSubTab === 'labs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText size={18} className="text-teal-600" />
              <span>Laboratory & Diagnostic Reports</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Stat blood gases, kidney function, CBC, electrolytes & cardiology investigations
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(store.labReports || []).filter(l => l.patientId === patientId).map(lab => (
                <div key={lab.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold">{lab.testCategory} Panel</span>
                    <span className="text-slate-400">{lab.dateTime}</span>
                  </div>
                  <div className="p-3 bg-white">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 text-[10px] uppercase">
                          <th className="pb-1 text-left">Parameter</th>
                          <th className="pb-1 text-center">Value</th>
                          <th className="pb-1 text-right">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lab.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 font-medium text-slate-700">{item.parameter}</td>
                            <td className="py-1.5 text-center">
                              <span className={cn(
                                'font-bold px-1.5 py-0.5 rounded text-[11px]',
                                item.flag === 'Critical' ? 'bg-red-100 text-red-700 font-extrabold' :
                                item.flag === 'High' ? 'bg-amber-100 text-amber-800' :
                                item.flag === 'Low' ? 'bg-blue-100 text-blue-800' :
                                'text-slate-800'
                              )}>
                                {item.value} {item.unit}
                              </span>
                            </td>
                            <td className="py-1.5 text-right text-slate-400 text-[10px]">{item.referenceRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {lab.findings && (
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <b>Clinical Impression:</b> {lab.findings}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 7: Clinical Calculators (GCS, NEWS2, SOFA) */}
      {/* ============================================================ */}
      {activeSubTab === 'calculators' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* GCS Calculator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Glasgow Coma Scale (GCS) Calculator</h3>
                <p className="text-xs text-slate-500">Neurological assessment score for traumatic brain injury & coma</p>
              </div>
              <span className="text-2xl font-black text-purple-700">{gcsEyes + gcsVerbal + gcsMotor} / 15</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Eye Opening Response (E: 1-4)</label>
              <select
                value={gcsEyes}
                onChange={e => setGcsEyes(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value={4}>4 - Spontaneous Eye Opening</option>
                <option value={3}>3 - Opens Eyes to Verbal Command</option>
                <option value={2}>2 - Opens Eyes to Painful Stimulus</option>
                <option value={1}>1 - No Eye Opening (None)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Best Verbal Response (V: 1-5)</label>
              <select
                value={gcsVerbal}
                onChange={e => setGcsVerbal(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value={5}>5 - Oriented and Conversing</option>
                <option value={4}>4 - Confused Conversation</option>
                <option value={3}>3 - Inappropriate Words</option>
                <option value={2}>2 - Incomprehensible Sounds</option>
                <option value={1}>1 - No Verbal Response (Intubated/None)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Best Motor Response (M: 1-6)</label>
              <select
                value={gcsMotor}
                onChange={e => setGcsMotor(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value={6}>6 - Obeys Commands for Movement</option>
                <option value={5}>5 - Localizes to Painful Stimulus</option>
                <option value={4}>4 - Normal Flexion / Withdrawal to Pain</option>
                <option value={3}>3 - Decorticate Posturing (Abnormal Flexion)</option>
                <option value={2}>2 - Decerebrate Posturing (Abnormal Extension)</option>
                <option value={1}>1 - No Motor Response (Flaccid)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <b>Result Interpretation:</b> {calculateGCS(gcsEyes, gcsVerbal, gcsMotor).interpretation}
            </div>
          </div>

          {/* NEWS2 & SOFA Score Calculators */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">NEWS2 & SOFA Risk Evaluation</h3>
              <p className="text-xs text-slate-500">National Early Warning Score & Sequential Organ Failure Assessment</p>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-teal-900 text-sm">NEWS2 Early Warning Score</span>
                <span className="text-xl font-black text-teal-800">8 (High Risk)</span>
              </div>
              <p className="text-teal-700">
                Trigger: Urgent medical review required. Intensivist bedside evaluation recommended.
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-900 text-sm">SOFA Organ Failure Score</span>
                <span className="text-xl font-black text-purple-800">9 / 24</span>
              </div>
              <p className="text-purple-700">
                Components: Respiration (3), Cardiovascular (3), Renal (1), Liver (1), CNS (1).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BEDSIDE ENTRY DRAWER / MODAL FOR RECORDING OBSERVATIONS */}
      {/* ============================================================ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bedside ICU Observation Entry — {selectedHour}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: {selectedPatient.name} ({selectedPatient.bed}) · Date: {activeDate}
                  </p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-sm font-bold text-slate-400 hover:text-slate-700">
                  ✕ Close
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                {/* Vitals Section */}
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  1. Vital Signs & Invasive Pressures
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">BP Systolic</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={form.bpSys || ''}
                      onChange={e => setForm(f => ({ ...f, bpSys: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">BP Diastolic</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={form.bpDia || ''}
                      onChange={e => setForm(f => ({ ...f, bpDia: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 78"
                      value={form.pulse || ''}
                      onChange={e => setForm(f => ({ ...f, pulse: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 98.6"
                      value={form.tempF || ''}
                      onChange={e => setForm(f => ({ ...f, tempF: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">SpO₂ (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 98"
                      value={form.spo2 || ''}
                      onChange={e => setForm(f => ({ ...f, spo2: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Resp Rate (/min)</label>
                    <input
                      type="number"
                      placeholder="e.g. 16"
                      value={form.rr || ''}
                      onChange={e => setForm(f => ({ ...f, rr: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">CVP (cmH₂O)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8"
                      value={form.cvp || ''}
                      onChange={e => setForm(f => ({ ...f, cvp: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">BSL (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 135"
                      value={form.bloodSugar || ''}
                      onChange={e => setForm(f => ({ ...f, bloodSugar: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Additional Monitoring */}
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] pt-2">
                  2. Rhythm, Sedation & Girth
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Heart Rhythm</label>
                    <input
                      type="text"
                      placeholder="e.g. Sinus"
                      value={form.heartRhythm}
                      onChange={e => setForm(f => ({ ...f, heartRhythm: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Sedation Score</label>
                    <input
                      type="text"
                      placeholder="e.g. 0 Alert"
                      value={form.sedationScore}
                      onChange={e => setForm(f => ({ ...f, sedationScore: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Abdominal Girth (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 84"
                      value={form.abdominalGirthCm || ''}
                      onChange={e => setForm(f => ({ ...f, abdominalGirthCm: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">POS / SUCT</label>
                    <input
                      type="text"
                      placeholder="e.g. Back / Oral"
                      value={form.positionSuction}
                      onChange={e => setForm(f => ({ ...f, positionSuction: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Intake & Output */}
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] pt-2">
                  3. Fluid Intake & Output (mL)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Hourly IV (mL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={form.hourlyIvIntake || ''}
                      onChange={e => setForm(f => ({ ...f, hourlyIvIntake: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Oral/RT Feed (mL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={form.oralRtAmount || ''}
                      onChange={e => setForm(f => ({ ...f, oralRtAmount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Hourly Urine (mL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={form.hourlyUrine || ''}
                      onChange={e => setForm(f => ({ ...f, hourlyUrine: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Drain - I (Chest Tube mL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={form.drain1Amount || ''}
                      onChange={e => setForm(f => ({ ...f, drain1Amount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Nursing Notes */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Clinical Observations & Interventions</label>
                  <textarea
                    rows={2}
                    value={form.nursingObservations}
                    onChange={e => setForm(f => ({ ...f, nursingObservations: e.target.value }))}
                    placeholder="Document ventilator synchrony, patient comfort, vasopressor response..."
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveObservation('Completed')}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Save & Update ICU Flow Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Brain icon helper for GCS
function BrainIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
    </svg>
  );
}
