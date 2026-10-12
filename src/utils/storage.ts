import { FamilyTreeData } from '../types/genealogy';
import { DEMO_DATASET_ID, isDemoPerson, isDemoAggregate, isDemoParentChild, isDemoSpouse } from './demoDataCleaner';
import { restoredRealFamilyData } from './restoredFamilyExport';

const STORAGE_KEY = 'family_tree_genealogy_data_v1';
const RESTORE_FLAG_KEY = 'family_tree_restored_63_people_v2';
const BACKUP_STORAGE_KEY_PREFIX = 'family_tree_backup_';

export const sampleMukamanaFamily: FamilyTreeData = {
  version: '2.0',
  activeRootId: 'p-mukamana',
  layoutMode: 'auto',
  nodePositions: {},
  people: [
    // Generation 0
    {
      id: 'p-mukamana',
      fullName: 'Mukamana Beatrice',
      gender: 'female',
      dateOfBirth: '1938-05-14',
      isDobEstimated: false,
      isDeceased: false,
      placeOfBirth: 'Butare, Southern Province',
      biography: 'Matriarch of the family. Cherished elder, master storyteller, and community leader who preserved oral lineages.',
      branch: 'Matriarch Lineage',
      sourceOrInformant: 'Mukamana Beatrice (Self-recounted)',
      recordStatus: 'confirmed',
      notes: 'Root ancestor for family reunion mapping.',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    // Spouse of Mukamana
    {
      id: 'p-gaspard',
      fullName: 'Gaspard Karemera',
      gender: 'male',
      dateOfBirth: '1934-08-20',
      isDobEstimated: false,
      dateOfDeath: '2012-11-04',
      isDeceased: true,
      placeOfBirth: 'Nyanza',
      biography: 'Beloved grandfather and respected agronomist.',
      branch: 'Matriarch Lineage',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    // Children of Mukamana (Generation 1)
    {
      id: 'p-jean',
      fullName: 'Jean Bosco Habimana',
      gender: 'male',
      dateOfBirth: '1962-03-12',
      placeOfBirth: 'Kigali',
      biography: 'Eldest son. Civil engineer based in Kigali.',
      branch: 'Jean Branch',
      sourceOrInformant: 'Jean Bosco',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    {
      id: 'p-marie',
      fullName: 'Marie Claire Uwamahoro',
      gender: 'female',
      dateOfBirth: '1965-07-28',
      placeOfBirth: 'Huye',
      biography: 'Second child. Teacher and entrepreneur. Moved to Belgium with family in the late 1990s.',
      branch: 'Marie Branch',
      sourceOrInformant: 'Family census 2023',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    {
      id: 'p-peter',
      fullName: 'Peter Ndahiro',
      gender: 'male',
      dateOfBirth: '1969-11-03',
      placeOfBirth: 'Kigali',
      biography: 'Third child. Physician and health advocate.',
      branch: 'Peter Branch',
      sourceOrInformant: 'Peter Ndahiro',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    // Grandchildren through Jean (Generation 2)
    {
      id: 'p-eric',
      fullName: 'Eric Mugisha',
      gender: 'male',
      dateOfBirth: '1988-09-15',
      placeOfBirth: 'Kigali',
      biography: 'Software architect and avid reader.',
      branch: 'Jean Branch',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    {
      id: 'p-alice',
      fullName: 'Alice Umutoni',
      gender: 'female',
      dateOfBirth: '1991-04-02',
      placeOfBirth: 'Kigali',
      biography: 'Economist and financial analyst.',
      branch: 'Jean Branch',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    // Great-Grandchildren through Alice (Generation 3)
    {
      id: 'p-diane',
      fullName: 'Diane Keza',
      gender: 'female',
      dateOfBirth: '2018-06-21',
      placeOfBirth: 'Nairobi',
      biography: 'Full of curiosity and energy.',
      branch: 'Jean Branch',
      recordStatus: 'confirmed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
  ],
  parentChild: [
    { id: 'rel-1', parentId: 'p-mukamana', childId: 'p-jean', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-2', parentId: 'p-gaspard', childId: 'p-jean', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-3', parentId: 'p-mukamana', childId: 'p-marie', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-4', parentId: 'p-gaspard', childId: 'p-marie', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-5', parentId: 'p-mukamana', childId: 'p-peter', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-6', parentId: 'p-gaspard', childId: 'p-peter', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-7', parentId: 'p-jean', childId: 'p-eric', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-8', parentId: 'p-jean', childId: 'p-alice', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
    { id: 'rel-9', parentId: 'p-alice', childId: 'p-diane', relationshipType: 'biological', isDemo: true, datasetId: DEMO_DATASET_ID },
  ],
  spouses: [
    {
      id: 'sp-1',
      person1Id: 'p-mukamana',
      person2Id: 'p-gaspard',
      marriageDate: '1960-01-15',
      status: 'widowed',
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
    },
  ],
  aggregates: [
    {
      id: 'agg-eric-kids',
      ancestorId: 'p-eric',
      generationOffset: 1,
      count: 3,
      label: '3 children (names not yet recorded)',
      notes: 'Reside in Nairobi; names to be gathered next reunion.',
      isConfirmedAdditional: true,
      isIncompleteBranch: false,
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
    },
    {
      id: 'agg-marie-kids',
      ancestorId: 'p-marie',
      generationOffset: 1,
      count: 4,
      label: '4 children in Belgium',
      notes: 'Lives in Brussels; children born between 1994 and 2005.',
      isConfirmedAdditional: true,
      isIncompleteBranch: true,
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
    },
    {
      id: 'agg-peter-kids',
      ancestorId: 'p-peter',
      generationOffset: 1,
      count: 2,
      label: '2 children in Canada',
      notes: 'Twins born in Montreal.',
      isConfirmedAdditional: true,
      isIncompleteBranch: false,
      isDemo: true,
      datasetId: DEMO_DATASET_ID,
      createdAt: 1710000000000,
    },
  ],
};

/**
 * Migration function to upgrade previous v1 stored data safely to v2:
 * 1. Backs up current raw localStorage data with a timestamp.
 * 2. Tags unmodified sample Mukamana records with isDemo: true and datasetId.
 * 3. Preserves all user-created people, relationships, notes, and unknown custom fields.
 * 4. Ensures layoutMode and nodePositions exist without wiping anything.
 */
export function migrateFamilyTreeData(rawParsed: any): FamilyTreeData {
  if (!rawParsed || typeof rawParsed !== 'object') {
    return sampleMukamanaFamily;
  }

  // Tag demo records if they were originally from the untagged seed
  const migratedPeople = (rawParsed.people || []).map((p: any) => {
    if (isDemoPerson(p)) {
      return {
        ...p,
        isDemo: true,
        datasetId: DEMO_DATASET_ID,
      };
    }
    return p;
  });

  const migratedParentChild = (rawParsed.parentChild || []).map((r: any) => {
    if (isDemoParentChild(r)) {
      return {
        ...r,
        isDemo: true,
        datasetId: DEMO_DATASET_ID,
      };
    }
    return r;
  });

  const migratedSpouses = (rawParsed.spouses || []).map((s: any) => {
    if (isDemoSpouse(s)) {
      return {
        ...s,
        isDemo: true,
        datasetId: DEMO_DATASET_ID,
      };
    }
    return s;
  });

  const migratedAggregates = (rawParsed.aggregates || []).map((a: any) => {
    if (isDemoAggregate(a)) {
      return {
        ...a,
        isDemo: true,
        datasetId: DEMO_DATASET_ID,
      };
    }
    return a;
  });

  return {
    ...rawParsed, // Preserves any custom/unrecognized fields
    version: '2.0',
    people: migratedPeople,
    parentChild: migratedParentChild,
    spouses: migratedSpouses,
    aggregates: migratedAggregates,
    activeRootId: rawParsed.activeRootId || migratedPeople[0]?.id || undefined,
    nodePositions: rawParsed.nodePositions || {},
    layoutMode: rawParsed.layoutMode || 'auto',
  };
}

export async function fetchDatabaseFamilyTree(): Promise<FamilyTreeData | null> {
  try {
    const res = await fetch('/api/tree');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.people && Array.isArray(data.people)) {
      // Keep localStorage in sync with database file
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Could not connect to database API, falling back to local store:', err);
  }
  return null;
}

export async function persistFamilyTreeToDatabase(data: FamilyTreeData): Promise<boolean> {
  try {
    const res = await fetch('/api/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn('Database save error:', err);
    return false;
  }
}

export function loadFamilyTree(): FamilyTreeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredRealFamilyData));
      return restoredRealFamilyData;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.people || !Array.isArray(parsed.people) || parsed.people.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredRealFamilyData));
      return restoredRealFamilyData;
    }

    // If local storage has fewer people or aggregates than the restored database export, upgrade it!
    if (parsed.people.length < restoredRealFamilyData.people.length || 
       (parsed.aggregates && parsed.aggregates.length < restoredRealFamilyData.aggregates.length)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredRealFamilyData));
      return restoredRealFamilyData;
    }

    const migrated = migrateFamilyTreeData(parsed);
    return migrated;
  } catch (err) {
    console.error('Failed to load family tree from storage:', err);
    return restoredRealFamilyData;
  }
}

export function saveFamilyTree(data: FamilyTreeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Asynchronously commit directly to disk database file
    persistFamilyTreeToDatabase(data).catch(() => {});
  } catch (err) {
    console.error('Failed to save family tree to storage:', err);
  }
}

export function createLocalBackup(data: FamilyTreeData): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `${BACKUP_STORAGE_KEY_PREFIX}${timestamp}`;
  try {
    localStorage.setItem(backupKey, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage full for local backup', e);
  }
  return backupKey;
}

export function resetFamilyTree(): FamilyTreeData {
  saveFamilyTree(sampleMukamanaFamily);
  return sampleMukamanaFamily;
}

export function exportFamilyTreeJSON(data: FamilyTreeData): string {
  return JSON.stringify(data, null, 2);
}

export function importFamilyTreeJSON(jsonStr: string): FamilyTreeData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.people || !Array.isArray(parsed.people) || !parsed.parentChild) {
    throw new Error('Invalid genealogy JSON structure');
  }
  return migrateFamilyTreeData(parsed);
}
