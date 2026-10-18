'use client';

import { useEMR } from '@/context/EMRContext';
import { PatientBanner } from './PatientBanner';
import { NursingAssessmentTab } from './tabs/NursingAssessmentTab';
import { PatientCounsellingTab } from './tabs/PatientCounsellingTab';
import { VitalSignsTab } from './tabs/VitalSignsTab';
import { IOChartTab } from './tabs/IOChartTab';
import { NursingNotesTab } from './tabs/NursingNotesTab';
import { PressureUlcerTab } from './tabs/PressureUlcerTab';
import { CatheterCareTab } from './tabs/CatheterCareTab';
import { BundleCareTab } from './tabs/BundleCareTab';
import { PatientTransferTab } from './tabs/PatientTransferTab';
import { PreOpChecklistTab } from './tabs/PreOpChecklistTab';
import { ValuablesTab } from './tabs/ValuablesTab';
import { EmergencyAssessmentTab } from './tabs/EmergencyAssessmentTab';
import { DaycareAssessmentTab } from './tabs/DaycareAssessmentTab';
import { RMOHandoverTab } from './tabs/RMOHandoverTab';
import { ShiftHandoverTab } from './tabs/ShiftHandoverTab';
import { PhysiotherapyTab } from './tabs/PhysiotherapyTab';
import { MedReconciliationTab } from './tabs/MedReconciliationTab';
import { OwnMedicationsTab } from './tabs/OwnMedicationsTab';
import { ICUChartTab } from './tabs/ICUChartTab';
import { DiabeticChartTab } from './tabs/DiabeticChartTab';
import { PhlebitisTab } from './tabs/PhlebitisTab';
import { MiniNutritionTab } from './tabs/MiniNutritionTab';
import { NursingCarePlanTab } from './tabs/NursingCarePlanTab';
import { FamilyEducationTab } from './tabs/FamilyEducationTab';
import { MARTab } from './tabs/MARTab';
import { FormMasterTab } from './tabs/FormMasterTab';
import { FieldMasterTab } from './tabs/FieldMasterTab';

interface NursingWorkspaceProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NursingWorkspace({ activeTab }: NursingWorkspaceProps) {
  const { selectedPatient } = useEMR();

  if (!selectedPatient) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'initial-assessment': return <NursingAssessmentTab type="initial" />;
      case 'counselling-form': return <PatientCounsellingTab />;
      case 'reassessment': return <NursingAssessmentTab type="reassessment" />;
      case 'final-assessment': return <NursingAssessmentTab type="final" />;
      case 'emergency-assessment': return <EmergencyAssessmentTab />;
      case 'daycare-assessment': return <DaycareAssessmentTab />;
      case 'vital-signs': return <VitalSignsTab />;
      case 'io-chart': return <IOChartTab />;
      case 'icu-chart': return <ICUChartTab />;
      case 'diabetic-chart': return <DiabeticChartTab />;
      case 'nursing-notes': return <NursingNotesTab />;
      case 'care-plan': return <NursingCarePlanTab />;
      case 'family-education': return <FamilyEducationTab />;
      case 'mar': return <MARTab />;
      case 'pressure-ulcer': return <PressureUlcerTab />;
      case 'catheter-care': return <CatheterCareTab />;
      case 'bundle-care': return <BundleCareTab />;
      case 'phlebitis': return <PhlebitisTab />;
      case 'mini-nutrition': return <MiniNutritionTab />;
      case 'pre-op': return <PreOpChecklistTab />;
      case 'patient-transfer': return <PatientTransferTab />;
      case 'valuables': return <ValuablesTab />;
      case 'shift-handover': return <ShiftHandoverTab />;
      case 'rmo-handover': return <RMOHandoverTab />;
      case 'physio-assessment': return <PhysiotherapyTab type="assessment" />;
      case 'physio-sessions': return <PhysiotherapyTab type="sessions" />;
      case 'med-reconciliation': return <MedReconciliationTab />;
      case 'own-medications': return <OwnMedicationsTab />;
      case 'form-master': return <FormMasterTab />;
      case 'field-master': return <FieldMasterTab />;
      default: return <NursingAssessmentTab type="initial" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PatientBanner patient={selectedPatient} activeTab={activeTab} />
      <div className="flex-1 overflow-y-auto p-4">
        {renderTab()}
      </div>
    </div>
  );
}
