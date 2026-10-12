import React, { useState, useRef } from 'react';
import { Person, Gender, RecordStatus } from '../types/genealogy';
import { UserPlus, X, Save, Upload, Trash2, Camera, AlertCircle } from 'lucide-react';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Partial<Person>, parentIds?: string[], spouseId?: string) => void;
  initialPerson?: Person | null;
  defaultParentId?: string;
  allPeople: Person[];
  isRootAncestor?: boolean;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPerson,
  defaultParentId,
  allPeople,
  isRootAncestor = false,
}) => {
  const [fullName, setFullName] = useState(initialPerson?.fullName || '');
  const [gender, setGender] = useState<Gender>(initialPerson?.gender || 'unknown');
  const [dateOfBirth, setDateOfBirth] = useState(initialPerson?.dateOfBirth || '');
  const [isDobEstimated, setIsDobEstimated] = useState(initialPerson?.isDobEstimated || false);
  const [dateOfDeath, setDateOfDeath] = useState(initialPerson?.dateOfDeath || '');
  const [isDeceased, setIsDeceased] = useState(initialPerson?.isDeceased || false);
  const [placeOfBirth, setPlaceOfBirth] = useState(initialPerson?.placeOfBirth || '');
  const [branch, setBranch] = useState(initialPerson?.branch || '');
  const [sourceOrInformant, setSourceOrInformant] = useState(initialPerson?.sourceOrInformant || '');
  const [recordStatus, setRecordStatus] = useState<RecordStatus>(initialPerson?.recordStatus || 'confirmed');
  const [biography, setBiography] = useState(initialPerson?.biography || '');
  const [notes, setNotes] = useState(initialPerson?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPerson?.photoUrl);
  
  // Relationships for new person
  const [selectedParentId, setSelectedParentId] = useState<string>(defaultParentId || '');
  const [selectedSpouseId, setSelectedSpouseId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or update on open
  React.useEffect(() => {
    if (initialPerson) {
      setFullName(initialPerson.fullName || '');
      setGender(initialPerson.gender || 'unknown');
      setDateOfBirth(initialPerson.dateOfBirth || '');
      setIsDobEstimated(initialPerson.isDobEstimated || false);
      setDateOfDeath(initialPerson.dateOfDeath || '');
      setIsDeceased(initialPerson.isDeceased || false);
      setPlaceOfBirth(initialPerson.placeOfBirth || '');
      setBranch(initialPerson.branch || '');
      setSourceOrInformant(initialPerson.sourceOrInformant || '');
      setRecordStatus(initialPerson.recordStatus || 'confirmed');
      setBiography(initialPerson.biography || '');
      setNotes(initialPerson.notes || '');
      setPhotoUrl(initialPerson.photoUrl);
    } else {
      setFullName('');
      setGender('unknown');
      setDateOfBirth('');
      setIsDobEstimated(false);
      setDateOfDeath('');
      setIsDeceased(false);
      setPlaceOfBirth('');
      setBranch('');
      setSourceOrInformant('');
      setRecordStatus('confirmed');
      setBiography('');
      setNotes('');
      setPhotoUrl(undefined);
      setSelectedParentId(defaultParentId || '');
      setSelectedSpouseId('');
    }
  }, [initialPerson, defaultParentId, isOpen]);

  if (!isOpen) return null;

  // Handle Photo File Upload (Convert to permanent Data URL and validate)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    onSave(
      {
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth.trim() || undefined,
        isDobEstimated,
        dateOfDeath: isDeceased ? dateOfDeath.trim() || undefined : undefined,
        isDeceased,
        placeOfBirth: placeOfBirth.trim() || undefined,
        branch: branch.trim() || undefined,
        sourceOrInformant: sourceOrInformant.trim() || undefined,
        recordStatus,
        biography: biography.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl: photoUrl || undefined,
      },
      selectedParentId ? [selectedParentId] : undefined,
      selectedSpouseId ? selectedSpouseId : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {initialPerson ? 'Edit Family Member' : 'Add Family Member'}
                </h2>
                {isRootAncestor && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                    Root Ancestor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {initialPerson ? `Updating records for ${initialPerson.fullName}` : 'Enter personal details, portrait, and lineage'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Photograph Upload Section (Crucial for root ancestor and all members) */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
            <div className="relative group shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-3 border-blue-500 shadow-md ring-4 ring-blue-500/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-2xl border-3 border-dashed border-slate-300">
                  {fullName ? fullName.charAt(0) : <Camera className="w-7 h-7 text-slate-400" />}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Portrait Photograph {isRootAncestor && <span className="text-blue-600 font-extrabold">(Prominent in Tree)</span>}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload JPG, PNG, or WebP portrait. Displayed in circular tree nodes.
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {photoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Mukamana Beatrice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown / Not specified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Record Status
              </label>
              <select
                value={recordStatus}
                onChange={e => setRecordStatus(e.target.value as RecordStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm bg-white"
              >
                <option value="confirmed">Confirmed</option>
                <option value="estimated">Estimated / Probable</option>
                <option value="unknown">Unverified / Oral Tradition</option>
              </select>
            </div>
          </div>

          {/* Dates & Places */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              Dates & Locations (Approximate dates supported)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date of Birth (YYYY-MM-DD or e.g. circa 1950)
                </label>
                <input
                  type="text"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  placeholder="e.g. 1954 or circa 1950"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
                <label className="mt-1 flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDobEstimated}
                    onChange={e => setIsDobEstimated(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  Mark birth date as approximate/estimated
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Place of Birth / Origin
                </label>
                <input
                  type="text"
                  value={placeOfBirth}
                  onChange={e => setPlaceOfBirth(e.target.value)}
                  placeholder="e.g. Butare, Southern Province"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isDeceased}
                    onChange={e => setIsDeceased(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  Mark as Deceased
                </label>
                {isDeceased && (
                  <input
                    type="text"
                    value={dateOfDeath}
                    onChange={e => setDateOfDeath(e.target.value)}
                    placeholder="Date or year of death (e.g. 2012)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Relationships Setup (Only if adding new person) */}
          {!initialPerson && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Immediate Family Connections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">
                    Child of (Parent)
                  </label>
                  <select
                    value={selectedParentId}
                    onChange={e => setSelectedParentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">None (Root or independent branch)</option>
                    {allPeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} {p.branch ? `(${p.branch})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">
                    Spouse / Partner of
                  </label>
                  <select
                    value={selectedSpouseId}
                    onChange={e => setSelectedSpouseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">None</option>
                    {allPeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Lineage & Informant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Branch / Lineage Tag
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {selectedParentId && (
                    <button
                      type="button"
                      onClick={() => {
                        const parent = allPeople.find(p => p.id === selectedParentId);
                        if (parent) {
                          setBranch(`${parent.fullName} Lineage`);
                        }
                      }}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      Auto-fill
                    </button>
                  )}
                  {branch && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setBranch('')}
                        className="text-slate-400 hover:text-red-500"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="Auto-populated or leave blank (e.g. Jean Branch)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Lineage is also automatically traced across parent branches in the tree.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Informant / Source
              </label>
              <input
                type="text"
                value={sourceOrInformant}
                onChange={e => setSourceOrInformant(e.target.value)}
                placeholder="e.g. Oral interview with Mukamana, 2024"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Biography & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Biography / Historical Notes
            </label>
            <textarea
              rows={3}
              value={biography}
              onChange={e => setBiography(e.target.value)}
              placeholder="Life story, milestones, occupation, accomplishments..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {initialPerson ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
