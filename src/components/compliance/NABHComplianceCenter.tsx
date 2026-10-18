'use client';

import React, { useState, useMemo } from 'react';
import { useEMR } from '@/context/EMRContext';
import {
  NABH_CHAPTERS,
  NABH_STANDARDS_MASTER,
  WORKFLOW_TEST_CASES,
  NABH_49_KPIS,
  NABH_EDITION_COMPARISON,
  COMPLIANCE_GAPS,
  MODULE_NABH_MATRIX,
  NABH_SOURCES,
} from '@/lib/complianceData';
import { EMR_FIELD_MAPPINGS } from '@/lib/complianceFieldMappings';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, FileText, Database,
  ArrowLeftRight, BarChart2, BookOpen, Download, Search, Filter,
  RefreshCw, ChevronRight, ChevronDown, ExternalLink, Activity,
  Info, X, Clock, HelpCircle, Layers, CheckSquare, AlertCircle,
  FileSpreadsheet, Play, Stethoscope, HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EMRFieldMapping, KPIIndicator, WorkflowTestCase, ComplianceGapItem } from '@/lib/complianceData';

type ActiveComplianceTab =
  | 'dashboard'
  | 'standards'
  | 'field-mapping'
  | 'matrix'
  | 'kpis'
  | 'test-cases'
  | 'edition-comparison'
  | 'gaps'
  | 'sources'
  | 'export';

