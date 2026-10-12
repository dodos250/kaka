import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Person, AggregateDescendantRecord, FamilyTreeData, NodePosition } from '../types/genealogy';
import { getGenerationLabel, getKinyarwandaLabel, calculateDescendants, computeLineagePath } from '../utils/countingEngine';
import { computeAutoLayout, TreeOrientation } from '../utils/treeLayout';
import { ShareModal } from './ShareModal';
import { 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Calculator, 
  Maximize2, 
  LocateFixed, 
  Grid, 
  HelpCircle,
  Undo2,
  Redo2,
  Camera,
  Eye,
  EyeOff,
  Sparkles,
  GitFork,
  ChevronDown,
  Layers,
  Share2,
  ArrowDownUp
} from 'lucide-react';
import { kinyarwandaTranslations } from '../translations/kinyarwanda';

interface CircularFamilyTreeViewProps {
  data: FamilyTreeData;
  rootId?: string;
  onSelectPerson: (person: Person) => void;
  selectedPersonId?: string;
  onAddChild: (parentId: string) => void;
  onAddAggregate: (ancestor: Person) => void;
  onConvertAggregate: (record: AggregateDescendantRecord, ancestor: Person) => void;
  onUpdatePositions: (positions: Record<string, NodePosition>, mode: 'auto' | 'manual') => void;
  onOpenShortcutsHelp: () => void;
  onEditSelectedPerson: () => void;
  onOpenAddPerson: () => void;
  onDeletePersonPrompt: (personId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const CircularFamilyTreeView: React.FC<CircularFamilyTreeViewProps> = ({
  data,
  rootId,
  onSelectPerson,
  selectedPersonId,
  onAddChild,
  onAddAggregate,
  onConvertAggregate,
  onUpdatePositions,
  onOpenShortcutsHelp,
  onEditSelectedPerson,
  onOpenAddPerson,
  onDeletePersonPrompt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport transforms
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Lineage toggle: automatically populated by default, user can toggle display on/off
  const [showLineage, setShowLineage] = useState(true);

  // Tree Orientation: 'vertical' (branches expand down vertically) vs 'horizontal' (classic wide chart)
  const [orientation, setOrientation] = useState<TreeOrientation>('vertical');

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Node Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 });
  
  // Local positions cache
  const [localPositions, setLocalPositions] = useState<Record<string, NodePosition>>({});

  const activeRoot = data.people.find(p => p.id === (rootId || data.activeRootId)) || data.people[0];

  // Initialize or synchronize positions with chosen orientation
  useEffect(() => {
    const autoResult = computeAutoLayout(activeRoot?.id, data, orientation);
    // If manual node positions exist and match current orientation, preserve them; otherwise apply orientation
    const merged = { ...autoResult.positions, ...(data.nodePositions || {}) };
    setLocalPositions(merged);
  }, [data.people, data.parentChild, data.aggregates, activeRoot?.id, orientation]);

  // Center tree initially or when root changes
  const handleCenterOnRoot = useCallback(() => {
    if (!containerRef.current || !activeRoot) return;
    const rootPos = localPositions[activeRoot.id] || { x: 500, y: 100 };
    const { clientWidth, clientHeight } = containerRef.current;
    setPosition({
      x: orientation === 'vertical' ? 80 : clientWidth / 2 - rootPos.x * scale,
      y: orientation === 'vertical' ? clientHeight / 2 - rootPos.y * scale : clientHeight / 4 - rootPos.y * scale,
    });
  }, [activeRoot, localPositions, scale, orientation]);

  const handleFitTree = useCallback(() => {
    if (!containerRef.current) return;
    const posKeys = Object.keys(localPositions);
    if (posKeys.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const key of posKeys) {
      const pos = localPositions[key];
      minX = Math.min(minX, pos.x - 90);
      maxX = Math.max(maxX, pos.x + 90);
      minY = Math.min(minY, pos.y - 90);
      maxY = Math.max(maxY, pos.y + 90);
    }

    const { clientWidth, clientHeight } = containerRef.current;
    const treeW = maxX - minX + 180;
    const treeH = maxY - minY + 180;

    const scaleX = (clientWidth - 40) / treeW;
    const scaleY = (clientHeight - 80) / treeH;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.2);

    setScale(fitScale);
    setPosition({
      x: orientation === 'vertical' ? 60 : (clientWidth - (minX + maxX) * fitScale) / 2,
      y: (clientHeight - (minY + maxY) * fitScale) / 2,
    });
  }, [localPositions, orientation]);

