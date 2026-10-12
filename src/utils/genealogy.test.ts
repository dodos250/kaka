import { describe, it, expect } from 'vitest';
import { sampleMukamanaFamily, migrateFamilyTreeData } from '../utils/storage';
import { analyzeDemoRecords, removeSelectedRecords, isDemoPerson } from '../utils/demoDataCleaner';
import { calculateDescendants } from '../utils/countingEngine';
import { computeAutoLayout } from '../utils/treeLayout';
import { Person } from '../types/genealogy';

describe('Genealogy Data Preservation & Demo Cleanup Regression Tests', () => {
  it('correctly identifies default demo records without false positives', () => {
    const audit = analyzeDemoRecords(sampleMukamanaFamily);
    expect(audit.demoPeople.length).toBe(8);
    expect(audit.demoAggregates.length).toBe(3);
    expect(audit.realPeople.length).toBe(0);
  });

  it('safely purges demo records while strictly preserving real family members', () => {
    // Add real user family members
    const realPerson: Person = {
      id: 'p-real-john',
      fullName: 'John Real Person',
      gender: 'male',
      dateOfBirth: '1970-01-01',
      recordStatus: 'confirmed',
      isDemo: false,
      photoUrl: 'data:image/png;base64,mock',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const treeWithRealAndDemo = {
      ...sampleMukamanaFamily,
      people: [...sampleMukamanaFamily.people, realPerson],
    };

    const audit = analyzeDemoRecords(treeWithRealAndDemo);
    expect(audit.realPeople.length).toBe(1);
    expect(audit.realPeople[0].fullName).toBe('John Real Person');

    const demoPeopleIds = new Set(audit.demoPeople.map(p => p.id));
    const demoAggIds = new Set(audit.demoAggregates.map(a => a.id));

    const cleaned = removeSelectedRecords(treeWithRealAndDemo, demoPeopleIds, demoAggIds);

    // Verify demo records are removed and real person is strictly preserved
    expect(cleaned.people.length).toBe(1);
    expect(cleaned.people[0].id).toBe('p-real-john');
    expect(cleaned.people[0].photoUrl).toBe('data:image/png;base64,mock');
    expect(cleaned.activeRootId).toBe('p-real-john');
  });

  it('preserves existing data across schema migrations (v1 to v2)', () => {
    const rawV1Data = {
      version: '1.0',
      activeRootId: 'p-user-root',
      people: [
        {
          id: 'p-user-root',
          fullName: 'Custom Grandma',
          gender: 'female',
          recordStatus: 'confirmed',
          customField: 'preserved_value',
          createdAt: 1600000000000,
          updatedAt: 1600000000000,
        },
      ],
      parentChild: [],
      spouses: [],
      aggregates: [],
    };

    const migrated = migrateFamilyTreeData(rawV1Data);
    expect(migrated.version).toBe('2.0');
    expect(migrated.people.length).toBe(1);
    expect(migrated.people[0].fullName).toBe('Custom Grandma');
    expect(migrated.people[0].customField).toBe('preserved_value');
    expect(migrated.people[0].isDemo).toBeUndefined(); // User data not marked as demo!
    expect(migrated.layoutMode).toBe('auto');
    expect(migrated.nodePositions).toEqual({});
  });

  it('moving node positions does not change descendant counts or relationships', () => {
    const initialStats = calculateDescendants('p-mukamana', sampleMukamanaFamily);
    const initialTotal = initialStats.totalKnownDescendants;

    // Simulate moving nodes
    const movedTree = {
      ...sampleMukamanaFamily,
      nodePositions: {
        'p-mukamana': { x: 500, y: 500 },
        'p-jean': { x: 1000, y: 800 },
      },
      layoutMode: 'manual' as const,
    };

    const postMoveStats = calculateDescendants('p-mukamana', movedTree);
    expect(postMoveStats.totalKnownDescendants).toBe(initialTotal);
    expect(postMoveStats.directChildrenTotal).toBe(initialStats.directChildrenTotal);
    expect(postMoveStats.grandchildrenTotal).toBe(initialStats.grandchildrenTotal);
  });

  it('computes top-down generational layout without crashing on large trees', () => {
    const layout = computeAutoLayout('p-mukamana', sampleMukamanaFamily, 'horizontal');
    expect(layout.positions['p-mukamana']).toBeDefined();
    expect(layout.positions['p-jean']).toBeDefined();
    // Mukamana (gen 0) is above Jean (gen 1)
    expect(layout.positions['p-mukamana'].y).toBeLessThan(layout.positions['p-jean'].y);
  });

  it('computes vertical generational layout where descendants expand downwards along the Y-axis', () => {
    const layout = computeAutoLayout('p-mukamana', sampleMukamanaFamily, 'vertical');
    expect(layout.positions['p-mukamana']).toBeDefined();
    expect(layout.positions['p-jean']).toBeDefined();
    // Generation progress moves along X, branches stack along Y
    expect(layout.positions['p-mukamana'].x).toBeLessThan(layout.positions['p-jean'].x);
  });


  it('correctly maps Kinyarwanda genealogical pillars (Abana, Abuzukuru, Abuzukuruza, Ubuvivi)', () => {
    const stats = calculateDescendants('p-mukamana', sampleMukamanaFamily);
    
    // Gen 1: Abana (Children: Jean, Marie, Peter = 3)
    expect(stats.directChildrenTotal).toBe(3);
    
    // Gen 2: Abuzukuru (Grandchildren: Eric, Alice + 4 from Marie + 2 from Peter = 8)
    expect(stats.grandchildrenTotal).toBe(8);

    // Gen 3: Abuzukuruza (Great-grandchildren: Diane + 3 from Eric = 4)
    expect(stats.greatGrandchildrenTotal).toBe(4);

    // Gen 4: Ubuvivi (Great-great-grandchildren)
    expect(stats.ubuviviTotal).toBe(0);

    const gen1 = stats.byGeneration.get(1);
    expect(gen1?.kinyarwandaLabel).toBe('Abana');

    const gen2 = stats.byGeneration.get(2);
    expect(gen2?.kinyarwandaLabel).toBe('Abuzukuru');

    const gen3 = stats.byGeneration.get(3);
    expect(gen3?.kinyarwandaLabel).toBe('Abuzukuruza');

    const gen4 = stats.byGeneration.get(4);
    expect(gen4?.kinyarwandaLabel).toBe('Ubuvivi');
  });
});
