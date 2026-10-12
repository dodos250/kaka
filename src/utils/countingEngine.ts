import { FamilyTreeData, Person, AggregateDescendantRecord } from '../types/genealogy';

export interface GenerationBreakdown {
  generation: number;
  generationLabel: string;
  kinyarwandaLabel: string;
  culturalDescription: string;
  namedCount: number;
  aggregateCount: number;
  totalKnownCount: number;
  namedPeople: Person[];
  aggregateRecords: AggregateDescendantRecord[];
  hasIncompleteInfo: boolean;
}

export interface DescendantStats {
  rootPerson: Person | null;
  totalNamedDescendants: number;
  totalAggregateDescendants: number;
  totalKnownDescendants: number;
  
  // Specific generational counts with Kinyarwanda terminology
  // Gen 1: Abana (Children)
  directChildrenTotal: number;
  directChildrenNamed: number;
  directChildrenAggregate: number;
  
  // Gen 2: Abuzukuru (Grandchildren)
  grandchildrenTotal: number;
  grandchildrenNamed: number;
  grandchildrenAggregate: number;
  
  // Gen 3: Abuzukuruza (Great-grandchildren)
  greatGrandchildrenTotal: number;
  greatGrandchildrenNamed: number;
  greatGrandchildrenAggregate: number;

  // Gen 4: Ubuvivi (Great-great-grandchildren)
  ubuviviTotal: number;
  ubuviviNamed: number;
  ubuviviAggregate: number;

  // Gen 5+: Ubuvivure / Later generations
  deeperGenerationsTotal: number;
  
  // Per generation map
  byGeneration: Map<number, GenerationBreakdown>;
  maxGeneration: number;
  
  // Branch metrics
  incompleteBranchCount: number;
  branchCount: number;
  largestBranch: {
    childId: string;
    childName: string;
    totalDescendants: number;
  } | null;
  
  // Audit details
  hasOverlappingAggregateRisks: boolean;
  notes: string[];
}

import { kinyarwandaTranslations } from '../translations/kinyarwanda';

/**
 * Returns Kinyarwanda traditional genealogical generation terms from the translation dictionary.
 */
export function getKinyarwandaLabel(gen: number): string {
  const g = kinyarwandaTranslations.generations;
  switch (gen) {
    case 0: return g.gen0.term;
    case 1: return g.gen1.term;
    case 2: return g.gen2.term;
    case 3: return g.gen3.term;
    case 4: return g.gen4.term;
    case 5: return g.gen5.term;
    default: return `${g.laterGenerationPrefix} ${gen}`;
  }
}

export function getGenerationLabel(gen: number): string {
  const g = kinyarwandaTranslations.generations;
  switch (gen) {
    case 0: return `${g.gen0.term} (${g.gen0.englishLabel})`;
    case 1: return `${g.gen1.term} (${g.gen1.englishLabel} - Gen 1)`;
    case 2: return `${g.gen2.term} (${g.gen2.englishLabel} - Gen 2)`;
    case 3: return `${g.gen3.term} (${g.gen3.englishLabel} - Gen 3)`;
    case 4: return `${g.gen4.term} (${g.gen4.englishLabel} - Gen 4)`;
    case 5: return `${g.gen5.term} (Gen 5)`;
    default: return `Gen ${gen} (${getKinyarwandaLabel(gen)})`;
  }
}

export function getCulturalDescription(gen: number): string {
  const g = kinyarwandaTranslations.generations;
  switch (gen) {
    case 0: return g.gen0.description;
    case 1: return g.gen1.description;
    case 2: return g.gen2.description;
    case 3: return g.gen3.description;
    case 4: return g.gen4.description;
    case 5: return g.gen5.description;
    default: return `${g.laterGenerationPrefix} ${gen} (${gen} generations removed)`;
  }
}

/**
 * Automatically computes comprehensive lineage for any person:
 * e.g. "Lineage: Mukamana Beatrice > Jean Bosco Habimana > Eric Mugisha"
 * If root is person himself, "Root Ancestor".
 */
export function computeLineagePath(
  personId: string,
  rootId: string | undefined,
  data: FamilyTreeData
): string {
  const peopleMap = new Map<string, Person>();
  for (const p of data.people) peopleMap.set(p.id, p);

  // Child -> Parent map
  const parentMap = new Map<string, string>();
  for (const rel of data.parentChild) {
    if (!parentMap.has(rel.childId)) {
      parentMap.set(rel.childId, rel.parentId);
    }
  }

  const path: string[] = [];
  let curr: string | undefined = personId;
  const visited = new Set<string>();

  while (curr && !visited.has(curr)) {
    visited.add(curr);
    const p = peopleMap.get(curr);
    if (p) path.unshift(p.fullName);
    if (rootId && curr === rootId) break;
    curr = parentMap.get(curr);
  }

  if (path.length <= 1) {
    return path[0] ? `Lineage: ${path[0]}` : 'Direct Lineage';
  }
  return path.join(' → ');
}