  // Fit Descendants Vertically: Scales so all descendant levels fit screen height comfortably
  const handleFitVertically = useCallback(() => {
    if (!containerRef.current || !activeRoot) return;
    const posKeys = Object.keys(localPositions);
    if (posKeys.length === 0) return;

    let minY = Infinity, maxY = -Infinity;
    for (const key of posKeys) {
      const pos = localPositions[key];
      minY = Math.min(minY, pos.y - 80);
      maxY = Math.max(maxY, pos.y + 80);
    }

    const { clientWidth, clientHeight } = containerRef.current;
    const treeH = maxY - minY + 160;
    const fitScale = Math.min(Math.max((clientHeight - 80) / treeH, 0.22), 1.1);
    const rootPos = localPositions[activeRoot.id] || { x: clientWidth / 2, y: 100 };

    setScale(fitScale);
    setPosition({
      x: orientation === 'vertical' ? 60 : clientWidth / 2 - rootPos.x * fitScale,
      y: 45,
    });
  }, [activeRoot, localPositions, orientation]);

  // Jump vertically directly to a specific generation level
  const handleScrollToGeneration = (gen: number) => {
    if (!containerRef.current) return;
    if (orientation === 'vertical') {
      const targetX = 140 + gen * 260;
      setPosition(prev => ({
        ...prev,
        x: 80 - targetX * scale,
      }));
    } else {
      const targetY = 100 + gen * 200;
      const { clientHeight } = containerRef.current;
      setPosition(prev => ({
        ...prev,
        y: clientHeight / 3 - targetY * scale,
      }));
    }
  };

  // Center or fit on mount
  useEffect(() => {
    handleFitTree();
  }, [activeRoot?.id]);

  // Natural Vertical Scrolling via Mouse Wheel, and Ctrl+Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    // Ctrl or Meta held -> Zoom in/out centered at mouse
    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.min(Math.max(0.2, scale * zoomFactor), 2.5);

      const newX = mouseX - (mouseX - position.x) * (newScale / scale);
      const newY = mouseY - (mouseY - position.y) * (newScale / scale);

