export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type RecordStatus = 'confirmed' | 'estimated' | 'unknown';

export interface Person {
  id: string;
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string; // e.g. "1954-04-12" or "circa 1950" or "1954"
  isDobEstimated?: boolean;
  dateOfDeath?: string;
  isDeceased?: boolean;
  placeOfBirth?: string;
  biography?: string;
  photoUrl?: string; // base64 or stored data URI
  branch?: string; // lineage or branch tag, e.g. "Matriarch Branch"
  sourceOrInformant?: string; // data source or informant
  recordStatus: RecordStatus;
  
  // Custom user tags/notes
  notes?: string;
  isDemo?: boolean; // explicitly marks demo/seed dataset records
  datasetId?: string; // e.g. 'demo-mukamana-seed'
  createdAt: number;
  updatedAt: number;
  [key: string]: any; // preserve any unknown or extra fields
}

export interface ParentChildRelationship {
  id: string;
  parentId: string;
  childId: string;
  relationshipType?: 'biological' | 'adoptive' | 'step';
  isDemo?: boolean;
  datasetId?: string;
  [key: string]: any;
}

export interface SpouseRelationship {
  id: string;
  person1Id: string;
  person2Id: string;
  marriageDate?: string;
  status?: 'married' | 'divorced' | 'partner' | 'widowed';
  isDemo?: boolean;
  datasetId?: string;
  [key: string]: any;
}

/**
 * An aggregate descendant record attached to a specific ancestor.
 * generationOffset: 
 *   1 = direct children of this ancestor
 *   2 = grandchildren of this ancestor
 *   3 = great-grandchildren of this ancestor, etc.
 */
export interface AggregateDescendantRecord {
  id: string;
  ancestorId: string;
  generationOffset: number; // 1 = children, 2 = grandchildren, 3 = great-grandchildren...
  count: number;
  label?: string; // e.g. "4 children from second marriage" or "Unknown grandchildren in Diaspora"
  notes?: string;
  isConfirmedAdditional: boolean; // whether explicitly additional to named children
  reconciledNamedCount?: number; // how many have been converted/reconciled into named members
  isIncompleteBranch?: boolean; // user flagged that this branch has unknown further descendants
  isDemo?: boolean;
  datasetId?: string;
  createdAt: number;
  [key: string]: any;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface FamilyTreeData {
  version: string;
  people: Person[];
  parentChild: ParentChildRelationship[];
  spouses: SpouseRelationship[];
  aggregates: AggregateDescendantRecord[];
  activeRootId?: string;
  nodePositions?: Record<string, NodePosition>; // id -> {x, y}
  layoutMode?: 'auto' | 'manual';
  [key: string]: any; // Preserve future/unrecognized fields
}
