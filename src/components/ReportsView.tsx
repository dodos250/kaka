import React, { useState } from 'react';
import { Person, FamilyTreeData } from '../types/genealogy';
import { calculateDescendants } from '../utils/countingEngine';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Users,
  Layers,
  Database
} from 'lucide-react';
import { 
  exportPeopleCSV, 
  exportDescendantBreakdownCSV, 
  generateGenealogyPDF, 
  triggerFileDownload 
} from '../utils/exportUtils';
import { exportFamilyTreeJSON } from '../utils/storage';

interface ReportsViewProps {
  data: FamilyTreeData;
  activeRoot: Person;
  onOpenRemoveDemo?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ data, activeRoot, onOpenRemoveDemo }) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'descendants' | 'branch_summary' | 'all_members' | 'incomplete_audit'
  >('descendants');

  const stats = calculateDescendants(activeRoot.id, data);

  // Incomplete branches report data
  const incompletePeople = data.people.filter(p => {
    const aggs = data.aggregates.filter(a => a.ancestorId === p.id);
    return aggs.some(a => a.isIncompleteBranch) || p.recordStatus !== 'confirmed';
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const jsonStr = exportFamilyTreeJSON(data);
    triggerFileDownload('family_tree_backup.json', jsonStr, 'application/json');
  };

  const handleExportPeopleCSV = () => {
    const csvStr = exportPeopleCSV(data);
    triggerFileDownload('family_members_directory.csv', csvStr, 'text/csv');
  };

  const handleExportBreakdownCSV = () => {
    const csvStr = exportDescendantBreakdownCSV(activeRoot, data);
    triggerFileDownload(`${activeRoot.fullName.replace(/\s+/g, '_')}_descendants.csv`, csvStr, 'text/csv');
  };

  const handleExportPDF = () => {
    generateGenealogyPDF(activeRoot, data);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports, Audit & Multi-Format Export</h2>
          <p className="text-xs text-slate-500">
            Generate formal genealogy documentation, audit logs, and archival backups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Multi-Page
          </button>
          {onOpenRemoveDemo && (
            <button
              onClick={onOpenRemoveDemo}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Remove Demo Data
            </button>
          )}
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Database className="w-4 h-4" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'descendants', label: 'Descendant Analysis Report' },
          { id: 'branch_summary', label: 'Branch-by-Branch Summary' },
          { id: 'all_members', label: 'All Named Members Index' },
          { id: 'incomplete_audit', label: 'Incomplete & Research Gap Audit' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReportType(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedReportType === tab.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content Panels */}
      {selectedReportType === 'descendants' && (
        <div className="space-y-4 print:p-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Lineage Descendant Count: {activeRoot.fullName}
            </h3>
            <button
              onClick={handleExportBreakdownCSV}
              className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Generation CSV
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Generation</th>
                  <th className="py-3 px-4">Direct Named</th>
                  <th className="py-3 px-4">Count-Only Records</th>
                  <th className="py-3 px-4">Total Known</th>
                  <th className="py-3 px-4">Documentation Completeness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from(stats.byGeneration.entries()).map(([genNum, info]) => (
                  <tr key={genNum}>
                    <td className="py-3 px-4 font-bold text-slate-900">{info.generationLabel}</td>
                    <td className="py-3 px-4">{info.namedCount} individuals</td>
                    <td className="py-3 px-4">{info.aggregateCount} counted</td>
                    <td className="py-3 px-4 font-black text-slate-900">{info.totalKnownCount}</td>
                    <td className="py-3 px-4">
                      {info.hasIncompleteInfo ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Contains partial estimates
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'branch_summary' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Branch-by-Branch Family Lineages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.parentChild
              .filter(r => r.parentId === activeRoot.id)
              .map(r => data.people.find(p => p.id === r.childId))
              .filter(Boolean)
              .map(child => {
                const childPerson = child as Person;
                const childStats = calculateDescendants(childPerson.id, data);
                return (
                  <div
                    key={childPerson.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{childPerson.fullName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {childPerson.branch || 'Branch'}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Total branch descendants:{' '}
                      <strong className="text-slate-900">{childStats.totalKnownDescendants}</strong> (
                      {childStats.totalNamedDescendants} named, {childStats.totalAggregateDescendants} counted)
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Birth: {childPerson.dateOfBirth || 'Unknown'} | Origin: {childPerson.placeOfBirth || 'Unspecified'}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {selectedReportType === 'all_members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Master Index of Named Family Members ({data.people.length})
            </h3>
            <button
              onClick={handleExportPeopleCSV}
              className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Full CSV
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Birth Date</th>
                  <th className="py-2.5 px-4">Origin</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Informant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.people.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{p.fullName}</td>
                    <td className="py-2.5 px-4">{p.dateOfBirth || '—'}</td>
                    <td className="py-2.5 px-4">{p.placeOfBirth || '—'}</td>
                    <td className="py-2.5 px-4 capitalize">{p.recordStatus}</td>
                    <td className="py-2.5 px-4">{p.sourceOrInformant || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'incomplete_audit' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-amber-800">
            Records Requiring Field Investigation & Oral Verification
          </h3>
          <p className="text-xs text-slate-600">
            This report highlights family branches where counts are estimated, dates are uncertain, or oral informants noted incomplete branches.
          </p>

          <div className="space-y-3">
            {incompletePeople.map(p => {
              const aggs = data.aggregates.filter(a => a.ancestorId === p.id && a.isIncompleteBranch);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{p.fullName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800 uppercase">
                      Status: {p.recordStatus}
                    </span>
                  </div>
                  {aggs.length > 0 && (
                    <p className="text-amber-900 font-medium">
                      Flagged count records: {aggs.map(a => a.label || `${a.count} unnamed descendants`).join(', ')}
                    </p>
                  )}
                  {p.notes && <p className="text-slate-600 italic">Notes: "{p.notes}"</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