      setScale(newScale);
      setPosition({ x: newX, y: newY });
      return;
    }

    // Shift held -> Horizontal scroll
    if (e.shiftKey) {
      setPosition(prev => ({
        ...prev,
        x: prev.x - e.deltaY,
      }));
      return;
    }

    // Default: Natural vertical scrolling so all descendants can be reached!
    setPosition(prev => ({
      x: prev.x - (e.deltaX || 0),
      y: prev.y - e.deltaY,
    }));
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) return;

      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s + 0.15, 2.5));
      } else if (e.key === '-') {
        setScale(s => Math.max(s - 0.15, 0.3));
      } else if (e.key === '0') {
        handleFitTree();
      } else if (e.key === 'r' || e.key === 'R') {
        handleCenterOnRoot();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPersonId) {
          onDeletePersonPrompt(selectedPersonId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) onRedo();
        } else {
          if (canUndo) onUndo();
        }
      } else if (e.key === 'Escape') {
        onSelectPerson(null as any);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, selectedPersonId, canUndo, canRedo, onUndo, onRedo, handleFitTree, handleCenterOnRoot]);

  // Canvas Mouse / Touch Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      return;
    }

    if (e.button === 0 && !(e.target as HTMLElement).closest('.circular-node')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggedNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const canvasMouseX = (e.clientX - rect.left - position.x) / scale;
      const canvasMouseY = (e.clientY - rect.top - position.y) / scale;

      const newPos = {
        x: Math.round(canvasMouseX - nodeDragOffset.x),
        y: Math.round(canvasMouseY - nodeDragOffset.y),
      };

      setLocalPositions(prev => ({
        ...prev,
        [draggedNodeId]: newPos,
      }));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggedNodeId) {
      onUpdatePositions(localPositions, 'manual');
      setDraggedNodeId(null);
    }
  };

  // Node Drag Initiation
  const startDraggingNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpacePressed) return;

    const currentPos = localPositions[nodeId] || { x: 100, y: 100 };
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasMouseX = (e.clientX - rect.left - position.x) / scale;
    const canvasMouseY = (e.clientY - rect.top - position.y) / scale;

    setDraggedNodeId(nodeId);
    setNodeDragOffset({
      x: canvasMouseX - currentPos.x,
      y: canvasMouseY - currentPos.y,
    });
  };

  // Reset to Automatic generational layout
  const handleResetToAutoLayout = () => {
    const hasManual = Object.keys(data.nodePositions || {}).length > 0;
    if (hasManual) {
      if (!window.confirm('Reset all nodes to the automatic layout? Your manual positions will be realigned.')) {
        return;
      }
    }
    const autoResult = computeAutoLayout(activeRoot?.id, data, orientation);
    setLocalPositions(autoResult.positions);
    onUpdatePositions(autoResult.positions, 'auto');
  };

  // Toggle between Vertical (branches expand down vertically) and Horizontal (classic wide)
  const handleToggleOrientation = () => {
    const nextOrientation: TreeOrientation = orientation === 'vertical' ? 'horizontal' : 'vertical';
    setOrientation(nextOrientation);
    const autoResult = computeAutoLayout(activeRoot?.id, data, nextOrientation);
    setLocalPositions(autoResult.positions);
    onUpdatePositions(autoResult.positions, 'auto');
    setTimeout(() => {
      handleFitTree();
    }, 50);
  };

  // Map of parent-child links for SVG curved connectors
  const connectors: Array<{ id: string; from: NodePosition; to: NodePosition; isAggregate?: boolean }> = [];

  for (const rel of data.parentChild) {
    const parentPos = localPositions[rel.parentId];
    const childPos = localPositions[rel.childId];
    if (parentPos && childPos) {
      connectors.push({
        id: `line-${rel.id}`,
        from: parentPos,
        to: childPos,
        isAggregate: false,
      });
    }
  }

  for (const agg of data.aggregates) {
    const ancestorPos = localPositions[agg.ancestorId];
    const aggPos = localPositions[agg.id];
    if (ancestorPos && aggPos) {
      connectors.push({
        id: `line-${agg.id}`,
        from: ancestorPos,
        to: aggPos,
        isAggregate: true,
      });
    }
  }

  // Pre-calculate generational distance of each person from root for Kinyarwanda tagging
  const generationDepthMap = new Map<string, number>();
  if (activeRoot) {
    generationDepthMap.set(activeRoot.id, 0);
    const queue = [activeRoot.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const depth = generationDepthMap.get(curr) || 0;
      const childRels = data.parentChild.filter(r => r.parentId === curr);
      for (const cr of childRels) {
        if (!generationDepthMap.has(cr.childId)) {
          generationDepthMap.set(cr.childId, depth + 1);
          queue.push(cr.childId);
        }
      }
    }
  }

  return (
    <div className="relative w-full h-[740px] bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 rounded-3xl border border-slate-200/90 overflow-hidden select-none flex flex-col shadow-lg shadow-slate-200/50">
      {/* Top Refined Presentation Toolbar */}
      <div className="z-30 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddPerson}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Person
          </button>

          {selectedPersonId && (
            <>
              <button
                onClick={() => onAddChild(selectedPersonId)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-indigo-200/60"
                title="Add child to selected person"
              >
                <Plus className="w-3 h-3" />
                Add Child
              </button>
              <button
                onClick={onEditSelectedPerson}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Edit profile & photo of selected person"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Edit / Photo
              </button>
            </>
          )}

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Lineage Toggle (Populated automatically or removed) */}
          <button
            onClick={() => setShowLineage(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              showLineage 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title="Automatically display or hide lineage paths on cards"
          >
            {showLineage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{kinyarwandaTranslations.tree.lineageToggleLabel} {showLineage ? kinyarwandaTranslations.tree.lineageAutoPopulated : kinyarwandaTranslations.tree.lineageHidden}</span>
          </button>

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Orientation Toggle: Vertical vs Horizontal */}
          <button
            onClick={handleToggleOrientation}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              orientation === 'vertical'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Switch between Vertical (descendants scroll down) and Horizontal tree layout"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{orientation === 'vertical' ? 'Vertical (Y)' : 'Horizontal (X)'}</span>
          </button>

          {/* Reset Layout */}
          <button
            onClick={handleResetToAutoLayout}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Realign all branches in orderly generational layout"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-600" />
            {kinyarwandaTranslations.tree.alignTreeBtn}
          </button>

          {/* Share Family Tree Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/20"
            title="Share this family tree via link, image, or PDF"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{kinyarwandaTranslations.tree.shareTreeBtn}</span>
          </button>
        </div>

        {/* Viewport & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 font-mono">
            {Math.round(scale * 100)}%
          </div>

          <button
            onClick={() => setScale(s => Math.min(s + 0.15, 2.5))}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.15, 0.3))}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitTree}
            className="px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
            title="Fit Entire Tree to Screen (0)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Fit All</span>
          </button>
          <button
            onClick={handleFitVertically}
            className="px-2.5 py-1.5 text-slate-700 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
            title="Fit Descendants Vertically to Screen Height (V)"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Fit Vertically</span>
          </button>
          <button
            onClick={handleCenterOnRoot}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Center on Root Ancestor (R)"
          >
            <LocateFixed className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={onOpenShortcutsHelp}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area with Vertical Scroll Support */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden select-none ${
          isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        {/* Generational Quick-Jump Rail (Left Side) */}
        <div className="absolute left-3 top-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200/80 text-[11px] font-bold">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider px-2 pb-0.5 border-b border-slate-100 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            <span>Ibisekuru</span>
          </div>
          {[
            { gen: 0, label: kinyarwandaTranslations.generations.gen0.term, short: 'G0' },
            { gen: 1, label: kinyarwandaTranslations.generations.gen1.term, short: 'G1' },
            { gen: 2, label: kinyarwandaTranslations.generations.gen2.term, short: 'G2' },
            { gen: 3, label: kinyarwandaTranslations.generations.gen3.term, short: 'G3' },
            { gen: 4, label: kinyarwandaTranslations.generations.gen4.term, short: 'G4' },
          ].map(g => (
            <button
              key={g.gen}
              onClick={() => handleScrollToGeneration(g.gen)}
              className="px-2.5 py-1 text-left rounded-xl hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition flex items-center justify-between gap-2 cursor-pointer group"
              title={`Scroll directly to ${g.label}`}
            >
              <span>{g.label}</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600">
                {g.short}
              </span>
            </button>
          ))}
        </div>

        {/* Scroll Helper Hint (Bottom Right) */}
        <div className="absolute right-4 bottom-4 z-20 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[11px] shadow-lg flex items-center gap-2 pointer-events-none border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Scroll mouse wheel to move vertically • Ctrl+Scroll to zoom</span>
        </div>
        {/* Presentable subtle dot pattern with parchment warmth */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30" 
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1.2px, transparent 1.2px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Dynamic Zoom & Pan Container */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isPanning || draggedNodeId ? 'none' : 'transform 0.15s ease-out',
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* SVG Connector Lines Layer */}
          <svg className="absolute inset-0 w-[10000px] h-[10000px] pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="solidTreeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="amberTreeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {connectors.map(c => {
              const r = 44;
              let x1: number, y1: number, x2: number, y2: number, pathData: string;

              if (orientation === 'vertical') {
                // Parent on left, Child on right
                x1 = c.from.x + r;
                y1 = c.from.y;
                x2 = c.to.x - r;
                y2 = c.to.y;
                const midX = (x1 + x2) / 2;
                pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              } else {
                // Parent on top, Child on bottom
                x1 = c.from.x;
                y1 = c.from.y + r;
                x2 = c.to.x;
                y2 = c.to.y - r;
                const midY = (y1 + y2) / 2;
                pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
              }

              return (
                <g key={c.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={c.isAggregate ? 'url(#amberTreeGrad)' : 'url(#solidTreeGrad)'}
                    strokeWidth={c.isAggregate ? 2.5 : 2.5}
                    strokeDasharray={c.isAggregate ? '6 4' : undefined}
                    className="transition-all duration-75"
                  />
                  {/* Directional node anchor */}
                  <circle cx={x2} cy={y2} r={3.5} fill={c.isAggregate ? '#d97706' : '#4f46e5'} />
                </g>
              );
            })}
          </svg>

          {/* Circular Person Nodes Layer */}
          {data.people.map(person => {
            const pos = localPositions[person.id] || { x: 500, y: 100 };
            const isRoot = person.id === (activeRoot?.id || 'p-mukamana');
            const isSelected = person.id === selectedPersonId;
            const isBeingDragged = person.id === draggedNodeId;

            const personStats = calculateDescendants(person.id, data);
            const genLevel = generationDepthMap.get(person.id) ?? 0;
            const kinyarwandaTerm = getKinyarwandaLabel(genLevel);
            const autoLineage = computeLineagePath(person.id, activeRoot?.id, data);

            return (
              <div
                key={person.id}
                style={{
                  transform: `translate(${pos.x - 56}px, ${pos.y - 56}px)`,
                }}
                onMouseDown={e => startDraggingNode(person.id, e)}
                onClick={e => {
                  e.stopPropagation();
                  onSelectPerson(person);
                }}
                className={`circular-node pointer-events-auto absolute flex flex-col items-center group cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
                  isBeingDragged ? 'z-40 scale-105' : 'z-20'
                }`}
              >
                {/* Generation Pill with Kinyarwanda cultural distinction */}
                <div className={`mb-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs border transition ${
                  isRoot
                    ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/20'
                    : genLevel === 1
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : genLevel === 2
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : genLevel === 3
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {isRoot ? 'Umukurambere (Root)' : `${kinyarwandaTerm} (Gen ${genLevel})`}
                </div>

                {/* Stately Circular Avatar Frame */}
                <div
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center p-1 bg-white transition-all duration-200 shadow-md ${
                    isRoot
                      ? 'border-4 border-blue-600 ring-8 ring-blue-500/15 shadow-xl'
                      : isSelected
                      ? 'border-4 border-indigo-600 ring-6 ring-indigo-500/20 shadow-xl'
                      : 'border-3 border-slate-300 hover:border-slate-500 hover:shadow-lg'
                  }`}
                >
                  {person.photoUrl ? (
                    <img
                      src={person.photoUrl}
                      alt={person.fullName}
                      className="w-full h-full rounded-full object-cover shadow-inner"
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center font-black text-2xl text-white shadow-inner ${
                        person.gender === 'female'
                          ? 'bg-gradient-to-tr from-rose-500 to-pink-500'
                          : person.gender === 'male'
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-tr from-slate-600 to-slate-500'
                      }`}
                    >
                      {person.fullName ? person.fullName.charAt(0) : '?'}
                    </div>
                  )}

                  {/* Deceased Indicator Ribbon */}
                  {person.isDeceased && (
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs"
                      title="Deceased / Yitabye Imana"
                    >
                      ✝
                    </div>
                  )}

                  {/* Descendant count badge */}
                  {personStats.totalKnownDescendants > 0 && (
                    <div
                      className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1 border border-white"
                      title={`${personStats.totalKnownDescendants} descendants`}
                    >
                      <span>{personStats.totalKnownDescendants}</span>
                    </div>
                  )}
                </div>

                {/* Name & Details Card underneath */}
                <div className="mt-3 text-center max-w-[160px] pointer-events-auto bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <p className="font-black text-xs text-slate-900 leading-snug truncate">
                    {person.fullName}
                  </p>
                  
                  {/* Automatically populated Lineage Path or Birth info */}
                  {showLineage ? (
                    <p className="text-[9px] text-blue-700 font-semibold truncate mt-0.5" title={autoLineage}>
                      {autoLineage}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {person.dateOfBirth || (person.placeOfBirth ? person.placeOfBirth : '—')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Circular Count-Only Aggregate Nodes Layer */}
          {data.aggregates.map(agg => {
            const pos = localPositions[agg.id] || { x: 500, y: 300 };
            const isBeingDragged = agg.id === draggedNodeId;
            const remaining = Math.max(0, agg.count - (agg.reconciledNamedCount || 0));
            const ancestor = data.people.find(p => p.id === agg.ancestorId);
            const kinyarwandaTerm = getKinyarwandaLabel(agg.generationOffset);

            return (
              <div
                key={agg.id}
                style={{
                  transform: `translate(${pos.x - 44}px, ${pos.y - 44}px)`,
                }}
                onMouseDown={e => startDraggingNode(agg.id, e)}
                className={`circular-node pointer-events-auto absolute flex flex-col items-center cursor-grab active:cursor-grabbing ${
                  isBeingDragged ? 'z-40 scale-105' : 'z-20'
                }`}
              >
                {/* Generation badge */}
                <div className="mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  {kinyarwandaTerm} (+{agg.generationOffset})
                </div>

                {/* Circular Aggregate Badge */}
                <div className="relative w-22 h-22 rounded-full border-3 border-dashed border-amber-500 bg-amber-50/95 flex flex-col items-center justify-center p-1 text-center shadow-md hover:shadow-lg transition">
                  <span className="text-2xl font-black text-amber-950 leading-none">
                    {agg.count}
                  </span>
                  <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-tighter mt-1">
                    {kinyarwandaTerm}
                  </span>

                  {ancestor && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onConvertAggregate(agg, ancestor);
                      }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                      title="Progressively reconcile into named individuals"
                    >
                      {kinyarwandaTranslations.tree.convertAction}
                    </button>
                  )}
                </div>

                {/* Subtitle */}
                <div className="mt-2 text-center max-w-[140px] bg-amber-50/90 px-2 py-1 rounded-xl border border-amber-200 text-[10px]">
                  <p className="font-extrabold text-amber-950 leading-tight truncate">
                    {agg.label || `${agg.count} ${kinyarwandaTranslations.tree.unnamedCountTitle}`}
                  </p>
                  <p className="text-[9px] text-amber-700 font-medium">
                    {remaining} {kinyarwandaTranslations.tree.anonymousLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={data}
        activeRoot={activeRoot}
        treeContainerRef={containerRef}
      />
    </div>
  );
};
