import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '+ or =', description: 'Zoom in' },
    { key: '-', description: 'Zoom out' },
    { key: '0', description: 'Fit entire tree to screen' },
    { key: 'R', description: 'Center viewport on root ancestor' },
    { key: 'Space + Drag', description: 'Pan canvas smoothly' },
    { key: 'Middle Mouse Drag', description: 'Pan canvas directly' },
    { key: 'Mouse Wheel', description: 'Zoom centered on cursor' },
    { key: 'Ctrl / Cmd + Z', description: 'Undo node movement or action' },
    { key: 'Ctrl / Cmd + Shift + Z', description: 'Redo previously undone action' },
    { key: 'Escape', description: 'Deselect node or close active panel/modal' },
    { key: 'Delete / Backspace', description: 'Delete selected person (with confirmation dialog)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Canvas Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            These shortcuts work whenever you are interacting with the tree canvas. They are disabled while typing in text inputs and forms.
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                <span className="text-slate-600">{s.description}</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
