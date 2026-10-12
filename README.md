# Family Tree & Descendant Counting App (LineageTree)

A modern, interactive genealogy and family tree web application designed to track multi-generational lineages with both individually named family members and anonymous aggregate descendant counts.

## Features

- **Circular Family Tree Nodes**: Responsive circular portraits, initials avatars, deceased indicators, and lineage tags.
- **Vertical & Horizontal Layout Modes**: Toggle between Vertical (lineage flows down naturally) and Horizontal wide-tree view.
- **Hybrid Counting Engine**: Calculates generational pillars automatically (Abana, Abuzukuru, Abuzukuruza, Ubuvivi).
- **Persistent Disk Database & Local Storage**: Auto-saves directly to local storage and persistent disk database.
- **Share & Export Tools**:
  - Direct shareable link
  - High-res PNG export (`html2canvas`)
  - Formal multi-page PDF generation (`jspdf`)
  - CSV directory & breakdown export
  - JSON database backup & restore

## Getting Started

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```
