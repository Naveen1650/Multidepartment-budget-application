# Budget App — Backups & Version Snapshots

This directory contains standalone backup snapshots of the Implementation (IMP) ToT and Budgeting engine:

## 📦 Saved Backup Files:
1. `imp-tot-entry.backup.js` — Full IMP ToT Module (incorporating both the Event Registry Wizard with line-item checkboxes and the Annual Batch Matrix Planner).
2. `config.backup.js` — Admin Configuration Module (with Benchmark Rate Matrix, Custom Rate Fields Manager, and Activity Templates Builder for 10.1–10.8).
3. `budget-entry.backup.js` — Main Budget Entry Grid & Department routing.
4. `seed-data.backup.js` — Factory seed data for all 8 activity templates and benchmark norm rates.
5. `db.backup.js` — IndexedDB Schema (Version 8) with `impCustomRateFields` and `impActivityTemplates`.

---

## 🔄 How to Instantly Revert to Original Wizard View:
If you prefer the original Modal Wizard & Itemized Event Registry as the primary default view:
1. In `js/modules/imp-tot-entry.js`, change:
   ```javascript
   activeViewMode: 'registry', // Set to 'registry' for original wizard-only view
   ```
2. Or click the **`📋 2. Detailed Event Registry`** button at the top of the screen at any time.
