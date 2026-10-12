import React from 'react';
import { Person, AggregateDescendantRecord, FamilyTreeData } from '../types/genealogy';
import { 
  UserPlus, 
  Calculator, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Tag, 
  FileText,
  UserCheck
} from 'lucide-react';

interface MemberDetailDrawerProps {
  person: Person | null;
  onClose: () => void;
  data: FamilyTreeData;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onAddChild: (parentId: string) => void;
  onAddMultipleChildren: (parent: Person) => void;
  onAddAggregate: (ancestor: Person) => void;
  onEditAggregate: (record: AggregateDescendantRecord, ancestor: Person) => void;
  onDeleteAggregate: (recordId: string) => void;
  onConvertAggregate: (record: AggregateDescendantRecord, ancestor: Person) => void;
  onSetRoot: (personId: string) => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  person,
  onClose,
  data,
  onEditPerson,
  onDeletePerson,
  onAddChild,
  onAddMultipleChildren,
  onAddAggregate,
  onEditAggregate,
  onDeleteAggregate,
  onConvertAggregate,
  onSetRoot,
}) => {
  if (!person) return null;

  // Find parents
  const parentIds = data.parentChild
    .filter(rel => rel.childId === person.id)
    .map(rel => rel.parentId);
  const parents = data.people.filter(p => parentIds.includes(p.id));

  // Find spouses
  const spouseRels = data.spouses.filter(
    s => s.person1Id === person.id || s.person2Id === person.id
  );
  const spouseIds = spouseRels.map(s => (s.person1Id === person.id ? s.person2Id : s.person1Id));
  const spouses = data.people.filter(p => spouseIds.includes(p.id));

  // Find named children
  const childIds = data.parentChild
    .filter(rel => rel.parentId === person.id)
    .map(rel => rel.childId);
  const children = data.people.filter(p => childIds.includes(p.id));

  // Find aggregate records attached to this person
  const aggregates = data.aggregates.filter(a => a.ancestorId === person.id);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {person.fullName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{person.fullName}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                person.recordStatus === 'confirmed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : person.recordStatus === 'estimated'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {person.recordStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {person.gender ? person.gender.toUpperCase() : 'UNKNOWN GENDER'} 
              {person.isDeceased ? ' • Deceased' : ' • Living'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Content Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSetRoot(person.id)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Set as Root Ancestor
          </button>
          <button
            onClick={() => onEditPerson(person)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Vital Info */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Born:</strong> {person.dateOfBirth || 'Unknown date'} 
              {person.isDobEstimated && ' (Estimated)'}
            </span>
          </div>

          {person.isDeceased && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Died:</strong> {person.dateOfDeath || 'Date not recorded'}
              </span>
            </div>
          )}

          {person.placeOfBirth && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Origin:</strong> {person.placeOfBirth}
              </span>
            </div>
          )}

          {person.branch && (
            <div className="flex items-center gap-2 text-slate-600">
              <Tag className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                <strong>Branch:</strong> {person.branch}
              </span>
            </div>
          )}

          {person.sourceOrInformant && (
            <div className="flex items-center gap-2 text-slate-600">
              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Informant:</strong> {person.sourceOrInformant}
              </span>
            </div>
          )}
        </div>

        {/* Biography */}
        {person.biography && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biography</h4>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
              {person.biography}
            </p>
          </div>
        )}

        {/* Parents and Spouses */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parents & Partners</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-500 text-[10px] uppercase">Parents</p>
              {parents.length > 0 ? (
                parents.map(p => (
                  <p key={p.id} className="text-slate-800 font-medium truncate mt-0.5">
                    {p.fullName}
                  </p>
                ))
              ) : (
                <p className="text-slate-400 italic mt-0.5">Not recorded</p>
              )}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-500 text-[10px] uppercase">Partner / Spouse</p>
              {spouses.length > 0 ? (
                spouses.map(p => (
                  <p key={p.id} className="text-slate-800 font-medium truncate mt-0.5">
                    {p.fullName}
                  </p>
                ))
              ) : (
                <p className="text-slate-400 italic mt-0.5">Not recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Named Children Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Named Children ({children.length})
            </h4>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddChild(person.id)}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Add single child"
              >
                <UserPlus className="w-3 h-3" />
                Add
              </button>
              <button
                onClick={() => onAddMultipleChildren(person)}
                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                title="Add multiple children quickly"
              >
                Multiple
              </button>
            </div>
          </div>

          {children.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {children.map(child => (
                <div key={child.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <span className="font-semibold text-slate-800">{child.fullName}</span>
                  <span className="text-[11px] text-slate-400">{child.branch || ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No named children recorded directly.</p>
          )}
        </div>

        {/* Count-Only Aggregate Descendant Records */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Count-Only Records ({aggregates.length})
            </h4>
            <button
              onClick={() => onAddAggregate(person)}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Calculator className="w-3 h-3" />
              Add Count Record
            </button>
          </div>

          {aggregates.length > 0 ? (
            <div className="space-y-2">
              {aggregates.map(agg => {
                const remaining = Math.max(0, agg.count - (agg.reconciledNamedCount || 0));
                return (
                  <div
                    key={agg.id}
                    className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span>
                            {agg.count} {agg.generationOffset === 1 ? 'Children' : agg.generationOffset === 2 ? 'Grandchildren' : 'Descendants'}
                          </span>
                          {agg.isConfirmedAdditional && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold">
                              Additional
                            </span>
                          )}
                        </div>
                        {agg.label && <p className="text-amber-800 mt-0.5">{agg.label}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditAggregate(agg, person)}
                          className="p-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit count"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAggregate(agg.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Delete aggregate record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-amber-900 border-t border-amber-200/60 pt-2">
                      <span>Remaining anonymous: <strong>{remaining}</strong></span>
                      <button
                        onClick={() => onConvertAggregate(agg, person)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Convert to Named
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No aggregate count records attached.</p>
          )}
        </div>

        {/* Delete Person Warning */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={() => onDeletePerson(person.id)}
            className="w-full py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete This Record (Recalculates Tree)
          </button>
        </div>
      </div>
    </div>
  );
};
