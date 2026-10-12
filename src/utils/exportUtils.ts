import { FamilyTreeData, Person } from '../types/genealogy';
import { calculateDescendants, getGenerationLabel } from './countingEngine';
import jsPDF from 'jspdf';

/**
 * Generates CSV export for all named family members
 */
export function exportPeopleCSV(data: FamilyTreeData): string {
  const headers = [
    'ID',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Estimated DOB',
    'Date of Death',
    'Place of Birth',
    'Branch/Lineage',
    'Record Status',
    'Informant / Source',
    'Biography',
    'Notes',
  ];

  const rows = data.people.map(p => [
    p.id,
    `"${(p.fullName || '').replace(/"/g, '""')}"`,
    p.gender || '',
    p.dateOfBirth || '',
    p.isDobEstimated ? 'Yes' : 'No',
    p.dateOfDeath || '',
    `"${(p.placeOfBirth || '').replace(/"/g, '""')}"`,
    `"${(p.branch || '').replace(/"/g, '""')}"`,
    p.recordStatus,
    `"${(p.sourceOrInformant || '').replace(/"/g, '""')}"`,
    `"${(p.biography || '').replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generates CSV export of Descendant Breakdown for an ancestor
 */
export function exportDescendantBreakdownCSV(rootPerson: Person, data: FamilyTreeData): string {
  const stats = calculateDescendants(rootPerson.id, data);
  const headers = [
    'Generation Level',
    'Kinyarwanda Generation Term',
    'Generation Label',
    'Named Descendants',
    'Aggregate / Count-Only Descendants',
    'Total Known',
    'Has Incomplete Info Flag',
  ];

  const rows: string[][] = [];
  stats.byGeneration.forEach((genInfo, genNum) => {
    rows.push([
      genNum.toString(),
      `"${genInfo.kinyarwandaLabel}"`,
      `"${genInfo.generationLabel}"`,
      genInfo.namedCount.toString(),
      genInfo.aggregateCount.toString(),
      genInfo.totalKnownCount.toString(),
      genInfo.hasIncompleteInfo ? 'Yes' : 'No',
    ]);
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Downloads a string payload as a file in the browser
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates PDF Genealogy & Descendants Report
 */
export function generateGenealogyPDF(rootPerson: Person, data: FamilyTreeData): void {
  const stats = calculateDescendants(rootPerson.id, data);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = 20;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Family Genealogy & Descendant Report', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Lineage Anchor: ${rootPerson.fullName}`, 14, y);
  y += 12;

  // Ancestor Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 32, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Root Ancestor: ${rootPerson.fullName}`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Birth: ${rootPerson.dateOfBirth || 'Unknown'}${rootPerson.isDobEstimated ? ' (Estimated)' : ''} | Place: ${rootPerson.placeOfBirth || 'Not recorded'}`, 18, y + 14);
  doc.text(`Lineage Branch: ${rootPerson.branch || 'General'} | Status: ${rootPerson.recordStatus.toUpperCase()}`, 18, y + 20);
  doc.text(`Source/Informant: ${rootPerson.sourceOrInformant || 'Family oral record'}`, 18, y + 26);
  y += 40;

  // Core Descendant Counts Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Automatic Descendant Totals', 14, y);
  y += 6;

  // 4 metric cards
  const metrics = [
    { label: 'Total Known Descendants', val: stats.totalKnownDescendants.toString() },
    { label: 'Individually Named', val: stats.totalNamedDescendants.toString() },
    { label: 'Aggregate Count-Only', val: stats.totalAggregateDescendants.toString() },
    { label: 'Incomplete Branches', val: stats.incompleteBranchCount.toString() },
  ];

  let cardX = 14;
  for (const m of metrics) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, 42, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(m.val, cardX + 5, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cardX + 5, y + 15);
    cardX += 46;
  }
  y += 28;

  // Generation-by-Generation Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Generation-by-Generation Breakdown', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Generation', 18, y + 5);
  doc.text('Named Count', 70, y + 5);
  doc.text('Count-Only', 110, y + 5);
  doc.text('Total Known', 145, y + 5);
  doc.text('Status / Flags', 170, y + 5);
  y += 8;

  stats.byGeneration.forEach((genInfo) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(genInfo.generationLabel, 18, y + 4);
    doc.text(`${genInfo.namedCount} people`, 70, y + 4);
    doc.text(`${genInfo.aggregateCount} people`, 110, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(`${genInfo.totalKnownCount}`, 145, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(genInfo.hasIncompleteInfo ? 'Incomplete' : 'Complete', 170, y + 4);
    
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6, 196, y + 6);
    y += 7;
  });

  y += 8;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  // Branch summaries
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Branches & Hybrid Reconciliations', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const directKids = data.parentChild
    .filter(r => r.parentId === rootPerson.id)
    .map(r => data.people.find(p => p.id === r.childId))
    .filter(Boolean) as Person[];

  if (directKids.length === 0) {
    doc.text('No direct children recorded yet.', 18, y + 4);
    y += 8;
  } else {
    for (const kid of directKids) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const kidStats = calculateDescendants(kid.id, data);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${kid.fullName}`, 18, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(`Branch total: ${kidStats.totalKnownDescendants} descendants (${kidStats.totalNamedDescendants} named, ${kidStats.totalAggregateDescendants} counted)`, 70, y + 4);
      y += 6;
    }
  }

  y += 6;
  // Audit & Incomplete Notes
  if (stats.notes.length > 0) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('Data Integrity & Audit Observations:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const n of stats.notes) {
      doc.text(`- ${n}`, 16, y + 4);
      y += 5;
    }
  }

  doc.save(`${rootPerson.fullName.replace(/\s+/g, '_')}_Descendant_Report.pdf`);
}
