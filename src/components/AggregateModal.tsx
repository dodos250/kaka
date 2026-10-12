import React, { useState } from 'react';
import { AggregateDescendantRecord, Person } from '../types/genealogy';
import { Calculator, X, Save, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AggregateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ancestor: Person;
  onSave: (record: Omit<AggregateDescendantRecord, 'id' | 'createdAt'>) => void;
  initialRecord?: AggregateDescendantRecord | null;
}

export const AggregateModal: React.FC<AggregateModalProps> = ({
  isOpen,
  onClose,
  ancestor,
  onSave,
  initialRecord,
}) => {
  const [count, setCount] = useState<number>(initialRecord?.count || 4);
  const [generationOffset, setGenerationOffset] = useState<number>(initialRecord?.generationOffset || 1);
  const [label, setLabel] = useState<string>(initialRecord?.label || '');
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [isConfirmedAdditional, setIsConfirmedAdditional] = useState<boolean>(
    initialRecord ? initialRecord.isConfirmedAdditional : true
  );
  const [isIncompleteBranch, setIsIncompleteBranch] = useState<boolean>(
    initialRecord?.isIncompleteBranch || false
  );

  React.useEffect(() => {
    if (initialRecord) {
      setCount(initialRecord.count);
      setGenerationOffset(initialRecord.generationOffset);
      setLabel(initialRecord.label || '');
      setNotes(initialRecord.notes || '');
      setIsConfirmedAdditional(initialRecord.isConfirmedAdditional);
      setIsIncompleteBranch(initialRecord.isIncompleteBranch || false);
    } else {
      setCount(4);
      setGenerationOffset(1);
      setLabel('');
      setNotes('');
      setIsConfirmedAdditional(true);
      setIsIncompleteBranch(false);
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (count <= 0) return;

    onSave({
      ancestorId: ancestor.id,
      generationOffset,
      count,
      label: label.trim() || undefined,
      notes: notes.trim() || undefined,
      isConfirmedAdditional,
      isIncompleteBranch,
      reconciledNamedCount: initialRecord?.reconciledNamedCount || 0,
    });
    onClose();
  };

  const getGenText = (offset: number) => {
    switch (offset) {
      case 1: return `Direct Children of ${ancestor.fullName}`;
      case 2: return `Grandchildren of ${ancestor.fullName}`;
      case 3: return `Great-Grandchildren of ${ancestor.fullName}`;
      default: return `Descendants (${offset} generations removed from ${ancestor.fullName})`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {initialRecord ? 'Edit Count-Only Record' : 'Record Descendant Count'}
              </h2>
              <p className="text-xs text-slate-500">
                Attach aggregate counts to <span className="font-semibold text-slate-700">{ancestor.fullName}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Generation Level
            </label>
            <select
              value={generationOffset}
              onChange={e => setGenerationOffset(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value={1}>Generation +1: Children (e.g. Marie has 4 children)</option>
              <option value={2}>Generation +2: Grandchildren (e.g. 12 grandchildren)</option>
              <option value={3}>Generation +3: Great-Grandchildren (e.g. 25 great-grandchildren)</option>
              <option value={4}>Generation +4: 2x Great-Grandchildren</option>
              <option value={5}>Generation +5: 3x Great-Grandchildren</option>
            </select>
            <p className="text-xs text-amber-800 mt-1 font-medium">
              Target: {getGenText(generationOffset)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Count of Descendants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              required
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descriptive Label / Context (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. 4 children living in Brussels, Belgium"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Historical Notes / Informant Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Why names are missing, expected future updates, etc."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          {/* Overlap & Integrity Rule Protection */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Counting Integrity Rule
                </p>
                <label className="flex items-center gap-2 text-xs text-amber-950 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedAdditional}
                    onChange={e => setIsConfirmedAdditional(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    <strong>Confirmed additional:</strong> These are separate descendants and should be added cleanly alongside any individually named members.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <label className="flex items-center gap-2 text-xs text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIncompleteBranch}
                  onChange={e => setIsIncompleteBranch(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Flag branch as having <strong>incomplete / partial information</strong> (needs research).</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Count Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
