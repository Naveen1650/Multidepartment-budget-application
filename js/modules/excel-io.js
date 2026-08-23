// ============================================================
// NOORA HEALTH BUDGET APP — Excel Import / Export Module
// Uses SheetJS (XLSX) library for importing Excel workbooks,
// specialized bulk uploads for Salary, EHA, Fixed Assets & Non-Payroll,
// and exporting formatted reports
// ============================================================

const ExcelIOModule = {
  async render(container) {
    const canViewEmployees = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'employees' }) || Auth.hasPermission('view', { category: 'config' });
    const canUploadEmployees = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'employees' }) || Auth.hasPermission('add', { category: 'employees' }) || Auth.hasPermission('edit', { category: 'config' });

    const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' }) || Auth.hasPermission('view', { category: 'other-staff' }) || Auth.hasPermission('view', { category: 'gratuity' });
    const canUploadSalaries = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'salaries' }) || Auth.hasPermission('add', { category: 'salaries' });

    const canViewOtherCosts = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-costs' }) || Auth.hasPermission('view', { category: 'travel' }) || Auth.hasPermission('view', { category: 'supplies' }) || Auth.hasPermission('view', { category: 'office' }) || Auth.hasPermission('view', { category: 'communication' }) || Auth.hasPermission('view', { category: 'professional' });
    const canUploadOtherCosts = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'other-costs' }) || Auth.hasPermission('add', { category: 'other-costs' });

    const canViewTotal = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'total-dept-cost' });
    const canUploadTotal = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'total-dept-cost' }) || Auth.hasPermission('add', { category: 'total-dept-cost' });

    const canViewConfig = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'config' });
    const canUploadConfig = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'config' }) || Auth.hasPermission('add', { category: 'config' });

    const canViewReports = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'reports' });

    const hasAnyAccess = canViewEmployees || canViewSalaries || canViewOtherCosts || canViewTotal || canViewConfig || canViewReports;

    if (!hasAnyAccess) {
      container.innerHTML = `
        <div class="page-header">
          <h2>Excel Import & Export Engine</h2>
          <p>Bulk import data, operational expenses, and export budget workbooks</p>
        </div>
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Restricted</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${(typeof Auth !== 'undefined' && Auth.getCurrentUser()?.roleName) || 'Active User'}</strong>) does not have permission to import or export budget datasets.
          </p>
        </div>
      `;
      return;
    }

    let cardsHtml = '';

    // 1. Employees Master Card
    if (canViewEmployees) {
      cardsHtml += `
        <div class="form-row mb-lg">
          <div class="card p-md" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(37, 99, 235, 0.3);">
            <div class="flex justify-between items-center mb-sm">
              <h3 style="font-size: var(--font-size-md); font-weight: 700;">👥 Bulk Upload Employees Master</h3>
              <div class="flex gap-xs">
                <button class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterData()">📊 Download Data</button>
                <button class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterTemplate()">📥 Template</button>
              </div>
            </div>
            <p class="text-secondary mb-md" style="font-size: var(--font-size-xs);">Upload full organization employee directory (Code, Name, Band, DOJ, Dept, Manager, Annual CTC).</p>
            ${canUploadEmployees ? `<button class="btn btn-primary w-full btn-sm" onclick="ConfigModule.showEmployeeMasterUploadModal()">📤 Upload Employees File</button>` : ''}
          </div>
        </div>
      `;
    }

    // 2. Non-Payroll Costs Card
    if (canViewOtherCosts) {
      cardsHtml += `
        <div class="form-row mb-lg">
          <div class="card p-md" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(139, 92, 246, 0.3);">
            <div class="flex justify-between items-center mb-sm">
              <h3 style="font-size: var(--font-size-md); font-weight: 700;">📑 Bulk Upload Non-Payroll Costs</h3>
              <div class="flex gap-xs">
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadNonPayrollData()">📊 Download Data</button>
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadNonPayrollTemplate()">📥 Template</button>
              </div>
            </div>
            <p class="text-secondary mb-md" style="font-size: var(--font-size-xs);">Upload operating expenses, travel, supplies, monthly values, and 5D tags.</p>
            ${canUploadOtherCosts ? `<button class="btn btn-primary w-full btn-sm" onclick="ExcelIOModule.showNonPayrollUploadModal()">📤 Upload Non-Payroll File</button>` : ''}
          </div>
        </div>
      `;
    }

    // 3. Total Dept Cost Card
    if (canViewTotal) {
      cardsHtml += `
        <div class="form-row mb-lg">
          <div class="card p-md" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(16, 185, 129, 0.3);">
            <div class="flex justify-between items-center mb-sm">
              <h3 style="font-size: var(--font-size-md); font-weight: 700;">📊 Bulk Upload Total Dept Cost</h3>
              <div class="flex gap-xs">
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadTotalCostData()">📊 Download Data</button>
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadTotalCostTemplate()">📥 Template</button>
              </div>
            </div>
            <p class="text-secondary mb-md" style="font-size: var(--font-size-xs);">Upload total department cost line items, accounts, monthly values, and 5D tags.</p>
            ${canUploadTotal ? `<button class="btn btn-primary w-full btn-sm" onclick="ExcelIOModule.showTotalCostUploadModal()">📤 Upload Total Dept Cost File</button>` : ''}
          </div>
        </div>
      `;
    }

    // 4. Master Data Import & Export Cards
    let bottomRowHtml = '';
    if (canViewConfig || canUploadConfig) {
      bottomRowHtml += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">📥 Import Master Data & Dimensions</div>
          </div>
          <p class="text-secondary mb-md">Upload an Excel file (.xlsx) containing sheets named <code>Department</code>, <code>Location</code>, <code>Donor</code>, <code>Condition Area</code>, or <code>Activity</code> to populate or update dimensions.</p>
          <div class="form-group">
            <input type="file" id="excelFileInput" accept=".xlsx, .xls" class="form-input">
          </div>
          <button class="btn btn-primary w-full" id="processImportBtn">Process Master Data Import</button>
        </div>
      `;
    }

    if (canViewReports) {
      bottomRowHtml += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">📤 Export Budget Workbooks</div>
          </div>
          <p class="text-secondary mb-md">Download full consolidated budget workbooks or individual entity reports in Excel format.</p>
          <div class="form-group">
            <label class="form-label">Export Type</label>
            <select class="form-select" id="exportTypeSelect">
              <option value="global-usd">Global Consolidated Budget (USD)</option>
              <option value="india-consolidated">India Consolidated (NHIPL + YAIF in INR)</option>
              <option value="full-book">Full Budget Book (All Entities & Departments)</option>
            </select>
          </div>
          <button class="btn btn-primary w-full" id="processExportBtn">Generate & Download Excel</button>
        </div>
      `;
    }

    if (bottomRowHtml) {
      cardsHtml += `<div class="form-row mb-lg">${bottomRowHtml}</div>`;
    }

    container.innerHTML = `
      <div class="page-header">
        <h2>Excel Import & Export Engine</h2>
        <p>Bulk import salary details, EHA consultants, fixed assets, master data, and export budget workbooks</p>
      </div>
      ${cardsHtml}
    `;

    if (container.querySelector('#processImportBtn')) {
      container.querySelector('#processImportBtn').addEventListener('click', () => this.handleExcelImport());
    }
    if (container.querySelector('#processExportBtn')) {
      container.querySelector('#processExportBtn').addEventListener('click', () => {
        const type = container.querySelector('#exportTypeSelect').value;
        this.exportReportToExcel(type);
      });
    }
  },

  // ════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════
  // ACTIVE BUDGET YEAR RESOLUTION HELPER
  // ════════════════════════════════════════════════════════════
  async getActiveYearObj() {
    const reportYearSelect = typeof document !== 'undefined' ? document.getElementById('reportYearSelect') : null;
    const globalYearSelect = typeof document !== 'undefined' ? document.getElementById('globalYearSelect') : null;

    let yearId = (reportYearSelect && reportYearSelect.value) ||
                 (globalYearSelect && globalYearSelect.value) ||
                 (typeof ReportsModule !== 'undefined' && ReportsModule._selectedYear) ||
                 (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._yearId) ||
                 (typeof App !== 'undefined' && App.selectedYear) ||
                 '2026';

    const years = await db.getAll(STORES.budgetYears);
    const activeYearObj = years.find(y => String(y.id) === String(yearId) || String(y.year) === String(yearId)) ||
                          years.find(y => String(y.id) === String(App?.selectedYear) || String(y.year) === String(App?.selectedYear)) ||
                          years[0] ||
                          { id: String(yearId), year: parseInt(yearId) || 2026, conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };

    return activeYearObj;
  },

  // ════════════════════════════════════════════════════════════
  // 1. SALARY DETAILS (PERSONNEL) BULK UPLOAD & TEMPLATE
  // ════════════════════════════════════════════════════════════

  async downloadSalaryData() {
    const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' });
    const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff' });
    const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity' });

    if (!canViewSalaries && !canViewOtherStaff && !canViewGratuity) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export payroll salary data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getAll(STORES.payrollPersonnel);

    let records = allRecords.filter(r => (String(r.yearId) === String(yearId) || String(r.year) === String(budgetYear)) && accessibleEntityIds.has(r.entityId));

    records = records.filter(r => {
      const subCat = r.subCategory || 'salaries-wages';
      if (subCat === 'salaries-wages' && !canViewSalaries) return false;
      if (subCat === 'other-staff-expenses' && !canViewOtherStaff) return false;
      if (subCat === 'gratuity-bonus' && !canViewGratuity) return false;
      return true;
    });

    const headers = [
      'Sub Category', 'Employee Status', 'Entity Code', 'Entity Name', 'Department Code', 'Department Name',
      'Employee Name', 'Designation', 'Date of Joining', 'Banding', 'Level',
      'Current Monthly CTC', 'New Monthly CTC', 'Increment %', 'Increment Value', 'Annual Total',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      const months = SEED_DATA.months.map((m, idx) => r.monthlyValues?.[idx] || 0);
      const subCategoryLabel = {
        'salaries-wages': 'Salaries and Wages',
        'other-staff-expenses': 'Other Staff Expenses',
        'gratuity-bonus': 'Gratuity and Bonus'
      }[r.subCategory || 'salaries-wages'] || 'Salaries and Wages';

      return [
        subCategoryLabel,
        r.employeeStatus || 'Existing',
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.name || '', r.designation || '', r.dateOfJoining || '', r.banding || '', r.level || '',
        r.currentMonthlyCTC || 0, r.newMonthlyCTC || 0, r.incrementPct || 0, r.incrementValue || 0, r.totalCY || 0,
        ...months,
        r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Personnel Salary Data');
    XLSX.writeFile(wb, `Personnel_Salary_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} Employee Salary records for CY-${budgetYear}!`, 'success');
  },

  async downloadSalaryTemplate(subCategory = 'salaries-wages') {
    const catMap = {
      'salaries-wages': 'salaries',
      'other-staff-expenses': 'other-staff',
      'gratuity-bonus': 'gratuity'
    };
    const targetCat = catMap[subCategory] || 'salaries';
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: targetCat }) && !Auth.hasPermission('edit', { category: targetCat }) && !Auth.hasPermission('add', { category: targetCat })) {
      Utils.showToast(`🔒 Access Denied: You do not have permission to download ${targetCat} templates.`, 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const budgetYear = activeYearObj.year;
    const titles = {
      'salaries-wages': { filename: `Salaries_and_Wages_Template_CY${budgetYear}.xlsx`, sheet: 'Salaries & Wages Template', label: 'Salaries & Wages' },
      'other-staff-expenses': { filename: `Other_Staff_Expenses_Template_CY${budgetYear}.xlsx`, sheet: 'Other Staff Expenses Template', label: 'Other Staff Expenses' },
      'gratuity-bonus': { filename: `Gratuity_and_Bonus_Template_CY${budgetYear}.xlsx`, sheet: 'Gratuity & Bonus Template', label: 'Gratuity & Bonus' }
    };
    const info = titles[subCategory] || titles['salaries-wages'];

    let headers = [];
    let sampleRows = [];
    let cols = [];

    if (subCategory === 'salaries-wages') {
      headers = [
        'Employee Status', 'Entity Code', 'Department Code', 'Employee Name', 'Designation', 'Date of Joining', 'Banding', 'Level',
        'Current Annual CTC', 'Current Monthly CTC', 'New Monthly CTC', 'Increment %',
        'Jan-2026', 'Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026',
        'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026',
        'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
      ];
      sampleRows = [
        [
          'Existing', 'NHIPL', 'IN-PDD-MED', 'Alice Johnson', 'Senior Software Engineer', '2024-05-15', 'NH4', 'L4',
          1800000, 150000, 165000, 10,
          165000, 165000, 165000, 165000, 165000, 165000, 165000, 165000, 165000, 165000, 165000, 165000,
          'India KA', 'NHIPL', '8.Platform Development & Management', 'General Medical & Surgical Care', 'Standard role'
        ],
        [
          'New', 'NHIPL', 'IN-PDD-MED', 'New Position (TBD)', 'Full Stack Developer', '2026-04-01', 'NH3', 'L3',
          0, 0, 120000, 0,
          0, 0, 0, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000,
          'India DL', 'NHIPL', '8.Platform Development & Management', 'All', 'Planned hire'
        ]
      ];
      cols = [
        { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 32 }, { wch: 16 }, { wch: 10 }, { wch: 8 },
        { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 24 }, { wch: 24 }
      ];
    } else if (subCategory === 'gratuity-bonus') {
      headers = [
        'Entity Code', 'Department Code', 'Employee Name', 'Designation', 'Date of Joining',
        'Jan-2026', 'Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026',
        'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026',
        'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
      ];
      sampleRows = [
        [
          'NHIPL', 'IN-PDD-MED', 'Alice Johnson', 'Senior Software Engineer', '2024-05-15',
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150000,
          'India KA', 'NHIPL', '8.Platform Development & Management', 'General Medical & Surgical Care', 'Annual gratuity/bonus'
        ],
        [
          'NHIPL', 'IN-PDD-MED', 'Bob Smith', 'Full Stack Developer', '2025-01-10',
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100000,
          'India DL', 'NHIPL', '8.Platform Development & Management', 'All', 'Annual bonus'
        ]
      ];
      cols = [
        { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 32 }, { wch: 16 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 24 }, { wch: 24 }
      ];
    } else { // other-staff-expenses
      headers = [
        'Entity Code', 'Department Code', 'Employee Name', 'Designation',
        'Jan-2026', 'Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026',
        'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026',
        'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
      ];
      sampleRows = [
        [
          'NHIPL', 'IN-PDD-MED', 'Alice Johnson', 'Senior Software Engineer',
          15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
          'India KA', 'NHIPL', '8.Platform Development & Management', 'General Medical & Surgical Care', 'Training and skill building'
        ]
      ];
      cols = [
        { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 32 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 24 }, { wch: 24 }
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, info.sheet);
    XLSX.writeFile(wb, info.filename);
    Utils.showToast(`Downloaded ${info.label} Template!`, 'success');
  },

  showSalaryUploadModal(defaultEntityId = null, defaultDeptId = null, subCategory = 'salaries-wages') {
    const catMap = {
      'salaries-wages': 'salaries',
      'other-staff-expenses': 'other-staff',
      'gratuity-bonus': 'gratuity'
    };
    const targetCat = catMap[subCategory] || 'salaries';
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: targetCat, entityId: defaultEntityId, deptId: defaultDeptId }) && !Auth.hasPermission('add', { category: targetCat, entityId: defaultEntityId, deptId: defaultDeptId })) {
      Utils.showToast(`🔒 Access Denied: You do not have permission to upload ${targetCat} data.`, 'warning');
      return;
    }

    const yearId = typeof App !== 'undefined' ? App.selectedYear : '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, defaultEntityId)) {
      Utils.showToast(`🔒 Bulk uploads are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, defaultEntityId)}". Only Draft or Active statuses allow uploads.`, 'warning');
      return;
    }

    const titles = {
      'salaries-wages': { title: '💼 Bulk Upload Salaries & Wages', label: 'Salaries & Wages' },
      'other-staff-expenses': { title: '📚 Bulk Upload Other Staff Expenses', label: 'Other Staff Expenses' },
      'gratuity-bonus': { title: '🎁 Bulk Upload Gratuity & Bonus', label: 'Gratuity & Bonus' }
    };
    const info = titles[subCategory] || titles['salaries-wages'];

    const content = `
      <form id="salaryUploadModalForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) or CSV containing ${info.label.toLowerCase()} details (names, CTC/amounts, designations, monthly values, 5D tags).</p>

        <div class="form-group mb-md">
          <label class="form-label">Select ${info.label} Excel File</label>
          <input type="file" id="modalSalaryFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
          <h4 class="mb-sm" style="font-size: var(--font-size-md);">Upload Settings</h4>
          <div class="form-group mb-sm">
            <label class="form-checkbox">
              <input type="radio" name="entityMappingMode" value="current" checked>
              <span>Assign all uploaded records to current selected Entity & Department</span>
            </label>
          </div>
          <div class="form-group mb-md">
            <label class="form-checkbox">
              <input type="radio" name="entityMappingMode" value="file">
              <span>Auto-detect Entity & Department from Excel file columns</span>
            </label>
          </div>
          <div class="form-group mb-none">
            <label class="form-label">Import Mode</label>
            <select class="form-select" id="importActionSelect">
              <option value="append">Append to existing records in department</option>
              <option value="replace">Replace existing ${info.label.toLowerCase()} records in department</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadSalaryTemplate('${subCategory}')">📥 Download Template</button>
          <span class="text-tertiary" style="font-size: var(--font-size-xs);">${info.label} sheet format</span>
        </div>
      </form>
    `;

    Utils.showModal(info.title, content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Upload & Process File',
          onClick: async () => {
            const fileInput = Utils.$('#modalSalaryFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const mappingMode = Utils.$('input[name="entityMappingMode"]:checked')?.value || 'current';
            const action = Utils.$('#importActionSelect').value;
            close();
            await this.processSalaryFile(fileInput.files[0], { defaultEntityId, defaultDeptId, mappingMode, action, subCategory });
          }
        }));
      }
    });
  },

  async processSalaryFile(file, options = {}) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames.find(s => /personnel|salary|salaries|payroll|expense|gratuity|bonus/i.test(s)) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) { Utils.showToast('Could not find salary sheet.', 'error'); return; }

        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (aoa.length === 0) { Utils.showToast('The sheet appears to be empty.', 'warning'); return; }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 25); i++) {
          const rowStr = (aoa[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('name') || rowStr.includes('designation') || rowStr.includes('ctc') || rowStr.includes('salaries') || rowStr.includes('expense')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) headerRowIdx = 0;

        const rawHeaders = aoa[headerRowIdx] || [];
        const headers = rawHeaders.map(h => String(h || '').trim());

        const findColIdx = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h.toLowerCase())));

        const colMap = {
          employeeStatus: findColIdx([/employee status/i, /status/i]),
          name: findColIdx([/name/i, /staff/i, /employee/i]),
          designation: findColIdx([/designation/i, /title/i, /role/i, /position/i]),
          dateOfJoining: findColIdx([/date of joining/i, /doj/i, /joining date/i, /join date/i]),
          banding: findColIdx([/banding/i, /band/i]),
          level: findColIdx([/level/i]),
          currentAnnualCTC: findColIdx([/annual ctc/i, /current annual/i]),
          currentMonthlyCTC: findColIdx([/current per month ctc/i, /current monthly ctc/i, /per month ctc/i, /monthly ctc/i]),
          newMonthlyCTC: findColIdx([/new ctc/i, /new monthly ctc/i]),
          incrementPct: [findColIdx([/% of increment/i, /increment %/i, /inc %/i]), findColIdx([/%/i])].find(i => i !== -1) ?? -1,
          entity: findColIdx([/entity/i, /company/i]),
          dept: findColIdx([/department/i, /dept/i, /sub department/i]),
          location: findColIdx([/location/i, /state/i, /city/i]),
          donor: findColIdx([/donor/i, /funder/i, /grant/i]),
          activity: findColIdx([/activity/i]),
          conditionArea: findColIdx([/condition/i, /care area/i, /area/i]),
          remarks: findColIdx([/remark/i, /note/i, /comment/i]),
          subCategory: findColIdx([/sub category/i, /category/i, /type/i])
        };

        const monthCols = SEED_DATA.months.map(m => headers.findIndex(h => new RegExp(m, 'i').test(h)));

        const records = [];
        const yearId = App.selectedYear || '2026';
        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);

        const targetEntityId = options.defaultEntityId || App.selectedEntity || entities[0]?.id;
        const targetDeptId = options.defaultDeptId || BudgetEntryModule.currentDeptId || departments[0]?.id;
        const targetSubCat = options.subCategory || 'salaries-wages';

        for (let i = headerRowIdx + 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row || row.length === 0) continue;
          const name = colMap.name !== -1 ? String(row[colMap.name] || '').trim() : '';
          if (!name || /^total/i.test(name) || /^sl\.?/i.test(name)) continue;

          let employeeStatus = 'Existing';
          if (colMap.employeeStatus !== -1 && row[colMap.employeeStatus]) {
            const rawStatus = String(row[colMap.employeeStatus]).trim();
            if (/new/i.test(rawStatus)) employeeStatus = 'New';
          }

          const designation = colMap.designation !== -1 ? String(row[colMap.designation] || '').trim() : '';

          let dateOfJoining = '';
          if (colMap.dateOfJoining !== -1 && row[colMap.dateOfJoining]) {
            const rawDoj = row[colMap.dateOfJoining];
            if (typeof rawDoj === 'number' && rawDoj > 20000) {
              const jsDate = new Date(Math.round((rawDoj - 25569) * 86400 * 1000));
              dateOfJoining = jsDate.toISOString().split('T')[0];
            } else {
              dateOfJoining = String(rawDoj).trim();
            }
          }

          const banding = colMap.banding !== -1 ? String(row[colMap.banding] || '').trim() : '';
          const level = colMap.level !== -1 ? String(row[colMap.level] || '').trim() : '';

          const currentAnnual = colMap.currentAnnualCTC !== -1 ? Utils.parseNumber(row[colMap.currentAnnualCTC]) : 0;
          let currentMonthly = colMap.currentMonthlyCTC !== -1 ? Utils.parseNumber(row[colMap.currentMonthlyCTC]) : 0;
          if (currentMonthly === 0 && currentAnnual > 0) currentMonthly = Math.round(currentAnnual / 12);

          let newMonthly = colMap.newMonthlyCTC !== -1 ? Utils.parseNumber(row[colMap.newMonthlyCTC]) : 0;
          const incPct = colMap.incrementPct !== -1 ? Utils.parseNumber(row[colMap.incrementPct]) : 0;
          if (newMonthly === 0 && currentMonthly > 0) {
            newMonthly = incPct > 0 ? Math.round(currentMonthly * (1 + incPct / 100)) : currentMonthly;
          }
          const incVal = Utils.calculateIncrement(currentMonthly, incPct);

          const monthlyValues = {};
          let totalCY = 0;
          SEED_DATA.months.forEach((m, mIdx) => {
            const cIdx = monthCols[mIdx];
            let val = cIdx !== undefined && cIdx !== -1 ? Utils.parseNumber(row[cIdx]) : 0;
            if (val === 0 && newMonthly > 0) val = newMonthly;
            monthlyValues[mIdx] = val;
            totalCY += val;
          });

          let rowEntityId = targetEntityId;
          let rowDeptId = targetDeptId;

          if (options.mappingMode === 'file') {
            if (colMap.entity !== -1 && row[colMap.entity]) {
              const entStr = String(row[colMap.entity]).trim().toLowerCase();
              const matchedEnt = entities.find(e => e.shortName.toLowerCase() === entStr || e.name.toLowerCase().includes(entStr));
              if (matchedEnt) rowEntityId = matchedEnt.id;
            }
            if (colMap.dept !== -1 && row[colMap.dept]) {
              const deptStr = String(row[colMap.dept]).trim().toLowerCase();
              const matchedDept = departments.find(d => d.codeTemplate.toLowerCase().includes(deptStr) || d.name.toLowerCase().includes(deptStr));
              if (matchedDept) rowDeptId = matchedDept.id;
            }
          }

          records.push({
            yearId, entityId: rowEntityId, deptId: rowDeptId,
            subCategory: (colMap.subCategory !== -1 && row[colMap.subCategory]) ? String(row[colMap.subCategory]).trim() : targetSubCat,
            employeeStatus,
            name, designation, dateOfJoining, banding, level,
            currentMonthlyCTC: currentMonthly, newMonthlyCTC: newMonthly,
            incrementPct: incPct, incrementValue: incVal,
            monthlyValues, totalCY,
            location: colMap.location !== -1 ? String(row[colMap.location] || '').trim() : '',
            donor: colMap.donor !== -1 ? String(row[colMap.donor] || '').trim() : '',
            activity: colMap.activity !== -1 ? String(row[colMap.activity] || '').trim() : '',
            conditionArea: colMap.conditionArea !== -1 ? String(row[colMap.conditionArea] || '').trim() : '',
            remarks: colMap.remarks !== -1 ? String(row[colMap.remarks] || '').trim() : ''
          });
        }

        if (records.length === 0) { Utils.showToast('No valid employee rows found.', 'warning'); return; }

        const targetEntity = entities.find(e => e.id === targetEntityId) || entities[0];
        const years = await db.getAll(STORES.budgetYears);
        const activeYearObj = years.find(y => y.id === yearId) || { conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
        const rate = activeYearObj.conversionRates?.[targetEntity?.currency] || 1.0;

        const totalSalaryCost = records.reduce((sum, r) => sum + r.totalCY, 0);
        const totalSalaryCostUSD = Utils.convertToUSD(totalSalaryCost, rate);

        const previewContent = `
          <div>
            <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
              <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div>
                  <div class="metric-label">Parsed Staff Rows</div>
                  <div class="metric-value" style="font-size: 1.5rem;">${records.length} Employees</div>
                </div>
                <div>
                  <div class="metric-label">Total Salary Budget (${targetEntity?.currency || 'Local'} & USD)</div>
                  <div class="metric-value" style="font-size: 1.3rem; color: var(--accent-primary);">${Utils.formatCurrency(totalSalaryCost, targetEntity?.currency)} ${targetEntity?.currency !== 'USD' ? `<span style="font-size: 0.85rem; color: var(--text-secondary);">(≈ ${Utils.formatCurrency(totalSalaryCostUSD, 'USD')})</span>` : ''}</div>
                </div>
                <div>
                  <div class="metric-label">Sheet Processed</div>
                  <div class="metric-value" style="font-size: 1.2rem;">${sheetName}</div>
                </div>
              </div>
            </div>

            <h4 class="mb-sm">Parsed Salary Preview (First 5 Rows)</h4>
            <div class="table-container mb-md" style="max-height: 220px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>Banding/Level</th>
                    <th class="num">Current CTC</th>
                    <th class="num">New CTC</th>
                    <th class="num">Inc %</th>
                    <th class="num">Annual Total (${targetEntity?.currency || 'Local'})</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${r.name}</strong></td>
                      <td>${r.designation}</td>
                      <td>${r.banding} / ${r.level}</td>
                      <td class="num">${Utils.formatCurrency(r.currentMonthlyCTC, targetEntity?.currency)}</td>
                      <td class="num">${Utils.formatCurrency(r.newMonthlyCTC, targetEntity?.currency)}</td>
                      <td class="num">${r.incrementPct}%</td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalCY, targetEntity?.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        Utils.showModal('Confirm Salary Bulk Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Employees`,
              onClick: async () => {
                if (options.action === 'replace') {
                  const existing = await db.getBudgetData(STORES.payrollPersonnel, yearId, targetEntityId, targetDeptId);
                  const existingInSubCat = existing.filter(ex => {
                    if (targetSubCat === 'salaries-wages') return !ex.subCategory || ex.subCategory === 'salaries-wages';
                    return ex.subCategory === targetSubCat;
                  });
                  for (const ex of existingInSubCat) await db.delete(STORES.payrollPersonnel, ex.id);
                }
                for (const rec of records) await db.add(STORES.payrollPersonnel, rec);
                Utils.showToast(`Successfully imported ${records.length} employee records!`, 'success');
                close();
                if (App.currentPage === 'budget-entry') App.renderCurrentPage();
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing salary file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 2. EHA CONSULTANTS BULK UPLOAD & TEMPLATE
  // ════════════════════════════════════════════════════════════

  async downloadEhaData() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'eha' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export EHA consultants data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getAll(STORES.payrollEHA);
    const records = allRecords.filter(r => (String(r.yearId) === String(yearId) || String(r.year) === String(budgetYear)) && accessibleEntityIds.has(r.entityId));

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name',
      'Consultant Name', 'Role / Scope',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Annual Total', 'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      const months = SEED_DATA.months.map((m, idx) => r.monthlyValues?.[idx] || 0);
      return [
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.name || '', r.role || '',
        ...months,
        r.totalCY || 0,
        r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'EHA Consultants Data');
    XLSX.writeFile(wb, `EHA_Consultants_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} EHA Consultant records for CY-${budgetYear}!`, 'success');
  },

  async downloadEhaTemplate() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'eha' }) && !Auth.hasPermission('edit', { category: 'eha' }) && !Auth.hasPermission('add', { category: 'eha' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download EHA templates.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const budgetYear = activeYearObj.year;
    const headers = [
      'Entity Code', 'Department Code', 'Consultant Name', 'Role / Scope',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Location', 'Donor', 'Activity', 'Condition Area'
    ];

    const sampleRows = [
      [
        'ENT001', 'DEPT-ENG', 'David Chen', 'Security Audit Consultant',
        25000, 25000, 25000, 25000, 25000, 25000, 0, 0, 0, 0, 0, 0,
        'Headquarters', 'General Fund', 'Security Assessment', 'Risk Management'
      ],
      [
        'ENT001', 'DEPT-ENG', 'Emma Thompson', 'UI/UX Design Consultant',
        30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 0, 0, 0, 0,
        'Remote', 'Product Budget', 'User Research', 'Product Design'
      ],
      [
        'ENT002', 'DEPT-MKT', 'Frank Rodriguez', 'SEO Strategy Consultant',
        20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
        'Branch Office', 'Marketing Budget', 'SEO Optimization', 'Digital Growth'
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 32 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'EHA Consultants Template');
    XLSX.writeFile(wb, `EHA_Consultants_Template_CY${budgetYear}.xlsx`);
    Utils.showToast('Downloaded EHA Consultants Template!', 'success');
  },

  showEhaUploadModal(defaultEntityId = null, defaultDeptId = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: 'eha', entityId: defaultEntityId, deptId: defaultDeptId }) && !Auth.hasPermission('add', { category: 'eha', entityId: defaultEntityId, deptId: defaultDeptId })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload EHA data.', 'warning');
      return;
    }
    const yearId = typeof App !== 'undefined' ? App.selectedYear : '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, defaultEntityId)) {
      Utils.showToast(`🔒 Bulk uploads are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, defaultEntityId)}". Only Draft or Active statuses allow uploads.`, 'warning');
      return;
    }

    const content = `
      <form id="ehaUploadModalForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) or CSV containing External Hired Assistance (EHA) consultant details, roles, monthly payments, and 5D tags.</p>

        <div class="form-group mb-md">
          <label class="form-label">Select EHA Excel File</label>
          <input type="file" id="modalEhaFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
          <h4 class="mb-sm" style="font-size: var(--font-size-md);">Upload Settings</h4>
          <div class="form-group mb-sm">
            <label class="form-checkbox">
              <input type="radio" name="ehaMappingMode" value="current" checked>
              <span>Assign all uploaded records to current selected Entity & Department</span>
            </label>
          </div>
          <div class="form-group mb-none">
            <label class="form-label">Import Mode</label>
            <select class="form-select" id="ehaActionSelect">
              <option value="append">Append to existing consultants in department</option>
              <option value="replace">Replace existing consultants in department</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadEhaTemplate()">📥 Download Template</button>
          <span class="text-tertiary" style="font-size: var(--font-size-xs);">EHA sheet format</span>
        </div>
      </form>
    `;

    Utils.showModal('🤝 Bulk Upload EHA Consultants', content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Upload & Process EHA File',
          onClick: async () => {
            const fileInput = Utils.$('#modalEhaFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const mappingMode = Utils.$('input[name="ehaMappingMode"]:checked')?.value || 'current';
            const action = Utils.$('#ehaActionSelect').value;
            close();
            await this.processEhaFile(fileInput.files[0], { defaultEntityId, defaultDeptId, mappingMode, action });
          }
        }));
      }
    });
  },

  async processEhaFile(file, options = {}) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames.find(s => /eha|consultant|contractor/i.test(s)) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) { Utils.showToast('Could not find EHA sheet.', 'error'); return; }

        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (aoa.length === 0) { Utils.showToast('The sheet appears to be empty.', 'warning'); return; }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 25); i++) {
          const rowStr = (aoa[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('consultant') || rowStr.includes('name') || rowStr.includes('role')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) headerRowIdx = 0;

        const rawHeaders = aoa[headerRowIdx] || [];
        const headers = rawHeaders.map(h => String(h || '').trim());
        const findColIdx = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h.toLowerCase())));

        const colMap = {
          name: findColIdx([/consultant/i, /name/i, /resource/i]),
          role: findColIdx([/role/i, /scope/i, /designation/i, /title/i]),
          location: findColIdx([/location/i, /state/i]),
          donor: findColIdx([/donor/i, /funder/i]),
          activity: findColIdx([/activity/i]),
          conditionArea: findColIdx([/condition/i, /care area/i])
        };

        const monthCols = SEED_DATA.months.map(m => headers.findIndex(h => new RegExp(m, 'i').test(h)));

        const records = [];
        const yearId = App.selectedYear || '2026';
        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);

        const targetEntityId = options.defaultEntityId || App.selectedEntity || entities[0]?.id;
        const targetDeptId = options.defaultDeptId || BudgetEntryModule.currentDeptId || departments[0]?.id;

        for (let i = headerRowIdx + 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row || row.length === 0) continue;
          const name = colMap.name !== -1 ? String(row[colMap.name] || '').trim() : '';
          if (!name || /^total/i.test(name) || /^sl\.?/i.test(name)) continue;

          const role = colMap.role !== -1 ? String(row[colMap.role] || '').trim() : '';

          const monthlyValues = {};
          let totalCY = 0;
          SEED_DATA.months.forEach((m, mIdx) => {
            const cIdx = monthCols[mIdx];
            const val = cIdx !== undefined && cIdx !== -1 ? Utils.parseNumber(row[cIdx]) : 0;
            monthlyValues[mIdx] = val;
            totalCY += val;
          });

          records.push({
            yearId, entityId: targetEntityId, deptId: targetDeptId,
            name, role, monthlyValues, totalCY,
            location: colMap.location !== -1 ? String(row[colMap.location] || '').trim() : '',
            donor: colMap.donor !== -1 ? String(row[colMap.donor] || '').trim() : '',
            activity: colMap.activity !== -1 ? String(row[colMap.activity] || '').trim() : '',
            conditionArea: colMap.conditionArea !== -1 ? String(row[colMap.conditionArea] || '').trim() : ''
          });
        }

        if (records.length === 0) { Utils.showToast('No valid consultant rows found.', 'warning'); return; }

        const targetEntity = entities.find(e => e.id === targetEntityId) || entities[0];
        const years = await db.getAll(STORES.budgetYears);
        const activeYearObj = years.find(y => y.id === yearId) || { conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
        const rate = activeYearObj.conversionRates?.[targetEntity?.currency] || 1.0;

        const totalCost = records.reduce((sum, r) => sum + r.totalCY, 0);
        const totalCostUSD = Utils.convertToUSD(totalCost, rate);

        const previewContent = `
          <div>
            <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
              <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                  <div class="metric-label">Parsed Consultants</div>
                  <div class="metric-value" style="font-size: 1.5rem;">${records.length} Consultants</div>
                </div>
                <div>
                  <div class="metric-label">Total EHA Budget (${targetEntity?.currency || 'Local'} & USD)</div>
                  <div class="metric-value" style="font-size: 1.3rem; color: var(--accent-primary);">${Utils.formatCurrency(totalCost, targetEntity?.currency)} ${targetEntity?.currency !== 'USD' ? `<span style="font-size: 0.85rem; color: var(--text-secondary);">(≈ ${Utils.formatCurrency(totalCostUSD, 'USD')})</span>` : ''}</div>
                </div>
              </div>
            </div>

            <h4 class="mb-sm">Parsed EHA Preview (First 5 Rows)</h4>
            <div class="table-container mb-md" style="max-height: 220px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Consultant Name</th>
                    <th>Role / Scope</th>
                    <th class="num">Annual Total (${targetEntity?.currency || 'Local'})</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${r.name}</strong></td>
                      <td>${r.role}</td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalCY, targetEntity?.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        Utils.showModal('Confirm EHA Consultants Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Consultants`,
              onClick: async () => {
                if (options.action === 'replace') {
                  const existing = await db.getBudgetData(STORES.payrollEHA, yearId, targetEntityId, targetDeptId);
                  for (const ex of existing) await db.delete(STORES.payrollEHA, ex.id);
                }
                for (const rec of records) await db.add(STORES.payrollEHA, rec);
                Utils.showToast(`Successfully imported ${records.length} consultant records!`, 'success');
                close();
                if (App.currentPage === 'budget-entry') App.renderCurrentPage();
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing EHA file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 3. FIXED ASSETS BULK UPLOAD & TEMPLATE
  // ════════════════════════════════════════════════════════════

  async downloadFixedAssetData() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'fixed-assets' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export Fixed Assets data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getAll(STORES.payrollFixedAsset);
    const records = allRecords.filter(r => (String(r.yearId) === String(yearId) || String(r.year) === String(budgetYear)) && accessibleEntityIds.has(r.entityId));

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name',
      'Employee Name', 'Asset Type', 'Specification / Model',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Annual Total', 'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      const months = SEED_DATA.months.map((m, idx) => r.monthlyValues?.[idx] || 0);
      return [
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.employeeName || '', r.assetType || '', r.model || '',
        ...months,
        r.totalCY || 0,
        r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Fixed Assets Data');
    XLSX.writeFile(wb, `Fixed_Assets_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} Fixed Asset records for CY-${budgetYear}!`, 'success');
  },

  async downloadFixedAssetTemplate() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'fixed-assets' }) && !Auth.hasPermission('edit', { category: 'fixed-assets' }) && !Auth.hasPermission('add', { category: 'fixed-assets' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download Fixed Assets templates.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const budgetYear = activeYearObj.year;
    const headers = [
      'Entity Code', 'Department Code', 'Employee Name', 'Asset Type', 'Specification / Model',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
    ];

    const sampleRows = [
      [
        'ENT001', 'DEPT-ENG', 'Alice Johnson', 'Laptop', 'MacBook Pro 16"',
        0, 0, 250000, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        'India KA', 'NHIPL', '8.Platform Development & Management', 'General Medical & Surgical Care', 'Engineering standard laptop'
      ],
      [
        'ENT001', 'DEPT-ENG', 'Bob Smith', 'Printer', 'Dell UltraSharp 27"',
        0, 45000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        'India DL', 'NHIPL', '8.Platform Development & Management', 'All', 'Office display monitor'
      ],
      [
        'ENT002', 'DEPT-MKT', 'Carol Williams', 'Printer', 'HP LaserJet Pro',
        0, 0, 0, 35000, 0, 0, 0, 0, 0, 0, 0, 0,
        'India MH', 'YAIF', '16.Communications & Brand', 'Maternal & Newborn Care', 'Department printer'
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 28 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 24 }, { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Fixed Assets Template');
    XLSX.writeFile(wb, `Fixed_Assets_Template_CY${budgetYear}.xlsx`);
    Utils.showToast('Downloaded Fixed Assets Template!', 'success');
  },

  showFixedAssetUploadModal(defaultEntityId = null, defaultDeptId = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: 'fixed-assets', entityId: defaultEntityId, deptId: defaultDeptId }) && !Auth.hasPermission('add', { category: 'fixed-assets', entityId: defaultEntityId, deptId: defaultDeptId })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload Fixed Assets data.', 'warning');
      return;
    }
    const yearId = typeof App !== 'undefined' ? App.selectedYear : '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, defaultEntityId)) {
      Utils.showToast(`🔒 Bulk uploads are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, defaultEntityId)}". Only Draft or Active statuses allow uploads.`, 'warning');
      return;
    }

    const content = `
      <form id="faUploadModalForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) or CSV containing staff fixed asset equipment requests (Laptop/Printer, Model, monthly purchase cost).</p>

        <div class="form-group mb-md">
          <label class="form-label">Select Fixed Assets Excel File</label>
          <input type="file" id="modalFaFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
          <h4 class="mb-sm" style="font-size: var(--font-size-md);">Upload Settings</h4>
          <div class="form-group mb-sm">
            <label class="form-checkbox">
              <input type="radio" name="faMappingMode" value="current" checked>
              <span>Assign all uploaded records to current selected Entity & Department</span>
            </label>
          </div>
          <div class="form-group mb-none">
            <label class="form-label">Import Mode</label>
            <select class="form-select" id="faActionSelect">
              <option value="append">Append to existing asset rows in department</option>
              <option value="replace">Replace existing asset rows in department</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadFixedAssetTemplate()">📥 Download Template</button>
          <span class="text-tertiary" style="font-size: var(--font-size-xs);">Fixed Asset sheet format</span>
        </div>
      </form>
    `;

    Utils.showModal('💻 Bulk Upload Fixed Assets', content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Upload & Process Asset File',
          onClick: async () => {
            const fileInput = Utils.$('#modalFaFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const mappingMode = Utils.$('input[name="faMappingMode"]:checked')?.value || 'current';
            const action = Utils.$('#faActionSelect').value;
            close();
            await this.processFixedAssetFile(fileInput.files[0], { defaultEntityId, defaultDeptId, mappingMode, action });
          }
        }));
      }
    });
  },

  async processFixedAssetFile(file, options = {}) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames.find(s => /fixed|asset|laptop|printer/i.test(s)) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) { Utils.showToast('Could not find Fixed Assets sheet.', 'error'); return; }

        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (aoa.length === 0) { Utils.showToast('The sheet appears to be empty.', 'warning'); return; }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 25); i++) {
          const rowStr = (aoa[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('asset') || rowStr.includes('laptop') || rowStr.includes('employee')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) headerRowIdx = 0;

        const rawHeaders = aoa[headerRowIdx] || [];
        const headers = rawHeaders.map(h => String(h || '').trim());
        const findColIdx = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h.toLowerCase())));

        const colMap = {
          employeeName: findColIdx([/employee/i, /name/i, /resource/i]),
          assetType: findColIdx([/asset type/i, /type/i]),
          model: findColIdx([/model/i, /macbook/i, /specification/i]),
          location: findColIdx([/location/i, /state/i]),
          donor: findColIdx([/donor/i, /funder/i]),
          activity: findColIdx([/activity/i, /program/i]),
          conditionArea: findColIdx([/condition/i, /area/i, /disease/i]),
          remarks: findColIdx([/remark/i, /note/i, /comment/i])
        };

        const monthCols = SEED_DATA.months.map(m => headers.findIndex(h => new RegExp(m, 'i').test(h)));

        const records = [];
        const yearId = App.selectedYear || '2026';
        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);

        const targetEntityId = options.defaultEntityId || App.selectedEntity || entities[0]?.id;
        const targetDeptId = options.defaultDeptId || BudgetEntryModule.currentDeptId || departments[0]?.id;

        for (let i = headerRowIdx + 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row || row.length === 0) continue;
          const employeeName = colMap.employeeName !== -1 ? String(row[colMap.employeeName] || '').trim() : '';
          if (!employeeName || /^total/i.test(employeeName) || /^sl\.?/i.test(employeeName)) continue;

          const assetType = colMap.assetType !== -1 ? String(row[colMap.assetType] || '').trim() : 'Laptop';
          const model = colMap.model !== -1 ? String(row[colMap.model] || '').trim() : '';

          const monthlyValues = {};
          let totalCY = 0;
          SEED_DATA.months.forEach((m, mIdx) => {
            const cIdx = monthCols[mIdx];
            const val = cIdx !== undefined && cIdx !== -1 ? Utils.parseNumber(row[cIdx]) : 0;
            monthlyValues[mIdx] = val;
            totalCY += val;
          });

          records.push({
            yearId, entityId: targetEntityId, deptId: targetDeptId,
            employeeName, assetType, model, monthlyValues, totalCY,
            location: colMap.location !== -1 ? String(row[colMap.location] || '').trim() : '',
            donor: colMap.donor !== -1 ? String(row[colMap.donor] || '').trim() : '',
            activity: colMap.activity !== -1 ? String(row[colMap.activity] || '').trim() : '',
            conditionArea: colMap.conditionArea !== -1 ? String(row[colMap.conditionArea] || '').trim() : '',
            remarks: colMap.remarks !== -1 ? String(row[colMap.remarks] || '').trim() : ''
          });
        }

        if (records.length === 0) { Utils.showToast('No valid asset rows found.', 'warning'); return; }

        const targetEntity = entities.find(e => e.id === targetEntityId) || entities[0];
        const years = await db.getAll(STORES.budgetYears);
        const activeYearObj = years.find(y => y.id === yearId) || { conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
        const rate = activeYearObj.conversionRates?.[targetEntity?.currency] || 1.0;

        const totalCost = records.reduce((sum, r) => sum + r.totalCY, 0);
        const totalCostUSD = Utils.convertToUSD(totalCost, rate);

        const previewContent = `
          <div>
            <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
              <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                  <div class="metric-label">Parsed Fixed Assets</div>
                  <div class="metric-value" style="font-size: 1.5rem;">${records.length} Requests</div>
                </div>
                <div>
                  <div class="metric-label">Total Assets Budget (${targetEntity?.currency || 'Local'} & USD)</div>
                  <div class="metric-value" style="font-size: 1.3rem; color: var(--accent-primary);">${Utils.formatCurrency(totalCost, targetEntity?.currency)} ${targetEntity?.currency !== 'USD' ? `<span style="font-size: 0.85rem; color: var(--text-secondary);">(≈ ${Utils.formatCurrency(totalCostUSD, 'USD')})</span>` : ''}</div>
                </div>
              </div>
            </div>

            <h4 class="mb-sm">Parsed Fixed Assets Preview</h4>
            <div class="table-container mb-md" style="max-height: 220px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Asset Type</th>
                    <th>Specification / Model</th>
                    <th class="num">Annual Total (${targetEntity?.currency || 'Local'})</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${r.employeeName}</strong></td>
                      <td>${r.assetType}</td>
                      <td>${r.model}</td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalCY, targetEntity?.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        Utils.showModal('Confirm Fixed Assets Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Asset Rows`,
              onClick: async () => {
                if (options.action === 'replace') {
                  const existing = await db.getBudgetData(STORES.payrollFixedAsset, yearId, targetEntityId, targetDeptId);
                  for (const ex of existing) await db.delete(STORES.payrollFixedAsset, ex.id);
                }
                for (const rec of records) await db.add(STORES.payrollFixedAsset, rec);
                Utils.showToast(`Successfully imported ${records.length} asset records!`, 'success');
                close();
                if (App.currentPage === 'budget-entry') App.renderCurrentPage();
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing Fixed Assets file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 4. NON-PAYROLL COSTS BULK UPLOAD & TEMPLATE
  // ════════════════════════════════════════════════════════════

  async downloadNonPayrollData() {
    const canViewOtherCosts = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-costs' }) || Auth.hasPermission('view', { category: 'travel' }) || Auth.hasPermission('view', { category: 'supplies' }) || Auth.hasPermission('view', { category: 'office' }) || Auth.hasPermission('view', { category: 'communication' }) || Auth.hasPermission('view', { category: 'professional' });
    if (!canViewOtherCosts) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export non-payroll cost data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getAll(STORES.nonPayrollCost);

    const isExcludedFromOtherCosts = (item) => {
      const parent = (item.parentAccount || '').toLowerCase().trim();
      const gl = (item.glDescription || '').toLowerCase().trim();
      const sub = (item.subGroup || '').toLowerCase().trim();
      const ledger = String(item.ledgerCode || '').trim();

      if (parent.includes('salaries and wages') || gl.includes('salaries and wages') || ledger.startsWith('911')) return true;
      if (parent.includes('health') || parent.includes('retirement') || gl.includes('gratuity') || ledger.startsWith('912')) return true;
      if (parent.includes('other staff') || gl.includes('staff training') || ledger.startsWith('913')) return true;
      if (parent.includes('resource persons') || gl.includes('eha') || gl.includes('program resource') || sub.includes('direct consultants') || ledger.startsWith('921')) return true;
      if (parent.includes('fixed assets') || gl.includes('laptop') || gl.includes('printer') || sub.includes('fixed assets') || ledger.startsWith('113')) return true;

      return false;
    };

    let records = allRecords.filter(r => (String(r.yearId) === String(yearId) || String(r.year) === String(budgetYear)) && !isExcludedFromOtherCosts(r) && accessibleEntityIds.has(r.entityId));

    records = records.filter(r => {
      const targetCat = (typeof Auth !== 'undefined') ? Auth.getCategoryForLineItem(r) : 'other-costs';
      return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: r.entityId, deptId: r.deptId });
    });

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name',
      'Sub Group', 'Parent Account', 'GL Description', 'Ledger Code', 'Basis of Expense',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Annual Total', 'Activity', 'Location', 'Donor', 'Condition Area', 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      const months = SEED_DATA.months.map((m, idx) => r.monthlyValues?.[idx] || 0);
      return [
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.subGroup || '', r.parentAccount || '', r.glDescription || '', r.ledgerCode || '', r.basisOfExpense || '',
        ...months,
        r.totalCY || 0,
        r.activity || '', r.location || '', r.donor || '', r.conditionArea || '', r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Non-Payroll Costs Data');
    XLSX.writeFile(wb, `Non_Payroll_Costs_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} Non-Payroll records for CY-${budgetYear}!`, 'success');
  },

  async downloadNonPayrollTemplate() {
    const canViewOtherCosts = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-costs' }) || Auth.hasPermission('edit', { category: 'other-costs' }) || Auth.hasPermission('add', { category: 'other-costs' }) || Auth.hasPermission('view', { category: 'travel' }) || Auth.hasPermission('view', { category: 'supplies' }) || Auth.hasPermission('view', { category: 'office' }) || Auth.hasPermission('view', { category: 'communication' }) || Auth.hasPermission('view', { category: 'professional' });
    if (!canViewOtherCosts) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download non-payroll templates.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const budgetYear = activeYearObj.year;
    const headers = [
      'Entity Code', 'Department Code', 'Parent Account', 'GL Description', 'Ledger Code', 'Basis of Expense',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Activity', 'Location', 'Donor', 'Condition Area'
    ];

    const sampleRows = [
      [
        'NHIPL', 'IN-PDD-MED', 'Travel & Lodging Expenses', 'Hotel Accommodation', '93101', '21 days * 1000 per day',
        21000, 31500, 42000, 21000, 57750, 15750, 21000, 63000, 21000, 68250, 0, 0,
        '3-Needs finding,Testing and prototyping', 'India KA', 'NHIPL', 'General Medical & Surgical Care'
      ],
      [
        'NHIPL', 'IN-PDD-MED', 'Travel & Lodging Expenses', 'Air fare', '93103', 'Flight tickets for 4 visits',
        18000, 36000, 36000, 36000, 72000, 18000, 36000, 54000, 36000, 54000, 0, 0,
        '3-Needs finding,Testing and prototyping', 'India DL', 'NHIPL', 'Oncology Care'
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 12 }, { wch: 30 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Non Payroll Costs Template');
    XLSX.writeFile(wb, `Non_Payroll_Costs_Template_CY${budgetYear}.xlsx`);
    Utils.showToast('Downloaded official Non-Payroll Costs Template!', 'success');
  },

  showNonPayrollUploadModal(defaultEntityId = null, defaultDeptId = null) {
    const canUploadOtherCosts = typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'other-costs', entityId: defaultEntityId, deptId: defaultDeptId }) || Auth.hasPermission('add', { category: 'other-costs', entityId: defaultEntityId, deptId: defaultDeptId });
    if (!canUploadOtherCosts) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload Non-Payroll Costs.', 'warning');
      return;
    }
    const yearId = typeof App !== 'undefined' ? App.selectedYear : '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, defaultEntityId)) {
      Utils.showToast(`🔒 Bulk uploads are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, defaultEntityId)}". Only Draft or Active statuses allow uploads.`, 'warning');
      return;
    }

    const content = `
      <form id="npUploadModalForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) or CSV containing non-payroll operational expenses (Travel, Supplies, Communication, Office Expenses, Professional Fees, Basis of Calculation, 5D tags).</p>

        <div class="form-group mb-md">
          <label class="form-label">Select Non-Payroll Excel File</label>
          <input type="file" id="modalNpFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
          <h4 class="mb-sm" style="font-size: var(--font-size-md);">Upload Settings</h4>
          <div class="form-group mb-sm">
            <label class="form-checkbox">
              <input type="radio" name="npMappingMode" value="current" checked>
              <span>Assign all uploaded records to current selected Entity & Department</span>
            </label>
          </div>
          <div class="form-group mb-none">
            <label class="form-label">Import Mode</label>
            <select class="form-select" id="npActionSelect">
              <option value="append">Append to existing non-payroll lines in department</option>
              <option value="replace">Replace existing non-payroll lines in department</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadNonPayrollTemplate()">📥 Download Template</button>
          <span class="text-tertiary" style="font-size: var(--font-size-xs);">Non-payroll sheet format</span>
        </div>
      </form>
    `;

    Utils.showModal('📑 Bulk Upload Non-Payroll Costs', content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Upload & Process Non-Payroll File',
          onClick: async () => {
            const fileInput = Utils.$('#modalNpFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const mappingMode = Utils.$('input[name="npMappingMode"]:checked')?.value || 'current';
            const action = Utils.$('#npActionSelect').value;
            close();
            await this.processNonPayrollFile(fileInput.files[0], { defaultEntityId, defaultDeptId, mappingMode, action });
          }
        }));
      }
    });
  },

  async processNonPayrollFile(file, options = {}) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames.find(s => /non.*payroll|summary|other input|travel/i.test(s)) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) { Utils.showToast('Could not find Non-Payroll sheet.', 'error'); return; }

        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (aoa.length === 0) { Utils.showToast('The sheet appears to be empty.', 'warning'); return; }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 25); i++) {
          const rowStr = (aoa[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('parent') || rowStr.includes('gl description') || rowStr.includes('ledger') || rowStr.includes('travel')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) headerRowIdx = 0;

        const rawHeaders = aoa[headerRowIdx] || [];
        const headers = rawHeaders.map(h => String(h || '').trim());
        const findColIdx = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h.toLowerCase())));

        const colMap = {
          parentAccount: findColIdx([/parent account/i, /parent/i, /sub department/i]),
          glDescription: findColIdx([/gl description/i, /description/i, /gl/i, /line item/i]),
          ledgerCode: findColIdx([/ledger code/i, /ledger/i, /code/i]),
          basisOfExpense: findColIdx([/basis/i, /calculation/i]),
          activity: findColIdx([/activity/i]),
          location: findColIdx([/location/i, /state/i]),
          donor: findColIdx([/donor/i, /funder/i]),
          conditionArea: findColIdx([/condition/i, /care area/i])
        };

        const monthCols = SEED_DATA.months.map(m => headers.findIndex(h => new RegExp(m, 'i').test(h)));

        const records = [];
        const yearId = App.selectedYear || '2026';
        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);

        const targetEntityId = options.defaultEntityId || App.selectedEntity || entities[0]?.id;
        const targetDeptId = options.defaultDeptId || BudgetEntryModule.currentDeptId || departments[0]?.id;

        for (let i = headerRowIdx + 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row || row.length === 0) continue;
          const glDescription = colMap.glDescription !== -1 ? String(row[colMap.glDescription] || '').trim() : '';
          const parentAccount = colMap.parentAccount !== -1 ? String(row[colMap.parentAccount] || '').trim() : '';
          if ((!glDescription && !parentAccount) || /^total/i.test(glDescription) || /^sl\.?/i.test(glDescription)) continue;

          const ledgerCode = colMap.ledgerCode !== -1 ? String(row[colMap.ledgerCode] || '').trim() : '';
          const basisOfExpense = colMap.basisOfExpense !== -1 ? String(row[colMap.basisOfExpense] || '').trim() : '';

          const monthlyValues = {};
          let totalCY = 0;
          SEED_DATA.months.forEach((m, mIdx) => {
            const cIdx = monthCols[mIdx];
            const val = cIdx !== undefined && cIdx !== -1 ? Utils.parseNumber(row[cIdx]) : 0;
            monthlyValues[mIdx] = val;
            totalCY += val;
          });

          const isExcludedFromOtherCosts = (item) => {
            const parent = (item.parentAccount || '').toLowerCase().trim();
            const gl = (item.glDescription || '').toLowerCase().trim();
            const sub = (item.subGroup || '').toLowerCase().trim();
            const ledger = String(item.ledgerCode || '').trim();

            if (parent.includes('salaries and wages') || gl.includes('salaries and wages') || ledger.startsWith('911')) return true;
            if (parent.includes('health') || parent.includes('retirement') || gl.includes('gratuity') || ledger.startsWith('912')) return true;
            if (parent.includes('other staff') || gl.includes('staff training') || ledger.startsWith('913')) return true;
            if (parent.includes('resource persons') || gl.includes('eha') || gl.includes('program resource') || sub.includes('direct consultants') || ledger.startsWith('921')) return true;
            if (parent.includes('fixed assets') || gl.includes('laptop') || gl.includes('printer') || sub.includes('fixed assets') || ledger.startsWith('113')) return true;

            return false;
          };

          if (!isExcludedFromOtherCosts({ parentAccount, glDescription, ledgerCode })) {
            records.push({
              yearId, entityId: targetEntityId, deptId: targetDeptId,
              parentAccount, glDescription, ledgerCode, basisOfExpense,
              monthlyValues, totalCY,
              activity: colMap.activity !== -1 ? String(row[colMap.activity] || '').trim() : '',
              location: colMap.location !== -1 ? String(row[colMap.location] || '').trim() : '',
              donor: colMap.donor !== -1 ? String(row[colMap.donor] || '').trim() : '',
              conditionArea: colMap.conditionArea !== -1 ? String(row[colMap.conditionArea] || '').trim() : ''
            });
          }
        }

        if (records.length === 0) { Utils.showToast('No valid non-payroll expense rows found.', 'warning'); return; }

        const targetEntity = entities.find(e => e.id === targetEntityId) || entities[0];
        const years = await db.getAll(STORES.budgetYears);
        const activeYearObj = years.find(y => y.id === yearId) || { conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
        const rate = activeYearObj.conversionRates?.[targetEntity?.currency] || 1.0;

        const totalCost = records.reduce((sum, r) => sum + r.totalCY, 0);
        const totalCostUSD = Utils.convertToUSD(totalCost, rate);

        const previewContent = `
          <div>
            <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
              <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                  <div class="metric-label">Parsed Non-Payroll Lines</div>
                  <div class="metric-value" style="font-size: 1.5rem;">${records.length} Lines</div>
                </div>
                <div>
                  <div class="metric-label">Total Non-Payroll Cost (${targetEntity?.currency || 'Local'} & USD)</div>
                  <div class="metric-value" style="font-size: 1.3rem; color: var(--accent-primary);">${Utils.formatCurrency(totalCost, targetEntity?.currency)} ${targetEntity?.currency !== 'USD' ? `<span style="font-size: 0.85rem; color: var(--text-secondary);">(≈ ${Utils.formatCurrency(totalCostUSD, 'USD')})</span>` : ''}</div>
                </div>
              </div>
            </div>

            <h4 class="mb-sm">Parsed Non-Payroll Preview</h4>
            <div class="table-container mb-md" style="max-height: 220px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Parent Account</th>
                    <th>GL Description</th>
                    <th>Ledger Code</th>
                    <th class="num">Annual Total (${targetEntity?.currency || 'Local'})</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${r.parentAccount}</strong></td>
                      <td>${r.glDescription}</td>
                      <td><code>${r.ledgerCode}</code></td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalCY, targetEntity?.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        Utils.showModal('Confirm Non-Payroll Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Expense Lines`,
              onClick: async () => {
                if (options.action === 'replace') {
                  const existing = await db.getBudgetData(STORES.nonPayrollCost, yearId, targetEntityId, targetDeptId);
                  for (const ex of existing) await db.delete(STORES.nonPayrollCost, ex.id);
                }
                for (const rec of records) await db.add(STORES.nonPayrollCost, rec);
                Utils.showToast(`Successfully imported ${records.length} non-payroll expense lines!`, 'success');
                close();
                if (App.currentPage === 'budget-entry') App.renderCurrentPage();
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing Non-Payroll file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 4B. TOTAL DEPT COST EXCEL OPERATIONS (REPLICATED)
  // ════════════════════════════════════════════════════════════
  async downloadTotalCostData() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'total-dept-cost' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export Total Department Cost data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getAll(STORES.totalCostSheet);
    const records = allRecords.filter(r => (String(r.yearId) === String(yearId) || String(r.year) === String(budgetYear)) && accessibleEntityIds.has(r.entityId));
    const allPriorCosts = await db.getPriorPeriodCosts(yearId);

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name',
      'Sub Group', 'Parent Account', 'GL Description', 'Ledger Code', 'Basis of Expense',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Annual Total', 'Prior Period Cost', 'Activity', 'Location', 'Donor', 'Condition Area', 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      const months = SEED_DATA.months.map((m, idx) => r.monthlyValues?.[idx] || 0);
      const matchingPrior = allPriorCosts.find(p => p.entityId === r.entityId && p.deptId === r.deptId && (p.ledgerCode === r.ledgerCode || p.glDescription === r.glDescription));
      const priorCost = matchingPrior?.priorCost || 0;

      return [
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.subGroup || '', r.parentAccount || '', r.glDescription || '', r.ledgerCode || '', r.basisOfExpense || '',
        ...months,
        r.totalCY || 0,
        priorCost,
        r.activity || '', r.location || '', r.donor || '', r.conditionArea || '', r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Total Dept Cost Data');
    XLSX.writeFile(wb, `Total_Dept_Cost_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} Total Dept Cost records for CY-${budgetYear}!`, 'success');
  },

  async downloadTotalCostTemplate() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'total-dept-cost' }) && !Auth.hasPermission('edit', { category: 'total-dept-cost' }) && !Auth.hasPermission('add', { category: 'total-dept-cost' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download Total Department Cost templates.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const budgetYear = activeYearObj.year;
    const headers = [
      'Entity Code', 'Department Code', 'Parent Account', 'GL Description', 'Ledger Code', 'Basis of Expense',
      ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
      'Prior Period Cost', 'Activity', 'Location', 'Donor', 'Condition Area', 'Remarks'
    ];

    const sampleRows = [
      [
        'NHIPL', 'IN-PDD-MED', 'Operating Costs', 'General Supplies', '94101', 'Standard calculation',
        10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
        110000, '3-Needs finding,Testing and prototyping', 'India KA', 'NHIPL', 'General Medical & Surgical Care', 'Total dept cost line'
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 12 }, { wch: 30 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 24 }, { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Total Dept Cost Template');
    XLSX.writeFile(wb, `Total_Dept_Cost_Template_CY${budgetYear}.xlsx`);
    Utils.showToast('Downloaded Total Dept Cost Template!', 'success');
  },

  // ════════════════════════════════════════════════════════════
  // 4C. PRIOR PERIOD COSTS EXCEL OPERATIONS (ADMIN CONFIGURATION)
  // ════════════════════════════════════════════════════════════
  async downloadPriorPeriodTemplate(yearIdParam = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'prior-period' }) && !Auth.hasPermission('edit', { category: 'prior-period' }) && !Auth.hasPermission('add', { category: 'prior-period' }) && !Auth.hasPermission('view', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download Prior Period Cost templates.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = yearIdParam || activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const priorYear = activeYearObj.priorYear || (budgetYear - 1);
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const coa = await db.getAll(STORES.chartOfAccounts);

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name', 'Currency',
      'Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source',
      `Prior Period Cost (CY-${priorYear})`, 'Remarks'
    ];

    const rows = [];

    for (const e of entities) {
      const entityConfigs = await db.getEntityDeptConfigForYear(yearId, e.id);
      const activeDeptIds = new Set(entityConfigs.filter(c => c.isActive).map(c => c.deptId));
      const entityDepts = departments.filter(d => activeDeptIds.size === 0 || activeDeptIds.has(d.id));

      for (const d of entityDepts) {
        coa.forEach(account => {
          rows.push([
            e.shortName, e.name, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix), e.currency,
            account.parentAccount, account.glDescription, account.ledgerCode, account.subGroup || 'Standard COA',
            0, `CY-${priorYear} reference historical cost`
          ]);
        });
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 32 }, { wch: 10 },
      { wch: 28 }, { wch: 36 }, { wch: 12 }, { wch: 24 },
      { wch: 24 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Prior Period Costs Template');
    XLSX.writeFile(wb, `Prior_Period_Costs_Template_CY${budgetYear}.xlsx`);
    Utils.showToast(`Downloaded Prior Period Costs Template for CY-${budgetYear}!`, 'success');
  },

  async downloadPriorPeriodData(yearIdParam = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'prior-period' }) && !Auth.hasPermission('view', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export Prior Period Cost data.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = yearIdParam || activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const priorYear = activeYearObj.priorYear || (budgetYear - 1);
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));
    const departments = await db.getAll(STORES.departments);
    const allRecords = await db.getPriorPeriodCosts(yearId);
    const records = allRecords.filter(r => accessibleEntityIds.has(r.entityId));

    const headers = [
      'Entity Code', 'Entity Name', 'Department Code', 'Department Name', 'Currency',
      'Parent Account', 'GL Line Item Description', 'Ledger Code',
      `Prior Period Cost (CY-${priorYear})`, 'Remarks'
    ];

    const rows = records.map(r => {
      const ent = entities.find(e => e.id === r.entityId);
      const dept = departments.find(d => d.id === r.deptId);
      return [
        ent?.shortName || r.entityId, ent?.name || '',
        dept?.codeTemplate || r.deptId, dept?.name || '',
        r.currency || ent?.currency || 'USD',
        r.parentAccount || '', r.glDescription || '', r.ledgerCode || '',
        r.priorCost || 0, r.remarks || ''
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 32 }, { wch: 10 },
      { wch: 28 }, { wch: 36 }, { wch: 12 },
      { wch: 24 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Prior Period Costs Data');
    XLSX.writeFile(wb, `Prior_Period_Costs_Data_CY${budgetYear}.xlsx`);
    Utils.showToast(`Exported ${records.length} Prior Period Cost records for CY-${budgetYear}!`, 'success');
  },

  showPriorPeriodUploadModal(yearIdParam = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: 'prior-period' }) && !Auth.hasPermission('add', { category: 'prior-period' }) && !Auth.hasPermission('edit', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload Prior Period Costs.', 'warning');
      return;
    }
    const yearId = yearIdParam || (typeof ReportsModule !== 'undefined' && ReportsModule._selectedYear) || App.selectedYear || '2026';

    const content = `
      <form id="priorCostUploadForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) containing prior period costs (e.g. prior year actuals / budget) for each entity and department.</p>

        <div class="form-group mb-md">
          <label class="form-label font-bold">Select Prior Period Costs Excel File</label>
          <input type="file" id="priorCostFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="form-group mb-md">
          <label class="form-label font-bold">Import Mode</label>
          <select class="form-select" id="priorCostImportAction">
            <option value="replace">Replace all prior period costs for this year (Recommended)</option>
            <option value="append">Append / Update existing prior period costs</option>
          </select>
        </div>

        <div class="alert alert-info p-sm" style="font-size: var(--font-size-xs); background: rgba(59, 130, 246, 0.08); border-radius: var(--radius-sm);">
          💡 <strong>Tip:</strong> Need the pre-formatted Excel template? <a href="javascript:void(0)" onclick="ExcelIOModule.downloadPriorPeriodTemplate('${yearId}')" style="color: var(--accent-primary); text-decoration: underline;">Download Template Here</a>.
        </div>
      </form>
    `;

    Utils.showModal('📊 Upload Prior Period Costs', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Continue to Preview',
          onClick: () => {
            const fileInput = Utils.$('#priorCostFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const action = Utils.$('#priorCostImportAction').value;
            const file = fileInput.files[0];
            close();
            this.processPriorPeriodFile(file, { action }, yearId);
          }
        }));
      }
    });
  },

  async processPriorPeriodFile(file, options, yearId) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          Utils.showToast('The uploaded sheet is empty.', 'error');
          return;
        }

        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);
        const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        const findEntity = (val) => {
          const cv = cleanStr(val);
          return entities.find(ent => cleanStr(ent.id) === cv || cleanStr(ent.shortName) === cv || cleanStr(ent.name) === cv || cleanStr(ent.deptPrefix) === cv) || entities[0];
        };

        const findDept = (val, entity) => {
          const cv = cleanStr(val);
          return departments.find(d => cleanStr(d.id) === cv || cleanStr(d.codeTemplate) === cv || cleanStr(d.name) === cv || cleanStr(Utils.getDeptName(d, entity?.deptPrefix)) === cv || cleanStr(d.codeTemplate.replace('{CC}', entity?.deptPrefix || '')) === cv) || departments[0];
        };

        const records = [];

        for (const row of rows) {
          const entVal = row['Entity Code'] || row['Entity'] || row['Entity Name'] || '';
          const deptVal = row['Department Code'] || row['Department'] || row['Department Name'] || '';
          const targetEntity = findEntity(entVal);
          const targetDept = findDept(deptVal, targetEntity);

          const ledgerCode = String(row['Ledger Code'] || row['Ledger'] || row['GL Code'] || '').trim();
          const glDescription = String(row['GL Line Item Description'] || row['GL Description'] || row['Account Description'] || row['Account'] || '').trim();
          const parentAccount = String(row['Parent Account'] || row['Category'] || '').trim();

          let priorCost = 0;
          Object.entries(row).forEach(([k, v]) => {
            const lk = k.toLowerCase();
            if (lk.includes('prior') || lk.includes('actual') || lk.includes('cost') || lk.includes('amount') || lk.includes('budget')) {
              const num = Utils.parseNumber(v);
              if (num > 0) priorCost = num;
            }
          });

          if (!priorCost && row['Prior Period Cost']) priorCost = Utils.parseNumber(row['Prior Period Cost']);

          const remarks = String(row['Remarks'] || row['Notes'] || '').trim();

          if (targetEntity && targetDept && (ledgerCode || glDescription) && priorCost > 0) {
            records.push({
              id: `pya_${yearId}_${targetEntity.id}_${targetDept.id}_${ledgerCode || Utils.slugify(glDescription)}`,
              yearId: String(yearId),
              entityId: targetEntity.id,
              deptId: targetDept.id,
              parentAccount: parentAccount || 'Operational Expenses',
              glDescription: glDescription || 'Expense Line',
              ledgerCode: ledgerCode || '93999',
              priorCost,
              currency: targetEntity.currency,
              remarks
            });
          }
        }

        if (records.length === 0) {
          Utils.showToast('No valid prior period cost lines found in file. Please verify columns.', 'warning');
          return;
        }

        const totalCostSum = records.reduce((s, r) => s + r.priorCost, 0);

        const previewContent = `
          <div>
            <p class="mb-md">Successfully parsed <strong>${records.length}</strong> prior period cost lines from <code>${file.name}</code>.</p>
            <div class="card p-md mb-md" style="background: var(--bg-card); border: 1px solid var(--border-default);">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-tertiary" style="font-size: 11px; text-transform: uppercase;">Total Prior Cost Sum</div>
                  <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent-primary);">${Utils.formatNumber(totalCostSum)}</div>
                </div>
                <div>
                  <span class="badge badge-emerald" style="padding: 6px 12px; font-weight: 700;">${options.action === 'replace' ? 'Mode: Replace Existing' : 'Mode: Append / Update'}</span>
                </div>
              </div>
            </div>

            <div class="table-container" style="max-height: 250px; overflow-y: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Department</th>
                    <th>GL Description</th>
                    <th>Ledger Code</th>
                    <th class="num">Prior Period Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 15).map(r => `
                    <tr>
                      <td><strong>${r.entityId}</strong></td>
                      <td>${r.deptId}</td>
                      <td>${r.glDescription}</td>
                      <td><code>${r.ledgerCode}</code></td>
                      <td class="num font-bold font-mono">${Utils.formatNumber(r.priorCost)} ${r.currency}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${records.length > 15 ? `<p class="text-tertiary text-center mt-xs" style="font-size: 11px;">Showing first 15 of ${records.length} rows.</p>` : ''}
          </div>
        `;

        Utils.showModal('Confirm Prior Period Costs Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Lines`,
              onClick: async () => {
                await db.savePriorPeriodCosts(yearId, records, options.action === 'replace');
                Utils.showToast(`Successfully imported ${records.length} prior period cost lines!`, 'success');
                close();
                if (typeof ConfigModule !== 'undefined' && App.currentPage === 'config') {
                  ConfigModule.managePriorPeriodCosts(yearId);
                } else if (App.currentPage === 'budget-entry') {
                  App.renderCurrentPage();
                } else if (App.currentPage === 'reports') {
                  App.renderCurrentPage();
                }
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  showTotalCostUploadModal(defaultEntityId = null, defaultDeptId = null) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: 'total-dept-cost', entityId: defaultEntityId, deptId: defaultDeptId }) && !Auth.hasPermission('add', { category: 'total-dept-cost', entityId: defaultEntityId, deptId: defaultDeptId })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload Total Department Cost data.', 'warning');
      return;
    }
    const yearId = typeof App !== 'undefined' ? App.selectedYear : '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, defaultEntityId)) {
      Utils.showToast(`🔒 Bulk uploads are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, defaultEntityId)}". Only Draft or Active statuses allow uploads.`, 'warning');
      return;
    }

    const content = `
      <form id="tcUploadModalForm">
        <p class="mb-md text-secondary">Upload an Excel file (.xlsx, .xls) or CSV containing total department cost line items, accounts, monthly values, and 5D tags.</p>

        <div class="form-group mb-md">
          <label class="form-label">Select Total Dept Cost Excel File</label>
          <input type="file" id="modalTcFileInput" accept=".xlsx, .xls, .csv" class="form-input" required>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
          <h4 class="mb-sm" style="font-size: var(--font-size-md);">Upload Settings</h4>
          <div class="form-group mb-sm">
            <label class="form-checkbox">
              <input type="radio" name="tcMappingMode" value="current" checked>
              <span>Assign all uploaded records to current selected Entity & Department</span>
            </label>
          </div>
          <div class="form-group mb-none">
            <label class="form-label">Import Mode</label>
            <select class="form-select" id="tcActionSelect">
              <option value="append">Append to existing total dept cost lines in department</option>
              <option value="replace">Replace existing total dept cost lines in department</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="button" class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadTotalCostTemplate()">📥 Download Template</button>
          <span class="text-tertiary" style="font-size: var(--font-size-xs);">Total Dept Cost format</span>
        </div>
      </form>
    `;

    Utils.showModal('📊 Bulk Upload Total Dept Cost', content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Upload & Process File',
          onClick: async () => {
            const fileInput = Utils.$('#modalTcFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
              Utils.showToast('Please select a file to upload.', 'warning');
              return;
            }
            const mappingMode = Utils.$('input[name="tcMappingMode"]:checked')?.value || 'current';
            const action = Utils.$('#tcActionSelect').value;
            close();
            await this.processTotalCostFile(fileInput.files[0], { defaultEntityId, defaultDeptId, mappingMode, action });
          }
        }));
      }
    });
  },

  async processTotalCostFile(file, options = {}) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames.find(s => /total|cost|non-payroll|operating|expense/i.test(s)) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) { Utils.showToast('Could not find suitable data sheet.', 'error'); return; }

        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (aoa.length === 0) { Utils.showToast('The sheet appears to be empty.', 'warning'); return; }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(aoa.length, 25); i++) {
          const rowStr = (aoa[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('parent') || rowStr.includes('ledger') || rowStr.includes('account') || rowStr.includes('gl description') || rowStr.includes('basis')) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) headerRowIdx = 0;

        const rawHeaders = aoa[headerRowIdx] || [];
        const headers = rawHeaders.map(h => String(h || '').trim());

        const findColIdx = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h.toLowerCase())));

        const colMap = {
          parentAccount: findColIdx([/parent account/i, /parent/i, /sub group/i, /category/i]),
          glDescription: findColIdx([/gl description/i, /gl line item/i, /description/i, /account description/i, /line item/i]),
          ledgerCode: findColIdx([/ledger code/i, /code/i, /account code/i, /gl code/i]),
          basis: findColIdx([/basis/i, /calculation/i, /formula/i, /notes/i]),
          activity: findColIdx([/activity/i]),
          location: findColIdx([/location/i, /state/i, /city/i]),
          donor: findColIdx([/donor/i, /funder/i, /grant/i]),
          conditionArea: findColIdx([/condition/i, /care area/i, /area/i]),
          remarks: findColIdx([/remark/i, /comment/i]),
          entity: findColIdx([/entity/i, /company/i]),
          dept: findColIdx([/department/i, /dept/i])
        };

        const monthCols = SEED_DATA.months.map(m => headers.findIndex(h => new RegExp(m, 'i').test(h)));

        const records = [];
        const yearId = App.selectedYear || '2026';
        const entities = await db.getAll(STORES.entities);
        const departments = await db.getAll(STORES.departments);

        const targetEntityId = options.defaultEntityId || App.selectedEntity || entities[0]?.id;
        const targetDeptId = options.defaultDeptId || BudgetEntryModule.currentDeptId || departments[0]?.id;

        for (let i = headerRowIdx + 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row || row.length === 0) continue;

          const desc = colMap.glDescription !== -1 ? String(row[colMap.glDescription] || '').trim() : '';
          const parent = colMap.parentAccount !== -1 ? String(row[colMap.parentAccount] || '').trim() : '';
          if (!desc && !parent) continue;
          if (/^total/i.test(desc) || /^total/i.test(parent)) continue;

          const ledgerCode = colMap.ledgerCode !== -1 ? String(row[colMap.ledgerCode] || '').trim() : '';
          const basisOfExpense = colMap.basis !== -1 ? String(row[colMap.basis] || '').trim() : '';

          const monthlyValues = {};
          let totalCY = 0;
          SEED_DATA.months.forEach((m, mIdx) => {
            const cIdx = monthCols[mIdx];
            const val = cIdx !== -1 && cIdx !== undefined ? Utils.parseNumber(row[cIdx]) : 0;
            monthlyValues[mIdx] = val;
            totalCY += val;
          });

          let rowEntityId = targetEntityId;
          let rowDeptId = targetDeptId;

          if (options.mappingMode === 'file') {
            if (colMap.entity !== -1 && row[colMap.entity]) {
              const entStr = String(row[colMap.entity]).trim().toLowerCase();
              const matchedEnt = entities.find(e => e.shortName.toLowerCase() === entStr || e.name.toLowerCase().includes(entStr));
              if (matchedEnt) rowEntityId = matchedEnt.id;
            }
            if (colMap.dept !== -1 && row[colMap.dept]) {
              const deptStr = String(row[colMap.dept]).trim().toLowerCase();
              const matchedDept = departments.find(d => d.codeTemplate.toLowerCase().includes(deptStr) || d.name.toLowerCase().includes(deptStr));
              if (matchedDept) rowDeptId = matchedDept.id;
            }
          }

          records.push({
            yearId,
            entityId: rowEntityId,
            deptId: rowDeptId,
            parentAccount: parent || 'General Operating Costs',
            glDescription: desc || parent,
            ledgerCode,
            basisOfExpense,
            monthlyValues,
            totalCY,
            activity: colMap.activity !== -1 ? String(row[colMap.activity] || '').trim() : '',
            location: colMap.location !== -1 ? String(row[colMap.location] || '').trim() : '',
            donor: colMap.donor !== -1 ? String(row[colMap.donor] || '').trim() : '',
            conditionArea: colMap.conditionArea !== -1 ? String(row[colMap.conditionArea] || '').trim() : '',
            remarks: colMap.remarks !== -1 ? String(row[colMap.remarks] || '').trim() : ''
          });
        }

        if (records.length === 0) { Utils.showToast('No valid expense rows found.', 'warning'); return; }

        const targetEntity = entities.find(e => e.id === targetEntityId) || entities[0];
        const years = await db.getAll(STORES.budgetYears);
        const activeYearObj = years.find(y => y.id === yearId) || { conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
        const rate = activeYearObj.conversionRates?.[targetEntity?.currency] || 1.0;

        const totalCost = records.reduce((sum, r) => sum + r.totalCY, 0);
        const totalCostUSD = Utils.convertToUSD(totalCost, rate);

        const previewContent = `
          <div>
            <div class="card p-md mb-md" style="background: var(--bg-tertiary);">
              <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                  <div class="metric-label">Parsed Total Dept Cost Lines</div>
                  <div class="metric-value" style="font-size: 1.5rem;">${records.length} Lines</div>
                </div>
                <div>
                  <div class="metric-label">Total Budget Amount (${targetEntity?.currency || 'Local'} & USD)</div>
                  <div class="metric-value" style="font-size: 1.3rem; color: var(--accent-primary);">${Utils.formatCurrency(totalCost, targetEntity?.currency)} ${targetEntity?.currency !== 'USD' ? `<span style="font-size: 0.85rem; color: var(--text-secondary);">(≈ ${Utils.formatCurrency(totalCostUSD, 'USD')})</span>` : ''}</div>
                </div>
              </div>
            </div>

            <h4 class="mb-sm">Parsed Preview</h4>
            <div class="table-container mb-md" style="max-height: 220px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Parent Account</th>
                    <th>GL Description</th>
                    <th>Ledger Code</th>
                    <th class="num">Annual Total (${targetEntity?.currency || 'Local'})</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.slice(0, 5).map(r => `
                    <tr>
                      <td><strong>${r.parentAccount}</strong></td>
                      <td>${r.glDescription}</td>
                      <td><code>${r.ledgerCode}</code></td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalCY, targetEntity?.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        Utils.showModal('Confirm Total Dept Cost Import', previewContent, {
          size: 'lg',
          footer: (footer, close) => {
            footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
            footer.appendChild(Utils.createElement('button', {
              className: 'btn btn-primary',
              textContent: `Confirm & Import ${records.length} Lines`,
              onClick: async () => {
                if (options.action === 'replace') {
                  const existing = await db.getBudgetData(STORES.totalCostSheet, yearId, targetEntityId, targetDeptId);
                  for (const ex of existing) await db.delete(STORES.totalCostSheet, ex.id);
                }
                for (const rec of records) await db.add(STORES.totalCostSheet, rec);
                Utils.showToast(`Successfully imported ${records.length} total dept cost lines!`, 'success');
                close();
                if (App.currentPage === 'budget-entry') App.renderCurrentPage();
              }
            }));
          }
        });

      } catch (err) {
        console.error(err);
        Utils.showToast('Error processing file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 5. MASTER DATA IMPORT HANDLER
  // ════════════════════════════════════════════════════════════
  async handleExcelImport() {
    const fileInput = Utils.$('#excelFileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
      Utils.showToast('Please select an Excel file first.', 'warning');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let importedSheets = 0;

        if (workbook.SheetNames.includes('Location')) {
          const sheet = workbook.Sheets['Location'];
          const json = XLSX.utils.sheet_to_json(sheet);
          if (json.length > 0) importedSheets++;
        }

        if (workbook.SheetNames.includes('Donor')) {
          const sheet = workbook.Sheets['Donor'];
          const json = XLSX.utils.sheet_to_json(sheet);
          if (json.length > 0) importedSheets++;
        }

        if (workbook.SheetNames.includes('Condition Area')) {
          const sheet = workbook.Sheets['Condition Area'];
          const json = XLSX.utils.sheet_to_json(sheet);
          json.forEach(row => {
            const name = Object.values(row)[0];
            if (name) db.add(STORES.conditionAreas, { name });
          });
          importedSheets++;
        }

        if (workbook.SheetNames.includes('Activity')) {
          const sheet = workbook.Sheets['Activity'];
          const json = XLSX.utils.sheet_to_json(sheet);
          json.forEach(row => {
            const name = Object.values(row)[0];
            if (name) db.add(STORES.activities, { name });
          });
          importedSheets++;
        }

        Utils.showToast(`Import completed successfully! Processed ${importedSheets} sheets.`, 'success');
      } catch (err) {
        console.error(err);
        Utils.showToast('Failed to import Excel file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ════════════════════════════════════════════════════════════
  // 6. EXPORT REPORTS TO EXCEL (COMPREHENSIVE MULTI-SHEET ENGINE)
  // ════════════════════════════════════════════════════════════
  exportGlobalUSDReport() {
    return this.exportReportToExcel('global-usd');
  },

  exportReport(type) {
    return this.exportReportToExcel(type);
  },

  async getReportClubbedLines(entityList, yearId, conversionRates) {
    const coa = await db.getAll(STORES.chartOfAccounts);
    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' });
    const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff' });
    const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity' });
    const canViewEha = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha' });
    const canViewFixedAssets = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets' });

    const allSalaries = [];
    const allOtherStaff = [];
    const allGratuity = [];
    const allEha = [];
    const allFixedAssets = [];
    const allNonPayroll = [];

    for (const e of entityList) {
      const rate = conversionRates?.[e.currency] || 1.0;
      const attachRate = (rows) => rows.map(r => ({ ...r, currency: e.currency, rate }));

      if (canViewSalaries || canViewOtherStaff || canViewGratuity) {
        const payroll = await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id);
        if (canViewSalaries) {
          const salaries = payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
          allSalaries.push(...attachRate(salaries));
        }
        if (canViewOtherStaff) {
          const otherStaff = payroll.filter(p => p.subCategory === 'other-staff-expenses');
          allOtherStaff.push(...attachRate(otherStaff));
        }
        if (canViewGratuity) {
          const gratuity = payroll.filter(p => p.subCategory === 'gratuity-bonus');
          allGratuity.push(...attachRate(gratuity));
        }
      }

      if (canViewEha) {
        const eha = await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id);
        allEha.push(...attachRate(eha));
      }

      if (canViewFixedAssets) {
        const fixedAssets = await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id);
        allFixedAssets.push(...attachRate(fixedAssets));
      }

      const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);
      const filteredNonPayroll = nonPayroll.filter(r => {
        const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
        return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: r.deptId });
      });
      allNonPayroll.push(...attachRate(filteredNonPayroll));
    }

    const sumRowsWithConversion = (rows) => {
      const monthlyLocal = Array(12).fill(0);
      const monthlyUSD = Array(12).fill(0);
      let totalLocal = 0;
      let totalUSD = 0;

      rows.forEach(r => {
        const rate = r.rate || 1.0;
        if (r.monthlyValues) {
          Object.entries(r.monthlyValues).forEach(([mIdx, val]) => {
            const num = Utils.parseNumber(val);
            monthlyLocal[mIdx] += num;
            monthlyUSD[mIdx] += Utils.convertToUSD(num, rate);
            totalLocal += num;
            totalUSD += Utils.convertToUSD(num, rate);
          });
        }
      });
      return { monthlyLocal, monthlyUSD, totalLocal, totalUSD };
    };

    const matchedOtherCostIndices = new Set();

    const lines = coa.map(account => {
      const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(account) : null;
      if (typeof Auth !== 'undefined' && targetCat && !Auth.hasPermission('view', { category: targetCat, ledgerCode: account.ledgerCode, glDescription: account.glDescription, parentAccount: account.parentAccount })) {
        return null;
      }

      let linkedSource = '';
      const accGlClean = cleanStr(account.glDescription);
      const accLedgerClean = cleanStr(account.ledgerCode);
      const accParentClean = cleanStr(account.parentAccount);

      let rollup = { monthlyLocal: Array(12).fill(0), monthlyUSD: Array(12).fill(0), totalLocal: 0, totalUSD: 0 };

      if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911') || accParentClean.includes('salariesandwages')) {
        linkedSource = 'Payroll — Salaries & Wages';
        rollup = sumRowsWithConversion(allSalaries);
      } else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913') || accParentClean.includes('otherstaff')) {
        linkedSource = 'Payroll — Other Staff Expenses';
        rollup = sumRowsWithConversion(allOtherStaff);
      } else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912') || accParentClean.includes('health') || accParentClean.includes('retirement')) {
        linkedSource = 'Payroll — Gratuity & Bonus';
        rollup = sumRowsWithConversion(allGratuity);
      } else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921') || accParentClean.includes('resourceperson')) {
        linkedSource = 'Payroll — EHA Consultants';
        rollup = sumRowsWithConversion(allEha);
      } else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113') || accParentClean.includes('fixedasset')) {
        linkedSource = 'Fixed Assets';
        rollup = sumRowsWithConversion(allFixedAssets);
      } else {
        linkedSource = 'Other Costs';
        const matchingOther = allNonPayroll.filter((o, idx) => {
          const oLedger = cleanStr(o.ledgerCode);
          const oGl = cleanStr(o.glDescription);
          const oParent = cleanStr(o.parentAccount);

          const isMatch = (oLedger && accLedgerClean && oLedger === accLedgerClean) ||
                          (oGl && accGlClean && (oGl === accGlClean || oGl.includes(accGlClean) || accGlClean.includes(oGl))) ||
                          (oParent && accParentClean && oParent === accParentClean && oGl === accGlClean);

          if (isMatch) matchedOtherCostIndices.add(idx);
          return isMatch;
        });

        rollup = sumRowsWithConversion(matchingOther);
      }

      return {
        parentAccount: account.parentAccount,
        glDescription: account.glDescription,
        ledgerCode: account.ledgerCode,
        linkedSource,
        monthlyLocal: rollup.monthlyLocal,
        monthlyUSD: rollup.monthlyUSD,
        totalLocal: rollup.totalLocal,
        totalUSD: rollup.totalUSD
      };
    }).filter(Boolean);

    return lines;
  },

  async exportReportToExcel(type) {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'reports' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export financial reports.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const years = await db.getAll(STORES.budgetYears);
    const rawEntities = await db.getAll(STORES.entities);
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));

    const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' });
    const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff' });
    const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity' });
    const canViewEha = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha' });
    const canViewFixedAssets = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets' });

    const wb = XLSX.utils.book_new();

    // Helper to generate Global USD Summary Sheet
    const addGlobalSummarySheet = async () => {
      const rows = [
        ['Noora Health — Global Consolidated Budget (USD)', `CY-${budgetYear}`],
        ['Entity-wise Rollup converted at approved budget exchange rates'],
        [],
        ['Entity', 'Country', 'Currency', 'Exchange Rate to USD', 'Total Budget (Local Currency)', 'Total Budget (USD)', ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`)]
      ];

      let grandTotalUSD = 0;
      const grandMonthlyUSD = Array(12).fill(0);

      for (const e of entities) {
        const payroll = (canViewSalaries || canViewOtherStaff || canViewGratuity) ? await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id) : [];
        const filteredPayroll = payroll.filter(p => {
          const sub = p.subCategory || 'salaries-wages';
          if (sub === 'salaries-wages' && !canViewSalaries) return false;
          if (sub === 'other-staff-expenses' && !canViewOtherStaff) return false;
          if (sub === 'gratuity-bonus' && !canViewGratuity) return false;
          return true;
        });

        const eha = canViewEha ? await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id) : [];
        const fixedAssets = canViewFixedAssets ? await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id) : [];
        const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);
        const filteredNonPayroll = nonPayroll.filter(r => {
          const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
          return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: r.deptId });
        });

        const monthlyLocal = Array(12).fill(0);
        let totalLocal = 0;

        [...filteredPayroll, ...eha, ...fixedAssets, ...filteredNonPayroll].forEach(row => {
          if (row.monthlyValues) {
            Object.entries(row.monthlyValues).forEach(([mIdx, val]) => {
              const num = Utils.parseNumber(val);
              monthlyLocal[mIdx] += num;
              totalLocal += num;
            });
          }
        });

        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const monthlyUSD = monthlyLocal.map(v => Utils.convertToUSD(v, rate));
        const totalUSD = Utils.convertToUSD(totalLocal, rate);

        monthlyUSD.forEach((v, idx) => grandMonthlyUSD[idx] += v);
        grandTotalUSD += totalUSD;

        rows.push([e.name, e.country, e.currency, rate, totalLocal, totalUSD, ...monthlyUSD]);
      }

      rows.push(['GRAND TOTAL (GLOBAL USD)', 'All Entities', 'USD', 1.0, '', grandTotalUSD, ...grandMonthlyUSD]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Global USD Summary');
    };

    // Helper to generate Global Line Items Sheet
    const addGlobalLineItemsSheet = async () => {
      const lines = await this.getReportClubbedLines(entities, yearId, activeYearObj.conversionRates);
      const grandTotalUSD = lines.reduce((sum, r) => sum + r.totalUSD, 0);
      const grandMonthlyUSD = Array(12).fill(0);
      lines.forEach(r => r.monthlyUSD.forEach((v, idx) => grandMonthlyUSD[idx] += v));

      const rows = [
        ['Noora Health — Global Consolidated Line Items (USD)', `CY-${budgetYear}`],
        ['All departments across all countries clubbed by GL Line Item and converted to USD'],
        [],
        ['Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source', 'Total Budget (USD)', ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`)]
      ];

      rows.push(['GRAND TOTAL (GLOBAL USD)', 'All Countries Clubbed', '—', 'Global Rollup', grandTotalUSD, ...grandMonthlyUSD]);
      lines.forEach(r => {
        rows.push([r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource, r.totalUSD, ...r.monthlyUSD]);
      });
      rows.push(['GRAND TOTAL (GLOBAL USD)', 'Consolidated USD', '', '', grandTotalUSD, ...grandMonthlyUSD]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Global Line Items (USD)');
    };

    // Helper to generate India Summary Sheet
    const addIndiaSummarySheet = async () => {
      const indiaEntities = entities.filter(e => e.country === 'India');
      const inrRate = activeYearObj.conversionRates?.INR || 83.5;
      const rows = [
        ['Noora Health — India Consolidated Budget (NHIPL + YAIF)', `CY-${budgetYear}`],
        [`Conversion Rate: 1 USD = ${inrRate} INR`],
        [],
        ['India Entity', 'Currency', 'Exchange Rate', 'Total Budget (INR ₹)', 'Total Budget (USD $)', ...SEED_DATA.months.map(m => `${m}-${budgetYear} (INR)`)]
      ];

      let grandTotalINR = 0;
      let grandTotalUSD = 0;
      const grandMonthly = Array(12).fill(0);

      for (const e of indiaEntities) {
        const payroll = (canViewSalaries || canViewOtherStaff || canViewGratuity) ? await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id) : [];
        const filteredPayroll = payroll.filter(p => {
          const sub = p.subCategory || 'salaries-wages';
          if (sub === 'salaries-wages' && !canViewSalaries) return false;
          if (sub === 'other-staff-expenses' && !canViewOtherStaff) return false;
          if (sub === 'gratuity-bonus' && !canViewGratuity) return false;
          return true;
        });

        const eha = canViewEha ? await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id) : [];
        const fixedAssets = canViewFixedAssets ? await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id) : [];
        const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);
        const filteredNonPayroll = nonPayroll.filter(r => {
          const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
          return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: r.deptId });
        });

        const monthly = Array(12).fill(0);
        let total = 0;

        [...filteredPayroll, ...eha, ...fixedAssets, ...filteredNonPayroll].forEach(row => {
          if (row.monthlyValues) {
            Object.entries(row.monthlyValues).forEach(([mIdx, val]) => {
              const num = Utils.parseNumber(val);
              monthly[mIdx] += num;
              total += num;
            });
          }
        });

        const totalUSD = Utils.convertToUSD(total, inrRate);
        grandTotalINR += total;
        grandTotalUSD += totalUSD;
        monthly.forEach((v, idx) => grandMonthly[idx] += v);

        rows.push([e.name, 'INR', inrRate, total, totalUSD, ...monthly]);
      }

      rows.push(['INDIA CONSOLIDATED TOTAL', 'INR', inrRate, grandTotalINR, grandTotalUSD, ...grandMonthly]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'India Summary');
    };

    // Helper to generate India Line Items Sheet
    const addIndiaLineItemsSheet = async () => {
      const indiaEntities = entities.filter(e => e.country === 'India');
      const inrRate = activeYearObj.conversionRates?.INR || 83.5;
      const lines = await this.getReportClubbedLines(indiaEntities, yearId, activeYearObj.conversionRates);
      const grandTotalINR = lines.reduce((sum, r) => sum + r.totalLocal, 0);
      const grandTotalUSD = Utils.convertToUSD(grandTotalINR, inrRate);
      const grandMonthlyINR = Array(12).fill(0);
      lines.forEach(r => r.monthlyLocal.forEach((v, idx) => grandMonthlyINR[idx] += v));

      const rows = [
        ['Noora Health — India Consolidated Line Items (NHIPL + YAIF)', `CY-${budgetYear}`],
        [`All departments across NHIPL & YAIF clubbed by GL Line Item @ 1 USD = ${inrRate} INR`],
        [],
        ['Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source', 'Total (INR ₹)', 'Total (USD $)', ...SEED_DATA.months.map(m => `${m}-${budgetYear} (INR)`)]
      ];

      rows.push(['INDIA CONSOLIDATED TOTAL', 'NHIPL + YAIF Combined', '—', 'India Rollup', grandTotalINR, grandTotalUSD, ...grandMonthlyINR]);
      lines.forEach(r => {
        rows.push([r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource, r.totalLocal, r.totalUSD, ...r.monthlyLocal]);
      });
      rows.push(['INDIA CONSOLIDATED TOTAL', 'NHIPL + YAIF Rollup', '', '', grandTotalINR, grandTotalUSD, ...grandMonthlyINR]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'India Line Items');
    };

    // Helper to generate Single Entity Dept Summary Sheet
    const addEntitySummarySheet = async () => {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;

      const rows = [
        [`Noora Health — Single Entity Budget Summary: ${entity.name} (${entity.shortName})`, `CY-${budgetYear}`],
        [`Currency: ${entity.currency}`, entity.currency !== 'USD' ? `Exchange Rate: 1 USD = ${rate} ${entity.currency}` : ''],
        [],
        ['Department', 'Salaries & Wages', 'Other Staff & Benefits', 'EHA Consultants', 'Fixed Assets', 'Other Costs', `Total Dept Budget (${entity.currency})`, 'Total Dept Budget (USD)']
      ];

      for (const d of departments) {
        const payroll = (canViewSalaries || canViewOtherStaff || canViewGratuity) ? await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, d.id) : [];
        const salaries = canViewSalaries ? payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages') : [];
        const otherStaffGratuity = payroll.filter(p => (canViewOtherStaff && p.subCategory === 'other-staff-expenses') || (canViewGratuity && p.subCategory === 'gratuity-bonus'));
        const eha = canViewEha ? await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, d.id) : [];
        const fixedAssets = canViewFixedAssets ? await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, d.id) : [];
        const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, d.id);
        const filteredNonPayroll = nonPayroll.filter(r => {
          const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
          return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: entity.id, deptId: d.id });
        });

        let sal = 0, oth = 0, ehaTot = 0, fa = 0, np = 0;
        salaries.forEach(p => sal += Utils.parseNumber(p.totalCY));
        otherStaffGratuity.forEach(p => oth += Utils.parseNumber(p.totalCY));
        eha.forEach(p => ehaTot += Utils.parseNumber(p.totalCY));
        fixedAssets.forEach(f => fa += Utils.parseNumber(f.totalCY));
        filteredNonPayroll.forEach(p => np += Utils.parseNumber(p.totalCY));

        const grand = sal + oth + ehaTot + fa + np;
        if (grand > 0) {
          const grandUSD = Utils.convertToUSD(grand, rate);
          rows.push([Utils.getDeptName(d, entity.deptPrefix), sal, oth, ehaTot, fa, np, grand, grandUSD]);
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `${entity.shortName} Dept Summary`);
    };

    // Helper to generate Single Entity Line Items Sheet
    const addEntityLineItemsSheet = async () => {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;
      const lines = await this.getReportClubbedLines([entity], yearId, activeYearObj.conversionRates);
      const grandTotalLocal = lines.reduce((sum, r) => sum + r.totalLocal, 0);
      const grandTotalUSD = Utils.convertToUSD(grandTotalLocal, rate);
      const grandMonthlyLocal = Array(12).fill(0);
      lines.forEach(r => r.monthlyLocal.forEach((v, idx) => grandMonthlyLocal[idx] += v));

      const rows = [
        [`Noora Health — ${entity.shortName} Consolidated Line Items`, `CY-${budgetYear}`],
        [`All departments of ${entity.name} clubbed by GL Line Item (${entity.currency})`],
        [],
        ['Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source', `Total (${entity.currency})`, 'Total (USD)', ...SEED_DATA.months.map(m => `${m}-${budgetYear}`)]
      ];

      rows.push([`${entity.shortName} TOTAL`, 'All Departments Combined', '—', 'Entity Rollup', grandTotalLocal, grandTotalUSD, ...grandMonthlyLocal]);
      lines.forEach(r => {
        rows.push([r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource, r.totalLocal, r.totalUSD, ...r.monthlyLocal]);
      });
      rows.push([`${entity.shortName} TOTAL`, `${entity.currency} & USD Rollup`, '', '', grandTotalLocal, grandTotalUSD, ...grandMonthlyLocal]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `${entity.shortName} Line Items`);
    };

    // Helper to generate Department Total Cost Sheet
    const addDeptCostSheet = async () => {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const selectedDeptId = ReportsModule.selectedDeptId || App.selectedDept || departments[0]?.id || '';
      const dept = departments.find(d => d.id === selectedDeptId) || departments[0];
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;
      const coa = await db.getAll(STORES.chartOfAccounts);
      const priorCosts = await db.getPriorPeriodCosts(yearId, entity.id, dept.id);
      const priorYear = activeYearObj.priorYear || (budgetYear - 1);

      const rows = [
        [`Noora Health — Total Department Cost Report: ${Utils.getDeptName(dept, entity.deptPrefix)}`, `CY-${budgetYear}`],
        [`Entity: ${entity.name} (${entity.shortName})`, `Currency: ${entity.currency}`, entity.currency !== 'USD' ? `Exchange Rate: 1 USD = ${rate} ${entity.currency}` : ''],
        [],
        ['Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source', 'Basis of Expense', `Total CY-${budgetYear} (${entity.currency})`, 'Total USD', ...SEED_DATA.months.map(m => `${m}-${budgetYear}`), `Prior Period Cost (CY-${priorYear})`, 'Remarks']
      ];

      const payroll = (canViewSalaries || canViewOtherStaff || canViewGratuity) ? await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id) : [];
      const salariesRows = canViewSalaries ? payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages') : [];
      const otherStaffRows = canViewOtherStaff ? payroll.filter(p => p.subCategory === 'other-staff-expenses') : [];
      const gratuityRows = canViewGratuity ? payroll.filter(p => p.subCategory === 'gratuity-bonus') : [];
      const ehaRows = canViewEha ? await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, dept.id) : [];
      const fixedAssetRows = canViewFixedAssets ? await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, dept.id) : [];
      const otherCostRows = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, dept.id);

      const sumMonths = (dataRows) => {
        const months = Array(12).fill(0);
        let total = 0;
        dataRows.forEach(r => {
          if (r.monthlyValues) {
            Object.entries(r.monthlyValues || {}).forEach(([mIdx, val]) => {
              const num = Utils.parseNumber(val);
              months[mIdx] += num;
              total += num;
            });
          }
        });
        return { monthlyValues: months, totalCY: total };
      };

      const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const priorMap = {};
      priorCosts.forEach(p => {
        if (p.ledgerCode) priorMap[cleanStr(p.ledgerCode)] = p.priorCost || 0;
        if (p.glDescription) priorMap[cleanStr(p.glDescription)] = p.priorCost || 0;
      });

      coa.forEach(account => {
        const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(account) : null;
        if (typeof Auth !== 'undefined' && targetCat && !Auth.hasPermission('view', { category: targetCat, ledgerCode: account.ledgerCode, glDescription: account.glDescription, parentAccount: account.parentAccount, entityId: entity.id, deptId: dept.id })) {
          return;
        }

        let rollup = { monthlyValues: Array(12).fill(0), totalCY: 0 };
        let linkedSource = '';
        const accGlClean = cleanStr(account.glDescription);
        const accLedgerClean = cleanStr(account.ledgerCode);

        if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911')) {
          linkedSource = 'Payroll — Salaries & Wages';
          rollup = sumMonths(salariesRows);
        } else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913')) {
          linkedSource = 'Payroll — Other Staff Expenses';
          rollup = sumMonths(otherStaffRows);
        } else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912')) {
          linkedSource = 'Payroll — Gratuity & Bonus';
          rollup = sumMonths(gratuityRows);
        } else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921')) {
          linkedSource = 'Payroll — EHA Consultants';
          rollup = sumMonths(ehaRows);
        } else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113')) {
          linkedSource = 'Fixed Assets';
          rollup = sumMonths(fixedAssetRows);
        } else {
          linkedSource = 'Other Costs';
          const matchingOther = otherCostRows.filter(o => cleanStr(o.ledgerCode) === accLedgerClean || cleanStr(o.glDescription) === accGlClean);
          rollup = sumMonths(matchingOther);
        }

        const priorCost = priorMap[accLedgerClean] || priorMap[accGlClean] || 0;
        const totalUSD = Utils.convertToUSD(rollup.totalCY, rate);
        rows.push([account.parentAccount, account.glDescription, account.ledgerCode, linkedSource, '', rollup.totalCY, totalUSD, ...rollup.monthlyValues, priorCost, '']);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Total Dept Cost');
    };

    // Helper to generate Line Items sheet for any specific entity
    const addIndividualEntityLineItemsSheet = async (entity) => {
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;
      const lines = await this.getReportClubbedLines([entity], yearId, activeYearObj.conversionRates);
      const grandTotalLocal = lines.reduce((sum, r) => sum + r.totalLocal, 0);
      const grandTotalUSD = Utils.convertToUSD(grandTotalLocal, rate);
      const grandMonthlyLocal = Array(12).fill(0);
      lines.forEach(r => r.monthlyLocal.forEach((v, idx) => grandMonthlyLocal[idx] += v));

      const rows = [
        [`Noora Health — ${entity.shortName} Consolidated Line Items`, `CY-${budgetYear}`],
        [`All departments of ${entity.name} (${entity.country}) clubbed by GL Line Item`],
        [`Currency: ${entity.currency}`, entity.currency !== 'USD' ? `Exchange Rate: 1 USD = ${rate} ${entity.currency}` : ''],
        [],
        ['Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source', `Total (${entity.currency})`, 'Total (USD)', ...SEED_DATA.months.map(m => `${m}-${budgetYear}`)]
      ];

      rows.push([`${entity.shortName} TOTAL`, 'All Departments Combined', '—', 'Entity Rollup', grandTotalLocal, grandTotalUSD, ...grandMonthlyLocal]);
      lines.forEach(r => {
        rows.push([r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource, r.totalLocal, r.totalUSD, ...r.monthlyLocal]);
      });
      rows.push([`${entity.shortName} TOTAL`, `${entity.currency} & USD Rollup`, '', '', grandTotalLocal, grandTotalUSD, ...grandMonthlyLocal]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const sheetName = `${entity.shortName} Line Items`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    // Helper to generate Master Entity & Department-wise Line Items in a Single Sheet
    const addMasterEntityAndDeptLineItemsSheet = async () => {
      const coa = await db.getAll(STORES.chartOfAccounts);
      const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const priorYear = activeYearObj.priorYear || (budgetYear - 1);

      const rows = [
        [`Noora Health — Comprehensive Entity & Department Line Items Budget`, `CY-${budgetYear}`],
        ['Granular Line Item Details across all Entities and Departments in a Single Sheet'],
        [],
        [
          'Entity Code', 'Entity Name', 'Department Code', 'Department Name', 'Currency',
          'Parent Account', 'GL Line Item Description', 'Ledger Code', 'Linked Input Source',
          'Basis of Expense', `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          `Prior Period Cost (CY-${priorYear})`, 'Remarks'
        ]
      ];

      for (const e of entities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const entityConfigs = await db.getEntityDeptConfigForYear(yearId, e.id);
        const activeDeptIds = new Set(entityConfigs.filter(c => c.isActive).map(c => c.deptId));
        const entityDepts = departments.filter(d => activeDeptIds.size === 0 || activeDeptIds.has(d.id));

        for (const d of entityDepts) {
          const payroll = (canViewSalaries || canViewOtherStaff || canViewGratuity) ? await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id) : [];
          const salariesRows = canViewSalaries ? payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages') : [];
          const otherStaffRows = canViewOtherStaff ? payroll.filter(p => p.subCategory === 'other-staff-expenses') : [];
          const gratuityRows = canViewGratuity ? payroll.filter(p => p.subCategory === 'gratuity-bonus') : [];
          const ehaRows = canViewEha ? await db.getBudgetData(STORES.payrollEHA, yearId, e.id, d.id) : [];
          const fixedAssetRows = canViewFixedAssets ? await db.getBudgetData(STORES.payrollFixedAsset, yearId, e.id, d.id) : [];
          const otherCostRows = await db.getBudgetData(STORES.nonPayrollCost, yearId, e.id, d.id);

          const totalDeptActivity = payroll.length + ehaRows.length + fixedAssetRows.length + otherCostRows.length;
          if (totalDeptActivity === 0) continue;

          const priorCosts = await db.getPriorPeriodCosts(yearId, e.id, d.id);
          const priorMap = {};
          priorCosts.forEach(p => {
            if (p.ledgerCode) priorMap[cleanStr(p.ledgerCode)] = p.priorCost || 0;
            if (p.glDescription) priorMap[cleanStr(p.glDescription)] = p.priorCost || 0;
          });

          const sumMonths = (dataRows) => {
            const months = Array(12).fill(0);
            let total = 0;
            dataRows.forEach(r => {
              if (r.monthlyValues) {
                Object.entries(r.monthlyValues || {}).forEach(([mIdx, val]) => {
                  const num = Utils.parseNumber(val);
                  months[mIdx] += num;
                  total += num;
                });
              }
            });
            return { monthlyValues: months, totalCY: total };
          };

          const savedBasisMap = {};
          const savedRemarksMap = {};
          otherCostRows.forEach(r => {
            if (r.ledgerCode) {
              savedBasisMap[r.ledgerCode] = r.basisOfExpense || '';
              savedRemarksMap[r.ledgerCode] = r.remarks || '';
            } else if (r.glDescription) {
              savedBasisMap[r.glDescription] = r.basisOfExpense || '';
              savedRemarksMap[r.glDescription] = r.remarks || '';
            }
          });

          coa.forEach(account => {
            const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(account) : null;
            if (typeof Auth !== 'undefined' && targetCat && !Auth.hasPermission('view', { category: targetCat, ledgerCode: account.ledgerCode, glDescription: account.glDescription, parentAccount: account.parentAccount, entityId: e.id, deptId: d.id })) {
              return;
            }

            let rollup = { monthlyValues: Array(12).fill(0), totalCY: 0 };
            let linkedSource = '';
            let basis = savedBasisMap[account.ledgerCode] || savedBasisMap[account.glDescription] || '';
            let remarks = savedRemarksMap[account.ledgerCode] || savedRemarksMap[account.glDescription] || '';

            const accGlClean = cleanStr(account.glDescription);
            const accLedgerClean = cleanStr(account.ledgerCode);
            const accParentClean = cleanStr(account.parentAccount);

            if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911') || accParentClean.includes('salariesandwages')) {
              linkedSource = 'Payroll — Salaries & Wages';
              rollup = sumMonths(salariesRows);
            } else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913') || accParentClean.includes('otherstaff')) {
              linkedSource = 'Payroll — Other Staff Expenses';
              rollup = sumMonths(otherStaffRows);
            } else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912') || accParentClean.includes('health') || accParentClean.includes('retirement')) {
              linkedSource = 'Payroll — Gratuity & Bonus';
              rollup = sumMonths(gratuityRows);
            } else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921') || accParentClean.includes('resourceperson')) {
              linkedSource = 'Payroll — EHA Consultants';
              rollup = sumMonths(ehaRows);
            } else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113') || accParentClean.includes('fixedasset')) {
              linkedSource = 'Fixed Assets';
              rollup = sumMonths(fixedAssetRows);
            } else {
              linkedSource = 'Other Costs';
              const matchingOther = otherCostRows.filter(o => cleanStr(o.ledgerCode) === accLedgerClean || cleanStr(o.glDescription) === accGlClean);
              rollup = sumMonths(matchingOther);
            }

            const priorCost = priorMap[accLedgerClean] || priorMap[accGlClean] || 0;
            const totalUSD = Utils.convertToUSD(rollup.totalCY, rate);
            rows.push([
              e.shortName, e.name, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix), e.currency,
              account.parentAccount, account.glDescription, account.ledgerCode, linkedSource,
              basis, rollup.totalCY, totalUSD, ...rollup.monthlyValues, priorCost, remarks
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Entity & Dept Line Items');
    };

    // Helper to safely extract 12 monthly values
    const get12Months = (row) => {
      const arr = Array(12).fill(0);
      if (!row || !row.monthlyValues) return arr;
      if (Array.isArray(row.monthlyValues)) {
        return row.monthlyValues.map(v => Utils.parseNumber(v));
      }
      Object.entries(row.monthlyValues).forEach(([k, v]) => {
        const idx = parseInt(k, 10);
        if (idx >= 0 && idx < 12) arr[idx] = Utils.parseNumber(v);
      });
      return arr;
    };

    // Helper: Add Detailed Salaries & Wages Inputs Sheet
    const addSalariesInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'Salaries & Wages (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'salaries' })) return;

      const rows = [
        [`Noora Health — Detailed Salaries & Wages Budget (Bottom-Up Personnel Inputs)`, `CY-${budgetYear}`],
        ['Includes employee roster, designations, dates of joining, band, level, current CTC, increment details, new monthly CTC, monthly allocations & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Employee Status', 'Employee Code', 'Employee Name', 'Designation', 'Date of Joining',
          'Band', 'Level', 'Current Monthly CTC (Local)', 'Increment %', 'Increment Value (Local)',
          'New Monthly CTC (Local)', 'New Monthly CTC (USD)', `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'salaries', entityId: e.id, deptId: d.id })) continue;
          const records = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
          const salaries = records.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');

          salaries.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            const curCTC = Utils.parseNumber(r.currentMonthlyCTC) || 0;
            const incPct = Utils.parseNumber(r.incrementPct) || 0;
            const incVal = Utils.parseNumber(r.incrementValue) || Math.round(curCTC * (incPct / 100));
            const newCTC = Utils.parseNumber(r.newMonthlyCTC) || (curCTC + incVal);
            const newCTCUSD = Utils.convertToUSD(newCTC, rate);

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.employeeStatus || 'Existing', r.employeeCode || '', r.name || '', r.designation || '', r.dateOfJoining || '',
              r.banding || '', r.level || '', curCTC, incPct, incVal,
              newCTC, newCTCUSD, totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed Other Staff Expenses Inputs Sheet
    const addOtherStaffInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'Other Staff Expenses (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'other-staff' })) return;

      const rows = [
        [`Noora Health — Detailed Other Staff Expenses & Benefits Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes staff insurance, medical coverage, allowances, staff welfare, training, reimbursements, monthly allocations & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Expense Item / Staff Name', 'Designation / Role', 'Expense Category / Benefit Type',
          `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'other-staff', entityId: e.id, deptId: d.id })) continue;
          const records = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
          const otherStaff = records.filter(p => p.subCategory === 'other-staff-expenses');

          otherStaff.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.name || '', r.designation || '', r.expenseType || r.banding || 'Staff Benefit',
              totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed Gratuity & Bonus Inputs Sheet
    const addGratuityBonusInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'Gratuity & Bonus (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'gratuity' })) return;

      const rows = [
        [`Noora Health — Detailed Gratuity & Statutory Bonus Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes gratuity provisions, statutory bonuses, performance awards, retirement allocations & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Employee Name / Item', 'Designation / Role', 'Bonus / Benefit Type',
          `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'gratuity', entityId: e.id, deptId: d.id })) continue;
          const records = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
          const gratuity = records.filter(p => p.subCategory === 'gratuity-bonus');

          gratuity.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.name || '', r.designation || '', r.expenseType || r.banding || 'Gratuity / Bonus',
              totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed EHA Consultants Inputs Sheet
    const addEhaInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'EHA Consultants (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'eha' })) return;

      const rows = [
        [`Noora Health — Detailed External Hired Assistance (EHA Consultants) Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes professional consultants, advisory contracts, monthly fees, retainers, deliverable budgets & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Consultant Name', 'Specialization / Role', 'Contract Type / Scope', 'Monthly Rate / Unit Cost',
          `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'eha', entityId: e.id, deptId: d.id })) continue;
          const eha = await db.getBudgetData(STORES.payrollEHA, yearId, e.id, d.id);

          eha.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            const rateVal = Utils.parseNumber(r.rate) || Utils.parseNumber(r.monthlyRate) || 0;

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.name || r.consultantName || '', r.designation || r.role || '', r.contractType || r.scope || 'Retainer', rateVal,
              totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed Fixed Assets (CapEx) Inputs Sheet
    const addFixedAssetsInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'Fixed Assets (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'fixed-assets' })) return;

      const rows = [
        [`Noora Health — Detailed Fixed Assets (CapEx) Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes IT hardware (laptops, desktops, monitors, printers), office equipment, quantities, unit costs, delivery schedule & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Asset Category', 'Item Description / Specifications', 'Quantity', 'Unit Cost (Local)',
          `Total Cost CY-${budgetYear} (Local)`, `Total Cost CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'fixed-assets', entityId: e.id, deptId: d.id })) continue;
          const assets = await db.getBudgetData(STORES.payrollFixedAsset, yearId, e.id, d.id);

          assets.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            const qty = Utils.parseNumber(r.quantity) || 1;
            const unitCost = Utils.parseNumber(r.unitCost) || (qty > 0 ? Math.round(totalLocal / qty) : totalLocal);

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.category || r.assetCategory || 'IT Hardware', r.description || r.itemDescription || r.name || '', qty, unitCost,
              totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed Operating, Travel, Lodging & Non-Payroll Inputs Sheet
    const addNonPayrollOperatingInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'Operating & Travel (Inputs)') => {
      const rows = [
        [`Noora Health — Detailed Operating, Travel, Lodging & Non-Payroll Costs Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes travel packages (airfare, lodging, per diem, local cab), workshop logistics, printing, office rent, utilities, calculation basis & 5D tags'],
        [],
        [
          'Legal Entity', 'Country', 'Currency', 'Department Code', 'Department Name',
          'Parent Account', 'GL Line Description', 'Ledger Code', 'Cost Sub-Category (Travel/Ops/Supplies)',
          'Cost Description / Driver / Trip Details', 'Quantity / Units / Trips', 'Unit Cost / Rate',
          'Basis of Estimation / Formula', `Total Cost CY-${budgetYear} (Local)`, `Total Cost CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, e.id, d.id);
          const filteredNonPayroll = nonPayroll.filter(r => {
            const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
            return typeof Auth === 'undefined' || Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: d.id });
          });

          filteredNonPayroll.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            const qty = Utils.parseNumber(r.quantity) || Utils.parseNumber(r.units) || '';
            const unitRate = Utils.parseNumber(r.unitRate) || Utils.parseNumber(r.rate) || '';

            rows.push([
              e.shortName, e.country, e.currency, Utils.getDeptShortCode(d, e.deptPrefix), Utils.getDeptName(d, e.deptPrefix),
              r.parentAccount || '', r.glDescription || '', r.ledgerCode || '', r.subCategory || r.category || 'Operating Cost',
              r.description || r.costDescription || r.itemDescription || '', qty, unitRate,
              r.basisOfExpense || r.basis || '', totalLocal, totalUSD,
              ...mVals,
              r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
            ]);
          });
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed IMP ToT Programs & Training Workshops Inputs Sheet
    const addImpTotProgramsInputSheet = async (targetEntities, targetDepts = null, sheetTitle = 'IMP Programs (Inputs)') => {
      if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'other-costs' }) && !Auth.hasPermission('view', { category: 'tot-programs' }) && !Auth.hasPermission('view', { category: 'other-expenses' })) return;

      const allEvents = await db.getAll(STORES.impTotEvents);
      if (!allEvents || allEvents.length === 0) return;

      const targetEntityIds = new Set(targetEntities.map(e => e.id));
      const eventsForScope = allEvents.filter(ev => (!ev.yearId || String(ev.yearId) === String(yearId)) && (!ev.entityId || targetEntityIds.has(ev.entityId)));
      if (eventsForScope.length === 0) return;

      const rows = [
        [`Noora Health — Detailed IMP Training Programs & Workshops Budget (Bottom-Up Inputs)`, `CY-${budgetYear}`],
        ['Includes training events, target cadres, participant batches, duration, benchmark rates & 5D tags'],
        [],
        [
          'Legal Entity', 'Department Code', 'Program Name', 'Event / Workshop Name', 'State / Region',
          'Target Cadre', 'Batches', 'Participants / Batch', 'Days / Duration',
          `Total Budget (Local)`, `Total Budget (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear}`),
          'Location', 'Donor', 'Activity', 'Condition Area', 'Remarks'
        ]
      ];

      eventsForScope.forEach(r => {
        const ent = targetEntities.find(e => e.id === r.entityId) || targetEntities[0] || { currency: 'INR', deptPrefix: 'IN' };
        const rate = activeYearObj.conversionRates?.[ent.currency] || 1.0;
        const deptObj = departments.find(d => d.id === r.deptId) || { id: r.deptId };
        const mVals = get12Months(r);
        const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
        const totalUSD = Utils.convertToUSD(totalLocal, rate);

        rows.push([
          ent.shortName || r.entityId || '', Utils.getDeptShortCode(deptObj, ent.deptPrefix), r.programName || '', r.eventName || r.name || '', r.state || '',
          r.targetCadre || r.cadre || '', r.batches || 1, r.participantsPerBatch || r.participants || 0, r.days || 1,
          totalLocal, totalUSD,
          ...mVals,
          r.location || '', r.donor || '', r.activity || '', r.conditionArea || '', r.remarks || ''
        ]);
      });

      if (rows.length > 3) {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
      }
    };

    // Helper: Extract all budget line items with unified 5 dimensions across selected entities & departments
    const getUnified5DLineItems = async (targetEntities, targetDepts = null) => {
      const lineItems = [];
      const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' });
      const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff' });
      const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity' });
      const canViewEha = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha' });
      const canViewFixedAssets = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets' });

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        const deptsToIterate = targetDepts || departments;
        for (const d of deptsToIterate) {
          const deptShort = Utils.getDeptShortCode(d, e.deptPrefix);
          const deptName = Utils.getDeptName(d, e.deptPrefix);

          // 1. Salaries
          if (canViewSalaries && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const salaries = payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
            salaries.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Direct Service',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Salaries & Wages',
                ledgerCode: '91101',
                linkedSource: 'Payroll — Salaries & Wages',
                itemDescription: `${r.name || 'Staff'}${r.designation ? ' (' + r.designation + ')' : ''}`,
                basisOfExpense: `${r.banding || 'NH3'} - ${r.employeeStatus || 'Existing'}`,
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 2. Other Staff Expenses
          if (canViewOtherStaff && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const otherStaff = payroll.filter(p => p.subCategory === 'other-staff-expenses');
            otherStaff.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Staff Insurance, Welfare & Benefits',
                ledgerCode: '91301',
                linkedSource: 'Payroll — Other Staff Expenses',
                itemDescription: r.name || r.expenseType || 'Staff Expense',
                basisOfExpense: r.expenseType || 'Staff Benefit',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 3. Gratuity & Bonus
          if (canViewGratuity && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const gratuity = payroll.filter(p => p.subCategory === 'gratuity-bonus');
            gratuity.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Gratuity & Statutory Bonus',
                ledgerCode: '91201',
                linkedSource: 'Payroll — Gratuity & Bonus',
                itemDescription: r.name || 'Bonus Provision',
                basisOfExpense: r.expenseType || 'Gratuity / Bonus',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 4. EHA Consultants
          if (canViewEha && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha', entityId: e.id, deptId: d.id }))) {
            const eha = await db.getBudgetData(STORES.payrollEHA, yearId, e.id, d.id);
            eha.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Direct Service',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Professional Fees',
                glDescription: 'Program Resource Consultants (EHA)',
                ledgerCode: '92101',
                linkedSource: 'Payroll — EHA Consultants',
                itemDescription: `${r.name || r.consultantName || 'Consultant'}${r.designation ? ' (' + r.designation + ')' : ''}`,
                basisOfExpense: r.contractType || 'Retainer',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 5. Fixed Assets
          if (canViewFixedAssets && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets', entityId: e.id, deptId: d.id }))) {
            const fixedAssets = await db.getBudgetData(STORES.payrollFixedAsset, yearId, e.id, d.id);
            fixedAssets.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Fixed Assets & Hardware',
                glDescription: 'Computers, Hardware & Equipment',
                ledgerCode: '11301',
                linkedSource: 'Fixed Assets',
                itemDescription: `${r.category || 'IT Hardware'}: ${r.description || r.itemDescription || 'Equipment'}`,
                basisOfExpense: `Qty: ${r.quantity || 1} @ ${Utils.formatCurrency(r.unitCost || 0, e.currency)}`,
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 6. Non-Payroll / Operating / Travel Costs
          const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, e.id, d.id);
          nonPayroll.forEach(r => {
            const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
            if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: d.id })) {
              return;
            }
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            lineItems.push({
              entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
              deptId: d.id, deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Direct Service',
              conditionArea: r.conditionArea || 'All',
              parentAccount: r.parentAccount || 'Other Costs',
              glDescription: r.glDescription || 'Operating Expense',
              ledgerCode: r.ledgerCode || '93999',
              linkedSource: r.subCategory || 'Operating Costs',
              itemDescription: r.description || r.costDescription || r.itemDescription || 'Cost Item',
              basisOfExpense: r.basisOfExpense || r.basis || '',
              monthlyValuesLocal: mVals,
              monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });
        }
      }
      return lineItems;
    };

    // Helper: Add Dimension Grouped Line Items Sheet (Strictly specific to the selected single dimension)
    const addDimensionGroupedSheet = async (targetEntities, dimKey, sheetTitle) => {
      const dimLabels = {
        donor: 'Donor',
        location: 'Location',
        activity: 'Activity Stream',
        conditionArea: 'Condition Area'
      };
      const dimLabel = dimLabels[dimKey] || 'Dimension';
      const items = await getUnified5DLineItems(targetEntities);

      // Group items strictly by this single dimension value
      const groups = {};
      items.forEach(item => {
        const val = String(item[dimKey] || 'All').trim();
        if (!groups[val]) groups[val] = [];
        groups[val].push(item);
      });

      const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        const totalA = groups[a].reduce((sum, r) => sum + r.totalUSD, 0);
        const totalB = groups[b].reduce((sum, r) => sum + r.totalUSD, 0);
        return totalB - totalA;
      });

      const rows = [
        [`Noora Health — Line Item Wise Budget Report (By ${dimLabel})`, `CY-${budgetYear}`],
        [`Budget report specific to ${dimLabel} with Parent Ledger, Line Item Ledger, and monthly distributions in USD & Local Currencies`],
        [],
        [
          dimLabel,
          'Parent Account / Parent Ledger',
          'GL Line Description / Line Item Ledger',
          'Ledger Code',
          'Expense / Item Description',
          `Total CY-${budgetYear} (Local)`,
          `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
          'Basis of Estimation',
          'Remarks'
        ]
      ];

      let grandTotalLocal = 0;
      let grandTotalUSD = 0;
      const grandMonthlyUSD = Array(12).fill(0);

      sortedGroupKeys.forEach(grpVal => {
        const grpItems = groups[grpVal];
        let grpTotalLocal = 0;
        let grpTotalUSD = 0;
        const grpMonthlyUSD = Array(12).fill(0);

        grpItems.forEach(r => {
          grpTotalLocal += r.totalLocal;
          grpTotalUSD += r.totalUSD;
          r.monthlyValuesUSD.forEach((v, idx) => {
            grpMonthlyUSD[idx] += v;
            grandMonthlyUSD[idx] += v;
          });
        });
        grandTotalLocal += grpTotalLocal;
        grandTotalUSD += grpTotalUSD;

        // Group Header Banner
        rows.push([
          `📁 ${dimLabel.toUpperCase()}: ${grpVal}`,
          `${grpItems.length} Line Items`,
          '—',
          '—',
          'Group Total',
          grpTotalLocal,
          grpTotalUSD,
          ...grpMonthlyUSD,
          'Group Subtotal',
          ''
        ]);

        // Line Items strictly specific to this dimension (No other dimension clutter)
        grpItems.forEach(r => {
          rows.push([
            grpVal,
            r.parentAccount,
            r.glDescription,
            r.ledgerCode,
            r.itemDescription,
            r.totalLocal,
            r.totalUSD,
            ...r.monthlyValuesUSD,
            r.basisOfExpense,
            r.remarks
          ]);
        });

        // Group Subtotal Row
        rows.push([
          `SUBTOTAL (${grpVal})`,
          '—',
          '—',
          '—',
          `${grpItems.length} Items Subtotal`,
          grpTotalLocal,
          grpTotalUSD,
          ...grpMonthlyUSD,
          '',
          ''
        ]);
        rows.push([]); // blank separator
      });

      // Master Grand Total
      rows.push([
        `GRAND TOTAL (ALL ${dimLabel.toUpperCase()}S)`,
        'All Categories Combined',
        '—',
        '—',
        `${items.length} Total Line Items`,
        grandTotalLocal,
        grandTotalUSD,
        ...grandMonthlyUSD,
        '100% Global Rollup',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add 5D Master Matrix / Consolidated 5D Report Sheet (Where ALL dimensions are provided together)
    const add5DMasterMatrixSheet = async (targetEntities, sheetTitle = '5D Consolidated Report') => {
      const items = await getUnified5DLineItems(targetEntities);
      const rows = [
        [`Noora Health — Consolidated 5-Dimensional Line Items Budget Report`, `CY-${budgetYear}`],
        ['Every bottom-up line item mapped with ALL 5 dimensions (Department, Location, Donor, Activity, Condition Area) in a unified dataset'],
        [],
        [
          'Entity Code', 'Entity Name', 'Country', 'Currency',
          'Department Code', 'Department Name',
          'Location Dimension', 'Donor Dimension', 'Activity Dimension', 'Condition Area Dimension',
          'Parent Account / Parent Ledger', 'GL Line Description / Line Item Ledger', 'Ledger Code', 'Linked Input Source',
          'Expense / Item Description', `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (Local)`),
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
          'Basis of Estimation', 'Remarks'
        ]
      ];

      items.forEach(r => {
        rows.push([
          r.entityShort, r.entityName, r.country, r.currency,
          r.deptShort, r.deptName,
          r.location, r.donor, r.activity, r.conditionArea,
          r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource,
          r.itemDescription, r.totalLocal, r.totalUSD,
          ...r.monthlyValuesLocal,
          ...r.monthlyValuesUSD,
          r.basisOfExpense, r.remarks
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Helper: Add Detailed Entity by Department Line Items Sheet (Specific strictly to Entity & Department)
    const addEntityByDepartmentSheet = async (targetEntities, targetDepts = null, sheetTitle = 'By Department') => {
      const rows = [
        [`Noora Health — Entity by Department Budget Report (Month-Wise)`, `CY-${budgetYear}`],
        ['Granular Department-wise Budget breakdown with Parent Ledger, Line Item Ledger, and 12-Month distribution in Local Currency and USD'],
        [],
        [
          'Entity Code', 'Entity Name', 'Country', 'Currency',
          'Department Code', 'Department Name',
          'Parent Account / Parent Ledger', 'GL Description / Line Item Ledger', 'Ledger Code', 'Linked Input Source',
          'Expense / Item Description',
          `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (Local)`),
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
          'Basis of Estimation', 'Remarks'
        ]
      ];

      const items = await getUnified5DLineItems(targetEntities, targetDepts);

      // Group by Entity, then by Department
      const entityMap = {};
      items.forEach(r => {
        const entKey = r.entityShort || r.entityId || 'Entity';
        if (!entityMap[entKey]) entityMap[entKey] = {};
        const deptKey = r.deptShort || r.deptId || 'Dept';
        if (!entityMap[entKey][deptKey]) entityMap[entKey][deptKey] = [];
        entityMap[entKey][deptKey].push(r);
      });

      let grandTotalUSD = 0;
      const grandMonthlyUSD = Array(12).fill(0);

      Object.keys(entityMap).sort().forEach(entKey => {
        const deptsInEnt = entityMap[entKey];
        let entTotalUSD = 0;
        const entMonthlyUSD = Array(12).fill(0);

        Object.keys(deptsInEnt).sort().forEach(deptKey => {
          const deptItems = deptsInEnt[deptKey];
          let deptTotalLocal = 0;
          let deptTotalUSD = 0;
          const deptMonthlyLocal = Array(12).fill(0);
          const deptMonthlyUSD = Array(12).fill(0);

          deptItems.forEach(r => {
            deptTotalLocal += r.totalLocal;
            deptTotalUSD += r.totalUSD;
            entTotalUSD += r.totalUSD;
            grandTotalUSD += r.totalUSD;
            r.monthlyValuesLocal.forEach((v, idx) => deptMonthlyLocal[idx] += v);
            r.monthlyValuesUSD.forEach((v, idx) => {
              deptMonthlyUSD[idx] += v;
              entMonthlyUSD[idx] += v;
              grandMonthlyUSD[idx] += v;
            });

            rows.push([
              r.entityShort, r.entityName, r.country, r.currency,
              r.deptShort, r.deptName,
              r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource,
              r.itemDescription,
              r.totalLocal, r.totalUSD,
              ...r.monthlyValuesLocal,
              ...r.monthlyValuesUSD,
              r.basisOfExpense, r.remarks
            ]);
          });

          // Department Subtotal
          rows.push([
            entKey, '', '', '',
            `SUBTOTAL (${deptKey})`, `${deptItems[0]?.deptName || ''}`,
            '—', '—', '—', `${deptItems.length} Line Items`,
            'Dept Subtotal',
            deptTotalLocal, deptTotalUSD,
            ...deptMonthlyLocal,
            ...deptMonthlyUSD,
            'Department Subtotal', ''
          ]);
        });

        // Entity Subtotal
        rows.push([
          `TOTAL FOR ENTITY: ${entKey}`, '', '', '',
          '—', 'All Entity Departments',
          '—', '—', '—', '',
          'Entity Rollup',
          '', entTotalUSD,
          ...Array(12).fill(''),
          ...entMonthlyUSD,
          'Entity Subtotal (USD)', ''
        ]);
        rows.push([]); // blank separator row
      });

      // Master Grand Total Row
      rows.push([
        'GRAND TOTAL (ALL ENTITIES & DEPTS)', 'Consolidated', '—', 'USD',
        '—', 'All Departments Combined',
        '—', '—', '—', `${items.length} Total Line Items`,
        '100% Rollup',
        '', grandTotalUSD,
        ...Array(12).fill(''),
        ...grandMonthlyUSD,
        'Master Grand Total (USD)', ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    // Route to appropriate generators based on export type
    if (type === 'global-usd') {
      await addGlobalSummarySheet();
      await addGlobalLineItemsSheet();
      await addEntityByDepartmentSheet(entities, null, 'By Department');
      await addDimensionGroupedSheet(entities, 'donor', 'By Donor');
      await addDimensionGroupedSheet(entities, 'location', 'By Location');
      await addDimensionGroupedSheet(entities, 'activity', 'By Activity');
      await addDimensionGroupedSheet(entities, 'conditionArea', 'By Condition Area');
      await add5DMasterMatrixSheet(entities, '5D Consolidated Report');
      await addSalariesInputSheet(entities, null, 'Global Salaries (Inputs)');
      await addOtherStaffInputSheet(entities, null, 'Global OtherStaff (Inputs)');
      await addGratuityBonusInputSheet(entities, null, 'Global Gratuity (Inputs)');
      await addEhaInputSheet(entities, null, 'Global EHA (Inputs)');
      await addFixedAssetsInputSheet(entities, null, 'Global Assets (Inputs)');
      await addNonPayrollOperatingInputSheet(entities, null, 'Global Operating&Travel');
      await addImpTotProgramsInputSheet(entities, null, 'Global IMP Programs');
    } else if (type === 'india-consolidated') {
      const indiaEntities = entities.filter(e => e.country === 'India');
      await addIndiaSummarySheet();
      await addIndiaLineItemsSheet();
      await addEntityByDepartmentSheet(indiaEntities, null, 'India by Dept');
      await addDimensionGroupedSheet(indiaEntities, 'donor', 'India by Donor');
      await addDimensionGroupedSheet(indiaEntities, 'location', 'India by Location');
      await addDimensionGroupedSheet(indiaEntities, 'activity', 'India by Activity');
      await addDimensionGroupedSheet(indiaEntities, 'conditionArea', 'India by Condition Area');
      await add5DMasterMatrixSheet(indiaEntities, 'India 5D Consolidated');
      await addSalariesInputSheet(indiaEntities, null, 'India Salaries (Inputs)');
      await addOtherStaffInputSheet(indiaEntities, null, 'India OtherStaff (Inputs)');
      await addGratuityBonusInputSheet(indiaEntities, null, 'India Gratuity (Inputs)');
      await addEhaInputSheet(indiaEntities, null, 'India EHA (Inputs)');
      await addFixedAssetsInputSheet(indiaEntities, null, 'India Assets (Inputs)');
      await addNonPayrollOperatingInputSheet(indiaEntities, null, 'India Operating&Travel');
      await addImpTotProgramsInputSheet(indiaEntities, null, 'India IMP Programs');
    } else if (type === 'entity-summary') {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      await addEntitySummarySheet();
      await addEntityLineItemsSheet();
      await addEntityByDepartmentSheet([entity], null, `${entity.shortName} by Dept`);
      await addDimensionGroupedSheet([entity], 'donor', `${entity.shortName} by Donor`);
      await addDimensionGroupedSheet([entity], 'location', `${entity.shortName} by Loc`);
      await addDimensionGroupedSheet([entity], 'activity', `${entity.shortName} by Activity`);
      await addDimensionGroupedSheet([entity], 'conditionArea', `${entity.shortName} by Condition`);
      await add5DMasterMatrixSheet([entity], `${entity.shortName} 5D Consolidated`);
      await addSalariesInputSheet([entity], null, `${entity.shortName} Salaries (Inputs)`);
      await addOtherStaffInputSheet([entity], null, `${entity.shortName} OtherStaff (Inputs)`);
      await addGratuityBonusInputSheet([entity], null, `${entity.shortName} Gratuity (Inputs)`);
      await addEhaInputSheet([entity], null, `${entity.shortName} EHA (Inputs)`);
      await addFixedAssetsInputSheet([entity], null, `${entity.shortName} Assets (Inputs)`);
      await addNonPayrollOperatingInputSheet([entity], null, `${entity.shortName} Operating&Travel`);
      await addImpTotProgramsInputSheet([entity], null, `${entity.shortName} IMP Programs`);
    } else if (type === 'dept-summary') {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const selectedDeptId = ReportsModule.selectedDeptId || App.selectedDept || departments[0]?.id || '';
      const dept = departments.find(d => d.id === selectedDeptId) || departments[0];

      await addDeptCostSheet();
      await addEntityByDepartmentSheet([entity], [dept], 'Dept Line Items');
      await addDimensionGroupedSheet([entity], 'donor', 'Dept by Donor');
      await addDimensionGroupedSheet([entity], 'location', 'Dept by Loc');
      await addDimensionGroupedSheet([entity], 'activity', 'Dept by Activity');
      await addDimensionGroupedSheet([entity], 'conditionArea', 'Dept by Condition');
      await add5DMasterMatrixSheet([entity], 'Dept 5D Consolidated');
      await addSalariesInputSheet([entity], [dept], 'Salaries & Wages (Inputs)');
      await addOtherStaffInputSheet([entity], [dept], 'Other Staff (Inputs)');
      await addGratuityBonusInputSheet([entity], [dept], 'Gratuity & Bonus (Inputs)');
      await addEhaInputSheet([entity], [dept], 'EHA Consultants (Inputs)');
      await addFixedAssetsInputSheet([entity], [dept], 'Fixed Assets (Inputs)');
      await addNonPayrollOperatingInputSheet([entity], [dept], 'Operating & Travel (Inputs)');
      await addImpTotProgramsInputSheet([entity], [dept], 'IMP Programs (Inputs)');
    } else if (type === 'dimensions') {
      // Dedicated 5-Dimensional Report Export
      await addEntityByDepartmentSheet(entities, null, 'By Department');
      await addDimensionGroupedSheet(entities, 'donor', 'By Donor');
      await addDimensionGroupedSheet(entities, 'location', 'By Location');
      await addDimensionGroupedSheet(entities, 'activity', 'By Activity');
      await addDimensionGroupedSheet(entities, 'conditionArea', 'By Condition Area');
      await add5DMasterMatrixSheet(entities, '5D Consolidated Report');
    } else if (type === 'full-book') {
      // 1. Global Executive Summary & Consolidated Line Items (All Countries)
      await addGlobalSummarySheet();
      await addGlobalLineItemsSheet();

      // 2. Comprehensive Entity by Department Month-wise Sheet
      await addEntityByDepartmentSheet(entities, null, 'By Department');

      // 3. 5-Dimensional Reports Grouped strictly by each dimension
      await addDimensionGroupedSheet(entities, 'donor', 'By Donor');
      await addDimensionGroupedSheet(entities, 'location', 'By Location');
      await addDimensionGroupedSheet(entities, 'activity', 'By Activity');
      await addDimensionGroupedSheet(entities, 'conditionArea', 'By Condition Area');

      // 4. Consolidated 5D Report (All Dimensions Together)
      await add5DMasterMatrixSheet(entities, '5D Consolidated Report');

      // 5. Individual Entity-wise Line Item Reports (One sheet per Entity)
      for (const e of entities) {
        await addIndividualEntityLineItemsSheet(e);
      }

      // 6. Individual Entity-wise and Department-wise Line Items in a Single Master Sheet
      await addMasterEntityAndDeptLineItemsSheet();

      // 7. Detailed Bottom-Up Input Sheets across all entities & departments
      await addSalariesInputSheet(entities, null, 'All Salaries & Wages (Inputs)');
      await addOtherStaffInputSheet(entities, null, 'All Other Staff (Inputs)');
      await addGratuityBonusInputSheet(entities, null, 'All Gratuity & Bonus (Inputs)');
      await addEhaInputSheet(entities, null, 'All EHA Consultants (Inputs)');
      await addFixedAssetsInputSheet(entities, null, 'All Fixed Assets (Inputs)');
      await addNonPayrollOperatingInputSheet(entities, null, 'All Operating & Travel');
      await addImpTotProgramsInputSheet(entities, null, 'All IMP ToT Programs');
    } else {
      await addGlobalSummarySheet();
      await addEntityByDepartmentSheet(entities, null, 'By Department');
      await add5DMasterMatrixSheet(entities, '5D Consolidated Report');
      await addSalariesInputSheet(entities, null, 'Salaries & Wages (Inputs)');
      await addNonPayrollOperatingInputSheet(entities, null, 'Operating & Travel (Inputs)');
    }

    let fileName = '';
    if (type === 'full-book') {
      fileName = `Noora_Health_Consolidated_Budget_Book_CY${budgetYear}.xlsx`;
    } else if (type === 'global-usd') {
      fileName = `Noora_Health_Global_Consolidated_Budget_USD_CY${budgetYear}.xlsx`;
    } else if (type === 'india-consolidated') {
      fileName = `Noora_Health_India_Consolidated_Budget_CY${budgetYear}.xlsx`;
    } else if (type === 'dimensions') {
      fileName = `Noora_Health_5D_Dimension_Line_Items_Report_CY${budgetYear}.xlsx`;
    } else if (type === 'entity-summary') {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      fileName = `Noora_Health_${entity.shortName}_Budget_Summary_CY${budgetYear}.xlsx`;
    } else if (type === 'dept-summary') {
      const selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const selectedDeptId = ReportsModule.selectedDeptId || App.selectedDept || departments[0]?.id || '';
      const dept = departments.find(d => d.id === selectedDeptId) || departments[0];
      const cleanDept = Utils.getDeptName(dept, entity.deptPrefix).replace(/[^a-zA-Z0-9_-]/g, '_');
      fileName = `Noora_Health_${entity.shortName}_${cleanDept}_Total_Dept_Cost_CY${budgetYear}.xlsx`;
    } else {
      fileName = `Noora_Health_Budget_${type}_CY${budgetYear}.xlsx`;
    }

    XLSX.writeFile(wb, fileName);
    Utils.showToast(`Excel workbook exported: ${fileName}`, 'success');
  },

  // Dedicated Exporter for Custom Dimension Selection
  async exportDimensionReport(dimKey = 'donor', entityFilter = 'all') {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'reports' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export dimension reports.', 'warning');
      return;
    }

    const activeYearObj = await this.getActiveYearObj();
    const yearId = activeYearObj.id;
    const budgetYear = activeYearObj.year;
    const rawEntities = await db.getAll(STORES.entities);
    const allEntities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));

    let targetEntities = allEntities;
    let scopeLabel = 'Global';
    if (entityFilter === 'india') {
      targetEntities = allEntities.filter(e => e.country === 'India');
      scopeLabel = 'India_Consolidated';
    } else if (entityFilter !== 'all') {
      targetEntities = allEntities.filter(e => e.id === entityFilter);
      if (targetEntities.length === 0) targetEntities = allEntities;
      scopeLabel = targetEntities[0].shortName;
    }

    const dimLabels = {
      donor: 'Donor',
      location: 'Location',
      activity: 'Activity',
      conditionArea: 'Condition_Area'
    };
    const dimLabel = dimLabels[dimKey] || 'Dimensions';

    const wb = XLSX.utils.book_new();

    // Helper functions inside exportDimensionReport
    const get12Months = (row) => {
      const arr = Array(12).fill(0);
      if (!row || !row.monthlyValues) return arr;
      if (Array.isArray(row.monthlyValues)) {
        return row.monthlyValues.map(v => Utils.parseNumber(v));
      }
      Object.entries(row.monthlyValues).forEach(([k, v]) => {
        const idx = parseInt(k, 10);
        if (idx >= 0 && idx < 12) arr[idx] = Utils.parseNumber(v);
      });
      return arr;
    };

    const getUnified5DLineItems = async (targetEntities) => {
      const lineItems = [];
      const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries' });
      const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff' });
      const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity' });
      const canViewEha = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha' });
      const canViewFixedAssets = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets' });

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        for (const d of departments) {
          const deptShort = Utils.getDeptShortCode(d, e.deptPrefix);
          const deptName = Utils.getDeptName(d, e.deptPrefix);

          // 1. Salaries
          if (canViewSalaries && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const salaries = payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
            salaries.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Direct Service',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Salaries & Wages',
                ledgerCode: '91101',
                linkedSource: 'Payroll — Salaries & Wages',
                itemDescription: `${r.name || 'Staff'}${r.designation ? ' (' + r.designation + ')' : ''}`,
                basisOfExpense: `${r.banding || 'NH3'} - ${r.employeeStatus || 'Existing'}`,
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 2. Other Staff Expenses
          if (canViewOtherStaff && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const otherStaff = payroll.filter(p => p.subCategory === 'other-staff-expenses');
            otherStaff.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Staff Insurance, Welfare & Benefits',
                ledgerCode: '91301',
                linkedSource: 'Payroll — Other Staff Expenses',
                itemDescription: r.name || r.expenseType || 'Staff Expense',
                basisOfExpense: r.expenseType || 'Staff Benefit',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 3. Gratuity & Bonus
          if (canViewGratuity && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity', entityId: e.id, deptId: d.id }))) {
            const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
            const gratuity = payroll.filter(p => p.subCategory === 'gratuity-bonus');
            gratuity.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Payroll & Personnel',
                glDescription: 'Gratuity & Statutory Bonus',
                ledgerCode: '91201',
                linkedSource: 'Payroll — Gratuity & Bonus',
                itemDescription: r.name || 'Bonus Provision',
                basisOfExpense: r.expenseType || 'Gratuity / Bonus',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 4. EHA Consultants
          if (canViewEha && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha', entityId: e.id, deptId: d.id }))) {
            const eha = await db.getBudgetData(STORES.payrollEHA, yearId, e.id, d.id);
            eha.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Direct Service',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Professional Fees',
                glDescription: 'Program Resource Consultants (EHA)',
                ledgerCode: '92101',
                linkedSource: 'Payroll — EHA Consultants',
                itemDescription: `${r.name || r.consultantName || 'Consultant'}${r.designation ? ' (' + r.designation + ')' : ''}`,
                basisOfExpense: r.contractType || 'Retainer',
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 5. Fixed Assets
          if (canViewFixedAssets && (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets', entityId: e.id, deptId: d.id }))) {
            const fixedAssets = await db.getBudgetData(STORES.payrollFixedAsset, yearId, e.id, d.id);
            fixedAssets.forEach(r => {
              const mVals = get12Months(r);
              const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
              const totalUSD = Utils.convertToUSD(totalLocal, rate);
              lineItems.push({
                entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
                deptId: d.id, deptShort, deptName,
                location: r.location || 'All Locations',
                donor: r.donor || 'General Fund',
                activity: r.activity || 'Operations',
                conditionArea: r.conditionArea || 'All',
                parentAccount: 'Fixed Assets & Hardware',
                glDescription: 'Computers, Hardware & Equipment',
                ledgerCode: '11301',
                linkedSource: 'Fixed Assets',
                itemDescription: `${r.category || 'IT Hardware'}: ${r.description || r.itemDescription || 'Equipment'}`,
                basisOfExpense: `Qty: ${r.quantity || 1} @ ${Utils.formatCurrency(r.unitCost || 0, e.currency)}`,
                monthlyValuesLocal: mVals,
                monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
                totalLocal, totalUSD,
                remarks: r.remarks || ''
              });
            });
          }

          // 6. Non-Payroll / Operating Costs
          const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, e.id, d.id);
          nonPayroll.forEach(r => {
            const targetCat = typeof Auth !== 'undefined' ? Auth.getCategoryForLineItem(r) : 'other-costs';
            if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: targetCat, ledgerCode: r.ledgerCode, glDescription: r.glDescription, parentAccount: r.parentAccount, entityId: e.id, deptId: d.id })) {
              return;
            }
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            lineItems.push({
              entityId: e.id, entityShort: e.shortName, entityName: e.name, country: e.country, currency: e.currency, rate,
              deptId: d.id, deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Direct Service',
              conditionArea: r.conditionArea || 'All',
              parentAccount: r.parentAccount || 'Other Costs',
              glDescription: r.glDescription || 'Operating Expense',
              ledgerCode: r.ledgerCode || '93999',
              linkedSource: r.subCategory || 'Operating Costs',
              itemDescription: r.description || r.costDescription || r.itemDescription || 'Cost Item',
              basisOfExpense: r.basisOfExpense || r.basis || '',
              monthlyValuesLocal: mVals,
              monthlyValuesUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });
        }
      }
      return lineItems;
    };

    const addDimensionSheet = (items, selectedDimKey, sheetTitle) => {
      const dLabel = dimLabels[selectedDimKey] || 'Dimension';
      const groups = {};
      items.forEach(item => {
        const val = String(item[selectedDimKey] || 'All').trim();
        if (!groups[val]) groups[val] = [];
        groups[val].push(item);
      });

      const sortedKeys = Object.keys(groups).sort((a, b) => {
        const totalA = groups[a].reduce((sum, r) => sum + r.totalUSD, 0);
        const totalB = groups[b].reduce((sum, r) => sum + r.totalUSD, 0);
        return totalB - totalA;
      });

      const rows = [
        [`Noora Health — Line Item Wise Budget Report (By ${dLabel})`, `CY-${budgetYear}`],
        [`Scope: ${scopeLabel.replace(/_/g, ' ')} | Categorized specifically by ${dLabel} with GL breakdown and monthly distribution`],
        [],
        [
          dLabel,
          'Parent Account / Parent Ledger',
          'GL Line Description / Line Item Ledger',
          'Ledger Code',
          'Expense / Item Description',
          `Total CY-${budgetYear} (Local)`,
          `Total CY-${budgetYear} (USD)`,
          ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
          'Basis of Estimation',
          'Remarks'
        ]
      ];

      let grandUSD = 0;
      let grandLocal = 0;
      const grandMonthlyUSD = Array(12).fill(0);

      sortedKeys.forEach(grpVal => {
        const grpItems = groups[grpVal];
        let grpUSD = 0;
        let grpLocal = 0;
        const grpMonthlyUSD = Array(12).fill(0);

        grpItems.forEach(r => {
          grpUSD += r.totalUSD;
          grpLocal += r.totalLocal;
          r.monthlyValuesUSD.forEach((v, idx) => {
            grpMonthlyUSD[idx] += v;
            grandMonthlyUSD[idx] += v;
          });
        });
        grandUSD += grpUSD;
        grandLocal += grpLocal;

        rows.push([
          `📁 ${dLabel.toUpperCase()}: ${grpVal}`,
          `${grpItems.length} Line Items`,
          '—',
          '—',
          'Group Total',
          grpLocal,
          grpUSD,
          ...grpMonthlyUSD,
          'Group Subtotal',
          ''
        ]);

        grpItems.forEach(r => {
          rows.push([
            grpVal,
            r.parentAccount,
            r.glDescription,
            r.ledgerCode,
            r.itemDescription,
            r.totalLocal,
            r.totalUSD,
            ...r.monthlyValuesUSD,
            r.basisOfExpense,
            r.remarks
          ]);
        });

        rows.push([
          `SUBTOTAL (${grpVal})`,
          '—',
          '—',
          '—',
          `${grpItems.length} Items Subtotal`,
          grpLocal,
          grpUSD,
          ...grpMonthlyUSD,
          '',
          ''
        ]);
        rows.push([]);
      });

      rows.push([
        `GRAND TOTAL (ALL ${dLabel.toUpperCase()}S)`,
        'All Categories Combined',
        '—',
        '—',
        `${items.length} Total Line Items`,
        grandLocal,
        grandUSD,
        ...grandMonthlyUSD,
        '100% Scope Rollup',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
    };

    const items = await getUnified5DLineItems(targetEntities);

    // 1. By Department (Entity by Dept) Sheet
    const entityDeptRows = [
      [`Noora Health — Entity by Department Budget Report (Month-Wise)`, `CY-${budgetYear}`],
      [`Scope: ${scopeLabel.replace(/_/g, ' ')} | Granular department-wise budget with parent & line item ledgers`],
      [],
      [
        'Entity Code', 'Entity Name', 'Country', 'Currency',
        'Department Code', 'Department Name',
        'Parent Account / Parent Ledger', 'GL Description / Line Item Ledger', 'Ledger Code', 'Linked Input Source',
        'Expense / Item Description',
        `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
        ...SEED_DATA.months.map(m => `${m}-${budgetYear} (Local)`),
        ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
        'Basis of Estimation', 'Remarks'
      ]
    ];

    const entityMap = {};
    items.forEach(r => {
      const entKey = r.entityShort || r.entityId || 'Entity';
      if (!entityMap[entKey]) entityMap[entKey] = {};
      const deptKey = r.deptShort || r.deptId || 'Dept';
      if (!entityMap[entKey][deptKey]) entityMap[entKey][deptKey] = [];
      entityMap[entKey][deptKey].push(r);
    });

    let gTotalUSD = 0;
    const gMonthlyUSD = Array(12).fill(0);

    Object.keys(entityMap).sort().forEach(entKey => {
      const deptsInEnt = entityMap[entKey];
      let entTotalUSD = 0;
      const entMonthlyUSD = Array(12).fill(0);

      Object.keys(deptsInEnt).sort().forEach(deptKey => {
        const deptItems = deptsInEnt[deptKey];
        let deptTotalLocal = 0;
        let deptTotalUSD = 0;
        const deptMonthlyLocal = Array(12).fill(0);
        const deptMonthlyUSD = Array(12).fill(0);

        deptItems.forEach(r => {
          deptTotalLocal += r.totalLocal;
          deptTotalUSD += r.totalUSD;
          entTotalUSD += r.totalUSD;
          gTotalUSD += r.totalUSD;
          r.monthlyValuesLocal.forEach((v, idx) => deptMonthlyLocal[idx] += v);
          r.monthlyValuesUSD.forEach((v, idx) => {
            deptMonthlyUSD[idx] += v;
            entMonthlyUSD[idx] += v;
            gMonthlyUSD[idx] += v;
          });

          entityDeptRows.push([
            r.entityShort, r.entityName, r.country, r.currency,
            r.deptShort, r.deptName,
            r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource,
            r.itemDescription,
            r.totalLocal, r.totalUSD,
            ...r.monthlyValuesLocal,
            ...r.monthlyValuesUSD,
            r.basisOfExpense, r.remarks
          ]);
        });

        entityDeptRows.push([
          entKey, '', '', '',
          `SUBTOTAL (${deptKey})`, `${deptItems[0]?.deptName || ''}`,
          '—', '—', '—', `${deptItems.length} Line Items`,
          'Dept Subtotal',
          deptTotalLocal, deptTotalUSD,
          ...deptMonthlyLocal,
          ...deptMonthlyUSD,
          'Department Subtotal', ''
        ]);
      });

      entityDeptRows.push([
        `TOTAL FOR ENTITY: ${entKey}`, '', '', '',
        '—', 'All Entity Departments',
        '—', '—', '—', '',
        'Entity Rollup',
        '', entTotalUSD,
        ...Array(12).fill(''),
        ...entMonthlyUSD,
        'Entity Subtotal (USD)', ''
      ]);
      entityDeptRows.push([]);
    });

    entityDeptRows.push([
      'GRAND TOTAL (ALL ENTITIES & DEPTS)', 'Consolidated', '—', 'USD',
      '—', 'All Departments Combined',
      '—', '—', '—', `${items.length} Total Line Items`,
      '100% Rollup',
      '', gTotalUSD,
      ...Array(12).fill(''),
      ...gMonthlyUSD,
      'Master Grand Total (USD)', ''
    ]);

    const wsEntityDept = XLSX.utils.aoa_to_sheet(entityDeptRows);
    XLSX.utils.book_append_sheet(wb, wsEntityDept, 'By Department');

    // 2. Primary Dimension Sheet (e.g. By Donor, By Location, etc.)
    addDimensionSheet(items, dimKey, `By ${dimLabels[dimKey] || 'Dimension'}`);

    // 3. Secondary Dimension Sheets
    const otherDims = ['donor', 'location', 'activity', 'conditionArea'].filter(k => k !== dimKey);
    for (const k of otherDims) {
      addDimensionSheet(items, k, `By ${dimLabels[k]}`);
    }

    // 4. Consolidated 5D Report Sheet (Where ALL dimensions are provided together)
    const matrixRows = [
      [`Noora Health — Consolidated 5-Dimensional Master Line Items Budget Report`, `CY-${budgetYear}`],
      [`Scope: ${scopeLabel.replace(/_/g, ' ')} | All bottom-up line items mapped with ALL 5 dimensions together`],
      [],
      [
        'Entity Code', 'Entity Name', 'Country', 'Currency',
        'Department Code', 'Department Name',
        'Location Dimension', 'Donor Dimension', 'Activity Dimension', 'Condition Area Dimension',
        'Parent Account / Parent Ledger', 'GL Line Description / Line Item Ledger', 'Ledger Code', 'Linked Input Source',
        'Expense / Item Description', `Total CY-${budgetYear} (Local)`, `Total CY-${budgetYear} (USD)`,
        ...SEED_DATA.months.map(m => `${m}-${budgetYear} (Local)`),
        ...SEED_DATA.months.map(m => `${m}-${budgetYear} (USD)`),
        'Basis of Estimation', 'Remarks'
      ]
    ];
    items.forEach(r => {
      matrixRows.push([
        r.entityShort, r.entityName, r.country, r.currency,
        r.deptShort, r.deptName,
        r.location, r.donor, r.activity, r.conditionArea,
        r.parentAccount, r.glDescription, r.ledgerCode, r.linkedSource,
        r.itemDescription,
        r.totalLocal, r.totalUSD,
        ...r.monthlyValuesLocal,
        ...r.monthlyValuesUSD,
        r.basisOfExpense, r.remarks
      ]);
    });
    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, '5D Consolidated Report');

    const fileName = `Noora_Health_${scopeLabel}_Dimension_Report_By_${dimLabel}_CY${budgetYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
    Utils.showToast(`Dimension report exported: ${fileName}`, 'success');
  }
};

window.ExcelIOModule = ExcelIOModule;
