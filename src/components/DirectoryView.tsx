import React, { useState } from 'react';
import { Person, FamilyTreeData } from '../types/genealogy';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Tag, 
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface DirectoryViewProps {
  data: FamilyTreeData;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onSetRoot: (personId: string) => void;
  onAddPerson: () => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  data,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onSetRoot,
  onAddPerson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Extract distinct branches
  const branches = Array.from(
    new Set(data.people.map(p => p.branch).filter(Boolean))
  ) as string[];

  // Filtered list
  const filtered = data.people.filter(person => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      person.fullName.toLowerCase().includes(term) ||
      (person.placeOfBirth || '').toLowerCase().includes(term) ||
      (person.biography || '').toLowerCase().includes(term) ||
      (person.notes || '').toLowerCase().includes(term) ||
      (person.branch || '').toLowerCase().includes(term);

    const matchesBranch = selectedBranch === 'all' || person.branch === selectedBranch;
    const matchesStatus = statusFilter === 'all' || person.recordStatus === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Family Directory & Records</h2>
          <p className="text-xs text-slate-500">
            {data.people.length} named individuals cataloged across family lineages
          </p>
        </div>

        <button
          onClick={onAddPerson}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Family Member
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, origin, bio, notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-700"
          >
            <option value="all">All Lineage Branches</option>
            {branches.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-700"
          >
            <option value="all">All Verification Statuses</option>
            <option value="confirmed">Confirmed Records</option>
            <option value="estimated">Estimated / Probable</option>
            <option value="unknown">Unverified Oral Records</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Person</th>
              <th className="py-3.5 px-4">Dates & Origin</th>
              <th className="py-3.5 px-4">Branch Lineage</th>
              <th className="py-3.5 px-4">Verification</th>
              <th className="py-3.5 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map(person => {
                const isRoot = person.id === data.activeRootId;
                return (
                  <tr
                    key={person.id}
                    onClick={() => onSelectPerson(person)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                            person.gender === 'female' ? 'bg-pink-500' : person.gender === 'male' ? 'bg-blue-600' : 'bg-slate-600'
                          }`}>
                            {person.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {person.fullName}
                            </span>
                            {isRoot && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                ACTIVE ROOT
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {person.gender || 'Unknown gender'} {person.isDeceased && '• Deceased'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>
                        {person.dateOfBirth ? (
                          <span>{person.dateOfBirth}{person.isDobEstimated && ' (est)'}</span>
                        ) : (
                          <span className="text-slate-400 italic">No birth date</span>
                        )}
                      </div>
                      {person.placeOfBirth && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {person.placeOfBirth}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {person.branch || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        person.recordStatus === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : person.recordStatus === 'estimated'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {person.recordStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSetRoot(person.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isRoot ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                          }`}
                          title="Set as Root Ancestor"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditPerson(person)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePerson(person.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No family records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
