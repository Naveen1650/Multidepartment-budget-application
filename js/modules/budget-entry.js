// ============================================================
// ============================================================
// NOORA HEALTH BUDGET APP — Budget Entry Module
// Multi-tab grid entry for Payroll (Personnel, EHA, Fixed Assets)
// and Non-Payroll costs with 5-dimensional tagging
// ============================================================

const BudgetEntryModule = {
  currentEntityId: null,
  currentDeptId: null,
  activeTab: 'total-costs', // total-costs | personnel | eha | fixed-assets | other-costs
  activePersonnelSubTab: 'salaries-wages', // 'salaries-wages' | 'other-staff-expenses' | 'gratuity-bonus'
  activeOtherCostSubTab: 'grid', // 'grid' | 'travel' | 'supplies' | 'communication' | 'office' | 'professional' | 'other'

  // Cached context so addRow/deleteRow can re-render the grid without a full page reload
  _entity: null,
  _dept: null,
  _budgetYear: null,
  _yearId: '2026',        // The actual DB key used to query/save records
  _actualsMonth: 'Oct',

  async render(container) {
    const years = await db.getAll(STORES.budgetYears);
    const allEntities = await db.getAll(STORES.entities);
    const allDepartments = await db.getAll(STORES.departments);

    if (allEntities.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>No Entities Available</h3></div>`;
      return;
    }

    // Filter accessible entities for active user
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(allEntities) : allEntities;
    if (entities.length === 0) {
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">No Entity Access</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your active role (<strong>${Auth.getCurrentUser()?.roleName || 'User'}</strong>) does not have any assigned entity scopes.
          </p>
        </div>
      `;
      return;
    }

    // Determine currentEntityId (must be within accessible entities)
    const appSelectedEntity = typeof App !== 'undefined' ? App.selectedEntity : null;
    if (!this.currentEntityId || !entities.some(e => e.id === this.currentEntityId)) {
      if (appSelectedEntity && entities.some(e => e.id === appSelectedEntity)) {
        this.currentEntityId = appSelectedEntity;
      } else {
        this.currentEntityId = entities[0].id;
      }
    }
    const selectedEntity = entities.find(e => e.id === this.currentEntityId) || entities[0];

    // Filter active departments for entity
    const yearId = (typeof App !== 'undefined' && App.selectedYear) ? App.selectedYear : (years[0]?.id || '2026');
    const configs = await db.getEntityDeptConfigForYear(yearId, this.currentEntityId);
    const activeDeptIds = new Set(configs.filter(c => c.isActive).map(c => c.deptId));

    const sortedDepartments = Utils.sortDepartments(allDepartments);
    const entityDepts = sortedDepartments.filter(d => activeDeptIds.size === 0 || activeDeptIds.has(d.id));

    // Filter accessible departments for active user for this entity
    const activeDepts = typeof Auth !== 'undefined' ? Auth.filterAccessibleDepts(entityDepts, this.currentEntityId) : entityDepts;

    if (activeDepts.length === 0) {
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">No Department Access</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your active role (<strong>${Auth.getCurrentUser()?.roleName || 'User'}</strong>) does not have access to any departments in <strong>${selectedEntity.shortName}</strong>.
          </p>
        </div>
      `;
      return;
    }

    // Determine currentDeptId (must be within accessible depts)
    if (!this.currentDeptId || !activeDepts.some(d => d.id === this.currentDeptId)) {
      this.currentDeptId = activeDepts[0].id;
    }
    const selectedDept = activeDepts.find(d => d.id === this.currentDeptId) || activeDepts[0];

    const yearObj = years.find(y => y.id === yearId) || { year: 2026, actualsThroughMonth: 'Oct', conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
    const budgetYear = yearObj.year;
    this._conversionRates = yearObj.conversionRates || { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 };

    // ─── View Permission Evaluation per Category ───
    const canViewTotal = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'total-dept-cost', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewSalaries = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewOtherStaff = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewGratuity = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewPersonnel = canViewSalaries || canViewOtherStaff || canViewGratuity;
    const canViewEha = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewFA = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewTravel = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'travel', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewSupplies = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'supplies', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewComm = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'communication', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewOffice = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'office', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewProf = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'professional', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewOtherLines = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-costs', entityId: this.currentEntityId, deptId: this.currentDeptId });
    const canViewTot = typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'imp-tot-rates', entityId: this.currentEntityId, deptId: this.currentDeptId }) || canViewOtherLines || canViewTravel || canViewSupplies;
    const canViewOtherCosts = canViewTravel || canViewSupplies || canViewComm || canViewOffice || canViewProf || canViewOtherLines || canViewTot;

    const tabAccessMap = {
      'total-costs': canViewTotal,
      'personnel': canViewPersonnel,
      'eha': canViewEha,
      'fixed-assets': canViewFA,
      'other-costs': canViewOtherCosts
    };

    if (!tabAccessMap[this.activeTab]) {
      const firstAllowedTab = Object.keys(tabAccessMap).find(k => tabAccessMap[k]);
      this.activeTab = firstAllowedTab || 'other-costs';
    }

    if (this.activeTab === 'personnel') {
      const pMap = {
        'salaries-wages': canViewSalaries,
        'other-staff-expenses': canViewOtherStaff,
        'gratuity-bonus': canViewGratuity
      };
      if (!pMap[this.activePersonnelSubTab]) {
        this.activePersonnelSubTab = Object.keys(pMap).find(k => pMap[k]) || 'salaries-wages';
      }
    }

    if (this.activeTab === 'other-costs') {
      const isDeptTotEnabled = typeof ImpTotModule !== 'undefined' && ImpTotModule.isImpDept(selectedDept);
      const ocMap = {
        'grid': canViewOtherCosts,
        'tot': (canViewTot || canViewOtherCosts) && isDeptTotEnabled,
        'travel': canViewTravel,
        'supplies': canViewSupplies,
        'communication': canViewComm,
        'office': canViewOffice,
        'professional': canViewProf,
        'other': canViewOtherLines
      };
      if (!ocMap[this.activeOtherCostSubTab]) {
        this.activeOtherCostSubTab = Object.keys(ocMap).find(k => ocMap[k]) || 'grid';
      }
    }

    const canEditYear = typeof Auth === 'undefined' || Auth.isYearEditable(yearId, this.currentEntityId);
    const yearStatusLabel = typeof Auth !== 'undefined' ? Auth.getYearStatusLabel(yearId, this.currentEntityId) : 'Active';

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Budget Entry (${budgetYear})</h2>
          <p>Prepare monthly budgets with 5-dimensional tagging and prior year reference data</p>
        </div>
        <div class="flex gap-xs items-center">
          <button class="btn btn-secondary btn-sm" onclick="BudgetEntryModule.showDeptAuditTrail(BudgetEntryModule.currentEntityId, BudgetEntryModule.currentDeptId)" title="View tamper-evident history of entries, modifications, and deletions for this department">📜 Dept Audit History</button>
        </div>
      </div>

      ${!canEditYear ? `
        <div class="card p-sm mb-md flex items-center justify-between" style="background: rgba(245, 158, 11, 0.08); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm">
            <span style="font-size: 1.3rem;">🔒</span>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 13px;">
                ${selectedEntity.shortName} (${selectedEntity.currency}) is currently in <strong>"${yearStatusLabel}"</strong> mode (Locked / Read-Only)
              </div>
              <div class="text-secondary" style="font-size: 11.5px;">
                Additions, row insertions, edits, and bulk uploads are disabled for this entity in CY-${budgetYear}. Only entities with <strong>Active (Open)</strong> or <strong>Draft</strong> status permit changes.
              </div>
            </div>
          </div>
          <span class="badge badge-amber font-bold" style="padding: 5px 10px; font-size: 11px;">🔒 ${yearStatusLabel}</span>
        </div>
      ` : ''}

      <!-- Toolbar Selection -->
      <div class="budget-toolbar">
        <div class="toolbar-selectors">
          <div>
            <label class="form-label">Entity</label>
            <select class="form-select" id="entryEntitySelect">
              ${entities.map(e => {
                const eStatus = typeof Auth !== 'undefined' ? Auth.getYearStatus(yearId, e.id) : 'active';
                const isEEditable = eStatus === 'draft' || eStatus === 'active';
                const eLabel = typeof Auth !== 'undefined' ? Auth.getYearStatusLabel(yearId, e.id).split(' ')[0] : 'Active';
                return `<option value="${e.id}" ${e.id === this.currentEntityId ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.currency}) — ${isEEditable ? '🟢' : '🔒'} ${eLabel}</option>`;
              }).join('')}
            </select>
          </div>

          <div>
            <label class="form-label">Department</label>
            <select class="form-select" id="entryDeptSelect">
              ${activeDepts.map(d => {
                const codePrefix = selectedEntity.deptPrefix || 'GEN';
                const deptCode = d.codeTemplate ? d.codeTemplate.replace('{CC}', codePrefix) : d.id.toUpperCase();
                return `<option value="${d.id}" title="${d.name}" ${d.id === this.currentDeptId ? 'selected' : ''}>${deptCode}</option>`;
              }).join('')}
            </select>
          </div>
        </div>

        <div class="toolbar-actions" id="toolbarActionsContainer" style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
          <!-- Dynamically populated based on activeTab -->
        </div>
      </div>

      <!-- Module Tabs -->
      <div class="tabs" id="entryTabs">
        ${canViewTotal ? `<button class="tab ${this.activeTab === 'total-costs' ? 'active' : ''}" data-tab="total-costs">📊 Total Dept Cost</button>` : ''}
        ${canViewPersonnel ? `<button class="tab ${this.activeTab === 'personnel' ? 'active' : ''}" data-tab="personnel">👥 Payroll — Personnel Cost</button>` : ''}
        ${canViewEha ? `<button class="tab ${this.activeTab === 'eha' ? 'active' : ''}" data-tab="eha">🤝 Payroll — EHA Consultants</button>` : ''}
        ${canViewFA ? `<button class="tab ${this.activeTab === 'fixed-assets' ? 'active' : ''}" data-tab="fixed-assets">💻 Fixed Assets (Laptops/Printers)</button>` : ''}
        ${canViewOtherCosts ? `<button class="tab ${this.activeTab === 'other-costs' ? 'active' : ''}" data-tab="other-costs">📑 Other Costs (Travel, Supplies & others)</button>` : ''}
      </div>

      <!-- Personnel Sub-Tabs (Visible when activeTab === 'personnel') -->
      <div class="sub-tabs" id="personnelSubTabs" style="${this.activeTab === 'personnel' ? '' : 'display: none;'}">
        ${canViewSalaries ? `<button class="sub-tab ${this.activePersonnelSubTab === 'salaries-wages' ? 'active' : ''}" data-subtab="salaries-wages">💼 Salaries and Wages</button>` : ''}
        ${canViewOtherStaff ? `<button class="sub-tab ${this.activePersonnelSubTab === 'other-staff-expenses' ? 'active' : ''}" data-subtab="other-staff-expenses">📚 Other Staff Expenses</button>` : ''}
        ${canViewGratuity ? `<button class="sub-tab ${this.activePersonnelSubTab === 'gratuity-bonus' ? 'active' : ''}" data-subtab="gratuity-bonus">🎁 Gratuity and Bonus</button>` : ''}
      </div>

      <!-- Other Costs Sub-Tabs (Visible when activeTab === 'other-costs') -->
      <div class="sub-tabs flex items-center justify-between" id="otherCostSubTabs" style="${this.activeTab === 'other-costs' ? '' : 'display: none;'} flex-wrap: wrap; gap: 8px;">
        <div class="flex items-center gap-xs" style="flex-wrap: wrap;">
          <button class="sub-tab ${this.activeOtherCostSubTab === 'grid' || this.activeOtherCostSubTab === 'all' ? 'active' : ''}" data-subtab="grid">📊 All Accounts Overview</button>
          ${canViewTravel ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'travel' || this.activeOtherCostSubTab === 'travel-packages' ? 'active' : ''}" data-subtab="travel">✈️ Travel & Lodging</button>` : ''}
          ${canViewSupplies ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'supplies' ? 'active' : ''}" data-subtab="supplies">🖨️ Supplies & Printing</button>` : ''}
          ${canViewComm ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'communication' ? 'active' : ''}" data-subtab="communication">📡 Communication</button>` : ''}
          ${canViewOffice ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'office' ? 'active' : ''}" data-subtab="office">🏢 Office Expenses</button>` : ''}
          ${canViewProf ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'professional' ? 'active' : ''}" data-subtab="professional">💼 Professional Charges</button>` : ''}
          ${canViewOtherLines ? `<button class="sub-tab ${this.activeOtherCostSubTab === 'other' ? 'active' : ''}" data-subtab="other">📑 Other Expense Lines</button>` : ''}
          ${((canViewTot || canViewOtherCosts) && typeof ImpTotModule !== 'undefined' && ImpTotModule.isImpDept(selectedDept)) ? `
            <button class="sub-tab ${this.activeOtherCostSubTab === 'tot' || this.activeOtherCostSubTab === 'imp-tot' ? 'active' : ''}" data-subtab="tot">🎯 ToT Program Budget (IMP)</button>
          ` : ''}
        </div>
      </div>

      <!-- Tab Content Area -->
      <div id="gridContainer"></div>
    `;

    // Event listeners for toolbar
    container.querySelector('#entryEntitySelect')?.addEventListener('change', (e) => {
      this.currentEntityId = e.target.value;
      this.currentDeptId = null; // Reset dept so it picks first valid dept of newly selected entity
      App.selectedEntity = e.target.value;
      this.render(container);
    });

    container.querySelector('#entryDeptSelect')?.addEventListener('change', (e) => {
      this.currentDeptId = e.target.value;
      this.render(container);
    });

    // Main module tabs
    container.querySelectorAll('#entryTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        container.querySelectorAll('#entryTabs .tab').forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        this.activeTab = t.dataset.tab;

        const subTabsEl = container.querySelector('#personnelSubTabs');
        if (subTabsEl) {
          subTabsEl.style.display = this.activeTab === 'personnel' ? '' : 'none';
        }

        const otherSubTabsEl = container.querySelector('#otherCostSubTabs');
        if (otherSubTabsEl) {
          otherSubTabsEl.style.display = this.activeTab === 'other-costs' ? '' : 'none';
        }

        this.updateToolbarActions();
        this.renderGrid(selectedEntity, selectedDept, budgetYear, yearObj.actualsThroughMonth || 'Oct');
      });
    });

    // Personnel Sub-tabs
    container.querySelectorAll('#personnelSubTabs .sub-tab').forEach(st => {
      st.addEventListener('click', () => {
        container.querySelectorAll('#personnelSubTabs .sub-tab').forEach(tab => tab.classList.remove('active'));
        st.classList.add('active');
        this.activePersonnelSubTab = st.dataset.subtab;
        this.updateToolbarActions();
        this.renderGrid(selectedEntity, selectedDept, budgetYear, yearObj.actualsThroughMonth || 'Oct');
      });
    });

    // Other Costs Sub-tabs
    container.querySelectorAll('#otherCostSubTabs .sub-tab').forEach(st => {
      st.addEventListener('click', () => {
        container.querySelectorAll('#otherCostSubTabs .sub-tab').forEach(tab => tab.classList.remove('active'));
        st.classList.add('active');
        this.activeOtherCostSubTab = st.dataset.subtab;
        this.updateToolbarActions();
        this.renderGrid(selectedEntity, selectedDept, budgetYear, yearObj.actualsThroughMonth || 'Oct');
      });
    });

    // Cache context for addRow / deleteRow
    this._entity = selectedEntity;
    this._dept = selectedDept;
    this._budgetYear = budgetYear;
    this._yearId = yearId;              // Cache the exact DB key so addRow uses same ID
    this._actualsMonth = yearObj.actualsThroughMonth || 'Oct';

    this.updateToolbarActions();
    this.renderGrid(selectedEntity, selectedDept, budgetYear, yearObj.actualsThroughMonth || 'Oct');
  },

  updateToolbarActions() {
    const actionsContainer = Utils.$('#toolbarActionsContainer');
    if (!actionsContainer) return;

    const yearId = this._yearId || App.selectedYear || '2026';
    const entityId = this.currentEntityId || this._entity?.id;
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId);

    if (isLocked) {
      const entityLabel = this._entity ? this._entity.shortName : 'Entity';
      actionsContainer.innerHTML = `
        <span class="badge badge-subtle font-bold" style="padding: 6px 14px; font-size: 12px; background: rgba(100, 116, 139, 0.1); border: 1px solid var(--border-default);">
          🔒 ${entityLabel} is Read-Only (${typeof Auth !== 'undefined' ? Auth.getYearStatusLabel(yearId, entityId) : 'Locked'})
        </span>
      `;
      return;
    }

    if (this.activeTab === 'personnel') {
      if (this.activePersonnelSubTab === 'other-staff-expenses') {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Staff Expense Row</button>
        `;
      } else if (this.activePersonnelSubTab === 'gratuity-bonus') {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Gratuity/Bonus Row</button>
        `;
      } else {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary btn-sm font-bold flex items-center gap-xs" onclick="BudgetEntryModule.autoPopulateDeptEmployees()" title="Auto-fill active employees from Employee Master into this department's Salaries & Wages budget">
            <span>👥</span> Auto-Populate from Employee Master
          </button>
          <button class="btn btn-secondary btn-sm flex items-center gap-xs" onclick="App.navigateTo('config-employees')" title="Open Employees Master directory to add, edit, or upload employee records">
            <span>⚙️</span> Manage Employees Master
          </button>
          <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Staff Row</button>
        `;
      }
    } else if (this.activeTab === 'eha') {
      actionsContainer.innerHTML = `
        <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Consultant Row</button>
      `;
    } else if (this.activeTab === 'fixed-assets') {
      actionsContainer.innerHTML = `
        <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Asset Row</button>
      `;
    } else if (this.activeTab === 'other-costs') {
      if (this.activeOtherCostSubTab === 'tot' || this.activeOtherCostSubTab === 'imp-tot') {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary btn-sm font-bold" onclick="ImpTotModule.saveAnnualMatrix()">💾 Save Annual Matrix</button>
          <button class="btn btn-secondary btn-sm font-bold" onclick="ImpTotModule.setViewMode(ImpTotModule.activeViewMode === 'matrix' ? 'registry' : 'matrix')">${typeof ImpTotModule !== 'undefined' && ImpTotModule.activeViewMode === 'matrix' ? '📋 Event Registry' : '📊 Annual Matrix'}</button>
          <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('config-imp-rates')">⚙️ Benchmark Rates</button>
        `;
      } else {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary btn-sm font-bold" onclick="BudgetEntryModule.addRow()">+ Add Expense Line</button>
          <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.showNonPayrollUploadModal(BudgetEntryModule.currentEntityId, BudgetEntryModule.currentDeptId)">📤 Bulk Upload Other Costs</button>
          <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.downloadNonPayrollTemplate()">📥 Other Costs Template</button>
        `;
      }
    } else if (this.activeTab === 'imp-tot') {
      actionsContainer.innerHTML = `
        <button class="btn btn-primary btn-sm font-bold" onclick="ImpTotModule.saveAnnualMatrix()">💾 Save Annual Matrix</button>
        <button class="btn btn-secondary btn-sm font-bold" onclick="ImpTotModule.setViewMode(ImpTotModule.activeViewMode === 'matrix' ? 'registry' : 'matrix')">${typeof ImpTotModule !== 'undefined' && ImpTotModule.activeViewMode === 'matrix' ? '📋 Event Registry' : '📊 Annual Matrix'}</button>
        <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('config-imp-rates')">⚙️ Benchmark Rates</button>
      `;
    } else if (this.activeTab === 'total-costs') {
      actionsContainer.innerHTML = `
        <div class="flex items-center gap-sm">
          <span class="badge badge-emerald" style="font-size: 12px; padding: 6px 12px;">📊 Master Department Summary — Auto-linked to input tabs</span>
        </div>
      `;
    }
  },

  async renderGrid(entity, dept, budgetYear, actualsMonth) {
    const grid = Utils.$('#gridContainer') || this._container;
    if (!grid) return;
    // Use cached _yearId so queries always match what addRow() saves
    const yearId = this._yearId || App.selectedYear || '2026';

    // If activeTab is imp-tot but current dept is not an Implementation dept, reset to total-costs
    if (this.activeTab === 'imp-tot' && (typeof ImpTotModule === 'undefined' || !ImpTotModule.isImpDept(dept))) {
      this.activeTab = 'total-costs';
      document.querySelectorAll('#entryTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'total-costs'));
    }

    const locations = await db.getLocationsForEntity(entity.id);
    const donors = await db.getDonorsForEntity(entity.id);
    const activities = await db.getAll(STORES.activities);
    const conditionAreas = await db.getAll(STORES.conditionAreas);

    // Cache context for wizards, modals & re-rendering
    this._container = grid;
    this._locations = locations;
    this._donors = donors;
    this._activities = activities;
    this._conditionAreas = conditionAreas;

    if (this.activeTab === 'personnel') {
      await this.renderPersonnelGrid(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
    } else if (this.activeTab === 'eha') {
      await this.renderEhaGrid(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
    } else if (this.activeTab === 'fixed-assets') {
      await this.renderFixedAssetsGrid(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
    } else if (this.activeTab === 'other-costs') {
      await this.renderNonPayrollGrid(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
    } else if (this.activeTab === 'total-costs') {
      await this.renderTotalCostGrid(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
    } else if (this.activeTab === 'imp-tot') {
      if (typeof ImpTotModule !== 'undefined') {
        await ImpTotModule.render(grid, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
      }
    }

    // Enforce Granular RBAC Permissions
    const activeCategoryKey = this.getActiveCategoryKey();
    if (typeof Auth !== 'undefined') {
      Auth.enforceCategoryUI(grid, { entityId: entity.id, deptId: dept.id, category: activeCategoryKey });
    }

    // Single delegated click listener on #gridContainer for Total column header toggle
    if (!grid._monthsToggleBound) {
      grid._monthsToggleBound = true;
      grid.addEventListener('click', (e) => {
        const th = e.target.closest('[data-toggle-months]');
        if (th) {
          this._toggleMonthsFromTh(th, e);
        }
      });
    }

    // Initialize drag-to-resize column handles
    if (typeof Utils !== 'undefined' && Utils.TableResizer) {
      Utils.TableResizer.init(grid);
    }
  },

  // ─── Personnel Grid (Subtabs: Salaries & Wages, Other Staff Expenses, Gratuity & Bonus) ───
  async renderPersonnelGrid(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas) {
    const subTab = this.activePersonnelSubTab || 'salaries-wages';
    const catKey = subTab === 'salaries-wages' ? 'salaries' : (subTab === 'other-staff-expenses' ? 'other-staff' : 'gratuity');
    const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: catKey, entityId: entity.id, deptId: dept.id })) {
      const currentUser = Auth.getCurrentUser();
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Denied</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${currentUser.roleName || 'Active Role'}</strong>) does not have view access to <strong>${catKey}</strong> for <strong>${deptDisplayName}</strong>.
          </p>
          <div class="badge badge-subtle font-bold" style="padding: 6px 14px;">Contact your System Administrator to request category access.</div>
        </div>
      `;
      return;
    }

    const allRecords = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);

    // Load master employees and match department
    const allMasterEmployees = await db.getEmployeesMaster();
    const normDept = (s) => String(s || '').toLowerCase().replace(/^in-|^us-|^bd-|^indo-|^np-/, '').replace(/[^a-z0-9]/g, '');
    const targetDeptCode = normDept(dept.id || dept.codeTemplate || dept.name);

    const deptEmployees = allMasterEmployees.filter(e => {
      if (e.status === 'Inactive') return false;
      if (e.entityId && entity.id && e.entityId.toLowerCase() !== entity.id.toLowerCase()) return false;
      const empDept = normDept(e.deptId || e.department);
      return empDept === targetDeptCode || (empDept && targetDeptCode && (empDept.includes(targetDeptCode) || targetDeptCode.includes(empDept)));
    });

    const masterEmployees = allMasterEmployees
      .filter(e => (!e.entityId || e.entityId === entity.id) && e.status !== 'Inactive')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    this._masterEmployees = masterEmployees;
    this._deptEmployees = deptEmployees;

    // Filter records for the active subtab AND line-item view permission
    const records = allRecords.filter(r => {
      const isSubMatch = subTab === 'salaries-wages' ? (!r.subCategory || r.subCategory === 'salaries-wages') : (r.subCategory === subTab);
      if (!isSubMatch) return false;
      if (typeof Auth === 'undefined') return true;
      return Auth.hasPermission('view', {
        category: catKey,
        ledgerCode: r.ledgerCode,
        glDescription: r.name || r.glDescription || r.designation,
        parentAccount: r.parentAccount,
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const totalSalaryCost = records.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);
    const totalStaffCount = records.length;
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entity.id);

    const subTabConfig = {
      'salaries-wages': {
        title: 'Salaries and Wages',
        countLabel: 'Employees',
        costLabel: 'Total Annual Salary Cost',
        emptyMsg: deptEmployees.length > 0 && !isLocked ? `
          <div style="padding: 16px 20px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.08)); border: 1px dashed rgba(6, 182, 212, 0.4); border-radius: 10px; margin: 12px auto; max-width: 620px;">
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">👥 Employee Master Match Found</div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.5;">
              Found <strong>${deptEmployees.length} active employee${deptEmployees.length > 1 ? 's' : ''}</strong> assigned to <strong>${deptDisplayName}</strong> in the Employee Master.
            </p>
            <div class="flex gap-sm justify-center flex-wrap">
              <button class="btn btn-primary font-bold" onclick="BudgetEntryModule.autoPopulateDeptEmployees()">
                ⚡ Auto-Fill All ${deptEmployees.length} Department Employees
              </button>
              <button class="btn btn-secondary btn-sm" onclick="BudgetEntryModule.addRow()">+ Add Blank Staff Row</button>
            </div>
          </div>
        ` : 'No salaries & wages rows added yet.'
      },
      'other-staff-expenses': {
        title: 'Other Staff Expenses',
        countLabel: 'Line Items',
        costLabel: 'Total Other Staff Expenses',
        emptyMsg: 'No other staff expenses added yet.'
      },
      'gratuity-bonus': {
        title: 'Gratuity and Bonus',
        countLabel: 'Line Items',
        costLabel: 'Total Gratuity & Bonus Budget',
        emptyMsg: 'No gratuity & bonus entries added yet.'
      }
    }[subTab] || {
      title: 'Personnel Cost',
      countLabel: 'Employees',
      costLabel: 'Total Annual Salary Cost',
      emptyMsg: 'No personnel rows added yet.'
    };

    // Define headers & empty state colspan for each subtab
    let tableHeadersHtml = '';
    let emptyColspan = 28;

    if (subTab === 'salaries-wages') {
      emptyColspan = 31;
      tableHeadersHtml = `
        <tr>
          <th class="sticky-col-status">Employee Status</th>
          <th class="sticky-col-emp">Employee Name <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Employee Code</th>
          <th>Department</th>
          <th>Designation <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Date of Joining <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Banding <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Level <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Current Monthly CTC (${entity.currency}) <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>New Monthly CTC <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Inc % <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Inc Val</th>
          <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
          ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
          <th>Location <span class="required-star" title="Mandatory for Existing">*</span></th>
          <th>Donor</th>
          <th>Activity</th>
          <th>Condition Area</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      `;
    } else if (subTab === 'gratuity-bonus') {
      emptyColspan = 22;
      tableHeadersHtml = `
        <tr>
          <th class="sticky-col-1">Staff Member Name</th>
          <th>Employee Code</th>
          <th>Department</th>
          <th class="sticky-col-2">Designation / Role</th>
          <th>Date of Joining</th>
          <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
          ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
          <th>Location</th>
          <th>Donor</th>
          <th>Activity</th>
          <th>Condition Area</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      `;
    } else { // other-staff-expenses
      emptyColspan = 21;
      tableHeadersHtml = `
        <tr>
          <th class="sticky-col-1">Staff Member Name</th>
          <th>Employee Code</th>
          <th>Department</th>
          <th class="sticky-col-2">Expense Line / Designation</th>
          <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
          ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
          <th>Location</th>
          <th>Donor</th>
          <th>Activity</th>
          <th>Condition Area</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      `;
    }

    const colMonthlySums = Array(12).fill(0);
    records.forEach(r => {
      if (r.monthlyValues) {
        Object.entries(r.monthlyValues).forEach(([mIdx, val]) => {
          colMonthlySums[parseInt(mIdx)] += (Utils.parseNumber(val) || 0);
        });
      }
    });

    const bottomTotalRowHtml = subTab === 'salaries-wages' ? `
      <tr class="total-row">
        <td class="sticky-col-status font-bold">TOTAL:</td>
        <td class="sticky-col-emp font-bold">${records.length} Employees</td>
        <td colspan="9"></td>
        <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatNumber(totalSalaryCost)}</td>
        ${SEED_DATA.months.map((m, idx) => `
          <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
        `).join('')}
        <td colspan="6"></td>
      </tr>
    ` : subTab === 'gratuity-bonus' ? `
      <tr class="total-row">
        <td class="sticky-col-1 font-bold">TOTAL:</td>
        <td class="sticky-col-2 font-bold">${records.length} Items</td>
        <td colspan="3"></td>
        <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatNumber(totalSalaryCost)}</td>
        ${SEED_DATA.months.map((m, idx) => `
          <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
        `).join('')}
        <td colspan="6"></td>
      </tr>
    ` : `
      <tr class="total-row">
        <td class="sticky-col-1 font-bold">TOTAL:</td>
        <td class="sticky-col-2 font-bold">${records.length} Items</td>
        <td colspan="2"></td>
        <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatNumber(totalSalaryCost)}</td>
        ${SEED_DATA.months.map((m, idx) => `
          <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
        `).join('')}
        <td colspan="6"></td>
      </tr>
    `;

    container.innerHTML = `
      <div class="card p-md mb-md flex items-center gap-lg" style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(139, 92, 246, 0.06)); border-color: rgba(6, 182, 212, 0.2);">
          <div>
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">${subTabConfig.title} Entries</div>
            <div id="bannerCount" style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${totalStaffCount} ${subTabConfig.countLabel}</div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">${subTabConfig.costLabel} (${entity.currency})</div>
            <div id="bannerTotal" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-primary);">${Utils.formatCurrency(totalSalaryCost, entity.currency)}</div>
            <div id="bannerTotalUSD" style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
              ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalSalaryCost, this._conversionRates?.[entity.currency] || 1.0), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${this._conversionRates?.[entity.currency] || 1.0} ${entity.currency}/USD)</span>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
          </div>
      </div>

      <div class="table-container">
        <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}" id="personnelTable">
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${records.length === 0 ? `
              <tr><td colspan="${emptyColspan}" class="text-center p-lg text-muted">${subTabConfig.emptyMsg}</td></tr>
            ` : `
              ${records.map(r => this.renderPersonnelRow(r, entity, locations, donors, activities, conditionAreas, subTab, masterEmployees, deptEmployees, deptDisplayName, isLocked)).join('')}
              ${bottomTotalRowHtml}
            `}
          </tbody>
        </table>
      </div>
    `;

    this.attachPersonnelEvents(container, yearId, entity, dept);
  },

  // ─── Helper: Build Employee Name Cell (smart dropdown linked to Employee Master) ───
  buildEmpNameCell(r, masterEmployees = [], deptEmployees = [], deptName = '', cssClass = '', extraAttrs = '', isLocked = false) {
    const clean = s => String(s || '').trim().toLowerCase();
    const savedName = r.name || r.employeeName || '';
    const savedCode = r.employeeCode || '';
    
    // Find matching employee by code or by name (case-insensitive trim)
    const matchedEmp = (masterEmployees || []).find(e => 
      (savedCode && clean(e.employeeCode) === clean(savedCode)) ||
      (savedName && clean(e.name) === clean(savedName)) ||
      (r.employeeId && (e.id === r.employeeId || String(e.id) === String(r.employeeId)))
    );

    // Only set isManualMode to true if explicitly flagged manual and no master employee was matched
    const isManualMode = (r.isManual === true || r.isManual === 'true') && !matchedEmp;

    const renderEmpOption = (e) => {
      const aCTC = Utils.parseNumber(e.annualCTC) || 0;
      const mCTC = Utils.parseNumber(e.monthlyCTC) || (aCTC > 0 ? Math.round(aCTC / 12) : 0);
      const isSel = matchedEmp ? (e.id === matchedEmp.id || clean(e.name) === clean(savedName)) : false;
      return `<option value="${e.id}" 
        data-name="${Utils.escapeHtml(e.name || '')}" 
        data-code="${Utils.escapeHtml(e.employeeCode || '')}" 
        data-dept="${Utils.escapeHtml(e.department || e.deptId || '')}" 
        data-designation="${Utils.escapeHtml(e.designation || '')}" 
        data-doj="${e.doj || ''}" 
        data-band="${e.band || 'NH3'}" 
        data-level="${e.level || 'Level 1'}" 
        data-ctc="${mCTC}" 
        data-location="${Utils.escapeHtml(e.location || '')}" 
        data-donor="${Utils.escapeHtml(e.donor || '')}" 
        data-activity="${Utils.escapeHtml(e.activity || '')}" 
        data-condition="${Utils.escapeHtml(e.conditionArea || '')}"${isSel ? ' selected' : ''}>${Utils.escapeHtml(e.name || '')}</option>`;
    };

    let optsHtml = '';
    const deptEmpIds = new Set((deptEmployees || []).map(e => e.id));
    const otherEmployees = (masterEmployees || []).filter(e => !deptEmpIds.has(e.id));

    if (deptEmployees && deptEmployees.length > 0) {
      optsHtml += `<optgroup label="🏛️ ${deptName || 'Department'} Staff (${deptEmployees.length})">
        ${deptEmployees.map(renderEmpOption).join('')}
      </optgroup>`;
      if (otherEmployees.length > 0) {
        optsHtml += `<optgroup label="🏢 Other Employees (${otherEmployees.length})">
          ${otherEmployees.map(renderEmpOption).join('')}
        </optgroup>`;
      }
    } else {
      optsHtml = (masterEmployees || []).map(renderEmpOption).join('');
    }

    const lockSelectAttr = isLocked ? 'disabled' : '';
    const lockManualAttr = isLocked ? 'disabled readonly' : '';
    const lockExtraCss = isLocked ? 'cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);' : '';

    return `
      <div class="emp-name-cell ${isManualMode ? 'is-manual-mode' : ''}" style="min-width: 170px;">
        <select class="form-select field-name ${cssClass}" ${lockSelectAttr} ${extraAttrs} style="padding: 2px 4px; font-size: 11px; font-weight: 600; width: 100%; ${lockExtraCss}">
          <option value="">— Select Employee —</option>
          ${optsHtml}
          <option value="__manual__"${isManualMode ? ' selected' : ''}>✏️ Manual Entry…</option>
        </select>
        <input type="text" class="field-name-manual" value="${isManualMode ? Utils.escapeHtml(savedName) : ''}" placeholder="Type name…"
          ${lockManualAttr} style="padding: 2px 4px; font-size: 11px; width: 100%; ${lockExtraCss}">
      </div>
    `;
  },

  renderPersonnelRow(r, entity, locations = [], donors = [], activities = [], conditionAreas = [], subTab = 'salaries-wages', masterEmployees = [], deptEmployees = [], deptName = '', isLocked = false) {
    locations = Array.isArray(locations) ? locations : [];
    donors = Array.isArray(donors) ? donors : [];
    activities = Array.isArray(activities) ? activities : [];
    conditionAreas = Array.isArray(conditionAreas) ? conditionAreas : [];

    const lockAttr = isLocked ? 'disabled readonly style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';
    const lockSelectAttr = isLocked ? 'disabled style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';

    const monthlyInputs = SEED_DATA.months.map((m, idx) => `
      <td class="editable num month-col">
        <input type="number" class="month-input" data-month="${idx}" value="${r.monthlyValues?.[idx] || 0}" ${lockAttr}>
      </td>
    `).join('');

    const sharedEndCols = (isMandatoryLocation = false) => `
      <td>
        <select class="form-select field-location ${isMandatoryLocation ? 'mandatory-field' : ''}" style="padding: 2px 4px; font-size: 11px;" ${isMandatoryLocation ? 'required' : ''} ${lockSelectAttr}>
          <option value="">Select Location</option>
          ${locations.map(l => `<option value="${l.name}" ${r.location === l.name ? 'selected' : ''}>${l.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-select field-donor" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
          <option value="">Select Donor</option>
          ${donors.map(d => `<option value="${d.name}" ${r.donor === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-select field-activity" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
          <option value="">Select Activity</option>
          ${activities.map(a => `<option value="${a.name}" ${r.activity === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-select field-condition" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
          <option value="">Select Area</option>
          ${conditionAreas.map(c => `<option value="${c.name}" ${r.conditionArea === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </td>
      <td class="editable"><input type="text" class="field-remarks" value="${r.remarks || ''}" placeholder="Remarks" ${lockAttr}></td>
      <td>
        ${isLocked ? '' : `<button class="btn btn-danger btn-sm" onclick="BudgetEntryModule.deleteRow('${STORES.payrollPersonnel}', ${r.id})">🗑️</button>`}
      </td>
    `;

    if (subTab === 'salaries-wages') {
      const isNew = r.employeeStatus === 'New' || (!r.name && !r.employeeCode && (r.employeeStatus === undefined || r.employeeStatus === 'New'));
      const req = !isNew ? 'required' : '';
      const mandClass = !isNew ? 'mandatory-field' : '';

      // New hires: free text. Existing: smart dropdown from master
      const nameCell = isNew
        ? `<td class="sticky-col-emp editable"><input type="text" class="field-name" value="${Utils.escapeHtml(r.name || '')}" placeholder="Type new staff name…" ${lockAttr} style="padding: 4px 8px; font-size: 12px; width: 100%; font-weight: 600;"></td>`
        : `<td class="sticky-col-emp editable">${this.buildEmpNameCell(r, masterEmployees, deptEmployees, deptName, mandClass, req, isLocked)}</td>`;

      return `
        <tr data-id="${r.id}" data-sub-category="${r.subCategory || 'salaries-wages'}" class="${isNew ? 'row-status-new' : 'row-status-existing'}">
          <td class="sticky-col-status">
            <select class="form-select field-status" style="padding: 2px 4px; font-size: 11px; min-width: 85px; font-weight: 600;" ${lockSelectAttr}>
              <option value="New" ${isNew ? 'selected' : ''}>New</option>
              <option value="Existing" ${!isNew ? 'selected' : ''}>Existing</option>
            </select>
          </td>
          ${nameCell}
          <td class="editable"><input type="text" class="field-emp-code" value="${r.employeeCode || ''}" placeholder="EMP Code" ${lockAttr} style="min-width: 85px; font-family: monospace; font-size: 11px;"></td>
          <td class="editable"><input type="text" class="field-dept" value="${deptName || ''}" title="${r.department || deptName || ''}" placeholder="Department" ${lockAttr} style="min-width: 110px; font-size: 11px;"></td>
          <td class="editable"><input type="text" class="field-designation ${mandClass}" value="${r.designation || ''}" placeholder="Designation" ${req} ${lockAttr}></td>
          <td class="editable"><input type="date" class="field-doj ${mandClass}" value="${r.dateOfJoining || ''}" style="padding: 2px 4px; font-size: 11px;" ${req} ${lockAttr}></td>
          <td>
            <select class="form-select field-banding ${mandClass}" style="padding: 2px 4px; font-size: 11px;" ${req} ${lockSelectAttr}>
              ${SEED_DATA.bandings.map(b => `<option value="${b}" ${r.banding === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="form-select field-level ${mandClass}" style="padding: 2px 4px; font-size: 11px;" ${req} ${lockSelectAttr}>
              ${SEED_DATA.levels.map(l => `<option value="${l}" ${r.level === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </td>
          <td class="editable num"><input type="number" class="field-current-ctc ${mandClass}" value="${r.currentMonthlyCTC || 0}" ${isNew ? 'disabled style="background: var(--bg-tertiary); color: var(--text-tertiary);"' : (isLocked ? lockAttr : req)}></td>
          <td class="editable num"><input type="number" class="field-new-ctc ${mandClass}" value="${r.newMonthlyCTC || 0}" ${isLocked ? lockAttr : req}></td>
          <td class="editable num"><input type="number" class="field-inc-pct ${mandClass}" value="${r.incrementPct || 0}" ${isNew ? 'disabled style="background: var(--bg-tertiary); color: var(--text-tertiary);"' : (isLocked ? lockAttr : req)}></td>
          <td class="num field-inc-val">${isNew ? '-' : Utils.formatNumber(r.incrementValue || 0)}</td>
          <td class="num font-bold field-total-cy">${Utils.formatNumber(r.totalCY || 0)}</td>
          ${monthlyInputs}
          ${sharedEndCols(!isNew)}
        </tr>
      `;
    } else if (subTab === 'gratuity-bonus') {
      return `
        <tr data-id="${r.id}" data-sub-category="${r.subCategory || 'gratuity-bonus'}">
          <td class="sticky-col-1">${this.buildEmpNameCell(r, masterEmployees, deptEmployees, deptName, '', '', isLocked)}</td>
          <td class="editable"><input type="text" class="field-emp-code" value="${r.employeeCode || ''}" placeholder="EMP Code" ${lockAttr} style="min-width: 85px; font-family: monospace; font-size: 11px;"></td>
          <td class="editable"><input type="text" class="field-dept" value="${deptName || ''}" title="${r.department || deptName || ''}" placeholder="Department" ${lockAttr} style="min-width: 110px; font-size: 11px;"></td>
          <td class="sticky-col-2 editable"><input type="text" class="field-designation" value="${r.designation || ''}" placeholder="Designation" ${lockAttr}></td>
          <td class="editable"><input type="date" class="field-doj" value="${r.dateOfJoining || ''}" style="padding: 2px 4px; font-size: 11px;" ${lockAttr}></td>
          <td class="num font-bold field-total-cy">${Utils.formatNumber(r.totalCY || 0)}</td>
          ${monthlyInputs}
          ${sharedEndCols(false)}
        </tr>
      `;
    } else { // other-staff-expenses
      return `
        <tr data-id="${r.id}" data-sub-category="${r.subCategory || 'other-staff-expenses'}">
          <td class="sticky-col-1">${this.buildEmpNameCell(r, masterEmployees, deptEmployees, deptName, '', '', isLocked)}</td>
          <td class="editable"><input type="text" class="field-emp-code" value="${r.employeeCode || ''}" placeholder="EMP Code" ${lockAttr} style="min-width: 85px; font-family: monospace; font-size: 11px;"></td>
          <td class="editable"><input type="text" class="field-dept" value="${deptName || ''}" title="${r.department || deptName || ''}" placeholder="Department" ${lockAttr} style="min-width: 110px; font-size: 11px;"></td>
          <td class="sticky-col-2 editable"><input type="text" class="field-designation" value="${r.designation || ''}" placeholder="Expense Line / Designation" ${lockAttr}></td>
          <td class="num font-bold field-total-cy">${Utils.formatNumber(r.totalCY || 0)}</td>
          ${monthlyInputs}
          ${sharedEndCols(false)}
        </tr>
      `;
    }
  },

  getEmpNameFromRow(row) {
    const nameSelect = row.querySelector('select.field-name');
    if (nameSelect) {
      if (nameSelect.value === '__manual__') {
        return row.querySelector('.field-name-manual')?.value.trim() || '';
      }
      const selOpt = nameSelect.options ? nameSelect.options[nameSelect.selectedIndex] : null;
      return selOpt?.dataset?.name || (selOpt?.value ? (selOpt.textContent || selOpt.text || '').split(' — ')[0].trim() : '');
    }
    const nameInput = row.querySelector('input.field-name');
    if (nameInput) {
      return nameInput.value.trim();
    }
    return '';
  },

  attachPersonnelEvents(container, yearId, entity, dept) {
    const table = container.querySelector('#personnelTable');
    if (!table) return;

    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId);
    if (isLocked) return;

    const subTab = this.activePersonnelSubTab || 'salaries-wages';
    const countLabel = subTab === 'salaries-wages' ? 'Employees' : 'Line Items';

    // Handler for change events (e.g. Employee dropdown, Status dropdown)
    const handleFieldChange = (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      // Handle Employee Master Dropdown selection & auto-fill
      if (e.target.classList.contains('field-name') && e.target.tagName === 'SELECT') {
        const selectedVal = e.target.value;
        const manualInput = row.querySelector('.field-name-manual');
        const cellContainer = row.querySelector('.emp-name-cell');

        if (selectedVal === '__manual__') {
          if (cellContainer) cellContainer.classList.add('is-manual-mode');
          if (manualInput) {
            manualInput.focus();
          }
        } else {
          if (cellContainer) cellContainer.classList.remove('is-manual-mode');
          if (manualInput) {
            manualInput.value = '';
          }

          if (selectedVal) {
            const selOpt = e.target.options[e.target.selectedIndex];
            const empCode = selOpt?.dataset?.code || '';
            const empDept = selOpt?.dataset?.dept || '';
            const desig = selOpt?.dataset?.designation || '';
            const doj = selOpt?.dataset?.doj || '';
            const band = selOpt?.dataset?.band || '';
            const level = selOpt?.dataset?.level || '';
            const ctc = Utils.parseNumber(selOpt?.dataset?.ctc) || 0;
            const loc = selOpt?.dataset?.location || '';
            const donor = selOpt?.dataset?.donor || '';
            const activity = selOpt?.dataset?.activity || '';
            const condition = selOpt?.dataset?.condition || '';

            // Auto-fill Employee Code
            const codeInput = row.querySelector('.field-emp-code');
            if (codeInput && empCode) codeInput.value = empCode;

            // Auto-fill Department
            const deptInput = row.querySelector('.field-dept');
            if (deptInput && (empDept || dept.name)) deptInput.value = empDept || dept.name;

            // Auto-fill Designation
            const desigInput = row.querySelector('.field-designation');
            if (desigInput && desig) desigInput.value = desig;

            // Auto-fill DOJ
            const dojInput = row.querySelector('.field-doj');
            if (dojInput && doj) dojInput.value = doj;

            // Auto-fill Banding
            const bandSelect = row.querySelector('.field-banding');
            if (bandSelect && band) {
              bandSelect.value = band;
              if (!bandSelect.value && bandSelect.options.length > 0) {
                for (const opt of bandSelect.options) {
                  if (opt.value.toLowerCase() === band.toLowerCase()) {
                    bandSelect.value = opt.value;
                    break;
                  }
                }
              }
            }

            // Auto-fill Level
            const levelSelect = row.querySelector('.field-level');
            if (levelSelect && level) {
              levelSelect.value = level;
              if (!levelSelect.value && levelSelect.options.length > 0) {
                for (const opt of levelSelect.options) {
                  if (opt.value.toLowerCase() === level.toLowerCase()) {
                    levelSelect.value = opt.value;
                    break;
                  }
                }
              }
            }

            // Auto-fill Location, Donor, Activity, Condition Area if present
            const locSelect = row.querySelector('.field-location');
            if (locSelect && loc && !locSelect.value) locSelect.value = loc;

            const donorSelect = row.querySelector('.field-donor');
            if (donorSelect && donor && !donorSelect.value) donorSelect.value = donor;

            const actSelect = row.querySelector('.field-activity');
            if (actSelect && activity && !actSelect.value) actSelect.value = activity;

            const condSelect = row.querySelector('.field-condition');
            if (condSelect && condition && !condSelect.value) condSelect.value = condition;

            // Auto-fill Current Monthly CTC and auto-calculate New CTC & Monthly Budget
            const currentCtcInput = row.querySelector('.field-current-ctc');
            if (currentCtcInput) {
              currentCtcInput.value = ctc;

              const incPct = Utils.parseNumber(row.querySelector('.field-inc-pct')?.value) || 0;
              const incVal = Math.round(ctc * (incPct / 100));
              const newCTC = ctc + incVal;

              const incValCell = row.querySelector('.field-inc-val');
              if (incValCell) incValCell.textContent = Utils.formatNumber(incVal);

              const newCtcCell = row.querySelector('.field-new-ctc');
              if (newCtcCell) newCtcCell.value = newCTC;

              // Populate monthly budget cells
              row.querySelectorAll('.month-input').forEach(m => {
                m.value = newCTC;
              });

              let rowTotal = 0;
              row.querySelectorAll('.month-input').forEach(m => { rowTotal += Utils.parseNumber(m.value); });
              const totalCell = row.querySelector('.field-total-cy');
              if (totalCell) totalCell.textContent = Utils.formatNumber(rowTotal);
            }

            this.refreshBannerSummary(container, entity, countLabel);
          }
        }
        this.savePersonnelRow(row, yearId, entity.id, dept.id);
      }

      // Handle Employee Status changes (Existing vs New)
      if (e.target.classList.contains('field-status')) {
        const isNew = e.target.value === 'New';
        const currentCtcInput = row.querySelector('.field-current-ctc');
        const incPctInput = row.querySelector('.field-inc-pct');
        const incValCell = row.querySelector('.field-inc-val');
        const mandatorySelectors = [
          '.field-name', '.field-designation', '.field-doj',
          '.field-banding', '.field-level', '.field-current-ctc',
          '.field-new-ctc', '.field-inc-pct', '.field-location'
        ];

        const nameCell = row.querySelector('.sticky-col-emp');
        const curName = this.getEmpNameFromRow(row);
        const curCode = row.querySelector('.field-emp-code')?.value || '';

        if (isNew) {
          row.classList.add('row-status-new');
          row.classList.remove('row-status-existing');
          if (nameCell) {
            nameCell.innerHTML = `<input type="text" class="field-name" value="${Utils.escapeHtml(curName)}" placeholder="New Employee Name" style="padding: 2px 4px; font-size: 11px; width: 100%;">`;
          }
          if (currentCtcInput) {
            currentCtcInput.disabled = true;
            currentCtcInput.style.background = 'var(--bg-tertiary)';
            currentCtcInput.style.color = 'var(--text-tertiary)';
            currentCtcInput.value = 0;
          }
          if (incPctInput) {
            incPctInput.disabled = true;
            incPctInput.style.background = 'var(--bg-tertiary)';
            incPctInput.style.color = 'var(--text-tertiary)';
            incPctInput.value = 0;
          }
          if (incValCell) incValCell.textContent = '-';

          // Remove required & mandatory class for New status
          mandatorySelectors.forEach(sel => {
            const el = row.querySelector(sel);
            if (el) {
              el.required = false;
              el.classList.remove('mandatory-field');
            }
          });
        } else {
          row.classList.remove('row-status-new');
          row.classList.add('row-status-existing');
          if (nameCell) {
            nameCell.innerHTML = this.buildEmpNameCell(
              { name: curName, employeeCode: curCode },
              this._masterEmployees || [],
              this._deptEmployees || [],
              dept?.name || '',
              'mandatory-field',
              'required'
            );
          }
          if (currentCtcInput) {
            currentCtcInput.disabled = false;
            currentCtcInput.style.background = '';
            currentCtcInput.style.color = '';
          }
          if (incPctInput) {
            incPctInput.disabled = false;
            incPctInput.style.background = '';
            incPctInput.style.color = '';
          }

          // Apply required & mandatory class for Existing status
          mandatorySelectors.forEach(sel => {
            const el = row.querySelector(sel);
            if (el) {
              el.required = true;
              el.classList.add('mandatory-field');
            }
          });
        }
        this.savePersonnelRow(row, yearId, entity.id, dept.id);
      }
    };

    table.addEventListener('change', handleFieldChange);

    table.addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      // Auto-fill forward: if a month cell was changed, fill all later months with same value
      if (e.target.classList.contains('month-input')) {
        const changedIdx = parseInt(e.target.dataset.month);
        const val = e.target.value;
        row.querySelectorAll('.month-input').forEach(m => {
          if (parseInt(m.dataset.month) > changedIdx) {
            m.value = val;
          }
        });
      }

      // If New Monthly CTC changed, auto-update all monthly budget columns
      if (e.target.classList.contains('field-new-ctc')) {
        const newCTCVal = Utils.parseNumber(e.target.value);
        if (newCTCVal >= 0) {
          row.querySelectorAll('.month-input').forEach(m => {
            m.value = newCTCVal;
          });
        }
      }

      // For Existing employees, calculate Increment Value & New CTC from Current CTC & Inc %
      const statusVal = row.querySelector('.field-status')?.value || 'Existing';
      if (statusVal === 'Existing') {
        const currentCtcField = row.querySelector('.field-current-ctc');
        if (currentCtcField && (e.target.classList.contains('field-current-ctc') || e.target.classList.contains('field-inc-pct'))) {
          const currentCTC = Utils.parseNumber(currentCtcField.value);
          const incPct = Utils.parseNumber(row.querySelector('.field-inc-pct')?.value);
          const incVal = Math.round(currentCTC * (incPct / 100));
          const newCTC = currentCTC + incVal;

          const incValCell = row.querySelector('.field-inc-val');
          if (incValCell) incValCell.textContent = Utils.formatNumber(incVal);

          const newCtcCell = row.querySelector('.field-new-ctc');
          if (newCtcCell) newCtcCell.value = newCTC;

          if (newCTC > 0) {
            row.querySelectorAll('.month-input').forEach(m => {
              m.value = newCTC;
            });
          }
        }
      }

      let rowTotal = 0;
      row.querySelectorAll('.month-input').forEach(m => { rowTotal += Utils.parseNumber(m.value); });
      const totalCell = row.querySelector('.field-total-cy');
      if (totalCell) totalCell.textContent = Utils.formatNumber(rowTotal);

      this.refreshBannerSummary(container, entity, countLabel);
      this.savePersonnelRow(row, yearId, entity.id, dept.id);
    });
  },

  // ─── Live Banner Refresh ───
  // Sums raw .month-input values directly (no formatting/parse round-trip).
  // Called after every cell edit so the banner always reflects live entries.
  refreshBannerSummary(container, entity, countLabel) {
    const table = container.querySelector('table');
    if (!table) return;

    // Data rows only ── skip colspan empty-state placeholders and total-row summaries
    const dataRows = [...table.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('total-row') && !r.querySelector('[colspan]'));
    const count = dataRows.length;

    // Sum directly from raw numeric inputs to avoid formatting parse issues
    let grandTotal = 0;
    const colSums = Array(12).fill(0);
    dataRows.forEach(r => {
      r.querySelectorAll('.month-input').forEach(m => {
        const val = parseFloat(m.value) || 0;
        grandTotal += val;
        const mIdx = parseInt(m.dataset.month);
        if (!isNaN(mIdx)) {
          colSums[mIdx] += val;
        }
      });
    });

    const countEl = container.querySelector('#bannerCount') || document.getElementById('bannerCount');
    const totalEl = container.querySelector('#bannerTotal') || document.getElementById('bannerTotal');
    const totalUsdEl = container.querySelector('#bannerTotalUSD') || document.getElementById('bannerTotalUSD');
    const rate = this._conversionRates?.[entity.currency] || 1.0;

    if (countEl) countEl.textContent = `${count} ${countLabel}`;
    if (totalEl) totalEl.textContent = Utils.formatCurrency(grandTotal, entity.currency);
    if (totalUsdEl) {
      if (entity.currency !== 'USD') {
        const usdVal = Utils.convertToUSD(grandTotal, rate);
        totalUsdEl.innerHTML = `≈ ${Utils.formatCurrency(usdVal, 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${rate} ${entity.currency}/USD)</span>`;
      } else {
        totalUsdEl.innerHTML = '';
      }
    }

    // Real-time update of top and bottom total rows inside table
    table.querySelectorAll('tr.total-row').forEach(tRow => {
      const totCell = tRow.querySelector('.field-total-cy');
      if (totCell) totCell.textContent = Utils.formatNumber(grandTotal);
      tRow.querySelectorAll('.month-col').forEach((mc, idx) => {
        mc.textContent = Utils.formatNumber(colSums[idx] || 0);
      });
    });
  },

  async savePersonnelRow(row, yearId, entityId, deptId) {
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      console.warn(`[BudgetEntry] Blocked savePersonnelRow: Budget cycle CY-${yearId} (${entityId}) is locked.`);
      return;
    }

    const id = row.dataset.id ? parseInt(row.dataset.id) : null;
    const monthlyValues = {};
    row.querySelectorAll('.month-input').forEach((m, idx) => {
      monthlyValues[idx] = Utils.parseNumber(m.value);
    });

    const totalCY = Utils.sumMonthlyValues(monthlyValues);
    const empName = this.getEmpNameFromRow(row);

    const nameSelect = row.querySelector('select.field-name');
    const isManual = nameSelect ? (nameSelect.value === '__manual__') : (row.querySelector('.field-status')?.value === 'New');
    const statusVal = row.querySelector('.field-status')?.value || (isManual ? 'New' : 'Existing');

    const record = {
      id: id || undefined,
      yearId,
      entityId,
      deptId,
      subCategory: row.dataset.subCategory || this.activePersonnelSubTab || 'salaries-wages',
      employeeStatus: statusVal,
      isManual: isManual,
      name: empName,
      employeeCode: row.querySelector('.field-emp-code')?.value || '',
      department: row.querySelector('.field-dept')?.value || '',
      designation: row.querySelector('.field-designation')?.value || '',
      dateOfJoining: row.querySelector('.field-doj')?.value || '',
      banding: row.querySelector('.field-banding')?.value || '',
      level: row.querySelector('.field-level')?.value || '',
      currentMonthlyCTC: Utils.parseNumber(row.querySelector('.field-current-ctc')?.value),
      newMonthlyCTC: Utils.parseNumber(row.querySelector('.field-new-ctc')?.value),
      incrementPct: Utils.parseNumber(row.querySelector('.field-inc-pct')?.value),
      incrementValue: Utils.calculateIncrement(row.querySelector('.field-current-ctc')?.value, row.querySelector('.field-inc-pct')?.value),
      monthlyValues,
      totalCY,
      location: row.querySelector('.field-location')?.value || '',
      donor: row.querySelector('.field-donor')?.value || '',
      activity: row.querySelector('.field-activity')?.value || '',
      conditionArea: row.querySelector('.field-condition')?.value || '',
      remarks: row.querySelector('.field-remarks')?.value || ''
    };

    const newId = await db.put(STORES.payrollPersonnel, record);
    if (!id) row.dataset.id = newId;
    await db.logAudit({
      yearId, entityId, deptId,
      category: record.subCategory || 'salaries',
      action: id ? 'UPDATE' : 'CREATE',
      recordId: record.id || newId,
      description: `${id ? 'Updated' : 'Added'} personnel line for "${record.name || 'Staff'}" (${record.designation || ''})`,
      changes: { name: record.name, designation: record.designation, totalCY: record.totalCY }
    });
    this.maybeRefreshTotalCosts();
  },

  async saveEhaRow(row, yearId, entityId, deptId) {
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      console.warn(`[BudgetEntry] Blocked saveEhaRow: Budget cycle CY-${yearId} (${entityId}) is locked.`);
      return;
    }

    const id = row.dataset.id ? parseInt(row.dataset.id) : null;
    const monthlyValues = {};
    row.querySelectorAll('.month-input').forEach((m, idx) => { monthlyValues[idx] = Utils.parseNumber(m.value); });

    const record = {
      id: id || undefined,
      yearId, entityId, deptId,
      name: row.querySelector('.field-name')?.value || '',
      role: row.querySelector('.field-role')?.value || '',
      monthlyValues,
      totalCY: Utils.sumMonthlyValues(monthlyValues),
      location: row.querySelector('.field-location')?.value || '',
      donor: row.querySelector('.field-donor')?.value || '',
      activity: row.querySelector('.field-activity')?.value || '',
      conditionArea: row.querySelector('.field-condition')?.value || '',
      remarks: row.querySelector('.field-remarks')?.value || ''
    };

    const newId = await db.put(STORES.payrollEHA, record);
    if (!id) row.dataset.id = newId;
    await db.logAudit({
      yearId, entityId, deptId,
      category: 'eha',
      action: id ? 'UPDATE' : 'CREATE',
      recordId: record.id || newId,
      description: `${id ? 'Updated' : 'Added'} EHA consultant "${record.name || 'Consultant'}" (${record.role || ''})`,
      changes: { name: record.name, role: record.role, totalCY: record.totalCY }
    });
    this.maybeRefreshTotalCosts();
  },

  async saveFaRow(row, yearId, entityId, deptId) {
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      console.warn(`[BudgetEntry] Blocked saveFaRow: Budget cycle CY-${yearId} (${entityId}) is locked.`);
      return;
    }

    const id = row.dataset.id ? parseInt(row.dataset.id) : null;
    const monthlyValues = {};
    row.querySelectorAll('.month-input').forEach((m, idx) => { monthlyValues[idx] = Utils.parseNumber(m.value); });
    const empName = this.getEmpNameFromRow(row);

    const record = {
      id: id || undefined,
      yearId, entityId, deptId,
      employeeName: empName,
      assetType: row.querySelector('.field-asset')?.value || '',
      model: row.querySelector('.field-model')?.value || '',
      monthlyValues,
      totalCY: Utils.sumMonthlyValues(monthlyValues),
      location: row.querySelector('.field-location')?.value || '',
      donor: row.querySelector('.field-donor')?.value || '',
      activity: row.querySelector('.field-activity')?.value || '',
      conditionArea: row.querySelector('.field-condition')?.value || '',
      remarks: row.querySelector('.field-remarks')?.value || ''
    };

    const newId = await db.put(STORES.payrollFixedAsset, record);
    if (!id) row.dataset.id = newId;
    await db.logAudit({
      yearId, entityId, deptId,
      category: 'fixed-assets',
      action: id ? 'UPDATE' : 'CREATE',
      recordId: record.id || newId,
      description: `${id ? 'Updated' : 'Added'} fixed asset "${record.assetType}" for ${record.employeeName || 'Staff'}`,
      changes: { assetType: record.assetType, employeeName: record.employeeName, totalCY: record.totalCY }
    });
    this.maybeRefreshTotalCosts();
  },

  async saveNonPayrollRow(row, yearId, entityId, deptId) {
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      console.warn(`[BudgetEntry] Blocked saveNonPayrollRow: Budget cycle CY-${yearId} (${entityId}) is locked.`);
      return;
    }

    const id = row.dataset.id ? parseInt(row.dataset.id) : null;
    const monthlyValues = {};
    row.querySelectorAll('.month-input').forEach((m, idx) => { monthlyValues[idx] = Utils.parseNumber(m.value); });

    const parentAccount = row.dataset.parent || row.children[0]?.querySelector('strong')?.textContent?.trim() || row.children[0]?.textContent?.trim() || 'Other Expenses';
    const glDescription = row.dataset.gl || row.children[1]?.textContent?.trim() || 'General Expense';
    const ledgerCode = row.dataset.ledger || row.children[2]?.querySelector('code')?.textContent?.trim() || row.children[2]?.textContent?.trim() || '93999';
    const isTravelPackage = row.dataset.isPackage === 'true';
    const travelPackageId = row.dataset.packageId ? parseInt(row.dataset.packageId) : (row.dataset.packageId || undefined);

    const record = {
      id: id || undefined,
      yearId,
      entityId,
      deptId,
      subGroup: row.dataset.subgroup || 'Operational Costs',
      parentAccount,
      glDescription,
      ledgerCode,
      isTravelPackage,
      travelPackageId,
      basisOfExpense: row.querySelector('.field-basis')?.value || '',
      monthlyValues,
      totalCY: Utils.sumMonthlyValues(monthlyValues),
      activity: row.querySelector('.field-activity')?.value || '',
      location: row.querySelector('.field-location')?.value || '',
      donor: row.querySelector('.field-donor')?.value || '',
      conditionArea: row.querySelector('.field-condition')?.value || '',
      remarks: row.querySelector('.field-remarks')?.value || ''
    };

    const newId = await db.put(STORES.nonPayrollCost, record);
    if (!id && newId) row.dataset.id = newId;
    await db.logAudit({
      yearId, entityId, deptId,
      category: 'other-costs',
      action: id ? 'UPDATE' : 'CREATE',
      recordId: record.id || newId,
      description: `${id ? 'Updated' : 'Added'} other cost line "${record.glDescription}" (${record.ledgerCode})`,
      changes: { glDescription: record.glDescription, ledgerCode: record.ledgerCode, totalCY: record.totalCY, basisOfExpense: record.basisOfExpense }
    });
    this.maybeRefreshTotalCosts();
  },

  async saveTotalCostRow(row, yearId, entityId, deptId) {
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      console.warn(`[BudgetEntry] Blocked saveTotalCostRow: Budget cycle CY-${yearId} is locked.`);
      return;
    }

    const ledgerCode = row.dataset.ledger || '';
    const glDescription = row.dataset.gldesc || '';
    const basisOfExpense = row.querySelector('.field-basis')?.value || '';
    const remarks = row.querySelector('.field-remarks')?.value || '';

    const existing = await db.getBudgetData(STORES.totalCostSheet, yearId, entityId, deptId);
    let record = existing.find(r => (r.ledgerCode && r.ledgerCode === ledgerCode) || (r.glDescription && r.glDescription === glDescription));

    if (record) {
      record.basisOfExpense = basisOfExpense;
      record.remarks = remarks;
      await db.update(STORES.totalCostSheet, record);
    } else {
      await db.add(STORES.totalCostSheet, {
        yearId,
        entityId,
        deptId,
        ledgerCode,
        glDescription,
        basisOfExpense,
        remarks,
        monthlyValues: {},
        totalCY: 0
      });
    }

    await db.logAudit({
      yearId, entityId, deptId,
      category: 'total-dept-cost',
      action: 'UPDATE',
      recordId: ledgerCode || glDescription,
      description: `Updated remarks / basis for "${glDescription}" (${ledgerCode})`,
      changes: { basisOfExpense, remarks }
    });
  },

  async saveTotalCostBasis(row, yearId, entityId, deptId) {
    return this.saveTotalCostRow(row, yearId, entityId, deptId);
  },

  maybeRefreshTotalCosts() {
    // Total Costs tab removed — no-op
  },

  isMonthsCollapsed() {
    if (typeof this._monthsCollapsedState === 'boolean') {
      return this._monthsCollapsedState;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('noora_budget_months_collapsed') === 'true';
    }
    return false;
  },

  toggleMonthlyColumns(btn) {
    const table = btn?.closest('.table-container')?.querySelector('.data-table') || document.querySelector('.data-table');
    if (!table) return;
    table.classList.toggle('months-collapsed');
    const isCollapsed = table.classList.contains('months-collapsed');
    this._monthsCollapsedState = isCollapsed;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('noora_budget_months_collapsed', isCollapsed ? 'true' : 'false');
    }
    const toggleTh = table.querySelector('[data-toggle-months]');
    if (toggleTh) {
      const arrow = toggleTh.querySelector('.months-toggle-arrow');
      if (arrow) arrow.innerHTML = isCollapsed ? '&#9654;' : '&#9664;';
      toggleTh.title = isCollapsed ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)';
    }
  },

  _toggleMonthsFromTh(th, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const table = th.closest('.data-table');
    if (!table) return;
    table.classList.toggle('months-collapsed');
    const isCollapsed = table.classList.contains('months-collapsed');
    this._monthsCollapsedState = isCollapsed;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('noora_budget_months_collapsed', isCollapsed ? 'true' : 'false');
    }
    const arrow = th.querySelector('.months-toggle-arrow');
    if (arrow) {
      arrow.innerHTML = isCollapsed ? '&#9654;' : '&#9664;';
    }
    th.title = isCollapsed ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)';
  },

  // ─── EHA Grid ───
  async renderEhaGrid(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas) {
    const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'eha', entityId: entity.id, deptId: dept.id })) {
      const currentUser = Auth.getCurrentUser();
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Denied</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${currentUser.roleName || 'Active Role'}</strong>) does not have view access to <strong>EHA Consultants</strong> for <strong>${deptDisplayName}</strong>.
          </p>
          <div class="badge badge-subtle font-bold" style="padding: 6px 14px;">Contact your System Administrator to request category access.</div>
        </div>
      `;
      return;
    }

    const allRecords = await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, dept.id);
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId);
    const lockAttr = isLocked ? 'disabled readonly style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';
    const lockSelectAttr = isLocked ? 'disabled style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';

    const records = allRecords.filter(r => {
      if (typeof Auth === 'undefined') return true;
      return Auth.hasPermission('view', {
        category: 'eha',
        ledgerCode: r.ledgerCode || '92101',
        glDescription: r.name || r.role || 'EHA Consultant',
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const totalCost = records.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);

    // Load active employees for EHA name autocomplete suggestions
    const allEhaMasterEmps = await db.getEmployeesMaster();
    const ehaNameList = allEhaMasterEmps
      .filter(e => e.entityId === entity.id && e.status !== 'Inactive')
      .map(e => e.name).filter(Boolean);

    const colMonthlySums = Array(12).fill(0);
    records.forEach(r => {
      if (r.monthlyValues) {
        Object.entries(r.monthlyValues).forEach(([mIdx, val]) => {
          colMonthlySums[parseInt(mIdx)] += (Utils.parseNumber(val) || 0);
        });
      }
    });

    const bottomTotalRowHtml = `
      <tr class="total-row">
        <td class="sticky-col-1 font-bold">TOTAL EHA BUDGET:</td>
        <td class="sticky-col-2 font-bold text-right" style="padding-right: 12px;">(${entity.currency})</td>
        <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatNumber(totalCost)}</td>
        ${SEED_DATA.months.map((m, idx) => `
          <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
        `).join('')}
        <td colspan="6"></td>
      </tr>
    `;

    container.innerHTML = `
      <div class="card p-md mb-md flex items-center gap-lg" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.06)); border-color: rgba(16, 185, 129, 0.2);">
          <div>
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Consultants Count</div>
            <div id="bannerCount" style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${records.length} Consultants</div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total EHA Budget (${entity.currency})</div>
            <div id="bannerTotal" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-success);">${Utils.formatCurrency(totalCost, entity.currency)}</div>
            <div id="bannerTotalUSD" style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
              ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalCost, this._conversionRates?.[entity.currency] || 1.0), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${this._conversionRates?.[entity.currency] || 1.0} ${entity.currency}/USD)</span>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
          </div>
      </div>

      <div class="table-container">
        <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}" id="ehaTable">
          <thead>
            <tr>
              <th class="sticky-col-1">Consultant Name</th>
              <th class="sticky-col-2">Role / Scope</th>
              <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
              ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
              <th>Location</th>
              <th>Donor</th>
              <th>Activity</th>
              <th>Condition Area</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${records.length === 0 ? `
              <tr><td colspan="21" class="text-center p-lg text-muted">No external consultants (EHA) added yet.</td></tr>
            ` : `
              ${records.map(r => `
                <tr data-id="${r.id}">
                  <td class="sticky-col-1 editable">
                    <input type="text" class="field-name" value="${r.name || ''}" placeholder="Consultant Name" list="ehaNameList" autocomplete="off" ${lockAttr}>
                  </td>
                  <td class="sticky-col-2 editable"><input type="text" class="field-role" value="${r.role || ''}" placeholder="Role" ${lockAttr}></td>
                  <td class="num font-bold field-total-cy">${Utils.formatNumber(r.totalCY || 0)}</td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="editable num month-col"><input type="number" class="month-input" data-month="${idx}" value="${r.monthlyValues?.[idx] || 0}" ${lockAttr}></td>
                  `).join('')}
                  <td>
                    <select class="form-select field-location" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Location</option>
                      ${locations.map(l => `<option value="${l.name}" ${r.location === l.name ? 'selected' : ''}>${l.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-donor" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Donor</option>
                      ${donors.map(d => `<option value="${d.name}" ${r.donor === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-activity" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Activity</option>
                      ${activities.map(a => `<option value="${a.name}" ${r.activity === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-condition" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Area</option>
                      ${conditionAreas.map(c => `<option value="${c.name}" ${r.conditionArea === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                  </td>
                  <td class="editable"><input type="text" class="field-remarks" value="${r.remarks || ''}" placeholder="Remarks" ${lockAttr}></td>
                  <td>${isLocked ? '' : `<button class="btn btn-danger btn-sm" onclick="BudgetEntryModule.deleteRow('${STORES.payrollEHA}', ${r.id})">🗑️</button>`}</td>
                </tr>
              `).join('')}
              ${bottomTotalRowHtml}
            `}
          </tbody>
        </table>
        <datalist id="ehaNameList">
          ${ehaNameList.map(name => `<option value="${name}">`).join('')}
        </datalist>
      </div>
    `;

    const table = container.querySelector('#ehaTable');
    if (table) {
      table.addEventListener('input', (e) => {
        if (isLocked) return;
        const row = e.target.closest('tr');
        if (!row) return;

        // Auto-fill forward for month cells
        if (e.target.classList.contains('month-input')) {
          const changedIdx = parseInt(e.target.dataset.month);
          const val = e.target.value;
          row.querySelectorAll('.month-input').forEach(m => {
            if (parseInt(m.dataset.month) > changedIdx) m.value = val;
          });
        }

        let total = 0;
        row.querySelectorAll('.month-input').forEach(m => { total += Utils.parseNumber(m.value); });
        const totalCellEHA = row.querySelector('.field-total-cy');
        if (totalCellEHA) totalCellEHA.textContent = Utils.formatNumber(total);

        this.refreshBannerSummary(container, entity, 'Consultants');
        this.saveEhaRow(row, yearId, entity.id, dept.id);
      });
    }
  },

  // ─── Fixed Assets Grid ───
  async renderFixedAssetsGrid(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas) {
    const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'fixed-assets', entityId: entity.id, deptId: dept.id })) {
      const currentUser = Auth.getCurrentUser();
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Denied</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${currentUser.roleName || 'Active Role'}</strong>) does not have view access to <strong>Fixed Assets</strong> for <strong>${deptDisplayName}</strong>.
          </p>
          <div class="badge badge-subtle font-bold" style="padding: 6px 14px;">Contact your System Administrator to request category access.</div>
        </div>
      `;
      return;
    }

    const allRecords = await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, dept.id);
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entity.id);
    const lockAttr = isLocked ? 'disabled readonly style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';
    const lockSelectAttr = isLocked ? 'disabled style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';

    const records = allRecords.filter(r => {
      if (typeof Auth === 'undefined') return true;
      return Auth.hasPermission('view', {
        category: 'fixed-assets',
        ledgerCode: r.ledgerCode || '11301',
        glDescription: r.assetType || r.model || 'Fixed Asset',
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const totalCost = records.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);

    // Load entity-scoped employees for name dropdown with department employees prioritized
    const allMasterEmps = await db.getEmployeesMaster();
    const deptEmployees = allMasterEmps.filter(e => e.entityId === entity.id && (e.deptId === dept.id || e.dept === dept.id) && e.status !== 'Inactive');
    const masterEmps = allMasterEmps
      .filter(e => e.entityId === entity.id && e.status !== 'Inactive')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const colMonthlySums = Array(12).fill(0);
    records.forEach(r => {
      if (r.monthlyValues) {
        Object.entries(r.monthlyValues).forEach(([mIdx, val]) => {
          colMonthlySums[parseInt(mIdx)] += (Utils.parseNumber(val) || 0);
        });
      }
    });

    const bottomTotalRowHtml = `
      <tr class="total-row">
        <td class="sticky-col-1 font-bold">TOTAL ASSET BUDGET:</td>
        <td class="sticky-col-2 font-bold text-right" style="padding-right: 12px;">(${entity.currency})</td>
        <td></td>
        <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatNumber(totalCost)}</td>
        ${SEED_DATA.months.map((m, idx) => `
          <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
        `).join('')}
        <td colspan="6"></td>
      </tr>
    `;

    container.innerHTML = `
      <div class="card p-md mb-md flex items-center gap-lg" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(239, 68, 68, 0.06)); border-color: rgba(245, 158, 11, 0.2);">
          <div>
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Asset Requests</div>
            <div id="bannerCount" style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${records.length} Requests</div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Asset Budget (${entity.currency})</div>
            <div id="bannerTotal" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-warm);">${Utils.formatCurrency(totalCost, entity.currency)}</div>
            <div id="bannerTotalUSD" style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
              ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalCost, this._conversionRates?.[entity.currency] || 1.0), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${this._conversionRates?.[entity.currency] || 1.0} ${entity.currency}/USD)</span>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
          </div>
      </div>

      <div class="table-container">
        <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}" id="faTable">
          <thead>
            <tr>
              <th class="sticky-col-1">Employee Name</th>
              <th class="sticky-col-2">Asset Type</th>
              <th>Specification / Model</th>
              <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
              ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
              <th>Location</th>
              <th>Donor</th>
              <th>Activity</th>
              <th>Condition Area</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${records.length === 0 ? `
              <tr><td colspan="22" class="text-center p-lg text-muted">No fixed asset requests added.</td></tr>
            ` : `
              ${records.map(r => `
                <tr data-id="${r.id}">
                  <td class="sticky-col-1">${this.buildEmpNameCell({ name: r.employeeName || r.name || '' }, masterEmps, deptEmployees, deptDisplayName, '', '', isLocked)}</td>
                  <td class="sticky-col-2 editable"><input type="text" class="field-asset" value="${r.assetType || ''}" placeholder="Laptop/Printer" ${lockAttr}></td>
                  <td class="editable"><input type="text" class="field-model" value="${r.model || ''}" placeholder="Macbook Air/Pro/Lenovo" ${lockAttr}></td>
                  <td class="num font-bold field-total-cy">${Utils.formatNumber(r.totalCY || 0)}</td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="editable num month-col"><input type="number" class="month-input" data-month="${idx}" value="${r.monthlyValues?.[idx] || 0}" ${lockAttr}></td>
                  `).join('')}
                  <td>
                    <select class="form-select field-location" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Location</option>
                      ${locations.map(l => `<option value="${l.name}" ${r.location === l.name ? 'selected' : ''}>${l.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-donor" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Donor</option>
                      ${donors.map(d => `<option value="${d.name}" ${r.donor === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-activity" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Activity</option>
                      ${activities.map(a => `<option value="${a.name}" ${r.activity === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="form-select field-condition" style="padding: 2px 4px; font-size: 11px;" ${lockSelectAttr}>
                      <option value="">Select Area</option>
                      ${conditionAreas.map(c => `<option value="${c.name}" ${r.conditionArea === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                  </td>
                  <td class="editable"><input type="text" class="field-remarks" value="${r.remarks || ''}" placeholder="Remarks" ${lockAttr}></td>
                  <td>${isLocked ? '' : `<button class="btn btn-danger btn-sm" onclick="BudgetEntryModule.deleteRow('${STORES.payrollFixedAsset}', ${r.id})">🗑️</button>`}</td>
                </tr>
              `).join('')}
              ${bottomTotalRowHtml}
            `}
          </tbody>
        </table>
      </div>
    `;

    const table = container.querySelector('#faTable');
    if (table) {
      table.addEventListener('change', (e) => {
        if (isLocked) return;
        const row = e.target.closest('tr');
        if (!row) return;

        if (e.target.classList.contains('field-name') && e.target.tagName === 'SELECT') {
          const selectedVal = e.target.value;
          const manualInput = row.querySelector('.field-name-manual');
          if (selectedVal === '__manual__') {
            if (manualInput) {
              manualInput.style.display = 'block';
              manualInput.focus();
            }
          } else {
            if (manualInput) {
              manualInput.style.display = 'none';
              manualInput.value = '';
            }
          }
          this.saveFaRow(row, yearId, entity.id, dept.id);
        }
      });

      table.addEventListener('input', (e) => {
        if (isLocked) return;
        const row = e.target.closest('tr');
        if (!row) return;

        // Auto-fill forward for month cells
        if (e.target.classList.contains('month-input')) {
          const changedIdx = parseInt(e.target.dataset.month);
          const val = e.target.value;
          row.querySelectorAll('.month-input').forEach(m => {
            if (parseInt(m.dataset.month) > changedIdx) m.value = val;
          });
        }

        let total = 0;
        row.querySelectorAll('.month-input').forEach(m => { total += Utils.parseNumber(m.value); });
        const totalCellFA = row.querySelector('.field-total-cy');
        if (totalCellFA) totalCellFA.textContent = Utils.formatNumber(total);

        this.refreshBannerSummary(container, entity, 'Requests');
        this.saveFaRow(row, yearId, entity.id, dept.id);
      });
    }
  },

  // ─── Other Costs Category Resolver ───
  getOtherCostCategory(item) {
    if (!item) return 'other';
    if (item.isTravelPackage || item.categoryKey === 'travel') return 'travel';
    if (item.categoryKey && item.categoryKey !== 'all') return item.categoryKey;

    const parent = (item.parentAccount || '').toLowerCase().trim();
    const gl = (item.glDescription || '').toLowerCase().trim();
    const ledger = String(item.ledgerCode || '').trim();

    if (parent.includes('travel') || gl.includes('travel') || gl.includes('lodging') || gl.includes('hotel') || gl.includes('air fare') || ledger.startsWith('931')) return 'travel';
    if (parent.includes('supplies') || parent.includes('printing') || gl.includes('printing') || ledger.startsWith('932')) return 'supplies';
    if (parent.includes('communication') || gl.includes('internet') || gl.includes('telecommunication') || gl.includes('postage') || ledger.startsWith('933')) return 'communication';
    if (parent.includes('office') || gl.includes('software') || gl.includes('stationery') || gl.includes('office equipment') || ledger.startsWith('934')) return 'office';
    if (parent.includes('professional') || parent.includes('consultan') || gl.includes('consultant') || ledger.startsWith('937')) return 'professional';
    return 'other';
  },

  isExcludedFromOtherCosts(item) {
    if (!item) return false;
    const parent = (item.parentAccount || '').toLowerCase().trim();
    const gl = (item.glDescription || '').toLowerCase().trim();
    const sub = (item.subGroup || '').toLowerCase().trim();
    const ledger = String(item.ledgerCode || '').trim();

    // Exclude payroll, retirement benefits, other staff expenses
    if (sub.includes('payroll') || parent.includes('salaries and wages') || gl.includes('salaries and wages') || ledger.startsWith('911')) return true;
    if (parent.includes('health') || parent.includes('retirement') || gl.includes('gratuity') || gl.includes('bonus') || ledger.startsWith('912')) return true;
    if (parent.includes('other staff') || gl.includes('staff training') || gl.includes('learning & development') || ledger.startsWith('913')) return true;

    // Exclude EHA / Resource Persons / Direct Consultants
    if (sub.includes('direct consultants') || parent.includes('resource persons') || gl.includes('eha') || gl.includes('program resource') || ledger.startsWith('921')) return true;

    // Exclude Fixed Assets (CapEx)
    if (sub.includes('fixed assets') || parent.includes('fixed assets') || gl.includes('laptop') || gl.includes('printer') || ledger.startsWith('113')) return true;

    return false;
  },

  // ─── ToT Costs Filter Mode Switcher ('with-tot' vs 'without-tot') ───
  setTotFilterMode(mode) {
    this.totFilterMode = mode;
    this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth || 'Oct');
  },

  // ─── Non-Payroll Grid (Other Costs) ───
  async renderNonPayrollGrid(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas) {
    const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'other-costs', entityId: entity.id, deptId: dept.id })) {
      const currentUser = Auth.getCurrentUser();
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Denied</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${currentUser.roleName || 'Active Role'}</strong>) does not have view access to <strong>Other Costs</strong> for <strong>${deptDisplayName}</strong>.
          </p>
          <div class="badge badge-subtle font-bold" style="padding: 6px 14px;">Contact your System Administrator to request category access.</div>
        </div>
      `;
      return;
    }

    await this.ensureTemplateSyncsClean(yearId, entity.id, dept.id);
    let records = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, dept.id);
    const coa = await db.getAll(STORES.chartOfAccounts);
    const travelPackagesRaw = await db.getBudgetData(STORES.travelPackages, yearId, entity.id, dept.id);

    // Filter COA and records to actual other costs operating lines only
    const nonPayrollCoa = coa.filter(c => !this.isExcludedFromOtherCosts(c));
    records = records.filter(r => !this.isExcludedFromOtherCosts(r)).filter(r => {
      if (typeof Auth === 'undefined') return true;
      return Auth.hasPermission('view', {
        category: 'other-costs',
        ledgerCode: r.ledgerCode,
        glDescription: r.glDescription || r.itemName,
        parentAccount: r.parentAccount,
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const travelPackages = travelPackagesRaw.filter(t => {
      if (typeof Auth === 'undefined') return true;
      return Auth.hasPermission('view', {
        category: 'other-costs',
        ledgerCode: '93101',
        glDescription: t.destinationLocation || 'Travel & Lodging',
        parentAccount: 'Travel & Lodging Expenses',
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    this.totFilterMode = this.totFilterMode || 'with-tot';
    const isImpDept = typeof ImpTotModule !== 'undefined' && ImpTotModule.isImpDept(dept);

    // Reliable ToT detection helper
    const isTotItem = (r) => Boolean(r && (r.isImpTot === true || r.isImpTot === 'true' || r.impTotEventId || (typeof r.basisOfExpense === 'string' && r.basisOfExpense.startsWith('[IMP ToT'))));
    const totRecordsCount = records.filter(isTotItem).length;
    const hasTotLines = totRecordsCount > 0 || isImpDept;

    // Apply With ToT / Without ToT filtering for category views (default: with-tot)
    const displayRecords = this.totFilterMode === 'without-tot'
      ? records.filter(r => !isTotItem(r))
      : records;

    const displayTravelPackages = this.totFilterMode === 'without-tot'
      ? travelPackages.filter(t => !isTotItem(t))
      : travelPackages;

    // Category Counts (combining direct items, Travel Packages, and ToT items without duplicating travel package sublines)
    const nonPayrollTravelLines = displayRecords.filter(r => this.getOtherCostCategory(r) === 'travel' && !r.isTravelPackage && !r.travelPackageId);
    const combinedTravelRecords = [...displayTravelPackages, ...nonPayrollTravelLines];

    const suppliesRecords = displayRecords.filter(r => this.getOtherCostCategory(r) === 'supplies');
    const commRecords = displayRecords.filter(r => this.getOtherCostCategory(r) === 'communication');
    const officeRecords = displayRecords.filter(r => this.getOtherCostCategory(r) === 'office');
    const profRecords = displayRecords.filter(r => this.getOtherCostCategory(r) === 'professional');
    const otherRecords = displayRecords.filter(r => !r.isTravelPackage && !r.travelPackageId && this.getOtherCostCategory(r) === 'other');

    const currentSubTab = this.activeOtherCostSubTab || 'grid';
    const isAllAccountsTab = currentSubTab === 'grid' || currentSubTab === 'all';
    const totalCost = isAllAccountsTab
      ? records.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0)
      : displayRecords.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);
    const displayedCount = isAllAccountsTab ? records.length : displayRecords.length;
    const rate = this._conversionRates?.[entity.currency] || 1.0;
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entity.id);

    // If ToT Program Budget sub-tab is active, delegate directly to ImpTotModule
    if ((currentSubTab === 'tot' || currentSubTab === 'imp-tot') && isImpDept) {
      await ImpTotModule.render(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas);
      return;
    }

    container.innerHTML = `
      <div class="card p-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(6, 182, 212, 0.06)); border-color: rgba(139, 92, 246, 0.2); flex-wrap: wrap; gap: 12px;">
        <div class="flex items-center gap-lg" style="flex-wrap: wrap;">
          <div>
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Other Costs Budget (${entity.currency})</div>
            <div id="bannerTotal" style="font-size: 1.5rem; font-weight: 700; color: var(--accent-secondary);">${Utils.formatCurrency(totalCost, entity.currency)}</div>
            <div id="bannerTotalUSD" style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
              ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalCost, rate), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${rate} ${entity.currency}/USD)</span>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Budgeted Items</div>
            <div id="bannerCount" style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${displayedCount} Item Entries</div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
          </div>
        </div>

        ${isLocked ? '' : `
          <div class="flex items-center gap-sm">
            <button class="btn btn-primary" id="btnQuickNewExpense" style="background: linear-gradient(135deg, #0891b2, #4f46e5);">+ Add Expense Item</button>
            <button class="btn btn-secondary" id="btnNewTravelPkg">✈️ + Travel Package</button>
          </div>
        `}
      </div>

      <!-- Tab Content Area -->
      <div id="otherCostTabContent">
        ${this.renderOtherCostSubTabContent(currentSubTab, nonPayrollCoa, isAllAccountsTab ? records : displayRecords, combinedTravelRecords, suppliesRecords, commRecords, officeRecords, profRecords, otherRecords, yearId, entity, dept, budgetYear, rate, isLocked, hasTotLines)}
      </div>
    `;

    // Attach expandable sub-row listeners for category & travel tables
    container.querySelectorAll('.btn-expand-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.dataset.target;
        const row = container.querySelector('#' + targetId);
        if (!row) return;
        const isHidden = row.style.display === 'none' || !row.style.display;
        row.style.display = isHidden ? 'table-row' : 'none';
        btn.classList.toggle('expanded', isHidden);
        btn.textContent = isHidden ? '▼' : '▶';
      });
    });

    // Expand All / Collapse All toggle button
    const btnToggleAll = container.querySelector('#btnToggleAllMonths');
    if (btnToggleAll) {
      let isAllExpanded = false;
      btnToggleAll.addEventListener('click', () => {
        isAllExpanded = !isAllExpanded;
        container.querySelectorAll('.exp-breakdown-row').forEach(row => {
          row.style.display = isAllExpanded ? 'table-row' : 'none';
        });
        container.querySelectorAll('.btn-expand-row').forEach(btn => {
          btn.classList.toggle('expanded', isAllExpanded);
          btn.textContent = isAllExpanded ? '▼' : '▶';
        });
        btnToggleAll.textContent = isAllExpanded ? '▼ Collapse All' : '▶ Expand All';
      });
    }

    const openLauncher = () => {
      this.showExpenseLauncherModal(yearId, entity, dept, locations, donors, activities, conditionAreas);
    };

    const openTravelWizard = () => {
      this.showTravelPackageWizard(yearId, entity, dept, locations, donors, activities, conditionAreas);
    };

    const btnQuickNew = container.querySelector('#btnQuickNewExpense');
    if (btnQuickNew) btnQuickNew.addEventListener('click', openLauncher);

    const btnNewTravel = container.querySelector('#btnNewTravelPkg');
    if (btnNewTravel) btnNewTravel.addEventListener('click', openTravelWizard);

    const btnHeaderNewTrip = container.querySelector('#btnHeaderNewTrip');
    if (btnHeaderNewTrip) btnHeaderNewTrip.addEventListener('click', openTravelWizard);

    const btnEmptyNewTrip = container.querySelector('#btnEmptyNewTrip');
    if (btnEmptyNewTrip) btnEmptyNewTrip.addEventListener('click', openTravelWizard);
  },

  renderOtherCostSubTabContent(subTab, nonPayrollCoa, allRecords, travelRecords, suppliesRecords, commRecords, officeRecords, profRecords, otherRecords, yearId, entity, dept, budgetYear, rate, isLocked = false, hasTotLines = false) {
    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // ─── 1. ALL ACCOUNTS OVERVIEW (Always Shows All COA Lines, Read-only Rollup) ───
    if (subTab === 'grid' || subTab === 'all') {
      const matchedRecordIds = new Set();

      const coaRows = nonPayrollCoa.map(account => {
        const accGlClean = cleanStr(account.glDescription);
        const accLedgerClean = cleanStr(account.ledgerCode);
        const accParentClean = cleanStr(account.parentAccount);

        const matchingItems = allRecords.filter((r) => {
          const rLedger = cleanStr(r.ledgerCode);
          const rGl = cleanStr(r.glDescription);
          const rParent = cleanStr(r.parentAccount);

          const isMatch = (rLedger && accLedgerClean && rLedger === accLedgerClean) ||
                          (rGl && accGlClean && (rGl === accGlClean || rGl.includes(accGlClean) || accGlClean.includes(rGl))) ||
                          (rParent && accParentClean && rParent === accParentClean && rGl === accGlClean);

          if (isMatch && r.id) matchedRecordIds.add(r.id);
          return isMatch;
        });

        const months = Array(12).fill(0);
        let totalCY = 0;
        matchingItems.forEach(item => {
          if (item.monthlyValues) {
            Object.entries(item.monthlyValues).forEach(([mIdx, val]) => {
              const num = Utils.parseNumber(val) || 0;
              months[mIdx] += num;
              totalCY += num;
            });
          }
        });

        const basisList = matchingItems.map(m => m.basisOfExpense).filter(Boolean);
        const remarksList = matchingItems.map(m => m.remarks).filter(Boolean);
        const categoryKey = this.getOtherCostCategory(account);

        return {
          parentAccount: account.parentAccount || 'Other Expenses',
          glDescription: account.glDescription,
          ledgerCode: account.ledgerCode,
          categoryKey,
          isTravel: categoryKey === 'travel',
          itemCount: matchingItems.length,
          basisOfExpense: basisList.join('; '),
          remarks: remarksList.join('; '),
          monthlyValues: months,
          totalCY,
          items: matchingItems
        };
      });

      // Also append custom non-COA entries
      const customItems = allRecords.filter(r => r.id && !matchedRecordIds.has(r.id));
      customItems.forEach(item => {
        const months = Array(12).fill(0);
        let totalCY = 0;
        if (item.monthlyValues) {
          Object.entries(item.monthlyValues).forEach(([mIdx, val]) => {
            const num = Utils.parseNumber(val) || 0;
            months[mIdx] += num;
            totalCY += num;
          });
        }
        const categoryKey = this.getOtherCostCategory(item);
        coaRows.push({
          parentAccount: item.parentAccount || 'Custom Expenses',
          glDescription: item.glDescription || item.itemName || 'Custom Item',
          ledgerCode: item.ledgerCode || '93999',
          categoryKey,
          isTravel: categoryKey === 'travel',
          itemCount: 1,
          basisOfExpense: item.basisOfExpense || '',
          remarks: item.remarks || '',
          monthlyValues: months,
          totalCY,
          items: [item]
        });
      });

      const totalRollupCost = coaRows.reduce((sum, r) => sum + r.totalCY, 0);
      const colMonthlySums = Array(12).fill(0);
      coaRows.forEach(r => {
        r.monthlyValues.forEach((v, idx) => { colMonthlySums[idx] += v; });
      });

      const catBadges = {
        travel: { label: '✈️ Travel & Lodging', cls: 'badge-cyan' },
        supplies: { label: '🖨️ Supplies/Print', cls: 'badge-primary' },
        communication: { label: '📡 Communication', cls: 'badge-info' },
        office: { label: '🏢 Office', cls: 'badge-warning' },
        professional: { label: '💼 Professional', cls: 'badge-emerald' },
        other: { label: '📑 Other OpEx', cls: 'badge-subtle' }
      };

      return `
        <div class="card mb-lg">
          <div class="card-header flex justify-between items-center">
            <div>
              <div class="card-title">All Other Costs — Chart of Accounts Overview</div>
              <div class="card-subtitle">Showing all standard general ledger account lines &bull; Values auto-rollup from category entries & travel packages</div>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}" id="allAccountsTable">
              <thead>
                <tr>
                  <th class="sticky-col-1">Parent Account</th>
                  <th class="sticky-col-2">GL Account Description</th>
                  <th>Ledger Code</th>
                  <th>Category</th>
                  <th>Entries</th>
                  <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                  ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
                  <th class="num font-bold">Total USD</th>
                </tr>
              </thead>
              <tbody>
                ${coaRows.map((r, idx) => {
                  const badge = catBadges[r.categoryKey] || catBadges.other;
                  return `
                    <tr class="coa-summary-row ${r.totalCY > 0 ? 'has-budget' : ''}">
                      <td class="sticky-col-1 font-bold"><strong>${r.parentAccount}</strong></td>
                      <td class="sticky-col-2">${r.glDescription}</td>
                      <td><code>${r.ledgerCode}</code></td>
                      <td><span class="badge ${badge.cls}" style="font-size: 11px;">${badge.label}</span></td>
                      <td>
                        ${r.itemCount > 0 ? `<span class="badge badge-primary font-bold" style="font-size: 11px;">${r.itemCount} item${r.itemCount > 1 ? 's' : ''}</span>` : `<span class="text-tertiary" style="font-size: 11px;">0 items</span>`}
                      </td>
                      <td class="num font-bold field-total-cy" style="color: ${r.totalCY > 0 ? 'var(--accent-primary)' : 'inherit'};">${Utils.formatCurrency(r.totalCY, entity.currency)}</td>
                      ${SEED_DATA.months.map((m, mIdx) => `
                        <td class="num month-col font-mono" style="${r.monthlyValues[mIdx] > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatNumber(r.monthlyValues[mIdx])}</td>
                      `).join('')}
                      <td class="num font-bold" style="color: var(--accent-secondary); font-size: 12px;">≈ ${Utils.formatCurrency(Utils.convertToUSD(r.totalCY, rate), 'USD')}</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total-row">
                  <td class="sticky-col-1 font-bold">TOTAL OTHER COSTS:</td>
                  <td class="sticky-col-2 font-bold text-right" style="padding-right: 16px;">(${entity.currency})</td>
                  <td colspan="3"></td>
                  <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatCurrency(totalRollupCost, entity.currency)}</td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx])}</td>
                  `).join('')}
                  <td class="num font-bold" style="color: var(--accent-secondary); font-size: 1.05rem;">≈ ${Utils.formatCurrency(Utils.convertToUSD(totalRollupCost, rate), 'USD')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // ─── 2. TRAVEL & LODGING PACKAGES SUBTAB ───
    if (subTab === 'travel' || subTab === 'travel-packages') {
      const totalTravelCost = travelRecords.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);
      return `
        <div class="card mb-lg">
          <div class="card-header flex justify-between items-center" style="flex-wrap: wrap; gap: 10px;">
            <div>
              <div class="card-title">Employee Travel & Lodging Packages (${travelRecords.length})</div>
              <div class="card-subtitle">Showing single-line summaries &bull; Click <strong>▶</strong> to expand 12-month budget & location benchmark breakdown</div>
            </div>
            <div class="flex items-center gap-sm">
              ${hasTotLines ? `
                <div class="flex items-center gap-xs" style="background: var(--bg-primary); padding: 3px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-default); margin-right: 4px;">
                  <span class="text-secondary font-bold" style="font-size: 11px; padding: 0 4px;">ToT Costs:</span>
                  <button type="button" class="btn btn-sm ${this.totFilterMode !== 'without-tot' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="BudgetEntryModule.setTotFilterMode('with-tot')" style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-xs);">
                    🎯 With ToT
                  </button>
                  <button type="button" class="btn btn-sm ${this.totFilterMode === 'without-tot' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="BudgetEntryModule.setTotFilterMode('without-tot')" style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-xs);">
                    🚫 Without ToT
                  </button>
                </div>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm" id="btnToggleAllMonths" title="Expand / Collapse all monthly schedules">▶ Expand All</button>
              ${isLocked ? '' : `
                <button class="btn btn-primary btn-sm" id="btnHeaderNewTrip">
                  + Add Trip Package
                </button>
              `}
            </div>
          </div>

          ${travelRecords.length === 0 ? `
            <div class="p-xl text-center text-muted">
              <div style="font-size: 2.2rem; margin-bottom: 8px;">✈️</div>
              <h4>No Travel Packages Created Yet</h4>
              <p class="mt-xs">Budget trips with automated benchmark rates for Hotel, Food, Cab, Airfare, and Train.</p>
              ${isLocked ? '' : `
                <button class="btn btn-primary mt-md" id="btnEmptyNewTrip">
                  ✈️ Create First Travel Package
                </button>
              `}
            </div>
          ` : `
            <div class="table-container">
              <table class="data-table" id="travelPackagesTable">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">Expand</th>
                    <th class="sticky-col-1">Employee Name</th>
                    <th class="sticky-col-2">Trip Purpose & Destination</th>
                    <th>Category</th>
                    <th>Activity</th>
                    <th>Donor</th>
                    <th>Remarks / Justification</th>
                    <th class="num font-bold">Total Budget (${entity.currency})</th>
                    <th class="num font-bold">Total USD</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${travelRecords.map(pkg => {
                    const isTot = pkg.isImpTot;
                    const rowId = pkg.id || (pkg.impTotEventId ? `tot-${pkg.impTotEventId}` : `item-${Math.random()}`);
                    return `
                    <!-- Single-Line Main Row -->
                    <tr class="exp-item-main-row" data-row-id="${rowId}">
                      <td style="text-align: center; width: 40px;">
                        <button type="button" class="btn-expand-row" data-target="breakdown-travel-${rowId}" title="Click to expand/collapse monthly budget">▶</button>
                      </td>
                      <td class="sticky-col-1 font-bold">
                        👤 ${pkg.employeeName || (isTot ? 'Implementation Team' : 'Staff')}
                      </td>
                      <td class="sticky-col-2">
                        <div class="flex items-center gap-xs">
                          <strong>${pkg.travelDetails || pkg.itemName || pkg.glDescription || 'Trip'}</strong>
                          ${isTot ? `<span class="badge badge-purple font-bold" style="font-size: 10px; padding: 1px 6px;">🎯 ToT Event</span>` : ''}
                        </div>
                        <div class="text-tertiary" style="font-size: 11px;">📍 ${pkg.destinationLocation || pkg.location || ''}</div>
                      </td>
                      <td>
                        <span class="badge ${isTot ? 'badge-purple' : (pkg.travelCategory === 'City' ? 'badge-cyan' : 'badge-subtle')}" style="font-size: 11px;">
                          ${isTot ? '🎯 ToT Training' : (pkg.travelCategory === 'City' ? '🏙️ City' : '🌾 Non-City')}
                        </span>
                      </td>
                      <td style="font-size: 11px;">${pkg.activity || '—'}</td>
                      <td style="font-size: 11px;">${pkg.donor || '—'}</td>
                      <td class="remarks-cell" style="font-size: 11px; width: 180px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);" title="${Utils.escapeHtml(pkg.remarks || pkg.travelDetails || pkg.basisOfExpense || '')}">
                        ${pkg.remarks || pkg.travelDetails || pkg.basisOfExpense || '—'}
                      </td>
                      <td class="num font-bold" style="color: var(--accent-primary); font-size: 13px;">${Utils.formatCurrency(pkg.totalCY || 0, entity.currency)}</td>
                      <td class="num font-bold" style="color: var(--accent-secondary); font-size: 13px;">≈ ${Utils.formatCurrency(Utils.convertToUSD(pkg.totalCY || 0, rate), 'USD')}</td>
                      <td style="white-space: nowrap;">
                        ${isLocked ? '<span class="badge badge-subtle" style="font-size: 11px;">🔒 Read-only</span>' : (
                          isTot ? `
                            <button class="btn btn-ghost btn-sm font-bold" style="color: var(--accent-primary);" onclick="BudgetEntryModule.activeOtherCostSubTab = 'tot'; BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);">🎯 View in ToT</button>
                          ` : `
                            <button class="btn btn-ghost btn-sm" onclick="BudgetEntryModule.editTravelPackage(${pkg.id})">✏️ Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="BudgetEntryModule.deleteTravelPackage(${pkg.id})">🗑️</button>
                          `
                        )}
                      </td>
                    </tr>

                    <!-- Expandable Monthly Schedule Sub-Row -->
                    <tr class="exp-breakdown-row" id="breakdown-travel-${rowId}" style="display: none;">
                      <td colspan="10">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                          <div class="flex justify-between items-center">
                            <div class="flex items-center gap-sm">
                              <span class="badge badge-primary font-bold" style="font-size: 11px;">12-Month Travel Budget Breakdown</span>
                              <span class="text-secondary font-bold" style="font-size: 12px;">${pkg.travelDetails || pkg.itemName || 'Trip'} (📍 ${pkg.destinationLocation || pkg.location || 'Destination'})</span>
                            </div>
                            <div class="text-tertiary font-mono" style="font-size: 11px;">
                              ${pkg.basisOfExpense || 'Calculated with Benchmark Travel Rates'}
                            </div>
                          </div>

                          <table class="mini-month-grid">
                            <thead>
                              <tr>
                                <th style="width: 120px; text-align: left; padding-left: 10px;">Metric</th>
                                ${SEED_DATA.months.map(m => `<th>${m}</th>`).join('')}
                                <th style="font-weight: 700; color: var(--accent-secondary);">Total (${entity.currency})</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style="font-weight: 600; text-align: left; padding-left: 10px; color: var(--text-secondary);">Monthly Cost</td>
                                ${SEED_DATA.months.map((m, mIdx) => `
                                  <td style="${pkg.monthlyValues?.[mIdx] > 0 ? 'font-weight: 600; color: var(--text-primary);' : 'color: var(--text-tertiary);'}">
                                    ${pkg.monthlyValues?.[mIdx] > 0 ? Utils.formatNumber(pkg.monthlyValues[mIdx]) : '-'}
                                  </td>
                                `).join('')}
                                <td class="font-bold font-mono" style="color: var(--accent-secondary); font-size: 13px;">${Utils.formatCurrency(pkg.totalCY || 0, entity.currency)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                    `;
                  }).join('')}
                  <tr class="total-row">
                    <td colspan="2" class="sticky-col-1 font-bold">TOTAL TRAVEL BUDGET:</td>
                    <td class="sticky-col-2 font-bold text-right" style="padding-right: 16px;">(${entity.currency})</td>
                    <td colspan="4"></td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatCurrency(totalTravelCost, entity.currency)}</td>
                    <td class="num font-bold" style="color: var(--accent-secondary); font-size: 1.05rem;">≈ ${Utils.formatCurrency(Utils.convertToUSD(totalTravelCost, rate), 'USD')}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    }

    // ─── 3. CATEGORY SUB-TABS: Supplies, Communication, Office, Professional, Other ───
    const catMeta = {
      supplies: { title: 'Supplies & Printing Costs', icon: '🖨️', records: suppliesRecords },
      communication: { title: 'Communication Expenses', icon: '📡', records: commRecords },
      office: { title: 'Office Expenses', icon: '🏢', records: officeRecords },
      professional: { title: 'Professional & Consultancy Charges', icon: '💼', records: profRecords },
      other: { title: 'Other Operating Expenses', icon: '📑', records: otherRecords }
    }[subTab] || { title: 'Other Expenses', icon: '📑', records: otherRecords };

    const catRecords = catMeta.records;
    const catTotal = catRecords.reduce((sum, r) => sum + (Utils.parseNumber(r.totalCY) || 0), 0);

    return `
      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="card-title">${catMeta.icon} ${catMeta.title} (${catRecords.length} Items)</div>
            <div class="card-subtitle">Showing single-line summaries &bull; Click <strong>▶</strong> on any line to expand 12-month schedule & calculation basis</div>
          </div>
          <div class="flex items-center gap-sm">
            ${hasTotLines ? `
              <div class="flex items-center gap-xs" style="background: var(--bg-primary); padding: 3px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-default); margin-right: 4px;">
                <span class="text-secondary font-bold" style="font-size: 11px; padding: 0 4px;">ToT Costs:</span>
                <button type="button" class="btn btn-sm ${this.totFilterMode !== 'without-tot' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="BudgetEntryModule.setTotFilterMode('with-tot')" style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-xs);">
                  🎯 With ToT
                </button>
                <button type="button" class="btn btn-sm ${this.totFilterMode === 'without-tot' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="BudgetEntryModule.setTotFilterMode('without-tot')" style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-xs);">
                  🚫 Without ToT
                </button>
              </div>
            ` : ''}
            <button type="button" class="btn btn-secondary btn-sm" id="btnToggleAllMonths" title="Expand / Collapse all monthly schedules">▶ Expand All</button>
            ${isLocked ? '' : `
              <button class="btn btn-primary btn-sm" onclick="BudgetEntryModule.showExpenseInputWizard('${subTab}')">
                + Add ${catMeta.title.replace('Expenses', '').replace('Costs', '').trim()} Item
              </button>
            `}
          </div>
        </div>

        ${catRecords.length === 0 ? `
          <div class="p-xl text-center text-muted">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">${catMeta.icon}</div>
            <h4>No ${catMeta.title} Budgeted Yet</h4>
            <p class="mt-xs">Add structured line items with employee ownership, unit rates, and amount justifications.</p>
            ${isLocked ? '' : `
              <button class="btn btn-primary mt-md" onclick="BudgetEntryModule.showExpenseInputWizard('${subTab}')">
                ➕ Add First Item
              </button>
            `}
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table" id="categoryExpensesTable">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">Expand</th>
                  <th class="sticky-col-1">Employee Name</th>
                  <th class="sticky-col-2">Item / Specific Purpose</th>
                  <th>GL Line & Code</th>
                  <th>Activity</th>
                  <th>Location</th>
                  <th>Donor</th>
                  <th>Condition Area</th>
                  <th style="width: 180px; max-width: 180px; min-width: 130px;">Remarks (Justification)</th>
                  <th class="num font-bold">Total Budget (${entity.currency})</th>
                  <th class="num font-bold">Total USD</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${catRecords.map(r => {
                  const isTot = r.isImpTot;
                  const rowId = r.id || (r.impTotEventId ? `tot-${r.impTotEventId}` : `item-${Math.random()}`);
                  return `
                  <!-- Single-Line Main Row -->
                  <tr class="exp-item-main-row" data-row-id="${rowId}">
                    <td style="text-align: center; width: 40px;">
                      <button type="button" class="btn-expand-row" data-target="breakdown-${rowId}" title="Click to view 12-month budget schedule">▶</button>
                    </td>
                    <td class="sticky-col-1 font-bold">
                      👤 ${r.employeeName || (isTot ? 'Implementation Team' : 'Staff Member')}
                    </td>
                    <td class="sticky-col-2">
                      <div class="flex items-center gap-xs">
                        <strong>${r.itemName || r.glDescription || 'Item'}</strong>
                        ${isTot ? `<span class="badge badge-purple font-bold" style="font-size: 10px; padding: 1px 6px;">🎯 ToT Event</span>` : ''}
                      </div>
                      ${r.subGroup ? `<div class="text-tertiary" style="font-size: 10px;">${r.subGroup}</div>` : ''}
                    </td>
                    <td>
                      <div style="font-weight: 600;">${r.glDescription || ''}</div>
                      <code style="font-size: 11px;">${r.ledgerCode || ''}</code>
                    </td>
                    <td style="font-size: 11px;">${r.activity || '—'}</td>
                    <td style="font-size: 11px;">${r.location || '—'}</td>
                    <td style="font-size: 11px;">${r.donor || '—'}</td>
                    <td style="font-size: 11px;">${r.conditionArea || '—'}</td>
                    <td class="remarks-cell" style="font-size: 11px; width: 180px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);" title="${Utils.escapeHtml(r.remarks || '')}">
                      ${r.remarks || '—'}
                    </td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 13px;">${Utils.formatCurrency(r.totalCY || 0, entity.currency)}</td>
                    <td class="num font-bold" style="color: var(--accent-secondary); font-size: 13px;">≈ ${Utils.formatCurrency(Utils.convertToUSD(r.totalCY || 0, rate), 'USD')}</td>
                    <td style="white-space: nowrap;">
                      ${isLocked ? '<span class="badge badge-subtle" style="font-size: 11px;">🔒 Read-only</span>' : (
                        isTot ? `
                          <button class="btn btn-ghost btn-sm font-bold" style="color: var(--accent-primary);" onclick="BudgetEntryModule.activeOtherCostSubTab = 'tot'; BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);">🎯 View in ToT</button>
                        ` : `
                          <button class="btn btn-ghost btn-sm" onclick="BudgetEntryModule.editExpenseItem(${r.id})">✏️ Edit</button>
                          <button class="btn btn-danger btn-sm" onclick="BudgetEntryModule.deleteExpenseItem(${r.id})">🗑️</button>
                        `
                      )}
                    </td>
                  </tr>

                  <!-- Expandable 12-Month Breakdown Sub-Row -->
                  <tr class="exp-breakdown-row" id="breakdown-${rowId}" style="display: none;">
                    <td colspan="12">
                      <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-sm">
                            <span class="badge badge-primary font-bold" style="font-size: 11px;">12-Month Schedule Breakdown</span>
                            <span class="text-secondary font-bold" style="font-size: 12px;">${r.itemName || r.glDescription}</span>
                            ${r.calcMode === 'unit' ? `<span class="badge badge-subtle" style="font-size: 11px;">🔢 ${r.unitName || 'Units'} @ ${Utils.formatCurrency(r.unitRate || 0, entity.currency)}</span>` : ''}
                            ${isTot ? `<span class="badge badge-purple font-bold" style="font-size: 10px;">🎯 ToT Event Line</span>` : ''}
                          </div>
                          <div class="text-tertiary font-mono" style="font-size: 11px;">
                            ${r.basisOfExpense || 'Manual Entry'}
                          </div>
                        </div>

                        <table class="mini-month-grid">
                          <thead>
                            <tr>
                              <th style="width: 120px; text-align: left; padding-left: 10px;">Metric</th>
                              ${SEED_DATA.months.map(m => `<th>${m}</th>`).join('')}
                              <th style="font-weight: 700; color: var(--accent-secondary);">Total (${entity.currency})</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${r.calcMode === 'unit' ? `
                              <tr>
                                <td style="font-weight: 600; text-align: left; padding-left: 10px; color: var(--text-secondary);">Units Count</td>
                                ${SEED_DATA.months.map((m, mIdx) => `
                                  <td style="${r.monthlyUnits?.[mIdx] > 0 ? 'font-weight: 600; color: var(--text-primary);' : 'color: var(--text-tertiary);'}">
                                    ${r.monthlyUnits?.[mIdx] > 0 ? Utils.formatNumber(r.monthlyUnits[mIdx]) : '-'}
                                  </td>
                                `).join('')}
                                <td class="font-bold font-mono" style="color: var(--accent-primary);">${Utils.formatNumber(Object.values(r.monthlyUnits || {}).reduce((s, v) => s + (Utils.parseNumber(v) || 0), 0))}</td>
                              </tr>
                            ` : ''}
                            <tr>
                              <td style="font-weight: 600; text-align: left; padding-left: 10px; color: var(--text-secondary);">Monthly Cost</td>
                              ${SEED_DATA.months.map((m, mIdx) => `
                                <td style="${r.monthlyValues?.[mIdx] > 0 ? 'font-weight: 600; color: var(--text-primary);' : 'color: var(--text-tertiary);'}">
                                  ${r.monthlyValues?.[mIdx] > 0 ? Utils.formatNumber(r.monthlyValues[mIdx]) : '-'}
                                </td>
                              `).join('')}
                              <td class="font-bold font-mono" style="color: var(--accent-secondary); font-size: 13px;">${Utils.formatCurrency(r.totalCY || 0, entity.currency)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                  `;
                }).join('')}
                <tr class="total-row">
                  <td colspan="2" class="sticky-col-1 font-bold">TOTAL ${catMeta.title.toUpperCase()}:</td>
                  <td class="sticky-col-2 font-bold text-right" style="padding-right: 16px;">(${entity.currency})</td>
                  <td colspan="6"></td>
                  <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatCurrency(catTotal, entity.currency)}</td>
                  <td class="num font-bold" style="color: var(--accent-secondary); font-size: 1.05rem;">≈ ${Utils.formatCurrency(Utils.convertToUSD(catTotal, rate), 'USD')}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  // ─── Quick Expense Launcher Modal ───
  async showExpenseLauncherModal(yearId, entity, dept, locations, donors, activities, conditionAreas) {
    const yId = yearId || this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yId)) {
      Utils.showToast(`🔒 Expense additions are disabled: Budget year status is "${Auth.getYearStatusLabel(yId)}". Only Draft or Active statuses permit additions.`, 'warning');
      return;
    }

    const content = `
      <div style="font-size: var(--font-size-sm); padding: 8px 4px;">
        <p class="text-secondary mb-lg" style="font-size: 13px;">Select an expense category below to open its full-screen structured input format with employee assignment, 12-month calculation schedule, and justification remarks.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
          <!-- 1. Travel & Lodging -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showTravelPackageWizard('${yearId}', BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._locations, BudgetEntryModule._donors, BudgetEntryModule._activities, BudgetEntryModule._conditionAreas);">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">✈️</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Travel &amp; Lodging</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Hotel, Food, Cab, Airfare, and Train benchmark trips.</p>
          </div>

          <!-- 2. Supplies & Printing -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showExpenseInputWizard('supplies');">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">🖨️</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Supplies &amp; Printing</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Training kits, booklets, banners, leaflets, and project supplies.</p>
          </div>

          <!-- 3. Communication Cost -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showExpenseInputWizard('communication');">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">📡</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Communication</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Broadband internet, courier/postage, mobile SIMs, and messaging.</p>
          </div>

          <!-- 4. Office Expenses -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showExpenseInputWizard('office');">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">🏢</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Office Expenses</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Software licenses, stationery, equipment maintenance, and facility.</p>
          </div>

          <!-- 5. Professional & Consultancy -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showExpenseInputWizard('professional');">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">💼</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Professional &amp; Consulting</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Admin advisors, legal/audit, translators, and creative design.</p>
          </div>

          <!-- 6. Custom / Other -->
          <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.showExpenseInputWizard('other');">
            <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">📑</div>
            <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">Other Expense Lines</h3>
            <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Any other general or custom non-payroll operating line items.</p>
          </div>

          ${(typeof ImpTotModule !== 'undefined' && ImpTotModule.isImpDept(dept)) ? `
            <!-- 7. 🎯 ToT Program Budget / Training Package -->
            <div class="card p-lg cursor-pointer hover-card" style="border: 1px solid var(--border-default); background: var(--bg-card); display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 185px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm);" onclick="Utils.closeModal(); BudgetEntryModule.activeTab = 'other-costs'; BudgetEntryModule.activeOtherCostSubTab = 'tot'; BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);">
              <div style="font-size: 2.8rem; margin-bottom: 10px; line-height: 1;">🎯</div>
              <h3 style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px; font-size: 1.05rem;">ToT Program Matrix</h3>
              <p class="text-secondary" style="font-size: 11.5px; line-height: 1.4; margin: 0;">Annual Batch Matrix Planner for State ToTs, Refresher, MO Trainings.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    Utils.showModal('➕ Add New Expense Item', content, {
      size: 'lg',
      modalWidth: '880px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Close (Esc)', onClick: close }));
      }
    });
  },
  // ─── Universal Multi-Line Structured Expense Input Wizard ───
  async showExpenseInputWizard(categoryKey = 'supplies', existingRecord = null, defaultCoa = null) {
    const isEdit = !!existingRecord;
    const yearId = this._yearId || App.selectedYear || '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      Utils.showToast(`🔒 ${isEdit ? 'Editing' : 'Additions'} disabled: Budget year status is "${Auth.getYearStatusLabel(yearId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    const entity = this._entity;
    const dept = this._dept;
    const isImpDept = typeof ImpTotModule !== 'undefined' && ImpTotModule.isImpDept(dept);
    const locations = this._locations || await db.getLocationsForEntity(entity.id);
    const donors = this._donors || await db.getDonorsForEntity(entity.id);
    const activities = this._activities || await db.getAll(STORES.activities);
    const conditionAreas = this._conditionAreas || await db.getAll(STORES.conditionAreas);

    const allMasterEmployees = await db.getEmployeesMaster(entity.id);
    const personnel = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);
    const initialEmp = existingRecord?.employeeName || '';
    const empOptionsHtml = Utils.buildEmployeeSelectOptionsHtml({
      allEmployees: allMasterEmployees,
      currentDept: dept,
      currentPersonnel: personnel,
      selectedName: initialEmp,
      placeholder: '👤 Staff (General / Non-Specific)',
      allowCustom: true,
      customLabel: '✏️ Custom Name...'
    });

    const coaRaw = await db.getAll(STORES.chartOfAccounts);
    // Filter strictly to Other Costs operating accounts (exclude payroll, benefits, EHA consultants, and fixed assets)
    const coaAll = coaRaw.filter(c => !this.isExcludedFromOtherCosts(c));

    const titles = {
      supplies: { title: 'Supplies & Printing Costs', defaultParent: 'Supplies & Printing Costs', defaultGl: 'Printing expenses', defaultCode: '93204' },
      communication: { title: 'Communication Cost', defaultParent: 'Communication Cost', defaultGl: 'Telecommunication expenses', defaultCode: '93303' },
      office: { title: 'Office Expenses', defaultParent: 'Office Expenses', defaultGl: 'Software and Subscriptions', defaultCode: '93401' },
      professional: { title: 'Professional & Consultancy Charges', defaultParent: 'Professional & Consultancy Charges', defaultGl: 'Admin Consultants', defaultCode: '93703' },
      other: { title: 'Other Operating Expenses', defaultParent: 'Other Operating Expenses', defaultGl: 'Miscellaneous Expense', defaultCode: '93999' }
    };

    const meta = titles[categoryKey] || titles.other;

    // Group Chart of Accounts by Parent Account for organized dropdown selection
    const coaGroups = {};
    coaAll.forEach(c => {
      const parent = c.parentAccount || 'Other Operating Expenses';
      if (!coaGroups[parent]) coaGroups[parent] = [];
      coaGroups[parent].push(c);
    });

    // Helper to generate grouped COA dropdown options
    const renderCoaOptionsHtml = (selectedCode, selectedGl) => {
      let html = '<option value="">-- Select Chart of Accounts Line --</option>';
      Object.entries(coaGroups).forEach(([parentName, items]) => {
        html += `<optgroup label="${parentName}">`;
        items.forEach(c => {
          const isSel = (selectedCode && c.ledgerCode === selectedCode) || (selectedGl && c.glDescription === selectedGl);
          html += `<option value="${c.ledgerCode}" data-parent="${c.parentAccount}" data-gl="${c.glDescription}" ${isSel ? 'selected' : ''}>${c.glDescription} (${c.ledgerCode})</option>`;
        });
        html += `</optgroup>`;
      });
      html += `<option value="__CUSTOM_COA__" ${selectedCode === '93999' || (!coaAll.some(c => c.ledgerCode === selectedCode) && selectedCode) ? 'selected' : ''}>+ Custom Account Line...</option>`;
      return html;
    };

    // Initialize line items state
    let lineItems = [];
    if (isEdit && existingRecord) {
      lineItems.push({
        id: existingRecord.id,
        parentAccount: existingRecord.parentAccount || meta.defaultParent,
        glDescription: existingRecord.glDescription || meta.defaultGl,
        ledgerCode: existingRecord.ledgerCode || meta.defaultCode,
        itemName: existingRecord.itemName || existingRecord.glDescription || '',
        remarks: existingRecord.remarks || '',
        calcMode: existingRecord.calcMode || 'schedule',
        unitName: existingRecord.unitName || 'Units',
        unitRate: existingRecord.unitRate || 0,
        unitMatrix: existingRecord.unitMatrix || Array(12).fill(0),
        monthlyValues: existingRecord.monthlyValues || {},
        totalCY: Utils.parseNumber(existingRecord.totalCY) || 0,
        isCollapsed: false
      });
    } else {
      const initParent = defaultCoa?.parentAccount || meta.defaultParent;
      const initGl = defaultCoa?.glDescription || meta.defaultGl;
      const initCode = defaultCoa?.ledgerCode || meta.defaultCode;
      lineItems.push({
        parentAccount: initParent,
        glDescription: initGl,
        ledgerCode: initCode,
        itemName: '',
        remarks: '',
        calcMode: 'schedule',
        unitName: 'Units',
        unitRate: 0,
        unitMatrix: Array(12).fill(0),
        monthlyValues: {},
        totalCY: 0,
        isCollapsed: false
      });
    }

    const renderLineItemCardHtml = (item, index) => {
      if (item.isCollapsed) {
        // ─── Single-Line Compact Summary Card (Collapsed Mode) ───
        return `
          <div class="card p-sm exp-line-item-card collapsed-card" data-line-index="${index}" style="background: #f8fafc; border: 1px solid var(--border-default); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-sm" style="overflow: hidden;">
                <span class="badge badge-primary font-bold" style="font-size: 11px; flex-shrink: 0;">Line #${index + 1}</span>
                <strong style="color: var(--text-primary); font-size: 13px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${item.itemName || item.glDescription || 'Line Item'}</strong>
                <span class="text-tertiary font-mono" style="font-size: 11px; flex-shrink: 0;">(${item.glDescription || 'COA'} - ${item.ledgerCode || ''})</span>
                ${item.remarks ? `<span class="text-secondary" style="font-size: 11px; font-style: italic; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">— ${item.remarks}</span>` : ''}
              </div>
              <div class="flex items-center gap-sm" style="flex-shrink: 0;">
                <span class="badge badge-subtle exp-line-total-badge font-bold font-mono" style="font-size: 12px; color: var(--accent-secondary);">Total: ${Utils.formatCurrency(item.totalCY || 0, entity.currency)}</span>
                <button type="button" class="btn btn-secondary btn-sm btn-toggle-expand font-bold" data-index="${index}" style="padding: 4px 10px; font-size: 11px;">✏️ Expand</button>
                ${!isEdit && lineItems.length > 1 ? `
                  <button type="button" class="btn btn-ghost btn-sm text-danger btn-delete-line" data-index="${index}" title="Remove this line item">🗑️</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }

      // ─── Full Interactive Input Editor (Expanded Mode) ───
      return `
        <div class="card p-md exp-line-item-card" data-line-index="${index}" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 8px; margin-bottom: 14px; position: relative;">
          <!-- Line Item Header Bar -->
          <div class="flex justify-between items-center mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div class="flex items-center gap-sm">
              <span class="badge badge-primary font-bold" style="font-size: 11px;">Line Item #${index + 1}</span>
              <strong class="exp-line-header-title" style="color: var(--text-primary); font-size: 13px;">${item.glDescription || 'Expense Line'}</strong>
            </div>
            <div class="flex items-center gap-sm">
              ${!isEdit && lineItems.length > 1 ? `
                <button type="button" class="btn btn-ghost btn-sm text-danger btn-delete-line" data-index="${index}" title="Delete this line">🗑️ Remove</button>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm btn-collapse-line" data-index="${index}" title="Minimize line card">▲ Collapse</button>
            </div>
          </div>

          <!-- Line Item Metadata Grid -->
          <div class="form-row mb-sm" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px;">
            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="font-size: 11px;">GL Account / Ledger Line <span style="color: var(--danger);">*</span></label>
              <select class="form-select exp-coa-select" style="font-size: 12px;">
                ${renderCoaOptionsHtml(item.ledgerCode, item.glDescription)}
              </select>
            </div>
            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="font-size: 11px;">Line Item Name / Specific Details <span style="color: var(--danger);">*</span></label>
              <input type="text" class="form-input exp-item-name" placeholder="e.g. Training Handouts for District Batches" value="${item.itemName || ''}" required style="font-size: 12px;">
            </div>
          </div>

          <!-- Custom COA Input Fields (Visible when custom option selected) -->
          <div class="form-row mb-sm custom-coa-inputs" style="display: ${item.ledgerCode === '93999' && !coaAll.some(c => c.ledgerCode === item.ledgerCode) ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Custom Parent Account</label>
              <input type="text" class="form-input exp-custom-parent" value="${item.parentAccount || meta.defaultParent}" placeholder="e.g. Other Operating Expenses" style="font-size: 12px;">
            </div>
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Custom GL Description</label>
              <input type="text" class="form-input exp-custom-gl" value="${item.glDescription || meta.defaultGl}" placeholder="e.g. Special Project Supplies" style="font-size: 12px;">
            </div>
          </div>

          <!-- Remarks / Justification -->
          <div class="form-group mb-sm">
            <label class="form-label font-bold" style="font-size: 11px;">Remarks for Amount Addition / Justification <span style="color: var(--danger);">*</span></label>
            <input type="text" class="form-input exp-line-remarks" placeholder="Provide justification or basis for budgeting this line item..." value="${item.remarks || ''}" required style="font-size: 12px;">
          </div>

          <!-- Calculation Mode Switcher -->
          <div class="p-xs px-sm mb-sm flex items-center justify-between" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 6px;">
            <span class="font-bold text-secondary" style="font-size: 11px;">Calculation Basis:</span>
            <div class="flex items-center gap-md">
              <label class="flex items-center gap-xs cursor-pointer" style="font-size: 11px;">
                <input type="radio" name="calcMode_${index}" value="schedule" class="exp-calc-mode" ${item.calcMode === 'schedule' ? 'checked' : ''}>
                <span>📅 Direct Monthly Amount (${entity.currency}/Month)</span>
              </label>
              <label class="flex items-center gap-xs cursor-pointer" style="font-size: 11px;">
                <input type="radio" name="calcMode_${index}" value="unit" class="exp-calc-mode" ${item.calcMode === 'unit' ? 'checked' : ''}>
                <span>🔢 Unit Rate &times; Monthly Quantity</span>
              </label>
            </div>
          </div>

          <!-- Unit Rate Config Row (Visible when unit mode selected) -->
          <div class="form-row mb-sm unit-rate-config-row" style="display: ${item.calcMode === 'unit' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 12px; background: #faf5ff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e9d5ff;">
            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="font-size: 11px; color: #7e22ce;">Unit Name / Metric</label>
              <input type="text" class="form-input exp-unit-name" value="${item.unitName || 'Units'}" placeholder="e.g. Kits, Licenses, Packages" style="font-size: 12px;">
            </div>
            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="font-size: 11px; color: #7e22ce;">Unit Rate (${entity.currency})</label>
              <input type="number" class="form-input exp-unit-rate" value="${item.unitRate || 0}" min="0" step="any" placeholder="0" style="font-size: 12px; font-weight: 700;">
            </div>
          </div>

          <!-- 12-Month Grid Table -->
          <div class="table-container mb-xs" style="max-height: 220px;">
            <table class="data-table" style="font-size: 11.5px;">
              <thead>
                <tr>
                  <th style="min-width: 140px;" class="exp-table-metric-th">${item.calcMode === 'unit' ? `Monthly Qty (${item.unitName || 'Units'})` : `Monthly Amount (${entity.currency})`}</th>
                  ${SEED_DATA.months.map(m => `<th class="text-center" style="min-width: 50px; padding: 4px;">${m}</th>`).join('')}
                  <th class="num font-bold" style="min-width: 90px;">Total Units</th>
                  <th class="num font-bold" style="min-width: 100px;">Total (${entity.currency})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-bold text-secondary exp-table-row-label">${item.calcMode === 'unit' ? 'Monthly Qty' : 'Amount'}</td>
                  ${SEED_DATA.months.map((m, mIdx) => `
                    <td class="editable" style="padding: 2px;">
                      <input type="number" class="form-input text-right font-mono exp-month-input" data-month="${mIdx}" value="${item.calcMode === 'unit' ? (item.unitMatrix?.[mIdx] || 0) : (item.monthlyValues?.[mIdx] || 0)}" min="0" step="any" style="padding: 3px 4px; font-size: 11px; height: 26px;">
                    </td>
                  `).join('')}
                  <td class="num font-mono font-bold exp-row-total-units" style="font-size: 12px;">0</td>
                  <td class="num font-mono font-bold exp-row-total-cost" style="color: var(--accent-primary); font-size: 13px;">${Utils.formatCurrency(0, entity.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    const content = `
      <div id="expenseInputWizardModal" style="font-size: var(--font-size-sm);">
        ${isImpDept ? `
          <!-- Helpful hint for Implementation department planners -->
          <div class="p-sm px-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 8px;">
            <div class="flex items-center gap-sm">
              <div style="font-size: 1.4rem;">🎯</div>
              <div>
                <strong style="color: #0284c7; font-size: 12px;">Implementation Department Note:</strong>
                <span class="text-secondary" style="font-size: 11.5px;">Planning training packages (ToTs, Kits, Models, Banners, Venues, or Supervision)?</span>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="Utils.closeModal(); BudgetEntryModule.activeTab = 'other-costs'; BudgetEntryModule.activeOtherCostSubTab = 'tot'; BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);" style="background: linear-gradient(135deg, #0284c7, #6366f1); font-size: 11px; padding: 4px 10px; font-weight: 700;">
              🎯 Open Annual Matrix Planner
            </button>
          </div>
        ` : ''}

        <!-- Step 1: Employee & Shared 5-Dimensional Budget Tagging Header -->
        <div class="card p-md" style="background: var(--bg-tertiary); border-color: var(--border-default);">
          <div style="display: grid; grid-template-columns: 1.2fr repeat(4, 1fr); gap: 14px;" class="items-end">
            <!-- Employee Selection -->
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 12px;">Responsible Employee / Requestor</label>
              <select class="form-select" id="expEmployeeSelect" style="font-size: 12px; padding: 6px 8px;">
                ${empOptionsHtml}
              </select>
              <input type="text" class="form-input mt-xs" id="expCustomEmployeeInput" placeholder="Enter Full Name" value="${initialEmp && !allMasterEmployees.some(e => e.name === initialEmp) ? initialEmp : ''}" style="display: ${initialEmp && !allMasterEmployees.some(e => e.name === initialEmp) ? 'block' : 'none'}; font-size: 12px;">
            </div>

            <!-- 5-Dimensional Tagging (Shared across all line items) -->
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px; margin-bottom: 2px;">Activity (Tag)</label>
              <select class="form-select" id="expActivitySelect" style="font-size: 11px; padding: 6px 8px;">
                ${activities.map(a => `<option value="${a.name}" ${existingRecord?.activity === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px; margin-bottom: 2px;">Charging Location (Tag)</label>
              <select class="form-select" id="expLocationSelect" style="font-size: 11px; padding: 6px 8px;">
                ${locations.map(l => `<option value="${l.name}" ${existingRecord?.location === l.name ? 'selected' : ''}>${l.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px; margin-bottom: 2px;">Donor (Tag)</label>
              <select class="form-select" id="expDonorSelect" style="font-size: 11px; padding: 6px 8px;">
                ${donors.map(d => `<option value="${d.name}" ${existingRecord?.donor === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px; margin-bottom: 2px;">Condition Area (Tag)</label>
              <select class="form-select" id="expConditionSelect" style="font-size: 11px; padding: 6px 8px;">
                ${conditionAreas.map(c => `<option value="${c.name}" ${existingRecord?.conditionArea === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: Multi-Line Expense Items Container -->
        <div>
          <div class="flex justify-between items-center mb-sm">
            <div>
              <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0;">📋 Budget Expense Line Items</h3>
              <div class="text-tertiary" style="font-size: 11px;">Completed lines reduce to a single line summary &bull; Click <strong>✏️ Expand</strong> to view or edit monthly amounts</div>
            </div>
            ${!isEdit ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="btnAddAnotherLineBtn" style="border-color: var(--accent-primary); color: var(--accent-primary);">
                + Add Another Line Item
              </button>
            ` : ''}
          </div>

          <div id="expenseLineItemsContainer">
            ${lineItems.map((item, idx) => renderLineItemCardHtml(item, idx)).join('')}
          </div>

          ${!isEdit ? `
            <div class="text-center mt-xs mb-sm">
              <button type="button" class="btn btn-ghost btn-sm font-bold" id="btnAddAnotherLineBtnFooter" style="color: var(--accent-primary);">
                + Add Another Line Item (Same 5D Tagging)
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Live Summary Callout Banner -->
        <div class="card p-md flex items-center justify-between" style="background: rgba(139, 92, 246, 0.06); border-color: rgba(139, 92, 246, 0.3);">
          <div class="flex items-center gap-md">
            <div style="font-size: 2rem;">💡</div>
            <div>
              <span class="text-tertiary" style="font-size: 11px; text-transform: uppercase;">COMBINED SUBMISSION BUDGET:</span>
              <div class="flex items-center gap-sm">
                <strong id="expLiveGrandLocal" style="color: var(--accent-secondary); font-size: 1.4rem;">${Utils.formatCurrency(0, entity.currency)}</strong>
                <span id="expLiveGrandUSD" class="text-secondary font-bold" style="font-size: 13px;">(≈ $0 USD)</span>
              </div>
            </div>
          </div>
          <div id="expLiveLineItemsCount" class="text-secondary font-bold" style="font-size: 13px;">
            ${lineItems.length} Line Item${lineItems.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    `;

    Utils.showModal(isEdit ? `✏️ Edit Expense Line Item` : `➕ Structured Expense Submission (Multi-Line Items)`, content, {
      size: 'full',
      modalWidth: '96vw',
      modalHeight: '94vh',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel (Esc)', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: isEdit ? 'Update Expense Item' : `💾 Save & Link All Line Items`,
          onClick: async () => {
            syncCurrentCardsToLineItems();

            const empSelect = Utils.$('#expEmployeeSelect').value;
            const empCustom = Utils.$('#expCustomEmployeeInput').value.trim();
            const employeeName = empSelect === '__CUSTOM__' ? empCustom : (empSelect || 'Staff');

            const activity = Utils.$('#expActivitySelect').value;
            const location = Utils.$('#expLocationSelect').value;
            const donor = Utils.$('#expDonorSelect').value;
            const conditionArea = Utils.$('#expConditionSelect').value;

            const recordsToSave = [];

            for (let i = 0; i < lineItems.length; i++) {
              const item = lineItems[i];
              if (!item.itemName) {
                // Expand this item so user can fill it
                lineItems.forEach((it, idx) => { it.isCollapsed = (idx !== i); });
                reRenderLineItemsContainer();
                Utils.showToast(`Please enter an Item Name / Specific Purpose for Line #${i + 1}`, 'warning');
                return;
              }

              const lineCategoryKey = BudgetEntryModule.getOtherCostCategory({
                parentAccount: item.parentAccount,
                glDescription: item.glDescription,
                ledgerCode: item.ledgerCode
              });

              // Generate clear basis of expense
              let basisOfExpense = '';
              const empPrefix = employeeName && employeeName !== 'Staff' ? `${employeeName}: ` : '';
              if (item.calcMode === 'unit') {
                const totalUnits = (item.unitMatrix || []).reduce((s, v) => s + (v || 0), 0);
                basisOfExpense = `${empPrefix}${item.itemName}: ${totalUnits} ${item.unitName || 'Units'} @ ${Utils.formatCurrency(item.unitRate || 0, entity.currency)}`;
              } else {
                basisOfExpense = `${empPrefix}${item.itemName}: Monthly schedule for ${item.glDescription}`;
              }

              const record = {
                ...(existingRecord && isEdit ? existingRecord : {}),
                yearId,
                entityId: entity.id,
                deptId: dept.id,
                categoryKey: lineCategoryKey,
                subGroup: 'Direct Cost',
                parentAccount: item.parentAccount || meta.defaultParent,
                glDescription: item.glDescription || meta.defaultGl,
                ledgerCode: item.ledgerCode || meta.defaultCode,
                employeeName,
                itemName: item.itemName,
                calcMode: item.calcMode || 'schedule',
                unitName: item.unitName || 'Units',
                unitRate: item.unitRate || 0,
                unitMatrix: item.unitMatrix || Array(12).fill(0),
                basisOfExpense,
                remarks: item.remarks || 'Budget allocation',
                monthlyValues: item.monthlyValues || {},
                totalCY: item.totalCY || 0,
                activity,
                location,
                donor,
                conditionArea
              };

              recordsToSave.push(record);
            }

            if (recordsToSave.length === 0) {
              Utils.showToast('Please add at least one line item', 'warning');
              return;
            }

            // Save records
            if (isEdit && existingRecord?.id) {
              await db.put(STORES.nonPayrollCost, recordsToSave[0]);
            } else {
              for (const rec of recordsToSave) {
                await db.add(STORES.nonPayrollCost, rec);
              }
            }

            Utils.showToast(isEdit ? 'Expense line item updated!' : `${recordsToSave.length} expense line item(s) saved & linked to budget!`, 'success');
            close();

            // Re-render grid
            await BudgetEntryModule.renderGrid(BudgetEntryModule._entity || entity, BudgetEntryModule._dept || dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);
          }
        }));
      }
    });

    const modalEl = document.querySelector('#expenseInputWizardModal');
    if (!modalEl) return;

    // Custom Employee toggle
    const empSelect = modalEl.querySelector('#expEmployeeSelect');
    const empCustom = modalEl.querySelector('#expCustomEmployeeInput');
    empSelect.addEventListener('change', () => {
      empCustom.style.display = empSelect.value === '__CUSTOM__' ? 'block' : 'none';
      if (empSelect.value === '__CUSTOM__') empCustom.focus();
    });

    // Synchronize DOM inputs back to lineItems array
    const syncCurrentCardsToLineItems = () => {
      const currentCards = modalEl.querySelectorAll('.exp-line-item-card');
      currentCards.forEach(card => {
        const idx = parseInt(card.dataset.lineIndex);
        if (!lineItems[idx]) return;

        // Only sync from form if the card is currently expanded
        if (!card.classList.contains('collapsed-card')) {
          const coaSel = card.querySelector('.exp-coa-select');
          const isCustom = coaSel?.value === '__CUSTOM_COA__';
          const opt = coaSel?.selectedOptions?.[0];

          const mValues = {};
          const uMatrix = Array(12).fill(0);
          let totalCY = 0;
          const calcMode = card.querySelector('.exp-calc-mode:checked')?.value || 'schedule';
          const unitRate = Utils.parseNumber(card.querySelector('.exp-unit-rate')?.value) || 0;

          card.querySelectorAll('.exp-month-input').forEach(inp => {
            const mIdx = parseInt(inp.dataset.month);
            const val = Utils.parseNumber(inp.value) || 0;
            uMatrix[mIdx] = val;
            if (calcMode === 'unit') {
              const c = val * unitRate;
              mValues[mIdx] = c;
              totalCY += c;
            } else {
              mValues[mIdx] = val;
              totalCY += val;
            }
          });

          lineItems[idx] = {
            ...lineItems[idx],
            parentAccount: isCustom ? (card.querySelector('.exp-custom-parent')?.value.trim() || meta.defaultParent) : (opt?.dataset?.parent || meta.defaultParent),
            glDescription: isCustom ? (card.querySelector('.exp-custom-gl')?.value.trim() || meta.defaultGl) : (opt?.dataset?.gl || meta.defaultGl),
            ledgerCode: isCustom ? '93999' : (coaSel?.value || meta.defaultCode),
            itemName: card.querySelector('.exp-item-name')?.value.trim() || '',
            remarks: card.querySelector('.exp-line-remarks')?.value.trim() || '',
            calcMode,
            unitName: card.querySelector('.exp-unit-name')?.value.trim() || 'Units',
            unitRate,
            unitMatrix: uMatrix,
            monthlyValues: mValues,
            totalCY
          };
        }
      });
    };

    // Recalculate grand totals across all line item cards
    const refreshLiveModalTotals = () => {
      let grandTotal = 0;
      lineItems.forEach(item => {
        grandTotal += (item.totalCY || 0);
      });

      const grandLocal = modalEl.querySelector('#expLiveGrandLocal');
      const grandUSD = modalEl.querySelector('#expLiveGrandUSD');
      const countEl = modalEl.querySelector('#expLiveLineItemsCount');

      if (grandLocal) grandLocal.textContent = Utils.formatCurrency(grandTotal, entity.currency);
      const convRate = BudgetEntryModule._conversionRates?.[entity.currency] || 1.0;
      if (grandUSD) grandUSD.textContent = `(≈ ${Utils.formatCurrency(Utils.convertToUSD(grandTotal, convRate), 'USD')} USD)`;
      if (countEl) countEl.textContent = `${lineItems.length} Line Item${lineItems.length === 1 ? '' : 's'}`;
    };

    // Wire up event listeners for a specific line item card
    const attachLineItemListeners = (card) => {
      const idx = parseInt(card.dataset.lineIndex);

      if (card.classList.contains('collapsed-card')) {
        // Expand button or card click
        card.querySelector('.btn-toggle-expand')?.addEventListener('click', (e) => {
          e.stopPropagation();
          syncCurrentCardsToLineItems();
          lineItems.forEach((it, i) => { it.isCollapsed = (i !== idx); });
          reRenderLineItemsContainer();
        });

        card.addEventListener('click', (e) => {
          if (!e.target.closest('.btn-delete-line')) {
            syncCurrentCardsToLineItems();
            lineItems.forEach((it, i) => { it.isCollapsed = (i !== idx); });
            reRenderLineItemsContainer();
          }
        });
      } else {
        // Collapse button
        card.querySelector('.btn-collapse-line')?.addEventListener('click', (e) => {
          e.stopPropagation();
          syncCurrentCardsToLineItems();
          lineItems[idx].isCollapsed = true;
          reRenderLineItemsContainer();
        });

        // COA Change
        const coaSelect = card.querySelector('.exp-coa-select');
        const customRow = card.querySelector('.custom-coa-inputs');
        const headerTitle = card.querySelector('.exp-line-header-title');

        coaSelect?.addEventListener('change', () => {
          const isCustom = coaSelect.value === '__CUSTOM_COA__';
          if (customRow) customRow.style.display = isCustom ? 'grid' : 'none';
          if (headerTitle) {
            const selectedOpt = coaSelect.selectedOptions[0];
            headerTitle.textContent = isCustom ? 'Custom Line' : (selectedOpt.dataset.gl || 'Line Item');
          }
        });

        // Mode Radio Change
        card.querySelectorAll('.exp-calc-mode').forEach(radio => {
          radio.addEventListener('change', () => {
            const isUnit = radio.value === 'unit';
            const unitRow = card.querySelector('.unit-rate-config-row');
            if (unitRow) unitRow.style.display = isUnit ? 'grid' : 'none';

            const colHeader = card.querySelector('.exp-header-mode-label');
            const rowLabel = card.querySelector('.exp-row-mode-label');
            if (colHeader) colHeader.textContent = isUnit ? 'Monthly Qty' : `Monthly Amount (${entity.currency})`;
            if (rowLabel) rowLabel.textContent = isUnit ? 'Units / Mo' : `Cost (${entity.currency})`;

            syncCurrentCardsToLineItems();
            refreshLiveModalTotals();
          });
        });

        // Month input listeners with forward auto-fill
        card.querySelectorAll('.exp-month-input').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const changedIdx = parseInt(e.target.dataset.month);
            const val = e.target.value;
            card.querySelectorAll('.exp-month-input').forEach(m => {
              if (parseInt(m.dataset.month) > changedIdx) m.value = val;
            });
            syncCurrentCardsToLineItems();
            const rowTotalCell = card.querySelector('.exp-row-total-cell');
            const lineTotalBadge = card.querySelector('.exp-line-total-badge');
            if (rowTotalCell) rowTotalCell.textContent = Utils.formatCurrency(lineItems[idx].totalCY || 0, entity.currency);
            if (lineTotalBadge) lineTotalBadge.textContent = `Total: ${Utils.formatCurrency(lineItems[idx].totalCY || 0, entity.currency)}`;
            refreshLiveModalTotals();
          });
        });

        card.querySelector('.exp-unit-rate')?.addEventListener('input', () => {
          syncCurrentCardsToLineItems();
          const rowTotalCell = card.querySelector('.exp-row-total-cell');
          const lineTotalBadge = card.querySelector('.exp-line-total-badge');
          if (rowTotalCell) rowTotalCell.textContent = Utils.formatCurrency(lineItems[idx].totalCY || 0, entity.currency);
          if (lineTotalBadge) lineTotalBadge.textContent = `Total: ${Utils.formatCurrency(lineItems[idx].totalCY || 0, entity.currency)}`;
          refreshLiveModalTotals();
        });
      }

      // Delete Line Item button
      card.querySelector('.btn-delete-line')?.addEventListener('click', (e) => {
        e.stopPropagation();
        syncCurrentCardsToLineItems();
        lineItems.splice(idx, 1);
        if (lineItems.length > 0 && !lineItems.some(it => !it.isCollapsed)) {
          lineItems[lineItems.length - 1].isCollapsed = false;
        }
        reRenderLineItemsContainer();
      });
    };

    // Re-render all line items in the container
    const reRenderLineItemsContainer = () => {
      const container = modalEl.querySelector('#expenseLineItemsContainer');
      if (!container) return;

      container.innerHTML = lineItems.map((item, idx) => renderLineItemCardHtml(item, idx)).join('');
      container.querySelectorAll('.exp-line-item-card').forEach(card => attachLineItemListeners(card));
      refreshLiveModalTotals();
    };

    // Attach initial listeners
    modalEl.querySelectorAll('.exp-line-item-card').forEach(card => attachLineItemListeners(card));

    // "+ Add Another Line Item" handler: reduces earlier lines to single lines and opens new line
    const addAnotherLineHandler = () => {
      syncCurrentCardsToLineItems();

      // Reduce earlier lines to single lines
      lineItems.forEach(item => {
        item.isCollapsed = true;
      });

      // Add fresh active line item
      lineItems.push({
        parentAccount: meta.defaultParent,
        glDescription: meta.defaultGl,
        ledgerCode: meta.defaultCode,
        itemName: '',
        remarks: '',
        calcMode: 'schedule',
        unitName: 'Units',
        unitRate: 0,
        unitMatrix: Array(12).fill(0),
        monthlyValues: {},
        totalCY: 0,
        isCollapsed: false
      });

      reRenderLineItemsContainer();

      // Scroll to newly added line
      const allCards = modalEl.querySelectorAll('.exp-line-item-card');
      const lastCard = allCards[allCards.length - 1];
      if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    modalEl.querySelector('#btnAddAnotherLineBtn')?.addEventListener('click', addAnotherLineHandler);
    modalEl.querySelector('#btnAddAnotherLineBtnFooter')?.addEventListener('click', addAnotherLineHandler);

    refreshLiveModalTotals();
  },

  async editExpenseItem(id) {
    const yearId = this._yearId || App.selectedYear || '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      Utils.showToast(`🔒 Editing is disabled: Budget year status is "${Auth.getYearStatusLabel(yearId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    const item = await db.get(STORES.nonPayrollCost, id);
    if (!item) return;
    if (item.isTravelPackage && item.travelPackageId) {
      const pkg = await db.get(STORES.travelPackages, item.travelPackageId);
      this.showTravelPackageWizard(this._yearId, this._entity, this._dept, this._locations, this._donors, this._activities, this._conditionAreas, pkg || item);
    } else {
      const catKey = this.getOtherCostCategory(item);
      this.showExpenseInputWizard(catKey, item);
    }
  },

  async deleteExpenseItem(id) {
    const yearId = this._yearId || App.selectedYear || '2026';
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      Utils.showToast(`🔒 Deletion is disabled: Budget year status is "${Auth.getYearStatusLabel(yearId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    const item = await db.get(STORES.nonPayrollCost, id);
    if (!item) return;

    if (item.isTravelPackage && item.travelPackageId) {
      if (await Utils.confirm('Delete this Travel Package item and all its associated category lines?')) {
        await db.delete(STORES.travelPackages, item.travelPackageId);
        const existingNp = await db.getBudgetData(STORES.nonPayrollCost, yearId, this._entity.id, this._dept.id);
        const matchingNp = existingNp.filter(r => r.travelPackageId === item.travelPackageId);
        for (const r of matchingNp) {
          await db.delete(STORES.nonPayrollCost, r.id);
        }
        Utils.showToast('Travel package deleted', 'info');
        await this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth);
      }
      return;
    }

    if (await Utils.confirm('Delete this expense line item?')) {
      await db.delete(STORES.nonPayrollCost, id);
      Utils.showToast('Expense item deleted', 'info');
      await this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth);
    }
  },

  // ─── Travel & Lodging Package Wizard & Calculator ───
  async showTravelPackageWizard(yearId, entity, dept, locations, donors, activities, conditionAreas, existingPackage = null) {
    const yId = yearId || this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    const isEdit = !!existingPackage;
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yId)) {
      Utils.showToast(`🔒 ${isEdit ? 'Editing' : 'Travel package additions are'} disabled: Budget year status is "${Auth.getYearStatusLabel(yId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }
    const masterEmployees = await db.getEmployeesMaster(entity.id);
    const personnel = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);
    const allMasterEmployees = await db.getEmployeesMaster();
    const empOptionsHtml = Utils.buildEmployeeSelectOptionsHtml({
      allEmployees: allMasterEmployees,
      currentDept: dept,
      currentPersonnel: personnel,
      selectedName: existingPackage?.employeeName,
      placeholder: 'Select Employee...',
      allowCustom: true
    });
    const travelRates = await db.getTravelRatesForEntity(entity.id);

    const defaultLoc = existingPackage?.destinationLocation || locations[0]?.name || 'India KA';
    const defaultCat = existingPackage?.travelCategory || 'City';

    const getRate = (loc, cat) => {
      const norm = (s) => String(s || '').trim().toLowerCase();
      const locNorm = norm(loc);
      const catNorm = norm(cat);

      // 1. Exact match on location & category
      let match = travelRates.find(r => norm(r.location) === locNorm && norm(r.category) === catNorm && !r.isDefault && !norm(r.location).includes('default'));
      if (match) return { ...match, isFallback: false };

      // 2. Any match for specific location
      match = travelRates.find(r => norm(r.location) === locNorm && !r.isDefault && !norm(r.location).includes('default'));
      if (match) return { ...match, isFallback: false };

      // 3. Fallback: Default rate for the specific category (City / Non-City)
      match = travelRates.find(r => (r.isDefault || norm(r.location).includes('default') || norm(r.location) === 'all') && norm(r.category) === catNorm);
      if (match) return { ...match, isFallback: true };

      // 4. Fallback: Any Default rate for entity
      match = travelRates.find(r => r.isDefault || norm(r.location).includes('default') || norm(r.location) === 'all');
      if (match) return { ...match, isFallback: true };

      // 5. General entity rate fallback
      if (travelRates.length > 0) return { ...travelRates[0], isFallback: true };

      return {
        hotelPerDay: 3000, foodPerDay: 1000, cabPerDay: 1000, airfarePerTrip: 8000, busTrainPerTrip: 2000, isFallback: true
      };
    };

    let activeRate = getRate(defaultLoc, defaultCat);

    const matrix = existingPackage?.unitMatrix || [
      Array(12).fill(0), // Hotel
      Array(12).fill(0), // Food
      Array(12).fill(0), // Cab
      Array(12).fill(0), // Airfare
      Array(12).fill(0)  // Bus/Train
    ];

    const itemMeta = [
      { id: 'hotel', label: '🏨 Hotel Accommodation', unit: 'Days / Nights', rateKey: 'hotelPerDay', glDesc: 'Hotel Accommodation', code: '93101' },
      { id: 'food', label: '🍽️ Food Expenses', unit: 'Days', rateKey: 'foodPerDay', glDesc: 'Food Expenses', code: '93102' },
      { id: 'cab', label: '🚕 Local Cab / Auto', unit: 'Days', rateKey: 'cabPerDay', glDesc: 'Cab/Auto', code: '93104' },
      { id: 'airfare', label: '✈️ Air Fare', unit: 'Flights / Tickets', rateKey: 'airfarePerTrip', glDesc: 'Air fare', code: '93103' },
      { id: 'bustrain', label: '🚆 Bus / Train', unit: 'Trips', rateKey: 'busTrainPerTrip', glDesc: 'Bus/Train', code: '93105' }
    ];

    const content = `
      <div id="travelWizardModal" style="font-size: var(--font-size-sm);">
        <!-- Step 1: Trip & Dimension Info -->
        <div class="card p-md mb-md" style="background: var(--bg-card); border-color: var(--border-default);">
          <div class="form-row mb-sm" style="display: grid; grid-template-columns: 1.1fr 1.5fr 1fr; gap: 12px;">
            <div class="form-group mb-xs">
              <label class="form-label font-bold">Employee Name</label>
              <select class="form-select" id="pkgEmployeeSelect">
                ${empOptionsHtml}
              </select>
              <input type="text" class="form-input mt-xs" id="pkgCustomEmployeeInput" placeholder="Enter Full Name" value="${existingPackage?.employeeName && !allMasterEmployees.some(e => e.name === existingPackage.employeeName) ? existingPackage.employeeName : ''}" style="display: ${existingPackage?.employeeName && !allMasterEmployees.some(e => e.name === existingPackage.employeeName) ? 'block' : 'none'};">
            </div>

            <div class="form-group mb-xs">
              <label class="form-label font-bold">Purpose / Details of Travel <span style="color: var(--danger);">*</span></label>
              <input type="text" class="form-input" id="pkgPurposeInput" placeholder="e.g. Field visit for clinic training in Patna" value="${existingPackage?.travelDetails || ''}" required>
            </div>

            <div class="form-group mb-xs">
              <label class="form-label font-bold">Travel Category</label>
              <select class="form-select" id="pkgCategorySelect">
                <option value="City" ${defaultCat === 'City' ? 'selected' : ''}>🏙️ City (Metro / Urban)</option>
                <option value="Non-City" ${defaultCat === 'Non-City' ? 'selected' : ''}>🌾 Non-City (Rural / Field / District)</option>
              </select>
            </div>
          </div>

          <div class="form-group mb-sm">
            <label class="form-label font-bold">Remarks for Amount Addition / Justification <span style="color: var(--danger);">*</span></label>
            <textarea class="form-input" id="pkgRemarksInput" rows="2" placeholder="Explain the trip necessity, program milestones, or justification for adding travel budget..." required style="resize: vertical;">${existingPackage?.remarks || ''}</textarea>
          </div>

          <!-- 5 Dimensions -->
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Activity</label>
              <select class="form-select" id="pkgActivitySelect" style="font-size: 11px;">
                ${activities.map(a => `<option value="${a.name}" ${existingPackage?.activity === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Charging Location</label>
              <select class="form-select" id="pkgLocationSelect" style="font-size: 11px;">
                ${locations.map(l => `<option value="${l.name}" ${defaultLoc === l.name ? 'selected' : ''}>📍 ${l.name}</option>`).join('')}
                <option value="Default (All Locations)" ${defaultLoc === 'Default (All Locations)' ? 'selected' : ''}>⭐ Default (All Locations)</option>
              </select>
            </div>
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Donor</label>
              <select class="form-select" id="pkgDonorSelect" style="font-size: 11px;">
                ${donors.map(d => `<option value="${d.name}" ${existingPackage?.donor === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-xs">
              <label class="form-label" style="font-size: 11px;">Condition Area</label>
              <select class="form-select" id="pkgConditionSelect" style="font-size: 11px;">
                ${conditionAreas.map(c => `<option value="${c.name}" ${existingPackage?.conditionArea === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Admin Benchmark Rates Box (Read-only / Locked) -->
        <div class="travel-rate-badge-box" id="pkgRatesDisplay">
          <!-- Populated dynamically -->
        </div>

        <!-- Step 2: Monthly Travel Schedule Quantities Matrix -->
        <div class="table-container mb-md" style="max-height: 280px;">
          <table class="travel-matrix-table" id="pkgMatrixTable">
            <thead>
              <tr>
                <th style="min-width: 170px;">Expense Category</th>
                <th style="min-width: 110px;">Admin Rate (Locked)</th>
                ${SEED_DATA.months.map(m => `<th class="text-center" style="min-width: 55px;">${m}</th>`).join('')}
                <th class="num" style="min-width: 80px;">Total Units</th>
                <th class="num" style="min-width: 100px;">Total Cost (${entity.currency})</th>
              </tr>
            </thead>
            <tbody>
              ${itemMeta.map((item, rIdx) => `
                <tr data-row="${rIdx}">
                  <td>
                    <strong>${item.label}</strong>
                    <div class="text-tertiary" style="font-size: 10px;">Unit: ${item.unit}</div>
                  </td>
                  <td class="font-mono font-bold field-rate-display" style="color: var(--accent-primary);">
                    ${Utils.formatCurrency(activeRate[item.rateKey] || 0, entity.currency)}
                  </td>
                  ${SEED_DATA.months.map((m, mIdx) => `
                    <td class="editable">
                      <input type="number" class="matrix-input" data-row="${rIdx}" data-month="${mIdx}" value="${matrix[rIdx][mIdx] || 0}" min="0" step="1">
                    </td>
                  `).join('')}
                  <td class="num font-mono font-bold row-total-units">0</td>
                  <td class="num font-mono font-bold row-total-cost" style="color: var(--accent-primary);">${Utils.formatCurrency(0, entity.currency)}</td>
                </tr>
              `).join('')}
              <tr class="total-row" style="background: #f1f5f9; border-top: 2px solid var(--border-default);">
                <td colspan="2" class="font-bold text-right" style="padding-right: 10px;">MONTHLY 1-LINER BUDGET:</td>
                ${SEED_DATA.months.map((m, mIdx) => `
                  <td class="num font-mono font-bold col-monthly-total" data-month="${mIdx}" style="font-size: 11px;">0</td>
                `).join('')}
                <td class="num font-bold grand-total-units">0 Units</td>
                <td class="num font-bold grand-total-cost" style="color: var(--accent-primary); font-size: 13px;">${Utils.formatCurrency(0, entity.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary & USD Equivalent Callout -->
        <div class="card p-sm flex items-center justify-between" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2);">
          <div class="flex items-center gap-md">
            <div>
              <span class="text-tertiary" style="font-size: 11px;">TOTAL TRAVEL DAYS:</span>
              <strong id="liveSummaryDays" style="font-size: 13px; margin-left: 4px;">0 Days</strong>
            </div>
            <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-md);">
              <span class="text-tertiary" style="font-size: 11px;">TOTAL FLIGHTS:</span>
              <strong id="liveSummaryFlights" style="font-size: 13px; margin-left: 4px;">0 Flights</strong>
            </div>
          </div>
          <div>
            <span class="text-tertiary" style="font-size: 11px;">CALCULATED 1-LINER BUDGET:</span>
            <strong id="liveSummaryGrandLocal" style="color: var(--success); font-size: 1.1rem; margin-left: 6px;">${Utils.formatCurrency(0, entity.currency)}</strong>
            <span id="liveSummaryGrandUSD" class="text-tertiary" style="font-size: 12px; margin-left: 6px;">(≈ $0 USD)</span>
          </div>
        </div>
      </div>
    `;

    Utils.showModal(isEdit ? '✈️ Edit Travel & Lodging Package' : '✈️ New Travel & Lodging Package Calculator', content, {
      size: 'full',
      modalWidth: '96vw',
      modalHeight: '94vh',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel (Esc)', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: isEdit ? 'Update Package & Budget' : 'Save & Link to Budget',
          onClick: async () => {
            const empSelect = Utils.$('#pkgEmployeeSelect').value;
            const empCustom = Utils.$('#pkgCustomEmployeeInput').value.trim();
            const employeeName = (empSelect === '__CUSTOM__' ? empCustom : empSelect) || 'Staff';

            const travelDetails = Utils.$('#pkgPurposeInput').value.trim() || 'Travel';
            const remarks = Utils.$('#pkgRemarksInput').value.trim() || travelDetails;
            const travelCategory = Utils.$('#pkgCategorySelect').value;
            const activity = Utils.$('#pkgActivitySelect').value;
            const location = Utils.$('#pkgLocationSelect').value;
            const destinationLocation = location;
            const donor = Utils.$('#pkgDonorSelect').value;
            const conditionArea = Utils.$('#pkgConditionSelect').value;

            // Compute month-wise 1-liner totals
            const monthlyValues = {};
            let totalCY = 0;

            for (let m = 0; m < 12; m++) {
              let mSum = 0;
              itemMeta.forEach((item, rIdx) => {
                const qty = Utils.parseNumber(matrix[rIdx][m]) || 0;
                const rRate = activeRate[item.rateKey] || 0;
                mSum += (qty * rRate);
              });
              monthlyValues[m] = mSum;
              totalCY += mSum;
            }

            // Generate basis notes
            const basisParts = [];
            itemMeta.forEach((item, rIdx) => {
              const rUnits = matrix[rIdx].reduce((s, v) => s + (Utils.parseNumber(v) || 0), 0);
              if (rUnits > 0) {
                basisParts.push(`${rUnits} ${item.unit} @ ${Utils.formatCurrency(activeRate[item.rateKey], entity.currency)}`);
              }
            });
            const basisSummary = `${employeeName} (${destinationLocation} - ${travelDetails}): ${basisParts.join(', ') || '0 units'}`;

            // Save in travelPackages store
            const pkgRecord = {
              ...(existingPackage || {}),
              yearId,
              entityId: entity.id,
              deptId: dept.id,
              employeeName,
              travelDetails,
              remarks,
              destinationLocation,
              travelCategory,
              activity,
              location,
              donor,
              conditionArea,
              unitMatrix: matrix,
              activeRate,
              monthlyValues,
              totalCY
            };

            let savedPkgId;
            if (isEdit) {
              await db.put(STORES.travelPackages, pkgRecord);
              savedPkgId = existingPackage.id;
            } else {
              savedPkgId = await db.add(STORES.travelPackages, pkgRecord);
            }
            pkgRecord.id = savedPkgId;

            // Sync itemized COA line records to STORES.nonPayrollCost
            await BudgetEntryModule.syncTravelPackageToNonPayroll(pkgRecord);

            Utils.showToast(isEdit ? 'Travel package updated!' : 'Travel package saved & linked to respective budget line items!', 'success');
            close();

            // Re-render
            await BudgetEntryModule.renderGrid(BudgetEntryModule._entity || entity, BudgetEntryModule._dept || dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth);
          }
        }));
      }
    });

    // Helper to refresh live calculation inside modal
    const refreshLiveModalCalculations = () => {
      const modal = document.querySelector('#travelWizardModal');
      if (!modal) return;

      const selLoc = modal.querySelector('#pkgLocationSelect')?.value || defaultLoc;
      const selCat = modal.querySelector('#pkgCategorySelect')?.value || defaultCat;

      // Update rate pills box in a single continuous line
      const rateBox = modal.querySelector('#pkgRatesDisplay');
      if (rateBox) {
        const isFallback = activeRate.isFallback;
        rateBox.innerHTML = `
          <div class="flex items-center gap-xs" style="flex-shrink: 0;">
            <span class="text-tertiary font-bold" style="font-size: 11px; text-transform: uppercase; white-space: nowrap;">
              📍 Rates for ${selLoc} (${selCat}):
            </span>
            ${isFallback ? `<span class="badge badge-warning" style="font-size: 10px; white-space: nowrap;">⚠️ Default</span>` : `<span class="badge badge-emerald" style="font-size: 10px; white-space: nowrap;">✓ Standard</span>`}
          </div>
          <div class="travel-rate-pills">
            <div class="rate-pill"><span class="pill-label">🏨 Hotel/Day:</span> <strong class="pill-val">${Utils.formatCurrency(activeRate.hotelPerDay || 0, entity.currency)}</strong></div>
            <div class="rate-pill"><span class="pill-label">🍽️ Food/Day:</span> <strong class="pill-val">${Utils.formatCurrency(activeRate.foodPerDay || 0, entity.currency)}</strong></div>
            <div class="rate-pill"><span class="pill-label">🚕 Cab/Day:</span> <strong class="pill-val">${Utils.formatCurrency(activeRate.cabPerDay || 0, entity.currency)}</strong></div>
            <div class="rate-pill"><span class="pill-label">✈️ Flight/Trip:</span> <strong class="pill-val">${Utils.formatCurrency(activeRate.airfarePerTrip || 0, entity.currency)}</strong></div>
            <div class="rate-pill"><span class="pill-label">🚆 Bus-Train/Trip:</span> <strong class="pill-val">${Utils.formatCurrency(activeRate.busTrainPerTrip || 0, entity.currency)}</strong></div>
          </div>
        `;
      }

      // Update locked rate display in table
      modal.querySelectorAll('.field-rate-display').forEach((td, idx) => {
        const rKey = itemMeta[idx]?.rateKey;
        if (rKey) td.textContent = Utils.formatCurrency(activeRate[rKey] || 0, entity.currency);
      });

      // Recalculate row totals & column totals
      let grandTotalUnits = 0;
      let grandTotalCost = 0;
      let totalHotelDays = 0;
      let totalFlights = 0;
      const colTotals = Array(12).fill(0);

      itemMeta.forEach((item, rIdx) => {
        let rowUnits = 0;
        let rowCost = 0;
        const rateVal = activeRate[item.rateKey] || 0;

        for (let m = 0; m < 12; m++) {
          const qty = Utils.parseNumber(matrix[rIdx][m]) || 0;
          rowUnits += qty;
          const cost = qty * rateVal;
          rowCost += cost;
          colTotals[m] += cost;
        }

        grandTotalUnits += rowUnits;
        grandTotalCost += rowCost;
        if (rIdx === 0) totalHotelDays = rowUnits;
        if (rIdx === 3) totalFlights = rowUnits;

        const rowTr = modal.querySelector(`tr[data-row="${rIdx}"]`);
        if (rowTr) {
          const unitsTd = rowTr.querySelector('.row-total-units');
          const costTd = rowTr.querySelector('.row-total-cost');
          if (unitsTd) unitsTd.textContent = `${rowUnits} ${item.unit.split('/')[0].trim()}`;
          if (costTd) costTd.textContent = Utils.formatCurrency(rowCost, entity.currency);
        }
      });

      // Update monthly column sums
      colTotals.forEach((cCost, mIdx) => {
        const cTd = modal.querySelector(`.col-monthly-total[data-month="${mIdx}"]`);
        if (cTd) {
          cTd.textContent = Utils.formatNumber(cCost);
          cTd.style.color = cCost > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)';
        }
      });

      // Update grand totals
      const grandUnitsTd = modal.querySelector('.grand-total-units');
      const grandCostTd = modal.querySelector('.grand-total-cost');
      if (grandUnitsTd) grandUnitsTd.textContent = `${grandTotalUnits} Units`;
      if (grandCostTd) grandCostTd.textContent = Utils.formatCurrency(grandTotalCost, entity.currency);

      const summaryDays = modal.querySelector('#liveSummaryDays');
      const summaryFlights = modal.querySelector('#liveSummaryFlights');
      const summaryGrandLocal = modal.querySelector('#liveSummaryGrandLocal');
      const summaryGrandUSD = modal.querySelector('#liveSummaryGrandUSD');

      const rateNum = BudgetEntryModule._conversionRates?.[entity.currency] || 1.0;
      if (summaryDays) summaryDays.textContent = `${totalHotelDays} Days`;
      if (summaryFlights) summaryFlights.textContent = `${totalFlights} Flights`;
      if (summaryGrandLocal) summaryGrandLocal.textContent = Utils.formatCurrency(grandTotalCost, entity.currency);
      if (summaryGrandUSD) summaryGrandUSD.textContent = `(≈ ${Utils.formatCurrency(Utils.convertToUSD(grandTotalCost, rateNum), 'USD')} USD)`;
    };

    // Modal Event Listeners
    const modalEl = document.querySelector('#travelWizardModal');
    if (modalEl) {
      // Employee custom toggle
      const empSelect = modalEl.querySelector('#pkgEmployeeSelect');
      const empCustom = modalEl.querySelector('#pkgCustomEmployeeInput');
      empSelect.addEventListener('change', () => {
        empCustom.style.display = empSelect.value === '__CUSTOM__' ? 'block' : 'none';
        if (empSelect.value === '__CUSTOM__') empCustom.focus();
      });

      // Location / Category change &rarr; update activeRate
      const locSelect = modalEl.querySelector('#pkgLocationSelect');
      const catSelect = modalEl.querySelector('#pkgCategorySelect');

      const onRateParamsChange = () => {
        activeRate = getRate(locSelect.value, catSelect.value);
        refreshLiveModalCalculations();
      };

      if (locSelect) locSelect.addEventListener('change', onRateParamsChange);
      if (catSelect) catSelect.addEventListener('change', onRateParamsChange);

      // Matrix input changes
      const matrixTable = modalEl.querySelector('#pkgMatrixTable');
      matrixTable.addEventListener('input', (e) => {
        if (e.target.classList.contains('matrix-input')) {
          const rIdx = parseInt(e.target.dataset.row);
          const mIdx = parseInt(e.target.dataset.month);
          const val = Utils.parseNumber(e.target.value) || 0;
          matrix[rIdx][mIdx] = val;
          refreshLiveModalCalculations();
        }
      });
    }

    refreshLiveModalCalculations();
  },

  async editTravelPackage(id) {
    const yearId = this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      Utils.showToast(`🔒 Editing is disabled: Budget year status is "${Auth.getYearStatusLabel(yearId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    const pkg = await db.get(STORES.travelPackages, id);
    if (!pkg) return;
    this.showTravelPackageWizard(this._yearId, this._entity, this._dept, this._locations, this._donors, this._activities, this._conditionAreas, pkg);
  },

  // Synchronize Travel Package itemized costs into nonPayrollCost so they automatically flow into standard COA line items (93101, 93102, 93103, 93104, 93105)
  async syncTravelPackageToNonPayroll(pkgRecord) {
    const yearId = String(pkgRecord.yearId);
    const entityId = pkgRecord.entityId;
    const deptId = pkgRecord.deptId;
    const pkgId = pkgRecord.id;

    const existingNonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, entityId, deptId);
    // Delete all existing non-payroll records linked to this travel package
    const existingLinked = existingNonPayroll.filter(r => r.travelPackageId === pkgId || (r.isTravelPackage && r.travelPackageId === pkgId));
    for (const r of existingLinked) {
      await db.delete(STORES.nonPayrollCost, r.id);
    }

    const itemMeta = [
      { id: 'hotel', label: '🏨 Hotel Accommodation', unit: 'Days / Nights', rateKey: 'hotelPerDay', glDesc: 'Hotel Accommodation', code: '93101' },
      { id: 'food', label: '🍽️ Food Expenses', unit: 'Days', rateKey: 'foodPerDay', glDesc: 'Food Expenses', code: '93102' },
      { id: 'cab', label: '🚕 Local Cab / Auto', unit: 'Days', rateKey: 'cabPerDay', glDesc: 'Cab/Auto', code: '93104' },
      { id: 'airfare', label: '✈️ Air Fare', unit: 'Flights / Tickets', rateKey: 'airfarePerTrip', glDesc: 'Air fare', code: '93103' },
      { id: 'bustrain', label: '🚆 Bus / Train', unit: 'Trips', rateKey: 'busTrainPerTrip', glDesc: 'Bus/Train', code: '93105' }
    ];

    const matrix = pkgRecord.unitMatrix || [];
    const activeRate = pkgRecord.activeRate || {};

    for (let rIdx = 0; rIdx < itemMeta.length; rIdx++) {
      const item = itemMeta[rIdx];
      const rate = activeRate[item.rateKey] || 0;
      const rowUnits = matrix[rIdx] || Array(12).fill(0);

      const monthlyValues = {};
      let itemTotal = 0;
      let totalUnits = 0;

      for (let m = 0; m < 12; m++) {
        const qty = Utils.parseNumber(rowUnits[m]) || 0;
        const val = qty * rate;
        monthlyValues[m] = val;
        itemTotal += val;
        totalUnits += qty;
      }

      if (itemTotal > 0) {
        const glInfo = Utils.getGlInfo(item.code);
        const nonPayrollData = {
          yearId,
          entityId,
          deptId,
          isTravelPackage: true,
          travelPackageId: pkgId,
          travelItemKey: item.id,
          categoryKey: 'travel',
          subGroup: 'Direct Cost',
          parentAccount: glInfo.parent || 'Travel & Lodging Expenses',
          glDescription: glInfo.desc || item.glDesc,
          ledgerCode: item.code,
          employeeName: pkgRecord.employeeName || 'Staff',
          itemName: `${pkgRecord.travelDetails || 'Travel'} — ${item.glDesc}`,
          basisOfExpense: `${pkgRecord.employeeName} (${pkgRecord.destinationLocation}): ${totalUnits} ${item.unit} @ ${Utils.formatCurrency(rate, 'INR')}`,
          monthlyValues,
          totalCY: itemTotal,
          activity: pkgRecord.activity,
          location: pkgRecord.location || pkgRecord.destinationLocation,
          donor: pkgRecord.donor,
          conditionArea: pkgRecord.conditionArea,
          remarks: `[Travel Pkg: ${pkgRecord.travelDetails || 'Trip'}] ${pkgRecord.employeeName} (${pkgRecord.destinationLocation}) - ${item.glDesc} (${totalUnits} ${item.unit})`
        };

        await db.add(STORES.nonPayrollCost, nonPayrollData);
      }
    }
  },

  // Auto-heal / migrate any legacy travel package entries that had synthetic 93100
  async ensureTemplateSyncsClean(yearId, entityId, deptId) {
    try {
      const allNp = await db.getBudgetData(STORES.nonPayrollCost, yearId, entityId, deptId);
      const legacyTravel = allNp.filter(r => r.isTravelPackage && (r.ledgerCode === '93100' || !r.travelItemKey));
      if (legacyTravel.length > 0) {
        const allPkgs = await db.getBudgetData(STORES.travelPackages, yearId, entityId, deptId);
        for (const pkg of allPkgs) {
          await this.syncTravelPackageToNonPayroll(pkg);
        }
      }
    } catch (e) {
      console.warn('Could not auto-heal template syncs:', e);
    }
  },

  async deleteTravelPackage(id) {
    const yearId = this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId)) {
      Utils.showToast(`🔒 Deletion is disabled: Budget year status is "${Auth.getYearStatusLabel(yearId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    if (await Utils.confirm('Delete this Travel Package and its budget lines?')) {
      await db.delete(STORES.travelPackages, id);

      // Also delete all associated non-payroll rows
      const existingNp = await db.getBudgetData(STORES.nonPayrollCost, this._yearId, this._entity.id, this._dept.id);
      const matchingNp = existingNp.filter(r => r.travelPackageId === id || (r.isTravelPackage && r.travelPackageId === id));
      for (const r of matchingNp) {
        await db.delete(STORES.nonPayrollCost, r.id);
      }

      Utils.showToast('Travel package deleted', 'info');
      await this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth);
    }
  },

  // ─── Total Dept Cost Grid (Master Summary Linked from Input Sheets) ───
  async renderTotalCostGrid(container, yearId, entity, dept, budgetYear) {
    await this.ensureTemplateSyncsClean(yearId, entity.id, dept.id);
    const coa = await db.getAll(STORES.chartOfAccounts);

    // Fetch all input records for this department & year
    const personnelAll = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);
    const salariesRows = personnelAll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
    const otherStaffRows = personnelAll.filter(p => p.subCategory === 'other-staff-expenses');
    const gratuityRows = personnelAll.filter(p => p.subCategory === 'gratuity-bonus');
    const ehaRows = await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, dept.id);
    const fixedAssetRows = await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, dept.id);
    const otherCostRows = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, dept.id);

    // Fetch stored basis and remarks notes
    const savedTotalCostRecords = await db.getBudgetData(STORES.totalCostSheet, yearId, entity.id, dept.id);
    const savedBasisMap = {};
    const savedRemarksMap = {};
    savedTotalCostRecords.forEach(r => {
      if (r.ledgerCode) {
        savedBasisMap[r.ledgerCode] = r.basisOfExpense || '';
        savedRemarksMap[r.ledgerCode] = r.remarks || '';
      } else if (r.glDescription) {
        savedBasisMap[r.glDescription] = r.basisOfExpense || '';
        savedRemarksMap[r.glDescription] = r.remarks || '';
      }
    });

    const sumMonths = (rows) => {
      const months = Array(12).fill(0);
      let total = 0;
      rows.forEach(r => {
        if (r.monthlyValues) {
          Object.entries(r.monthlyValues).forEach(([mIdx, val]) => {
            const num = Utils.parseNumber(val);
            months[mIdx] += num;
            total += num;
          });
        }
      });
      return { monthlyValues: months, totalCY: total };
    };

    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedOtherCostIndices = new Set();

    const lines = coa.map(account => {
      let linkedSource = 'Non-Payroll Cost';
      let sourceIcon = '📑';
      let entryCount = 0;
      let rollup = { monthlyValues: Array(12).fill(0), totalCY: 0 };
      let remarks = savedRemarksMap[account.ledgerCode] || savedRemarksMap[account.glDescription] || '';

      const accGlClean = cleanStr(account.glDescription);
      const accLedgerClean = cleanStr(account.ledgerCode);
      const accParentClean = cleanStr(account.parentAccount);

      // 1. Salaries and Wages
      if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911') || accParentClean.includes('salariesandwages')) {
        linkedSource = 'Payroll — Salaries & Wages';
        sourceIcon = '👥';
        rollup = sumMonths(salariesRows);
        entryCount = salariesRows.length;
      }
      // 2. Staff Training, Learning (Other Staff Expenses)
      else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913') || accParentClean.includes('otherstaff')) {
        linkedSource = 'Payroll — Other Staff Expenses';
        sourceIcon = '👥';
        rollup = sumMonths(otherStaffRows);
        entryCount = otherStaffRows.length;
      }
      // 3. Gratuity and Bonus
      else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912') || accParentClean.includes('health') || accParentClean.includes('retirement')) {
        linkedSource = 'Payroll — Gratuity & Bonus';
        sourceIcon = '👥';
        rollup = sumMonths(gratuityRows);
        entryCount = gratuityRows.length;
      }
      // 4. Program Resource Consultant (EHA)
      else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921') || accParentClean.includes('resourceperson')) {
        linkedSource = 'Payroll — EHA Consultants';
        sourceIcon = '🤝';
        rollup = sumMonths(ehaRows);
        entryCount = ehaRows.length;
      }
      // 5. Fixed Assets (Laptop/Printer)
      else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113') || accParentClean.includes('fixedasset')) {
        linkedSource = 'Fixed Assets';
        sourceIcon = '💻';
        rollup = sumMonths(fixedAssetRows);
        entryCount = fixedAssetRows.length;
      }
      // 6. Other non-payroll expenses (Direct Costs & Indirect Costs)
      else {
        const catKey = this.getOtherCostCategory(account);
        const catLabels = {
          travel: { label: 'Travel & Lodging Package', icon: '✈️' },
          supplies: { label: 'Supplies & Printing', icon: '🖨️' },
          communication: { label: 'Communication Expenses', icon: '📡' },
          office: { label: 'Office Expenses', icon: '🏢' },
          professional: { label: 'Professional & Consulting', icon: '💼' },
          other: { label: 'Other Operating Costs', icon: '📑' }
        };
        const cMeta = catLabels[catKey] || catLabels.other;
        linkedSource = cMeta.label;
        sourceIcon = cMeta.icon;

        const matchingOther = otherCostRows.filter((o, idx) => {
          const oLedger = cleanStr(o.ledgerCode);
          const oGl = cleanStr(o.glDescription);
          const oParent = cleanStr(o.parentAccount);

          const isMatch = (oLedger && accLedgerClean && oLedger === accLedgerClean) ||
                          (oGl && accGlClean && (oGl === accGlClean || oGl.includes(accGlClean) || accGlClean.includes(oGl))) ||
                          (oParent && accParentClean && oParent === accParentClean && oGl === accGlClean);

          if (isMatch) matchedOtherCostIndices.add(idx);
          return isMatch;
        });

        rollup = sumMonths(matchingOther);
        entryCount = matchingOther.length;

        if (!remarks) {
          const rems = matchingOther.map(o => o.remarks).filter(Boolean);
          if (rems.length > 0) remarks = rems.join('; ');
        }
      }

      return {
        subGroup: account.subGroup,
        parentAccount: account.parentAccount,
        glDescription: account.glDescription,
        ledgerCode: account.ledgerCode,
        linkedSource,
        sourceIcon,
        entryCount,
        remarks,
        monthlyValues: rollup.monthlyValues,
        totalCY: rollup.totalCY
      };
    });

    // Also include any custom added lines from Other Costs that were not in default chart of accounts
    otherCostRows.forEach((o, idx) => {
      if (!matchedOtherCostIndices.has(idx)) {
        const months = Array(12).fill(0);
        let total = 0;
        if (o.monthlyValues) {
          Object.entries(o.monthlyValues).forEach(([mIdx, val]) => {
            const num = Utils.parseNumber(val);
            months[mIdx] += num;
            total += num;
          });
        }

        const catKey = o.categoryKey || this.getOtherCostCategory(o);
        const catLabels = {
          travel: { label: 'Travel & Lodging Package', icon: '✈️' },
          supplies: { label: 'Supplies & Printing', icon: '🖨️' },
          communication: { label: 'Communication Expenses', icon: '📡' },
          office: { label: 'Office Expenses', icon: '🏢' },
          professional: { label: 'Professional & Consulting', icon: '💼' },
          other: { label: 'Other Operating Costs', icon: '📑' }
        };
        const cMeta = catLabels[catKey] || catLabels.other;

        lines.push({
          subGroup: o.subGroup || 'Direct Cost',
          parentAccount: o.parentAccount || 'Other Costs',
          glDescription: o.glDescription || 'Miscellaneous Expense',
          ledgerCode: o.ledgerCode || '93999',
          linkedSource: cMeta.label,
          sourceIcon: cMeta.icon,
          entryCount: 1,
          remarks: o.remarks || '',
          monthlyValues: months,
          totalCY: total
        });
      }
    });

    const priorCosts = await db.getPriorPeriodCosts(yearId, entity.id, dept.id);
    const priorMap = {};
    priorCosts.forEach(p => {
      if (p.ledgerCode) priorMap[cleanStr(p.ledgerCode)] = p.priorCost || 0;
      if (p.glDescription) priorMap[cleanStr(p.glDescription)] = p.priorCost || 0;
    });

    lines.forEach(r => {
      r.priorCost = priorMap[cleanStr(r.ledgerCode)] || priorMap[cleanStr(r.glDescription)] || 0;
    });

    const remarksSummary = await db.getDeptRemarksSummary(yearId, entity.id, dept.id);

    // ─── Filter lines strictly by View Permission ───
    const visibleLines = lines.filter(r => {
      if (typeof Auth === 'undefined') return true;
      const catKey = Auth.getCategoryForLineItem(r);
      return Auth.hasPermission('view', {
        category: catKey,
        ledgerCode: r.ledgerCode,
        glDescription: r.glDescription,
        parentAccount: r.parentAccount,
        entityId: entity.id,
        deptId: dept.id
      });
    });

    const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);
    const rate = this._conversionRates?.[entity.currency] || 1.0;
    const isLocked = typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entity.id);
    const lockAttr = isLocked ? 'disabled readonly style="cursor: not-allowed; opacity: 0.85; background: var(--bg-tertiary);"' : '';

    if (visibleLines.length === 0) {
      const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : { roleName: 'Current User' };
      container.innerHTML = `
        <div class="card p-xl text-center" style="max-width: 620px; margin: 40px auto; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔒</div>
          <h3 style="margin: 0 0 8px; color: var(--text-primary);">Access Restricted</h3>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
            Your role (<strong>${currentUser.roleName || 'Active Role'}</strong>) does not have view access to any cost categories for <strong>${deptDisplayName}</strong>.
          </p>
          <div class="badge badge-subtle font-bold" style="padding: 6px 14px;">Contact your System Administrator to request category access.</div>
        </div>
      `;
      return;
    }

    const totalCost = visibleLines.reduce((sum, r) => sum + r.totalCY, 0);
    const totalPriorCost = visibleLines.reduce((sum, r) => sum + (r.priorCost || 0), 0);
    const totalEntriesCount = visibleLines.reduce((sum, r) => sum + (r.entryCount || 0), 0);
    const colMonthlySums = Array(12).fill(0);
    visibleLines.forEach(r => {
      if (r.monthlyValues) {
        r.monthlyValues.forEach((v, idx) => {
          colMonthlySums[idx] += (Utils.parseNumber(v) || 0);
        });
      }
    });

    const isPartialView = visibleLines.length < lines.length;

    container.innerHTML = `
      <div class="card p-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.06)); border-color: rgba(16, 185, 129, 0.2);">
        <div class="flex items-center gap-lg">
          <div>
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Dept Cost Lines</div>
            <div id="bannerCount" style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">${visibleLines.length} Account Lines &bull; ${totalEntriesCount} Total Entries ${isPartialView ? `<span class="badge badge-subtle" style="font-size: 10px; vertical-align: middle;" title="Some cost lines are restricted from your role">🔒 ${lines.length - visibleLines.length} Restricted</span>` : ''}</div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Dept Cost Budget (${entity.currency})</div>
            <div id="bannerTotal" style="font-size: 1.4rem; font-weight: 700; color: var(--success);">${Utils.formatCurrency(totalCost, entity.currency)}</div>
            <div id="bannerTotalUSD" style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
              ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalCost, rate), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${rate} ${entity.currency}/USD)</span>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
            <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
          </div>
        </div>
        <div class="flex gap-sm items-center">
          <span class="badge badge-emerald" style="padding: 6px 12px; font-size: 12px;">🔗 Auto-Linked to Input Sheets</span>
          ${!isLocked && (typeof Auth === 'undefined' || Auth.hasPermission('edit', { category: 'prior-period', entityId: entity.id, deptId: dept.id })) ? `
            <button class="btn btn-secondary btn-sm" onclick="ConfigModule.managePriorPeriodCosts('${yearId}', '${entity.id}', '${dept.id}')" title="Directly update prior period costs in application">📊 Edit Prior Period</button>
          ` : ''}
        </div>
      </div>

      <div class="table-container">
        <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}" id="totalCostTable">
          <thead>
            <tr>
              <th class="sticky-col-1">Parent Account</th>
              <th class="sticky-col-2">GL Line Item Description</th>
              <th>Ledger Code</th>
              <th>Linked Input Source</th>
              <th style="width: 120px; min-width: 110px; text-align: center;">Number of Entries</th>
              <th class="num month-group budget-year total-toggle-th" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
              ${SEED_DATA.months.map(m => `<th class="num month-group budget-year">${m}-${budgetYear}</th>`).join('')}
              <th class="num prior-cost-col" style="min-width: 140px; background: #e2e8f0; color: var(--accent-primary); font-weight: 700;">Prior Period Cost (${entity.currency})</th>
              <th style="width: 220px; max-width: 220px; min-width: 160px;">Remarks & Tasks</th>
            </tr>
          </thead>
          <tbody>
            <!-- ─── Line Items ─── -->
            ${visibleLines.map(r => {
              const remKey = r.ledgerCode || (r.glDescription ? Utils.slugify(r.glDescription) : 'line');
              const remData = remarksSummary[remKey] || { total: 0, open: 0, done: 0, items: [] };
              const visibleItems = (remData.items || []).filter(item => typeof Auth !== 'undefined' ? Auth.canViewRemark(item) : true);
              const openCount = visibleItems.filter(i => i.status !== 'done').length;
              const doneCount = visibleItems.filter(i => i.status === 'done').length;

              let taskBadgeHtml = '';
              const safeGlDesc = Utils.escapeJs(r.glDescription || '');
              if (openCount > 0) {
                taskBadgeHtml = `<button class="btn btn-warning btn-xs flex items-center gap-xs" style="padding: 2px 6px; font-size: 10px; border-radius: 10px; font-weight: 600; white-space: nowrap; flex-shrink: 0;" onclick="BudgetEntryModule.openLineRemarksModal('${yearId}', '${entity.id}', '${dept.id}', '${r.ledgerCode}', '${safeGlDesc}')" title="View open tasks & remarks">🟡 ${openCount}</button>`;
              } else if (doneCount > 0) {
                taskBadgeHtml = `<button class="btn btn-secondary btn-xs flex items-center gap-xs" style="padding: 2px 6px; font-size: 10px; border-radius: 10px; font-weight: 600; color: var(--success); border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.06); white-space: nowrap; flex-shrink: 0;" onclick="BudgetEntryModule.openLineRemarksModal('${yearId}', '${entity.id}', '${dept.id}', '${r.ledgerCode}', '${safeGlDesc}')" title="View resolved remarks">🟢 ✓</button>`;
              } else {
                taskBadgeHtml = `<button class="btn btn-ghost btn-xs flex items-center gap-xs text-tertiary" style="padding: 2px 5px; font-size: 10px; border-radius: 8px; white-space: nowrap; flex-shrink: 0;" onclick="BudgetEntryModule.openLineRemarksModal('${yearId}', '${entity.id}', '${dept.id}', '${r.ledgerCode}', '${safeGlDesc}')" title="Tag colleague or add action item">💬</button>`;
              }

              return `
                <tr data-ledger="${r.ledgerCode}" data-gldesc="${r.glDescription}">
                  <td class="sticky-col-1 font-bold"><strong>${r.parentAccount || ''}</strong></td>
                  <td class="sticky-col-2 font-medium">${r.glDescription || ''}</td>
                  <td><code>${r.ledgerCode || ''}</code></td>
                  <td><span class="badge ${r.linkedSource.includes('Travel') ? 'badge-cyan' : r.linkedSource.includes('Supplies') ? 'badge-primary' : r.linkedSource.includes('Communication') ? 'badge-info' : r.linkedSource.includes('Office') ? 'badge-warning' : r.linkedSource.includes('Professional') ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 11px; white-space: nowrap;">${r.sourceIcon} ${r.linkedSource}</span></td>
                  <td style="text-align: center; vertical-align: middle; padding: 4px 6px;">
                    ${r.entryCount > 0 ? `
                      <span class="badge badge-primary font-bold" style="font-size: 11px; padding: 3px 9px;" title="${r.entryCount} line item(s) populated in ${r.linkedSource}">
                        ${r.entryCount} ${r.entryCount === 1 ? 'item' : 'items'}
                      </span>
                    ` : `
                      <span class="text-tertiary font-mono" style="font-size: 11px;">0 items</span>
                    `}
                  </td>
                  <td class="num font-bold field-total-cy" style="color: ${r.totalCY > 0 ? 'var(--accent-primary)' : 'inherit'};">${Utils.formatNumber(r.totalCY || 0)}</td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="num month-col font-mono" style="${r.monthlyValues[idx] > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatNumber(r.monthlyValues[idx] || 0)}</td>
                  `).join('')}
                  <td class="num prior-cost-col font-mono" style="background: rgba(59, 130, 246, 0.03); color: ${r.priorCost > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'}; font-weight: ${r.priorCost > 0 ? '600' : 'normal'};">${r.priorCost > 0 ? Utils.formatNumber(r.priorCost) : '—'}</td>
                  <td class="editable remarks-cell" style="width: 240px; max-width: 240px; padding: 2px 6px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <input type="text" class="field-remarks" value="${Utils.escapeHtml(r.remarks || '')}" placeholder="Remarks" title="${Utils.escapeHtml(r.remarks || '')}" style="width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; height: 26px; padding: 2px 6px; font-size: 11.5px;" ${lockAttr}>
                      ${taskBadgeHtml}
                      <button type="button" class="btn btn-ghost btn-xs flex items-center gap-xs" style="padding: 2px 5px; font-size: 10px; border-radius: 8px; color: var(--text-secondary); border: 1px solid var(--border-subtle); background: var(--bg-surface); white-space: nowrap; flex-shrink: 0;" onclick="BudgetEntryModule.openLinePermissionsModal('${r.ledgerCode}', '${Utils.escapeHtml(r.glDescription)}', '${r.parentAccount || 'other-costs'}')" title="View and customize Roles & Permissions for this line item">🛡️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}

            <!-- ─── Monthly Totals at the Bottom of the List ─── -->
            <tr class="total-row">
              <td class="sticky-col-1 font-bold">TOTAL DEPT BUDGET:</td>
              <td class="sticky-col-2 font-bold text-right" style="padding-right: 16px;">(${entity.currency})</td>
              <td colspan="2"></td>
              <td style="text-align: center; vertical-align: middle;">
                <span class="badge badge-emerald font-bold" style="font-size: 11px; padding: 3px 10px;" title="Total individual line item entries across all department input sheets">
                  ${totalEntriesCount} Total ${totalEntriesCount === 1 ? 'Item' : 'Items'}
                </span>
              </td>
              <td class="num font-bold field-total-cy" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatCurrency(totalCost, entity.currency)}</td>
              ${SEED_DATA.months.map((m, idx) => `
                <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatNumber(colMonthlySums[idx] || 0)}</td>
              `).join('')}
              <td class="num prior-cost-col font-mono font-bold" style="background: rgba(59, 130, 246, 0.08); color: var(--accent-primary);">${Utils.formatNumber(totalPriorCost)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const table = container.querySelector('#totalCostTable');
    if (table) {
      table.addEventListener('change', (e) => {
        if (isLocked) return;
        if (e.target.classList.contains('field-remarks')) {
          const row = e.target.closest('tr');
          if (row) this.saveTotalCostRow(row, yearId, entity.id, dept.id);
        }
      });
    }
  },

  getActiveCategoryKey() {
    if (this.activeTab === 'total-costs') return 'total-dept-cost';
    if (this.activeTab === 'eha') return 'eha';
    if (this.activeTab === 'fixed-assets') return 'fixed-assets';
    if (this.activeTab === 'imp-tot') return 'imp-tot-rates';
    if (this.activeTab === 'personnel') {
      if (this.activePersonnelSubTab === 'other-staff-expenses') return 'other-staff';
      if (this.activePersonnelSubTab === 'gratuity-bonus') return 'gratuity';
      return 'salaries';
    }
    if (this.activeTab === 'other-costs') {
      if (this.activeOtherCostSubTab === 'tot' || this.activeOtherCostSubTab === 'imp-tot') return 'imp-tot-rates';
      return 'other-costs';
    }
    return 'other-costs';
  },

  async showDeptAuditTrail(entityId, deptId) {
    const logs = await db.getAuditLogs({ entityId, deptId });
    const content = `
      <div>
        <div class="card p-sm mb-md flex justify-between items-center" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2);">
          <div>
            <strong>Audit Trail for Department: <code>${(deptId || '').toUpperCase()}</code> (${(entityId || '').toUpperCase()})</strong>
            <div class="text-tertiary" style="font-size: 11px;">Showing ${logs.length} logged data entry, edit, and deletion events</div>
          </div>
        </div>

        <div class="table-container" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="5" class="text-center text-tertiary">No alteration records found for this department.</td></tr>' : logs.map(l => `
                <tr>
                  <td><code style="font-size: 11px;">${new Date(l.timestamp).toLocaleString()}</code></td>
                  <td><strong>${l.userName}</strong> (${l.userRole})</td>
                  <td><span class="badge ${l.action === 'CREATE' ? 'badge-emerald' : l.action === 'UPDATE' ? 'badge-primary' : l.action === 'DELETE' ? 'badge-danger' : 'badge-amber'}">${l.action}</span></td>
                  <td>${l.category}</td>
                  <td style="font-size: 12px;">${l.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    Utils.showModal(`Department Audit History — ${deptId?.toUpperCase()}`, content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-primary', textContent: 'Close', onClick: close }));
      }
    });
  },

  // ─── Add Row ───
  async addRow() {
    if (this.activeTab === 'total-costs') {
      Utils.showToast('Total Dept Cost is auto-aggregated from the input sheets. Please add items in Payroll, EHA, Fixed Assets, or Other Costs.', 'info');
      return;
    }

    const yearId = this._yearId || App.selectedYear || '2026';
    const entityId = this.currentEntityId;
    const deptId = this.currentDeptId;
    const categoryKey = this.getActiveCategoryKey();

    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      Utils.showToast(`🔒 Additions are disabled: Entity status is "${Auth.getYearStatusLabel(yearId, entityId)}". Only Draft or Active statuses permit additions.`, 'warning');
      return;
    }

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('add', { entityId, deptId, category: categoryKey })) {
      Utils.showToast('🔒 Unauthorized: You do not have permission to add rows to this category.', 'warning');
      return;
    }

    const storeMap = {
      'personnel': STORES.payrollPersonnel,
      'eha': STORES.payrollEHA,
      'fixed-assets': STORES.payrollFixedAsset,
      'other-costs': STORES.nonPayrollCost,
      'non-payroll': STORES.nonPayrollCost,
      'total-costs': STORES.totalCostSheet,
      'total-cost-sheet': STORES.totalCostSheet
    };

    const storeName = storeMap[this.activeTab];
    if (!storeName) {
      Utils.showToast('Unknown tab — cannot add row', 'error');
      return;
    }

    if (!entityId || !deptId) {
      Utils.showToast('Please select an Entity and Department first', 'warning');
      return;
    }

    const newRecord = {
      yearId,
      entityId,
      deptId,
      monthlyValues: {},
      totalCY: 0
    };

    if (this.activeTab === 'personnel') {
      newRecord.subCategory = this.activePersonnelSubTab || 'salaries-wages';
      newRecord.employeeStatus = 'New';
      newRecord.name = '';
      newRecord.employeeCode = '';
      newRecord.department = Utils.getDeptName(this._dept, this._entity?.deptPrefix) || '';
    } else if (this.activeTab === 'other-costs' || this.activeTab === 'non-payroll') {
      newRecord.subGroup = 'Operational Costs';
      newRecord.parentAccount = 'Other Expenses';
      newRecord.glDescription = 'Miscellaneous Expense Item';
      newRecord.ledgerCode = '93999';
      newRecord.basisOfExpense = '';
    }

    try {
      const newId = await db.add(storeName, newRecord);
      await db.logAudit({
        yearId,
        entityId,
        deptId,
        category: categoryKey,
        action: 'CREATE',
        recordId: newId,
        description: `Added new line item in ${categoryKey}`
      });
      Utils.showToast('New row added!', 'success');
    } catch (err) {
      console.error('addRow failed:', err);
      Utils.showToast('Failed to add row: ' + err.message, 'error');
      return;
    }

    // Re-render only the grid (preserves toolbar & tabs)
    if (this._entity && this._dept && this._budgetYear) {
      await this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth);
    } else {
      await App.renderCurrentPage();
    }
  },

  async deleteRow(storeName, id) {
    const yearId = this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    const entityId = this.currentEntityId;
    const deptId = this.currentDeptId;
    const categoryKey = this.getActiveCategoryKey();

    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      Utils.showToast(`🔒 Deletion is disabled: Entity status is "${Auth.getYearStatusLabel(yearId, entityId)}". Only Draft or Active statuses permit modifications.`, 'warning');
      return;
    }

    if (typeof Auth !== 'undefined' && !Auth.hasPermission('delete', { entityId, deptId, category: categoryKey })) {
      Utils.showToast('🔒 Unauthorized: You do not have permission to delete rows from this category.', 'warning');
      return;
    }

    if (await Utils.confirm('Delete this line item?')) {
      try {
        await db.delete(storeName, id);
        await db.logAudit({
          yearId: this._yearId || '2026',
          entityId,
          deptId,
          category: categoryKey,
          action: 'DELETE',
          recordId: id,
          description: `Deleted line item (ID: ${id}) from ${categoryKey}`
        });
        Utils.showToast('Row deleted', 'info');
      } catch (err) {
        console.error('deleteRow failed:', err);
        Utils.showToast('Failed to delete row: ' + err.message, 'error');
        return;
      }

      // Re-render only the grid (preserves toolbar & tabs)
      if (this._entity && this._dept && this._budgetYear) {
        await this.renderGrid(this._entity, this._dept, this._budgetYear, this._actualsMonth);
      } else {
        await App.renderCurrentPage();
      }
    }
  },

  // ─── Collaborative Line-Item Remarks, User Tagging & Tasks ───
  async openLineRemarksModal(yearId, entityId, deptId, ledgerCode, glDescription) {
    await db.ready;
    const allRemarks = await db.getLineRemarks(yearId, entityId, deptId, ledgerCode);
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : { id: 'admin', name: 'Admin', roleName: 'Administrator' };
    const visibleRemarks = allRemarks.filter(r => typeof Auth !== 'undefined' ? Auth.canViewRemark(r, currentUser) : true);
    const accessibleUsers = typeof Auth !== 'undefined' ? await Auth.getAccessibleUsersForDept(entityId, deptId) : [];

    const openCount = visibleRemarks.filter(r => r.status !== 'done').length;
    const doneCount = visibleRemarks.filter(r => r.status === 'done').length;

    const modalContent = `
      <div class="line-remarks-modal-content" style="max-height: 75vh; display: flex; flex-direction: column;">
        <div class="p-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08)); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
          <div>
            <div class="font-bold flex items-center gap-xs" style="font-size: 1.1rem; color: var(--text-primary);">
              <span>${Utils.escapeHtml(glDescription || 'Line Item')}</span>
              <code style="font-size: 12px; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">${ledgerCode || ''}</code>
            </div>
            <div class="text-tertiary mt-xs" style="font-size: 12px;">
              Entity: <strong>${entityId.toUpperCase()}</strong> · Department: <strong>${deptId}</strong> · Year: <strong>${yearId}</strong>
            </div>
          </div>
          <div class="flex gap-xs items-center">
            <span class="badge ${openCount > 0 ? 'badge-amber' : 'badge-subtle'}" style="font-size: 12px; font-weight: 600;">🟡 ${openCount} Open Task${openCount !== 1 ? 's' : ''}</span>
            <span class="badge ${doneCount > 0 ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 12px; font-weight: 600;">🟢 ${doneCount} Done</span>
          </div>
        </div>

        <!-- ─── Thread List ─── -->
        <div class="remarks-threads-list" style="overflow-y: auto; max-height: 360px; padding-right: 4px; display: flex; flex-direction: column; gap: 12px;">
          ${visibleRemarks.length === 0 ? `
            <div class="text-center p-lg" style="color: var(--text-tertiary); background: var(--bg-tertiary); border-radius: 8px; border: 1px dashed var(--border-color);">
              <div style="font-size: 1.8rem; margin-bottom: 6px;">💬</div>
              <div class="font-bold text-primary">No remarks or action items for this line item yet.</div>
              <div style="font-size: 12px; margin-top: 4px;">Use the form below to tag team members or record instructions.</div>
            </div>
          ` : visibleRemarks.map(r => {
            const isDone = r.status === 'done';
            return `
              <div class="card p-md remark-card ${isDone ? 'remark-resolved' : 'remark-open'}" style="border-radius: 8px; border-left: 4px solid ${isDone ? 'var(--success)' : 'var(--warning)'}; background: ${isDone ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-secondary)'};">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-xs">
                    <span class="badge ${isDone ? 'badge-emerald' : 'badge-amber'}" style="font-size: 11px;">
                      ${isDone ? '🟢 Resolved' : '🟡 Open Action Item'}
                    </span>
                    <strong style="font-size: 13px; color: var(--text-primary); margin-left: 4px;">${Utils.escapeHtml(r.assignedByUserName || 'Colleague')}</strong>
                    <span class="text-tertiary" style="font-size: 11px;">· ${Utils.formatDate(r.createdAt)}</span>
                  </div>
                  ${r.assignedToUserName ? `
                    <div class="flex items-center gap-xs">
                      <span class="badge badge-cyan" style="font-size: 11.5px; font-weight: 600;">
                        👤 Assigned to: ${Utils.escapeHtml(r.assignedToUserName)}
                      </span>
                    </div>
                  ` : ''}
                </div>

                <div class="remark-body mt-sm" style="font-size: 13.5px; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap;">${Utils.escapeHtml(r.text)}</div>

                ${isDone ? `
                  <div class="resolution-banner mt-sm p-sm" style="background: rgba(16, 185, 129, 0.08); border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 12px;">
                    <div class="font-bold text-success flex items-center gap-xs">
                      <span>✓ Marked as Done by <strong>${Utils.escapeHtml(r.resolvedByUserName || 'Team Member')}</strong></span>
                      <span class="text-tertiary font-normal">(${Utils.formatDate(r.resolvedAt)})</span>
                    </div>
                    ${r.resolutionNote ? `
                      <div class="mt-xs text-secondary" style="font-style: italic;">
                        "${Utils.escapeHtml(r.resolutionNote)}"
                      </div>
                    ` : ''}
                  </div>
                ` : ''}

                <div class="flex justify-end gap-sm mt-sm pt-xs" style="border-top: 1px solid var(--border-subtle);">
                  ${!isDone ? `
                    <button class="btn btn-success btn-xs flex items-center gap-xs" onclick="BudgetEntryModule.resolveRemarkPrompt('${r.id}', '${yearId}', '${entityId}', '${deptId}', '${ledgerCode}', '${Utils.escapeJs(glDescription)}')">
                      <span>✓ Mark as Done</span>
                    </button>
                  ` : `
                    <button class="btn btn-ghost btn-xs text-tertiary" onclick="BudgetEntryModule.reopenRemark('${r.id}', '${yearId}', '${entityId}', '${deptId}', '${ledgerCode}', '${Utils.escapeJs(glDescription)}')">
                      <span>↺ Reopen Thread</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- ─── New Remark / Tag Form ─── -->
        <div class="mt-md pt-md" style="border-top: 2px solid var(--border-color);">
          <div class="font-bold mb-xs" style="font-size: 13px; color: var(--text-secondary);">
            ➕ Add Remark / Assign Line Item Task
          </div>
          <textarea id="newRemarkInputText" class="form-control" placeholder="Write remark, query, or instruction for this line item..." rows="3" style="width: 100%; box-sizing: border-box; resize: vertical;"></textarea>

          <div class="grid grid-2 gap-md mt-sm">
            <div class="form-group mb-none">
              <label class="form-label" style="font-size: 12px; margin-bottom: 2px;">Tag / Assign To:</label>
              <select id="newRemarkAssigneeSelect" class="form-control" style="font-size: 12.5px; padding: 6px 10px;">
                <option value="">-- No specific assignee (General note) --</option>
                ${accessibleUsers.map(u => `
                  <option value="${u.id}" data-name="${Utils.escapeHtml(u.name)}" data-rolelevel="${typeof Auth !== 'undefined' ? Auth.getUserHierarchyLevel(u) : 10}">
                    ${u.avatar || '👤'} ${u.name} (${u.roleName || u.title || 'Member'})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none flex items-end">
              <button class="btn btn-primary btn-sm flex items-center gap-xs w-full justify-center" style="height: 36px;" onclick="BudgetEntryModule.saveNewRemark('${yearId}', '${entityId}', '${deptId}', '${ledgerCode}', '${Utils.escapeJs(glDescription)}')">
                <span>💬 Post Remark & Assign</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    Utils.showModal(`Line Item Remarks: ${glDescription || ''}`, modalContent, [{ label: 'Close', class: 'btn-secondary', onclick: () => Utils.closeModal() }], 'modal-lg');
  },

  async saveNewRemark(yearId, entityId, deptId, ledgerCode, glDescription) {
    const textEl = document.getElementById('newRemarkInputText');
    const text = textEl?.value?.trim();
    if (!text) {
      Utils.showToast('Please enter a remark or query text.', 'warning');
      return;
    }

    const selectEl = document.getElementById('newRemarkAssigneeSelect');
    const assignedToUserId = selectEl?.value || null;
    const selectedOption = selectEl?.options[selectEl.selectedIndex];
    const assignedToUserName = assignedToUserId ? (selectedOption?.dataset?.name || selectEl?.selectedOptions[0]?.text?.trim()) : null;

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : { id: 'admin', name: 'Admin', roleName: 'Administrator' };
    const authorLevel = typeof Auth !== 'undefined' ? Auth.getUserHierarchyLevel(currentUser) : 100;

    try {
      await db.saveLineRemark({
        yearId,
        entityId,
        deptId,
        ledgerCode,
        glDescription,
        text,
        assignedByUserId: currentUser.id,
        assignedByUserName: currentUser.name,
        assignedByRoleLevel: authorLevel,
        assignedToUserId,
        assignedToUserName,
        status: 'open'
      });

      Utils.showToast(assignedToUserName ? `Remark assigned to ${assignedToUserName}` : 'Remark saved', 'success');

      if (typeof App !== 'undefined' && App.updateNotificationBadge) {
        await App.updateNotificationBadge();
      }

      // Refresh remarks modal
      await this.openLineRemarksModal(yearId, entityId, deptId, ledgerCode, glDescription);

      // Re-render total costs table to update counts
      if (this._entity && this._dept && this._budgetYear) {
        await this.renderTotalCostGrid(this._entity, this._dept, this._budgetYear);
      }
    } catch (err) {
      console.error('saveNewRemark failed:', err);
      Utils.showToast('Failed to save remark: ' + err.message, 'error');
    }
  },

  async resolveRemarkPrompt(remarkId, yearId, entityId, deptId, ledgerCode, glDescription) {
    const promptModal = `
      <div>
        <p style="margin-bottom: 12px; font-size: 13.5px;">Provide an optional closing resolution note or summary:</p>
        <textarea id="remarkResolutionNoteInput" class="form-control" placeholder="e.g. Verified with hotel vendor and adjusted headcount..." rows="3" style="width: 100%; box-sizing: border-box;"></textarea>
      </div>
    `;

    Utils.showModal('Mark Remark as Done', promptModal, [
      { label: 'Cancel', class: 'btn-secondary', onclick: () => Utils.closeModal() },
      {
        label: '✓ Confirm Mark as Done',
        class: 'btn-success',
        onclick: async () => {
          const noteEl = document.getElementById('remarkResolutionNoteInput');
          const note = noteEl?.value?.trim() || 'Marked as Done';
          const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
          await db.resolveLineRemark(remarkId, note, currentUser);
          Utils.showToast('Remark marked as Done', 'success');
          Utils.closeModal();
          if (typeof App !== 'undefined' && App.updateNotificationBadge) {
            await App.updateNotificationBadge();
          }
          await this.openLineRemarksModal(yearId, entityId, deptId, ledgerCode, glDescription);
          if (this._entity && this._dept && this._budgetYear) {
            await this.renderTotalCostGrid(this._entity, this._dept, this._budgetYear);
          }
        }
      }
    ]);
  },

  async reopenRemark(remarkId, yearId, entityId, deptId, ledgerCode, glDescription) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    await db.reopenLineRemark(remarkId, 'Reopened for further discussion', currentUser);
    Utils.showToast('Remark reopened', 'info');
    if (typeof App !== 'undefined' && App.updateNotificationBadge) {
      await App.updateNotificationBadge();
    }
    await this.openLineRemarksModal(yearId, entityId, deptId, ledgerCode, glDescription);
    if (this._entity && this._dept && this._budgetYear) {
      await this.renderTotalCostGrid(this._entity, this._dept, this._budgetYear);
    }
  },

  async openLinePermissionsModal(ledgerCode, glDescription, parentAccount = 'other-costs') {
    await db.ready;
    const roles = await db.getRoles();
    const users = await db.getUsers();
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : { id: 'admin', isAdmin: true };
    const isAdmin = currentUser?.isAdmin || currentUser?.roleId === 'role-admin';

    const lineKey = ledgerCode ? String(ledgerCode).trim() : (glDescription ? Utils.slugify(glDescription) : 'line');

    const modalContent = `
      <div class="line-perm-modal-container" style="max-height: 80vh; display: flex; flex-direction: column;">
        <!-- Header Banner -->
        <div class="p-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(124, 58, 237, 0.08)); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
          <div>
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--accent-primary);">🛡️ Line-Item Security & RBAC</div>
            <div class="font-bold flex items-center gap-xs" style="font-size: 1.2rem; color: var(--text-primary); margin-top: 2px;">
              <span>${Utils.escapeHtml(glDescription || 'Line Item')}</span>
              ${ledgerCode ? `<code style="font-size: 13px;">${ledgerCode}</code>` : ''}
            </div>
            <div class="text-tertiary mt-xs" style="font-size: 12px;">
              Parent Account: <strong>${Utils.escapeHtml(parentAccount || 'Operating Expenses')}</strong>
            </div>
          </div>
          <div>
            ${isAdmin ? `<span class="badge badge-emerald" style="padding: 6px 12px; font-size: 12px;">⚙️ Admin Editable</span>` : `<span class="badge badge-subtle" style="padding: 6px 12px; font-size: 12px;">👁️ View Mode</span>`}
          </div>
        </div>

        <p class="text-secondary mb-sm" style="font-size: 12px;">
          Configure which roles and individual employees can <strong>view, add, edit, delete, remarks, review, approve,</strong> and <strong>finalize</strong> this specific line item:
        </p>

        <!-- Role Permissions Table -->
        <div class="card p-xs mb-md" style="border: 1px solid var(--border-default);">
          <div class="card-header p-xs mb-xs flex justify-between items-center" style="border-bottom: 1px solid var(--border-subtle);">
            <strong style="font-size: 12.5px;">🛡️ Role-Level Permissions for this Line Item</strong>
            ${isAdmin ? `
              <div class="flex gap-xs">
                <button type="button" class="btn btn-ghost btn-xs" onclick="document.querySelectorAll('.line-role-cb').forEach(c => c.checked = true)">✓ Grant All</button>
                <button type="button" class="btn btn-ghost btn-xs text-danger" onclick="document.querySelectorAll('.line-role-cb').forEach(c => c.checked = false)">✗ Clear All</button>
              </div>
            ` : ''}
          </div>

          <div class="table-container" style="max-height: 240px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th style="min-width: 160px;">Role</th>
                  ${Auth.OPERATIONS.map(op => `<th style="text-align: center; min-width: 60px;">${op.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${roles.map(r => {
                  const roleLinePerm = r.lineItemPermissions?.[lineKey] || r.permissions?.[parentAccount] || r.permissions?.['other-costs'] || {};
                  return `
                    <tr data-role-id="${r.id}">
                      <td>
                        <strong>${r.name}</strong>
                        <span class="badge badge-${r.badgeColor || 'subtle'}" style="font-size: 10px; margin-left: 4px;">${r.isSystem ? 'System' : 'Custom'}</span>
                      </td>
                      ${Auth.OPERATIONS.map(op => `
                        <td style="text-align: center;">
                          <input type="checkbox" class="line-role-cb" data-role-id="${r.id}" data-op="${op.key}" ${roleLinePerm[op.key] ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} style="cursor: ${isAdmin ? 'pointer' : 'default'};">
                        </td>
                      `).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- User Overrides Section -->
        <div class="card p-xs" style="border: 1px solid var(--border-default);">
          <div class="card-header p-xs mb-xs flex justify-between items-center" style="border-bottom: 1px solid var(--border-subtle);">
            <strong style="font-size: 12.5px;">👤 User-Specific Custom Overrides for this Line Item</strong>
            <span class="text-tertiary" style="font-size: 11px;">Overrides role standard for specific employees</span>
          </div>

          <div class="table-container" style="max-height: 200px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th style="min-width: 180px;">Employee / User</th>
                  <th style="min-width: 120px;">Role</th>
                  ${Auth.OPERATIONS.map(op => `<th style="text-align: center; min-width: 60px;">${op.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${users.map(u => {
                  const userOverride = u.lineItemOverrides?.[lineKey] || {};
                  const userRole = roles.find(r => r.id === u.roleId) || { name: u.roleId };
                  const effectivePerms = {
                    ...(userRole.lineItemPermissions?.[lineKey] || userRole.permissions?.[parentAccount] || userRole.permissions?.['other-costs'] || {}),
                    ...userOverride
                  };

                  return `
                    <tr data-user-id="${u.id}">
                      <td>
                        <div class="flex items-center gap-xs">
                          <span>${u.avatar || '👤'}</span>
                          <div>
                            <strong>${u.name}</strong>
                            <div class="text-tertiary" style="font-size: 10.5px;">${u.title || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge badge-subtle" style="font-size: 10.5px;">${userRole.name}</span></td>
                      ${Auth.OPERATIONS.map(op => `
                        <td style="text-align: center;">
                          <input type="checkbox" class="line-user-cb" data-user-id="${u.id}" data-op="${op.key}" ${effectivePerms[op.key] ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} style="cursor: ${isAdmin ? 'pointer' : 'default'};">
                        </td>
                      `).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const buttons = [
      { label: 'Close', class: 'btn-secondary', onclick: () => Utils.closeModal() }
    ];

    if (isAdmin) {
      buttons.push({
        label: '💾 Save Line-Item Permissions',
        class: 'btn-primary',
        onclick: async () => {
          // Save role permissions
          for (const r of roles) {
            const rolePerms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = document.querySelector(`.line-role-cb[data-role-id="${r.id}"][data-op="${op.key}"]`);
              rolePerms[op.key] = cb ? cb.checked : false;
            });
            // Logical RBAC Rule: If view is false, all other operations must be false
            if (!rolePerms.view) {
              Auth.OPERATIONS.forEach(op => { rolePerms[op.key] = false; });
            }
            await Auth.saveLineItemRolePermissions(r.id, lineKey, rolePerms);
          }

          // Save user overrides
          for (const u of users) {
            const userPerms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = document.querySelector(`.line-user-cb[data-user-id="${u.id}"][data-op="${op.key}"]`);
              userPerms[op.key] = cb ? cb.checked : false;
            });
            // Logical RBAC Rule: If view is false, all other operations must be false
            if (!userPerms.view) {
              Auth.OPERATIONS.forEach(op => { userPerms[op.key] = false; });
            }
            await Auth.saveLineItemUserOverride(u.id, lineKey, userPerms);
          }

          Utils.showToast(`Line-Item permissions saved for "${glDescription || lineKey}"`, 'success');
          Utils.closeModal();
          if (this._entity && this._dept && this._budgetYear) {
            await this.renderTotalCostGrid(this._entity, this._dept, this._budgetYear);
          }
        }
      });
    }

    Utils.showModal(`Line Item Roles & Permissions — ${glDescription || ledgerCode}`, modalContent, buttons, 'modal-lg');

    // Attach View Cascade Listeners inside Line Permissions Modal
    setTimeout(() => {
      document.querySelectorAll('.line-role-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const roleId = e.target.getAttribute('data-role-id');
          const op = e.target.getAttribute('data-op');
          if (op === 'view' && !e.target.checked) {
            document.querySelectorAll(`.line-role-cb[data-role-id="${roleId}"]:not([data-op="view"])`).forEach(s => {
              s.checked = false;
            });
          } else if (op !== 'view' && e.target.checked) {
            const viewCb = document.querySelector(`.line-role-cb[data-role-id="${roleId}"][data-op="view"]`);
            if (viewCb) viewCb.checked = true;
          }
        });
      });

      document.querySelectorAll('.line-user-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const userId = e.target.getAttribute('data-user-id');
          const op = e.target.getAttribute('data-op');
          if (op === 'view' && !e.target.checked) {
            document.querySelectorAll(`.line-user-cb[data-user-id="${userId}"]:not([data-op="view"])`).forEach(s => {
              s.checked = false;
            });
          } else if (op !== 'view' && e.target.checked) {
            const viewCb = document.querySelector(`.line-user-cb[data-user-id="${userId}"][data-op="view"]`);
            if (viewCb) viewCb.checked = true;
          }
        });
      });
    }, 100);
  },

  // ─── Auto-Populate Department Employees from Employee Master ───
  async autoPopulateDeptEmployees() {
    const yearId = this._yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026');
    const entityId = this.currentEntityId;
    if (typeof Auth !== 'undefined' && !Auth.isYearEditable(yearId, entityId)) {
      Utils.showToast(`🔒 Auto-population is disabled: Entity status is "${Auth.getYearStatusLabel(yearId, entityId)}". Only Draft or Active statuses permit additions.`, 'warning');
      return;
    }

    const entity = this._entity || (await db.getEntity(this.currentEntityId));
    const dept = this._dept || (await db.getDepartment(this.currentDeptId));
    if (!entity || !dept) {
      Utils.showToast('Please select a valid entity and department first.', 'warning');
      return;
    }

    const normDept = (s) => String(s || '').toLowerCase().replace(/^in-|^us-|^bd-|^indo-|^np-/, '').replace(/[^a-z0-9]/g, '');
    const targetDeptCode = normDept(dept.id || dept.codeTemplate || dept.name);

    // Get all master employees
    const allMaster = await db.getEmployeesMaster();
    
    // Find matching employees for current entity and department
    let matchedEmployees = allMaster.filter(e => {
      if (e.status === 'Inactive') return false;
      if (e.entityId && entity.id && e.entityId.toLowerCase() !== entity.id.toLowerCase()) return false;
      
      const empDept = normDept(e.deptId || e.department);
      return empDept === targetDeptCode || (empDept && targetDeptCode && (empDept.includes(targetDeptCode) || targetDeptCode.includes(empDept)));
    });

    if (matchedEmployees.length === 0) {
      // If no strict department match, check all active employees for this entity
      const entityEmps = allMaster.filter(e => (!e.entityId || e.entityId === entity.id) && e.status !== 'Inactive');
      if (entityEmps.length === 0) {
        Utils.showToast(`No employee records found in Employee Master for ${entity.shortName}. Please add employees in Config > Employees Master.`, 'warning');
        return;
      }

      const confirmAll = confirm(`No employees specifically tagged to "${Utils.getDeptName(dept, entity.deptPrefix)}" in Employee Master.\n\nWould you like to auto-populate from all ${entityEmps.length} active employees in ${entity.shortName}?`);
      if (!confirmAll) return;
      matchedEmployees = entityEmps;
    }

    // Get existing records in this department budget
    const existingRecords = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);
    const existingNames = new Set(existingRecords.filter(r => (!r.subCategory || r.subCategory === 'salaries-wages')).map(r => String(r.name || '').trim().toLowerCase()));

    const locations = this._locations || (await db.getLocationsForEntity(entity.id));
    const donors = this._donors || (await db.getDonorsForEntity(entity.id));
    const activities = this._activities || (await db.getAll(STORES.activities));
    const conditionAreas = this._conditionAreas || (await db.getAll(STORES.conditionAreas));

    let addedCount = 0;
    for (const emp of matchedEmployees) {
      if (existingNames.has(String(emp.name || '').trim().toLowerCase())) {
        continue; // Skip if already present in department budget
      }

      const aCTC = Utils.parseNumber(emp.annualCTC) || 0;
      const mCTC = Utils.parseNumber(emp.monthlyCTC) || (aCTC > 0 ? Math.round(aCTC / 12) : 0);

      const record = {
        yearId: String(yearId),
        entityId: entity.id,
        deptId: dept.id,
        subCategory: 'salaries-wages',
        employeeStatus: 'Existing',
        name: emp.name,
        employeeCode: emp.employeeCode || '',
        department: emp.department || emp.deptId || Utils.getDeptName(dept, entity.deptPrefix) || '',
        designation: emp.designation || '',
        dateOfJoining: emp.doj || '',
        banding: emp.band || 'NH3',
        level: emp.level || 'Level 1',
        currentMonthlyCTC: mCTC,
        newMonthlyCTC: mCTC,
        incrementPct: 0,
        incrementValue: 0,
        monthlyValues: Array(12).fill(mCTC),
        totalCY: mCTC * 12,
        location: emp.location || (locations[0]?.name || ''),
        donor: emp.donor || (donors[0]?.name || ''),
        activity: emp.activity || (activities[0]?.name || ''),
        conditionArea: emp.conditionArea || (conditionAreas[0]?.name || ''),
        remarks: ''
      };

      await db.add(STORES.payrollPersonnel, record);
      await db.logAudit({
        yearId: String(yearId),
        entityId: entity.id,
        deptId: dept.id,
        category: 'salaries',
        action: 'CREATE',
        description: `Auto-populated employee "${emp.name}" from Employee Master`
      });
      addedCount++;
    }

    if (addedCount > 0) {
      Utils.showToast(`✓ Auto-populated ${addedCount} employee${addedCount > 1 ? 's' : ''} from Employee Master for ${Utils.getDeptName(dept, entity.deptPrefix)}!`, 'success');
      await this.renderPersonnelGrid(this._container || Utils.$('#gridContainer'), yearId, entity, dept, this._budgetYear || 2026, locations, donors, activities, conditionAreas);
    } else {
      Utils.showToast(`All ${matchedEmployees.length} matching employees from Employee Master are already populated in this budget!`, 'info');
    }
  }
};

window.BudgetEntryModule = BudgetEntryModule;