/**
 * Calculates descendant numbers for a given root ancestor.
 * Follows core rules:
 * 1. Named children are counted from actual parent-child links.
 * 2. Descendants counted recursively.
 * 3. Prevents duplicate counting from multiple paths/in-laws.
 * 4. Aggregate counts attached directly to the root or sub-ancestors are honored at their target generation.
 * 5. Handles overlap vs additional flags explicitly.
 */
export function calculateDescendants(
  rootId: string | undefined,
  data: FamilyTreeData
): DescendantStats {
  const emptyStats: DescendantStats = {
    rootPerson: null,
    totalNamedDescendants: 0,
    totalAggregateDescendants: 0,
    totalKnownDescendants: 0,
    directChildrenTotal: 0,
    directChildrenNamed: 0,
    directChildrenAggregate: 0,
    grandchildrenTotal: 0,
    grandchildrenNamed: 0,
    grandchildrenAggregate: 0,
    greatGrandchildrenTotal: 0,
    greatGrandchildrenNamed: 0,
    greatGrandchildrenAggregate: 0,
    ubuviviTotal: 0,
    ubuviviNamed: 0,
    ubuviviAggregate: 0,
    deeperGenerationsTotal: 0,
    byGeneration: new Map(),
    maxGeneration: 0,
    incompleteBranchCount: 0,
    branchCount: 0,
    largestBranch: null,
    hasOverlappingAggregateRisks: false,
    notes: [],
  };

  if (!rootId) return emptyStats;
  const rootPerson = data.people.find(p => p.id === rootId);
  if (!rootPerson) return emptyStats;

  // Build lookup maps
  const childMap = new Map<string, string[]>();
  for (const rel of data.parentChild) {
    const list = childMap.get(rel.parentId) || [];
    if (!list.includes(rel.childId)) {
      list.push(rel.childId);
    }
    childMap.set(rel.parentId, list);
  }

  const peopleMap = new Map<string, Person>();
  for (const p of data.people) {
    peopleMap.set(p.id, p);
  }

  // Aggregate lookup: ancestorId -> AggregateDescendantRecord[]
  const aggregateMap = new Map<string, AggregateDescendantRecord[]>();
  for (const agg of data.aggregates) {
    const list = aggregateMap.get(agg.ancestorId) || [];
    list.push(agg);
    aggregateMap.set(agg.ancestorId, list);
  }

  // BFS / DFS to map all named descendants and their minimum generation distance from root
  const visitedGen = new Map<string, number>(); // personId -> generation
  const queue: Array<{ id: string; gen: number }> = [{ id: rootId, gen: 0 }];
  visitedGen.set(rootId, 0);

  const genNamedPeople = new Map<number, Set<string>>();
  const branchChildDescendantCount = new Map<string, number>();

  let incompleteBranches = 0;

  // Find direct children
  const directChildIds = childMap.get(rootId) || [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const curChildren = childMap.get(current.id) || [];
    
    // Check if this node has marked incomplete branches
    const curAggs = aggregateMap.get(current.id) || [];
    if (curAggs.some(a => a.isIncompleteBranch)) {
      incompleteBranches++;
    }

    for (const childId of curChildren) {
      if (!visitedGen.has(childId)) {
        const nextGen = current.gen + 1;
        visitedGen.set(childId, nextGen);
        queue.push({ id: childId, gen: nextGen });

        if (!genNamedPeople.has(nextGen)) {
          genNamedPeople.set(nextGen, new Set());
        }
        genNamedPeople.get(nextGen)!.add(childId);
      }
    }
  }

  // Calculate branch sizes for each direct child branch
  for (const childId of directChildIds) {
    const subQueue: string[] = [childId];
    const subVisited = new Set<string>([childId]);
    let branchTotal = 1; // counts the child themselves

    while (subQueue.length > 0) {
      const cur = subQueue.shift()!;
      // add named descendants of this sub-node
      const subKids = childMap.get(cur) || [];
      for (const k of subKids) {
        if (!subVisited.has(k)) {
          subVisited.add(k);
          subQueue.push(k);
          branchTotal++;
        }
      }
      // add aggregates belonging to this descendant
      const subAggs = aggregateMap.get(cur) || [];
      for (const sa of subAggs) {
        const count = Math.max(0, sa.count - (sa.reconciledNamedCount || 0));
        branchTotal += count;
      }
    }
    branchChildDescendantCount.set(childId, branchTotal);
  }

  // Now collect aggregate counts by relative generation from root
  const genAggregates = new Map<number, AggregateDescendantRecord[]>();
  const auditNotes: string[] = [];
  let hasOverlapWarning = false;

  for (const [nodeId, nodeGen] of visitedGen.entries()) {
    const aggs = aggregateMap.get(nodeId) || [];
    for (const agg of aggs) {
      const targetGen = nodeGen + agg.generationOffset;
      const list = genAggregates.get(targetGen) || [];
      list.push(agg);
      genAggregates.set(targetGen, list);

      if (agg.generationOffset === 1 && !agg.isConfirmedAdditional) {
        const namedKids = childMap.get(nodeId) || [];
        if (namedKids.length > 0) {
          const person = peopleMap.get(nodeId);
          hasOverlapWarning = true;
          auditNotes.push(
            `Notice: ${person?.fullName || 'Node'} has both ${namedKids.length} named child(ren) and a count record of ${agg.count}. Displaying reconciliation.`
          );
        }
      }
    }
  }

  // Determine maximum generation
  let maxGen = 0;
  for (const g of genNamedPeople.keys()) {
    if (g > maxGen) maxGen = g;
  }
  for (const g of genAggregates.keys()) {
    if (g > maxGen) maxGen = g;
  }
  if (maxGen === 0 && (directChildIds.length > 0 || (aggregateMap.get(rootId)?.length || 0) > 0)) {
    maxGen = 1;
  }

  // Build GenerationBreakdowns for at least up to Gen 4 (Ubuvivi)
  const byGeneration = new Map<number, GenerationBreakdown>();
  let totalNamed = 0;
  let totalAggregate = 0;
  const loopLimit = Math.max(maxGen, 4);

  for (let g = 1; g <= loopLimit; g++) {
    const namedIds = Array.from(genNamedPeople.get(g) || []);
    const namedPersons = namedIds.map(id => peopleMap.get(id)!).filter(Boolean);
    const aggs = genAggregates.get(g) || [];

    let aggTotal = 0;
    let incompleteFlag = false;

    for (const agg of aggs) {
      if (agg.isIncompleteBranch) incompleteFlag = true;
      const remaining = Math.max(0, agg.count - (agg.reconciledNamedCount || 0));
      aggTotal += remaining;
    }

    const totalForGen = namedPersons.length + aggTotal;
    totalNamed += namedPersons.length;
    totalAggregate += aggTotal;

    byGeneration.set(g, {
      generation: g,
      generationLabel: getGenerationLabel(g),
      kinyarwandaLabel: getKinyarwandaLabel(g),
      culturalDescription: getCulturalDescription(g),
      namedCount: namedPersons.length,
      aggregateCount: aggTotal,
      totalKnownCount: totalForGen,
      namedPeople: namedPersons,
      aggregateRecords: aggs,
      hasIncompleteInfo: incompleteFlag,
    });
  }

  // Find largest branch
  let largestBranch: DescendantStats['largestBranch'] = null;
  let maxBranchCount = -1;
  for (const [childId, count] of branchChildDescendantCount.entries()) {
    if (count > maxBranchCount) {
      maxBranchCount = count;
      const child = peopleMap.get(childId);
      largestBranch = {
        childId,
        childName: child?.fullName || 'Unknown',
        totalDescendants: count,
      };
    }
  }

  const gen1 = byGeneration.get(1);
  const gen2 = byGeneration.get(2);
  const gen3 = byGeneration.get(3);
  const gen4 = byGeneration.get(4);

  // Deeper generations (Gen 5+)
  let deeperSum = 0;
  for (let g = 5; g <= loopLimit; g++) {
    deeperSum += byGeneration.get(g)?.totalKnownCount || 0;
  }

  return {
    rootPerson,
    totalNamedDescendants: totalNamed,
    totalAggregateDescendants: totalAggregate,
    totalKnownDescendants: totalNamed + totalAggregate,
    
    // Gen 1: Abana
    directChildrenTotal: gen1 ? gen1.totalKnownCount : 0,
    directChildrenNamed: gen1 ? gen1.namedCount : 0,
    directChildrenAggregate: gen1 ? gen1.aggregateCount : 0,

    // Gen 2: Abuzukuru
    grandchildrenTotal: gen2 ? gen2.totalKnownCount : 0,
    grandchildrenNamed: gen2 ? gen2.namedCount : 0,
    grandchildrenAggregate: gen2 ? gen2.aggregateCount : 0,

    // Gen 3: Abuzukuruza
    greatGrandchildrenTotal: gen3 ? gen3.totalKnownCount : 0,
    greatGrandchildrenNamed: gen3 ? gen3.namedCount : 0,
    greatGrandchildrenAggregate: gen3 ? gen3.aggregateCount : 0,

    // Gen 4: Ubuvivi
    ubuviviTotal: gen4 ? gen4.totalKnownCount : 0,
    ubuviviNamed: gen4 ? gen4.namedCount : 0,
    ubuviviAggregate: gen4 ? gen4.aggregateCount : 0,

    // Gen 5+: Ubuvivure
    deeperGenerationsTotal: deeperSum,

    byGeneration,
    maxGeneration: Math.max(maxGen, 1),
    incompleteBranchCount: incompleteBranches,
    branchCount: directChildIds.length,
    largestBranch,
    hasOverlappingAggregateRisks: hasOverlapWarning,
    notes: auditNotes,
  };
}