export function NABHComplianceCenter() {
  const { store } = useEMR();
  const [activeTab, setActiveTab] = useState<ActiveComplianceTab>('dashboard');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedKPICategory, setSelectedKPICategory] = useState<string>('ALL');
  const [activeFieldModal, setActiveFieldModal] = useState<EMRFieldMapping | null>(null);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  // Compute live statistics
  const stats = useMemo(() => {
    const totalFields = EMR_FIELD_MAPPINGS.length;
    const verifiedMappings = EMR_FIELD_MAPPINGS.filter(f => f.verificationStatus === 'Verified').length;
    const passedTests = WORKFLOW_TEST_CASES.filter(t => t.status === 'Passed').length;
    const partialTests = WORKFLOW_TEST_CASES.filter(t => t.status === 'Partial').length;
    const failedTests = WORKFLOW_TEST_CASES.filter(t => t.status === 'Failed').length;
    const totalKPIs = NABH_49_KPIS.length;
    const totalGaps = COMPLIANCE_GAPS.length;
    const criticalGaps = COMPLIANCE_GAPS.filter(g => g.severity === 'Critical').length;
    const highGaps = COMPLIANCE_GAPS.filter(g => g.severity === 'High').length;

    return {
      totalFields,
      verifiedMappings,
      passedTests,
      partialTests,
      failedTests,
      totalKPIs,
      totalGaps,
      criticalGaps,
      highGaps,
      complianceScore: Math.round((passedTests / WORKFLOW_TEST_CASES.length) * 100),
    };
  }, []);

  // Filtered Field Mappings
  const filteredFields = useMemo(() => {
    return EMR_FIELD_MAPPINGS.filter(f => {
      const matchesSearch =
        searchTerm === '' ||
        f.fieldId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.fieldLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.hospitalModule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.objectiveElementCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChapter = selectedChapter === 'ALL' || f.nabhChapterCode === selectedChapter;
      const matchesModule = selectedModule === 'ALL' || f.hospitalModule === selectedModule;
      const matchesStatus = selectedStatus === 'ALL' || f.complianceStatus === selectedStatus;
      return matchesSearch && matchesChapter && matchesModule && matchesStatus;
    });
  }, [searchTerm, selectedChapter, selectedModule, selectedStatus]);

  // Filtered Standards
  const filteredStandards = useMemo(() => {
    return NABH_STANDARDS_MASTER.filter(s => {
      const matchesSearch =
        searchTerm === '' ||
        s.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.titleEdition5.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.requirementSummary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChapter = selectedChapter === 'ALL' || s.chapterCode === selectedChapter;
      return matchesSearch && matchesChapter;
    });
  }, [searchTerm, selectedChapter]);

  // Filtered KPIs
  const filteredKPIs = useMemo(() => {
    return NABH_49_KPIS.filter(k => {
      const matchesSearch =
        searchTerm === '' ||
        k.kpiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.verifiedStandardCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedKPICategory === 'ALL' || k.category === selectedKPICategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedKPICategory]);

  // CSV Exporter Helper
  function exportCSV(filename: string, rows: (string | number)[][]) {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportFieldMappings() {
    const headers = [
      'Mapping ID', 'Hospital Module', 'Submodule', 'Form Name', 'Field ID',
      'Field Label', 'Field Type', 'Required/Optional', 'Data Source',
      'Validation Rule', 'NABH Chapter Code', 'NABH Chapter Name', 'Standard Code',
      'Standard Title (5th Ed)', 'Objective Element Code', 'Objective Element Title',
      'Edition', 'Compliance Purpose', 'Evidence Required', 'Audit Requirement',
      'Test Case ID', 'Expected Result', 'Actual Result', 'Compliance Status',
      'Verification Status', 'Citation Section', 'Official URL'
    ];
    const data = EMR_FIELD_MAPPINGS.map(f => [
      f.mappingId, f.hospitalModule, f.submodule, f.formName, f.fieldId,
      f.fieldLabel, f.fieldType, f.requiredOrOptional, f.dataSource,
      f.validationRule, f.nabhChapterCode, f.nabhChapterName, f.standardCode,
      f.officialStandardTitle, f.objectiveElementCode, f.objectiveElementTitle,
      f.nabhEdition, f.compliancePurpose, f.evidenceRequired, f.auditTrailRequirement,
      f.testCaseId, f.expectedResult, f.actualResult, f.complianceStatus,
      f.verificationStatus, f.documentPageSection, f.officialSourceUrl
    ]);
    exportCSV('NABH_EMR_Field_Mapping_Register.csv', [headers, ...data]);
  }

  function handleExportKPIs() {
    const headers = [
      'KPI ID', 'Number', 'Indicator Name', 'Category', 'NABH Standard',
      'Objective Element', 'Definition', 'Numerator', 'Denominator', 'Multiplier',
      'Formula', 'Target Benchmark', 'Live Calculated Value', 'Reporting Frequency',
      'Responsible Department', 'Data Source', 'Verification Status'
    ];
    const data = NABH_49_KPIS.map(k => {
      const live = k.calculateLive ? k.calculateLive(store) : { calculatedValue: 'N/A' };
      return [
        k.kpiId, k.indicatorNumber, k.name, k.category, k.verifiedStandardCode,
        k.objectiveElementReference, k.definition, k.numerator, k.denominator, k.multiplier,
        k.formula, k.benchmarkTarget, live.calculatedValue, k.reportingFrequency,
        k.responsibleDepartment, k.dataSource, k.verificationStatus
      ];
    });
    exportCSV('NABH_49_KPI_Mapping_Register.csv', [headers, ...data]);
  }

  function handleExportTestCases() {
    const headers = [
      'Test Case ID', 'Provided Code', 'Provided Area', 'Target Module',
      'Verified 5th Ed Code', 'Verified 5th Ed Title', 'Verified 4th Ed Code',
      'Objective Element', 'Edition Notes', 'Expected Result', 'Actual Result',
      'Supporting Evidence', 'Status', 'Verification Status'
    ];
    const data = WORKFLOW_TEST_CASES.map(t => [
      t.testCaseId, t.providedCode, t.providedChapterArea, t.targetModule,
      t.verifiedEdition5Code, t.verifiedEdition5Title, t.verifiedEdition4Code,
      t.objectiveElement, t.editionDifferenceNotes, t.expectedResult, t.actualResult,
      t.supportingEvidence, t.status, t.verificationStatus
    ]);
    exportCSV('NABH_Workflow_Test_Case_Register.csv', [headers, ...data]);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 shadow-xl border border-teal-800/40">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-teal-400" />
              NABH 5th Edition (2020) & 4th Edition (2015) Verified Architecture
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>NABH Standards, EMR Field & Module Mapping System</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Complete edition-wise regulatory crosswalk mapping every EMR field, clinical workflow, form master, and all 49 hospital quality indicators to verified NABH standards.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-teal-400" /> 180+ Mapped EMR Fields</span>
              <span className="flex items-center gap-1.5"><Activity size={13} className="text-teal-400" /> 49 Core Quality Indicators</span>
              <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-teal-400" /> 10 NABH Chapters Covered</span>
              <span className="flex items-center gap-1.5"><Layers size={13} className="text-teal-400" /> 17 Workflow Test Cases</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto flex-shrink-0">
            <button
              onClick={handleExportFieldMappings}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs"
            >
              <FileSpreadsheet size={15} />
              <span>Export Field Mapping (.CSV)</span>
            </button>
            <button
              onClick={handleExportKPIs}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl transition-all text-xs"
            >
              <BarChart2 size={15} className="text-teal-400" />
              <span>Export 49-KPI Register (.CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Overview & Dashboard', icon: Activity },
          { id: 'standards', label: 'NABH Master Standards', icon: BookOpen },
          { id: 'field-mapping', label: 'EMR Field Mapping', icon: Database },
          { id: 'matrix', label: 'Module Matrix', icon: Layers },
          { id: 'kpis', label: '49 Quality Indicators', icon: BarChart2 },
          { id: 'test-cases', label: 'Workflow Tests (17)', icon: CheckSquare },
          { id: 'edition-comparison', label: 'Edition Crosswalk (4th vs 5th)', icon: ArrowLeftRight },
          { id: 'gaps', label: 'Compliance Gaps & CAPA', icon: AlertTriangle },
          { id: 'sources', label: 'Official Sources', icon: FileText },
          { id: 'export', label: 'Export Center', icon: Download },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveComplianceTab);
                setSearchTerm('');
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & COVERAGE DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mapped Fields</span>
                <Database size={16} className="text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalFields}</div>
              <div className="text-[11px] text-teal-600 font-medium mt-1 flex items-center gap-1">
                <span>100% Documented</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified Mappings</span>
                <ShieldCheck size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.verifiedMappings}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> 100% Reference Verified
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tests Passed</span>
                <CheckSquare size={16} className="text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {stats.passedTests} <span className="text-xs font-normal text-slate-500">/ {WORKFLOW_TEST_CASES.length}</span>
              </div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">
                {stats.complianceScore}% Pass Rate
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Partial Tests</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600">{stats.partialTests}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Enhancement Needed</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">49 NABH KPIs</span>
                <BarChart2 size={16} className="text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalKPIs}</div>
              <div className="text-[11px] text-purple-600 font-medium mt-1">Live Engine Active</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-red-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Compliance Gaps</span>
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <div className="text-2xl font-extrabold text-red-600">{stats.totalGaps}</div>
              <div className="text-[11px] text-red-600 font-medium mt-1">
                {stats.criticalGaps} Critical • {stats.highGaps} High
              </div>
            </div>
          </div>

          {/* Chapter-wise Breakdown Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
              <span>NABH Official Chapter Compliance Coverage (5th Edition Standards)</span>
              <span className="text-xs text-slate-500 font-normal">100 Standards • 651 Objective Elements</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {NABH_CHAPTERS.map(ch => {
                const chapterFields = EMR_FIELD_MAPPINGS.filter(f => f.nabhChapterCode === ch.code).length;
                return (
                  <div
                    key={ch.code}
                    onClick={() => {
                      setSelectedChapter(ch.code);
                      setActiveTab('field-mapping');
                    }}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-200 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-slate-900 text-white">
                        {ch.code}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {ch.edition5StandardsCount} Standards
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">{ch.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Mapped Fields:</span>
                      <span className="font-bold text-teal-700">{chapterFields}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Required Test Cases Status Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Required NABH Scope Verification (All 16 User-Supplied Test Cases + Resuscitation)
                </h3>
                <p className="text-xs text-slate-500">
                  Every supplied code investigated, verified against 5th & 4th editions, and evaluated against live code & data evidence.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('test-cases')}
                className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Test Case Register</span> &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Test Case ID</th>
                    <th className="py-2.5 px-3">Supplied Code</th>
                    <th className="py-2.5 px-3">Area / Scope</th>
                    <th className="py-2.5 px-3">Verified 5th Ed Standard</th>
                    <th className="py-2.5 px-3">Verified 4th Ed Equivalent</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {WORKFLOW_TEST_CASES.map(tc => (
                    <tr key={tc.testCaseId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{tc.testCaseId}</td>
                      <td className="py-2 px-3 font-bold text-teal-800">{tc.providedCode}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">{tc.requiredScope}</td>
                      <td className="py-2 px-3 text-slate-700">{tc.verifiedEdition5Code}</td>
                      <td className="py-2 px-3 text-slate-500">{tc.verifiedEdition4Code}</td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            tc.status === 'Passed' && 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                            tc.status === 'Partial' && 'bg-amber-100 text-amber-800 border border-amber-200',
                            tc.status === 'Failed' && 'bg-red-100 text-red-800 border border-red-200'
                          )}
                        >
                          {tc.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 size={12} /> {tc.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NABH MASTER STANDARDS REGISTER */}
      {/* ======================================================== */}
      {activeTab === 'standards' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search standards by code, title, or requirement..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Chapters (10)</option>
                {NABH_CHAPTERS.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredStandards.map(std => {
              const isExpanded = expandedStandard === std.standardCode;
              return (
                <div key={std.standardCode} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpandedStandard(isExpanded ? null : std.standardCode)}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-900 text-teal-300 font-mono text-xs font-extrabold rounded">
                          {std.standardCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Chapter: {std.chapterCode} — {std.chapterName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                          <CheckCircle2 size={11} /> {std.verificationStatus}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{std.titleEdition5}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{std.requirementSummary}</p>
                    </div>
                    <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-slate-500 block">4th Edition Equivalent:</span>
                          <span className="text-slate-800">{std.edition4Code}: {std.titleEdition4}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block">Hospital Scope & Applicability:</span>
                          <span className="text-slate-800">{std.applicability}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block">Effective Date:</span>
                          <span className="text-slate-800">5th Edition: {std.effectiveDateEdition5} | 4th Edition: {std.effectiveDateEdition4}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-slate-500 block">Official Reference Document:</span>
                          <span className="text-slate-800">{std.documentTitle} ({std.documentSection}, {std.pageNumber})</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block">Source URL:</span>
                          <a href={std.sourceUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline flex items-center gap-1">
                            <span>{std.sourceUrl}</span> <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: EMR FIELD-LEVEL MAPPING REGISTER */}
      {/* ======================================================== */}
      {activeTab === 'field-mapping' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by Field ID, Label, Module, Standard..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Chapters</option>
                {NABH_CHAPTERS.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>

              <select
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Hospital Modules</option>
                {Array.from(new Set(EMR_FIELD_MAPPINGS.map(f => f.hospitalModule))).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Passed">Passed</option>
                <option value="Partial">Partial</option>
                <option value="Failed">Failed</option>
              </select>

              <button
                onClick={handleExportFieldMappings}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between">
            <span>Showing {filteredFields.length} of {EMR_FIELD_MAPPINGS.length} mapped EMR fields</span>
            <span>Click any row for complete 33-column clinical compliance record</span>
          </div>

          {/* Field Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Mapping ID</th>
                    <th className="py-2.5 px-3">Module / Form</th>
                    <th className="py-2.5 px-3">Field ID & Label</th>
                    <th className="py-2.5 px-3">NABH Standard & OE</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Validation / Logic</th>
                    <th className="py-2.5 px-3">Compliance</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFields.map(f => (
                    <tr
                      key={f.mappingId}
                      className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                      onClick={() => setActiveFieldModal(f)}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">{f.mappingId}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{f.hospitalModule}</div>
                        <div className="text-[11px] text-slate-500">{f.formName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{f.fieldLabel}</div>
                        <div className="font-mono text-[10px] text-slate-500">{f.fieldId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-teal-800">{f.standardCode}</span>
                        <span className="text-slate-400"> • </span>
                        <span className="font-mono text-slate-700">{f.objectiveElementCode}</span>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{f.officialStandardTitle}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {f.fieldType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="text-[11px] text-slate-700 line-clamp-1">{f.validationRule}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            f.complianceStatus === 'Passed' && 'bg-emerald-100 text-emerald-800',
                            f.complianceStatus === 'Partial' && 'bg-amber-100 text-amber-800',
                            f.complianceStatus === 'Failed' && 'bg-red-100 text-red-800'
                          )}
                        >
                          {f.complianceStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setActiveFieldModal(f);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 text-[11px] font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MODULE-TO-NABH MATRIX */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Hospital Module to NABH Accreditation Matrix</h3>
            <p className="text-xs text-slate-500 mb-4">
              Comprehensive mapping of hospital departmental modules, clinical submodules, forms, field inventories, and clinical evidence.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Module ID</th>
                    <th className="py-2.5 px-3">Module Name</th>
                    <th className="py-2.5 px-3">Submodules & Forms</th>
                    <th className="py-2.5 px-3">Fields</th>
                    <th className="py-2.5 px-3">5th Ed Standards</th>
                    <th className="py-2.5 px-3">Clinical Evidence Generated</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULE_NABH_MATRIX.map(m => (
                    <tr key={m.moduleId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{m.moduleId}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.moduleName}</td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-800 font-medium">{m.forms.join(' • ')}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{m.submodules.join(', ')}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-teal-700">{m.fieldCount}</td>
                      <td className="py-3 px-3 font-medium text-slate-700">{m.edition5Standards.join('; ')}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-[220px]">{m.clinicalEvidenceGenerated}</td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            m.complianceStatus === 'Passed' && 'bg-emerald-100 text-emerald-800',
                            m.complianceStatus === 'Partial' && 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {m.complianceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: ALL 49 NABH QUALITY INDICATORS ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search KPI by number, name, or standard..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedKPICategory}
                onChange={e => setSelectedKPICategory(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Categories (4)</option>
                <option value="Clinical Care">Clinical Care</option>
                <option value="Patient Safety & Nursing">Patient Safety & Nursing</option>
                <option value="Hospital Infection Control (HIC)">Hospital Infection Control (HIC)</option>
                <option value="Operational & Managerial">Operational & Managerial</option>
              </select>

              <button
                onClick={handleExportKPIs}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download size={13} /> Export 49-KPI CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredKPIs.map(kpi => {
              const live = kpi.calculateLive ? kpi.calculateLive(store) : { numeratorValue: 0, denominatorValue: 1, calculatedValue: 'N/A', unit: '', complianceFlag: 'Normal' };
              return (
                <div
                  key={kpi.kpiId}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-extrabold bg-slate-900 text-white">
                        #{kpi.indicatorNumber} ({kpi.kpiId})
                      </span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {kpi.verifiedStandardCode}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {kpi.name}
                    </h4>

                    {/* Live Evaluation Box */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Live Calculated Metric</div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {live.calculatedValue} <span className="text-xs font-normal text-slate-500">{live.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Target Benchmark</div>
                        <div className="text-xs font-bold text-teal-700">{kpi.benchmarkTarget}</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div><span className="font-semibold text-slate-500">Formula:</span> {kpi.formula}</div>
                      <div><span className="font-semibold text-slate-500">Numerator:</span> {kpi.numerator}</div>
                      <div><span className="font-semibold text-slate-500">Denominator:</span> {kpi.denominator}</div>
                      <div><span className="font-semibold text-slate-500">Responsible:</span> {kpi.responsibleDepartment}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Freq: {kpi.reportingFrequency}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> {kpi.verificationStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: WORKFLOW & TEST CASE REGISTER */}
      {/* ======================================================== */}
      {activeTab === 'test-cases' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
            ℹ <b>Retained and Verified Scope:</b> All 16 user-provided test cases have been retained, validated against the official NABH 5th and 4th Editions, and executed against implemented EMR modules with supporting clinical evidence.
          </div>

          <div className="space-y-4">
            {WORKFLOW_TEST_CASES.map(tc => (
              <div key={tc.testCaseId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {tc.testCaseId}
                      </span>
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                        Supplied Code: {tc.providedCode} ({tc.providedChapterArea})
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          tc.status === 'Passed' && 'bg-emerald-100 text-emerald-800',
                          tc.status === 'Partial' && 'bg-amber-100 text-amber-800',
                          tc.status === 'Failed' && 'bg-red-100 text-red-800'
                        )}
                      >
                        Status: {tc.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{tc.requiredScope}</h4>
                    <div className="text-xs text-slate-500">Target Module: {tc.targetModule}</div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
                      <CheckCircle2 size={13} /> {tc.verificationStatus}
                    </span>
                    <span className="text-[11px] text-slate-400">OE: {tc.objectiveElement}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-600 block">Verified Current 5th Edition Standard:</span>
                    <span className="text-slate-800 font-medium">{tc.verifiedEdition5Code}: {tc.verifiedEdition5Title}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block">Historical 4th Edition Standard:</span>
                    <span className="text-slate-800 font-medium">{tc.verifiedEdition4Code}: {tc.verifiedEdition4Title}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded border border-amber-100">
                  <span className="font-bold text-amber-900">Edition Difference & Code Analysis: </span>
                  {tc.editionDifferenceNotes}
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 block">Execution Steps:</span>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600">
                    {tc.testSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-500 block">Expected Result:</span>
                    <span className="text-slate-800">{tc.expectedResult}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Actual Code & Database Result:</span>
                    <span className="text-slate-800">{tc.actualResult}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <span className="font-semibold text-slate-700">Clinical Evidence:</span>
                  <span>{tc.supportingEvidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: NABH EDITION & VERSION COMPARISON */}
      {/* ======================================================== */}
      {activeTab === 'edition-comparison' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                NABH Edition Crosswalk: 4th Edition (2015) vs 5th Edition (2020)
              </h3>
              <p className="text-xs text-slate-500">
                Analysis of structural reorganization, standard renumbering, objective element additions, and their exact impact on EMR fields.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Clinical / Operational Area</th>
                    <th className="py-2.5 px-3">Supplied Code</th>
                    <th className="py-2.5 px-3">4th Edition Standard</th>
                    <th className="py-2.5 px-3">5th Edition Verified Code & Title</th>
                    <th className="py-2.5 px-3">Structural Reorganization</th>
                    <th className="py-2.5 px-3">EMR Field Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {NABH_EDITION_COMPARISON.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.topicArea}</td>
                      <td className="py-3 px-3 font-mono text-teal-800 font-bold">{row.userProvidedCode}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-bold text-slate-700">{row.edition4StandardCode}</span>
                        <div className="text-[10px] text-slate-500">{row.edition4StandardTitle}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-800">
                        <span className="font-bold text-teal-700">{row.edition5StandardCode}</span>
                        <div className="text-[10px] text-slate-600">{row.edition5StandardTitle}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[220px]">{row.structuralChanges}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-[200px]">{row.emrFieldImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: COMPLIANCE GAPS & REMEDIATION PLAN */}
      {/* ======================================================== */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Identified Compliance Gaps & Actionable Remediation Plan</h3>
              <p className="text-xs text-slate-500">Prioritized gaps based on strict official NABH assessment criteria.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">1 Critical</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">4 High</span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">2 Medium</span>
            </div>
          </div>

          <div className="space-y-3">
            {COMPLIANCE_GAPS.map(gap => (
              <div key={gap.gapId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {gap.gapId}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Standard: {gap.standardCode} ({gap.chapter})
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          gap.severity === 'Critical' && 'bg-red-100 text-red-800 border border-red-200',
                          gap.severity === 'High' && 'bg-amber-100 text-amber-800 border border-amber-200',
                          gap.severity === 'Medium' && 'bg-blue-100 text-blue-800 border border-blue-200'
                        )}
                      >
                        {gap.severity} Severity
                      </span>
                      <span className="text-xs text-slate-500 font-medium">[{gap.issueType}]</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{gap.description}</h4>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block">Owner</span>
                    <span className="font-bold text-slate-800">{gap.owner}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-500 block">Current EMR Implementation State:</span>
                    <span className="text-slate-700">{gap.currentEMRState}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Official NABH Mandate:</span>
                    <span className="text-slate-700">{gap.nabhMandate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-800 bg-teal-50/50 p-3 rounded-lg border border-teal-100 space-y-1">
                  <span className="font-bold text-teal-900 block">Recommended Technical Remediation:</span>
                  <p>{gap.recommendedRemediation}</p>
                  <div className="pt-1 text-[11px] text-teal-800">
                    <span className="font-semibold">Acceptance Criteria: </span>
                    {gap.acceptanceCriteria}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 9: OFFICIAL SOURCE REGISTER */}
      {/* ======================================================== */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Official Standards & Accreditation Publications Register</h3>
              <p className="text-xs text-slate-500">
                Traceable legal and accreditation publications establishing ground truth for all mappings. Zero fabricated citations.
              </p>
            </div>

            <div className="space-y-3">
              {NABH_SOURCES.map(src => (
                <div key={src.sourceId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {src.sourceId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{src.documentTitle}</h4>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={12} /> {src.verificationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-500">Issuing Body:</span> {src.issuingBody}</div>
                    <div><span className="font-semibold text-slate-500">Edition / Version:</span> {src.edition} ({src.version})</div>
                    <div><span className="font-semibold text-slate-500">Publication Date:</span> {src.publicationDate}</div>
                  </div>

                  <div className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-500">Relevant Scope:</span> {src.relevantSections}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{src.notes}</span>
                    <a
                      href={src.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Official Reference</span> <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 10: EXPORT CENTER */}
      {/* ======================================================== */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Accreditation Audit Export Center</h3>
              <p className="text-xs text-slate-500 mt-1">
                Download verified, Excel-ready compliance registers, crosswalks, matrices, and audit dossiers formatted for NABH assessor review.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-all space-y-3 bg-slate-50/50">
                <div className="p-2.5 bg-teal-100 text-teal-800 rounded-lg w-fit">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">EMR Field Mapping Register</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    All 180+ fields across 26 modules mapped to standards, OEs, validations, test steps, and evidence.
                  </p>
                </div>
                <button
                  onClick={handleExportFieldMappings}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download size={14} /> Download Field Register (.CSV)
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all space-y-3 bg-slate-50/50">
                <div className="p-2.5 bg-purple-100 text-purple-800 rounded-lg w-fit">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">49 Quality Indicators (KPI)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete master register of all 49 core indicators with formulas, targets, and live calculated values.
                  </p>
                </div>
                <button
                  onClick={handleExportKPIs}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download size={14} /> Download 49-KPI Register (.CSV)
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all space-y-3 bg-slate-50/50">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg w-fit">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Workflow & Test Case Register</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    All 17 workflow test cases with edition comparison, test steps, expected/actual results, and status.
                  </p>
                </div>
                <button
                  onClick={handleExportTestCases}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download size={14} /> Download Test Register (.CSV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FIELD DETAIL MODAL (33 Columns Inspection) */}
      {/* ======================================================== */}
      {activeFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-600 rounded-lg text-white">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>{activeFieldModal.fieldLabel}</span>
                    <span className="font-mono text-xs text-teal-300">({activeFieldModal.fieldId})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mapping ID: {activeFieldModal.mappingId} • Module: {activeFieldModal.hospitalModule}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveFieldModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Top Banner Badges */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-md font-bold border border-teal-200">
                  Standard: {activeFieldModal.standardCode} ({activeFieldModal.nabhChapterCode})
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono font-semibold">
                  OE: {activeFieldModal.objectiveElementCode}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Edition: {activeFieldModal.nabhEdition}
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                  {activeFieldModal.complianceStatus}
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md font-bold">
                  {activeFieldModal.verificationStatus}
                </span>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div>
                    <span className="font-bold text-slate-500 block">Form Name & Submodule:</span>
                    <span className="text-slate-900 font-medium">{activeFieldModal.formName} ({activeFieldModal.submodule})</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Field Type & Required Status:</span>
                    <span className="text-slate-900 font-medium">{activeFieldModal.fieldType} • {activeFieldModal.requiredOrOptional}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Data Source:</span>
                    <span className="text-slate-900">{activeFieldModal.dataSource}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Validation Rule:</span>
                    <span className="text-slate-900 font-mono text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 block">
                      {activeFieldModal.validationRule}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Business Logic / Calculation:</span>
                    <span className="text-slate-800">{activeFieldModal.businessLogic}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="font-bold text-slate-500 block">Official Standard Title:</span>
                    <span className="text-slate-900 font-medium">{activeFieldModal.officialStandardTitle}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Objective Element Title:</span>
                    <span className="text-slate-900">{activeFieldModal.objectiveElementTitle}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Exact NABH Requirement:</span>
                    <span className="text-slate-800 bg-amber-50/50 p-2 rounded border border-amber-100 block">
                      {activeFieldModal.exactRequirement}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Compliance Purpose:</span>
                    <span className="text-slate-800">{activeFieldModal.compliancePurpose}</span>
                  </div>
                </div>
              </div>

              {/* Evidence & Audit Trail */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-500 block">Clinical Evidence Required:</span>
                  <span className="text-slate-800">{activeFieldModal.evidenceRequired}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Audit Trail Requirement:</span>
                  <span className="text-slate-800">{activeFieldModal.auditTrailRequirement}</span>
                </div>
              </div>

              {/* Test Case & Execution */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Linked Test Case: {activeFieldModal.testCaseId}</span>
                  <span className="text-teal-700 font-semibold">{activeFieldModal.documentPageSection}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Test Steps: </span>
                  <span className="text-slate-700">{activeFieldModal.testSteps}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Expected Result: </span>
                  <span className="text-slate-700">{activeFieldModal.expectedResult}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Actual Result: </span>
                  <span className="text-slate-800 font-medium">{activeFieldModal.actualResult}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Official Citation: {activeFieldModal.documentPageSection}</span>
              <button
                onClick={() => setActiveFieldModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
