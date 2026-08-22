# Noora Health — Multi-Entity Budget Planning & 5D Analytics Platform

A centralized, bottom-up financial budgeting and multi-dimensional analytics platform built for **Noora Health** across 6 legal entities, 24 functional departments, multi-currency conversion, and 5-dimensional program grant reporting for CY2026-27.

---

## 🌟 Key Features

- **Multi-Entity & Multi-Currency Architecture**:
  - 6 Legal Entities: Noora Health (US), NHIPL (India Pvt Ltd), YAIF (India Section 8), NHBD (Bangladesh), Noora Indonesia, Noora Nepal.
  - Dynamic currency conversion matrices (USD, INR, BDT, IDR, NPR) with 12-month local and USD distributions.
- **Bottom-Up Budget Entry**:
  - **Personnel Costs**: 1-click auto-population from Employee Master, increment %, NH1–NH6 banding, insurances, and gratuity/statutory bonuses.
  - **EHA Consultants & Fixed Assets**: Retainer contracts, specialized medical advisors, and IT hardware scheduling.
  - **Operating & Travel**: Transparent formula builders (Quantity × Unit Rate), flight routes, hotel per diems, and workshop logs.
  - **IMP ToT Training Programs**: Batch logistics, participant cadres, duration, and standardized training rates.
- **5-Dimensional (5D) Tagging Framework**:
  - Every line item tagged across 5 strategic dimensions:
    1. **Location** (Karnataka, MP, Punjab, Maharashtra, Central, All)
    2. **Donor / Fund** (CIFF, Mulago, CRI, Draper, General Fund, Unrestricted)
    3. **Activity Stream** (Direct Service, Training, M&E, Tech & Product, Management)
    4. **Condition Area** (Maternal & Newborn Care, Tuberculosis, Oncology, Cardiac, All)
    5. **Department & Entity**
- **Consolidation & Prior Period Variance**:
  - Real-time Total Cost Sheet rollups with automated reconciliation against CY-2025 prior period actuals/budgets.
- **Role-Based Access Control (RBAC)**:
  - 4 Configurable user roles (Super Admin, Finance Admin, Dept Head, Reviewer) with strict entity-level data isolation.
- **Comprehensive Excel Engine**:
  - Single-dimension clean sheets (`By Department`, `By Donor`, `By Location`, `By Activity`, `By Condition Area`).
  - **`5D Consolidated Report` / `5D Master Matrix`** flat dataset.
  - Full bottom-up input detail sheets for all cost categories.
- **Presentation Deck**:
  - Includes a 13-slide PowerPoint file (`Noora_Health_Budget_Platform_Demo_Deck.pptx`) and interactive HTML presentation (`presentation_deck.html`).

---

## 🚀 Getting Started

### Local Setup
No build step or server setup is required. Simply open `index.html` in any modern web browser:
1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   ```
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.

### Cloud Deployment (1-Click)
This static web application can be deployed instantly to:
- **GitHub Pages**: Go to *Repository Settings* → *Pages* → Select `main` branch → *Save*.
- **Vercel**: Import this GitHub repository into Vercel for instant automated deployments on every `git push`.
- **Netlify**: Connect your GitHub repository or drag and drop this folder into Netlify Drop.

---

## 📂 Project Structure

```text
├── index.html                  # Main application entry point
├── styles.css                  # Core design system & theme tokens
├── presentation_deck.html      # Interactive team demo presentation
├── Noora_Health_Budget_Platform_Demo_Deck.pptx # 16:9 PPT presentation
├── data/
│   └── seed-data.js            # Initial entity, department & COA seed data
├── js/
│   ├── app.js                  # Main app controller & routing
│   ├── auth.js                 # RBAC permissions & role manager
│   ├── db.js                   # IndexedDB storage layer
│   ├── utils.js                # Currency, formatting & date utilities
│   └── modules/
│       ├── budget-entry.js     # Bottom-up budgeting module
│       ├── config.js           # Master configuration (Entities, Depts, COA, Roles)
│       ├── dashboard.js        # Executive KPIs & summary charts
│       ├── excel-io.js         # Excel import/export & 5D matrix compiler
│       ├── imp-tot-entry.js    # IMP ToT training program budgets
│       ├── remarks.js          # Line item comments & audit trail
│       ├── reports.js          # 5D dimension & consolidation reports
│       └── total-cost-sheet.js # Real-time rollup & variance analysis
└── .gitignore                  # Git ignore rules
```

---

## 🔒 Confidentiality & License
Developed for **Noora Health**. Internal financial planning platform.
