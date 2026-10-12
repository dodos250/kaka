import React, { useState } from 'react';
import { AggregateDescendantRecord, Person, Gender } from '../types/genealogy';
import { RefreshCw, UserPlus, Check, X, ShieldAlert } from 'lucide-react';

interface ConvertAggregateModalProps {
  isOpen: boolean;
  onClose: () => void;
  aggregate: AggregateDescendantRecord;
  ancestor: Person;
  onReconcile: (
    aggregateId: string,
    newPeople: Array<{ fullName: string; gender?: Gender }>,
    deleteIfFullyReconciled: boolean
  ) => void;
}

export const ConvertAggregateModal: React.FC<ConvertAggregateModalProps> = ({
  isOpen,
  onClose,
  aggregate,
  ancestor,
  onReconcile,
}) => {
  const remainingCount = Math.max(0, aggregate.count - (aggregate.reconciledNamedCount || 0));
  const [namesText, setNamesText] = useState('');
  const [deleteIfFull, setDeleteIfFull] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    const newPeopleList = names.map(fullName => ({
      fullName,
      gender: 'unknown' as Gender,
    }));

    onReconcile(aggregate.id, newPeopleList, deleteIfFull);
    onClose();
  };

  const parsedNames = namesText.split('\n').filter(s => s.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Convert Count into Named People</h2>
              <p className="text-xs text-slate-500">
                Reconciling count for <span className="font-semibold">{ancestor.fullName}</span>
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

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Original Aggregate Count:</span>
              <span className="font-bold text-slate-900">{aggregate.count}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Already Reconciled:</span>
              <span className="text-emerald-700 font-bold">{aggregate.reconciledNamedCount || 0}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-slate-200 pt-1 text-slate-900">
              <span>Remaining Anonymous Count:</span>
              <span className="text-amber-600 font-bold">{remainingCount}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Enter names of descendants you discovered (one per line)
            </label>
            <textarea
              rows={4}
              value={namesText}
              onChange={e => setNamesText(e.target.value)}
              placeholder="e.g.&#10;Alice Mutoni&#10;Kevin Habimana"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-slate-500">
              Entering names here will create named person records connected to{' '}
              <strong>{ancestor.fullName}</strong> while decreasing the anonymous count by the same amount, preventing double-counting.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={deleteIfFull}
                  onChange={e => setDeleteIfFull(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Auto-retire aggregate badge if all {remainingCount} are named
              </label>
              <p className="text-[11px] text-emerald-700/90 mt-0.5">
                If remaining count reaches 0, clean up the aggregate record.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {parsedNames.length} named individual(s) to add
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={parsedNames.length === 0}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Reconcile & Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
