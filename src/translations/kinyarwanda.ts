/**
 * ============================================================================
 * KINYARWANDA TRANSLATIONS & CULTURAL GENEALOGY TERMS
 * (INYITO N'AMAGAMBO Y'IKINYARWANDA MU KUBARURA URUBYARO)
 * ============================================================================
 * You can edit any word, title, label, or phrase in this file to fix mistakes,
 * adjust dialect preferences, or refine the terminology.
 */

export const kinyarwandaTranslations = {
  // --------------------------------------------------------------------------
  // 1. GENERATIONAL TERMS (IBISEKURU N'URUBYARO)
  // --------------------------------------------------------------------------
  generations: {
    // Generation 0: The root ancestor
    gen0: {
      term: 'Umukurambere',
      englishLabel: 'Root Ancestor',
      description: 'Inkomoko y’umuryango (Root ancestor of the lineage)',
    },
    // Generation 1: Children
    gen1: {
      term: 'Abana',
      englishLabel: 'Children',
      description: 'Urubyaro rw’imfura n’ubuheta (Direct sons & daughters)',
    },
    // Generation 2: Grandchildren
    gen2: {
      term: 'Abuzukuru',
      englishLabel: 'Grandchildren',
      description: 'Abana b’abana (Grandchildren preserving family heritage)',
    },
    // Generation 3: Great-Grandchildren
    gen3: {
      term: 'Abuzukuruza',
      englishLabel: 'Great-Grandchildren',
      description: 'Urubuto rw’abuzukuru (Great-grandchildren extending the tree)',
    },
    // Generation 4: Great-Great-Grandchildren
    gen4: {
      term: 'Ubuvivi',
      englishLabel: 'Great-Great-Grandchildren',
      description: 'Ibisekuru bya kane (Fourth generation legacy descendants)',
    },
    // Generation 5: Great-Great-Great-Grandchildren
    gen5: {
      term: 'Ubuvivure',
      englishLabel: '3x Great-Grandchildren',
      description: 'Urungano rwa gatanu rw’umuryango (Fifth generation)',
    },
    // Generic fallback for later generations
    laterGenerationPrefix: 'Urungano rwa',
  },

  // --------------------------------------------------------------------------
  // 2. DASHBOARD & STATISTICS (IMBONERAHAMWE N'IBIBARURWA)
  // --------------------------------------------------------------------------
  dashboard: {
    rootBadge: 'Umukurambere w’Umuryango',
    rootSubtitle: 'Imibare yose y’urubyaro n’ibisekuru: Abana, Abuzukuru, Abuzukuruza n’Ubuvivi',
    pdfReportBtn: 'Raporo ya PDF',
    csvExportBtn: 'Kopi ya CSV',
    sectionTitle: 'Ibisekuru n’Urubyaro rw’Umukurambere',
    totalKnown: 'Bose hamwe',
    peopleSingular: 'muntu',
    peoplePlural: 'bantu',
    namedCountSuffix: 'bafite amazina',
    aggregateCountSuffix: 'babazwe',
    allDescendantsCardTitle: 'Bose Hamwe mu Bisekuru',
    allDescendantsCardSubtitle: 'Urubyaro rwose ruzwi',
    namedCardTitle: 'Bafite Amazina',
    namedCardSubtitle: 'baziwe neza',
    aggregateCardTitle: 'Babazwe ku Mubare Gusa',
    aggregateCardSubtitle: 'bataramenyekana amazina',
    branchesCardTitle: 'Amashami y’Umuryango',
    branchesLargestPrefix: 'Ishami rinini:',
    progressTitle: 'Icyegeranyo cy’iyandikwa ry’amazina mu muryango',
    progressNamedLegend: 'Abanditse n’amazina yabo',
    progressCountLegend: 'Ababazwe ku mubare gusa',
    incompleteBranchesAlert: 'Amashami akeneye ubushakashatsi bwimbitse:',
    tableTitle: 'Imbonerahamwe y’Ibisekuru byose',
    tableSubtitle: 'Ibarwa ryikora ryita ku bisekuru byose nta kwibeshya cyangwa gukuba kabiri',
    colGeneration: 'Urungano / Igisekuru',
    colMeaning: 'Icyo bisobanura',
    colNamed: 'Abafite amazina',
    colCountOnly: 'Ababazwe ku mubare',
    colTotal: 'Bose hamwe',
    colStatus: 'Uko bihagaze',
    statusComplete: 'Birasobanutse',
    statusIncomplete: 'Haracyabura amakuru',
    auditNotesTitle: 'Amabwiriza y’Ibarura n’Umutekano w’Imibare',
  },

  // --------------------------------------------------------------------------
  // 3. TREE VIEW LABELS (IGITI CY’UMURYANGO)
  // --------------------------------------------------------------------------
  tree: {
    lineagePrefix: 'Inkomoko:',
    lineageAutoPopulated: 'Inkomoko yuzuzwa yikora',
    lineageHidden: 'Inkomoko ihishe',
    lineageToggleLabel: 'Inkomoko:',
    unnamedCountTitle: 'batanditswe amazina',
    anonymousLabel: 'bataramenyekana',
    convertAction: 'Kwandika Amazina',
    alignTreeBtn: 'Kuringaniza Igiti',
    alignVerticalBtn: 'Guhagarika (Vertical)',
    alignHorizontalBtn: 'Kuryamika (Horizontal)',
    shareTreeBtn: 'Sangiza Umuryango',
    shareModalTitle: 'Gusangiza Igiti cy’Umuryango',
    shareModalSubtitle: 'Sangiza abandi igiti cy’urubyaro ukoresheje umurongo (Link), ifoto (Image), cyangwa dosiye (JSON/PDF)',
    copyLinkBtn: 'Koporora Umurongo (Copy Link)',
    exportImageBtn: 'Gukuramo Ifoto (Export PNG)',
    exportPdfBtn: 'Gukuramo PDF (Export PDF)',
    linkCopiedToast: 'Umurongo wakoporowe!',
    deceasedSymbol: '✝',
    deceasedTooltip: 'Yitabye Imana',
    descendantsBadgeSuffix: 'urubyaro',
  },

  // --------------------------------------------------------------------------
  // 4. PERSON FORM & MODAL LABELS
  // --------------------------------------------------------------------------
  personForm: {
    branchLineageLabel: 'Ishami / Inkomoko y’Umuryango',
    branchAutoFillBtn: 'Yuzuza Yikora',
    branchClearBtn: 'Siba',
    branchPlaceholder: 'Byuzuzwa byikora cyangwa usigeze aho (urugero: Ishami rya Jean)',
    branchHelper: 'Inkomoko ikurikiranwa byikora hashingiwe ku babyeyi n’abakurambere mu giti.',
  },
};

export type KinyarwandaTranslations = typeof kinyarwandaTranslations;
