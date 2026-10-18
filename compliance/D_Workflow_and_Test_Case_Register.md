# Deliverable D: Workflow and Test Case Register

**Scope:** All 16 user-supplied test cases + Code Blue emergency test case retained and validated.

| ID | Supplied Code | Area / Scope | Verified 5th Ed Code | Historical 4th Ed Equivalent | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-NABH-01** | `AAC.1` | Registration, triage, and admission workflow captured end-to-end | **AAC.2 & AAC.3.e** | AAC.1 & AAC.2 | Modal validates inputs, generates unique UHID and IPD, updates bed status to Occupied. | `Passed` |
| **TC-NABH-02** | `AAC.2` | Unique UHID and patient identification across every encounter | **AAC.2.b & AAC.2.c** | AAC.2.b | PatientBanner dynamically renders verified UHID, IPD No, Bed No, and diagnosis. | `Passed` |
| **TC-NABH-03** | `AAC.3` | Initial nursing and medical assessment within defined timeframe | **AAC.3.a, AAC.3.b, AAC.3.c, AAC.3.d** | AAC.4.a, AAC.4.b | NursingAssessmentTab calculates Morse (0-125), Braden (1-6), Caprini (0-11), MNA-SF (0-14) in real time. | `Passed` |
| **TC-NABH-04** | `AAC.4` | Reassessment and continuity-of-care notes throughout the stay | **AAC.4 & AAC.5** | AAC.5 & AAC.6 | NursingAssessmentTab type=reassessment renders previous risk benchmarks, compares vitals delta. | `Passed` |
| **TC-NABH-05** | `AAC.5` | Transfers, referrals, and care-team handover documented | **AAC.6 & COP.6.c** | AAC.3 & AAC.6 | PatientTransferTab implements complete SBAR sections, vital signs at handover, and dual sign-off. | `Passed` |
| **TC-NABH-06** | `COP.1` | Care plans, doctor orders, and progress notes on one record | **COP.1.a, COP.1.b, COP.1.c** | COP.1 & COP.2 | NursingCarePlanTab, NursingNotesTab, and RMOHandoverTab maintain unified chronological notes. | `Passed` |
| **TC-NABH-07** | `COP.3` | Vitals, intake/output, assessments, and eMAR | **COP.6.a, COP.6.b, MOM.8.a** | COP.2 / COP.3 | VitalSignsTab, IOChartTab, and MARTab log data with calculated 24h balances and status tags. | `Passed` |
| **TC-NABH-08** | `COP.4` | Emergency codes such as Blue, Red, and Yellow with response-time capture | **COP.5 & FMS.4** | COP.4 | HospitalHomePage and ICUDashboard feature live emergency response banner with triage counters. | `Partial` |
| **TC-NABH-09** | `COP.8` | OT safety checklist, anaesthesia, and operative notes | **COP.13 & COP.14** | COP.8 | PreOpChecklistTab contains planned surgery checklist with toggleable items and completion timestamp. | `Passed` |
| **TC-NABH-10** | `COP.13` | Discharge summary with templates and electronic signature | **AAC.7.a, AAC.7.b, AAC.7.c** | COP.13 | Discharge fitness, instructions, and post-discharge med reconciliation captured across tabs. | `Partial` |
| **TC-NABH-11** | `PRE.4` | Patient education and counselling records | **PRE.4.a, PRE.4.b, PRE.4.c, PRE.4.d** | PRE.4 | PatientCounsellingTab and FamilyEducationTab fully implement ASH/COU/1 fields, methods, outcomes, signatures. | `Passed` |
| **TC-NABH-12** | `PRE.5` | Feedback, grievance, and complaint workflow | **PRE.5.a, PRE.5.b, PRE.5.c** | PRE.5 | Grievance handling policy listed in ASH/COU/1 written material checklist; KPI #9 tracks grievance rate. | `Partial` |
| **TC-NABH-13** | `HIC.2` | Hand-hygiene and infection-control audits | **HIC.2.c & HIC.3.a** | HIC.2 | Hand hygiene education documented; Indicator #45 calculates live compliance percentage. | `Partial` |
| **TC-NABH-14** | `HIC.5` | Healthcare-associated infection (HAI) surveillance and tracking | **HIC.5.a, HIC.5.b, HIC.5.c** | HIC.5 | CatheterCareTab and BundleCareTab track insertion dates, safety checklists, complications. Indicators #29-32 compute rates. | `Passed` |
| **TC-NABH-15** | `HIC.8` | Biomedical waste segregation records | **HIC.8.a, HIC.8.b, HIC.8.c** | HIC.8 | BMW segregation instructions documented in Patient Guide Book; daily log tracked in facility register. | `Partial` |
| **TC-NABH-16** | `PSQ.3` | All 49 configured NABH KPI indicators calculated from live patient data | **PSQ.4.a, PSQ.4.b, PSQ.4.c** | PSQ.3 | NABH 49-KPI Engine calculates live values across all 49 metrics with numerator/denominator breakdown. | `Passed` |
| **TC-NABH-17** | `PSQ.6` | Falls, pressure-ulcer, and VTE risk scoring | **PSQ.2.a, PSQ.2.b, AAC.3.d** | PSQ.6 | NursingAssessmentTab executes calcFallRisk, calcPURisk, calcDVTRisk with dynamic score badges. | `Passed` |
