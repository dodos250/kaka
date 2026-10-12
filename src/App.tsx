import React, { useState, useEffect, useRef } from 'react';
import { 
  FamilyTreeData, 
  Person, 
  AggregateDescendantRecord, 
  Gender, 
  NodePosition 
} from './types/genealogy';
import { 
  loadFamilyTree, 
  saveFamilyTree, 
  resetFamilyTree,
  importFamilyTreeJSON,
  exportFamilyTreeJSON,
  createLocalBackup,
  fetchDatabaseFamilyTree
} from './utils/storage';
import { restoredRealFamilyData } from './utils/restoredFamilyExport';
import { calculateDescendants } from './utils/countingEngine';
import { 
  generateGenealogyPDF, 
  exportDescendantBreakdownCSV,
  triggerFileDownload 
} from './utils/exportUtils';
import { analyzeDemoRecords } from './utils/demoDataCleaner';
import { CircularFamilyTreeView } from './components/CircularFamilyTreeView';
import { StatsDashboard } from './components/StatsDashboard';
import { DirectoryView } from './components/DirectoryView';
import { ReportsView } from './components/ReportsView';
import { PersonModal } from './components/PersonModal';
import { AggregateModal } from './components/AggregateModal';
import { BatchChildrenModal } from './components/BatchChildrenModal';
import { ConvertAggregateModal } from './components/ConvertAggregateModal';
import { MemberDetailDrawer } from './components/MemberDetailDrawer';
import { RemoveDemoModal } from './components/RemoveDemoModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { 
  GitFork, 
  BarChart3, 
  Users, 
  FileText, 
  UserPlus, 
  RotateCcw, 
  Upload, 
  ShieldAlert,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export function App() {
  const [data, setData] = useState<FamilyTreeData>(() => loadFamilyTree());
  const [activeTab, setActiveTab] = useState<'tree' | 'stats' | 'directory' | 'reports'>('tree');

  // History stack for Undo / Redo
  const [history, setHistory] = useState<FamilyTreeData[]>([]);
  const [future, setFuture] = useState<FamilyTreeData[]>([]);

  // Drawer & Modals state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  // Person Modal
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);

  // Aggregate Modal
  const [isAggregateModalOpen, setIsAggregateModalOpen] = useState(false);
  const [aggregateAncestor, setAggregateAncestor] = useState<Person | null>(null);
  const [editingAggregate, setEditingAggregate] = useState<AggregateDescendantRecord | null>(null);

  // Batch Children Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchParent, setBatchParent] = useState<Person | null>(null);

  // Convert Modal
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertAggregate, setConvertAggregate] = useState<AggregateDescendantRecord | null>(null);
  const [convertAncestor, setConvertAncestor] = useState<Person | null>(null);

  // Demo removal modal
  const [isRemoveDemoOpen, setIsRemoveDemoOpen] = useState(false);

  // Keyboard shortcuts modal
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Helper to commit data changes with undo tracking
  const pushState = (newData: FamilyTreeData) => {
    setHistory(prev => [...prev.slice(-25), data]);
    setFuture([]);
    setData(newData);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setFuture(prev => [data, ...prev]);
    setData(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, data]);
    setData(next);
  };

  const isInitializedRef = useRef(false);

  // Load from persistent disk database on mount
  useEffect(() => {
    fetchDatabaseFamilyTree()
      .then(dbData => {
        if (dbData && dbData.people && dbData.people.length > 0) {
          setData(dbData);
        }
      })
      .finally(() => {
        isInitializedRef.current = true;
      });
  }, []);

  // Sync to database and localStorage on data state change (only after initial load)
  useEffect(() => {
    if (!isInitializedRef.current) {
      return;
    }
    saveFamilyTree(data);
  }, [data]);

  // Current active root
  const activeRoot = data.people.find(p => p.id === (data.activeRootId || 'p-mukamana')) || data.people[0];
  const stats = calculateDescendants(activeRoot?.id, data);
  const demoAudit = analyzeDemoRecords(data);

  // Handlers for Person Creation / Editing
  const handleOpenAddPerson = (parentId?: string) => {
    setEditingPerson(null);
    setDefaultParentId(parentId);
    setIsPersonModalOpen(true);
  };

  const handleOpenEditPerson = (person: Person) => {
    setEditingPerson(person);
    setDefaultParentId(undefined);
    setIsPersonModalOpen(true);
  };

  const handleSavePerson = (
    personPayload: Partial<Person>,
    parentIds?: string[],
    spouseId?: string
  ) => {
    if (editingPerson) {
      // Update existing person
      const updatedPeople = data.people.map(p =>
        p.id === editingPerson.id
          ? { ...p, ...personPayload, updatedAt: Date.now() }
          : p
      );
      const nextData: FamilyTreeData = { ...data, people: updatedPeople };
      pushState(nextData);

      if (selectedPerson?.id === editingPerson.id) {
        setSelectedPerson(prev => prev ? { ...prev, ...personPayload, updatedAt: Date.now() } : null);
      }
    } else {
      // Create new person (explicitly marked as user data, never demo)
      const newId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newPerson: Person = {
        id: newId,
        fullName: personPayload.fullName || 'Unnamed Person',
        gender: personPayload.gender || 'unknown',
        dateOfBirth: personPayload.dateOfBirth,
        isDobEstimated: personPayload.isDobEstimated || false,
        dateOfDeath: personPayload.dateOfDeath,
        isDeceased: personPayload.isDeceased || false,
        placeOfBirth: personPayload.placeOfBirth,
        branch: personPayload.branch,
        sourceOrInformant: personPayload.sourceOrInformant,
        recordStatus: personPayload.recordStatus || 'confirmed',
        biography: personPayload.biography,
        notes: personPayload.notes,
        photoUrl: personPayload.photoUrl,
        isDemo: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newRelations = [...data.parentChild];
      if (parentIds && parentIds.length > 0) {
        for (const pId of parentIds) {
          newRelations.push({
            id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            parentId: pId,
            childId: newId,
            relationshipType: 'biological',
            isDemo: false,
          });
        }
      }

      const newSpouses = [...data.spouses];
      if (spouseId) {
        newSpouses.push({
          id: `sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          person1Id: newId,
          person2Id: spouseId,
          status: 'married',
          isDemo: false,
        });
      }

      const nextData: FamilyTreeData = {
        ...data,
        people: [...data.people, newPerson],
        parentChild: newRelations,
        spouses: newSpouses,
        activeRootId: data.activeRootId || newId,
      };
      pushState(nextData);
    }
  };

  const handleDeletePerson = (personId: string) => {
    const person = data.people.find(p => p.id === personId);
    if (!person) return;
    if (!window.confirm(`Delete ${person.fullName}? All child relationships will be removed and descendant totals updated.`)) {
      return;
    }

    const nextData: FamilyTreeData = {
      ...data,
      people: data.people.filter(p => p.id !== personId),
      parentChild: data.parentChild.filter(r => r.parentId !== personId && r.childId !== personId),
      spouses: data.spouses.filter(s => s.person1Id !== personId && s.person2Id !== personId),
      aggregates: data.aggregates.filter(a => a.ancestorId !== personId),
      activeRootId: data.activeRootId === personId ? data.people.find(p => p.id !== personId)?.id : data.activeRootId,
    };
    pushState(nextData);

    if (selectedPerson?.id === personId) {
      setSelectedPerson(null);
    }
  };

  // Node Positions Update (Manual layout mode)
  const handleUpdatePositions = (positions: Record<string, NodePosition>, mode: 'auto' | 'manual') => {
    // Save locally without breaking tree relations
    const nextData: FamilyTreeData = {
      ...data,
      nodePositions: positions,
      layoutMode: mode,
    };
    pushState(nextData);
  };

  // Batch Children Handler
  const handleOpenBatchChildren = (parent: Person) => {
    setBatchParent(parent);
    setIsBatchModalOpen(true);
  };

  const handleAddBatchChildren = (names: string[]) => {
    if (!batchParent) return;

    const newPeople: Person[] = [];
    const newRelations = [...data.parentChild];

    names.forEach((name, idx) => {
      const newId = `p-${Date.now()}-${idx}`;
      newPeople.push({
        id: newId,
        fullName: name,
        gender: 'unknown',
        branch: batchParent.branch || `${batchParent.fullName} Lineage`,
        recordStatus: 'confirmed',
        isDemo: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      newRelations.push({
        id: `rel-${Date.now()}-${idx}`,
        parentId: batchParent.id,
        childId: newId,
        relationshipType: 'biological',
        isDemo: false,
      });
    });

    const nextData: FamilyTreeData = {
      ...data,
      people: [...data.people, ...newPeople],
      parentChild: newRelations,
    };
    pushState(nextData);
  };

  // Aggregate Count Record Handlers
  const handleOpenAddAggregate = (ancestor: Person) => {
    setAggregateAncestor(ancestor);
    setEditingAggregate(null);
    setIsAggregateModalOpen(true);
  };

  const handleOpenEditAggregate = (record: AggregateDescendantRecord, ancestor: Person) => {
    setAggregateAncestor(ancestor);
    setEditingAggregate(record);
    setIsAggregateModalOpen(true);
  };

  const handleSaveAggregate = (recordData: Omit<AggregateDescendantRecord, 'id' | 'createdAt'>) => {
    if (editingAggregate) {
      const nextData: FamilyTreeData = {
        ...data,
        aggregates: data.aggregates.map(a =>
          a.id === editingAggregate.id ? { ...a, ...recordData } : a
        ),
      };
      pushState(nextData);
    } else {
      const newRecord: AggregateDescendantRecord = {
        id: `agg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ancestorId: recordData.ancestorId,
        generationOffset: recordData.generationOffset,
        count: recordData.count,
        label: recordData.label,
        notes: recordData.notes,
        isConfirmedAdditional: recordData.isConfirmedAdditional,
        reconciledNamedCount: recordData.reconciledNamedCount || 0,
        isIncompleteBranch: recordData.isIncompleteBranch || false,
        isDemo: false,
        createdAt: Date.now(),
      };
      const nextData: FamilyTreeData = {
        ...data,
        aggregates: [...data.aggregates, newRecord],
      };
      pushState(nextData);
    }
  };

  const handleDeleteAggregate = (recordId: string) => {
    if (!window.confirm('Delete this aggregate count record? This will adjust descendant totals.')) {
      return;
    }
    const nextData: FamilyTreeData = {
      ...data,
      aggregates: data.aggregates.filter(a => a.id !== recordId),
    };
    pushState(nextData);
  };

  // Progressive Aggregate Conversion Handler
  const handleOpenConvertAggregate = (record: AggregateDescendantRecord, ancestor: Person) => {
    setConvertAggregate(record);
    setConvertAncestor(ancestor);
    setIsConvertModalOpen(true);
  };

  const handleReconcileAggregate = (
    aggregateId: string,
    newPeopleList: Array<{ fullName: string; gender?: Gender }>,
    deleteIfFullyReconciled: boolean
  ) => {
    if (!convertAncestor) return;

    const newPeople: Person[] = [];
    const newRelations = [...data.parentChild];

    newPeopleList.forEach((item, idx) => {
      const newId = `p-${Date.now()}-${idx}`;
      newPeople.push({
        id: newId,
        fullName: item.fullName,
        gender: item.gender || 'unknown',
        branch: convertAncestor.branch || `${convertAncestor.fullName} Lineage`,
        recordStatus: 'confirmed',
        notes: `Converted from aggregate count record on ${convertAncestor.fullName}`,
        isDemo: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      newRelations.push({
        id: `rel-${Date.now()}-${idx}`,
        parentId: convertAncestor.id,
        childId: newId,
        relationshipType: 'biological',
        isDemo: false,
      });
    });

    const targetAgg = data.aggregates.find(a => a.id === aggregateId);
    if (!targetAgg) return;

    const newReconciledCount = (targetAgg.reconciledNamedCount || 0) + newPeopleList.length;
    const remaining = Math.max(0, targetAgg.count - newReconciledCount);

    let updatedAggregates = [...data.aggregates];
    if (remaining === 0 && deleteIfFullyReconciled) {
      updatedAggregates = updatedAggregates.filter(a => a.id !== aggregateId);
    } else {
      updatedAggregates = updatedAggregates.map(a =>
        a.id === aggregateId ? { ...a, reconciledNamedCount: newReconciledCount } : a
      );
    }

    const nextData: FamilyTreeData = {
      ...data,
      people: [...data.people, ...newPeople],
      parentChild: newRelations,
      aggregates: updatedAggregates,
    };
    pushState(nextData);
  };

  // Set Root Ancestor Handler
  const handleSetRoot = (personId: string) => {
    const nextData: FamilyTreeData = { ...data, activeRootId: personId };
    pushState(nextData);
  };

  // Purge Demo Data Handler
  const handleConfirmDemoRemoval = (cleanedData: FamilyTreeData) => {
    pushState(cleanedData);
    if (selectedPerson && !cleanedData.people.some(p => p.id === selectedPerson.id)) {
      setSelectedPerson(null);
    }
  };

  // Reset to Sample Mukamana dataset
  const handleResetData = () => {
    if (window.confirm('Reset family tree to the complete sample Mukamana lineage? Your current data will be backed up.')) {
      createLocalBackup(data);
      const fresh = resetFamilyTree();
      pushState(fresh);
      setSelectedPerson(null);
    }
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = importFamilyTreeJSON(evt.target?.result as string);
        createLocalBackup(data); // Safety backup before import
        pushState(parsed);
        alert('Family tree backup successfully restored with all relationships and positions!');
      } catch (err) {
        alert('Invalid family tree backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xl shadow-md">
              <GitFork className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                  LineageTree
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CIRCULAR NODES
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1" title="Connected to persistent disk database (database/family_tree.json)">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  DATABASE SYNC
                </span>

              </div>
              <p className="text-[11px] text-slate-400">
                Draggable canvas • Profile portraits • Persistent disk database
              </p>
            </div>
          </div>

          {/* Root Ancestor Quick Switcher */}
          {data.people.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-medium">Root:</span>
              <select
                value={activeRoot?.id || ''}
                onChange={e => handleSetRoot(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                {data.people.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.fullName} {p.branch ? `(${p.branch})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {demoAudit.demoPeople.length > 0 && (
              <button
                onClick={() => setIsRemoveDemoOpen(true)}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Remove demonstration mock records"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Remove Demo Data ({demoAudit.demoPeople.length})</span>
              </button>
            )}

            <button
              onClick={() => handleOpenAddPerson()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>

            <label className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center" title="Import JSON backup">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>



            <button
              onClick={handleResetData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              title="Reset to Mukamana Sample Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'tree'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" />
            Interactive Tree
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Descendant Statistics
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'directory'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Directory ({data.people.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Reports & Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Dynamic View rendering */}
        {activeTab === 'tree' && (
          <div className="space-y-4">
            {/* Quick status bar or empty state */}
            {data.people.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto font-black text-2xl">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Your Family Tree is Clean and Ready</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  All demonstration records have been removed. Add your root ancestor (such as a grandmother or grandfather) to start mapping your family tree.
                </p>
                <button
                  onClick={() => handleOpenAddPerson()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Root Ancestor
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-800">
                      Root Ancestor: <span className="text-blue-600">{activeRoot?.fullName}</span>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">
                      Total Descendants: <strong className="text-slate-900">{stats.totalKnownDescendants}</strong> ({stats.totalNamedDescendants} named, {stats.totalAggregateDescendants} counted)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span>Drag any node to reposition • Wheel to zoom • Space+Drag to pan</span>
                  </div>
                </div>

                <CircularFamilyTreeView
                  data={data}
                  rootId={activeRoot?.id}
                  selectedPersonId={selectedPerson?.id}
                  onSelectPerson={p => setSelectedPerson(p)}
                  onAddChild={parentId => handleOpenAddPerson(parentId)}
                  onAddAggregate={ancestor => handleOpenAddAggregate(ancestor)}
                  onConvertAggregate={(agg, ancestor) => handleOpenConvertAggregate(agg, ancestor)}
                  onUpdatePositions={handleUpdatePositions}
                  onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
                  onEditSelectedPerson={() => selectedPerson && handleOpenEditPerson(selectedPerson)}
                  onOpenAddPerson={() => handleOpenAddPerson()}
                  onDeletePersonPrompt={id => handleDeletePerson(id)}
                  canUndo={history.length > 0}
                  canRedo={future.length > 0}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'stats' && activeRoot && (
          <StatsDashboard
            rootPerson={activeRoot}
            stats={stats}
            onExportPDF={() => generateGenealogyPDF(activeRoot, data)}
            onExportCSV={() => {
              const csv = exportDescendantBreakdownCSV(activeRoot, data);
              triggerFileDownload(`${activeRoot.fullName.replace(/\s+/g, '_')}_descendants.csv`, csv, 'text/csv');
            }}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryView
            data={data}
            onSelectPerson={p => setSelectedPerson(p)}
            onEditPerson={p => handleOpenEditPerson(p)}
            onDeletePerson={id => handleDeletePerson(id)}
            onSetRoot={id => handleSetRoot(id)}
            onAddPerson={() => handleOpenAddPerson()}
          />
        )}

        {activeTab === 'reports' && (
          activeRoot ? (
            <ReportsView
              data={data}
              activeRoot={activeRoot}
              onOpenRemoveDemo={() => setIsRemoveDemoOpen(true)}
            />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              No family records present to generate reports. Please add a family member first.
            </div>
          )
        )}
      </main>

      {/* Member Details Right Drawer */}
      <MemberDetailDrawer
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        data={data}
        onEditPerson={p => handleOpenEditPerson(p)}
        onDeletePerson={id => handleDeletePerson(id)}
        onAddChild={pId => handleOpenAddPerson(pId)}
        onAddMultipleChildren={p => handleOpenBatchChildren(p)}
        onAddAggregate={ancestor => handleOpenAddAggregate(ancestor)}
        onEditAggregate={(agg, ancestor) => handleOpenEditAggregate(agg, ancestor)}
        onDeleteAggregate={aggId => handleDeleteAggregate(aggId)}
        onConvertAggregate={(agg, ancestor) => handleOpenConvertAggregate(agg, ancestor)}
        onSetRoot={id => handleSetRoot(id)}
      />

      {/* Modals */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSavePerson}
        initialPerson={editingPerson}
        defaultParentId={defaultParentId}
        allPeople={data.people}
        isRootAncestor={editingPerson?.id === activeRoot?.id}
      />

      <AggregateModal
        isOpen={isAggregateModalOpen}
        onClose={() => setIsAggregateModalOpen(false)}
        ancestor={aggregateAncestor || activeRoot}
        onSave={handleSaveAggregate}
        initialRecord={editingAggregate}
      />

      {batchParent && (
        <BatchChildrenModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          parent={batchParent}
          onAddChildren={handleAddBatchChildren}
        />
      )}

      {convertAggregate && convertAncestor && (
        <ConvertAggregateModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          aggregate={convertAggregate}
          ancestor={convertAncestor}
          onReconcile={handleReconcileAggregate}
        />
      )}

      <RemoveDemoModal
        isOpen={isRemoveDemoOpen}
        onClose={() => setIsRemoveDemoOpen(false)}
        data={data}
        onConfirmRemoval={handleConfirmDemoRemoval}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
