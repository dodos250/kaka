import React, { useState } from 'react';
import { Person } from '../types/genealogy';
import { Users, Plus, Trash2, X, Check } from 'lucide-react';

interface BatchChildrenModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Person;
  onAddChildren: (names: string[], genderDefault?: 'unknown' | 'male' | 'female') => void;
}

export const BatchChildrenModal: React.FC<BatchChildrenModalProps> = ({
  isOpen,
  onClose,
  parent,
  onAddChildren,
}) => {
  const [namesText, setNamesText] = useState('');
  const [individualNames, setIndividualNames] = useState<string[]>(['']);

  if (!isOpen) return null;

  const handleBatchTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (parsed.length > 0) {
      onAddChildren(parsed);
      onClose();
    }
  };

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = individualNames.map(n => n.trim()).filter(n => n.length > 0);
    if (valid.length > 0) {
      onAddChildren(valid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Add Multiple Children</h2>
              <p className="text-xs text-slate-500">Adding children for {parent.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-3">
            Paste multiple names separated by newlines, or enter them quickly below:
          </p>

          <form onSubmit={handleBatchTextSubmit} className="space-y-4">
            <textarea
              rows={5}
              value={namesText}
              onChange={e => setNamesText(e.target.value)}
              placeholder="Eric Mugisha&#10;Alice Umutoni&#10;Diane Keza"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-sans text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {namesText.split('\n').filter(s => s.trim().length > 0).length} names detected
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
                  type="submit"
                  disabled={namesText.split('\n').filter(s => s.trim().length > 0).length === 0}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Add All Children
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
