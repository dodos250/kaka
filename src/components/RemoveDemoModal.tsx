import React, { useState } from 'react';
import { FamilyTreeData, Person } from '../types/genealogy';
import { analyzeDemoRecords, removeSelectedRecords, DemoAuditSummary } from '../utils/demoDataCleaner';
import { createLocalBackup, exportFamilyTreeJSON } from '../utils/storage';
import { triggerFileDownload } from '../utils/exportUtils';
import { 
  Trash2, 
  ShieldAlert, 
  Download, 
  X, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Sparkles,
  Users
} from 'lucide-react';

interface RemoveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FamilyTreeData;
  onConfirmRemoval: (cleanedData: FamilyTreeData) => void;
}

export const RemoveDemoModal: React.FC<RemoveDemoModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirmRemoval,
}) => {
  const audit: DemoAuditSummary = analyzeDemoRecords(data);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<Set<string>>(() => {
    return new Set(audit.demoPeople.map(p => p.id));
  });

  const [selectedAggregateIds, setSelectedAggregateIds] = useState<Set<string>>(() => {
    return new Set(audit.demoAggregates.map(a => a.id));
  });

  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState(false);

  // Update selection if audit changes
  React.useEffect(() => {
    setSelectedPeopleIds(new Set(audit.demoPeople.map(p => p.id)));
    setSelectedAggregateIds(new Set(audit.demoAggregates.map(a => a.id)));
  }, [isOpen, data]);

  if (!isOpen) return null;

  const togglePerson = (id: string) => {
    setSelectedPeopleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAggregate = (id: string) => {
    setSelectedAggregateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadBackup = () => {
    createLocalBackup(data);
    const json = exportFamilyTreeJSON(data);
    triggerFileDownload(`family_tree_backup_before_demo_cleanup_${Date.now()}.json`, json, 'application/json');
    setHasDownloadedBackup(true);
  };

  const handleExecuteRemoval = () => {
    if (!isConfirmedCheckbox && selectedPeopleIds.size > 0) return;

    // Safety backup to localStorage automatically
    createLocalBackup(data);

    const cleaned = removeSelectedRecords(data, selectedPeopleIds, selectedAggregateIds);
    onConfirmRemoval(cleaned);
    onClose();
  };

  const isNothingToDelete = selectedPeopleIds.size === 0 && selectedAggregateIds.size === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Remove Demonstration Data</h2>
              <p className="text-xs text-rose-800 font-medium">
                Safely purge mock demo records while preserving all real family members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
              <p className="text-xs text-rose-700 font-bold uppercase">Demo People</p>
              <p className="text-2xl font-black text-rose-900 mt-0.5">{audit.demoPeople.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-700 font-bold uppercase">Demo Counts</p>
              <p className="text-2xl font-black text-amber-900 mt-0.5">{audit.demoAggregates.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold uppercase">Real People</p>
              <p className="text-2xl font-black text-emerald-900 mt-0.5">{audit.realPeople.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-bold uppercase">Real Counts</p>
              <p className="text-2xl font-black text-blue-900 mt-0.5">{audit.realAggregates.length}</p>
            </div>
          </div>

          {/* Backup prompt */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Safety First: Backup Your Current Data</p>
              <p className="text-xs text-slate-500">Download a full JSON archive before making any deletions.</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto ${
                hasDownloadedBackup 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {hasDownloadedBackup ? 'Backup Downloaded ✓' : 'Export Safety Backup'}
            </button>
          </div>

          {/* Ambiguous records notice if any */}
          {audit.ambiguousPeople.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Ambiguous Records Requiring Review ({audit.ambiguousPeople.length})
              </div>
              <p className="text-xs text-amber-800">
                The following records have IDs from the sample dataset but appear to have user modifications. They are unchecked by default so you don't lose custom edits:
              </p>
              <div className="divide-y divide-amber-200/60 border border-amber-200 rounded-lg overflow-hidden bg-white">
                {audit.ambiguousPeople.map(p => (
                  <label key={p.id} className="p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-50/50">
                    <span className="font-semibold text-slate-800">{p.fullName}</span>
                    <input
                      type="checkbox"
                      checked={selectedPeopleIds.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                      className="rounded text-rose-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Granular Demo records selection list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Demonstration Records to Remove ({selectedPeopleIds.size} people, {selectedAggregateIds.size} counts selected)
              </h3>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeopleIds(new Set(audit.demoPeople.map(p => p.id)));
                    setSelectedAggregateIds(new Set(audit.demoAggregates.map(a => a.id)));
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Select All Demo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeopleIds(new Set());
                    setSelectedAggregateIds(new Set());
                  }}
                  className="text-slate-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {audit.demoPeople.map(p => (
                <label key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPeopleIds.has(p.id)}
                      onChange={() => togglePerson(p.id)}
                      className="rounded text-rose-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">{p.fullName}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({p.branch || 'Demo'})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">
                    Demo Seed
                  </span>
                </label>
              ))}

              {audit.demoAggregates.map(a => (
                <label key={a.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer bg-amber-50/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAggregateIds.has(a.id)}
                      onChange={() => toggleAggregate(a.id)}
                      className="rounded text-amber-600"
                    />
                    <div>
                      <span className="font-semibold text-amber-950">{a.count} Count: {a.label || 'Unnamed'}</span>
                      <span className="text-[11px] text-slate-400 ml-2">(Gen +{a.generationOffset})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                    Demo Aggregate
                  </span>
                </label>
              ))}

              {audit.demoPeople.length === 0 && audit.demoAggregates.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No demonstration seed records found. Your tree contains only personal records!
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          {!isNothingToDelete && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5">
              <label className="flex items-start gap-2.5 text-xs text-rose-950 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmedCheckbox}
                  onChange={e => setIsConfirmedCheckbox(e.target.checked)}
                  className="rounded text-rose-600 mt-0.5 focus:ring-rose-500"
                />
                <span>
                  I confirm the permanent removal of these {selectedPeopleIds.size} demonstration person record(s) and {selectedAggregateIds.size} count(s). Any real family records will remain untouched.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isNothingToDelete || !isConfirmedCheckbox}
            onClick={handleExecuteRemoval}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Purge Selected Demo Records ({selectedPeopleIds.size + selectedAggregateIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
