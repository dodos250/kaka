import React from 'react';
import { Person, AggregateDescendantRecord } from '../types/genealogy';
import { DescendantStats, getKinyarwandaLabel, getCulturalDescription } from '../utils/countingEngine';
import { 
  Users, 
  BarChart3, 
  AlertTriangle, 
  FileSpreadsheet,
  Download,
  Info,
  Sparkles,
  GitFork,
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';

import { kinyarwandaTranslations } from '../translations/kinyarwanda';

interface StatsDashboardProps {
  rootPerson: Person;
  stats: DescendantStats;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  rootPerson,
  stats,
  onExportPDF,
  onExportCSV,
}) => {
  const t = kinyarwandaTranslations.dashboard;
  const g = kinyarwandaTranslations.generations;

  const namedPct = stats.totalKnownDescendants > 0 
    ? Math.round((stats.totalNamedDescendants / stats.totalKnownDescendants) * 100) 
    : 0;

  // Key Kinyarwanda Generational Pillars powered by translation dictionary
  const kinyarwandaPillars = [
    {
      level: 1,
      kinyarwanda: g.gen1.term,
      english: g.gen1.englishLabel,
      count: stats.directChildrenTotal,
      named: stats.directChildrenNamed,
      aggregate: stats.directChildrenAggregate,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50/70',
      border: 'border-blue-200',
      textAccent: 'text-blue-700',
      meaning: g.gen1.description,
    },
    {
      level: 2,
      kinyarwanda: g.gen2.term,
      english: g.gen2.englishLabel,
      count: stats.grandchildrenTotal,
      named: stats.grandchildrenNamed,
      aggregate: stats.grandchildrenAggregate,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      textAccent: 'text-emerald-700',
      meaning: g.gen2.description,
    },
    {
      level: 3,
      kinyarwanda: g.gen3.term,
      english: g.gen3.englishLabel,
      count: stats.greatGrandchildrenTotal,
      named: stats.greatGrandchildrenNamed,
      aggregate: stats.greatGrandchildrenAggregate,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50/70',
      border: 'border-amber-200',
      textAccent: 'text-amber-700',
      meaning: g.gen3.description,
    },
    {
      level: 4,
      kinyarwanda: g.gen4.term,
      english: g.gen4.englishLabel,
      count: stats.ubuviviTotal,
      named: stats.ubuviviNamed,
      aggregate: stats.ubuviviAggregate,
      color: 'from-purple-600 to-violet-600',
      bgLight: 'bg-purple-50/70',
      border: 'border-purple-200',
      textAccent: 'text-purple-700',
      meaning: g.gen4.description,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Top Banner with Matriarch/Patriarch Cultural Framing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-blue-500/10">
            {rootPerson.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 tracking-wide uppercase">
                {t.rootBadge}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Lineage Anchor • Gen 0
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {rootPerson.fullName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t.rootSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={onExportPDF}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/15 flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            {t.pdfReportBtn}
          </button>
          <button
            onClick={onExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {t.csvExportBtn}
          </button>
        </div>
      </div>

      {/* Cultural Pillar Cards: Abana, Abuzukuru, Abuzukuruza, Ubuvivi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            {t.sectionTitle} (Generational Descendants)
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {t.totalKnown}: <strong className="text-slate-800 font-black">{stats.totalKnownDescendants}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kinyarwandaPillars.map(p => (
            <div
              key={p.level}
              className={`relative overflow-hidden rounded-2xl p-5 border ${p.border} ${p.bgLight} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/80 border border-slate-200/60 text-slate-700">
                    Gen {p.level} • {p.english}
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-1">
                    {p.kinyarwanda}
                  </h4>
                </div>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${p.color} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                  {p.level}
                </div>
              </div>

              {/* Total Count Display */}
              <div className="my-3">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {p.count}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-1.5">
                  {p.count === 1 ? t.peopleSingular : t.peoplePlural}
                </span>
              </div>

              {/* Breakdown between named and count-only */}
              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span className="text-emerald-700 font-bold">
                  {p.named} {t.namedCountSuffix}
                </span>
                <span className="text-amber-800 font-semibold">
                  {p.aggregate} {t.aggregateCountSuffix}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 italic truncate">
                {p.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t.allDescendantsCardTitle}
          </p>
          <p className="text-3xl font-black text-white mt-1">
            {stats.totalKnownDescendants}
          </p>
          <p className="text-[11px] text-blue-300 mt-0.5">
            {t.allDescendantsCardSubtitle}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            {t.namedCardTitle}
          </p>
          <p className="text-3xl font-black text-emerald-900 mt-1">
            {stats.totalNamedDescendants}
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            {namedPct}% {t.namedCardSubtitle}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            {t.aggregateCardTitle}
          </p>
          <p className="text-3xl font-black text-amber-900 mt-1">
            {stats.totalAggregateDescendants}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
            {100 - namedPct}% {t.aggregateCardSubtitle}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
          <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
            {t.branchesCardTitle}
          </p>
          <p className="text-3xl font-black text-indigo-900 mt-1">
            {stats.branchCount}
          </p>
          <p className="text-[11px] text-indigo-700 mt-0.5 truncate font-medium">
            {stats.largestBranch ? `${t.branchesLargestPrefix} ${stats.largestBranch.childName} (${stats.largestBranch.totalDescendants})` : 'Direct Branches'}
          </p>
        </div>
      </div>

      {/* Visual Documentation Progress Bar */}
      <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-2 text-xs font-bold">
          <span className="text-slate-800">{t.progressTitle}</span>
          <span className="text-slate-600">
            {stats.totalNamedDescendants} {t.namedCountSuffix} / {stats.totalAggregateDescendants} {t.aggregateCountSuffix}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${namedPct}%` }} 
            className="h-full bg-emerald-500 transition-all duration-500" 
            title={`Named: ${namedPct}%`}
          />
          <div 
            style={{ width: `${100 - namedPct}%` }} 
            className="h-full bg-amber-400 transition-all duration-500" 
            title={`Count-Only: ${100 - namedPct}%`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {t.progressNamedLegend} ({namedPct}%)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> {t.progressCountLegend} ({100 - namedPct}%)
          </span>
          {stats.incompleteBranchCount > 0 && (
            <span className="flex items-center gap-1 text-amber-700 ml-auto font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.incompleteBranchesAlert} {stats.incompleteBranchCount}
            </span>
          )}
        </div>
      </div>

      {/* Comprehensive Generation-by-Generation Summary Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              {t.tableTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.tableSubtitle}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">{t.colGeneration}</th>
                <th className="py-3.5 px-4">{t.colMeaning}</th>
                <th className="py-3.5 px-4">{t.colNamed}</th>
                <th className="py-3.5 px-4">{t.colCountOnly}</th>
                <th className="py-3.5 px-4">{t.colTotal}</th>
                <th className="py-3.5 px-4">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from(stats.byGeneration.entries()).map(([genNum, info]) => {
                return (
                  <tr key={genNum} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                          {genNum}
                        </span>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{info.kinyarwandaLabel}</p>
                          <p className="text-[10px] text-slate-400">Gen {genNum} • {info.generationLabel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {info.culturalDescription}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {info.namedCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {info.aggregateCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {info.aggregateCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      {info.totalKnownCount}
                    </td>
                    <td className="py-3.5 px-4">
                      {info.hasIncompleteInfo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> {t.statusIncomplete}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {t.statusComplete}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Notes & Integrity Alerts */}
      {stats.notes.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4.5 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4 text-amber-700" />
            {t.auditNotesTitle}
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-950 font-medium">
            {stats.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
