# 🏥 Digital Nursing Care EMR System

An enterprise-grade, high-performance **Digital Nursing Care Electronic Medical Record (EMR)** application built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed specifically for inpatient wards, intensive care units (ICU/CCU), emergency departments, and specialty nursing workflows.

---

## 🌐 Live Demo & Deployment

- **Live URL**: *(Deployable via Vercel in 1 click)*
- **Demo Patients**: Pre-loaded with realistic clinical scenarios (ICU, Post-Op Surgical, General Ward).

---

## ✨ Key Clinical Modules & Features

### 1. 📋 Comprehensive Nursing Assessments
- **Initial Nursing Assessment**: Comprehensive admission workflow covering Chief Complaints (with Intensity, Duration, Action Taken), Systemic Review, and General Physical Exams.
- **Integrated Risk Scoring**:
  - **Morse Fall Scale** with automatic risk level classification (Low / Medium / High).
  - **Braden Scale** for Pressure Ulcer risk prediction.
  - **Caprini DVT Risk Assessment** with automated scoring and stratification.
- **Integrated Mini Nutritional Assessment (MNA®-SF)**: Screening score calculated automatically from food intake, weight loss, mobility, neuropsychological stress, and BMI.
- **Daycare & Emergency Assessment**: Rapid triage, trauma evaluation, and pain management tracking.

### 2. 🫁 Critical Care, ICU/CCU & Devices
- **ICU / CCU Flowsheet**: Hourly vital signs, GCS, level of consciousness, ventilator parameters (Mode, FiO₂, PEEP), continuous medication infusions, and doctor escalation flags.
- **Intake / Output (I/O) Chart**: Standalone fluid balance management with 24-hour balance calculation and automatic reflection into the ICU/CCU flowsheet.
- **Urinary Catheter Care**: Comprehensive catheter insertion, position tracking (Inside/Outside), patency checks, safety checklists, complications (UTI, leakage, blockage), and removal documentation.
- **Care Bundle Checklist**: 4 specialized clinical bundles with device/tube tracking:
  - Urinary Catheter Care
  - Central Catheter Care
  - Critical Care
  - Ventilator Care
- **Phlebitis Assessment (VIP Scale)**: Visual Infusion Phlebitis assessment covering Grade 0 (no phlebitis) to Grade 5 (severe thrombophlebitis with systemic symptoms), including Cannula insertion and removal date/times.
- **Pressure Ulcer Assessment**: Staging (Stage I to IV, Unstageable, DTI), timing classification (*Before Admission* vs *After Admission*), and healing progression tracking.

### 3. 💊 Medication & Safety Handover
- **Home Medications (Own Medication)**: Verified reconciliation of patient home medications upon admission.
- **Valuable Items Handover**: Secure tracking of patient belongings with Nurse Signature and Receiver Signature.
- **Shift & RMO Handover (SBAR)**: Structured clinical handover adhering to SBAR (Situation, Background, Assessment, Recommendation).
- **Form Master & Field Master**: Dynamic form engine allowing customization of clinical forms and field definitions without code alteration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS & Modern Clinical UI Design System |
| **Icons** | Lucide React |
| **State Management** | React Context + LocalStorage Persistence with Full Seed Data |
| **Architecture** | Component-Driven, Modular Drawer Forms, Master-Detail Flow |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repository-url>

# Navigate to directory
cd emr

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build

```bash
# Run type check and build
npm run build

# Start production server
npm start
```

---

## ☁️ 1-Click Deployment to Vercel (For Live Demo Link)

To get a live website link (`https://your-emr-project.vercel.app`) for recruiters or portfolios:

1. Push this repository to your **GitHub** account.
2. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
3. Click **"Add New Project"** and select this repository.
4. Keep the default settings (Framework: Next.js) and click **"Deploy"**.
5. Your live URL will be active immediately with SSL!

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for portfolio and demonstration purposes.
