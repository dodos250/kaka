import React, { useState } from 'react';
import { Person, FamilyTreeData } from '../types/genealogy';
import { calculateDescendants } from '../utils/countingEngine';
import { exportFamilyTreeJSON } from '../utils/storage';
import { generateGenealogyPDF, triggerFileDownload } from '../utils/exportUtils';
import { 
  Share2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Link2, 
  Users, 
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FamilyTreeData;
  activeRoot: Person;
  treeContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  data,
  activeRoot,
  treeContainerRef,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  if (!isOpen) return null;

  const stats = calculateDescendants(activeRoot.id, data);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleExportPNG = async () => {
    try {
      setIsExportingImage(true);
      const element = treeContainerRef?.current;
      if (!element) {
        alert('Canvas element not found for image export');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const filename = `${activeRoot.fullName.replace(/\s+/g, '_')}_Family_Tree.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportPDF = () => {
    generateGenealogyPDF(activeRoot, data);
  };

  const handleExportJSON = () => {
    const jsonStr = exportFamilyTreeJSON(data);
    triggerFileDownload(
      `${activeRoot.fullName.replace(/\s+/g, '_')}_family_tree_data.json`,
      jsonStr,
      'application/json'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug">
                Sangiza Igiti cy’Umuryango (Share Family Tree)
              </h3>
              <p className="text-xs text-blue-100">
                {activeRoot.fullName} • {stats.totalKnownDescendants} Urubyaro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-4">
          {/* Option 1: Direct Link */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" />
                Umurongo wo gusangiza (Shareable Web Link)
              </span>
              {copiedLink && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Yakoporowe!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Koporora umurongo kugira ngo uwugereho kuri mudasobwa cyangwa telefoni:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-700 font-mono select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Export Image (PNG) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Gukuramo Ifoto (Export Tree Image / PNG)
              </span>
              <p className="text-[11px] text-slate-500">
                Gira ifoto ifite ireme ryiza (High-Res PNG) yo kohereza kuri WhatsApp cyangwa kubika
              </p>
            </div>
            <button
              onClick={handleExportPNG}
              disabled={isExportingImage}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingImage ? 'Creating...' : 'Download PNG'}</span>
            </button>
          </div>

          {/* Option 3: Export Formal PDF Document */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Inyandiko ya Raporo (Formal PDF Report)
              </span>
              <p className="text-[11px] text-slate-500">
                Raporo yuzuye y’urubyaro n’ibisekuru byose: Abana, Abuzukuru, Abuzukuruza n’Ubuvivi
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Option 4: Backup Data File (JSON) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Dosiye y’Umuryango (JSON Database Backup)
              </span>
              <p className="text-[11px] text-slate-500">
                Dosiye irambye y’amakuru yose ushobora kongera kwinjiza (Import) igihe cyose
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Umuryango wa {activeRoot.fullName}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Funga (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
