import React, { useState, useRef, useEffect } from 'react';
import { Person, AggregateDescendantRecord, FamilyTreeData } from '../types/genealogy';
import { getGenerationLabel, calculateDescendants } from '../utils/countingEngine';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Calculator, 
  User, 
  Users, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

interface FamilyTreeViewProps {
  data: FamilyTreeData;
  rootId?: string;
  onSelectPerson: (person: Person) => void;
  onAddChild: (parentId: string) => void;
  onAddAggregate: (ancestor: Person) => void;
  onConvertAggregate: (record: AggregateDescendantRecord, ancestor: Person) => void;
  viewMode: 'complete' | 'focused';
}

interface TreeNode {
  person: Person;
  generation: number;
  children: TreeNode[];
  aggregates: AggregateDescendantRecord[];
  isExpanded: boolean;
  totalBranchDescendants: number;
}

export const FamilyTreeView: React.FC<FamilyTreeViewProps> = ({
  data,
  rootId,
  onSelectPerson,
  onAddChild,
  onAddAggregate,
  onConvertAggregate,
  viewMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Collapsed state tracking
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Center tree on load or root change
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth } = containerRef.current;
      setPosition({ x: clientWidth / 2 - 200, y: 40 });
      setScale(1);
    }
  }, [rootId, viewMode]);

  const toggleCollapse = (personId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  // Build tree hierarchy starting from root
  const activeRoot = data.people.find(p => p.id === (rootId || data.activeRootId)) || data.people[0];

  const buildTree = (person: Person, currentGen: number, visited: Set<string>): TreeNode => {
    visited.add(person.id);

    // Find children
    const childIds = data.parentChild
      .filter(rel => rel.parentId === person.id)
      .map(rel => rel.childId);

    const namedChildren = data.people.filter(
      p => childIds.includes(p.id) && !visited.has(p.id)
    );

    const aggregates = data.aggregates.filter(a => a.ancestorId === person.id);

    const childNodes: TreeNode[] = namedChildren.map(c =>
      buildTree(c, currentGen + 1, new Set(visited))
    );

    // Calculate branch descendant count
    const stats = calculateDescendants(person.id, data);

    return {
      person,
      generation: currentGen,
      children: childNodes,
      aggregates,
      isExpanded: !collapsedIds.has(person.id),
      totalBranchDescendants: stats.totalKnownDescendants,
    };
  };

  const rootTreeNode = activeRoot ? buildTree(activeRoot, 0, new Set()) : null;

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-tree-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.4, prev + delta), 2.2));
  };

  const handleResetZoom = () => {
    if (containerRef.current) {
      setPosition({ x: containerRef.current.clientWidth / 2 - 200, y: 40 });
      setScale(1);
    }
  };

  // Recursive tree renderer
  const renderTreeNode = (node: TreeNode) => {
    const hasChildren = node.children.length > 0 || node.aggregates.length > 0;
    const isExpanded = node.isExpanded;

    return (
      <div key={node.person.id} className="flex flex-col items-center">
        {/* Node card */}
        <div
          onClick={() => onSelectPerson(node.person)}
          className={`interactive-tree-node relative group z-10 w-72 bg-white rounded-2xl border-2 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer ${
            node.generation === 0
              ? 'border-blue-600 ring-4 ring-blue-500/10'
              : node.generation === 1
              ? 'border-indigo-400'
              : node.generation === 2
              ? 'border-teal-400'
              : 'border-slate-300'
          }`}
        >
          {/* Generation Tag Pill */}
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-xs">
            {getGenerationLabel(node.generation)}
          </div>

          <div className="p-4 pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                  node.person.gender === 'female' ? 'bg-pink-500' : node.person.gender === 'male' ? 'bg-blue-600' : 'bg-slate-700'
                }`}>
                  {node.person.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug truncate max-w-[150px]">
                    {node.person.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {node.person.dateOfBirth ? `${node.person.dateOfBirth}${node.person.isDobEstimated ? ' (est)' : ''}` : 'Birth unrecorded'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                node.person.recordStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {node.person.recordStatus}
              </span>
            </div>

            {/* Branch and Descendant counts */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
                {node.person.branch || 'Direct Branch'}
              </span>

              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {node.totalBranchDescendants} {node.totalBranchDescendants === 1 ? 'descendant' : 'descendants'}
              </span>
            </div>

            {/* Quick Action buttons */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.person.id);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-slate-700 transition flex items-center gap-1 cursor-pointer"
                title="Add child directly"
              >
                <Plus className="w-3 h-3" />
                Child
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAggregate(node.person);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-600 hover:text-white rounded-lg text-amber-800 transition flex items-center gap-1 cursor-pointer"
                title="Add count-only branch"
              >
                <Calculator className="w-3 h-3" />
                +Count
              </button>

              {hasChildren && (
                <button
                  onClick={(e) => toggleCollapse(node.person.id, e)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                  title={isExpanded ? 'Collapse descendants' : 'Expand descendants'}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Children & Aggregate Nodes Section */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center">
            {/* Vertical connector from parent */}
            <div className="w-0.5 h-8 bg-slate-300"></div>

            <div className="relative flex items-start gap-8 pt-2">
              {/* Horizontal line across children if multiple */}
              {(node.children.length + node.aggregates.length) > 1 && (
                <div 
                  className="absolute top-0 left-36 right-36 h-0.5 bg-slate-300"
                />
              )}

              {/* Render Named Children */}
              {node.children.map(child => (
                <div key={child.person.id} className="flex flex-col items-center relative">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  {renderTreeNode(child)}
                </div>
              ))}

              {/* Render Count-Only Aggregate Nodes */}
              {node.aggregates.map(agg => {
                const remaining = Math.max(0, agg.count - (agg.reconciledNamedCount || 0));
                return (
                  <div key={agg.id} className="flex flex-col items-center relative">
                    <div className="w-0.5 h-6 bg-amber-400"></div>
                    <div className="interactive-tree-node w-64 bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-amber-600" />
                          Count-Only Branch
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-200/70 rounded text-[10px]">
                          Gen +{agg.generationOffset}
                        </span>
                      </div>

                      <div className="my-2">
                        <div className="text-xl font-black text-amber-950">
                          {agg.count} {agg.generationOffset === 1 ? 'Children' : agg.generationOffset === 2 ? 'Grandchildren' : 'Descendants'}
                        </div>
                        <p className="text-xs text-amber-800 font-medium">
                          {agg.label || 'Names not individually recorded'}
                        </p>
                      </div>

                      {agg.notes && (
                        <p className="text-[11px] text-amber-700/80 italic mb-2">
                          "{agg.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-amber-800 font-semibold">
                          Anonymous: {remaining}
                        </span>
                        <button
                          onClick={() => onConvertAggregate(agg, node.person)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Convert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[680px] bg-slate-100/70 rounded-2xl border border-slate-200 overflow-hidden select-none">
      {/* Background Dots Canvas pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30" 
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Reset Zoom & Center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Generation Reference Legend */}
      <div className="absolute bottom-4 left-4 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
        <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Lineage Legend</p>
        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span> Gen 0 (Root)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Gen 1 (Children)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500"></span> Gen 2 (Grandchildren)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-amber-500 bg-amber-100"></span> Count-only Branch
          </span>
        </div>
      </div>

      {/* Draggable Pan/Zoom Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="inline-block p-12 min-w-max"
        >
          {rootTreeNode ? (
            renderTreeNode(rootTreeNode)
          ) : (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>No family records available. Click "Add Person" to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
