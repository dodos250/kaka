import { FamilyTreeData, Person, ParentChildRelationship, SpouseRelationship, AggregateDescendantRecord } from '../types/genealogy';

export const DEMO_DATASET_ID = 'demo-mukamana-seed';

// Canonical demo IDs from the Mukamana initial seed
export const DEMO_PERSON_IDS = new Set([
  'p-mukamana',
  'p-gaspard',
  'p-jean',
  'p-marie',
  'p-peter',
  'p-eric',
  'p-alice',
  'p-diane',
]);

export const DEMO_AGGREGATE_IDS = new Set([
  'agg-eric-kids',
  'agg-marie-kids',
  'agg-peter-kids',
]);

export const DEMO_REL_IDS = new Set([
  'rel-1', 'rel-2', 'rel-3', 'rel-4', 'rel-5', 'rel-6', 'rel-7', 'rel-8', 'rel-9'
]);

export const DEMO_SPOUSE_IDS = new Set(['sp-1']);

// Explicit unmodified demo names from the Mukamana sample lineage
export const DEMO_SAMPLE_NAMES = new Set([
  'Mukamana Beatrice',
  'Gaspard Karemera',
  'Jean Bosco Habimana',
  'Marie Claire Uwamahoro',
  'Peter Ndahiro',
  'Eric Mugisha',
  'Alice Umutoni',
  'Diane Keza',
]);

/**
 * Checks if a record is definitely demo data.
 * CRITICAL RULE: If a person's name was entered or customized by the user,
 * or if isDemo is explicitly false, it is NEVER classified as demo data!
 */
export function isDemoPerson(person: Person): boolean {
  if (person.isDemo === false) return false;
  // If the user modified the person's name, it is REAL user data!
  if (!DEMO_SAMPLE_NAMES.has(person.fullName)) return false;
  if (person.isDemo === true) return true;
  if (person.datasetId === DEMO_DATASET_ID) return true;
  if (DEMO_PERSON_IDS.has(person.id) && person.createdAt === 1710000000000) {
    return true;
  }
  return false;
}

export function isDemoAggregate(agg: AggregateDescendantRecord): boolean {
  if (agg.isDemo === false) return false;
  if (agg.isDemo === true && DEMO_AGGREGATE_IDS.has(agg.id)) return true;
  if (agg.datasetId === DEMO_DATASET_ID && DEMO_AGGREGATE_IDS.has(agg.id)) return true;
  return false;
}

export function isDemoParentChild(rel: ParentChildRelationship): boolean {
  if (rel.isDemo === false) return false;
  if (rel.isDemo === true && DEMO_REL_IDS.has(rel.id)) return true;
  if (rel.datasetId === DEMO_DATASET_ID && DEMO_REL_IDS.has(rel.id)) return true;
  return false;
}

export function isDemoSpouse(sp: SpouseRelationship): boolean {
  if (sp.isDemo === false) return false;
  if (sp.isDemo === true && DEMO_SPOUSE_IDS.has(sp.id)) return true;
  if (sp.datasetId === DEMO_DATASET_ID && DEMO_SPOUSE_IDS.has(sp.id)) return true;
  return false;
}

export interface DemoAuditSummary {
  demoPeople: Person[];
  realPeople: Person[];
  demoAggregates: AggregateDescendantRecord[];
  realAggregates: AggregateDescendantRecord[];
  demoParentChild: ParentChildRelationship[];
  realParentChild: ParentChildRelationship[];
  demoSpouses: SpouseRelationship[];
  realSpouses: SpouseRelationship[];
  ambiguousPeople: Person[];
}

/**
 * Analyzes the family tree to safely distinguish demo records from user data
 */
export function analyzeDemoRecords(data: FamilyTreeData): DemoAuditSummary {
  const demoPeople: Person[] = [];
  const realPeople: Person[] = [];
  const ambiguousPeople: Person[] = [];

  for (const person of data.people) {
    if (isDemoPerson(person)) {
      demoPeople.push(person);
    } else if (DEMO_PERSON_IDS.has(person.id) && person.createdAt !== 1710000000000) {
      // It has a demo ID but might have been edited by the user!
      ambiguousPeople.push(person);
    } else {
      realPeople.push(person);
    }
  }

  const demoAggregates = data.aggregates.filter(isDemoAggregate);
  const realAggregates = data.aggregates.filter(a => !isDemoAggregate(a));

  const demoParentChild = data.parentChild.filter(isDemoParentChild);
  const realParentChild = data.parentChild.filter(r => !isDemoParentChild(r));

  const demoSpouses = data.spouses.filter(isDemoSpouse);
  const realSpouses = data.spouses.filter(s => !isDemoSpouse(s));

  return {
    demoPeople,
    realPeople,
    demoAggregates,
    realAggregates,
    demoParentChild,
    realParentChild,
    demoSpouses,
    realSpouses,
    ambiguousPeople,
  };
}

/**
 * Safely removes selected demo/target records, cleaning up any relationships
 * exclusively tied to the removed records, while preserving all real records and positions.
 */
export function removeSelectedRecords(
  data: FamilyTreeData,
  peopleIdsToRemove: Set<string>,
  aggregateIdsToRemove: Set<string>
): FamilyTreeData {
  const survivingPeople = data.people.filter(p => !peopleIdsToRemove.has(p.id));
  const survivingPeopleIds = new Set(survivingPeople.map(p => p.id));

  // Remove relationships where either person is removed
  const survivingParentChild = data.parentChild.filter(
    r => survivingPeopleIds.has(r.parentId) && survivingPeopleIds.has(r.childId)
  );

  const survivingSpouses = data.spouses.filter(
    s => survivingPeopleIds.has(s.person1Id) && survivingPeopleIds.has(s.person2Id)
  );

  // Surviving aggregates
  const survivingAggregates = data.aggregates.filter(
    a => !aggregateIdsToRemove.has(a.id) && survivingPeopleIds.has(a.ancestorId)
  );

  // Node positions cleanup for removed records
  const survivingPositions: Record<string, { x: number; y: number }> = {};
  if (data.nodePositions) {
    for (const [id, pos] of Object.entries(data.nodePositions)) {
      if (survivingPeopleIds.has(id) || survivingAggregates.some(a => a.id === id)) {
        survivingPositions[id] = pos;
      }
    }
  }

  // Active root update
  let newRootId = data.activeRootId;
  if (!newRootId || peopleIdsToRemove.has(newRootId)) {
    newRootId = survivingPeople[0]?.id || undefined;
  }

  return {
    ...data,
    people: survivingPeople,
    parentChild: survivingParentChild,
    spouses: survivingSpouses,
    aggregates: survivingAggregates,
    activeRootId: newRootId,
    nodePositions: survivingPositions,
  };
}
