import { FamilyTreeData, Person, AggregateDescendantRecord, NodePosition } from '../types/genealogy';

export type TreeOrientation = 'vertical' | 'horizontal';

export interface TreeLayoutResult {
  positions: Record<string, NodePosition>;
  generations: Record<string, number>;
  canvasBounds: { minX: number; maxX: number; minY: number; maxY: number };
}

// Spacing constants for Horizontal Mode (generations top-to-bottom, branches left-to-right)
const HORIZ_LEVEL_HEIGHT = 200;
const HORIZ_NODE_SPACING_X = 180;

// Spacing constants for Vertical-First Mode (generations expand left-to-right or vertical column flow, branches arranged vertically)
const VERT_LEVEL_WIDTH = 260;
const VERT_NODE_SPACING_Y = 160;

/**
 * Computes an automatic generational layout in either:
 * - 'vertical': Lineage flows left-to-right across generations, branches stack vertically so deep families scroll down naturally.
 * - 'horizontal': Classic wide generational chart (generations top-down, branches spread horizontally).
 */
export function computeAutoLayout(
  rootPersonId: string | undefined,
  data: FamilyTreeData,
  orientation: TreeOrientation = 'horizontal'
): TreeLayoutResult {
  if (orientation === 'vertical') {
    return computeVerticalLayout(rootPersonId, data);
  }
  return computeHorizontalLayout(rootPersonId, data);
}


/**
 * Vertical-oriented tree layout:
 * - Generational levels progress horizontally: X = 120 + gen * VERT_LEVEL_WIDTH
 * - Family members and sibling branches spread out VERTICALLY: Y coordinate
 * This enables the entire family tree to expand vertically down the screen instead of stretching across thousands of horizontal pixels!
 */
export function computeVerticalLayout(
  rootPersonId: string | undefined,
  data: FamilyTreeData
): TreeLayoutResult {
  const positions: Record<string, NodePosition> = {};
  const generations: Record<string, number> = {};

  if (!rootPersonId || data.people.length === 0) {
    return {
      positions,
      generations,
      canvasBounds: { minX: 0, maxX: 900, minY: 0, maxY: 650 },
    };
  }

  const childMap = new Map<string, string[]>();
  for (const rel of data.parentChild) {
    const list = childMap.get(rel.parentId) || [];
    if (!list.includes(rel.childId)) {
      list.push(rel.childId);
    }
    childMap.set(rel.parentId, list);
  }

  const aggregateMap = new Map<string, AggregateDescendantRecord[]>();
  for (const agg of data.aggregates) {
    const list = aggregateMap.get(agg.ancestorId) || [];
    list.push(agg);
    aggregateMap.set(agg.ancestorId, list);
  }

  // Measure subtree heights (in Y dimension)
  const visited = new Set<string>();

  function getSubtreeHeight(personId: string): number {
    visited.add(personId);
    const children = (childMap.get(personId) || []).filter(c => !visited.has(c));
    const aggregates = aggregateMap.get(personId) || [];
    const totalItems = children.length + aggregates.length;

    if (totalItems === 0) return VERT_NODE_SPACING_Y;

    let height = 0;
    for (const c of children) {
      height += getSubtreeHeight(c);
    }
    height += aggregates.length * VERT_NODE_SPACING_Y;
    return Math.max(height, VERT_NODE_SPACING_Y);
  }

  visited.clear();

  let minX = 60;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  function layoutSubtreeVertical(personId: string, gen: number, topY: number, availableHeight: number) {
    generations[personId] = gen;
    const posX = 140 + gen * VERT_LEVEL_WIDTH;
    const posY = topY + availableHeight / 2;

    positions[personId] = { x: posX, y: posY };

    minX = Math.min(minX, posX - 80);
    maxX = Math.max(maxX, posX + 80);
    minY = Math.min(minY, posY - 80);
    maxY = Math.max(maxY, posY + 80);

    const children = (childMap.get(personId) || []).filter(c => !positions[c]);
    const aggregates = aggregateMap.get(personId) || [];

    let currentY = topY;

    // Distribute children vertically
    for (const childId of children) {
      const childHeight = getSubtreeHeight(childId);
      layoutSubtreeVertical(childId, gen + 1, currentY, childHeight);
      currentY += childHeight;
    }

    // Place aggregates vertically
    for (const agg of aggregates) {
      const aggX = 140 + (gen + agg.generationOffset) * VERT_LEVEL_WIDTH;
      const aggY = currentY + VERT_NODE_SPACING_Y / 2;
      positions[agg.id] = { x: aggX, y: aggY };
      generations[agg.id] = gen + agg.generationOffset;

      minX = Math.min(minX, aggX - 60);
      maxX = Math.max(maxX, aggX + 60);
      minY = Math.min(minY, aggY - 60);
      maxY = Math.max(maxY, aggY + 60);

      currentY += VERT_NODE_SPACING_Y;
    }
  }

  const rootHeight = getSubtreeHeight(rootPersonId);
  visited.clear();
  layoutSubtreeVertical(rootPersonId, 0, 80, Math.max(rootHeight, 400));

  // Position unconnected people vertically
  let orphanY = maxY + VERT_NODE_SPACING_Y;
  for (const p of data.people) {
    if (!positions[p.id]) {
      positions[p.id] = { x: 140, y: orphanY };
      generations[p.id] = 0;
      orphanY += VERT_NODE_SPACING_Y;
      maxY = Math.max(maxY, orphanY);
    }
  }

  return {
    positions,
    generations,
    canvasBounds: {
      minX: minX === Infinity ? 0 : minX,
      maxX: maxX === -Infinity ? 1000 : maxX,
      minY: minY === Infinity ? 0 : minY,
      maxY: maxY === -Infinity ? 700 : maxY,
    },
  };
}

