'use client';
import { useEMR } from '@/context/EMRContext';
import { Plus } from 'lucide-react';
import { TealButton } from '@/components/FormDrawer';

export function NursingCarePlanTab() {
  const { selectedPatient } = useEMR();

  const carePlanItems = [
    { problem: 'Altered blood glucose level related to insulin resistance', goal: 'Blood glucose within target range (80-180 mg/dL) within 24-48 hours', interventions: ['Monitor blood glucose q4h as per sliding scale', 'Administer insulin as prescribed', 'Monitor for signs/symptoms of hypoglycaemia and hyperglycaemia', 'Educate patient on diabetic diet', 'Encourage adequate hydration'], evaluation: 'Blood glucose 142 mg/dL at 14:00 — Goal partially met. Trend improving.', priority: 'High' },
    { problem: 'Risk for fall related to dizziness secondary to hypotension', goal: 'Patient will not fall during admission', interventions: ['Implement fall prevention protocol', 'Side rails up at all times when unattended', 'Call bell within reach', 'Non-slip footwear', 'Assist with ambulation', 'Monitor BP before and after position change'], evaluation: 'No fall events. Patient cooperative with fall precautions.', priority: 'Medium' },
    { problem: 'Deficient knowledge related to diabetes self-management', goal: 'Patient will verbalize understanding of diabetes management before discharge', interventions: ['Provide education on blood glucose monitoring', 'Teach insulin injection technique', 'Discuss dietary modifications', 'Provide written discharge instructions'], evaluation: 'Patient demonstrated return demonstration of blood glucose monitoring. Understanding confirmed.', priority: 'Low' },
  ];

  const priorityColor: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700">
        ℹ Demo care plan for <b>{selectedPatient?.name}</b>. In a full implementation, this would be generated dynamically from nursing assessment findings and linked to nursing diagnoses.
      </div>

      <div className="ncard">
        <div className="ncard-head">
          <h4 className="text-sm font-bold text-slate-800">Nursing Care Plan</h4>
          <TealButton onClick={() => {}} size="sm"><Plus size={14} /> Add Problem</TealButton>
        </div>
        <div className="ncard-body">
          <div className="space-y-4">
            {carePlanItems.map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-start gap-3 p-4 bg-slate-50 border-b border-slate-100">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-800">Nursing Problem / Diagnosis</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityColor[item.priority]}`}>{item.priority} Priority</span>
                    </div>
                    <p className="text-sm text-slate-700">{item.problem}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className="p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Goal / Expected Outcome</div>
                    <p className="text-sm text-slate-700">{item.goal}</p>
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Nursing Interventions</div>
                    <ul className="space-y-1">
                      {item.interventions.map((intv, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span> {intv}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Evaluation</div>
                    <p className="text-sm text-slate-700">{item.evaluation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