/**
 * Classic horizontal tree layout (generations top-down, branches left-to-right).
 */
export function computeHorizontalLayout(
  rootPersonId: string | undefined,
  data: FamilyTreeData
): TreeLayoutResult {
  const positions: Record<string, NodePosition> = {};
  const generations: Record<string, number> = {};

  if (!rootPersonId || data.people.length === 0) {
    return {
      positions,
      generations,
      canvasBounds: { minX: 0, maxX: 900, minY: 0, maxY: 650 },
    };
  }

  const childMap = new Map<string, string[]>();
  for (const rel of data.parentChild) {
    const list = childMap.get(rel.parentId) || [];
    if (!list.includes(rel.childId)) {
      list.push(rel.childId);
    }
    childMap.set(rel.parentId, list);
  }

  const aggregateMap = new Map<string, AggregateDescendantRecord[]>();
  for (const agg of data.aggregates) {
    const list = aggregateMap.get(agg.ancestorId) || [];
    list.push(agg);
    aggregateMap.set(agg.ancestorId, list);
  }

  // Measure subtree widths
  const visited = new Set<string>();

  function getSubtreeWidth(personId: string): number {
    visited.add(personId);
    const children = (childMap.get(personId) || []).filter(c => !visited.has(c));
    const aggregates = aggregateMap.get(personId) || [];
    const totalItems = children.length + aggregates.length;

    if (totalItems === 0) return HORIZ_NODE_SPACING_X;

    let width = 0;
    for (const c of children) {
      width += getSubtreeWidth(c);
    }
    width += aggregates.length * HORIZ_NODE_SPACING_X;
    return Math.max(width, HORIZ_NODE_SPACING_X);
  }

  visited.clear();

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = 60;
  let maxY = -Infinity;

  function layoutSubtreeHorizontal(personId: string, gen: number, leftX: number, availableWidth: number) {
    generations[personId] = gen;
    const posX = leftX + availableWidth / 2;
    const posY = 100 + gen * HORIZ_LEVEL_HEIGHT;

    positions[personId] = { x: posX, y: posY };

    minX = Math.min(minX, posX - 80);
    maxX = Math.max(maxX, posX + 80);
    maxY = Math.max(maxY, posY + 80);

    const children = (childMap.get(personId) || []).filter(c => !positions[c]);
    const aggregates = aggregateMap.get(personId) || [];

    let currentX = leftX;

    // Distribute children horizontally
    for (const childId of children) {
      const childWidth = getSubtreeWidth(childId);
      layoutSubtreeHorizontal(childId, gen + 1, currentX, childWidth);
      currentX += childWidth;
    }

    // Place aggregates
    for (const agg of aggregates) {
      const aggX = currentX + HORIZ_NODE_SPACING_X / 2;
      const aggY = 100 + (gen + agg.generationOffset) * HORIZ_LEVEL_HEIGHT;
      positions[agg.id] = { x: aggX, y: aggY };
      generations[agg.id] = gen + agg.generationOffset;

      minX = Math.min(minX, aggX - 60);
      maxX = Math.max(maxX, aggX + 60);
      maxY = Math.max(maxY, aggY + 60);

      currentX += HORIZ_NODE_SPACING_X;
    }
  }

  const rootWidth = getSubtreeWidth(rootPersonId);
  visited.clear();
  layoutSubtreeHorizontal(rootPersonId, 0, 100, Math.max(rootWidth, 500));

  let orphanX = maxX + HORIZ_NODE_SPACING_X;
  for (const p of data.people) {
    if (!positions[p.id]) {
      positions[p.id] = { x: orphanX, y: 100 };
      generations[p.id] = 0;
      orphanX += HORIZ_NODE_SPACING_X;
      maxX = Math.max(maxX, orphanX);
    }
  }

  return {
    positions,
    generations,
    canvasBounds: {
      minX: minX === Infinity ? 0 : minX,
      maxX: maxX === -Infinity ? 1000 : maxX,
      minY,
      maxY: maxY === -Infinity ? 700 : maxY,
    },
  };
}

