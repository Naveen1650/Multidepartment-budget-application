// ============================================================
// NOORA HEALTH BUDGET APP — Configuration Module
// Admin management for Entities, Departments, Budget Years,
// Dimensions (Location, Donor, Activity, Condition Area), and COA
// ============================================================

const ConfigModule = {

  // ─── 1. Entities Configuration ───
  async renderEntities(container) {
    const entities = await db.getAll(STORES.entities);

    container.innerHTML = `
      <div class="page-header">
        <h2>Entities Configuration</h2>
        <p>Manage legal entities and country budgets across the organization</p>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div>
            <div class="card-title">Legal Entities (${entities.length})</div>
            <div class="card-subtitle">Each entity maintains its local currency budget and department structure</div>
          </div>
          <button class="btn btn-primary" id="addEntityBtn">+ Add Entity</button>
        </div>

        <div class="config-list" id="entitiesList">
          ${entities.map(e => `
            <div class="config-list-item">
              <div class="item-info">
                <span style="font-size: 1.5rem;">${e.flag || '🏳️'}</span>
                <div>
                  <div class="item-name">${e.name} <span class="badge badge-cyan">${e.shortName}</span></div>
                  <div class="item-detail">Country: ${e.country} | Currency: <strong>${e.currency}</strong> | Dept Prefix: <code>${e.deptPrefix}</code></div>
                </div>
              </div>
              <div class="item-actions">
                <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editEntity('${e.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteEntity('${e.id}')">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Utils.$('#addEntityBtn').addEventListener('click', () => this.showEntityForm());
  },

  async showEntityForm(entity = null) {
    const isEdit = !!entity;
    const budgetYears = await db.getAll(STORES.budgetYears);
    const firstYear = budgetYears[0];
    const defaultRateMap = { INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5, KES: 130.0, PHP: 58.0, GBP: 0.78, EUR: 0.92, SGD: 1.35, CAD: 1.38, AUD: 1.52, NGN: 1600 };
    const existingRate = entity?.currency ? (firstYear?.conversionRates?.[entity.currency] || defaultRateMap[entity.currency] || 1.0) : 83.5;

    const content = `
      <form id="entityForm">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Full Entity Name</label>
          <input type="text" class="form-input" id="entityName" value="${entity?.name || ''}" placeholder="e.g. Noora Health Kenya" required>
        </div>
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Short Name / Entity Code</label>
            <input type="text" class="form-input" id="entityShort" value="${entity?.shortName || ''}" placeholder="e.g. NH Kenya" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Country Code (Dept Prefix)</label>
            <input type="text" class="form-input" id="entityPrefix" value="${entity?.deptPrefix || ''}" placeholder="e.g. KE" required>
          </div>
        </div>
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Country</label>
            <input type="text" class="form-input" id="entityCountry" value="${entity?.country || ''}" placeholder="e.g. Kenya" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Local Currency</label>
            <input type="text" class="form-input" id="entityCurrency" value="${entity?.currency || ''}" placeholder="e.g. KES" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Flag Emoji</label>
            <input type="text" class="form-input" id="entityFlag" value="${entity?.flag || '🇰🇪'}" placeholder="e.g. 🇰🇪">
          </div>
        </div>
        <div class="form-group" style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 8px;">
          <label class="form-label font-bold" style="color: var(--accent-primary);">💱 Pre-Approved USD Exchange Rate (1 USD = ? Local Currency)</label>
          <div class="flex items-center gap-sm">
            <span style="font-weight: 700; font-size: 13px;">1 USD =</span>
            <input type="number" step="any" class="form-input" id="entityExchangeRate" value="${existingRate}" placeholder="e.g. 130.0" required style="font-family: monospace; font-weight: 700; max-width: 180px;">
            <span id="rateCurrencyLabel" style="font-weight: 700; color: var(--text-secondary);">${entity?.currency || 'Local Currency'}</span>
          </div>
          <small class="text-tertiary" style="font-size: 11px; display: block; margin-top: 4px;">
            This exchange rate is automatically synchronized across all existing and future budget cycles.
          </small>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? 'Edit Entity' : 'Add New Entity', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-ghost', textContent: 'Cancel', onClick: close
        }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: isEdit ? 'Save Changes' : 'Add Entity',
          onClick: async () => {
            const currency = Utils.$('#entityCurrency').value.trim().toUpperCase();
            const rateNum = parseFloat(Utils.$('#entityExchangeRate').value) || 1.0;
            const data = {
              id: entity?.id || Utils.slugify(Utils.$('#entityShort').value),
              name: Utils.$('#entityName').value.trim(),
              shortName: Utils.$('#entityShort').value.trim(),
              deptPrefix: Utils.$('#entityPrefix').value.trim().toUpperCase(),
              countryCode: Utils.$('#entityPrefix').value.trim().toUpperCase(),
              country: Utils.$('#entityCountry').value.trim(),
              currency: currency,
              flag: Utils.$('#entityFlag').value.trim() || '🏳️'
            };

            await db.put(STORES.entities, data);

            // 1. Synchronize currency conversion rates across all budget years
            const allYears = await db.getAll(STORES.budgetYears);
            for (const y of allYears) {
              if (!y.conversionRates) y.conversionRates = { USD: 1.0 };
              y.conversionRates[currency] = rateNum;
              await db.put(STORES.budgetYears, y);
            }

            // 2. Automatically initialize department mappings for the new entity
            const departments = await db.getAll(STORES.departments);
            for (const y of allYears) {
              for (const dept of departments) {
                const configKey = `${y.id}_${data.id}_${dept.id}`;
                const existing = await db.get(STORES.entityDeptConfig, configKey);
                if (!existing) {
                  await db.put(STORES.entityDeptConfig, {
                    id: configKey,
                    yearId: String(y.id),
                    entityId: data.id,
                    deptId: dept.id,
                    isActive: true
                  });
                }
              }
            }

            // 3. Initialize default location & donor for the new entity if missing
            const locs = await db.getAll(STORES.locations);
            if (!locs.some(l => l.entityId === data.id)) {
              await db.add(STORES.locations, { entityId: data.id, name: `${data.country} — National / HQ Office` });
            }
            const donors = await db.getAll(STORES.donors);
            if (!donors.some(d => d.entityId === data.id)) {
              await db.add(STORES.donors, { entityId: data.id, name: 'Unrestricted General Fund' });
            }

            // 4. Audit Log
            await db.logAudit({
              category: 'config',
              action: isEdit ? 'UPDATE_ENTITY' : 'CREATE_ENTITY',
              recordId: data.id,
              description: `${isEdit ? 'Updated' : 'Created'} entity "${data.name}" (${data.shortName}) with currency ${data.currency} @ rate ${rateNum}/USD`,
              changes: { ...data, exchangeRate: rateNum }
            });

            Utils.showToast(`Entity "${data.shortName}" (${data.currency} @ ${rateNum}/USD) saved & synchronized everywhere!`, 'success');
            close();
            if (typeof App !== 'undefined') {
              if (App.populateGlobalSelectors) await App.populateGlobalSelectors();
              if (App.renderCurrentPage) await App.renderCurrentPage();
            }
          }
        }));
      }
    });
  },

  async editEntity(id) {
    const entity = await db.get(STORES.entities, id);
    if (entity) await this.showEntityForm(entity);
  },

  async deleteEntity(id) {
    const entity = await db.get(STORES.entities, id);
    if (!entity) return;
    if (await Utils.confirm(`Are you sure you want to delete entity "${entity.shortName}"? This will also remove associated department mappings.`)) {
      await db.delete(STORES.entities, id);

      // Clean up entityDeptConfig for this entity (local)
      const allConfigs = await db.getAll(STORES.entityDeptConfig);
      for (const cfg of allConfigs) {
        if (cfg.entityId === id) {
          await db.delete(STORES.entityDeptConfig, cfg.id);
        }
      }

      // Clean up entityDeptConfig and entity from cloud database
      if (typeof CloudSyncModule !== 'undefined' && CloudSyncModule._client) {
        try {
          await CloudSyncModule.deleteEntityFromCloud(id);
        } catch (e) {
          console.warn('Cloud delete for entity failed:', e);
        }
      }

      await db.logAudit({
        category: 'config',
        action: 'DELETE_ENTITY',
        recordId: id,
        description: `Deleted entity "${entity.shortName}" (${entity.name})`
      });

      Utils.showToast(`Entity "${entity.shortName}" deleted`, 'info');
      if (typeof App !== 'undefined') {
        if (App.populateGlobalSelectors) await App.populateGlobalSelectors();
        if (App.renderCurrentPage) await App.renderCurrentPage();
      }
    }
  },

  // ─── 2. Departments Configuration ───
  deptScopeFilter: 'all',
  deptSearchQuery: '',

  async toggleDeptTotAccess(deptId, forcedState = null) {
    const dept = await db.get(STORES.departments, deptId);
    if (!dept) return;
    const currentState = dept.hasTotAccess !== undefined ? Boolean(dept.hasTotAccess) : false;
    const newState = forcedState !== null ? Boolean(forcedState) : !currentState;
    
    // Safety check & user notification
    if (!newState) {
      const allTotEvents = (await db.getAll(STORES.impTotEvents)) || [];
      const deptTotEvents = allTotEvents.filter(e => String(e.deptId || e.dept_id) === String(deptId));
      if (deptTotEvents.length > 0) {
        const years = [...new Set(deptTotEvents.map(e => e.yearId || e.year_id || '2026'))];
        Utils.showToast(`⚠️ Notice: Department "${dept.name}" has ${deptTotEvents.length} existing ToT budget event(s) recorded in CY-${years.join(', CY-')}. ToT Template access is now disabled and will be hidden from Other Costs.`, 'warning', 6500);
      } else {
        Utils.showToast(`🚫 Disabled ToT Budget Template for "${dept.name}"`, 'info');
      }
    } else {
      Utils.showToast(`🎯 Enabled ToT Budget Template for "${dept.name}"`, 'success');
    }

    await db.setDepartmentTotAccess(deptId, newState);

    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      if (this.impRateActiveTab === 'departments' || (typeof App !== 'undefined' && App.currentPage === 'config-imp-rates')) {
        this.renderImpUnitRates(pageContent);
      } else if (typeof App !== 'undefined' && App.currentPage === 'config-departments') {
        this.renderDepartments(pageContent);
      }
    }
  },

  async bulkToggleDeptTotAccess(enableAll) {
    const depts = await db.getAll(STORES.departments);
    const ids = depts.map(d => d.id);
    await db.bulkSetDepartmentsTotAccess(ids, enableAll);
    Utils.showToast(`${enableAll ? '🎯 Enabled ToT for all' : '🚫 Disabled ToT for all'} ${ids.length} departments!`, 'success');
    if (typeof ImpTotModule !== 'undefined' && ImpTotModule._totDeptCache) {
      ids.forEach(id => { ImpTotModule._totDeptCache[id.toLowerCase()] = enableAll; });
    }
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      if (this.impRateActiveTab === 'departments' || (typeof App !== 'undefined' && App.currentPage === 'config-imp-rates')) {
        this.renderImpUnitRates(pageContent);
      } else if (typeof App !== 'undefined' && App.currentPage === 'config-departments') {
        this.renderDepartments(pageContent);
      }
    }
  },

  async resetDeptTotAccessToDefaults() {
    const depts = await db.getAll(STORES.departments);
    for (const d of depts) {
      await db.setDepartmentTotAccess(d.id, false);
      if (typeof ImpTotModule !== 'undefined' && ImpTotModule._totDeptCache) {
        ImpTotModule._totDeptCache[d.id.toLowerCase()] = false;
      }
    }
    Utils.showToast('🔄 Reset all departments: ToT access is disabled by default. Enable only the specific departments you need!', 'info');
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      if (this.impRateActiveTab === 'departments' || (typeof App !== 'undefined' && App.currentPage === 'config-imp-rates')) {
        this.renderImpUnitRates(pageContent);
      } else if (typeof App !== 'undefined' && App.currentPage === 'config-departments') {
        this.renderDepartments(pageContent);
      }
    }
  },

  async renderDepartments(container) {
    const allDepartments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const entities = await db.getAll(STORES.entities);

    // Filter departments by search and scope
    const q = (this.deptSearchQuery || '').toLowerCase().trim();
    const filteredDepts = allDepartments.filter(d => {
      const matchScope = this.deptScopeFilter === 'all' || d.scope === this.deptScopeFilter;
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.codeTemplate.toLowerCase().includes(q) || (d.number && d.number.includes(q)) || d.id.toLowerCase().includes(q);
      return matchScope && matchSearch;
    });

    container.innerHTML = `
      <div class="page-header flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
        <div>
          <h2>Departments Master Configuration</h2>
          <p>Define global, digital product, and country-specific department templates, numbering, and code formats</p>
        </div>
        <div class="flex gap-xs">
          <button class="btn btn-primary font-bold" id="addDeptBtn">➕ + Add Department</button>
        </div>
      </div>

      <!-- Filter and Search Toolbar -->
      <div class="card p-sm mb-md flex justify-between items-center" style="background: var(--bg-secondary); border: 1px solid var(--border-default); flex-wrap: wrap; gap: 10px;">
        <div class="flex items-center gap-sm" style="flex-wrap: wrap;">
          <input type="text" class="form-input" id="deptSearchInput" value="${this.deptSearchQuery || ''}" placeholder="🔍 Search department by name or code..." style="max-width: 280px; font-size: 12.5px;">
          
          <select class="form-select" id="deptScopeFilterSelect" style="max-width: 200px; font-size: 12.5px;">
            <option value="all" ${this.deptScopeFilter === 'all' ? 'selected' : ''}>🌐 All Department Scopes</option>
            <option value="country" ${this.deptScopeFilter === 'country' ? 'selected' : ''}>🏢 Country Specific</option>
            <option value="gl" ${this.deptScopeFilter === 'gl' ? 'selected' : ''}>🌍 Global (GL)</option>
            <option value="dp-cp" ${this.deptScopeFilter === 'dp-cp' ? 'selected' : ''}>📱 Digital Product (Country)</option>
            <option value="dp-gp" ${this.deptScopeFilter === 'dp-gp' ? 'selected' : ''}>📱 Digital Product (Global)</option>
            <option value="general" ${this.deptScopeFilter === 'general' ? 'selected' : ''}>🏷️ General / Cross-Cutting</option>
          </select>
        </div>
        <div class="text-tertiary" style="font-size: 12px;">
          Showing <strong>${filteredDepts.length}</strong> of <strong>${allDepartments.length}</strong> departments
        </div>
      </div>

      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Master Department Templates (${filteredDepts.length})</div>
            <div class="card-subtitle">Manage department codes, numbering, and organizational scopes</div>
          </div>
        </div>

        <div class="config-list" id="departmentsList">
          ${filteredDepts.length === 0 ? `
            <div class="p-lg text-center text-secondary">
              No departments found matching the selected search or filter criteria.
            </div>
          ` : filteredDepts.map(d => {
            const scopeBadges = {
              'country': '<span class="badge badge-cyan">Country Specific</span>',
              'gl': '<span class="badge badge-violet">Global</span>',
              'dp-gp': '<span class="badge badge-amber">Digital Product (Global)</span>',
              'dp-cp': '<span class="badge badge-emerald">Digital Product (Country)</span>',
              'general': '<span class="badge">General</span>'
            };

            return `
              <div class="config-list-item">
                <div class="item-info">
                  <div>
                    <div class="item-name flex items-center gap-xs" style="flex-wrap: wrap;">
                      <span>${d.number ? d.number + '. ' : ''}<code>${d.codeTemplate}</code> — <strong>${d.name}</strong></span>
                      ${scopeBadges[d.scope] || ''}
                    </div>
                    <div class="item-detail mt-xs">Scope: <code>${d.scope}</code> | Code Template: <code>${d.codeTemplate}</code> | ID: <code>${d.id}</code></div>
                  </div>
                </div>
                <div class="item-actions flex items-center gap-xs">
                  <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editDepartment('${d.id}')">✏️ Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDepartment('${d.id}')">🗑️ Delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    Utils.$('#addDeptBtn')?.addEventListener('click', () => this.showDeptForm());
    
    // Attach event listeners for search and filters
    const searchInput = container.querySelector('#deptSearchInput');
    searchInput?.addEventListener('input', (e) => {
      this.deptSearchQuery = e.target.value;
      if (this._deptSearchTimer) clearTimeout(this._deptSearchTimer);
      this._deptSearchTimer = setTimeout(() => this.renderDepartments(container), 200);
    });

    const scopeSelect = container.querySelector('#deptScopeFilterSelect');
    scopeSelect?.addEventListener('change', (e) => {
      this.deptScopeFilter = e.target.value;
      this.renderDepartments(container);
    });
  },

  showDeptForm(dept = null) {
    const isEdit = !!dept;

    const content = `
      <form id="deptForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Number / Order Prefix</label>
            <input type="text" class="form-input" id="deptNum" value="${dept?.number || ''}" placeholder="e.g. 1">
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Code Template (Use {CC} for Country Code) <span class="text-danger">*</span></label>
            <input type="text" class="form-input font-bold" id="deptCode" value="${dept?.codeTemplate || ''}" placeholder="e.g. {CC}-PDD-MED" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label font-bold">Department / Activity Name <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="deptName" value="${dept?.name || ''}" placeholder="e.g. Framework designing & Content creation" required>
        </div>
        <div class="form-group">
          <label class="form-label font-bold">Scope</label>
          <select class="form-select font-bold" id="deptScope">
            <option value="country" ${dept?.scope === 'country' ? 'selected' : ''}>Country Specific ({CC} Prefix)</option>
            <option value="gl" ${dept?.scope === 'gl' ? 'selected' : ''}>Global (GL)</option>
            <option value="dp-cp" ${dept?.scope === 'dp-cp' ? 'selected' : ''}>Digital Product — Country (DP-CP)</option>
            <option value="dp-gp" ${dept?.scope === 'dp-gp' ? 'selected' : ''}>Digital Product — Global (DP-GP)</option>
            <option value="general" ${dept?.scope === 'general' ? 'selected' : ''}>General / Cross-Cutting</option>
          </select>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? 'Edit Department' : 'Add New Department', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-ghost', textContent: 'Cancel', onClick: close
        }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: isEdit ? 'Save Changes' : 'Add Department',
          onClick: async () => {
            const data = {
              id: dept?.id || Utils.slugify(Utils.$('#deptCode').value),
              number: Utils.$('#deptNum').value.trim(),
              codeTemplate: Utils.$('#deptCode').value.trim(),
              name: Utils.$('#deptName').value.trim(),
              scope: Utils.$('#deptScope').value,
              hasTotAccess: dept ? (dept.hasTotAccess !== undefined ? Boolean(dept.hasTotAccess) : false) : false
            };
            await db.put(STORES.departments, data);

            // Automatically activate this new department across all budget cycles and entities
            const allYears = await db.getAll(STORES.budgetYears);
            const allEntities = await db.getAll(STORES.entities);
            for (const y of allYears) {
              for (const ent of allEntities) {
                const configKey = `${y.id}_${ent.id}_${data.id}`;
                const existing = await db.get(STORES.entityDeptConfig, configKey);
                if (!existing) {
                  await db.put(STORES.entityDeptConfig, {
                    id: configKey,
                    yearId: String(y.id),
                    entityId: ent.id,
                    deptId: data.id,
                    isActive: true
                  });
                }
              }
            }

            await db.logAudit({
              category: 'config',
              action: isEdit ? 'UPDATE_DEPT' : 'CREATE_DEPT',
              recordId: data.id,
              description: `${isEdit ? 'Updated' : 'Created'} department template "${data.name}" (<code>${data.codeTemplate}</code>)`,
              changes: data
            });

            Utils.showToast(`Department "${data.name}" saved!`, 'success');
            close();
            if (typeof App !== 'undefined' && App.renderCurrentPage) await App.renderCurrentPage();
          }
        }));
      }
    });
  },

  async editDepartment(id) {
    const dept = await db.get(STORES.departments, id);
    if (dept) this.showDeptForm(dept);
  },

  async deleteDepartment(id) {
    if (await Utils.confirm('Are you sure you want to delete this department template?')) {
      await db.delete(STORES.departments, id);

      // Clean up department from cloud database
      if (typeof CloudSyncModule !== 'undefined' && CloudSyncModule._client) {
        try {
          await CloudSyncModule.deleteFromCloud(STORES.departments, id);
        } catch (e) {
          console.warn('Cloud delete for department failed:', e);
        }
      }

      Utils.showToast('Department deleted', 'info');
      App.renderCurrentPage();
    }
  },

  // ─── 3. Budget Year Setup ───
  BUDGET_STATUS_OPTIONS: [
    { value: 'draft', label: 'Draft (In Progress)', icon: '📝', badgeClass: 'badge-subtle', dotClass: 'draft' },
    { value: 'active', label: 'Active (Open for Budgeting)', icon: '🟢', badgeClass: 'badge-emerald', dotClass: 'active' },
    { value: 'under-review', label: 'Under Review (Dept Submissions)', icon: '🟡', badgeClass: 'badge-cyan', dotClass: 'active' },
    { value: 'finance-approved', label: 'Finance Approved (Pending CFO)', icon: '🔵', badgeClass: 'badge-primary', dotClass: 'active' },
    { value: 'finalized-locked', label: 'Finalized & Locked (CFO Approved)', icon: '🔒', badgeClass: 'badge-purple', dotClass: 'draft' },
    { value: 'closed', label: 'Closed / Archived', icon: '📁', badgeClass: 'badge-danger', dotClass: 'draft' },
    { value: 'inactive', label: '🚫 Inactive (Not Budgeted in CY)', icon: '🚫', badgeClass: 'badge-danger', dotClass: 'draft' }
  ],

  _matrixCollapsedState: {},

  toggleEntityMatrix(yearId) {
    if (!this._matrixCollapsedState) this._matrixCollapsedState = {};
    const sId = String(yearId);
    this._matrixCollapsedState[sId] = !this._matrixCollapsedState[sId];
    const isCollapsed = this._matrixCollapsedState[sId];

    const body = document.getElementById(`entityMatrixBody_${sId}`);
    const chevron = document.getElementById(`cycleHeaderChevron_${sId}`);

    if (body) {
      body.style.display = isCollapsed ? 'none' : 'block';
    }
    if (chevron) {
      chevron.textContent = isCollapsed ? '▶' : '▼';
    }
  },

  async renderBudgetYear(container) {
    const budgetYears = (await db.getAll(STORES.budgetYears)) || [];
    const entities = (await db.getAll(STORES.entities)) || [];
    const departments = (await db.getAll(STORES.departments)) || [];

    container.innerHTML = `
      <div class="page-header">
        <h2>Budget Year & Exchange Rates Setup</h2>
        <p>Define active budget cycles, entity-wise workflow status matrix, USD exchange rates, and active departments per entity</p>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div>
            <div class="card-title">Budget Cycles (${budgetYears.length})</div>
            <div class="card-subtitle">Budgets run on Calendar Year (Jan–Dec) &bull; Manage entity-wise workflow status in grid matrix</div>
          </div>
          <button class="btn btn-primary" id="addYearBtn">+ Create Budget Year</button>
        </div>

        <div class="config-list">
          ${budgetYears.length === 0 ? `
            <div class="empty-state p-md">
              <p>No budget year configured yet. Click "+ Create Budget Year" to initialize a budget cycle.</p>
            </div>
          ` : budgetYears.map(y => {
            const currentStatus = y.status || 'draft';
            const statusOpt = this.BUDGET_STATUS_OPTIONS.find(o => o.value === currentStatus) || this.BUDGET_STATUS_OPTIONS[0];
            const isCollapsed = this._matrixCollapsedState?.[String(y.id)] === true;

            const activeEntitiesCount = entities.filter(ent => {
              const s = y.entityStatuses?.[ent.id] || (y.inactiveEntities?.includes(ent.id) ? 'inactive' : y.status) || 'draft';
              return s !== 'inactive';
            }).length;
            const inactiveEntitiesCount = entities.length - activeEntitiesCount;

            const openBudgetingCount = entities.filter(ent => {
              const s = y.entityStatuses?.[ent.id] || (y.inactiveEntities?.includes(ent.id) ? 'inactive' : y.status) || 'draft';
              return s === 'draft' || s === 'active';
            }).length;

            return `
            <div class="config-list-item" style="flex-direction: column; align-items: stretch; gap: 16px; padding: 20px; background: var(--bg-card); border: 1.5px solid var(--border-default); border-radius: var(--radius-lg); margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
              
              <!-- Top Cycle Bar (Click anywhere in vacant space to toggle) -->
              <div class="budget-cycle-header-bar flex items-center justify-between flex-wrap gap-md" onclick="if (!event.target.closest('button, select, input, a, .item-actions')) ConfigModule.toggleEntityMatrix('${y.id}');" style="padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; user-select: none;" title="Click in vacant space to minimize or maximize entity matrix">
                <div class="item-info" style="min-width: 260px;">
                  <span class="status-dot ${statusOpt.dotClass}" style="width: 14px; height: 14px; flex-shrink: 0;"></span>
                  <div>
                    <div class="item-name flex items-center gap-sm flex-wrap">
                      <span style="font-weight: 800; font-size: 1.2rem; color: var(--text-primary); letter-spacing: -0.01em;">Calendar Year ${y.year}</span>
                      <span id="cycleHeaderChevron_${y.id}" class="text-tertiary" style="font-size: 12px; font-weight: 700;">${isCollapsed ? '▶' : '▼'}</span>
                      <span class="badge ${currentStatus === 'active' ? 'badge-emerald' : currentStatus === 'draft' ? 'badge-primary' : 'badge-amber'}" style="font-size: 11px; font-weight: 700;">
                        ${statusOpt.icon} Base: ${statusOpt.label.split(' ')[0]}
                      </span>
                      <div class="flex items-center gap-xs ml-xs" onclick="event.stopPropagation();">
                        <span class="text-tertiary" style="font-size: 11.5px; font-weight: 500;">Default Base Status:</span>
                        <select class="form-select form-select-sm year-status-selector" data-year-id="${y.id}" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 8px; cursor: pointer; border: 1.5px solid var(--border-default); background: var(--bg-surface); color: var(--text-primary);" title="Change Base Year Status">
                          ${this.BUDGET_STATUS_OPTIONS.map(opt => `
                            <option value="${opt.value}" ${currentStatus === opt.value ? 'selected' : ''}>
                              ${opt.icon} ${opt.label}
                            </option>
                          `).join('')}
                        </select>
                      </div>
                    </div>
                    <div class="item-detail mt-xs" style="font-size: 12px; color: var(--text-secondary);">
                      Prior Reference Base: <strong>CY-${y.priorYear || (y.year - 1)}</strong> &bull; Actuals Available: <strong>Jan–${y.actualsThroughMonth || 'Oct'}</strong> &bull; Participating Entities: <strong>${activeEntitiesCount} of ${entities.length}</strong>
                    </div>
                  </div>
                </div>
                <div class="item-actions flex items-center gap-xs" onclick="event.stopPropagation();">
                  <button class="btn btn-secondary btn-sm flex items-center gap-xs" onclick="ConfigModule.showEditBudgetYearModal('${y.id}')">✏️ Edit Year</button>
                  <button class="btn btn-ghost btn-sm flex items-center gap-xs" onclick="ConfigModule.configureYearRates('${y.id}')">💱 Rates</button>
                  <button class="btn btn-ghost btn-sm flex items-center gap-xs" onclick="ConfigModule.configureYearDepts('${y.id}')">🏛️ Dept Activation</button>
                  <button class="btn btn-ghost btn-sm flex items-center gap-xs" onclick="ConfigModule.managePriorPeriodCosts('${y.id}')">📊 Prior Period Costs</button>
                  <button class="btn btn-danger btn-sm flex items-center gap-xs" onclick="ConfigModule.deleteBudgetYear('${y.id}')">🗑️ Delete</button>
                </div>
              </div>

              <!-- Grid Matrix Table UI (With Minimize / Maximize Option) -->
              <div class="entity-matrix-wrapper">
                <div class="entity-matrix-header flex justify-between items-center flex-wrap gap-sm" onclick="ConfigModule.toggleEntityMatrix('${y.id}')" style="cursor: pointer; user-select: none;" title="Click to minimize or maximize matrix">
                  <div class="flex items-center gap-sm">
                    <span style="font-size: 1.25rem;">🏛️</span>
                    <div>
                      <div class="flex items-center gap-xs">
                        <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary);">Entity-Wise Participation & Workflow Status Matrix</h4>
                        <span class="badge ${inactiveEntitiesCount === 0 ? 'badge-emerald' : 'badge-amber'}" id="entityMatrixHeaderBadge_${y.id}" style="font-size: 10.5px; font-weight: 700; padding: 2px 7px;">
                          ${activeEntitiesCount} Active, ${inactiveEntitiesCount} Inactive (Excluded)
                        </span>
                      </div>
                      <span class="text-tertiary" style="font-size: 11px;">Toggle entity budget participation or set lockout control for CY-${y.year}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-xs" onclick="event.stopPropagation();">
                    <span class="text-secondary font-medium" style="font-size: 11.5px;">⚡ Apply Status to All:</span>
                    <select class="form-select form-select-sm bulk-entity-status-select" data-year-id="${y.id}" style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; min-width: 155px; background: var(--bg-surface); cursor: pointer;">
                      <option value="">— Choose Status —</option>
                      ${this.BUDGET_STATUS_OPTIONS.map(opt => `<option value="${opt.value}">${opt.icon} ${opt.label}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div id="entityMatrixBody_${y.id}" class="entity-matrix-body" style="${isCollapsed ? 'display: none;' : 'display: block;'}">
                  <div class="table-container" style="margin: 0; border: none; border-radius: 0; overflow-x: auto;">
                    <table class="entity-matrix-table">
                      <thead>
                        <tr>
                          <th style="width: 26%;">Operating Entity</th>
                          <th style="width: 12%;">Currency</th>
                          <th style="width: 22%;">CY-${y.year} Participation</th>
                          <th style="width: 22%;">Workflow Status</th>
                          <th style="width: 18%;">Budget Entry State</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${entities.map(ent => {
                          const entStatus = y.entityStatuses?.[ent.id] || (y.inactiveEntities?.includes(ent.id) ? 'inactive' : y.status) || 'draft';
                          const opt = this.BUDGET_STATUS_OPTIONS.find(o => o.value === entStatus) || this.BUDGET_STATUS_OPTIONS[0];
                          const isEntActive = entStatus !== 'inactive' && !y.inactiveEntities?.includes(ent.id);
                          const isEntEditable = isEntActive && (entStatus === 'draft' || entStatus === 'active');
                          return `
                            <tr style="${!isEntActive ? 'opacity: 0.65; background: rgba(239, 68, 68, 0.03);' : ''}">
                              <td>
                                <div class="flex items-center gap-sm">
                                  <span style="font-size: 1.5rem; line-height: 1;">${ent.flag || '🏛️'}</span>
                                  <div>
                                    <div style="font-weight: 700; color: var(--text-primary); font-size: 13.5px;">${ent.shortName}</div>
                                    <div class="text-tertiary" style="font-size: 11px; margin-top: 1px;">${ent.name || ent.shortName}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span class="badge badge-subtle font-mono font-bold" style="font-size: 11.5px; padding: 4px 8px; border: 1px solid var(--border-subtle);">
                                  ${ent.currency}
                                </span>
                              </td>
                              <td>
                                <button class="btn btn-sm ${isEntActive ? 'btn-secondary font-bold text-success' : 'btn-secondary font-bold text-danger'} entity-year-toggle-btn" data-year-id="${y.id}" data-entity-id="${ent.id}" data-active="${isEntActive ? 'true' : 'false'}" style="font-size: 11.5px; padding: 3px 10px; border-radius: 6px;" title="Click to ${isEntActive ? 'deactivate / exclude' : 'activate'} this entity in CY-${y.year}">
                                  ${isEntActive ? '🟢 Active in CY-' + y.year : '🚫 Inactive (Excluded)'}
                                </button>
                              </td>
                              <td>
                                <select class="form-select form-select-sm entity-status-selector entity-status-matrix-select ${!isEntActive ? 'is-inactive' : isEntEditable ? 'is-active' : 'is-locked'}" data-year-id="${y.id}" data-entity-id="${ent.id}" title="Update workflow status for ${ent.shortName}">
                                  ${this.BUDGET_STATUS_OPTIONS.map(o => `
                                    <option value="${o.value}" ${entStatus === o.value ? 'selected' : ''}>
                                      ${o.icon} ${o.label}
                                    </option>
                                  `).join('')}
                                </select>
                              </td>
                              <td>
                                ${!isEntActive ? `
                                  <span class="badge badge-danger font-bold flex items-center gap-xs" style="width: fit-content; padding: 5px 12px; font-size: 11px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35);">
                                    <span>🚫</span> Inactive (Not Budgeted)
                                  </span>
                                ` : isEntEditable ? `
                                  <span class="badge badge-emerald font-bold flex items-center gap-xs" style="width: fit-content; padding: 5px 12px; font-size: 11px;">
                                    <span>🟢</span> Open for Budgeting
                                  </span>
                                ` : `
                                  <span class="badge badge-amber font-bold flex items-center gap-xs" style="width: fit-content; padding: 5px 12px; font-size: 11px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35);">
                                    <span>🔒</span> Read-Only (${opt.label.split(' ')[0]})
                                  </span>
                                `}
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    Utils.$('#addYearBtn').addEventListener('click', () => this.showBudgetYearForm());

    // Base year status change listeners
    container.querySelectorAll('.year-status-selector').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const yId = e.target.dataset.yearId;
        const newStatus = e.target.value;
        await this.changeBudgetYearStatus(yId, newStatus);
      });
    });

    // Individual entity status change listeners
    container.querySelectorAll('.entity-status-selector').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const yId = e.target.dataset.yearId;
        const entId = e.target.dataset.entityId;
        const newStatus = e.target.value;
        await this.changeEntityBudgetStatus(yId, entId, newStatus);
      });
    });

    // Entity active/inactive toggle button listeners
    container.querySelectorAll('.entity-year-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const yId = btn.dataset.yearId;
        const entId = btn.dataset.entityId;
        const currentlyActive = btn.dataset.active === 'true';
        const targetStatus = currentlyActive ? 'inactive' : 'active';
        await this.changeEntityBudgetStatus(yId, entId, targetStatus);
      });
    });

    // Bulk set entity status listeners
    container.querySelectorAll('.bulk-entity-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const yId = e.target.dataset.yearId;
        const newStatus = e.target.value;
        if (newStatus) {
          await this.changeBudgetYearStatus(yId, newStatus, { applyToAllEntities: true, entities });
        }
      });
    });
  },

  async changeBudgetYearStatus(yearId, newStatus, meta = {}) {
    const sId = String(yearId);
    const nId = parseInt(sId);
    const year = (await db.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await db.get(STORES.budgetYears, nId) : null);
    if (!year) return;

    const oldStatus = year.status;
    year.status = newStatus;
    await db.put(STORES.budgetYears, year);

    if (meta.applyToAllEntities && meta.entities) {
      for (const ent of meta.entities) {
        if (newStatus === 'inactive') {
          await db.setEntityActiveForYear(yearId, ent.id, false);
        } else {
          await db.setEntityActiveForYear(yearId, ent.id, true);
        }
      }
    }

    // Sync with budget lock status
    await db.setLockStatus(yearId, newStatus, {
      status: newStatus,
      ...meta
    });

    if (typeof Auth !== 'undefined') {
      await Auth.refreshLockStatus(yearId);
      await Auth.refreshAllLockStatuses();
    }

    const opt = this.BUDGET_STATUS_OPTIONS.find(o => o.value === newStatus);
    Utils.showToast(`Calendar Year ${year.year} status updated to "${opt?.label || newStatus}"`, 'success');
    
    if (typeof App !== 'undefined') {
      await App.populateGlobalSelectors();
      await App.renderCurrentPage();
    }
  },

  async changeEntityBudgetStatus(yearId, entityId, newStatus) {
    const sId = String(yearId);
    const nId = parseInt(sId);
    const year = (await db.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await db.get(STORES.budgetYears, nId) : null);
    if (!year) return;

    if (newStatus === 'inactive') {
      const [payroll, eha, fa, nonPayroll, tot] = await Promise.all([
        db.getEntityBudgetData(STORES.payrollPersonnel, yearId, entityId),
        db.getEntityBudgetData(STORES.payrollEHA, yearId, entityId),
        db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, entityId),
        db.getEntityBudgetData(STORES.nonPayrollCost, yearId, entityId),
        db.getEntityBudgetData(STORES.impTotEvents, yearId, entityId)
      ]);
      const allLines = [...(payroll || []), ...(eha || []), ...(fa || []), ...(nonPayroll || []), ...(tot || [])];
      if (allLines.length > 0) {
        const entObj = (await db.get(STORES.entities, entityId)) || { shortName: entityId };
        let totalAmt = 0;
        allLines.forEach(r => { totalAmt += Utils.parseNumber(r.totalCY || r.total_cy || 0); });
        const formattedTotal = Utils.formatCurrency(totalAmt, entObj.currency || 'USD');

        const confirmed = await Utils.confirm(
          `⚠️ Entity Contains Existing Budget Data!\n\n"${entObj.shortName}" has ${allLines.length} budget line items (${formattedTotal}) entered in CY-${year.year}.\n\nMarking this entity as INACTIVE will deactivate all its departments and exclude it from Budget Entry, Executive Dashboard, and Consolidated Reports for CY-${year.year}.\n\nAre you sure you want to make this entity inactive for CY-${year.year}?`
        );
        if (!confirmed) {
          if (typeof App !== 'undefined' && App.renderCurrentPage) await App.renderCurrentPage();
          return;
        }
      }
      await db.setEntityActiveForYear(yearId, entityId, false);
    } else {
      await db.setEntityActiveForYear(yearId, entityId, true);
    }

    await db.setLockStatus(yearId, newStatus, {
      entityId,
      status: newStatus
    });

    if (typeof Auth !== 'undefined') {
      await Auth.refreshLockStatus(yearId, entityId);
      await Auth.refreshAllLockStatuses();
    }

    const entities = await db.getAll(STORES.entities);
    const ent = entities.find(e => e.id === entityId);
    const opt = this.BUDGET_STATUS_OPTIONS.find(o => o.value === newStatus);
    Utils.showToast(`${ent?.shortName || entityId} status updated to "${opt?.label || newStatus}" for CY-${year.year}`, 'success');

    if (typeof App !== 'undefined') {
      await App.populateGlobalSelectors();
      await App.renderCurrentPage();
    }
  },

  async showEditBudgetYearModal(yearId) {
    const sId = String(yearId);
    const nId = parseInt(sId);
    const year = (await db.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await db.get(STORES.budgetYears, nId) : null);
    if (!year) return;

    const entities = await db.getAll(STORES.entities);
    const currentStatus = year.status || 'draft';

    const content = `
      <form id="editYearForm">
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Calendar Year (CY to Budget)</label>
            <input type="number" class="form-input" id="editYearNum" value="${year.year}" disabled style="background: var(--bg-secondary); cursor: not-allowed;">
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Prior Reference Year (Historical Base)</label>
            <input type="number" class="form-input" id="editPriorYearNum" value="${year.priorYear || (year.year - 1)}" required>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Base Workflow Status</label>
          <select class="form-select" id="editYearStatus">
            ${this.BUDGET_STATUS_OPTIONS.map(opt => `
              <option value="${opt.value}" ${currentStatus === opt.value ? 'selected' : ''}>
                ${opt.icon} ${opt.label}
              </option>
            `).join('')}
          </select>
          <div class="text-tertiary mt-xs" style="font-size: 11px;">
            Default status for any entities without a specific status override.
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">🏛️ Entity-Wise Workflow Status Matrix</label>
          <div class="entity-matrix-wrapper" style="border-radius: 8px; max-height: 220px; overflow-y: auto;">
            <table class="entity-matrix-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th style="padding: 8px 12px;">Entity</th>
                  <th style="padding: 8px 12px;">Currency</th>
                  <th style="padding: 8px 12px;">Workflow Status</th>
                </tr>
              </thead>
              <tbody>
                ${entities.map(ent => {
                  const entStatus = year.entityStatuses?.[ent.id] || currentStatus;
                  return `
                    <tr>
                      <td style="padding: 8px 12px;">
                        <div class="flex items-center gap-xs">
                          <span style="font-size: 1.2rem;">${ent.flag || '🏛️'}</span>
                          <strong style="color: var(--text-primary); font-size: 12.5px;">${ent.shortName}</strong>
                        </div>
                      </td>
                      <td style="padding: 8px 12px;">
                        <span class="badge badge-subtle font-mono font-bold" style="font-size: 11px;">${ent.currency}</span>
                      </td>
                      <td style="padding: 8px 12px;">
                        <select class="form-select form-select-xs edit-modal-entity-status" data-entity-id="${ent.id}" style="font-size: 11.5px; font-weight: 600; padding: 4px 8px; width: 100%; max-width: 190px;">
                          ${this.BUDGET_STATUS_OPTIONS.map(opt => `<option value="${opt.value}" ${entStatus === opt.value ? 'selected' : ''}>${opt.icon} ${opt.label}</option>`).join('')}
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Prior-Year Actuals Available Through Month</label>
          <select class="form-select" id="editActualsThroughMonth">
            <option value="Sep" ${year.actualsThroughMonth === 'Sep' ? 'selected' : ''}>September (Jan-Sep)</option>
            <option value="Oct" ${(!year.actualsThroughMonth || year.actualsThroughMonth === 'Oct') ? 'selected' : ''}>October (Jan-Oct)</option>
            <option value="Nov" ${year.actualsThroughMonth === 'Nov' ? 'selected' : ''}>November (Jan-Nov)</option>
            <option value="Dec" ${year.actualsThroughMonth === 'Dec' ? 'selected' : ''}>Full Year (Jan-Dec)</option>
          </select>
        </div>
      </form>
    `;

    Utils.showModal(`✏️ Edit Budget Year — CY ${year.year}`, content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Save Changes',
          onClick: async () => {
            const priorYear = parseInt(document.getElementById('editPriorYearNum')?.value) || (year.year - 1);
            const status = document.getElementById('editYearStatus')?.value || year.status || 'draft';
            const actualsMonth = document.getElementById('editActualsThroughMonth')?.value || 'Oct';

            const entityStatuses = {};
            document.querySelectorAll('.edit-modal-entity-status').forEach(sel => {
              const eId = sel.dataset.entityId;
              if (eId) entityStatuses[eId] = sel.value;
            });

            year.priorYear = priorYear;
            year.status = status;
            year.actualsThroughMonth = actualsMonth;
            year.entityStatuses = entityStatuses;

            await db.put(STORES.budgetYears, year);
            await this.changeBudgetYearStatus(year.id || yearId, status);

            for (const [eId, eStat] of Object.entries(entityStatuses)) {
              if (eStat === 'inactive') {
                await db.setEntityActiveForYear(yearId, eId, false);
              } else {
                await db.setEntityActiveForYear(yearId, eId, true);
              }
              await db.setLockStatus(yearId, eStat, { entityId: eId });
            }
            if (typeof Auth !== 'undefined') {
              await Auth.refreshAllLockStatuses();
            }

            close();
          }
        }));
      }
    });
  },

  // ─── Dynamic Currency Rate Inputs Helper ───
  buildCurrencyRateInputs(entities, currentRates = {}) {
    const currencyMap = new Map();
    entities.forEach(e => {
      const cur = (e.currency || 'USD').toUpperCase();
      if (cur !== 'USD') {
        if (!currencyMap.has(cur)) {
          currencyMap.set(cur, {
            currency: cur,
            entities: [e],
            flag: e.flag || '🏳️',
            country: e.country || e.shortName
          });
        } else {
          currencyMap.get(cur).entities.push(e);
        }
      }
    });

    if (currencyMap.size === 0) {
      return `<div class="p-sm text-secondary" style="font-size: 12px; background: var(--bg-surface); border-radius: var(--radius-md);">All configured entities operate in USD base currency. No conversion rates required.</div>`;
    }

    const defaultPresets = { INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5, KES: 130.0, PHP: 58.0, GBP: 0.78, EUR: 0.92, SGD: 1.35, CAD: 1.38, AUD: 1.52, NGN: 1600 };
    const items = Array.from(currencyMap.values());

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        ${items.map(item => {
          const cur = item.currency;
          const rateVal = currentRates[cur] !== undefined ? currentRates[cur] : (defaultPresets[cur] || 1.0);
          const entNames = item.entities.map(e => e.shortName).join(', ');
          const flags = item.entities.map(e => e.flag).filter((v, i, a) => a.indexOf(v) === i).join(' ');

          return `
            <div class="form-group" style="margin: 0; background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-md);">
              <label class="form-label" style="font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span>${flags} 1 USD = <strong>${cur}</strong></span>
                <span class="badge badge-subtle" style="font-size: 10px;">${entNames}</span>
              </label>
              <input type="number" step="any" class="form-input dynamic-currency-rate-input" data-currency="${cur}" value="${rateVal}" placeholder="e.g. ${defaultPresets[cur] || 1.0}" required style="font-family: monospace; font-weight: 700;">
              <span style="font-size: 11px; color: var(--text-tertiary); display: block; margin-top: 2px;">${item.country}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  extractDynamicRates(container) {
    const rates = { USD: 1.0 };
    container.querySelectorAll('.dynamic-currency-rate-input').forEach(input => {
      const cur = input.getAttribute('data-currency');
      const val = parseFloat(input.value);
      if (cur) {
        rates[cur] = isNaN(val) || val <= 0 ? 1.0 : val;
      }
    });
    return rates;
  },

  async showBudgetYearForm() {
    const currentYear = Utils.getCurrentYear();
    const entities = await db.getAll(STORES.entities);
    const content = `
      <form id="yearForm">
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Calendar Year (CY to Budget)</label>
            <input type="number" class="form-input" id="yearNum" value="${currentYear + 1}" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Prior Reference Year (Historical Base)</label>
            <input type="number" class="form-input" id="priorYearNum" value="${currentYear}" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Workflow Status</label>
            <select class="form-select" id="yearStatus">
              ${this.BUDGET_STATUS_OPTIONS.map(opt => `
                <option value="${opt.value}" ${opt.value === 'active' ? 'selected' : ''}>
                  ${opt.icon} ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Prior-Year Actuals Available Through Month</label>
          <select class="form-select" id="actualsThroughMonth">
            <option value="Sep">September (Jan-Sep)</option>
            <option value="Oct" selected>October (Jan-Oct)</option>
            <option value="Nov">November (Jan-Nov)</option>
            <option value="Dec">Full Year (Jan-Dec)</option>
          </select>
        </div>

        <h4 class="mt-md mb-sm" style="font-size: 13px; text-transform: uppercase;">Approved Currency Exchange Rates to USD (Fixed for the Year)</h4>
        <div id="dynamicYearRatesBox" class="mb-md">
          ${this.buildCurrencyRateInputs(entities)}
        </div>
      </form>
    `;

    Utils.showModal('Create New Budget Year', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Initialize Year',
          onClick: async () => {
            const yearVal = Utils.$('#yearNum').value;
            const priorYearVal = Utils.$('#priorYearNum')?.value || String(parseInt(yearVal) - 1);
            const yearId = yearVal.toString();
            const modalEl = document.querySelector('.modal-body') || document;
            const conversionRates = ConfigModule.extractDynamicRates(modalEl);

            const yearObj = {
              id: yearId,
              year: parseInt(yearVal),
              priorYear: parseInt(priorYearVal) || (parseInt(yearVal) - 1),
              status: Utils.$('#yearStatus').value,
              actualsThroughMonth: Utils.$('#actualsThroughMonth').value,
              conversionRates
            };

            await db.put(STORES.budgetYears, yearObj);

            // Automatically activate all departments for all entities by default
            const departments = await db.getAll(STORES.departments);
            for (const entity of entities) {
              for (const dept of departments) {
                await db.put(STORES.entityDeptConfig, {
                  id: `${yearId}_${entity.id}_${dept.id}`,
                  yearId,
                  entityId: entity.id,
                  deptId: dept.id,
                  isActive: true
                });
              }
            }

            await db.logAudit({
              category: 'config',
              action: 'CREATE_BUDGET_YEAR',
              recordId: yearId,
              description: `Created budget year CY-${yearVal} with conversion rates for ${Object.keys(conversionRates).join(', ')}`,
              changes: yearObj
            });

            Utils.showToast(`Budget Year ${yearVal} created with ${Object.keys(conversionRates).length} active currency rates!`, 'success');
            close();
            if (typeof App !== 'undefined') {
              if (App.populateGlobalSelectors) await App.populateGlobalSelectors();
              if (App.renderCurrentPage) await App.renderCurrentPage();
            }
          }
        }));
      }
    });
  },

  async configureYearRates(yearId) {
    const year = await db.get(STORES.budgetYears, yearId);
    if (!year) return;

    const entities = await db.getAll(STORES.entities);
    const rates = year.conversionRates || { USD: 1.0 };

    const content = `
      <form id="ratesForm">
        <p class="mb-md">Set the pre-approved annual conversion rates to USD for <strong>CY-${year.year}</strong> across all active entity currencies:</p>
        <div id="dynamicYearRatesBox" class="mb-md">
          ${this.buildCurrencyRateInputs(entities, rates)}
        </div>
      </form>
    `;

    Utils.showModal(`Exchange Rates — CY ${year.year}`, content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Save Rates',
          onClick: async () => {
            const modalEl = document.querySelector('.modal-body') || document;
            year.conversionRates = ConfigModule.extractDynamicRates(modalEl);

            await db.put(STORES.budgetYears, year);
            await db.logAudit({
              category: 'config',
              action: 'UPDATE_EXCHANGE_RATES',
              recordId: String(yearId),
              description: `Updated exchange rates for CY-${year.year}: ${Object.entries(year.conversionRates).map(([k, v]) => `${k}=${v}`).join(', ')}`,
              changes: year.conversionRates
            });

            Utils.showToast(`Exchange rates for CY-${year.year} updated successfully!`, 'success');
            close();
            if (typeof App !== 'undefined' && App.renderCurrentPage) await App.renderCurrentPage();
          }
        }));
      }
    });
  },

  async configureYearDepts(yearId) {
    const year = await db.get(STORES.budgetYears, yearId);
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const entities = await db.getAll(STORES.entities);
    const configs = await db.getAll(STORES.entityDeptConfig);

    const configMap = {};
    configs.forEach(c => {
      const yId = String(c.yearId || c.year_id);
      const entId = String(c.entityId || c.entity_id);
      const dId = String(c.deptId || c.dept_id);
      const isAct = c.isActive !== false && c.is_active !== false;
      const key = `${yId}_${entId}_${dId}`;
      if (configMap[key] !== undefined) {
        configMap[key] = configMap[key] && isAct;
      } else {
        configMap[key] = isAct;
      }
    });

    let activeEntity = entities[0]?.id || '';

    const content = Utils.createElement('div');
    content.innerHTML = `
      <p class="mb-md">Select which departments are active for each entity in <strong>CY-${year.year}</strong>:</p>
      <div class="tabs" id="entityTabs">
        ${entities.map((e, idx) => `
          <button class="tab ${idx === 0 ? 'active' : ''}" data-entity="${e.id}">${e.flag} ${e.shortName}</button>
        `).join('')}
      </div>
      <div id="deptChecklist" style="max-height: 400px; overflow-y: auto;"></div>
    `;

    const renderChecklist = (entityId) => {
      const entity = entities.find(e => e.id === entityId);
      const isEntActive = year.entityStatuses?.[entityId] !== 'inactive' && !year.inactiveEntities?.includes(entityId);
      const checklistContainer = content.querySelector('#deptChecklist');

      checklistContainer.innerHTML = `
        <div class="flex items-center justify-between p-sm mb-sm flex-wrap gap-xs" style="background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div class="flex items-center gap-xs">
            <span style="font-size: 1.1rem;">${entity.flag || '🏛️'}</span>
            <strong>${entity.shortName}</strong>:
            <span class="badge ${isEntActive ? 'badge-emerald' : 'badge-danger'} font-bold" style="font-size: 11px;">
              ${isEntActive ? '🟢 Participating in CY-' + year.year : '🚫 Inactive in CY-' + year.year}
            </span>
          </div>
          <div class="flex items-center gap-xs">
            <button type="button" class="btn btn-xs btn-secondary font-bold" id="deptSelectAllBtn">✅ Select All</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold" id="deptDeselectAllBtn">🚫 Deselect All</button>
          </div>
        </div>
        <div class="departments-scroll-list" style="max-height: 340px; overflow-y: auto;">
          ${departments.map(d => {
            const key = `${yearId}_${entityId}_${d.id}`;
            const isChecked = configMap[key] !== false;
            const displayName = Utils.getDeptName(d, entity.deptPrefix);

            return `
              <label class="form-checkbox p-sm" style="border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" data-key="${key}" ${isChecked ? 'checked' : ''}>
                <span>${displayName}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;

      checklistContainer.querySelector('#deptSelectAllBtn')?.addEventListener('click', () => {
        departments.forEach(d => {
          const key = `${yearId}_${entityId}_${d.id}`;
          configMap[key] = true;
        });
        renderChecklist(entityId);
      });

      checklistContainer.querySelector('#deptDeselectAllBtn')?.addEventListener('click', () => {
        departments.forEach(d => {
          const key = `${yearId}_${entityId}_${d.id}`;
          configMap[key] = false;
        });
        renderChecklist(entityId);
      });
    };

    renderChecklist(activeEntity);

    content.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        content.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeEntity = tab.dataset.entity;
        renderChecklist(activeEntity);
      });
    });

    content.addEventListener('change', async (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const key = e.target.dataset.key;
        if (!e.target.checked) {
          // User is unticking a department. Check if data exists!
          const [yId, entId, dId] = key.split('_');
          const [payroll, eha, fa, nonPayroll, tot] = await Promise.all([
            db.getBudgetData(STORES.payrollPersonnel, yId, entId, dId),
            db.getBudgetData(STORES.payrollEHA, yId, entId, dId),
            db.getBudgetData(STORES.payrollFixedAsset, yId, entId, dId),
            db.getBudgetData(STORES.nonPayrollCost, yId, entId, dId),
            db.getBudgetData(STORES.impTotEvents, yId, entId, dId)
          ]);
          const allLines = [...(payroll || []), ...(eha || []), ...(fa || []), ...(nonPayroll || []), ...(tot || [])];
          if (allLines.length > 0) {
            let totalAmount = 0;
            allLines.forEach(r => {
              totalAmount += Utils.parseNumber(r.totalCY || r.total_cy || 0);
            });
            const entObj = entities.find(ent => ent.id === entId);
            const deptObj = departments.find(d => d.id === dId);
            const deptName = Utils.getDeptName(deptObj, entObj?.deptPrefix);
            const formattedTotal = Utils.formatCurrency(totalAmount, entObj?.currency || 'USD');

            const confirmed = await Utils.confirm(
              `⚠️ Department Contains Existing Budget Data!\n\n"${deptName}" already has ${allLines.length} budget line item${allLines.length > 1 ? 's' : ''} (${formattedTotal}) entered in CY-${year.year}.\n\nUnticking this department will deactivate and hide it from the Budget Entry sheet and reports for ${entObj?.shortName || entId}.\n\nAre you sure you want to deactivate this department?`
            );

            if (!confirmed) {
              e.target.checked = true;
              configMap[key] = true;
              return;
            }
          }
        }
        configMap[key] = e.target.checked;
      }
    });

    Utils.showModal(`Department Activation — CY ${year.year}`, content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Save Activation Settings',
          onClick: async () => {
            const allConfigsToSave = [];
            for (const [key, isActive] of Object.entries(configMap)) {
              const [yId, entId, dId] = key.split('_');
              allConfigsToSave.push({
                id: key,
                yearId: String(yId),
                entityId: entId,
                deptId: dId,
                isActive: !!isActive
              });
            }
            for (const cfg of allConfigsToSave) {
              await db.put(STORES.entityDeptConfig, cfg);
            }
            if (typeof CloudSyncModule !== 'undefined' && CloudSyncModule.pushManyToCloud) {
              await CloudSyncModule.pushManyToCloud(STORES.entityDeptConfig, allConfigsToSave);
            }
            Utils.showToast('Department activations updated and synced with team!', 'success');
            close();
            if (typeof App !== 'undefined' && App.renderCurrentPage) {
              await App.renderCurrentPage();
            }
          }
        }));
      }
    });
  },

  async deleteBudgetYear(id) {
    if (await Utils.confirm('Are you sure you want to delete this budget year? All entries under it will be lost.')) {
      await db.delete(STORES.budgetYears, id);

      // Clean up budget year from cloud database
      if (typeof CloudSyncModule !== 'undefined' && CloudSyncModule._client) {
        try {
          await CloudSyncModule.deleteFromCloud(STORES.budgetYears, id);
        } catch (e) {
          console.warn('Cloud delete for budget year failed:', e);
        }
      }

      Utils.showToast('Budget year deleted', 'info');
      App.populateGlobalSelectors();
      App.renderCurrentPage();
    }
  },

  // ─── Prior Period Costs Direct Update & Management ───
  async managePriorPeriodCosts(yearId, defaultEntityId = null, defaultDeptId = null) {
    const year = await db.get(STORES.budgetYears, yearId);
    const priorYearNum = year?.priorYear || (year ? year.year - 1 : 2025);
    const entities = await db.getAll(STORES.entities);
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const coa = await db.getChartOfAccounts();
    let priorCosts = await db.getPriorPeriodCosts(yearId);

    const activeEntityId = defaultEntityId || entities[0]?.id || '';
    const activeDeptId = defaultDeptId || '';

    const content = Utils.createElement('div');
    content.innerHTML = `
      <div class="card p-md mb-md" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(59, 130, 246, 0.2);">
        <div class="flex justify-between items-center">
          <div>
            <h4 style="margin:0; font-size: 1.1rem; color: var(--text-primary);">📊 Prior Period Costs Direct Editor (CY-${year?.year || yearId})</h4>
            <p class="text-secondary" style="margin:4px 0 0; font-size: 12.5px;">
              Directly edit and update reference prior period costs (CY-${priorYearNum} Actuals / Base) per Entity and Department inline in the application.
            </p>
          </div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-primary font-bold" id="pyaCountBadge" style="font-size: 13px; padding: 6px 12px;">${priorCosts.length} Records</span>
            <span class="badge badge-emerald font-bold" style="font-size: 12px; padding: 6px 10px;">⚡ Live Direct Edit</span>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="flex gap-sm mb-md flex-wrap items-center justify-between">
        <div class="flex gap-sm flex-wrap">
          <button class="btn btn-primary btn-sm" id="pyaAddLineBtn">➕ Add Line Item</button>
          <button class="btn btn-secondary btn-sm" id="pyaPopulateDeptBtn" title="Populate all standard COA lines for selected department">📋 Populate All Dept Accounts</button>
          <button class="btn btn-success btn-sm" id="pyaSaveAllBtn" style="background: var(--success); color: white;">💾 Save All Changes</button>
        </div>
        <div class="flex gap-sm flex-wrap">
          <button class="btn btn-ghost btn-sm" onclick="ExcelIOModule.downloadPriorPeriodTemplate('${yearId}')">📥 Template</button>
          <button class="btn btn-ghost btn-sm" onclick="ExcelIOModule.showPriorPeriodUploadModal('${yearId}')">📤 Upload Excel</button>
          <button class="btn btn-ghost btn-sm" onclick="ExcelIOModule.downloadPriorPeriodData('${yearId}')">💾 Export</button>
          <button class="btn btn-ghost btn-sm text-danger" id="pyaClearFilteredBtn">🗑️ Clear Filtered</button>
        </div>
      </div>

      <!-- Short Form Filters -->
      <div class="card p-sm mb-md" style="background: var(--bg-surface); border: 1px solid var(--border-default);">
        <div class="form-row" style="margin:0; gap: 12px;">
          <div class="form-group" style="margin:0; flex: 1; min-width: 140px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase;">Entity (Short):</label>
            <select class="form-select form-select-sm" id="priorCostEntityFilter">
              <option value="">All Entities (${entities.length})</option>
              ${entities.map(e => `<option value="${e.id}" ${e.id === activeEntityId ? 'selected' : ''}>${e.shortName} (${e.country})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0; flex: 1.5; min-width: 180px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase;">Department (Short Code):</label>
            <select class="form-select form-select-sm" id="priorCostDeptFilter"></select>
          </div>
          <div class="form-group" style="margin:0; flex: 1.2; min-width: 160px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase;">Search GL / Code:</label>
            <input type="text" class="form-input form-input-sm" id="priorCostSearchInput" placeholder="🔍 Filter description / code...">
          </div>
        </div>
      </div>

      <!-- Summary Bar -->
      <div class="flex justify-between items-center px-sm py-xs mb-sm" style="background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid #cbd5e1;">
        <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);" id="pyaFilteredSummary">Showing records...</div>
        <div style="font-size: 13px; font-weight: 700; color: var(--accent-primary);" id="pyaFilteredTotal">Total: 0</div>
      </div>

      <!-- Editable Table Container (Expanded Full View) -->
      <div class="table-container" style="max-height: calc(96vh - 290px); min-height: 480px; overflow-y: auto; background: #ffffff;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="min-width: 95px; background: #e2e8f0;">Entity</th>
              <th style="min-width: 130px; background: #e2e8f0;">Department</th>
              <th style="min-width: 170px; background: #e2e8f0;">Parent Account</th>
              <th style="min-width: 240px; background: #e2e8f0;">GL Description</th>
              <th style="min-width: 120px; background: #e2e8f0;">Ledger Code</th>
              <th class="num" style="min-width: 170px; background: #e2e8f0; color: var(--accent-primary); font-weight: 700;">Prior Period Cost</th>
              <th style="min-width: 260px; background: #e2e8f0;">Remarks</th>
              <th style="width: 50px; text-align: center; background: #e2e8f0;">Del</th>
            </tr>
          </thead>
          <tbody id="priorCostTableBody"></tbody>
        </table>
      </div>
    `;

    const entFilterEl = content.querySelector('#priorCostEntityFilter');
    const deptFilterEl = content.querySelector('#priorCostDeptFilter');
    const searchInputEl = content.querySelector('#priorCostSearchInput');
    const tbody = content.querySelector('#priorCostTableBody');
    const summaryText = content.querySelector('#pyaFilteredSummary');
    const summaryTotal = content.querySelector('#pyaFilteredTotal');
    const countBadge = content.querySelector('#pyaCountBadge');

    const updateDeptFilterOptions = (selectedDeptVal = null) => {
      const selectedEntId = entFilterEl.value;
      const selectedEnt = entities.find(e => e.id === selectedEntId);
      
      let html = '<option value="">All Departments</option>';
      departments.forEach(d => {
        const shortCode = selectedEnt ? Utils.getDeptShortCode(d, selectedEnt.deptPrefix) : (d.codeTemplate || d.id.toUpperCase());
        const isSel = (selectedDeptVal && d.id === selectedDeptVal) || (!selectedDeptVal && activeDeptId && d.id === activeDeptId);
        html += `<option value="${d.id}" ${isSel ? 'selected' : ''}>${shortCode}</option>`;
      });
      deptFilterEl.innerHTML = html;
    };

    updateDeptFilterOptions(activeDeptId);

    const renderTableRows = () => {
      const entFilter = entFilterEl.value;
      const deptFilter = deptFilterEl.value;
      const searchVal = (searchInputEl.value || '').trim().toLowerCase();

      const filtered = priorCosts.filter(r => {
        if (entFilter && r.entityId !== entFilter) return false;
        if (deptFilter && r.deptId !== deptFilter) return false;
        if (searchVal) {
          const matchGl = (r.glDescription || '').toLowerCase().includes(searchVal);
          const matchCode = (r.ledgerCode || '').toLowerCase().includes(searchVal);
          const matchParent = (r.parentAccount || '').toLowerCase().includes(searchVal);
          if (!matchGl && !matchCode && !matchParent) return false;
        }
        return true;
      });

      countBadge.textContent = `${priorCosts.length} Records Loaded`;

      if (filtered.length === 0) {
        summaryText.innerHTML = `No prior period records matching filter.`;
        summaryTotal.innerHTML = `Total: 0`;
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-tertiary p-lg">
              <p style="margin:0 0 8px;">No prior period records for selected filter.</p>
              ${entFilter && deptFilter ? `
                <button class="btn btn-secondary btn-sm" id="pyaEmptyPopulateBtn">📋 Populate All Accounts for this Dept</button>
              ` : '<p style="font-size:12px;">Select an Entity and Department above, or click "Add Line Item" to enter records directly.</p>'}
            </td>
          </tr>`;
        const emptyPopBtn = tbody.querySelector('#pyaEmptyPopulateBtn');
        if (emptyPopBtn) {
          emptyPopBtn.addEventListener('click', () => this.populateDeptPriorCostLines(yearId, entFilter, deptFilter));
        }
        return;
      }

      const totalCostSum = filtered.reduce((s, r) => s + (Utils.parseNumber(r.priorCost) || 0), 0);
      const curr = (entFilter && entities.find(e => e.id === entFilter)?.currency) || 'INR/Local';

      summaryText.innerHTML = `Showing <strong>${filtered.length}</strong> line item(s)${entFilter ? ` for <strong>${entities.find(e => e.id === entFilter)?.shortName}</strong>` : ''}${deptFilter ? ` (${deptFilter.toUpperCase()})` : ''}`;
      summaryTotal.innerHTML = `Total Prior Cost: <strong>${Utils.formatNumber(totalCostSum)} ${curr}</strong>`;

      tbody.innerHTML = filtered.map(r => {
        const ent = entities.find(e => e.id === r.entityId);
        const dept = departments.find(d => d.id === r.deptId);
        const shortDeptCode = Utils.getDeptShortCode(dept, ent?.deptPrefix);
        const rowCurrency = r.currency || ent?.currency || 'INR';

        return `
          <tr data-id="${r.id}">
            <td><strong>${ent?.shortName || r.entityId}</strong></td>
            <td><code>${shortDeptCode}</code></td>
            <td style="font-size: 11.5px; font-weight: 600;">${r.parentAccount || 'Operating Costs'}</td>
            <td>${r.glDescription || '—'}</td>
            <td><code>${r.ledgerCode || '—'}</code></td>
            <td class="num" style="padding: 4px 6px;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                <span class="badge badge-subtle" style="font-size: 10px; padding: 2px 4px;">${rowCurrency}</span>
                <input type="number" step="any" class="form-input form-input-sm pya-cost-input" data-id="${r.id}" value="${r.priorCost || 0}" style="width: 120px; font-family: monospace; font-weight: 700; text-align: right; box-sizing: border-box;">
              </div>
            </td>
            <td style="padding: 4px 6px;">
              <input type="text" class="form-input form-input-sm pya-remarks-input" data-id="${r.id}" value="${Utils.escapeHtml(r.remarks || '')}" placeholder="e.g. CY-${priorYearNum} actuals" style="width: 100%; box-sizing: border-box;">
            </td>
            <td style="text-align: center;">
              <button class="btn btn-ghost btn-sm text-danger pya-del-btn" data-id="${r.id}" title="Delete record" style="padding: 2px 6px; font-size: 13px;">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
    };

    renderTableRows();

    // Event Listeners for Filters
    entFilterEl.addEventListener('change', () => {
      updateDeptFilterOptions();
      renderTableRows();
    });
    deptFilterEl.addEventListener('change', renderTableRows);
    searchInputEl.addEventListener('input', renderTableRows);

    // Live Inline Updates Handler
    tbody.addEventListener('change', async (e) => {
      const target = e.target;
      const recId = target.getAttribute('data-id');
      if (!recId) return;

      const rec = priorCosts.find(r => r.id === recId);
      if (!rec) return;

      if (target.classList.contains('pya-cost-input')) {
        rec.priorCost = Utils.parseNumber(target.value);
        await db.saveSinglePriorPeriodCost(yearId, rec);
        // Update summary total
        const entFilter = entFilterEl.value;
        const deptFilter = deptFilterEl.value;
        const searchVal = (searchInputEl.value || '').trim().toLowerCase();
        const filtered = priorCosts.filter(r => (!entFilter || r.entityId === entFilter) && (!deptFilter || r.deptId === deptFilter));
        const totalCostSum = filtered.reduce((s, r) => s + (Utils.parseNumber(r.priorCost) || 0), 0);
        const curr = (entFilter && entities.find(e => e.id === entFilter)?.currency) || 'INR/Local';
        summaryTotal.innerHTML = `Total Prior Cost: <strong>${Utils.formatNumber(totalCostSum)} ${curr}</strong>`;
      } else if (target.classList.contains('pya-remarks-input')) {
        rec.remarks = target.value;
        await db.saveSinglePriorPeriodCost(yearId, rec);
      }
    });

    // Delete Line Item Handler
    tbody.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('.pya-del-btn');
      if (!delBtn) return;
      const recId = delBtn.getAttribute('data-id');
      if (!recId) return;

      const recIndex = priorCosts.findIndex(r => r.id === recId);
      if (recIndex !== -1) {
        await db.deletePriorPeriodCost(recId);
        priorCosts.splice(recIndex, 1);
        Utils.showToast('Prior period cost line deleted.', 'info');
        renderTableRows();
      }
    });

    // Action Button Listeners
    content.querySelector('#pyaAddLineBtn').addEventListener('click', () => {
      this.showAddPriorCostLineModal(yearId, entFilterEl.value || activeEntityId, deptFilterEl.value || activeDeptId);
    });

    content.querySelector('#pyaPopulateDeptBtn').addEventListener('click', () => {
      const currentEnt = entFilterEl.value || activeEntityId;
      const currentDept = deptFilterEl.value || activeDeptId || departments[0]?.id;
      this.populateDeptPriorCostLines(yearId, currentEnt, currentDept);
    });

    content.querySelector('#pyaSaveAllBtn').addEventListener('click', async () => {
      // Sync all current inputs in tbody
      const rows = tbody.querySelectorAll('tr[data-id]');
      rows.forEach(tr => {
        const id = tr.getAttribute('data-id');
        const costInp = tr.querySelector('.pya-cost-input');
        const remInp = tr.querySelector('.pya-remarks-input');
        const rec = priorCosts.find(r => r.id === id);
        if (rec) {
          if (costInp) rec.priorCost = Utils.parseNumber(costInp.value);
          if (remInp) rec.remarks = remInp.value;
        }
      });

      await db.savePriorPeriodCosts(yearId, priorCosts, false);
      Utils.showToast('All prior period changes saved successfully!', 'success');
      if (App.currentPage === 'budget-entry' || App.currentPage === 'reports') {
        App.renderCurrentPage();
      }
    });

    content.querySelector('#pyaClearFilteredBtn').addEventListener('click', () => {
      this.clearPriorPeriodCosts(yearId, entFilterEl.value, deptFilterEl.value);
    });

    Utils.showModal(`Prior Period Costs Editor — CY ${year?.year || yearId}`, content, {
      size: 'full',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Done & Close',
          onClick: () => {
            close();
            if (App.currentPage === 'budget-entry' || App.currentPage === 'reports') {
              App.renderCurrentPage();
            }
          }
        }));
      }
    });
  },

  async populateDeptPriorCostLines(yearId, entityId, deptId) {
    if (!entityId || !deptId) {
      Utils.showToast('Please select both an Entity and a Department first.', 'warning');
      return;
    }
    const ent = await db.get(STORES.entities, entityId);
    const dept = await db.get(STORES.departments, deptId);
    const coa = await db.getChartOfAccounts();
    const existing = await db.getPriorPeriodCosts(yearId, entityId, deptId);
    const existingLedgers = new Set(existing.map(e => String(e.ledgerCode).trim().toLowerCase()));
    const existingGls = new Set(existing.map(e => String(e.glDescription).trim().toLowerCase()));

    const newRecords = [];
    coa.forEach(account => {
      const codeClean = String(account.ledgerCode || '').trim().toLowerCase();
      const glClean = String(account.glDescription || '').trim().toLowerCase();
      if (!existingLedgers.has(codeClean) && !existingGls.has(glClean)) {
        newRecords.push({
          id: `pya_${yearId}_${entityId}_${deptId}_${account.ledgerCode || Utils.slugify(account.glDescription)}`,
          yearId: String(yearId),
          entityId,
          deptId,
          parentAccount: account.parentAccount || 'Operating Costs',
          glDescription: account.glDescription,
          ledgerCode: account.ledgerCode,
          priorCost: 0,
          currency: ent?.currency || 'INR',
          remarks: 'Standard COA line'
        });
      }
    });

    if (newRecords.length === 0) {
      Utils.showToast('All standard Chart of Accounts lines already exist for this department.', 'info');
      return;
    }

    await db.savePriorPeriodCosts(yearId, newRecords, false);
    Utils.showToast(`Added ${newRecords.length} accounts for ${ent?.shortName} - ${Utils.getDeptShortCode(dept, ent?.deptPrefix)}!`, 'success');
    this.managePriorPeriodCosts(yearId, entityId, deptId);
  },

  async showAddPriorCostLineModal(yearId, defaultEntityId = null, defaultDeptId = null) {
    const entities = await db.getAll(STORES.entities);
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const coa = await db.getChartOfAccounts();

    const initialEntId = defaultEntityId || entities[0]?.id || '';
    const initialDeptId = defaultDeptId || departments[0]?.id || '';
    const initialEnt = entities.find(e => e.id === initialEntId) || entities[0];

    const content = `
      <form id="addPyaForm">
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Entity (Short)</label>
            <select class="form-select" id="addPyaEntitySelect">
              ${entities.map(e => `<option value="${e.id}" ${e.id === initialEntId ? 'selected' : ''}>${e.shortName} (${e.country})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Department (Short Code)</label>
            <select class="form-select" id="addPyaDeptSelect">
              ${departments.map(d => {
                const sc = initialEnt ? Utils.getDeptShortCode(d, initialEnt.deptPrefix) : (d.codeTemplate || d.id.toUpperCase());
                return `<option value="${d.id}" ${d.id === initialDeptId ? 'selected' : ''}>${sc}</option>`;
              }).join('')}
            </select>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Select Chart of Accounts Line</label>
          <select class="form-select" id="addPyaCoaSelect">
            <option value="custom">-- Custom Line Item --</option>
            ${coa.map(c => `<option value="${c.ledgerCode}" data-parent="${Utils.escapeHtml(c.parentAccount)}" data-gl="${Utils.escapeHtml(c.glDescription)}">${c.ledgerCode} — ${c.glDescription} (${c.parentAccount})</option>`).join('')}
          </select>
        </div>

        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label">Parent Account</label>
            <input type="text" class="form-input" id="addPyaParent" value="${coa[0]?.parentAccount || 'Personnel Expenses'}">
          </div>
          <div class="form-group">
            <label class="form-label">Ledger Code</label>
            <input type="text" class="form-input" id="addPyaLedger" value="${coa[0]?.ledgerCode || '91101'}">
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label">GL Description</label>
          <input type="text" class="form-input" id="addPyaGl" value="${coa[0]?.glDescription || 'Salaries and Wages'}">
        </div>

        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label font-bold">Prior Period Cost (Amount)</label>
            <input type="number" step="any" class="form-input" id="addPyaCost" value="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <input type="text" class="form-input" id="addPyaRemarks" placeholder="e.g. CY-2025 actuals">
          </div>
        </div>
      </form>
    `;

    Utils.showModal('➕ Add Prior Period Cost Line', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: 'Save Line Item',
          onClick: async () => {
            const entId = Utils.$('#addPyaEntitySelect').value;
            const deptId = Utils.$('#addPyaDeptSelect').value;
            const parentAccount = Utils.$('#addPyaParent').value || 'Operating Costs';
            const ledgerCode = Utils.$('#addPyaLedger').value || '93999';
            const glDescription = Utils.$('#addPyaGl').value || 'Expense Line';
            const priorCost = Utils.parseNumber(Utils.$('#addPyaCost').value);
            const remarks = Utils.$('#addPyaRemarks').value || '';
            const ent = entities.find(e => e.id === entId);

            const record = {
              id: `pya_${yearId}_${entId}_${deptId}_${ledgerCode || Utils.slugify(glDescription)}`,
              yearId: String(yearId),
              entityId: entId,
              deptId,
              parentAccount,
              glDescription,
              ledgerCode,
              priorCost,
              currency: ent?.currency || 'INR',
              remarks
            };

            await db.saveSinglePriorPeriodCost(yearId, record);
            Utils.showToast('Prior period cost line added!', 'success');
            close();
            this.managePriorPeriodCosts(yearId, entId, deptId);
          }
        }));
      }
    });

    const coaSelect = Utils.$('#addPyaCoaSelect');
    if (coaSelect) {
      coaSelect.addEventListener('change', (e) => {
        const selOption = e.target.options[e.target.selectedIndex];
        if (e.target.value !== 'custom') {
          Utils.$('#addPyaParent').value = selOption.getAttribute('data-parent') || '';
          Utils.$('#addPyaGl').value = selOption.getAttribute('data-gl') || '';
          Utils.$('#addPyaLedger').value = e.target.value || '';
        }
      });
    }
  },

  async clearPriorPeriodCosts(yearId, entityId = null, deptId = null) {
    let msg = 'Are you sure you want to clear all prior period costs for this year?';
    if (entityId && deptId) {
      msg = `Are you sure you want to clear prior period costs for selected entity & department?`;
    } else if (entityId) {
      msg = `Are you sure you want to clear prior period costs for selected entity?`;
    }
    if (await Utils.confirm(msg)) {
      if (entityId || deptId) {
        const allCosts = await db.getAll(STORES.priorYearActuals);
        for (const c of allCosts) {
          if (String(c.yearId) === String(yearId) && (!entityId || c.entityId === entityId) && (!deptId || c.deptId === deptId)) {
            await db.delete(STORES.priorYearActuals, c.id);
          }
        }
      } else {
        await db.savePriorPeriodCosts(yearId, [], true);
      }
      Utils.showToast('Prior period costs cleared!', 'info');
      this.managePriorPeriodCosts(yearId, entityId, deptId);
    }
  },

  // ─── 4. Dimensions Configuration ───
  async renderDimensions(container) {
    const entities = await db.getAll(STORES.entities);
    const locations = await db.getAll(STORES.locations);
    const donors = await db.getAll(STORES.donors);
    const activities = await db.getAll(STORES.activities);
    const conditionAreas = await db.getAll(STORES.conditionAreas);

    container.innerHTML = `
      <div class="page-header">
        <h2>5-Dimensional Tagging Master Settings</h2>
        <p>Manage Locations, Donors, Activities, and Condition Areas for budget classification</p>
      </div>

      <div class="tabs" id="dimensionTabs">
        <button class="tab active" data-dim="locations">📍 Locations (${locations.length})</button>
        <button class="tab" data-dim="donors">🤝 Donors (${donors.length})</button>
        <button class="tab" data-dim="activities">⚡ Activities (${activities.length})</button>
        <button class="tab" data-dim="conditionAreas">🩺 Condition Areas (${conditionAreas.length})</button>
      </div>

      <div id="dimensionTabContent"></div>
    `;

    const renderActiveTab = (dim) => {
      const target = container.querySelector('#dimensionTabContent');
      if (dim === 'locations') this.renderLocationsManager(target, entities, locations);
      else if (dim === 'donors') this.renderDonorsManager(target, entities, donors);
      else if (dim === 'activities') this.renderActivitiesManager(target, activities);
      else if (dim === 'conditionAreas') this.renderConditionAreasManager(target, conditionAreas);
    };

    renderActiveTab('locations');

    container.querySelectorAll('#dimensionTabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('#dimensionTabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderActiveTab(tab.dataset.dim);
      });
    });
  },

  renderLocationsManager(container, entities, locations) {
    let selectedEntity = entities[0]?.id || '';

    const getFilteredLocs = (entId) => locations.filter(l => l.entityId === entId);

    const updateView = () => {
      const filtered = getFilteredLocs(selectedEntity);
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="form-inline">
              <label class="form-label" style="margin: 0;">Select Entity:</label>
              <select class="form-select" id="dimEntityLocSelect" style="width: auto;">
                ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntity ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.name})</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" id="addLocationBtn">+ Add Location</button>
          </div>

          <div class="config-list">
            ${filtered.length === 0 ? '<div class="empty-state p-md"><p>No locations for this entity.</p></div>' :
              filtered.map(l => `
                <div class="config-list-item">
                  <span class="item-name">${l.name}</span>
                  <div class="item-actions">
                    <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDimensionItem('${STORES.locations}', ${l.id})">🗑️ Delete</button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;

      container.querySelector('#dimEntityLocSelect').addEventListener('change', (e) => {
        selectedEntity = e.target.value;
        updateView();
      });

      container.querySelector('#addLocationBtn').addEventListener('click', () => {
        const name = prompt('Enter new Location name:');
        if (name) {
          db.add(STORES.locations, { entityId: selectedEntity, name }).then(() => {
            Utils.showToast('Location added!', 'success');
            App.renderCurrentPage();
          });
        }
      });
    };

    updateView();
  },

  renderDonorsManager(container, entities, donors) {
    let selectedEntity = entities[0]?.id || '';

    const updateView = () => {
      const filtered = donors.filter(d => d.entityId === selectedEntity);
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="form-inline">
              <label class="form-label" style="margin: 0;">Select Entity:</label>
              <select class="form-select" id="dimEntityDonorSelect" style="width: auto;">
                ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntity ? 'selected' : ''}>${e.flag} ${e.shortName}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" id="addDonorBtn">+ Add Donor</button>
          </div>

          <div class="config-list">
            ${filtered.length === 0 ? '<div class="empty-state p-md"><p>No donors registered yet.</p></div>' :
              filtered.map(d => `
                <div class="config-list-item">
                  <span class="item-name">${d.name}</span>
                  <div class="item-actions">
                    <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDimensionItem('${STORES.donors}', ${d.id})">🗑️ Delete</button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;

      container.querySelector('#dimEntityDonorSelect').addEventListener('change', (e) => {
        selectedEntity = e.target.value;
        updateView();
      });

      container.querySelector('#addDonorBtn').addEventListener('click', () => {
        const name = prompt('Enter Donor / Grant Name:');
        if (name) {
          db.add(STORES.donors, { entityId: selectedEntity, name }).then(() => {
            Utils.showToast('Donor added!', 'success');
            App.renderCurrentPage();
          });
        }
      });
    };

    updateView();
  },

  renderActivitiesManager(container, activities) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Activity Master List (${activities.length})</div>
          <button class="btn btn-primary" id="addActivityBtn">+ Add Activity</button>
        </div>

        <div class="config-list">
          ${activities.map(a => `
            <div class="config-list-item">
              <span class="item-name">${a.name}</span>
              <div class="item-actions">
                <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDimensionItem('${STORES.activities}', ${a.id})">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#addActivityBtn').addEventListener('click', () => {
      const name = prompt('Enter Activity name:');
      if (name) {
        db.add(STORES.activities, { name }).then(() => {
          Utils.showToast('Activity added!', 'success');
          App.renderCurrentPage();
        });
      }
    });
  },

  renderConditionAreasManager(container, conditionAreas) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Condition Areas (${conditionAreas.length})</div>
          <button class="btn btn-primary" id="addCondAreaBtn">+ Add Condition Area</button>
        </div>

        <div class="config-list">
          ${conditionAreas.map(c => `
            <div class="config-list-item">
              <span class="item-name">${c.name}</span>
              <div class="item-actions">
                <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDimensionItem('${STORES.conditionAreas}', ${c.id})">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#addCondAreaBtn').addEventListener('click', () => {
      const name = prompt('Enter Condition Area name:');
      if (name) {
        db.add(STORES.conditionAreas, { name }).then(() => {
          Utils.showToast('Condition Area added!', 'success');
          App.renderCurrentPage();
        });
      }
    });
  },

  async deleteDimensionItem(storeName, id) {
    if (await Utils.confirm('Delete this item?')) {
      await db.delete(storeName, id);
      Utils.showToast('Item deleted', 'info');
      App.renderCurrentPage();
    }
  },

  // ─── 5. Chart of Accounts ───
  async renderChartOfAccounts(container) {
    const coa = await db.getChartOfAccounts();

    const getSubGroupBadge = (subGroup) => {
      const badges = {
        'Payroll Cost': 'badge-primary',
        'Direct Consultants': 'badge-purple',
        'Direct Cost': 'badge-cyan',
        'Indirect Cost': 'badge-warning',
        'Fixed Assets': 'badge-emerald'
      };
      return badges[subGroup] || 'badge-cyan';
    };

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Non-Payroll Chart of Accounts</h2>
          <p>Master account hierarchy &bull; <strong>Drag handle ⠿</strong> to rearrange order &bull; Reordered lines automatically reflect across Total Dept Cost and all consolidated reports</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm" id="resetCoaOrderBtn" title="Reset to standard chart of accounts order">↺ Reset Default Order</button>
          <button class="btn btn-primary" id="addCoaBtn">+ Add Account Line</button>
        </div>
      </div>

      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">GL Line Items (${coa.length})</div>
            <div class="card-subtitle">Drag rows using the ⠿ handle to customize the reporting and summary display order</div>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table" id="coaConfigTable">
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">Order</th>
                <th style="width: 150px;">Sub Group</th>
                <th>Parent Account</th>
                <th>GL Description</th>
                <th>Ledger Code</th>
                <th style="width: 120px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="coaTableBody">
              ${coa.map((c, idx) => `
                <tr class="coa-drag-row" draggable="true" data-id="${c.id}" data-index="${idx}">
                  <td style="text-align: center; cursor: grab;" class="drag-handle-cell">
                    <span class="drag-handle" title="Drag to reorder">⠿ ${idx + 1}</span>
                  </td>
                  <td><span class="badge ${getSubGroupBadge(c.subGroup)}">${c.subGroup || 'Direct Cost'}</span></td>
                  <td><strong>${c.parentAccount}</strong></td>
                  <td>${c.glDescription}</td>
                  <td><code>${c.ledgerCode}</code></td>
                  <td style="text-align: center; white-space: nowrap;">
                    <button class="btn btn-ghost btn-xs" onclick="ConfigModule.editChartOfAccountsLine(${c.id})" title="Edit Account Line">✏️ Edit</button>
                    <button class="btn btn-danger btn-xs" onclick="ConfigModule.deleteDimensionItem('${STORES.chartOfAccounts}', ${c.id})" title="Delete Account Line">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // ─── Drag and Drop Handlers ───
    const tbody = container.querySelector('#coaTableBody');
    if (tbody) {
      let draggedRow = null;

      tbody.querySelectorAll('.coa-drag-row').forEach(row => {
        row.addEventListener('dragstart', (e) => {
          draggedRow = row;
          row.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', row.dataset.id);
        });

        row.addEventListener('dragend', () => {
          row.classList.remove('dragging');
          tbody.querySelectorAll('.coa-drag-row').forEach(r => {
            r.classList.remove('drag-over-top', 'drag-over-bottom');
          });
          draggedRow = null;
        });

        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!draggedRow || draggedRow === row) return;

          const rect = row.getBoundingClientRect();
          const relY = e.clientY - rect.top;
          const isTop = relY < rect.height / 2;

          row.classList.toggle('drag-over-top', isTop);
          row.classList.toggle('drag-over-bottom', !isTop);
        });

        row.addEventListener('dragleave', () => {
          row.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        row.addEventListener('drop', async (e) => {
          e.preventDefault();
          if (!draggedRow || draggedRow === row) return;

          const rect = row.getBoundingClientRect();
          const relY = e.clientY - rect.top;
          const isTop = relY < rect.height / 2;

          if (isTop) {
            tbody.insertBefore(draggedRow, row);
          } else {
            tbody.insertBefore(draggedRow, row.nextSibling);
          }

          // Extract new order of IDs
          const orderedIds = Array.from(tbody.querySelectorAll('.coa-drag-row')).map(r => r.dataset.id);
          await db.updateCoaOrder(orderedIds);
          Utils.showToast('✓ Chart of Accounts order saved & updated across all reports!', 'success');
          await ConfigModule.renderChartOfAccounts(container);
        });
      });
    }

    // ─── Reset Default Order ───
    const resetBtn = container.querySelector('#resetCoaOrderBtn');
    if (resetBtn) {
      resetBtn.onclick = async () => {
        if (await Utils.confirm('Reset Chart of Accounts to standard financial reporting order?')) {
          const defaults = SEED_DATA.chartOfAccounts || [];
          for (let i = 0; i < defaults.length; i++) {
            const def = defaults[i];
            const matching = coa.find(c => String(c.ledgerCode).trim() === String(def.ledgerCode).trim());
            if (matching) {
              matching.sortOrder = i + 1;
              matching.subGroup = def.subGroup;
              matching.parentAccount = def.parentAccount;
              await db.put(STORES.chartOfAccounts, matching);
            }
          }
          Utils.showToast('✓ Reset to standard Chart of Accounts order!', 'success');
          await ConfigModule.renderChartOfAccounts(container);
        }
      };
    }

    // ─── Add Account Line Modal ───
    Utils.$('#addCoaBtn').addEventListener('click', () => {
      const content = `
        <form id="coaForm">
          <div class="form-group">
            <label class="form-label">Sub Group</label>
            <select class="form-select" id="coaSubGroup">
              <option value="Direct Cost">Direct Cost</option>
              <option value="Indirect Cost">Indirect Cost</option>
              <option value="Payroll Cost">Payroll Cost</option>
              <option value="Direct Consultants">Direct Consultants</option>
              <option value="Fixed Assets">Fixed Assets</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Parent Account</label>
            <input type="text" class="form-input" id="coaParent" placeholder="e.g. Travel & Lodging Expenses" required>
          </div>
          <div class="form-group">
            <label class="form-label">GL Description</label>
            <input type="text" class="form-input" id="coaGl" placeholder="e.g. Hotel Accommodation" required>
          </div>
          <div class="form-group">
            <label class="form-label">Ledger Code</label>
            <input type="text" class="form-input" id="coaCode" placeholder="e.g. 93101" required>
          </div>
        </form>
      `;

      Utils.showModal('Add Account Line', content, {
        footer: (footer, close) => {
          footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
          footer.appendChild(Utils.createElement('button', {
            className: 'btn btn-primary', textContent: 'Save Account',
            onClick: async () => {
              const maxOrder = Math.max(0, ...coa.map(c => Number(c.sortOrder) || 0));
              const data = {
                sortOrder: maxOrder + 1,
                subGroup: Utils.$('#coaSubGroup').value,
                parentAccount: Utils.$('#coaParent').value.trim(),
                glDescription: Utils.$('#coaGl').value.trim(),
                ledgerCode: Utils.$('#coaCode').value.trim()
              };
              if (!data.parentAccount || !data.glDescription || !data.ledgerCode) {
                Utils.showToast('Please fill in all account fields.', 'warning');
                return;
              }
              await db.add(STORES.chartOfAccounts, data);
              Utils.showToast('Account line added! Available for budgeting in Other Costs.', 'success');
              close();
              await ConfigModule.renderChartOfAccounts(container);
            }
          }));
        }
      });
    });
  },

  async editChartOfAccountsLine(id) {
    const item = await db.get(STORES.chartOfAccounts, id);
    if (!item) return;

    const content = `
      <form id="editCoaForm">
        <div class="form-group">
          <label class="form-label">Sub Group</label>
          <select class="form-select" id="editCoaSubGroup">
            <option value="Direct Cost" ${item.subGroup === 'Direct Cost' ? 'selected' : ''}>Direct Cost</option>
            <option value="Indirect Cost" ${item.subGroup === 'Indirect Cost' ? 'selected' : ''}>Indirect Cost</option>
            <option value="Payroll Cost" ${item.subGroup === 'Payroll Cost' ? 'selected' : ''}>Payroll Cost</option>
            <option value="Direct Consultants" ${item.subGroup === 'Direct Consultants' ? 'selected' : ''}>Direct Consultants</option>
            <option value="Fixed Assets" ${item.subGroup === 'Fixed Assets' ? 'selected' : ''}>Fixed Assets</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Parent Account</label>
          <input type="text" class="form-input" id="editCoaParent" value="${Utils.escapeHtml(item.parentAccount || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">GL Description</label>
          <input type="text" class="form-input" id="editCoaGl" value="${Utils.escapeHtml(item.glDescription || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Ledger Code</label>
          <input type="text" class="form-input" id="editCoaCode" value="${Utils.escapeHtml(item.ledgerCode || '')}" required>
        </div>
      </form>
    `;

    Utils.showModal('Edit Account Line', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Update Account',
          onClick: async () => {
            item.subGroup = Utils.$('#editCoaSubGroup').value;
            item.parentAccount = Utils.$('#editCoaParent').value.trim();
            item.glDescription = Utils.$('#editCoaGl').value.trim();
            item.ledgerCode = Utils.$('#editCoaCode').value.trim();

            await db.put(STORES.chartOfAccounts, item);
            Utils.showToast('Account line updated!', 'success');
            close();
            const container = document.querySelector('#page-content') || document.querySelector('.page-content');
            if (container) await ConfigModule.renderChartOfAccounts(container);
          }
        }));
      }
    });
  },

  // ─── 6. Travel Rates Master Configuration ───
  async renderTravelRates(container) {
    const entities = await db.getAll(STORES.entities);
    let selectedEntityId = entities[0]?.id || 'nhipl';

    const updateView = async () => {
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const rates = await db.getTravelRatesForEntity(entity.id);

      // Find default City and Non-City rates
      const defaultCityRate = rates.find(r => (r.isDefault || r.location?.includes('Default') || r.location === 'All') && r.category === 'City') || rates.find(r => r.category === 'City');
      const defaultNonCityRate = rates.find(r => (r.isDefault || r.location?.includes('Default') || r.location === 'All') && r.category === 'Non-City') || rates.find(r => r.category === 'Non-City');

      // Sort: Defaults first, then alphabetical by location
      const sortedRates = [...rates].sort((a, b) => {
        const aDef = a.isDefault || a.location?.includes('Default') ? 1 : 0;
        const bDef = b.isDefault || b.location?.includes('Default') ? 1 : 0;
        if (aDef !== bDef) return bDef - aDef;
        return (a.location || '').localeCompare(b.location || '');
      });

      container.innerHTML = `
        <div class="page-header flex justify-between items-center">
          <div>
            <h2>Travel Rates Master</h2>
            <p>Admin benchmark rates for Hotel, Food, Cab, Airfare, and Train by Location & City/Non-City category</p>
          </div>
          <button class="btn btn-primary" id="addTravelRateBtn">+ Add Travel Rate</button>
        </div>

        <!-- Default Benchmark Rates Banner -->
        <div class="grid grid-2 gap-md mb-lg">
          <div class="card p-md" style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(37, 99, 235, 0.08)); border: 1.5px solid rgba(6, 182, 212, 0.3);">
            <div class="flex justify-between items-center mb-sm">
              <div class="font-bold flex items-center gap-xs" style="color: var(--accent-primary); font-size: 0.95rem;">
                <span>⭐ Default City / Metro Rate</span>
                <span class="badge badge-cyan" style="font-size: 10px;">Fallback</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editDefaultRate('${entity.id}', 'City')">✏️ Edit Default City</button>
            </div>
            <div class="flex flex-wrap gap-sm mb-xs" style="font-size: 12px;">
              <span class="badge badge-subtle">🏨 Hotel: <strong>${Utils.formatCurrency(defaultCityRate?.hotelPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">🍽️ Food: <strong>${Utils.formatCurrency(defaultCityRate?.foodPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">🚕 Cab: <strong>${Utils.formatCurrency(defaultCityRate?.cabPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">✈️ Air: <strong>${Utils.formatCurrency(defaultCityRate?.airfarePerTrip || 0, entity.currency)}/flight</strong></span>
              <span class="badge badge-subtle">🚆 Train: <strong>${Utils.formatCurrency(defaultCityRate?.busTrainPerTrip || 0, entity.currency)}/trip</strong></span>
            </div>
            <div class="text-tertiary" style="font-size: 11px;">Applies to all urban/city travel across ${entity.name} unless overridden</div>
          </div>

          <div class="card p-md" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08)); border: 1.5px solid rgba(16, 185, 129, 0.3);">
            <div class="flex justify-between items-center mb-sm">
              <div class="font-bold flex items-center gap-xs" style="color: var(--success); font-size: 0.95rem;">
                <span>🌾 Default Non-City / Field Rate</span>
                <span class="badge badge-emerald" style="font-size: 10px;">Fallback</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editDefaultRate('${entity.id}', 'Non-City')">✏️ Edit Default Non-City</button>
            </div>
            <div class="flex flex-wrap gap-sm mb-xs" style="font-size: 12px;">
              <span class="badge badge-subtle">🏨 Hotel: <strong>${Utils.formatCurrency(defaultNonCityRate?.hotelPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">🍽️ Food: <strong>${Utils.formatCurrency(defaultNonCityRate?.foodPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">🚕 Cab: <strong>${Utils.formatCurrency(defaultNonCityRate?.cabPerDay || 0, entity.currency)}/day</strong></span>
              <span class="badge badge-subtle">✈️ Air: <strong>${Utils.formatCurrency(defaultNonCityRate?.airfarePerTrip || 0, entity.currency)}/flight</strong></span>
              <span class="badge badge-subtle">🚆 Train: <strong>${Utils.formatCurrency(defaultNonCityRate?.busTrainPerTrip || 0, entity.currency)}/trip</strong></span>
            </div>
            <div class="text-tertiary" style="font-size: 11px;">Applies to all field/rural travel across ${entity.name} unless overridden</div>
          </div>
        </div>

        <div class="card mb-lg">
          <div class="card-header flex justify-between items-center">
            <div class="form-inline gap-md">
              <label class="form-label" style="margin:0; font-weight: 600;">Select Entity:</label>
              <select class="form-select" id="travelRateEntitySelect" style="width: auto;">
                ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntityId ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.currency})</option>`).join('')}
              </select>
            </div>
            <div class="flex gap-sm items-center">
              <span class="badge badge-cyan">Currency: <strong>${entity.currency}</strong></span>
              <span class="badge badge-emerald">${rates.length} Configured Benchmark Rates</span>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sticky-col">Destination Location</th>
                  <th>Category</th>
                  <th class="num">Hotel / Day (${entity.currency})</th>
                  <th class="num">Food / Day (${entity.currency})</th>
                  <th class="num">Cab / Day (${entity.currency})</th>
                  <th class="num">Airfare / Trip (${entity.currency})</th>
                  <th class="num">Bus/Train / Trip (${entity.currency})</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sortedRates.length === 0 ? `
                  <tr>
                    <td colspan="8" class="text-center text-muted" style="padding: 24px;">No standard travel rates configured yet for ${entity.name}. Click "+ Add Travel Rate" to create.</td>
                  </tr>
                ` : sortedRates.map(r => {
                  const isDef = r.isDefault || r.location?.includes('Default');
                  return `
                    <tr style="${isDef ? 'background: rgba(6, 182, 212, 0.03); font-weight: 500;' : ''}">
                      <td class="sticky-col font-bold">
                        ${r.location}
                        ${isDef ? `<span class="badge badge-cyan" style="font-size: 10px; margin-left: 6px;">⭐ Default Fallback</span>` : ''}
                      </td>
                      <td>
                        <span class="badge ${r.category === 'City' ? 'badge-cyan' : 'badge-subtle'}">
                          ${r.category === 'City' ? '🏙️ City / Metro' : '🌾 Non-City / Field'}
                        </span>
                      </td>
                      <td class="num font-mono font-bold">${Utils.formatCurrency(r.hotelPerDay || 0, entity.currency)}</td>
                      <td class="num font-mono font-bold">${Utils.formatCurrency(r.foodPerDay || 0, entity.currency)}</td>
                      <td class="num font-mono font-bold">${Utils.formatCurrency(r.cabPerDay || 0, entity.currency)}</td>
                      <td class="num font-mono font-bold">${Utils.formatCurrency(r.airfarePerTrip || 0, entity.currency)}</td>
                      <td class="num font-mono font-bold">${Utils.formatCurrency(r.busTrainPerTrip || 0, entity.currency)}</td>
                      <td>
                        <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editTravelRate(${r.id})">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteTravelRate(${r.id})">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelector('#travelRateEntitySelect').addEventListener('change', (e) => {
        selectedEntityId = e.target.value;
        updateView();
      });

      container.querySelector('#addTravelRateBtn').addEventListener('click', () => {
        this.showTravelRateForm(entity);
      });
    };

    await updateView();
  },

  async showTravelRateForm(entity, existing = null) {
    const isEdit = !!existing;
    const baseLocations = SEED_DATA.locations[entity.id] || [];
    const entityLocations = ['Default (All Locations)'].concat(baseLocations.filter(l => l !== 'Default (All Locations)')).concat(['Other Location']);

    const content = `
      <form id="travelRateForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <select class="form-select" id="rateLocation" required>
              ${entityLocations.map(loc => `<option value="${loc}" ${existing?.location === loc ? 'selected' : ''}>${loc === 'Default (All Locations)' ? '⭐ Default (All Locations)' : loc}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Travel Category</label>
            <select class="form-select" id="rateCategory" required>
              <option value="City" ${existing?.category === 'City' ? 'selected' : ''}>🏙️ City (Metro / Urban)</option>
              <option value="Non-City" ${existing?.category === 'Non-City' ? 'selected' : ''}>🌾 Non-City (Rural / Field / District)</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="flex items-center gap-xs cursor-pointer">
            <input type="checkbox" id="rateIsDefault" ${existing?.isDefault || existing?.location?.includes('Default') ? 'checked' : ''}>
            <span style="font-size: 12px; font-weight: 600;">Set as Default / Fallback benchmark rate for this category (used when location-specific rate is not specified)</span>
          </label>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Hotel Rate / Day (${entity.currency})</label>
            <input type="number" class="form-input" id="rateHotel" value="${existing?.hotelPerDay || 0}" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Food Rate / Day (${entity.currency})</label>
            <input type="number" class="form-input" id="rateFood" value="${existing?.foodPerDay || 0}" min="0" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Local Cab / Auto / Day (${entity.currency})</label>
            <input type="number" class="form-input" id="rateCab" value="${existing?.cabPerDay || 0}" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Airfare / Flight Trip (${entity.currency})</label>
            <input type="number" class="form-input" id="rateAirfare" value="${existing?.airfarePerTrip || 0}" min="0" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Bus / Train / Trip (${entity.currency})</label>
          <input type="number" class="form-input" id="rateBusTrain" value="${existing?.busTrainPerTrip || 0}" min="0" required>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? 'Edit Travel Benchmark Rate' : 'Add Travel Benchmark Rate', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: isEdit ? 'Update Rate' : 'Save Rate',
          onClick: async () => {
            const locVal = Utils.$('#rateLocation').value;
            const isDef = Utils.$('#rateIsDefault').checked || locVal.includes('Default');

            const data = {
              ...(existing || {}),
              entityId: entity.id,
              location: locVal,
              category: Utils.$('#rateCategory').value,
              isDefault: isDef,
              hotelPerDay: Utils.parseNumber(Utils.$('#rateHotel').value),
              foodPerDay: Utils.parseNumber(Utils.$('#rateFood').value),
              cabPerDay: Utils.parseNumber(Utils.$('#rateCab').value),
              airfarePerTrip: Utils.parseNumber(Utils.$('#rateAirfare').value),
              busTrainPerTrip: Utils.parseNumber(Utils.$('#rateBusTrain').value),
              currency: entity.currency
            };

            if (isEdit) {
              await db.put(STORES.travelRates, data);
            } else {
              await db.add(STORES.travelRates, data);
            }
            Utils.showToast(isEdit ? 'Travel rate updated!' : 'Travel rate added!', 'success');
            close();
            App.renderCurrentPage();
          }
        }));
      }
    });
  },

  async editTravelRate(id) {
    const rate = await db.get(STORES.travelRates, id);
    if (!rate) return;
    const entities = await db.getAll(STORES.entities);
    const entity = entities.find(e => e.id === rate.entityId) || entities[0];
    this.showTravelRateForm(entity, rate);
  },

  async editDefaultRate(entityId, category) {
    const entities = await db.getAll(STORES.entities);
    const entity = entities.find(e => e.id === entityId) || entities[0];
    const rates = await db.getTravelRatesForEntity(entity.id);

    let defaultRate = rates.find(r => (r.isDefault || r.location?.includes('Default') || r.location === 'All') && r.category === category);

    if (!defaultRate) {
      defaultRate = {
        entityId: entity.id,
        location: 'Default (All Locations)',
        category: category,
        isDefault: true,
        hotelPerDay: category === 'City' ? 3500 : 2200,
        foodPerDay: category === 'City' ? 1000 : 700,
        cabPerDay: category === 'City' ? 1200 : 800,
        airfarePerTrip: category === 'City' ? 8500 : 6500,
        busTrainPerTrip: category === 'City' ? 2500 : 1500,
        currency: entity.currency
      };
    }

    this.showTravelRateForm(entity, defaultRate);
  },

  async deleteTravelRate(id) {
    if (confirm('Are you sure you want to delete this travel rate?')) {
      await db.delete(STORES.travelRates, id);
      Utils.showToast('Travel rate deleted', 'info');
      App.renderCurrentPage();
    }
  },

  // ─── 7. Masterlist of Employees Configuration ───
  async renderEmployeesMaster(container) {
    try {
      const rawEntities = (await db.getAll(STORES.entities)) || [];
      const entities = (typeof Auth !== 'undefined') ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
      const accessibleEntityIds = new Set(entities.map(e => e.id));

      const departments = (await db.getAll(STORES.departments)) || [];
      const years = (await db.getAll(STORES.budgetYears)) || [];
      let allEmployees = (await db.getEmployeesMaster()) || [];

      // Strictly filter all employees to only those within the user's accessible entities
      allEmployees = allEmployees.filter(e => !e.entityId || accessibleEntityIds.has(e.entityId));

      // If user has access to only 1 entity, default to that entity. Otherwise default to 'all' (scoped to accessible entities)
      let selectedEntityId = entities.length === 1 ? entities[0].id : 'all';
      let selectedDeptId = 'all';
      let searchQuery = '';

      // Exchange rates
      const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || { year: 2026 };
      const rates = Utils.getConversionRates(currentYearObj);

      const getRateForEntity = (ent) => {
        if (!ent || !ent.currency || ent.currency === 'USD') return 1.0;
        return rates[ent.currency] || 1.0;
      };

      const toUSD = (amount, ent) => {
        const r = getRateForEntity(ent);
        return Utils.convertToUSD(amount, r);
      };

      const getAvailableDepartments = (entityId) => {
        if (!entityId || entityId === 'all') {
          const depts = (typeof Auth !== 'undefined') ? Auth.filterAccessibleDepts(departments, null) : departments;
          return Utils.sortDepartments(depts);
        }
        const depts = (typeof Auth !== 'undefined') ? Auth.filterAccessibleDepts(departments, entityId) : departments;
        const filtered = depts.filter(d => {
          if (d.entityMapping && typeof d.entityMapping[entityId] !== 'undefined') {
            return d.entityMapping[entityId] === true;
          }
          if (entityId === 'nhipl') {
            return d.scope === 'country' || d.scope === 'gl' || d.scope === 'dp-cp' || d.scope === 'general';
          }
          if (entityId === 'noora-us') {
            return d.scope === 'gl' || d.scope === 'dp-gp' || d.scope === 'general';
          }
          return d.scope === 'country' || d.scope === 'dp-cp' || d.scope === 'general';
        });
        return Utils.sortDepartments(filtered);
      };

      const updateView = () => {
        const isAllEntities = selectedEntityId === 'all';
        const activeEntity = entities.find(e => e.id === selectedEntityId) || entities[0] || { currency: 'USD' };
        const availableDepts = getAvailableDepartments(selectedEntityId);

        // Reset dept filter when switching to all entities or when dept not in available list
        if (isAllEntities || (selectedDeptId !== 'all' && !availableDepts.some(d => d.id === selectedDeptId))) {
          selectedDeptId = 'all';
        }

        let filtered = [...allEmployees];

        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(e => e.entityId === selectedEntityId);
        } else {
          filtered = filtered.filter(e => !e.entityId || accessibleEntityIds.has(e.entityId));
        }
        if (selectedDeptId !== 'all') {
          filtered = filtered.filter(e => e.deptId === selectedDeptId || e.department === selectedDeptId);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(e => 
            (e.name || '').toLowerCase().includes(q) ||
            (e.employeeCode || '').toLowerCase().includes(q) ||
            (e.reportingManager || '').toLowerCase().includes(q) ||
            (e.department || '').toLowerCase().includes(q) ||
            (e.band || '').toLowerCase().includes(q)
          );
        }

        // Calculate totals
        const totalHeadcount = filtered.length;
        let totalAnnualUSD = 0;
        let totalMonthlyUSD = 0;
        let totalAnnualLocal = 0;
        let totalMonthlyLocal = 0;

        filtered.forEach(e => {
          const ent = entities.find(x => x.id === e.entityId) || entities[0] || { currency: 'USD' };
          const aCTC = Utils.parseNumber(e.annualCTC) || 0;
          const mCTC = Utils.parseNumber(e.monthlyCTC) || Math.round(aCTC / 12);
          totalAnnualUSD += toUSD(aCTC, ent);
          totalMonthlyUSD += toUSD(mCTC, ent);
          totalAnnualLocal += aCTC;
          totalMonthlyLocal += mCTC;
        });

        // Store filtered employees for Download Data
        this._currentFilteredEmployees = filtered;

        container.innerHTML = `
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>Employees Master List</h2>
              <p>Master personnel directory with Code, Band, Date of Joining, Department, Reporting Manager, Annual CTC, and Monthly CTC (Annual/12)</p>
            </div>
            <div class="flex gap-sm items-center flex-wrap">
              <span class="badge badge-cyan" style="font-size: 11px;">Reporting Currency: <strong>USD ($)</strong></span>
              <button class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterData()" style="border-color: var(--accent-primary); color: var(--accent-primary); font-weight: 600;">📥 Download Data</button>
              <button class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterTemplate()">📥 Download Template</button>
              <button class="btn btn-secondary btn-sm" onclick="ConfigModule.showEmployeeMasterUploadModal()" style="font-weight: 600;">📤 Bulk Upload</button>
              <button class="btn btn-primary" id="addEmployeeBtn">➕ + Add Employee</button>
            </div>
          </div>

          <!-- Metric KPI Cards -->
          <div class="metric-grid mb-lg">
            <div class="card metric-card">
              <div class="metric-header">
                <span class="metric-label">Total Master Employees</span>
                <span class="badge badge-cyan">Headcount</span>
              </div>
              <div class="metric-value font-mono">${totalHeadcount}</div>
              <div class="metric-subtext">Active team members in masterlist</div>
            </div>

            <div class="card metric-card">
              <div class="metric-header">
                <span class="metric-label">Total Annual CTC</span>
                <span class="badge badge-emerald">${isAllEntities ? 'USD Reporting' : activeEntity.currency}</span>
              </div>
              ${isAllEntities ? `
                <div class="metric-value font-mono" style="color: var(--accent-primary);">${Utils.formatCurrency(totalAnnualUSD, 'USD')}</div>
                <div class="metric-subtext">Consolidated USD reporting across your assigned entities</div>
              ` : `
                <div class="metric-value font-mono" style="color: var(--accent-primary);">${Utils.formatCurrency(totalAnnualLocal, activeEntity.currency)}</div>
                <div class="metric-subtext font-bold" style="color: var(--accent-secondary);">≈ ${Utils.formatCurrency(totalAnnualUSD, 'USD')} USD</div>
              `}
            </div>

            <div class="card metric-card">
              <div class="metric-header">
                <span class="metric-label">Total Monthly CTC</span>
                <span class="badge badge-subtle">${isAllEntities ? 'USD (Annual / 12)' : 'Annual / 12'}</span>
              </div>
              ${isAllEntities ? `
                <div class="metric-value font-mono" style="color: var(--accent-secondary);">${Utils.formatCurrency(totalMonthlyUSD, 'USD')}</div>
                <div class="metric-subtext">Consolidated USD monthly compensation (Annual / 12)</div>
              ` : `
                <div class="metric-value font-mono" style="color: var(--accent-secondary);">${Utils.formatCurrency(totalMonthlyLocal, activeEntity.currency)}</div>
                <div class="metric-subtext font-bold" style="color: var(--accent-primary);">≈ ${Utils.formatCurrency(totalMonthlyUSD, 'USD')} USD</div>
              `}
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
              <div class="flex gap-md items-center" style="flex: 1; min-width: 280px; flex-wrap: wrap;">
                <input type="text" class="form-input" id="empSearchInput" placeholder="🔍 Search by Name, Code, Dept, Manager..." value="${searchQuery}" style="max-width: 320px;">
                
                <select class="form-select" id="empEntityFilter" style="width: auto;">
                  ${entities.length > 1 ? `<option value="all" ${selectedEntityId === 'all' ? 'selected' : ''}>🏢 All Assigned Entities (${entities.length})</option>` : ''}
                  ${entities.map(e => `<option value="${e.id}" ${selectedEntityId === e.id ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.currency})</option>`).join('')}
                </select>

                ${!isAllEntities ? `
                <select class="form-select font-mono font-bold" id="empDeptFilter" style="width: auto; min-width: 170px;">
                  <option value="all">🏛️ All Departments (${availableDepts.length})</option>
                  ${availableDepts.map(d => {
                    const shortCode = Utils.getDeptShortCode(d, activeEntity?.deptPrefix || 'IN');
                    return `<option value="${d.id}" ${selectedDeptId === d.id ? 'selected' : ''}>${shortCode}</option>`;
                  }).join('')}
                </select>
                ` : ''}
              </div>

              <div class="flex gap-sm items-center">
                <button class="btn btn-secondary btn-sm" id="btnResetEmployeesMaster" title="Reset and reload complete multi-country dummy dataset">🔄 Reset Dummy Master Data</button>
                <span class="badge badge-subtle font-mono">${filtered.length} of ${allEmployees.length} Shown</span>
              </div>
            </div>

            <div class="table-container" style="overflow-x: auto;">
              <table class="data-table" style="min-width: 1050px; width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 95px; text-align: center; white-space: nowrap;">Emp Code</th>
                    <th style="width: 75px; text-align: center; white-space: nowrap;">Band</th>
                    <th style="min-width: 200px; white-space: nowrap;">Name &amp; Designation</th>
                    ${isAllEntities ? '<th style="width: 90px; text-align: center; white-space: nowrap;">Entity</th>' : ''}
                    <th style="width: 60px; text-align: center; white-space: nowrap;" title="Country of Employment (ISO 2-letter code)">Country</th>
                    <th style="width: 105px; white-space: nowrap;">Date of Joining</th>
                    <th style="width: 115px; text-align: center; white-space: nowrap;">Department</th>
                    <th style="width: 150px; white-space: nowrap;">Reporting Manager</th>
                    <th class="num font-bold" style="width: 130px; text-align: right; white-space: nowrap;">${isAllEntities ? 'Annual CTC (USD)' : `Annual CTC (${activeEntity.currency})`}</th>
                    <th class="num font-bold" style="width: 130px; text-align: right; color: var(--accent-primary); white-space: nowrap;">${isAllEntities ? 'Monthly CTC (USD)' : `Monthly CTC (${activeEntity.currency})`}</th>
                    <th style="width: 85px; text-align: center; white-space: nowrap;">Status</th>
                    <th style="width: 95px; text-align: center; white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="${isAllEntities ? 12 : 11}" class="text-center text-muted" style="padding: 32px;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">👤</div>
                        <div>No employee records found matching your filters.</div>
                        <button class="btn btn-primary btn-sm mt-sm" onclick="ConfigModule.showEmployeeMasterForm()">➕ + Add First Employee</button>
                      </td>
                    </tr>
                  ` : filtered.map(e => {
                    const ent = entities.find(x => x.id === e.entityId) || entities[0];
                    const empCurr = ent?.currency || 'INR';
                    const aCTC = Utils.parseNumber(e.annualCTC) || 0;
                    const mCTC = Utils.parseNumber(e.monthlyCTC) || Math.round(aCTC / 12);
                    const aUSD = toUSD(aCTC, ent);
                    const mUSD = toUSD(mCTC, ent);

                    const deptObj = departments.find(d => d.id === e.deptId || d.name === e.department) || { id: e.deptId, codeTemplate: e.department || e.deptId };
                    const deptShort = Utils.getDeptShortCode(deptObj, ent?.deptPrefix || 'IN');

                    return `
                      <tr>
                        <td style="text-align: center; width: 95px; white-space: nowrap;">
                          <span class="badge badge-subtle font-mono font-bold" style="font-size: 11px; padding: 2px 6px;">${e.employeeCode || '—'}</span>
                        </td>
                        <td style="text-align: center; width: 75px; white-space: nowrap;">
                          <span class="badge badge-cyan font-bold" style="font-size: 11px; padding: 2px 6px;">${e.band || 'NH3'}</span>
                        </td>
                        <td style="min-width: 200px;">
                          <div class="font-bold flex items-center gap-xs">
                            <span>👤</span>
                            <span>${e.name || 'Unnamed Staff'}</span>
                          </div>
                          ${e.designation ? `<div class="text-tertiary" style="font-size: 11px; margin-top: 1px;">${e.designation}</div>` : ''}
                        </td>
                        ${isAllEntities ? `<td style="text-align: center; width: 90px; white-space: nowrap;"><span class="badge badge-subtle font-bold" style="font-size: 10.5px;">${ent.flag} ${ent.shortName}</span></td>` : ''}
                        <td style="text-align: center; width: 60px; white-space: nowrap;">
                          ${e.countryCode ? `<span class="badge badge-subtle font-mono font-bold" style="font-size: 10.5px; padding: 2px 5px;" title="Employed from: ${e.countryCode}">${e.countryCode}</span>` : '<span class="text-tertiary">—</span>'}
                        </td>
                        <td style="font-size: 11.5px; font-family: var(--font-mono); width: 105px; white-space: nowrap;">
                          ${e.doj ? Utils.formatDate(e.doj) : '—'}
                        </td>
                        <td style="text-align: center; width: 115px; white-space: nowrap;">
                          <span class="badge badge-subtle font-mono font-bold" style="font-size: 11px; padding: 2px 6px;" title="${e.department || deptObj.name || ''}">${deptShort}</span>
                        </td>
                        <td style="width: 150px; font-size: 12px;">
                          ${e.reportingManager ? `<span class="flex items-center gap-xs"><span>👔</span><span>${e.reportingManager}</span></span>` : '<span class="text-tertiary">—</span>'}
                        </td>
                        <td class="num font-mono" style="width: 130px; text-align: right;">
                          ${isAllEntities ? `
                            <div class="font-bold" style="color: var(--accent-primary); font-size: 12.5px;">${Utils.formatCurrency(aUSD, 'USD')}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary" style="font-size: 10.5px;">(${Utils.formatCurrency(aCTC, empCurr)})</div>` : ''}
                          ` : `
                            <div class="font-bold" style="font-size: 12.5px;">${Utils.formatCurrency(aCTC, empCurr)}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary font-bold" style="font-size: 10.5px; color: var(--accent-primary);">≈ ${Utils.formatCurrency(aUSD, 'USD')}</div>` : ''}
                          `}
                        </td>
                        <td class="num font-mono" style="width: 130px; text-align: right; background: rgba(6, 182, 212, 0.04);">
                          ${isAllEntities ? `
                            <div class="font-bold" style="color: var(--accent-secondary); font-size: 12.5px;">${Utils.formatCurrency(mUSD, 'USD')}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary" style="font-size: 10.5px;">(${Utils.formatCurrency(mCTC, empCurr)})</div>` : ''}
                          ` : `
                            <div class="font-bold" style="font-size: 12.5px; color: var(--accent-primary);">${Utils.formatCurrency(mCTC, empCurr)}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary font-bold" style="font-size: 10.5px; color: var(--accent-secondary);">≈ ${Utils.formatCurrency(mUSD, 'USD')}</div>` : ''}
                          `}
                        </td>
                        <td style="text-align: center; width: 85px; white-space: nowrap;">
                          <span class="badge ${e.status === 'Inactive' ? 'badge-subtle' : 'badge-emerald'}" style="font-size: 10.5px; padding: 2px 6px;">
                            ${e.status || 'Active'}
                          </span>
                        </td>
                        <td style="text-align: center; width: 95px; white-space: nowrap;">
                          <button class="btn btn-ghost btn-sm" style="padding: 2px 6px; font-size: 11px;" onclick="ConfigModule.editEmployeeMaster(${e.id})">✏️ Edit</button>
                          <button class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 11px;" onclick="ConfigModule.deleteEmployeeMaster(${e.id})">🗑️</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        // Event Listeners
        const searchInput = container.querySelector('#empSearchInput');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateView();
            // Restore focus
            const el = container.querySelector('#empSearchInput');
            if (el) {
              el.focus();
              el.setSelectionRange(el.value.length, el.value.length);
            }
          });
        }

        const entityFilter = container.querySelector('#empEntityFilter');
        if (entityFilter) {
          entityFilter.addEventListener('change', (e) => {
            selectedEntityId = e.target.value;
            selectedDeptId = 'all'; // reset dept on entity switch
            updateView();
          });
        }

        const deptFilter = container.querySelector('#empDeptFilter');
        if (deptFilter) {
          deptFilter.addEventListener('change', (e) => {
            selectedDeptId = e.target.value;
            updateView();
          });
        }

        const addBtn = container.querySelector('#addEmployeeBtn');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            this.showEmployeeMasterForm();
          });
        }

        const resetBtn = container.querySelector('#btnResetEmployeesMaster');
        if (resetBtn) {
          resetBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to reset and reload the complete multi-country dummy Employee Master dataset? Any custom unsaved modifications will be replaced with fresh trial records.')) {
              try {
                Utils.showToast('Reloading dummy employee master...', 'info');
                await db.resetEmployeesMasterToDefault();
                Utils.showToast('✓ Employee Master successfully reset with multi-country dummy dataset!', 'success');
                this.renderEmployeesMaster(container);
              } catch (err) {
                Utils.showToast('Failed to reset employee master: ' + err.message, 'error');
              }
            }
          });
        }
      };

      updateView();
    } catch (err) {
      console.error('Error rendering Employees Master:', err);
      container.innerHTML = `
        <div class="card p-lg text-center">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚠️</div>
          <h3>Unable to load Employees Master</h3>
          <p class="text-tertiary mb-md">${err.message || 'An error occurred while loading the employee directory.'}</p>
          <button class="btn btn-primary" onclick="App.renderCurrentPage()">🔄 Retry</button>
        </div>
      `;
    }
  },

  async showEmployeeMasterForm(existing = null) {
    const isEdit = !!existing;
    const rawEntities = (await db.getAll(STORES.entities)) || [];
    const entities = (typeof Auth !== 'undefined') ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));

    if (entities.length === 0) {
      Utils.showToast('You do not have access to manage employees for any entities.', 'warning');
      return;
    }

    const allDepts = (await db.getAll(STORES.departments)) || [];
    const years = (await db.getAll(STORES.budgetYears)) || [];
    let allEmployees = (await db.getEmployeesMaster()) || [];
    allEmployees = allEmployees.filter(e => !e.entityId || accessibleEntityIds.has(e.entityId));
    const managerNames = Array.from(new Set(allEmployees.map(e => e.name).filter(Boolean)));

    const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || { year: 2026 };
    const rates = Utils.getConversionRates(currentYearObj);

    const defaultEntity = entities.find(e => e.id === existing?.entityId) || entities[0];
    const aCTC = existing?.annualCTC || 0;
    const mCTC = existing?.monthlyCTC || Math.round(aCTC / 12);
    const rate = rates[defaultEntity?.currency] || 1.0;
    const usdVal = Utils.convertToUSD(aCTC, rate);

    const getAvailableDeptsForEntity = (entityId) => {
      const depts = (typeof Auth !== 'undefined') ? Auth.filterAccessibleDepts(allDepts, entityId) : allDepts;
      const filtered = depts.filter(d => {
        if (d.entityMapping && typeof d.entityMapping[entityId] !== 'undefined') {
          return d.entityMapping[entityId] === true;
        }
        if (entityId === 'nhipl') {
          return d.scope === 'country' || d.scope === 'gl' || d.scope === 'dp-cp' || d.scope === 'general';
        }
        if (entityId === 'noora-us') {
          return d.scope === 'gl' || d.scope === 'dp-gp' || d.scope === 'general';
        }
        return d.scope === 'country' || d.scope === 'dp-cp' || d.scope === 'general';
      });
      return Utils.sortDepartments(filtered);
    };

    const initialDepts = getAvailableDeptsForEntity(defaultEntity.id);

    const content = `
      <form id="employeeMasterForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Employee Code</label>
            <input type="text" class="form-input font-mono" id="mEmpCode" value="${existing?.employeeCode || 'NH-' + Math.floor(1000 + Math.random() * 9000)}" placeholder="e.g. NH-IN-1045" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Name of the Employee</label>
            <input type="text" class="form-input" id="mEmpName" value="${existing?.name || ''}" placeholder="Full name of the employee" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Country of Employment <span class="badge badge-cyan" style="font-size: 10px; vertical-align: middle;">ISO 2-letter</span></label>
            <input type="text" class="form-input font-mono font-bold" id="mEmpCountryCode" value="${existing?.countryCode || ''}" placeholder="e.g. IN, US, BD, ID, NP" maxlength="2" style="text-transform: uppercase; max-width: 90px;">
            <div class="text-tertiary mt-xs" style="font-size: 11px;">2-letter ISO country code of the country where this employee is hired & employed (e.g. IN = India, US = United States, BD = Bangladesh)</div>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Designation / Role</label>
            <input type="text" class="form-input" id="mEmpDesignation" value="${existing?.designation || ''}" placeholder="e.g. Senior Health Communications Lead">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Band</label>
            <select class="form-select" id="mEmpBand" required>
              ${SEED_DATA.bandings.map(b => `<option value="${b}" ${existing?.band === b ? 'selected' : ''}>${b}</option>`).join('')}
              <option value="NH6" ${existing?.band === 'NH6' ? 'selected' : ''}>NH6</option>
              <option value="Leadership" ${existing?.band === 'Leadership' ? 'selected' : ''}>Leadership</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Date of Joining (DOJ)</label>
            <input type="date" class="form-input" id="mEmpDoj" value="${existing?.doj || new Date().toISOString().split('T')[0]}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Legal Entity</label>
            <select class="form-select" id="mEmpEntity" required>
              ${entities.map(e => `<option value="${e.id}" ${existing?.entityId === e.id ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.currency})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Department (Shortform)</label>
            <select class="form-select font-mono font-bold" id="mEmpDept" required>
              ${initialDepts.map(d => {
                const shortCode = Utils.getDeptShortCode(d, defaultEntity?.deptPrefix || 'IN');
                return `<option value="${d.id}" data-name="${d.name}" ${existing?.deptId === d.id || existing?.department === d.name ? 'selected' : ''}>${shortCode}</option>`;
              }).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-bold">Reporting Manager</label>
            <input type="text" class="form-input" id="mEmpManager" list="managerSuggestions" value="${existing?.reportingManager || ''}" placeholder="Name of the reporting manager">
            <datalist id="managerSuggestions">
              ${managerNames.map(m => `<option value="${m}">`).join('')}
            </datalist>
            <div class="text-tertiary mt-xs" style="font-size: 11px;">Start typing to see suggestions from existing employee names.</div>
          </div>
        </div>

        <!-- Annual and Calculated Monthly CTC with Dual Currency -->
        <div class="card p-md mb-sm" style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(37, 99, 235, 0.05)); border: 1.5px solid rgba(6, 182, 212, 0.3);">
          <div class="form-row">
            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="color: var(--accent-primary);">Current Annual CTC (<span id="mEmpCurrencyLabel">${defaultEntity.currency}</span>)</label>
              <input type="number" class="form-input font-mono font-bold" id="mEmpAnnualCTC" value="${aCTC}" min="0" step="1000" placeholder="e.g. 4312000" required style="font-size: 1.1rem;">
              <div class="text-tertiary mt-xs flex justify-between" style="font-size: 11px;">
                <span>Enter total annual compensation</span>
                <span id="mEmpLiveUSD" class="font-bold" style="color: var(--accent-secondary);">≈ ${Utils.formatCurrency(usdVal, 'USD')} USD</span>
              </div>
            </div>

            <div class="form-group mb-xs">
              <label class="form-label font-bold" style="color: var(--success);">Calculated Monthly CTC (Annual / 12)</label>
              <input type="number" class="form-input font-mono font-bold" id="mEmpMonthlyCTC" value="${mCTC}" readonly style="background: #f8fafc; font-size: 1.1rem; color: var(--success);">
              <div class="text-tertiary mt-xs flex justify-between" style="font-size: 11px;">
                <span>⚡ Auto-calculated: Annual ÷ 12</span>
                <span id="mEmpLiveMonthlyUSD" class="font-bold" style="color: var(--success);">≈ ${Utils.formatCurrency(Utils.convertToUSD(mCTC, rate), 'USD')} USD</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Employment Status</label>
          <select class="form-select" id="mEmpStatus">
            <option value="Active" ${existing?.status !== 'Inactive' ? 'selected' : ''}>🟢 Active</option>
            <option value="Inactive" ${existing?.status === 'Inactive' ? 'selected' : ''}>⚪ Inactive / Resigned</option>
          </select>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? '✏️ Edit Employee Details' : '➕ Add Employee to Master List', content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: isEdit ? 'Update Employee' : 'Save Employee',
          onClick: async () => {
            const code = Utils.$('#mEmpCode').value.trim();
            const name = Utils.$('#mEmpName').value.trim();
            if (!name) {
              Utils.showToast('Please enter the employee name', 'warning');
              return;
            }

            const entityId = Utils.$('#mEmpEntity').value;
            if (typeof Auth !== 'undefined' && !Auth.canAccessEntity(entityId)) {
              Utils.showToast('You do not have permission to add/edit employees for this entity.', 'error');
              return;
            }

            const deptSelect = Utils.$('#mEmpDept');
            const deptId = deptSelect.value;
            const deptName = deptSelect.selectedOptions[0]?.dataset?.name || deptSelect.selectedOptions[0]?.textContent || deptId;
            const annualCTC = Utils.parseNumber(Utils.$('#mEmpAnnualCTC').value) || 0;
            const monthlyCTC = Math.round(annualCTC / 12);

            const countryCodeRaw = (Utils.$('#mEmpCountryCode')?.value || '').trim().toUpperCase().slice(0, 2);
            const data = {
              ...(existing || {}),
              employeeCode: code,
              name,
              band: Utils.$('#mEmpBand').value,
              doj: Utils.$('#mEmpDoj').value,
              entityId,
              countryCode: countryCodeRaw,
              deptId,
              department: deptName,
              reportingManager: Utils.$('#mEmpManager').value.trim(),
              designation: Utils.$('#mEmpDesignation').value.trim(),
              annualCTC,
              monthlyCTC,
              status: Utils.$('#mEmpStatus').value
            };

            if (isEdit) {
              await db.put(STORES.employeesMaster, data);
            } else {
              await db.add(STORES.employeesMaster, data);
            }

            Utils.showToast(isEdit ? 'Employee updated in Master List!' : 'Employee added to Master List!', 'success');
            close();
            App.renderCurrentPage();
          }
        }));
      }
    });

    // Auto-calculate Monthly CTC and live USD equivalent on Annual CTC input
    const modalEl = document.querySelector('#employeeMasterForm');
    if (modalEl) {
      const annualInput = modalEl.querySelector('#mEmpAnnualCTC');
      const monthlyInput = modalEl.querySelector('#mEmpMonthlyCTC');
      const entitySelect = modalEl.querySelector('#mEmpEntity');
      const deptSelect = modalEl.querySelector('#mEmpDept');
      const currLabel = modalEl.querySelector('#mEmpCurrencyLabel');
      const liveUSD = modalEl.querySelector('#mEmpLiveUSD');
      const liveMonthlyUSD = modalEl.querySelector('#mEmpLiveMonthlyUSD');

      const refreshLiveUSD = () => {
        const ent = entities.find(e => e.id === entitySelect.value) || entities[0];
        const aVal = Utils.parseNumber(annualInput.value) || 0;
        const mVal = Math.round(aVal / 12);
        monthlyInput.value = mVal;
        if (currLabel) currLabel.textContent = ent.currency;

        const entRate = rates[ent.currency] || 1.0;
        const uAnnual = Utils.convertToUSD(aVal, entRate);
        const uMonthly = Utils.convertToUSD(mVal, entRate);
        if (liveUSD) liveUSD.textContent = `≈ ${Utils.formatCurrency(uAnnual, 'USD')} USD`;
        if (liveMonthlyUSD) liveMonthlyUSD.textContent = `≈ ${Utils.formatCurrency(uMonthly, 'USD')} USD`;
      };

      const refreshDepartments = () => {
        const ent = entities.find(e => e.id === entitySelect.value) || entities[0];
        const depts = getAvailableDeptsForEntity(ent.id);
        deptSelect.innerHTML = depts.map(d => {
          const shortCode = Utils.getDeptShortCode(d, ent.deptPrefix || 'IN');
          return `<option value="${d.id}" data-name="${d.name}">${shortCode}</option>`;
        }).join('');
      };

      annualInput.addEventListener('input', refreshLiveUSD);
      entitySelect.addEventListener('change', () => {
        refreshLiveUSD();
        refreshDepartments();
      });
    }
  },

  async editEmployeeMaster(id) {
    const emp = await db.get(STORES.employeesMaster, id);
    if (!emp) return;
    this.showEmployeeMasterForm(emp);
  },

  async deleteEmployeeMaster(id) {
    if (await Utils.confirm('Are you sure you want to delete this employee from the Master List?')) {
      await db.delete(STORES.employeesMaster, id);
      Utils.showToast('Employee deleted from Master List', 'info');
      App.renderCurrentPage();
    }
  },

  downloadEmployeeMasterTemplate() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'employees' }) && !Auth.hasPermission('edit', { category: 'employees' }) && !Auth.hasPermission('add', { category: 'employees' }) && !Auth.hasPermission('view', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to download employee upload templates.', 'warning');
      return;
    }

    const headers = [
      'Employee Code',
      'Name of Employee',
      'Band',
      'Date of Joining (YYYY-MM-DD)',
      'Legal Entity',
      'Department',
      'Reporting Manager',
      'Designation',
      'Current Annual CTC',
      'Employment Status'
    ];

    const sampleRows = [
      ['NH-1001', 'Simerneet Bajwa', 'NH4', '2021-06-15', 'NHIPL', 'IN-PDD-MED', 'Dr. Shahed Alam', 'Senior Health Communications Lead', 4312000, 'Active'],
      ['NH-1002', 'Sandeep Kumar Dwivedi', 'NH3', '2022-03-01', 'NHIPL', 'IN-PDD-MED', 'Simerneet Bajwa', 'Senior Manager Creative Content & Translation', 2689139, 'Active'],
      ['NH-1003', 'Tarana Rajkumar Emmanuel', 'NH3', '2023-01-10', 'NHIPL', 'IN-PDD-MED', 'Simerneet Bajwa', 'Associate Manager Creative Content', 1574941, 'Active'],
      ['NH-1004', 'Dr. Shahed Alam', 'NH5', '2019-01-01', 'NHIPL', 'IN-PDD-MED', 'Edith Elliott', 'Vice President - Medical Content & Programs', 6500000, 'Active'],
      ['NH-1005', 'Ananya Sharma', 'NH2', '2023-08-01', 'NHIPL', 'IN-M&E-MONITORING', 'Dr. Shahed Alam', 'Data Analyst & M&E Associate', 960000, 'Active'],
      ['NH-1006', 'Tasmia Rahman', 'NH3', '2023-04-01', 'NHBD', 'BD-PDEL-IMP', 'Country Director', 'Implementation Lead', 1440000, 'Active'],
      ['NH-1007', 'Budi Santoso', 'NH4', '2022-11-15', 'NH Indo', 'INDO-OPS-ADMIN', 'Country Director', 'Operations Manager', 360000000, 'Active']
    ];

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      ws['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 22 }, { wch: 15 },
        { wch: 20 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 12 }
      ];
      const yearId = App.selectedYear || '2026';
      XLSX.utils.book_append_sheet(wb, ws, 'Employees Master');
      XLSX.writeFile(wb, `Employees_Master_Bulk_Upload_Template_CY${yearId}.xlsx`);
    } else {
      const yearId = App.selectedYear || '2026';
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...sampleRows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Employees_Master_Bulk_Upload_Template_CY${yearId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    Utils.showToast('Employee Master template downloaded!', 'success');
  },

  async downloadEmployeeMasterData() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('view', { category: 'employees' }) && !Auth.hasPermission('view', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to view or export employee records.', 'warning');
      return;
    }

    const rawEntities = (await db.getAll(STORES.entities)) || [];
    const entities = (typeof Auth !== 'undefined') ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id));

    let employees = this._currentFilteredEmployees && this._currentFilteredEmployees.length > 0 
      ? this._currentFilteredEmployees 
      : (await db.getEmployeesMaster());

    // Strictly restrict download to accessible entities
    employees = employees.filter(e => !e.entityId || accessibleEntityIds.has(e.entityId));

    const departments = await db.getAll(STORES.departments);
    const years = await db.getAll(STORES.budgetYears);
    const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || { year: 2026 };
    const rates = Utils.getConversionRates(currentYearObj);

    const headers = [
      'Employee Code', 'Name of Employee', 'Band', 'Date of Joining', 'Legal Entity',
      'Currency', 'Department (Code)', 'Department (Full Name)', 'Reporting Manager', 'Designation',
      'Annual CTC (Local)', 'Monthly CTC (Local)', 'Annual CTC (USD)', 'Monthly CTC (USD)', 'Employment Status'
    ];

    const rows = employees.map(e => {
      const ent = entities.find(x => x.id === e.entityId) || entities[0];
      const curr = ent?.currency || 'INR';
      const aCTC = Utils.parseNumber(e.annualCTC) || 0;
      const mCTC = Utils.parseNumber(e.monthlyCTC) || Math.round(aCTC / 12);
      const rate = rates[curr] || 1.0;
      const aUSD = Utils.convertToUSD(aCTC, rate);
      const mUSD = Utils.convertToUSD(mCTC, rate);

      const deptObj = departments.find(d => d.id === e.deptId || d.name === e.department) || { id: e.deptId, codeTemplate: e.department || e.deptId, name: e.department || e.deptId };
      const deptShort = Utils.getDeptShortCode(deptObj, ent?.deptPrefix || 'IN');

      return [
        e.employeeCode || '',
        e.name || '',
        e.band || '',
        e.doj || '',
        ent?.shortName || e.entityId || '',
        curr,
        deptShort,
        deptObj.name || e.department || '',
        e.reportingManager || '',
        e.designation || '',
        aCTC,
        mCTC,
        aUSD,
        mUSD,
        e.status || 'Active'
      ];
    });

    const yearId = App.selectedYear || '2026';
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 32 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Employees Master');
      XLSX.writeFile(wb, `Employees_Master_Data_Export_CY${yearId}.xlsx`);
      Utils.showToast(`Downloaded ${employees.length} Employee records successfully!`, 'success');
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Employees_Master_Data_Export_CY${yearId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      Utils.showToast(`Downloaded ${employees.length} Employee records successfully!`, 'success');
    }
  },

  async showEmployeeMasterUploadModal() {
    if (typeof Auth !== 'undefined' && !Auth.hasPermission('edit', { category: 'employees' }) && !Auth.hasPermission('add', { category: 'employees' }) && !Auth.hasPermission('edit', { category: 'config' })) {
      Utils.showToast('🔒 Access Denied: You do not have permission to upload employee records.', 'warning');
      return;
    }

    const rawEntities = (await db.getAll(STORES.entities)) || [];
    const entities = (typeof Auth !== 'undefined') ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;
    const accessibleEntityIds = new Set(entities.map(e => e.id.toLowerCase()));

    const departments = await db.getAll(STORES.departments);
    let parsedEmployees = [];

    const content = `
      <div id="bulkUploadModalBody" style="font-size: var(--font-size-sm);">
        <div class="card p-md mb-md" style="background: rgba(6, 182, 212, 0.04); border: 1.5px dashed rgba(6, 182, 212, 0.4);">
          <div class="flex justify-between items-center mb-sm flex-wrap gap-xs">
            <h4 style="font-weight: 700;">Select or Drop Excel (.xlsx, .xls) or CSV (.csv) File</h4>
            <button type="button" class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterTemplate()">📥 Download Template</button>
          </div>
          <p class="text-tertiary mb-sm" style="font-size: 11px;">Upload your spreadsheet containing Employee Code, Name, Band, Date of Joining, Legal Entity, Department, Reporting Manager, Designation, Annual CTC, and Status for your assigned entities (<strong>${entities.map(e => e.shortName).join(', ')}</strong>).</p>
          <div class="form-group mb-xs">
            <input type="file" id="empBulkFileInput" accept=".xlsx, .xls, .csv" class="form-input" style="padding: 10px;">
          </div>
          <div class="flex items-center gap-xs mt-sm">
            <label class="flex items-center gap-xs cursor-pointer">
              <input type="checkbox" id="empOverwriteMatching" checked>
              <span style="font-size: 11px; font-weight: 600;">Update existing employees if Employee Code matches (Overwrite duplicates)</span>
            </label>
          </div>
        </div>

        <!-- Live Preview Section -->
        <div id="empPreviewSection" style="display: none;">
          <div class="flex justify-between items-center mb-sm">
            <div class="flex items-center gap-sm">
              <h4 style="font-weight: 700;">Parsed Employee Records Preview</h4>
              <span class="badge badge-emerald font-bold" id="empValidCountBadge">0 Records Ready</span>
            </div>
            <span class="text-tertiary" style="font-size: 11px;">Monthly CTC auto-computed as Annual / 12</span>
          </div>

          <div class="table-container" style="max-height: 280px; overflow-y: auto; margin-bottom: 12px;">
            <table class="data-table" id="empPreviewTable" style="font-size: 11px;">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Band</th>
                  <th>DOJ</th>
                  <th>Entity</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th class="num font-bold">Annual CTC</th>
                  <th class="num font-bold" style="color: var(--accent-primary);">Monthly CTC</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="empPreviewTbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Utils.showModal('📤 Bulk Upload Masterlist of Employees', content, {
      modalWidth: '90%',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        const importBtn = Utils.createElement('button', {
          className: 'btn btn-primary', textContent: '🚀 Import Employees in Single Go', disabled: true, id: 'btnExecuteEmpImport',
          onClick: async () => {
            if (parsedEmployees.length === 0) {
              Utils.showToast('Please select a valid Excel or CSV file first', 'warning');
              return;
            }

            const overwrite = Utils.$('#empOverwriteMatching')?.checked;
            const existingAll = await db.getEmployeesMaster();
            const existingCodeMap = new Map();
            existingAll.forEach(e => {
              if (e.employeeCode) existingCodeMap.set(String(e.employeeCode).trim().toLowerCase(), e);
            });

            let addedCount = 0;
            let updatedCount = 0;
            let skippedUnauthorized = 0;

            for (const emp of parsedEmployees) {
              if (emp.entityId && !accessibleEntityIds.has(emp.entityId.toLowerCase())) {
                skippedUnauthorized++;
                continue;
              }

              const codeKey = String(emp.employeeCode || '').trim().toLowerCase();
              if (overwrite && codeKey && existingCodeMap.has(codeKey)) {
                const prev = existingCodeMap.get(codeKey);
                await db.put(STORES.employeesMaster, {
                  ...prev,
                  ...emp,
                  id: prev.id
                });
                updatedCount++;
              } else {
                await db.add(STORES.employeesMaster, { ...emp });
                addedCount++;
              }
            }

            let msg = `Successfully uploaded! (${addedCount} added, ${updatedCount} updated)`;
            if (skippedUnauthorized > 0) {
              msg += ` — Skipped ${skippedUnauthorized} records from unauthorized entities.`;
            }
            Utils.showToast(msg, 'success');
            close();
            App.renderCurrentPage();
          }
        });
        footer.appendChild(importBtn);
      }
    });

    // Wire File Upload & Parser
    const modalEl = document.querySelector('#bulkUploadModalBody');
    if (modalEl) {
      const fileInput = modalEl.querySelector('#empBulkFileInput');
      const previewSec = modalEl.querySelector('#empPreviewSection');
      const previewTbody = modalEl.querySelector('#empPreviewTbody');
      const countBadge = modalEl.querySelector('#empValidCountBadge');
      const execBtn = document.querySelector('#btnExecuteEmpImport');

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          let rows = [];
          if (file.name.endsWith('.csv') || file.type === 'text/csv') {
            const text = await file.text();
            rows = Utils.parseCSV(text);
          } else if (typeof XLSX !== 'undefined') {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { cellDates: true });
            const firstSheetName = wb.SheetNames[0];
            const ws = wb.Sheets[firstSheetName];
            rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          }

          if (!rows || rows.length < 2) {
            Utils.showToast('No data rows found in file', 'warning');
            return;
          }

          // Extract header row
          const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
          
          const getColIdx = (aliases) => {
            return headerRow.findIndex(h => aliases.some(a => h.includes(a.toLowerCase().replace(/[^a-z0-9]/g, ''))));
          };

          const codeIdx = getColIdx(['employeecode', 'empcode', 'code', 'empid', 'id']);
          const nameIdx = getColIdx(['nameofemployee', 'employeename', 'name', 'staffname']);
          const bandIdx = getColIdx(['band', 'banding', 'level', 'grade']);
          const dojIdx = getColIdx(['dateofjoining', 'doj', 'joiningdate', 'startdate']);
          const entityIdx = getColIdx(['legalentity', 'entity', 'entitycode', 'country']);
          const deptIdx = getColIdx(['department', 'dept', 'deptcode']);
          const managerIdx = getColIdx(['reportingmanager', 'manager', 'supervisor']);
          const desigIdx = getColIdx(['designation', 'role', 'title', 'jobtitle']);
          const ctcIdx = getColIdx(['currentannualctc', 'annualctc', 'ctc', 'annualsalary', 'salary']);
          const statusIdx = getColIdx(['employmentstatus', 'status']);

          parsedEmployees = [];

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0 || !r.some(cell => String(cell).trim() !== '')) continue;

            const name = nameIdx !== -1 ? String(r[nameIdx] || '').trim() : '';
            if (!name) continue; // skip row without name

            let code = codeIdx !== -1 ? String(r[codeIdx] || '').trim() : '';
            if (!code) code = 'NH-' + (1000 + i);

            const band = bandIdx !== -1 ? String(r[bandIdx] || 'NH3').trim() : 'NH3';
            
            // Format DOJ
            let doj = dojIdx !== -1 ? r[dojIdx] : '';
            if (doj instanceof Date && !isNaN(doj)) {
              doj = doj.toISOString().split('T')[0];
            } else if (typeof doj === 'string' && doj.trim()) {
              const dStr = doj.trim();
              if (dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                doj = dStr;
              } else {
                const parsedDate = new Date(dStr);
                doj = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : dStr;
              }
            } else {
              doj = new Date().toISOString().split('T')[0];
            }

            // Entity matching
            let rawEntity = entityIdx !== -1 ? String(r[entityIdx] || '').trim().toLowerCase() : '';
            let matchedEntity = entities.find(e => 
              e.id.toLowerCase() === rawEntity ||
              e.shortName.toLowerCase() === rawEntity ||
              e.name.toLowerCase().includes(rawEntity) ||
              e.country.toLowerCase() === rawEntity
            );

            // If the record belongs to an entity the user has no access to, skip it
            if (!matchedEntity) {
              const unauthorizedEnt = rawEntities.find(e =>
                e.id.toLowerCase() === rawEntity ||
                e.shortName.toLowerCase() === rawEntity ||
                e.name.toLowerCase().includes(rawEntity) ||
                e.country.toLowerCase() === rawEntity
              );
              if (unauthorizedEnt) {
                // Explicitly skip row belonging to other unauthorized entity
                continue;
              }
              matchedEntity = entities[0];
            }

            // Department matching (support shortcode, template, name)
            let rawDept = deptIdx !== -1 ? String(r[deptIdx] || '').trim().toLowerCase() : '';
            let matchedDept = departments.find(d => {
              const shortCode = Utils.getDeptShortCode(d, matchedEntity.deptPrefix || 'IN').toLowerCase();
              const templ = (d.codeTemplate || '').toLowerCase();
              return (
                d.id.toLowerCase() === rawDept ||
                shortCode === rawDept ||
                templ === rawDept ||
                d.name.toLowerCase() === rawDept ||
                d.name.toLowerCase().includes(rawDept)
              );
            }) || departments[0];

            const manager = managerIdx !== -1 ? String(r[managerIdx] || '').trim() : '';
            const designation = desigIdx !== -1 ? String(r[desigIdx] || '').trim() : '';
            const annualCTC = ctcIdx !== -1 ? Utils.parseNumber(r[ctcIdx]) || 0 : 0;
            const monthlyCTC = Math.round(annualCTC / 12);
            const status = statusIdx !== -1 ? (String(r[statusIdx] || '').toLowerCase().includes('inact') ? 'Inactive' : 'Active') : 'Active';

            parsedEmployees.push({
              employeeCode: code,
              name,
              band,
              doj,
              entityId: matchedEntity.id,
              deptId: matchedDept.id,
              department: matchedDept.name,
              reportingManager: manager,
              designation,
              annualCTC,
              monthlyCTC,
              status
            });
          }

          if (parsedEmployees.length === 0) {
            Utils.showToast('No valid employee records could be identified in the file.', 'warning');
            return;
          }

          // Render Preview
          previewTbody.innerHTML = parsedEmployees.map(e => {
            const ent = entities.find(x => x.id === e.entityId) || entities[0];
            const deptObj = departments.find(d => d.id === e.deptId) || { id: e.deptId, codeTemplate: e.department || e.deptId };
            const deptShort = Utils.getDeptShortCode(deptObj, ent?.deptPrefix || 'IN');
            return `
              <tr>
                <td class="font-mono font-bold">${e.employeeCode}</td>
                <td><strong>👤 ${e.name}</strong>${e.designation ? `<div class="text-tertiary" style="font-size: 10px;">${e.designation}</div>` : ''}</td>
                <td><span class="badge badge-cyan">${e.band}</span></td>
                <td>${Utils.formatDate(e.doj)}</td>
                <td><span class="badge badge-subtle">${ent.flag} ${ent.shortName}</span></td>
                <td><span class="badge badge-subtle font-mono font-bold">${deptShort}</span></td>
                <td>${e.reportingManager || '—'}</td>
                <td class="num font-mono font-bold">${Utils.formatCurrency(e.annualCTC, ent.currency)}</td>
                <td class="num font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(e.monthlyCTC, ent.currency)}</td>
                <td><span class="badge ${e.status === 'Active' ? 'badge-emerald' : 'badge-subtle'}">${e.status}</span></td>
              </tr>
            `;
          }).join('');

          previewSec.style.display = 'block';
          countBadge.textContent = `${parsedEmployees.length} Valid Records Ready`;
          if (execBtn) {
            execBtn.disabled = false;
            execBtn.textContent = `🚀 Import ${parsedEmployees.length} Employees in Single Go`;
          }
          Utils.showToast(`Parsed ${parsedEmployees.length} employees successfully!`, 'info');

        } catch (err) {
          console.error('Error parsing bulk upload file:', err);
          Utils.showToast('Failed to parse file: ' + err.message, 'error');
        }
      });
    }
  },

  activeImpState: 'KA',

  // Filter state for IMP Benchmark Rates Master
  impRateEntityFilter: 'all',
  impRateCountryFilter: 'all',
  impRateLocationFilter: 'all',
  impRateSearchQuery: '',

  // ─── 8. IMP ToT Benchmark Rates Master & Activity Templates Configuration ───
  impRateActiveTab: 'matrix', // 'matrix', 'custom-fields', 'templates'
  selectedTemplateCode: '10.1',

  // Master catalog of standard benchmark rate fields
  standardRateFields: [
    { key: 'hotelPerDay', label: 'Hotel (Double Occ.)', category: 'travel', defaultGl: '93101', parentAccount: 'Travel & Lodging Expenses', unit: 'per trainer / night' },
    { key: 'cabPerDay', label: 'Local Cab Travel', category: 'travel', defaultGl: '93104', parentAccount: 'Travel & Lodging Expenses', unit: 'per vehicle / day' },
    { key: 'foodPerDay', label: 'Trainer Food Allowance (DA)', category: 'travel', defaultGl: '93102', parentAccount: 'Travel & Lodging Expenses', unit: 'per trainer / day' },
    { key: 'busTrainPerTrip', label: 'Bus / Train Roundtrip Transit', category: 'travel', defaultGl: '93105', parentAccount: 'Travel & Lodging Expenses', unit: 'per trainer / trip' },
    { key: 'kitCost', label: 'Collateral Kit', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per facility kit' },
    { key: 'dollCost', label: 'Doll Model Set', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per doll model set' },
    { key: 'thaliCost', label: 'Thali Model Set', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per thali model set' },
    { key: 'bannerCost', label: 'Banners (3x6 ft pair)', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per event' },
    { key: 'backdropCost', label: 'Stage Backdrop', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per event' },
    { key: 'venueHallPerDay', label: 'Training Venue Hall Rental', category: 'venue', defaultGl: '93201', parentAccount: 'Other Direct Expenses', unit: 'per hall / day' },
    { key: 'venueFoodPerPerson', label: 'Venue Participant Catering', category: 'venue', defaultGl: '93201', parentAccount: 'Other Direct Expenses', unit: 'per participant / day' },
    { key: 'launchCollaterals', label: 'Facility Launch Collateral Package', category: 'printing', defaultGl: '93204', parentAccount: 'Supplies & Printing Costs', unit: 'per facility launch pkg' },
    { key: 'courierPerEvent', label: 'Courier & Dispatch', category: 'communication', defaultGl: '93302', parentAccount: 'Communication Cost', unit: 'per dispatch' },
    { key: 'pcCabPerVisit', label: 'Program Coordinator Cab Visit', category: 'supervision', defaultGl: '93104', parentAccount: 'Travel & Lodging Expenses', unit: 'per monitoring visit' },
    { key: 'pcFoodPerVisit', label: 'PC Food Allowance (Per Visit)', category: 'supervision', defaultGl: '93102', parentAccount: 'Travel & Lodging Expenses', unit: 'per visit' },
    { key: 'nonPcHotelPerDay', label: 'Non-PC / Specialist Hotel', category: 'travel', defaultGl: '93101', parentAccount: 'Travel & Lodging Expenses', unit: 'per night' },
    { key: 'airfareRoundtrip', label: 'Flight Airfare Roundtrip', category: 'travel', defaultGl: '93103', parentAccount: 'Travel & Lodging Expenses', unit: 'per person / trip' },
    { key: 'leadershipHotelPerDay', label: 'Leadership Hotel Accommodation', category: 'travel', defaultGl: '93101', parentAccount: 'Travel & Lodging Expenses', unit: 'per night' }
  ],

  // Formula type display mapping
  formulaTypeMap: {
    'events_days_trainers': 'Events × Days × Trainers × Rate (Hotel / Cab / Food DA)',
    'events_trainers': 'Events × Trainers × Rate (Transit / Airfare)',
    'facilities_rate': 'Facilities × Rate (Collateral Kits / Launch Packages)',
    'facilities_multiplier': 'Facilities × Multiplier × Rate (Dolls / Thalis / Handouts)',
    'events_rate': 'Events × Rate (Banners / Courier / Modules)',
    'events_rate_dual': 'Events × (Rate 1 + Rate 2) (Banners + Backdrops)',
    'events_days_hall_catering': 'Events × Days × Hall + Events × Days × Trainees × Food',
    'events_days_hall': 'Events × Days × Hall Rate',
    'events_days_participants': 'Events × Days × Trainees × Catering Rate',
    'events_days_honorarium': 'Events × Days × Honorarium Rate',
    'participants_rate': 'Trainees × Rate (Certificates & Kits)',
    'facilities_pc_cab': 'Facilities × PC Cab Rate',
    'facilities_pc_food': 'Facilities × PC Food Rate',
    'fixed_amount': 'Fixed Flat Amount'
  },

  async renderImpUnitRates(container) {
    const allRates = await db.getAllImpUnitRates();
    const standardFields = await db.getAllImpStandardBenchmarkFields();
    const customFields = await db.getAllImpCustomRateFields();
    const templates = await db.getAllImpActivityTemplates();
    const allDepts = Utils.sortDepartments(await db.getAll(STORES.departments));

    const totEnabledCount = allDepts.filter(d => Boolean(d.hasTotAccess)).length;

    container.innerHTML = `
      <div class="page-header flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
        <div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-emerald font-bold">IMP BENCHMARK MASTER</span>
            <span class="badge badge-cyan font-bold">${allRates.length} State Benchmark Sheets</span>
            <span class="badge badge-indigo font-bold">${standardFields.length + customFields.length} Rate Fields</span>
            <span class="badge badge-purple font-bold">${templates.length} Activity Templates</span>
            <span class="badge badge-amber font-bold">${totEnabledCount}/${allDepts.length} ToT Departments</span>
          </div>
          <h2 class="mt-xs" style="font-size: 1.35rem; color: var(--text-primary);">
            ⚙️ Implementation (IMP) Benchmark Rates &amp; Calculation Master
          </h2>
          <p class="text-secondary" style="font-size: 12.5px;">
            Admin Control Center: Configure Country Default Rates &bull; 5D State Location Overrides &bull; Edit Standard & Custom Benchmark Fields &bull; Set Calculation Formulas &bull; Build Activity Templates (10.1 to 10.8) &bull; Department Access Control
          </p>
        </div>
        <div class="flex items-center gap-sm">
          ${this.impRateActiveTab === 'matrix' ? `
            <button class="btn btn-secondary btn-sm font-bold" onclick="ConfigModule.showImpUnitRateForm(null, true)">
              🏛️ + Configure Country Default
            </button>
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showImpUnitRateForm(null, false)">
              📍 + Add State Override
            </button>
          ` : (this.impRateActiveTab === 'custom-fields' ? `
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal()">
              ➕ + Add Custom Benchmark Field
            </button>
          ` : (this.impRateActiveTab === 'templates' ? `
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showTemplateLineItemModal()">
              ➕ + Add Template Cost Line Item
            </button>
          ` : ''))}
        </div>
      </div>

      <!-- ─── Admin Navigation Tabs ─── -->
      <div class="tabs mb-md" style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 2px; flex-wrap: wrap;">
        <button class="tab-btn ${this.impRateActiveTab === 'matrix' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('matrix')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'matrix' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'matrix' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          📊 1. Country Defaults &amp; 5D State Rates Matrix (${allRates.length})
        </button>
        <button class="tab-btn ${this.impRateActiveTab === 'custom-fields' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('custom-fields')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'custom-fields' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'custom-fields' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'custom-fields' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          ⚙️ 2. Benchmark Rate Fields &amp; Calculation Engine (${standardFields.length + customFields.length})
        </button>
        <button class="tab-btn ${this.impRateActiveTab === 'templates' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('templates')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'templates' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'templates' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'templates' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          📋 3. Activity Templates &amp; Line Items Builder (10.1 to 10.8)
        </button>
        <button class="tab-btn ${this.impRateActiveTab === 'departments' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('departments')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'departments' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'departments' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'departments' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          🏢 4. Department ToT Access (${totEnabledCount}/${allDepts.length} Enabled)
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="impRateTabContainer">
        <!-- Rendered dynamically below -->
      </div>
    `;

    const tabContainer = container.querySelector('#impRateTabContainer');
    if (this.impRateActiveTab === 'matrix') {
      await this.renderImpRatesMatrixTab(tabContainer, allRates, customFields);
    } else if (this.impRateActiveTab === 'custom-fields') {
      await this.renderImpCustomFieldsTab(tabContainer, standardFields, customFields);
    } else if (this.impRateActiveTab === 'templates') {
      await this.renderImpActivityTemplatesTab(tabContainer, templates, standardFields, customFields);
    } else if (this.impRateActiveTab === 'departments') {
      await this.renderImpDeptAccessTab(tabContainer, allDepts);
    }
  },

  async switchImpRateTab(tabName) {
    this.impRateActiveTab = tabName;
    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: Benchmark Rates Comparison Matrix & Location Config
  // ═══════════════════════════════════════════════════════════════════════════
  async renderImpRatesMatrixTab(container, allRates, customFields) {
    const entities = await db.getAll(STORES.entities);
    
    // Separate Tier 1 (Country Defaults) and Tier 2 (State Overrides Only)
    const countryDefaults = allRates.filter(r => r.isCountryDefault);
    const specificOverrides = allRates.filter(r => !r.isCountryDefault);

    const uniqueCountries = Array.from(new Set(allRates.map(r => r.country || (r.location?.includes('India') ? 'India' : (r.location?.includes('Dhaka') || r.location?.includes('Khulna') ? 'Bangladesh' : 'Global'))).filter(Boolean))).sort();
    const uniqueLocations = Array.from(new Set(specificOverrides.map(r => r.location).filter(Boolean))).sort();

    // Filter Tier 2 overrides
    const filteredOverrides = specificOverrides.filter(r => {
      const rateEntity = r.entityId || (r.country === 'Bangladesh' ? 'nhbd' : 'nhipl');
      const matchEntity = this.impRateEntityFilter === 'all' || rateEntity === this.impRateEntityFilter;
      const rateCountry = r.country || (r.location?.includes('India') ? 'India' : (r.location?.includes('Dhaka') || r.location?.includes('Khulna') ? 'Bangladesh' : 'Global'));
      const matchCountry = this.impRateCountryFilter === 'all' || rateCountry === this.impRateCountryFilter;
      const matchLoc = this.impRateLocationFilter === 'all' || r.location === this.impRateLocationFilter;
      const q = (this.impRateSearchQuery || '').toLowerCase().trim();
      const matchQuery = !q ||
        (r.stateName && r.stateName.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.stateCode && r.stateCode.toLowerCase().includes(q)) ||
        (rateCountry && rateCountry.toLowerCase().includes(q));
      return matchEntity && matchCountry && matchLoc && matchQuery;
    });

    container.innerHTML = `
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 🏛️ TIER 1: COUNTRY-LEVEL DEFAULT BENCHMARK MATRIX (ORGANIZATION BASELINE) -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div class="card mb-lg" style="border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div class="card-header flex justify-between items-center" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.07), rgba(16, 185, 129, 0.05)); border-bottom: 1px solid rgba(99, 102, 241, 0.2);">
          <div>
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.25rem;">🏛️</span>
              <div class="card-title font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">
                Tier 1: Country-Level Default Benchmark Rates Matrix (${countryDefaults.length} Countries)
              </div>
            </div>
            <div class="card-subtitle" style="font-size: 11.5px; margin-top: 2px;">
              Baseline benchmark rates per country. <strong>All 5D locations in each country inherit these default rates automatically</strong> unless a specific state override is set in Tier 2 below.
            </div>
          </div>
          <button class="btn btn-secondary btn-sm font-bold" onclick="ConfigModule.showImpUnitRateForm(null, true)">
            🏛️ + Configure Country Default
          </button>
        </div>

        <div class="table-container mb-none">
          <table class="data-table" id="tier1CountryDefaultsTable" style="font-size: 11.5px;">
            <thead>
              <tr>
                <th class="sticky-col-1" style="min-width: 140px;">Country & Entity</th>
                <th class="sticky-col-2" style="min-width: 150px;">Baseline Scope</th>
                <th style="min-width: 70px;">Curr.</th>
                <th class="num" style="min-width: 90px;" title="Hotel Double Occupancy per day">Hotel (/day)</th>
                <th class="num" style="min-width: 85px;" title="Local Cab per day">Cab (/day)</th>
                <th class="num" style="min-width: 85px;" title="Trainer Food Daily Allowance">Food DA</th>
                <th class="num" style="min-width: 85px;" title="Bus or Train Roundtrip">Transit</th>
                <th class="num font-bold" style="color: var(--accent-primary); min-width: 95px;" title="Collateral Kit per Facility">Kit Cost</th>
                <th class="num" style="min-width: 80px;" title="Doll Model Set">Dolls</th>
                <th class="num" style="min-width: 80px;" title="Thali Model Set">Thali</th>
                <th class="num" style="min-width: 95px;" title="Banners and Stage Backdrops">Banners</th>
                <th class="num font-bold" style="min-width: 95px;" title="Training Venue Hall Rental per day">Hall Rental</th>
                <th class="num" style="min-width: 85px;" title="Venue Catering per person/day">Catering</th>
                <th class="num font-bold" style="color: var(--accent-secondary); min-width: 95px;" title="Program Coordinator Cab Visit">PC Visit</th>
                ${customFields.map(cf => `
                  <th class="num" style="min-width: 95px; color: #a78bfa;" title="${cf.name} (${cf.unitDesc || ''})">
                    ⭐ ${cf.name.length > 14 ? cf.name.slice(0, 14) + '…' : cf.name}
                  </th>
                `).join('')}
                <th style="min-width: 90px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${countryDefaults.map(cd => {
                const countryFlag = cd.country === 'Bangladesh' ? '🇧🇩' : (cd.country === 'Indonesia' ? '🇮🇩' : (cd.country === 'USA' ? '🇺🇸' : (cd.country === 'Nepal' ? '🇳🇵' : '🇮🇳')));
                const entityObj = entities.find(e => e.id === cd.entityId) || { code: (cd.entityId || 'ALL').toUpperCase() };
                const currSymbol = cd.currency === 'BDT' ? '৳' : (cd.currency === 'USD' ? '$' : (cd.currency === 'IDR' ? 'Rp' : (cd.currency === 'NPR' ? 'NPR' : '₹')));

                return `
                  <tr style="background: rgba(16, 185, 129, 0.03);">
                    <td class="sticky-col-1 font-bold">
                      <span style="font-size: 1.15rem; margin-right: 4px;">${countryFlag}</span>
                      <span>${cd.country}</span>
                      <code style="font-size: 10px; margin-left: 4px;">${entityObj.code || 'NHIPL'}</code>
                    </td>
                    <td class="sticky-col-2">
                      <span class="badge badge-emerald font-bold" style="font-size: 9.5px;">🏛️ All States Default</span>
                    </td>
                    <td class="font-mono font-bold text-secondary">${cd.currency || 'INR'}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.hotelPerDay)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.cabPerDay)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.foodPerDay)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.busTrainPerTrip)}</td>
                    <td class="num font-mono font-bold" style="color: var(--accent-primary);">${currSymbol} ${Utils.formatNumber(cd.kitCost)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.dollCost)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.thaliCost)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber((cd.bannerCost || 0) + (cd.backdropCost || 0))}</td>
                    <td class="num font-mono font-bold">${currSymbol} ${Utils.formatNumber(cd.venueHallPerDay)}</td>
                    <td class="num font-mono">${currSymbol} ${Utils.formatNumber(cd.venueFoodPerPerson)}</td>
                    <td class="num font-mono font-bold" style="color: var(--accent-secondary);">${currSymbol} ${Utils.formatNumber(cd.pcCabPerVisit)}</td>
                    ${customFields.map(cf => {
                      const val = cd[cf.fieldKey] !== undefined ? cd[cf.fieldKey] : (cf.defaultUnitRate || 0);
                      return `
                        <td class="num font-mono" style="color: #a78bfa;">
                          ${currSymbol} ${Utils.formatNumber(val)}
                        </td>
                      `;
                    }).join('')}
                    <td style="white-space: nowrap; text-align: center;">
                      <button class="btn btn-ghost btn-xs font-bold" onclick="ConfigModule.showImpUnitRateForm('${cd.location}', true)" style="color: var(--accent-primary);">
                        ✏️ Edit Baseline
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 📍 TIER 2: 5D STATE / LOCATION OVERRIDES ONLY -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div class="card mb-md p-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
        <div class="flex justify-between items-center mb-sm" style="flex-wrap: wrap; gap: 8px;">
          <div>
            <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
              🔍 Filter 5D State Overrides Matrix
            </div>
            <div class="text-tertiary" style="font-size: 11px;">
              Filter state/district locations that have custom rates different from country baseline
            </div>
          </div>
          <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showImpUnitRateForm(null, false)">
            📍 + Add State Override
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end;">
          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">🏢 Filter Entity:</label>
            <select class="form-select font-bold" id="filterImpRateEntity" onchange="ConfigModule.onImpRateFilterChange('entity', this.value)">
              <option value="all" ${this.impRateEntityFilter === 'all' ? 'selected' : ''}>🌐 All Entities</option>
              ${entities.map(e => `
                <option value="${e.id}" ${this.impRateEntityFilter === e.id ? 'selected' : ''}>🏢 ${e.name} (${e.code || e.id.toUpperCase()})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">🌍 Filter Country / Region:</label>
            <select class="form-select font-bold" id="filterImpRateCountry" onchange="ConfigModule.onImpRateFilterChange('country', this.value)">
              <option value="all" ${this.impRateCountryFilter === 'all' ? 'selected' : ''}>🌍 All Countries</option>
              ${uniqueCountries.map(c => `
                <option value="${c}" ${this.impRateCountryFilter === c ? 'selected' : ''}>
                  ${c === 'India' ? '🇮🇳 India' : (c === 'Bangladesh' ? '🇧🇩 Bangladesh' : (c === 'Indonesia' ? '🇮🇩 Indonesia' : (c === 'Nepal' ? '🇳🇵 Nepal' : (c === 'USA' ? '🇺🇸 USA' : '🌐 ' + c))))}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">📍 Filter Location / State:</label>
            <select class="form-select" id="filterImpRateLocation" onchange="ConfigModule.onImpRateFilterChange('location', this.value)">
              <option value="all" ${this.impRateLocationFilter === 'all' ? 'selected' : ''}>📍 All Overrides</option>
              ${uniqueLocations.map(l => `
                <option value="${l}" ${this.impRateLocationFilter === l ? 'selected' : ''}>📍 ${l}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">🔍 Quick Search:</label>
            <input type="text" class="form-input" id="filterImpRateSearch" value="${this.impRateSearchQuery || ''}" placeholder="Type state, code, or tag..." oninput="ConfigModule.onImpRateFilterChange('search', this.value)">
          </div>

          <div class="form-group mb-none" style="display: flex; align-items: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm" style="width: 100%;" onclick="ConfigModule.resetImpRateFilters()">
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Comparison Matrix Table: Override Locations Only -->
      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title font-bold" style="font-size: 1.05rem;">
              📍 Tier 2: 5D State Location Rate Overrides (${filteredOverrides.length})
            </div>
            <div class="card-subtitle" style="font-size: 11.5px;">
              Only locations with custom overrides. Any state not listed here automatically inherits its Country Default baseline from Tier 1.
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-purple font-bold" style="font-size: 11px;">📍 Override Locations Only</span>
          </div>
        </div>

        ${filteredOverrides.length === 0 ? `
          <div class="p-lg text-center text-muted" style="background: var(--bg-card); border-radius: 0 0 var(--radius-md) var(--radius-md);">
            <div style="font-size: 2rem; margin-bottom: 8px;">🏛️</div>
            <h4 style="color: var(--text-primary);">All States Inheriting Country Defaults</h4>
            <p class="mt-xs text-secondary" style="font-size: 12px; max-width: 500px; margin: 0 auto;">
              No state-specific overrides match the current filters. All 5D locations are currently operating on <strong>Tier 1 Country Default rates</strong>.
            </p>
            <button class="btn btn-primary btn-sm mt-md font-bold" onclick="ConfigModule.showImpUnitRateForm(null, false)">
              📍 + Add State Override
            </button>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table" id="impOverrideRatesTable" style="font-size: 11px;">
              <thead>
                <tr>
                  <th class="sticky-col-1" style="min-width: 120px;">Country & Entity</th>
                  <th class="sticky-col-2" style="min-width: 140px;">5D Location Tag</th>
                  <th style="min-width: 110px;">State / Geo Name</th>
                  <th style="min-width: 110px;">Rate Status</th>
                  <th>Curr.</th>
                  <th class="num" style="min-width: 90px;" title="Hotel Double Occupancy per day">Hotel (/day)</th>
                  <th class="num" style="min-width: 85px;" title="Local Cab per day">Cab (/day)</th>
                  <th class="num" style="min-width: 85px;" title="Trainer Food Daily Allowance">Food DA</th>
                  <th class="num" style="min-width: 85px;" title="Bus or Train Roundtrip">Transit</th>
                  <th class="num font-bold" style="color: var(--accent-primary); min-width: 95px;" title="Collateral Kit per Facility">Kit Cost</th>
                  <th class="num" style="min-width: 80px;" title="Doll Model Set">Dolls</th>
                  <th class="num" style="min-width: 80px;" title="Thali Model Set">Thali</th>
                  <th class="num" style="min-width: 95px;" title="Banners and Stage Backdrops">Banners</th>
                  <th class="num font-bold" style="min-width: 95px;" title="Training Venue Hall Rental per day">Hall Rental</th>
                  <th class="num" style="min-width: 85px;" title="Venue Catering per person/day">Catering</th>
                  <th class="num font-bold" style="color: var(--accent-secondary); min-width: 95px;" title="Program Coordinator Cab Visit">PC Visit</th>
                  ${customFields.map(cf => `
                    <th class="num" style="min-width: 95px; color: #a78bfa;" title="${cf.name} (${cf.unitDesc || ''})">
                      ⭐ ${cf.name.length > 14 ? cf.name.slice(0, 14) + '…' : cf.name}
                    </th>
                  `).join('')}
                  <th style="min-width: 100px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOverrides.map(r => {
                  const countryFlag = r.country === 'Bangladesh' ? '🇧🇩' : (r.country === 'Indonesia' ? '🇮🇩' : (r.country === 'USA' ? '🇺🇸' : (r.country === 'Nepal' ? '🇳🇵' : (r.country === 'Global' ? '🌐' : '🇮🇳'))));
                  const entityObj = entities.find(e => e.id === r.entityId) || { code: (r.entityId || 'ALL').toUpperCase() };
                  const currSymbol = r.currency === 'BDT' ? '৳' : (r.currency === 'USD' ? '$' : (r.currency === 'IDR' ? 'Rp' : (r.currency === 'NPR' ? 'NPR' : '₹')));

                  return `
                    <tr>
                      <td class="sticky-col-1 font-bold">
                        <span>${countryFlag}</span>
                        <span>${r.country || 'India'}</span>
                        <code style="font-size: 10px; margin-left: 4px;">${entityObj.code || 'NHIPL'}</code>
                      </td>
                      <td class="sticky-col-2 font-mono font-bold">
                        <span>📍</span> ${r.location}
                        ${r.stateCode ? `<span class="badge badge-cyan" style="font-size: 9px; padding: 1px 4px; margin-left: 4px;">${r.stateCode}</span>` : ''}
                      </td>
                      <td class="font-bold text-secondary">${r.stateName || r.location}</td>
                      <td>
                        <span class="badge badge-purple font-bold" style="font-size: 9.5px;">📍 State Override</span>
                      </td>
                      <td class="font-mono text-tertiary" style="font-size: 10.5px;">${r.currency || 'INR'}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.hotelPerDay)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.cabPerDay)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.foodPerDay)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.busTrainPerTrip)}</td>
                      <td class="num font-mono font-bold" style="color: var(--accent-primary);">${currSymbol} ${Utils.formatNumber(r.kitCost)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.dollCost)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.thaliCost)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber((r.bannerCost || 0) + (r.backdropCost || 0))}</td>
                      <td class="num font-mono font-bold">${currSymbol} ${Utils.formatNumber(r.venueHallPerDay)}</td>
                      <td class="num font-mono">${currSymbol} ${Utils.formatNumber(r.venueFoodPerPerson)}</td>
                      <td class="num font-mono font-bold" style="color: var(--accent-secondary);">${currSymbol} ${Utils.formatNumber(r.pcCabPerVisit)}</td>
                      ${customFields.map(cf => {
                        const val = r[cf.fieldKey] !== undefined ? r[cf.fieldKey] : (cf.defaultUnitRate || 0);
                        return `
                          <td class="num font-mono" style="color: #a78bfa;">
                            ${currSymbol} ${Utils.formatNumber(val)}
                          </td>
                        `;
                      }).join('')}
                      <td style="white-space: nowrap; text-align: center;">
                        <button class="btn btn-ghost btn-xs font-bold" onclick="ConfigModule.showImpUnitRateForm('${r.location}', false)" title="Edit state override rates">✏️ Edit</button>
                        <button class="btn btn-danger btn-xs font-bold" onclick="ConfigModule.revertStateOverride('${r.location}')" title="Revert to Country Default rates">↺ Revert</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  async onImpRateFilterChange(type, value) {
    if (type === 'entity') this.impRateEntityFilter = value;
    if (type === 'country') this.impRateCountryFilter = value;
    if (type === 'location') this.impRateLocationFilter = value;
    if (type === 'search') this.impRateSearchQuery = value;

    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async resetImpRateFilters() {
    this.impRateEntityFilter = 'all';
    this.impRateCountryFilter = 'all';
    this.impRateLocationFilter = 'all';
    this.impRateSearchQuery = '';

    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async showImpUnitRateForm(location = null, isCountryDefaultForm = false) {
    let rateObj = null;
    if (location) {
      rateObj = await db.getImpUnitRates(location);
    }

    const isEdit = !!rateObj && !!rateObj.id;
    const customFields = await db.getAllImpCustomRateFields();

    const isCountryDef = isCountryDefaultForm || (rateObj && rateObj.isCountryDefault);

    const r = rateObj || {
      entityId: 'nhipl',
      country: 'India',
      stateCode: '',
      location: '',
      stateName: '',
      currency: 'INR',
      isCountryDefault: isCountryDef,
      hotelPerDay: 1890,
      cabPerDay: 5000,
      foodPerDay: 1000,
      busTrainPerTrip: 1888,
      kitCost: 4799,
      dollCost: 266,
      thaliCost: 180,
      bannerCost: 1008,
      backdropCost: 3360,
      venueHallPerDay: 5250,
      venueFoodPerPerson: 750,
      courierPerEvent: 800,
      launchCollaterals: 8159,
      pcCabPerVisit: 4725,
      pcFoodPerVisit: 1260,
      nonPcHotelPerDay: 2363,
      nonPcCabPerDay: 4200,
      nonPcFoodPerDay: 1180,
      airfareRoundtrip: 16520,
      leadershipHotelPerDay: 5985
    };

    const entities = await db.getAll(STORES.entities);
    const selectedEntity = r.entityId || (r.country === 'Bangladesh' ? 'nhbd' : (r.country === 'Indonesia' ? 'nh-indo' : (r.country === 'Nepal' ? 'nh-nepal' : (r.country === 'USA' ? 'noora-us' : 'nhipl'))));
    const selectedCountry = r.country || (selectedEntity === 'nhbd' ? 'Bangladesh' : (selectedEntity === 'nh-indo' ? 'Indonesia' : (selectedEntity === 'nh-nepal' ? 'Nepal' : (selectedEntity === 'noora-us' ? 'USA' : 'India'))));
    const relevantLocations = this.getLocationsForEntityOrCountry(selectedEntity, selectedCountry);
    const selectedLoc = r.location || (isCountryDef ? `${selectedCountry} (Country Default)` : relevantLocations[0] || 'India KA');
    const selectedCurrency = r.currency || (selectedCountry === 'Bangladesh' ? 'BDT' : (selectedCountry === 'USA' ? 'USD' : (selectedCountry === 'Indonesia' ? 'IDR' : (selectedCountry === 'Nepal' ? 'NPR' : 'INR'))));

    const content = `
      <form id="impRateForm" style="font-size: 13px;">
        <!-- Configuration Level Selector Banner -->
        <div class="card p-md mb-md" style="background: ${isCountryDef ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)'}; border: 1px solid ${isCountryDef ? '#10b981' : '#6366f1'}; border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-xs">
            <span style="font-size: 1.25rem;">${isCountryDef ? '🏛️' : '📍'}</span>
            <div>
              <strong style="font-size: 13px; color: ${isCountryDef ? '#10b981' : '#6366f1'}; text-transform: uppercase; letter-spacing: 0.05em;">
                ${isCountryDef ? '🏛️ Country-Level Default Benchmark Sheet' : '📍 5D State / Location Rate Override'}
              </strong>
              <div class="text-tertiary" style="font-size: 11.5px;">
                ${isCountryDef ? 'Sets baseline rates for ALL states/locations in this country. Any state without an override will inherit these rates automatically.' : 'Overrides benchmark rates ONLY for this specific state. All other states in the country remain on Country Default.'}
              </div>
            </div>
          </div>
          <div class="mt-xs">
            <label style="display: inline-flex; align-items: center; gap: 6px; margin-right: 16px; cursor: pointer; font-weight: 600;">
              <input type="radio" name="rateLevelRadio" value="country" ${isCountryDef ? 'checked' : ''} onchange="ConfigModule.onRateLevelRadioChanged(true)">
              🏛️ Country Default Baseline
            </label>
            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600;">
              <input type="radio" name="rateLevelRadio" value="state" ${!isCountryDef ? 'checked' : ''} onchange="ConfigModule.onRateLevelRadioChanged(false)">
              📍 Specific 5D State Override
            </label>
          </div>
        </div>

        <!-- Section 1: Entity, Country & Geography -->
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
            <span style="font-size: 1.1rem;">📍</span>
            <div>
              <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">1. Entity, Country & 5D Location Identification</div>
              <div class="text-tertiary" style="font-size: 11px;">Select Entity to automatically set Country and filter related 5D Location Tags (D5)</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">🏢 Organization Entity <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateEntity" onchange="ConfigModule.onRateEntityChanged(this.value)">
                ${entities.map(e => `
                  <option value="${e.id}" ${selectedEntity === e.id ? 'selected' : ''}>🏢 ${e.name} (${e.code || e.id.toUpperCase()})</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">🌍 Country / Geography <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateCountry" onchange="ConfigModule.onRateCountryChanged(this.value, true)">
                <option value="India" ${selectedCountry === 'India' ? 'selected' : ''}>🇮🇳 India</option>
                <option value="Bangladesh" ${selectedCountry === 'Bangladesh' ? 'selected' : ''}>🇧🇩 Bangladesh</option>
                <option value="Indonesia" ${selectedCountry === 'Indonesia' ? 'selected' : ''}>🇮🇩 Indonesia</option>
                <option value="Nepal" ${selectedCountry === 'Nepal' ? 'selected' : ''}>🇳🇵 Nepal</option>
                <option value="USA" ${selectedCountry === 'USA' ? 'selected' : ''}>🇺🇸 United States</option>
              </select>
            </div>
            <div class="form-group mb-none" id="rateLocationGroup" style="${isCountryDef ? 'display: none;' : ''}">
              <label class="form-label font-bold" style="font-size: 11.5px;">📍 5D Location Tag (D5) <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateLocation" onchange="ConfigModule.onRateLocationSelected(this.value)">
                <option value="">-- Select 5D Location (D5) --</option>
                ${relevantLocations.map(loc => `
                  <option value="${loc}" ${(selectedLoc === loc) ? 'selected' : ''}>📍 ${loc}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">State / Geo Name <span class="text-danger">*</span></label>
              <input type="text" class="form-input font-bold" id="rateStateName" value="${r.stateName || (isCountryDef ? `${selectedCountry} Baseline (All States)` : (selectedLoc === 'India KA' ? 'Karnataka' : selectedLoc.replace('India ', '')))}" placeholder="e.g. Karnataka" required>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">State Code</label>
              <input type="text" class="form-input font-mono font-bold" id="rateStateCode" value="${r.stateCode || (isCountryDef ? `${selectedCountry.slice(0,2).toUpperCase()}-DEFAULT` : (selectedLoc === 'India KA' ? 'KA' : selectedLoc.replace('India ', '')))}" placeholder="e.g. KA" style="text-transform: uppercase;">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Currency</label>
              <select class="form-select font-mono font-bold" id="rateCurrency">
                <option value="INR" ${selectedCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                <option value="BDT" ${selectedCurrency === 'BDT' ? 'selected' : ''}>BDT (৳)</option>
                <option value="USD" ${selectedCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                <option value="IDR" ${selectedCurrency === 'IDR' ? 'selected' : ''}>IDR (Rp)</option>
                <option value="NPR" ${selectedCurrency === 'NPR' ? 'selected' : ''}>NPR (NPR)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Travel & Daily Accommodation -->
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
            <span style="font-size: 1.1rem;">🏨</span>
            <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">2. Travel & Accommodation Benchmark Rates</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Hotel (Double Occ.)</label>
              <input type="number" class="form-input font-bold" id="rateHotel" value="${r.hotelPerDay || 1890}">
              <div class="form-hint">Per trainer / night</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Local Cab Travel</label>
              <input type="number" class="form-input font-bold" id="rateCab" value="${r.cabPerDay || 5000}">
              <div class="form-hint">Per vehicle / day</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Trainer Food DA</label>
              <input type="number" class="form-input font-bold" id="rateFood" value="${r.foodPerDay || 1000}">
              <div class="form-hint">Per trainer / day</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Bus / Train Roundtrip</label>
              <input type="number" class="form-input font-bold" id="rateBusTrain" value="${r.busTrainPerTrip || 1888}">
              <div class="form-hint">Per trainer / trip</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Printing & Participant Collaterals -->
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
            <span style="font-size: 1.1rem;">📦</span>
            <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">3. Printing & Training Collaterals</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Collateral Kit</label>
              <input type="number" class="form-input font-bold" id="rateKit" value="${r.kitCost || 4799}">
              <div class="form-hint">Per facility kit</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Doll Model Set</label>
              <input type="number" class="form-input font-bold" id="rateDoll" value="${r.dollCost || 266}">
              <div class="form-hint">Per doll model set</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Thali Model Set</label>
              <input type="number" class="form-input font-bold" id="rateThali" value="${r.thaliCost || 180}">
              <div class="form-hint">Per thali model set</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Banners 3×6 ft (Pair)</label>
              <input type="number" class="form-input font-bold" id="rateBanner" value="${r.bannerCost || 1008}">
              <div class="form-hint">Per training event</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Stage Backdrop</label>
              <input type="number" class="form-input font-bold" id="rateBackdrop" value="${r.backdropCost || 3360}">
              <div class="form-hint">Per event setup</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Launch Collaterals</label>
              <input type="number" class="form-input font-bold" id="rateLaunch" value="${r.launchCollaterals || 8159}">
              <div class="form-hint">Per facility launch pkg</div>
            </div>
          </div>
        </div>

        <!-- Section 4: Training Venue, Hall & Food -->
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
            <span style="font-size: 1.1rem;">🏢</span>
            <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">4. Training Venue & Catering</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Training Hall Rental</label>
              <input type="number" class="form-input font-bold" id="rateHall" value="${r.venueHallPerDay || 5250}">
              <div class="form-hint">Per hall / training day</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Venue Food Catering</label>
              <input type="number" class="form-input font-bold" id="rateVenueFood" value="${r.venueFoodPerPerson || 750}">
              <div class="form-hint">Per participant / day</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">PC Cab Visit</label>
              <input type="number" class="form-input font-bold" id="ratePcCab" value="${r.pcCabPerVisit || 4725}">
              <div class="form-hint">Per monitoring visit</div>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">PC Food DA</label>
              <input type="number" class="form-input font-bold" id="ratePcFood" value="${r.pcFoodPerVisit || 1260}">
              <div class="form-hint">Per monitoring visit</div>
            </div>
          </div>
        </div>

        <!-- Section 5: Custom Benchmark Rate Fields -->
        ${customFields.length > 0 ? `
          <div class="card p-md mb-none" style="background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md);">
            <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
              <span style="font-size: 1.1rem;">⭐</span>
              <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #a78bfa;">5. Custom Admin Benchmark Rate Fields</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              ${customFields.map(cf => `
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11.5px;">⭐ ${cf.name}</label>
                  <input type="number" class="form-input font-bold custom-loc-rate-input" data-field-key="${cf.fieldKey}" value="${r[cf.fieldKey] !== undefined ? r[cf.fieldKey] : (cf.defaultUnitRate || 0)}">
                  <div class="form-hint">${cf.unitDesc || cf.parentAccount || 'Custom field rate'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </form>
    `;

    Utils.showModal(isEdit ? `✏️ Edit Benchmark Rates: ${r.stateName || r.location}` : (isCountryDef ? '🏛️ Configure Country Default Baseline Rates' : '➕ Add 5D State Benchmark Rates'), content, {
      modalWidth: '920px',
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-ghost', textContent: 'Cancel', onClick: close
        }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Save Benchmark Rates',
          onClick: async () => {
            const isCountryLevel = document.querySelector('input[name="rateLevelRadio"]:checked')?.value === 'country';
            const country = Utils.$('#rateCountry')?.value || 'India';
            let loc = isCountryLevel ? `${country} (Country Default)` : (Utils.$('#rateLocation')?.value.trim() || '');
            let stateName = Utils.$('#rateStateName').value.trim();

            if (!isCountryLevel && !loc) {
              Utils.showToast('Please select a 5D Location for this state override.', 'warning');
              return;
            }
            if (!stateName) {
              stateName = isCountryLevel ? `${country} Baseline (All States)` : loc;
            }

            const entityId = Utils.$('#rateEntity')?.value || 'nhipl';
            const currency = Utils.$('#rateCurrency')?.value || 'INR';

            const updatedData = {
              id: isCountryLevel ? ('country_' + country.toLowerCase().replace(/[^a-z0-9]/g, '_')) : (r.id || undefined),
              entityId: entityId,
              country: country,
              location: loc,
              stateName: stateName,
              stateCode: Utils.$('#rateStateCode').value.trim().toUpperCase() || (isCountryLevel ? `${country.slice(0,2).toUpperCase()}-DEFAULT` : loc.replace('India ', '')),
              currency: currency,
              isCountryDefault: isCountryLevel,
              hotelPerDay: Utils.parseNumber(Utils.$('#rateHotel').value) || 1890,
              cabPerDay: Utils.parseNumber(Utils.$('#rateCab').value) || 5000,
              foodPerDay: Utils.parseNumber(Utils.$('#rateFood').value) || 1000,
              busTrainPerTrip: Utils.parseNumber(Utils.$('#rateBusTrain').value) || 1888,
              kitCost: Utils.parseNumber(Utils.$('#rateKit').value) || 4799,
              dollCost: Utils.parseNumber(Utils.$('#rateDoll').value) || 266,
              thaliCost: Utils.parseNumber(Utils.$('#rateThali').value) || 180,
              bannerCost: Utils.parseNumber(Utils.$('#rateBanner').value) || 1008,
              backdropCost: Utils.parseNumber(Utils.$('#rateBackdrop').value) || 3360,
              launchCollaterals: Utils.parseNumber(Utils.$('#rateLaunch').value) || 8159,
              courierPerEvent: Utils.parseNumber(Utils.$('#rateCourier')?.value) || 800,
              venueHallPerDay: Utils.parseNumber(Utils.$('#rateHall').value) || 5250,
              venueFoodPerPerson: Utils.parseNumber(Utils.$('#rateVenueFood').value) || 750,
              pcCabPerVisit: Utils.parseNumber(Utils.$('#ratePcCab').value) || 4725,
              pcFoodPerVisit: Utils.parseNumber(Utils.$('#ratePcFood').value) || 1260,
              nonPcHotelPerDay: Utils.parseNumber(Utils.$('#rateNonPcHotel')?.value) || 2363,
              nonPcCabPerDay: 4200,
              nonPcFoodPerDay: 1180,
              airfareRoundtrip: 16520,
              leadershipHotelPerDay: 5985
            };

            // Capture custom rate values
            document.querySelectorAll('#impRateForm .custom-loc-rate-input').forEach(input => {
              const fKey = input.dataset.fieldKey;
              if (fKey) {
                updatedData[fKey] = Utils.parseNumber(input.value) || 0;
              }
            });

            await db.saveImpUnitRate(updatedData);
            Utils.showToast(`✅ Saved benchmark rates for ${stateName}!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  getLocationsForEntityOrCountry(entityId, country) {
    const ent = (entityId || '').toLowerCase();
    const c = (country || '').toLowerCase();

    if (ent === 'nhbd' || c === 'bangladesh') {
      return [
        'DHA-Dhaka', 'KHU-Khulna', 'CTG-Chattogram', 'RAJ-Rajshahi', 'BAR-Barishal',
        'SYL-Sylhet', 'RAN-Rangpur', 'MYM-Mymensingh', 'CTG-Cox\'s Bazar', 'DHA-Gazipur',
        'DHA-Narayanganj', 'KHU-Jashore', 'RAJ-Bogura', 'CTG-Cumilla', 'RAN-Dinajpur',
        'SYL-Habiganj', 'KHU-Kushtia', 'DHA-Tangail', 'MYM-Jamalpur', 'BAR-Patuakhali'
      ];
    }
    if (ent === 'nh-indo' || c === 'indonesia') {
      return [
        'Indo-East Java', 'Indo-Central Java', 'Indo-West Java', 'Indo-Jakarta',
        'Indo-Bali', 'Indo-Sumatra', 'Indo-West Kalimantan', 'Indo-Jogjakarta',
        'Indo-Southeast Sulawesi'
      ];
    }
    if (ent === 'nh-nepal' || c === 'nepal') {
      return [
        'Nepal-Kathmandu', 'Nepal-Pokhara', 'Nepal-Lalitpur', 'Nepal-Biratnagar', 'Nepal-Chitwan', 'Nepal'
      ];
    }
    if (ent === 'noora-us' || c === 'usa' || c === 'united states') {
      return [
        'US', 'USA-California', 'USA-New York'
      ];
    }
    // Default India
    return [
      'India KA', 'India UP', 'India MH', 'India MP', 'India AP', 'India TS', 'India OR',
      'India PB', 'India HR', 'India TN', 'India RJ', 'India JK', 'India DL', 'India AS',
      'India JH', 'India BR', 'India WB', 'India GA', 'India KL', 'India UT', 'India UK'
    ];
  },

  onRateEntityChanged(entityId) {
    const countrySelect = document.getElementById('rateCountry');
    const currSelect = document.getElementById('rateCurrency');
    const locSelect = document.getElementById('rateLocation');
    const isCountry = document.querySelector('input[name="rateLevelRadio"]:checked')?.value === 'country';

    let targetCountry = 'India';
    let targetCurr = 'INR';

    if (entityId === 'nhbd') {
      targetCountry = 'Bangladesh';
      targetCurr = 'BDT';
    } else if (entityId === 'nh-indo') {
      targetCountry = 'Indonesia';
      targetCurr = 'IDR';
    } else if (entityId === 'nh-nepal') {
      targetCountry = 'Nepal';
      targetCurr = 'NPR';
    } else if (entityId === 'noora-us') {
      targetCountry = 'USA';
      targetCurr = 'USD';
    } else if (entityId === 'nhipl' || entityId === 'yaif') {
      targetCountry = 'India';
      targetCurr = 'INR';
    }

    if (countrySelect) countrySelect.value = targetCountry;
    if (currSelect) currSelect.value = targetCurr;

    // Filter 5D Location Tag dropdown to only show related locations for this entity/country
    if (locSelect) {
      const filteredLocs = this.getLocationsForEntityOrCountry(entityId, targetCountry);
      locSelect.innerHTML = `
        <option value="">-- Select 5D Location (D5) --</option>
        ${filteredLocs.map(l => `<option value="${l}">📍 ${l}</option>`).join('')}
      `;
      if (filteredLocs.length > 0 && !isCountry) {
        locSelect.value = filteredLocs[0];
        this.onRateLocationSelected(filteredLocs[0]);
      }
    }

    this.onRateCountryChanged(targetCountry, false);
  },

  onRateLevelRadioChanged(isCountry) {
    const locGroup = document.getElementById('rateLocationGroup');
    const stateInput = document.getElementById('rateStateName');
    const codeInput = document.getElementById('rateStateCode');
    const country = document.getElementById('rateCountry')?.value || 'India';
    const entity = document.getElementById('rateEntity')?.value || 'nhipl';
    const locSelect = document.getElementById('rateLocation');

    if (locGroup) locGroup.style.display = isCountry ? 'none' : 'block';
    if (isCountry) {
      if (stateInput) stateInput.value = `${country} Baseline (All States)`;
      if (codeInput) codeInput.value = `${country.slice(0,2).toUpperCase()}-DEFAULT`;
    } else {
      if (locSelect) {
        const filteredLocs = this.getLocationsForEntityOrCountry(entity, country);
        locSelect.innerHTML = `
          <option value="">-- Select 5D Location (D5) --</option>
          ${filteredLocs.map(l => `<option value="${l}">📍 ${l}</option>`).join('')}
        `;
        if (filteredLocs.length > 0) {
          locSelect.value = filteredLocs[0];
          this.onRateLocationSelected(filteredLocs[0]);
        }
      }
    }
  },

  onRateCountryChanged(country, updateLocations = true) {
    const currSelect = document.getElementById('rateCurrency');
    if (currSelect) {
      if (country === 'Bangladesh') currSelect.value = 'BDT';
      else if (country === 'Indonesia') currSelect.value = 'IDR';
      else if (country === 'USA') currSelect.value = 'USD';
      else if (country === 'Nepal') currSelect.value = 'NPR';
      else if (country === 'India') currSelect.value = 'INR';
    }

    const isCountry = document.querySelector('input[name="rateLevelRadio"]:checked')?.value === 'country';
    const stateInput = document.getElementById('rateStateName');
    const codeInput = document.getElementById('rateStateCode');
    const locSelect = document.getElementById('rateLocation');

    if (isCountry) {
      if (stateInput) stateInput.value = `${country} Baseline (All States)`;
      if (codeInput) codeInput.value = `${country.slice(0,2).toUpperCase()}-DEFAULT`;
    } else if (updateLocations && locSelect) {
      const entitySelect = document.getElementById('rateEntity');
      const filteredLocs = this.getLocationsForEntityOrCountry(entitySelect?.value, country);
      locSelect.innerHTML = `
        <option value="">-- Select 5D Location (D5) --</option>
        ${filteredLocs.map(l => `<option value="${l}">📍 ${l}</option>`).join('')}
      `;
      if (filteredLocs.length > 0) {
        locSelect.value = filteredLocs[0];
        this.onRateLocationSelected(filteredLocs[0]);
      }
    }
  },

  async onRateLocationSelected(loc) {
    if (!loc) return;
    const stateInput = document.getElementById('rateStateName');
    const codeInput = document.getElementById('rateStateCode');
    const countrySelect = document.getElementById('rateCountry');

    if (loc.startsWith('DHA-') || loc.startsWith('KHU-') || loc.startsWith('CTG-') || loc.startsWith('RAJ-') || loc.startsWith('BAR-')) {
      if (countrySelect) {
        countrySelect.value = 'Bangladesh';
        this.onRateCountryChanged('Bangladesh');
      }
      const parts = loc.split('-');
      if (codeInput) codeInput.value = parts[0];
      if (stateInput) stateInput.value = parts[1] ? parts[1] + ' District' : loc;
    } else {
      const stateMap = {
        'India KA': { state: 'Karnataka', code: 'KA' },
        'India UP': { state: 'Uttar Pradesh', code: 'UP' },
        'India MH': { state: 'Maharashtra', code: 'MH' },
        'India MP': { state: 'Madhya Pradesh', code: 'MP' },
        'India AP': { state: 'Andhra Pradesh', code: 'AP' },
        'India TS': { state: 'Telangana', code: 'TS' },
        'India OR': { state: 'Odisha', code: 'OD' },
        'India PB': { state: 'Punjab', code: 'PB' },
        'India HR': { state: 'Haryana', code: 'HR' },
        'India TN': { state: 'Tamil Nadu', code: 'TN' },
        'India RJ': { state: 'Rajasthan', code: 'RJ' },
        'India JK': { state: 'Jammu & Kashmir', code: 'JK' },
        'India DL': { state: 'Delhi', code: 'DL' },
        'India AS': { state: 'Assam', code: 'AS' },
        'India JH': { state: 'Jharkhand', code: 'JH' },
        'India BR': { state: 'Bihar', code: 'BR' },
        'India WB': { state: 'West Bengal', code: 'WB' },
        'India GA': { state: 'Goa', code: 'GA' },
        'India KL': { state: 'Kerala', code: 'KL' },
        'India UT': { state: 'Uttarakhand', code: 'UT' },
        'India UK': { state: 'Uttarakhand', code: 'UK' }
      };

      if (stateMap[loc]) {
        if (countrySelect) {
          countrySelect.value = 'India';
          this.onRateCountryChanged('India');
        }
        if (stateInput) stateInput.value = stateMap[loc].state;
        if (codeInput) codeInput.value = stateMap[loc].code;
      } else {
        const parts = loc.split(' ');
        const codeCandidate = parts.length > 1 ? parts[parts.length - 1] : loc.slice(0, 3).toUpperCase();
        if (codeInput) codeInput.value = codeCandidate;
        if (stateInput) stateInput.value = loc.replace(/^India\s+/i, '');
      }
    }

    // Auto-populate with parent country default baseline if this state doesn't have an override yet
    try {
      const country = countrySelect ? countrySelect.value : 'India';
      const cDefault = await db.getImpCountryDefaultRates(country);
      if (cDefault) {
        if (document.getElementById('rateHotel')) document.getElementById('rateHotel').value = cDefault.hotelPerDay || 1890;
        if (document.getElementById('rateCab')) document.getElementById('rateCab').value = cDefault.cabPerDay || 5000;
        if (document.getElementById('rateFood')) document.getElementById('rateFood').value = cDefault.foodPerDay || 1000;
        if (document.getElementById('rateBusTrain')) document.getElementById('rateBusTrain').value = cDefault.busTrainPerTrip || 1888;
        if (document.getElementById('rateKit')) document.getElementById('rateKit').value = cDefault.kitCost || 4799;
        if (document.getElementById('rateDoll')) document.getElementById('rateDoll').value = cDefault.dollCost || 266;
        if (document.getElementById('rateThali')) document.getElementById('rateThali').value = cDefault.thaliCost || 180;
        if (document.getElementById('rateBanner')) document.getElementById('rateBanner').value = cDefault.bannerCost || 1008;
        if (document.getElementById('rateBackdrop')) document.getElementById('rateBackdrop').value = cDefault.backdropCost || 3360;
        if (document.getElementById('rateLaunch')) document.getElementById('rateLaunch').value = cDefault.launchCollaterals || 8159;
        if (document.getElementById('rateHall')) document.getElementById('rateHall').value = cDefault.venueHallPerDay || 5250;
        if (document.getElementById('rateVenueFood')) document.getElementById('rateVenueFood').value = cDefault.venueFoodPerPerson || 750;
        if (document.getElementById('ratePcCab')) document.getElementById('ratePcCab').value = cDefault.pcCabPerVisit || 4725;
        if (document.getElementById('ratePcFood')) document.getElementById('ratePcFood').value = cDefault.pcFoodPerVisit || 1260;
      }
    } catch (err) {
      console.warn('Could not auto-fill country default:', err);
    }
  },

  async revertStateOverride(location) {
    if (!confirm(`Revert "${location}" to Country Default rates? All state-level customized overrides will be removed.`)) return;
    await db.revertStateOverrideToCountryDefault(location);
    Utils.showToast(`✅ Reverted "${location}" to inherit Country Default rates!`, 'success');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async deleteImpUnitRate(id) {
    if (!confirm('Are you sure you want to delete this custom rate configuration?')) return;
    await db.delete(STORES.impUnitRates, id);
    Utils.showToast('🗑️ Deleted custom rate configuration.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: Benchmark Rate Fields & Calculation Engine (Standard + Custom)
  // ═══════════════════════════════════════════════════════════════════════════
  async renderImpCustomFieldsTab(container, standardFields, customFields) {
    const categories = await db.getAllImpRateCategories();
    const totalFieldsCount = (standardFields?.length || 0) + (customFields?.length || 0);

    container.innerHTML = `
      <!-- Top Overview Banner -->
      <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-left: 4px solid var(--accent-primary);">
        <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="flex items-center gap-sm">
              <span class="badge badge-primary font-bold">RATE VARIABLES &amp; CALCULATION RULES</span>
              <span class="badge badge-emerald font-bold">${totalFieldsCount} Total Benchmark Fields</span>
              <span class="badge badge-purple font-bold">${categories.length} Field Categories</span>
            </div>
            <h3 class="mt-xs" style="margin-bottom: 2px; color: var(--text-primary);">
              Benchmark Rate Fields &amp; Driver Calculation Master
            </h3>
            <div class="text-secondary" style="font-size: 12px;">
              Manage both <strong>Standard Built-In Benchmark Fields</strong> and <strong>Custom Admin Fields</strong> &bull; Configure driver formulas, multiplier defaults, categories, and GL bindings
            </div>
          </div>
          <div class="flex items-center gap-sm" style="flex-wrap: wrap;">
            <button class="btn btn-secondary font-bold" onclick="ConfigModule.showManageCategoriesModal()">
              📁 Manage Field Categories (${categories.length})
            </button>
            <button class="btn btn-primary font-bold" onclick="ConfigModule.showCustomRateFieldModal()">
              ➕ + Add Custom Rate Field
            </button>
          </div>
        </div>
      </div>

      <!-- ─── 1. Standard Built-In Benchmark Rate Fields (Admin Editable) ─── -->
      <div class="card mb-lg" style="border: 1px solid var(--border-default);">
        <div class="card-header flex justify-between items-center" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-default);">
          <div>
            <div class="card-title font-bold" style="font-size: 1.1rem; color: var(--text-primary);">
              🏛️ 1. Standard Built-In Benchmark Rate Fields (${standardFields.length})
            </div>
            <div class="card-subtitle" style="font-size: 11.5px;">
              Core benchmark variables used across Activities 10.1 to 10.8 &bull; Click <strong>✏️ Edit Field &amp; Calculation</strong> to change names, categories, GL bindings, or formulas
            </div>
          </div>
          <span class="badge badge-cyan font-bold" style="font-size: 11px;">Standard Norms</span>
        </div>

        <div class="table-container mb-none">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th style="min-width: 230px;">Field Display Name</th>
                <th style="min-width: 140px;">Identifier Key</th>
                <th>Category</th>
                <th style="min-width: 160px;">Default GL Binding</th>
                <th style="min-width: 130px; text-align: center;">Rate Sourcing</th>
                <th style="min-width: 150px;">Unit Description</th>
                <th style="min-width: 240px;">Default Calculation Driver Rule</th>
                <th style="width: 120px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${standardFields.map(sf => {
                const formulaText = this.formulaTypeMap[sf.defaultFormula] || sf.defaultFormula || 'Events × Days × Trainers × Rate';
                const catObj = categories.find(c => (c.code || c.id) === (sf.category || 'misc') || c.id === sf.category) || { name: sf.category || 'General', icon: '🏷️', colorClass: 'badge-secondary' };
                
                return `
                  <tr style="${sf.isCustomized ? 'background: rgba(99, 102, 241, 0.04);' : ''}">
                    <td class="font-bold text-primary">
                      ${sf.name}
                      ${sf.isCustomized ? `<span class="badge badge-purple" style="font-size: 9px; padding: 1px 4px; margin-left: 4px;">Customized</span>` : ''}
                    </td>
                    <td><code style="font-size: 11px;">${sf.fieldKey || sf.key}</code></td>
                    <td>
                      <span class="badge ${catObj.colorClass || 'badge-secondary'}" style="font-size: 10px; text-transform: uppercase;">
                        ${catObj.icon || ''} ${catObj.name}
                      </span>
                    </td>
                    <td>
                      <code>${sf.defaultGlCode || sf.defaultGl || '93201'}</code>
                      <div style="font-size: 10px; color: var(--text-secondary);">${sf.parentAccount || ''}</div>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-emerald font-bold" style="font-size: 10px;" title="Unit rate values are configured per Country Defaults & 5D State Overrides in Tab 1">
                        📍 Dynamic (Tab 1)
                      </span>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 11px;">
                      ${sf.unitDesc || sf.unit || '—'}
                    </td>
                    <td style="font-size: 11px; color: var(--text-secondary);">
                      <span class="badge badge-outline" style="font-size: 10.5px;">🧮 ${formulaText}</span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                      <button class="btn btn-ghost btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal('${sf.fieldKey || sf.key}', true)" title="Edit standard field & calculation rule">
                        ✏️ Edit
                      </button>
                      ${sf.isCustomized ? `
                        <button class="btn btn-ghost btn-sm text-danger" onclick="ConfigModule.resetStandardBenchmarkField('${sf.fieldKey || sf.key}')" title="Reset this standard field to seed factory defaults">
                          ↺ Reset
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── 2. Custom Admin Benchmark Rate Fields ─── -->
      <div class="card mb-lg" style="border: 1px solid var(--border-default);">
        <div class="card-header flex justify-between items-center" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-default);">
          <div>
            <div class="card-title font-bold" style="font-size: 1.1rem; color: var(--text-primary);">
              ⭐ 2. Custom Admin Benchmark Rate Fields (${customFields.length})
            </div>
            <div class="card-subtitle" style="font-size: 11.5px;">
              User-defined rate variables (e.g. Doctor Honorarium, Stationery &amp; Certificates, AV Rental) linked dynamically to Activity Templates
            </div>
          </div>
          <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal()">
            ➕ + Add Custom Field
          </button>
        </div>

        ${customFields.length === 0 ? `
          <div class="p-lg text-center text-muted">
            <div style="font-size: 2rem; margin-bottom: 8px;">⭐</div>
            <h4>No Custom Rate Fields Defined</h4>
            <p class="mt-xs">Add your first custom rate field to link it to activity templates for 10.1 to 10.8.</p>
            <button class="btn btn-primary mt-sm" onclick="ConfigModule.showCustomRateFieldModal()">➕ Add Custom Field</button>
          </div>
        ` : `
          <div class="table-container mb-none">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th style="min-width: 230px;">Field Display Name</th>
                  <th style="min-width: 140px;">Identifier Key</th>
                  <th>Category</th>
                  <th style="min-width: 160px;">Default GL Binding</th>
                  <th style="min-width: 130px; text-align: center;">Rate Sourcing</th>
                  <th style="min-width: 150px;">Unit Description</th>
                  <th style="min-width: 240px;">Default Calculation Driver Rule</th>
                  <th style="width: 120px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${customFields.map(cf => {
                  const formulaText = this.formulaTypeMap[cf.defaultFormula] || cf.defaultFormula || 'Events × Days × Honorarium Rate';
                  const catObj = categories.find(c => (c.code || c.id) === (cf.category || 'misc') || c.id === cf.category) || { name: cf.category || 'General', icon: '🏷️', colorClass: 'badge-secondary' };

                  return `
                    <tr>
                      <td class="font-bold text-primary">
                        ⭐ ${cf.name}
                      </td>
                      <td><code style="font-size: 11px;">${cf.fieldKey}</code></td>
                      <td>
                        <span class="badge ${catObj.colorClass || 'badge-secondary'}" style="font-size: 10px; text-transform: uppercase;">
                          ${catObj.icon || ''} ${catObj.name}
                        </span>
                      </td>
                      <td>
                        <code>${cf.defaultGlCode || '93201'}</code>
                        <div style="font-size: 10px; color: var(--text-secondary);">${cf.parentAccount || ''}</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge badge-emerald font-bold" style="font-size: 10px;" title="Unit rate values are configured per Country Defaults & 5D State Overrides in Tab 1">
                          📍 Dynamic (Tab 1)
                        </span>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 11px;">
                        ${cf.unitDesc || '—'}
                      </td>
                      <td style="font-size: 11px; color: var(--text-secondary);">
                        <span class="badge badge-outline" style="font-size: 10.5px;">🧮 ${formulaText}</span>
                      </td>
                      <td style="text-align: center; white-space: nowrap;">
                        <button class="btn btn-ghost btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal('${cf.id}', false)" title="Edit custom field">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteCustomRateField('${cf.id}')" title="Delete custom field">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  // ─── Modal to Add / Edit Standard or Custom Benchmark Rate Field & Calculation Rule ───
  async showCustomRateFieldModal(fieldId = null, isStandard = false) {
    let existing = null;
    const standardFields = await db.getAllImpStandardBenchmarkFields();
    const customFields = await db.getAllImpCustomRateFields();
    const categories = await db.getAllImpRateCategories();

    if (fieldId) {
      if (isStandard) {
        existing = standardFields.find(f => (f.fieldKey === fieldId || f.id === fieldId || f.key === fieldId));
      } else {
        existing = customFields.find(f => (f.id === fieldId || f.fieldKey === fieldId));
      }
    }

    const isEditingStandard = isStandard || (existing && existing.isBuiltIn);

    const defaultFormula = existing?.defaultFormula || (
      existing?.category === 'travel' ? 'events_days_trainers' :
      (existing?.category === 'printing' ? (existing?.fieldKey?.includes('doll') || existing?.fieldKey?.includes('thali') ? 'facilities_multiplier' : 'facilities_rate') :
      (existing?.category === 'venue' ? (existing?.fieldKey?.includes('Food') ? 'events_days_participants' : 'events_days_hall') :
      (existing?.category === 'professional' ? 'events_days_honorarium' : 'events_days_trainers')))
    );

    // Initial formula expression
    const initialExpression = existing?.formulaExpression || (
      defaultFormula === 'events_days_trainers' ? 'events * days * trainers * rate * multiplier' :
      (defaultFormula === 'events_trainers' ? 'events * trainers * rate * multiplier' :
      (defaultFormula === 'facilities_rate' ? 'facilities * rate * multiplier' :
      (defaultFormula === 'facilities_multiplier' ? 'facilities * multiplier * rate' :
      (defaultFormula === 'events_rate' ? 'events * rate * multiplier' :
      (defaultFormula === 'events_days_hall' ? 'events * days * rate * multiplier' :
      (defaultFormula === 'events_days_participants' ? 'events * days * trainees * rate * multiplier' :
      (defaultFormula === 'events_days_honorarium' ? 'events * days * multiplier * rate' :
      (defaultFormula === 'participants_rate' ? 'trainees * rate * multiplier' :
      (defaultFormula === 'facilities_pc_cab' ? 'facilities * rate * multiplier' :
      (defaultFormula === 'facilities_pc_food' ? 'facilities * rate * multiplier' : 'multiplier * rate'))))))))))
    );

    const content = `
      <form id="customRateFieldForm" style="font-size: 13px;">
        <div class="card p-sm mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-xs">
              <span class="badge ${isEditingStandard ? 'badge-cyan' : 'badge-indigo'} font-bold">
                ${isEditingStandard ? '🏛️ STANDARD BENCHMARK FIELD' : '⭐ CUSTOM ADMIN FIELD'}
              </span>
              <span class="text-secondary" style="font-size: 11.5px;">
                ${isEditingStandard ? 'Configuring core standard benchmark variable & AI calculation formula' : 'Configuring custom benchmark rate field & AI calculation formula'}
              </span>
            </div>
            <span class="badge badge-purple font-bold" style="font-size: 10px;">✨ AI Assisted Formula</span>
          </div>
        </div>

        <!-- Field Display Name -->
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Field Display Name &amp; Label <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="customFieldName" value="${existing?.name || ''}" placeholder="e.g. 🏨 Hotel Accommodation (Double Occupancy), 🩺 Doctor Honorarium" oninput="ConfigModule.updateFormulaSimulationPreview()" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Field Identifier Key <span class="text-danger">*</span></label>
            <input type="text" class="form-input font-mono" id="customFieldKey" value="${existing?.fieldKey || existing?.key || ''}" placeholder="e.g. doctorHonorarium" ${isEditingStandard || existing ? 'readonly' : ''} required>
            <div class="form-hint">${isEditingStandard ? 'Standard field key is locked to maintain DB mappings' : 'Unique key (camelCase, e.g. doctorHonorarium)'}</div>
          </div>
          <div class="form-group mb-none">
            <div class="flex justify-between items-center mb-xs">
              <label class="form-label font-bold" style="margin-bottom: 0;">Field Category <span class="text-danger">*</span></label>
              <button type="button" class="btn btn-ghost btn-xs font-bold" onclick="ConfigModule.showCategoryFormModal(null, true)" style="color: var(--accent-primary); font-size: 11px; padding: 1px 6px;">
                ➕ + New Category
              </button>
            </div>
            <select class="form-select font-bold" id="customFieldCategory">
              ${categories.map(c => `
                <option value="${c.code || c.id}" ${(existing?.category === (c.code || c.id)) ? 'selected' : ''}>
                  ${c.icon || '🏷️'} ${c.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Default General Ledger (GL) Account Binding</label>
            <select class="form-select font-bold" id="customFieldGl">
              <option value="93101" ${(existing?.defaultGlCode || existing?.defaultGl) === '93101' ? 'selected' : ''}>Hotel Accommodation (Travel &amp; Lodging Expenses)</option>
              <option value="93104" ${(existing?.defaultGlCode || existing?.defaultGl) === '93104' ? 'selected' : ''}>Cab/Auto (Travel &amp; Lodging Expenses)</option>
              <option value="93102" ${(existing?.defaultGlCode || existing?.defaultGl) === '93102' ? 'selected' : ''}>Food Expenses (Travel &amp; Lodging Expenses)</option>
              <option value="93105" ${(existing?.defaultGlCode || existing?.defaultGl) === '93105' ? 'selected' : ''}>Bus/Train (Travel &amp; Lodging Expenses)</option>
              <option value="93103" ${(existing?.defaultGlCode || existing?.defaultGl) === '93103' ? 'selected' : ''}>Air fare (Travel &amp; Lodging Expenses)</option>
              <option value="93106" ${(existing?.defaultGlCode || existing?.defaultGl) === '93106' ? 'selected' : ''}>Other incidental travel costs (Travel &amp; Lodging Expenses)</option>
              <option value="93204" ${(existing?.defaultGlCode || existing?.defaultGl) === '93204' ? 'selected' : ''}>Printing expenses (Supplies &amp; Printing Costs)</option>
              <option value="93201" ${(existing?.defaultGlCode || existing?.defaultGl) === '93201' ? 'selected' : ''}>Other Direct Expenses (Supplies &amp; Printing Costs)</option>
              <option value="93701" ${(existing?.defaultGlCode || existing?.defaultGl) === '93701' ? 'selected' : ''}>Professional Charges (Professional &amp; Consultancy Charges)</option>
              <option value="93302" ${(existing?.defaultGlCode || existing?.defaultGl) === '93302' ? 'selected' : ''}>Postage &amp; Courier Expenses (Communication Cost)</option>
              <option value="93301" ${(existing?.defaultGlCode || existing?.defaultGl) === '93301' ? 'selected' : ''}>Internet Expenses (Communication Cost)</option>
              <option value="93401" ${(existing?.defaultGlCode || existing?.defaultGl) === '93401' ? 'selected' : ''}>Software and Subscriptions (Office Expenses)</option>
              <option value="93404" ${(existing?.defaultGlCode || existing?.defaultGl) === '93404' ? 'selected' : ''}>Stationery &amp; Consumables (Office Expenses)</option>
              <option value="93405" ${(existing?.defaultGlCode || existing?.defaultGl) === '93405' ? 'selected' : ''}>Office Equipment Expense (Office Expenses)</option>
            </select>
          </div>
          <div class="form-group mb-none">
            <label class="form-label font-bold">Rate Sourcing / Multi-Country Matrix</label>
            <div style="padding: 6px 10px; background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: 6px; font-size: 11.5px;">
              <span class="badge badge-emerald font-bold" style="font-size: 10px;">📍 Dynamic Rate from Tab 1</span>
              <div class="text-tertiary" style="font-size: 10px; margin-top: 2px;">Rates are set per country (INR, BDT, IDR, NPR, USD) in Tab 1</div>
            </div>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Unit / Basis Description</label>
          <input type="text" class="form-input" id="customFieldUnitDesc" value="${existing?.unitDesc || existing?.unit || ''}" placeholder="e.g. Per trainer / night, Per doctor / training session, Per facility kit">
        </div>

        <!-- ─── ✨ AI FORMULA DRAFTER BOX ─── -->
        <div class="card p-md mb-md" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: var(--radius-md);">
          <div class="flex justify-between items-center mb-xs">
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.15rem;">✨</span>
              <strong style="color: #a855f7; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em;">
                AI Formula Drafter (Understands 5 Operating Variables)
              </strong>
            </div>
            <span class="text-tertiary" style="font-size: 10.5px;">Natural language → Mathematical Formula</span>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-input" id="aiPromptInput" placeholder="Describe logic e.g. '2 guest doctors per day for each batch', 'Lunch & tea for trainees per day', '3 thali sets per facility'..." style="font-size: 12px; background: var(--bg-primary);">
            <button type="button" class="btn btn-primary font-bold" onclick="ConfigModule.triggerAiFormulaDraft(false)" style="white-space: nowrap; font-size: 11.5px; background: linear-gradient(135deg, #6366f1, #a855f7);">
              ✨ AI Draft
            </button>
          </div>

          <!-- Quick AI Prompt Suggestion Chips -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span class="text-tertiary font-bold" style="font-size: 10px; text-transform: uppercase;">Quick Prompts:</span>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('2 guest doctors per day for each training batch', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🩺 2 Doctors / Day</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Daily lunch and snacks catering for all trainees', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🍱 Trainee Meals / Day</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('3 thali sets per facility with standard multiplier', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">📦 3 Sets / Facility</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Transit tickets roundtrip for trainers team per batch', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🚆 Transit / Trainer</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Venue hall rental per training day', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🏢 Hall / Day</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Stationery kit and certificates for all participants', false)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">📚 Kit / Trainee</button>
          </div>

          <div id="aiDraftExplanation" style="display: none; margin-top: 8px; padding: 8px; background: var(--bg-card); border-radius: 6px; font-size: 11px; border-left: 3px solid #a855f7;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- ─── CALCULATION ENGINE & EDITABLE FORMULA BUILDER ─── -->
        <div class="card p-md mb-none" style="background: var(--bg-primary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex justify-between items-center mb-xs">
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.1rem;">🧮</span>
              <strong style="color: var(--accent-primary); font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em;">
                Editable Formula Expression &amp; Driver Rule
              </strong>
            </div>
            <span id="formulaSyntaxBadge" class="badge badge-emerald" style="font-size: 10px;">✅ Valid Syntax</span>
          </div>

          <!-- Freeform Formula Expression Input -->
          <div class="form-group mb-xs">
            <label class="form-label font-bold" style="font-size: 11px;">
              Mathematical Formula Expression <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-input font-mono font-bold" id="customFormulaExpression" value="${initialExpression}" placeholder="e.g. events * days * trainers * rate * multiplier" oninput="ConfigModule.onFormulaExpressionInput(false)" style="font-size: 13px; color: var(--accent-primary); background: var(--bg-secondary);">
          </div>

          <!-- Quick Variable Insertion Chips (The 5 Operating Variables + Operators) -->
          <div class="mb-sm" style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
            <span class="text-tertiary font-bold" style="font-size: 10px; text-transform: uppercase;">Insert Variable:</span>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'events', false)" style="font-size: 10.5px; color: #a855f7;">+ events (Batches)</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'days', false)" style="font-size: 10.5px; color: #3b82f6;">+ days</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'trainers', false)" style="font-size: 10.5px; color: #10b981;">+ trainers (Team)</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'trainees', false)" style="font-size: 10.5px; color: #f59e0b;">+ trainees (Pax)</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'facilities', false)" style="font-size: 10.5px; color: #ec4899;">+ facilities</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'rate', false)" style="font-size: 10.5px; color: var(--accent-primary);" title="Unit rate sourced from Tab 1 Country/State Matrix">+ rate</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', 'multiplier', false)" style="font-size: 10.5px;">+ multiplier</button>
            <span style="border-left: 1px solid var(--border-subtle); height: 16px; margin: 0 2px;"></span>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' * ', false)">*</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' + ', false)">+</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' - ', false)">-</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' / ', false)">/</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' ( ', false)">(</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('customFormulaExpression', ' ) ', false)">)</button>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Standard Driver Mapping Preset</label>
              <select class="form-select font-bold" id="customFieldFormula" onchange="ConfigModule.onFormulaPresetSelected(this.value, false)">
                <option value="events_days_trainers" ${defaultFormula === 'events_days_trainers' ? 'selected' : ''}>Events × Days × Trainers × Rate (Hotel / Cab / Food DA)</option>
                <option value="events_trainers" ${defaultFormula === 'events_trainers' ? 'selected' : ''}>Events × Trainers × Rate (Transit / Roundtrip Tickets)</option>
                <option value="facilities_rate" ${defaultFormula === 'facilities_rate' ? 'selected' : ''}>Facilities × Rate (Collateral Kits / Launch Packages)</option>
                <option value="facilities_multiplier" ${defaultFormula === 'facilities_multiplier' ? 'selected' : ''}>Facilities × Multiplier × Rate (Dolls = 2, Thalis = 3)</option>
                <option value="events_rate" ${defaultFormula === 'events_rate' ? 'selected' : ''}>Events × Multiplier × Rate (Banners / Courier / Handouts)</option>
                <option value="events_days_hall" ${defaultFormula === 'events_days_hall' ? 'selected' : ''}>Events × Days × Hall Rate (Venue Hall Rental)</option>
                <option value="events_days_participants" ${defaultFormula === 'events_days_participants' ? 'selected' : ''}>Events × Days × Trainees × Rate (Catering / Meals)</option>
                <option value="events_days_honorarium" ${defaultFormula === 'events_days_honorarium' ? 'selected' : ''}>Events × Days × Multiplier × Rate (Doctor Honorarium)</option>
                <option value="participants_rate" ${defaultFormula === 'participants_rate' ? 'selected' : ''}>Trainees × Multiplier × Rate (Certificates &amp; Stationery)</option>
                <option value="facilities_pc_cab" ${defaultFormula === 'facilities_pc_cab' ? 'selected' : ''}>Facilities × PC Cab Rate (Supervision Visits)</option>
                <option value="facilities_pc_food" ${defaultFormula === 'facilities_pc_food' ? 'selected' : ''}>Facilities × PC Food Rate (Supervision DA)</option>
                <option value="custom_expression" ${defaultFormula === 'custom_expression' ? 'selected' : ''}>Custom Math Expression (AI / User Defined)</option>
                <option value="fixed_amount" ${defaultFormula === 'fixed_amount' ? 'selected' : ''}>Flat Fixed Amount (Rate × Multiplier)</option>
              </select>
            </div>

            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Multiplier / Factor</label>
              <input type="number" step="any" class="form-input font-bold font-mono" id="customFieldMultiplier" value="${existing?.defaultMultiplier || 1}" oninput="ConfigModule.updateFormulaSimulationPreview()">
              <div class="form-hint">e.g. 2 for Dolls, 3 for Thalis, 1.18 for Tax</div>
            </div>
          </div>

          <!-- Interactive Live Simulation Box -->
          <div class="card p-sm mb-none" style="background: rgba(99, 102, 241, 0.05); border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 6px;">
            <div class="flex justify-between items-center mb-xs">
              <span class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">
                🔍 Live Formula Simulation Preview
              </span>
              <span class="badge badge-purple" style="font-size: 10px;">Sample Scale: 1 Batch, 2 Days, 2 Trainers, 10 Facilities, 25 Trainees</span>
            </div>
            <div id="formulaSimulationOutput" class="font-bold font-mono" style="color: var(--accent-primary); font-size: 12.5px;">
              <!-- Computed live via JS -->
            </div>
          </div>
        </div>
      </form>
    `;

    Utils.showModal(
      existing ? `✏️ Edit Benchmark Field & Calculation: ${existing.name}` : '➕ Add Custom Benchmark Rate Field',
      content,
      {
        modalWidth: '700px',
        footer: (footer, close) => {
          footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
          footer.appendChild(Utils.createElement('button', {
            className: 'btn btn-primary font-bold',
            textContent: '💾 Save Benchmark Field & Formula',
            onClick: async () => {
              const name = Utils.$('#customFieldName').value.trim();
              let key = Utils.$('#customFieldKey').value.trim();
              if (!name) {
                Utils.showToast('Please enter field name.', 'warning');
                return;
              }
              if (!key) {
                key = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
              }

              const category = Utils.$('#customFieldCategory').value;
              const glCode = Utils.$('#customFieldGl').value;
              const unitDesc = Utils.$('#customFieldUnitDesc').value.trim();
              const formula = Utils.$('#customFieldFormula').value;
              const formulaExpr = Utils.$('#customFormulaExpression').value.trim() || 'events * days * trainers * rate * multiplier';
              const multiplier = Utils.parseNumber(Utils.$('#customFieldMultiplier').value) || 1;

              // Validate formula syntax
              const validation = Utils.FormulaEvaluator.validate(formulaExpr);
              if (!validation.valid) {
                Utils.showToast(`Formula syntax error: ${validation.error}`, 'danger');
                return;
              }

              const parentMap = {
                '93101': 'Travel & Lodging Expenses',
                '93102': 'Travel & Lodging Expenses',
                '93103': 'Travel & Lodging Expenses',
                '93104': 'Travel & Lodging Expenses',
                '93105': 'Travel & Lodging Expenses',
                '93106': 'Travel & Lodging Expenses',
                '93201': 'Supplies & Printing Costs',
                '93204': 'Supplies & Printing Costs',
                '93301': 'Communication Cost',
                '93302': 'Communication Cost',
                '93303': 'Communication Cost',
                '93401': 'Office Expenses',
                '93404': 'Office Expenses',
                '93405': 'Office Expenses',
                '93701': 'Professional & Consultancy Charges',
                '93703': 'Professional & Consultancy Charges'
              };

              const fieldObj = {
                id: existing?.id || key,
                fieldKey: key,
                name: name,
                category: category,
                defaultGlCode: glCode,
                parentAccount: parentMap[glCode] || 'Direct Cost',
                unitDesc: unitDesc,
                defaultFormula: formula,
                formulaExpression: formulaExpr,
                defaultMultiplier: multiplier,
                isBuiltIn: isEditingStandard,
                isCustomized: isEditingStandard ? true : false
              };

              await db.saveImpCustomRateField(fieldObj);
              Utils.showToast(`✅ Saved benchmark field "${name}" and calculation formula!`, 'success');
              close();
              const pageContent = Utils.$('#pageContent');
              if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
            }
          }));
        }
      }
    );

    // Run preview once modal opens
    setTimeout(() => this.updateFormulaSimulationPreview(), 50);

    // Auto generate key from name if new field
    if (!existing) {
      const nameInput = document.getElementById('customFieldName');
      const keyInput = document.getElementById('customFieldKey');
      nameInput?.addEventListener('input', () => {
        const val = nameInput.value.trim().toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+(.)/g, (match, group1) => group1.toUpperCase());
        if (keyInput) keyInput.value = val;
      });
    }
  },

  // ─── AI Formula Drafter Actions ───
  triggerAiFormulaDraft(isTemplateLine = false) {
    const promptInput = document.getElementById(isTemplateLine ? 'tplAiPromptInput' : 'aiPromptInput');
    const promptText = promptInput?.value.trim() || '';
    if (!promptText) {
      Utils.showToast('Please enter a description of how you want this item calculated.', 'warning');
      return;
    }
    this.fillAiPromptAndDraft(promptText, isTemplateLine);
  },

  fillAiPromptAndDraft(promptText, isTemplateLine = false) {
    const promptInput = document.getElementById(isTemplateLine ? 'tplAiPromptInput' : 'aiPromptInput');
    if (promptInput) promptInput.value = promptText;

    const result = Utils.FormulaAI.draftFormula(promptText);

    const exprInput = document.getElementById(isTemplateLine ? 'tplFormulaExpression' : 'customFormulaExpression');
    const multInput = document.getElementById(isTemplateLine ? 'tplLineMultiplier' : 'customFieldMultiplier');
    const formulaSelect = document.getElementById(isTemplateLine ? 'tplLineFormula' : 'customFieldFormula');
    const expBox = document.getElementById(isTemplateLine ? 'tplAiDraftExplanation' : 'aiDraftExplanation');

    if (exprInput) exprInput.value = result.expression;
    if (multInput) multInput.value = result.multiplier;
    if (formulaSelect && formulaSelect.querySelector(`option[value="${result.formulaType}"]`)) {
      formulaSelect.value = result.formulaType;
    } else if (formulaSelect) {
      formulaSelect.value = 'custom_expression';
    }

    if (expBox) {
      expBox.style.display = 'block';
      expBox.innerHTML = `
        <div style="color: #a855f7; font-weight: 700; margin-bottom: 2px;">✨ AI Drafted Formula:</div>
        <div style="color: var(--text-primary); font-weight: 600;"><code>${result.expression}</code></div>
        <div class="text-secondary" style="margin-top: 3px;">${result.explanation}</div>
        <div class="text-tertiary font-mono" style="margin-top: 3px; font-size: 10px;">Detected variables: ${result.variablesUsed.map(v => `<b>${v}</b>`).join(', ')} &bull; Multiplier: <b>${result.multiplier}</b></div>
      `;
    }

    this.onFormulaExpressionInput(isTemplateLine);
    Utils.showToast('✨ AI successfully drafted calculation formula!', 'success');
  },

  // Token insertion at cursor
  insertFormulaToken(inputId, token, isTemplateLine = false) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const startPos = input.selectionStart || input.value.length;
    const endPos = input.selectionEnd || input.value.length;
    const textBefore = input.value.substring(0, startPos);
    const textAfter = input.value.substring(endPos, input.value.length);

    input.value = (textBefore + (textBefore.endsWith(' ') || token.startsWith(' ') ? '' : ' ') + token + (textAfter.startsWith(' ') ? '' : ' ') + textAfter).replace(/\s+/g, ' ').trim();
    input.focus();
    input.selectionStart = input.selectionEnd = startPos + token.length + 1;

    this.onFormulaExpressionInput(isTemplateLine);
  },

  onFormulaPresetSelected(presetValue, isTemplateLine = false) {
    const exprInput = document.getElementById(isTemplateLine ? 'tplFormulaExpression' : 'customFormulaExpression');
    if (!exprInput) return;

    const presetMap = {
      'events_days_trainers': 'events * days * trainers * rate * multiplier',
      'events_trainers': 'events * trainers * rate * multiplier',
      'facilities_rate': 'facilities * rate * multiplier',
      'facilities_multiplier': 'facilities * multiplier * rate',
      'events_rate': 'events * rate * multiplier',
      'events_days_hall': 'events * days * rate * multiplier',
      'events_days_participants': 'events * days * trainees * rate * multiplier',
      'events_days_honorarium': 'events * days * multiplier * rate',
      'participants_rate': 'trainees * rate * multiplier',
      'facilities_pc_cab': 'facilities * rate * multiplier',
      'facilities_pc_food': 'facilities * rate * multiplier',
      'fixed_amount': 'multiplier * rate'
    };

    if (presetMap[presetValue]) {
      exprInput.value = presetMap[presetValue];
    }
    this.onFormulaExpressionInput(isTemplateLine);
  },

  onFormulaExpressionInput(isTemplateLine = false) {
    const exprInput = document.getElementById(isTemplateLine ? 'tplFormulaExpression' : 'customFormulaExpression');
    const badge = document.getElementById(isTemplateLine ? 'tplFormulaSyntaxBadge' : 'formulaSyntaxBadge');
    if (!exprInput) return;

    const validation = Utils.FormulaEvaluator.validate(exprInput.value);
    if (badge) {
      if (validation.valid) {
        badge.className = 'badge badge-emerald';
        badge.textContent = '✅ Valid Syntax';
      } else {
        badge.className = 'badge badge-danger';
        badge.textContent = `❌ ${validation.error}`;
      }
    }

    this.updateFormulaSimulationPreview(isTemplateLine);
  },

  // Interactive Live Formula Simulator in Modal
  updateFormulaSimulationPreview(isTemplateLine = false) {
    const multInput = document.getElementById(isTemplateLine ? 'tplLineMultiplier' : 'customFieldMultiplier');
    const exprInput = document.getElementById(isTemplateLine ? 'tplFormulaExpression' : 'customFormulaExpression');
    const output = document.getElementById(isTemplateLine ? 'tplFormulaSimulationOutput' : 'formulaSimulationOutput');
    if (!output) return;

    const rate = 1000; // Sample benchmark rate for formula preview simulation
    const multiplier = Utils.parseNumber(multInput?.value) || 1;
    const expression = exprInput?.value.trim() || 'events * days * trainers * rate * multiplier';

    const sample = {
      events: 1,
      days: 2,
      trainers: 2,
      teamSize: 2,
      facilities: 10,
      trainees: 25,
      participants: 25,
      rate: rate,
      unitRate: rate,
      multiplier: multiplier
    };

    try {
      const simulatedTotal = Utils.FormulaEvaluator.evaluate(expression, sample);
      output.innerHTML = `
        <div style="color: var(--accent-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>🧮 <strong>Math Preview (Sample Rate = 1,000):</strong> ${Utils.formatNumber(simulatedTotal)}</span>
          <span class="text-tertiary" style="font-size: 10.5px;">(Actual rate is set per country in Tab 1)</span>
        </div>
      `;
    } catch (err) {
      output.innerHTML = `
        <div style="color: var(--danger); font-size: 11.5px;">⚠️ Error evaluating formula: ${err.message}</div>
      `;
    }
  },

  async resetStandardBenchmarkField(fieldKey) {
    if (!confirm('Are you sure you want to restore this standard benchmark field to factory seed defaults?')) return;
    await db.resetStandardBenchmarkField(fieldKey);
    Utils.showToast(`↺ Restored standard field "${fieldKey}" to factory defaults.`, 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async deleteCustomRateField(fieldId) {
    if (!confirm('Are you sure you want to delete this custom rate field? It will also be unlinked from any activity templates.')) return;
    await db.deleteImpCustomRateField(fieldId);
    Utils.showToast('🗑️ Deleted custom rate field.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ─── Manage Categories Master Modal ───
  async showManageCategoriesModal() {
    const categories = await db.getAllImpRateCategories();
    const standardFields = await db.getAllImpStandardBenchmarkFields();
    const customFields = await db.getAllImpCustomRateFields();
    const allFields = [...standardFields, ...customFields];

    const content = `
      <div style="font-size: 13px;">
        <div class="card p-sm mb-md flex justify-between items-center" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
          <div>
            <div class="font-bold text-primary" style="font-size: 12.5px;">Benchmark Field Categories Master</div>
            <div class="text-tertiary" style="font-size: 11px;">Configure categories for grouping benchmark fields in Tab 2 and line item reports.</div>
          </div>
          <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCategoryFormModal(null, false)">
            ➕ + Add Category
          </button>
        </div>

        <div class="table-container mb-none">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Icon</th>
                <th style="min-width: 180px;">Category Name</th>
                <th style="min-width: 130px;">Key / Code</th>
                <th style="min-width: 120px;">Badge Style</th>
                <th style="width: 100px; text-align: center;">Fields Count</th>
                <th style="width: 130px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(cat => {
                const count = allFields.filter(f => (f.category === cat.code || f.category === cat.id)).length;
                return `
                  <tr>
                    <td style="text-align: center; font-size: 1.25rem;">${cat.icon || '🏷️'}</td>
                    <td class="font-bold text-primary">
                      ${cat.name}
                      ${cat.isBuiltIn ? `<span class="badge badge-cyan" style="font-size: 9px; padding: 1px 4px; margin-left: 4px;">Built-in</span>` : `<span class="badge badge-purple" style="font-size: 9px; padding: 1px 4px; margin-left: 4px;">Custom</span>`}
                    </td>
                    <td><code style="font-size: 11px;">${cat.code || cat.id}</code></td>
                    <td>
                      <span class="badge ${cat.colorClass || 'badge-secondary'}" style="font-size: 10.5px;">
                        ${cat.icon || ''} Preview
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-outline font-bold" style="font-size: 11px;">${count} fields</span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                      <button class="btn btn-ghost btn-sm font-bold" onclick="ConfigModule.showCategoryFormModal('${cat.id || cat.code}', false)" title="Edit category name, icon or badge style">
                        ✏️ Edit
                      </button>
                      ${!cat.isBuiltIn ? `
                        <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteCategory('${cat.id || cat.code}')" title="Delete custom category">
                          🗑️
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    Utils.showModal(`📁 Manage Benchmark Field Categories (${categories.length})`, content, {
      modalWidth: '780px',
      size: 'md',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-secondary',
          textContent: '↺ Reset to Defaults',
          onClick: async () => {
            if (!confirm('Reset all categories back to system defaults? Custom categories will be removed.')) return;
            await db.resetImpRateCategories();
            Utils.showToast('✅ Reset categories to defaults!', 'success');
            close();
            ConfigModule.showManageCategoriesModal();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: 'Done',
          onClick: close
        }));
      }
    });
  },

  // ─── Add / Edit Category Modal ───
  async showCategoryFormModal(categoryId = null, fromFieldModal = false) {
    const categories = await db.getAllImpRateCategories();
    const existing = categoryId ? categories.find(c => (c.id === categoryId || c.code === categoryId)) : null;
    const isEdit = !!existing;

    const colorOptions = [
      { class: 'badge-indigo', name: 'Indigo / Navy' },
      { class: 'badge-cyan', name: 'Cyan / Teal' },
      { class: 'badge-emerald', name: 'Emerald / Green' },
      { class: 'badge-purple', name: 'Purple / Violet' },
      { class: 'badge-amber', name: 'Amber / Orange' },
      { class: 'badge-rose', name: 'Rose / Red' },
      { class: 'badge-secondary', name: 'Slate / Gray' }
    ];

    const content = `
      <form id="categoryForm" style="font-size: 13px;">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Category Display Name <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="catName" value="${existing?.name || ''}" placeholder="e.g. Translation & Localization, Digital & Technology" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Category Key / Code <span class="text-danger">*</span></label>
            <input type="text" class="form-input font-mono" id="catCode" value="${existing?.code || existing?.id || ''}" placeholder="e.g. translation, digital" ${isEdit ? 'readonly' : ''} required>
            <div class="form-hint">${isEdit ? 'Key is locked to preserve mappings' : 'Unique identifier (lowercase)'}</div>
          </div>
          <div class="form-group mb-none">
            <label class="form-label font-bold">Emoji Icon</label>
            <input type="text" class="form-input" id="catIcon" value="${existing?.icon || '🏷️'}" placeholder="e.g. 🌐, 💻, 🩺, 🚕" style="font-size: 1.1rem;">
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Badge Color Theme</label>
          <select class="form-select font-bold" id="catColorClass">
            ${colorOptions.map(opt => `
              <option value="${opt.class}" ${(existing?.colorClass === opt.class) ? 'selected' : ''}>
                ● ${opt.name}
              </option>
            `).join('')}
          </select>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? `✏️ Edit Category: ${existing.name}` : '➕ Add Benchmark Field Category', content, {
      modalWidth: '520px',
      size: 'sm',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-ghost', textContent: 'Cancel', onClick: close
        }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Save Category',
          onClick: async () => {
            const name = Utils.$('#catName')?.value.trim();
            const code = Utils.$('#catCode')?.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const icon = Utils.$('#catIcon')?.value.trim() || '🏷️';
            const colorClass = Utils.$('#catColorClass')?.value || 'badge-secondary';

            if (!name || !code) {
              Utils.showToast('Please enter both Category Name and Key.', 'warning');
              return;
            }

            const categoryData = {
              id: code,
              code: code,
              name: name,
              icon: icon,
              colorClass: colorClass,
              isBuiltIn: existing ? !!existing.isBuiltIn : false
            };

            await db.saveImpRateCategory(categoryData);
            Utils.showToast(`✅ Saved category "${name}"!`, 'success');
            close();

            if (fromFieldModal) {
              const catSelect = document.getElementById('customFieldCategory');
              if (catSelect) {
                const allCats = await db.getAllImpRateCategories();
                catSelect.innerHTML = allCats.map(c => `
                  <option value="${c.code || c.id}" ${(c.code === code || c.id === code) ? 'selected' : ''}>
                    ${c.icon || '🏷️'} ${c.name}
                  </option>
                `).join('');
                catSelect.value = code;
              }
            } else {
              ConfigModule.showManageCategoriesModal();
            }

            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  async deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this custom category? Fields assigned to it will fallback to General.')) return;
    await db.deleteImpRateCategory(id);
    Utils.showToast('🗑️ Category deleted.', 'info');
    ConfigModule.showManageCategoriesModal();
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: Activity Templates & Line Items Builder (Activities 10.1 to 10.8)
  // Country-Specific Multi-Template Architecture
  // ═══════════════════════════════════════════════════════════════════════════
  selectedCountryFilter: '*',
  selectedTemplateCode: '10.1',
  selectedTemplateId: null,

  async renderImpActivityTemplatesTab(container, allTemplates, standardFields, customFields) {
    const countryFilter = this.selectedCountryFilter || '*';
    const activeCode = this.selectedTemplateCode || '10.1';

    // Filter templates for the chosen activity code (and matching country or global '*')
    const allForCode = (allTemplates || []).filter(t => t.code === activeCode || t.componentId === activeCode || (t.activityName && t.activityName.startsWith(activeCode)));
    
    // If country is filtered, prioritize templates matching this country
    let matchingTemplates = allForCode;
    if (countryFilter !== '*' && countryFilter !== 'all') {
      const filtered = allForCode.filter(t => (t.countryCode || '*').toUpperCase() === countryFilter.toUpperCase() || t.countryCode === '*');
      if (filtered.length > 0) matchingTemplates = filtered;
    }

    // Determine currently active template
    let selectedTemplate = null;
    if (this.selectedTemplateId) {
      selectedTemplate = allTemplates.find(t => t.id === this.selectedTemplateId);
    }
    if (!selectedTemplate && matchingTemplates.length > 0) {
      // Pick country-specific default first, then any default, then first matching
      selectedTemplate = matchingTemplates.find(t => (t.countryCode || '*').toUpperCase() === countryFilter.toUpperCase() && t.isDefault) ||
                         matchingTemplates.find(t => t.isDefault) ||
                         matchingTemplates[0];
    }
    if (!selectedTemplate) {
      selectedTemplate = allForCode[0] || (typeof SEED_DATA !== 'undefined' ? SEED_DATA.defaultImpActivityTemplates[0] : {});
    }

    this.selectedTemplateId = selectedTemplate.id;
    this.selectedTemplateCode = selectedTemplate.code || activeCode;

    const allFieldDefs = [...(standardFields || []), ...(customFields || [])];

    const countryOptions = [
      { code: '*', label: '🌍 All Countries / Global Default', flag: '🌍' },
      { code: 'IN', label: '🇮🇳 India', flag: '🇮🇳' },
      { code: 'BD', label: '🇧🇩 Bangladesh', flag: '🇧🇩' },
      { code: 'INDO', label: '🇮🇩 Indonesia', flag: '🇮🇩' },
      { code: 'NP', label: '🇳🇵 Nepal', flag: '🇳🇵' },
      { code: 'US', label: '🇺🇸 United States', flag: '🇺🇸' }
    ];

    const currentCountryObj = countryOptions.find(c => c.code === countryFilter) || countryOptions[0];

    container.innerHTML = `
      <!-- Top Country & Activity Selector Card -->
      <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
        <div class="flex justify-between items-center mb-sm" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="text-tertiary font-bold" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
              🌍 1. Filter by Country Scope:
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
              ${countryOptions.map(c => `
                <button type="button" class="btn btn-sm ${countryFilter === c.code ? 'btn-primary font-bold' : 'btn-secondary'}" onclick="ConfigModule.selectCountryForActivityTemplates('${c.code}')" style="font-size: 12px; padding: 4px 10px;">
                  <span>${c.flag}</span> ${c.label.replace(/^[^\s]+\s*/, '')}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <button type="button" class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCreateTemplateModal()">
              ➕ + New Activity Template
            </button>
          </div>
        </div>

        <!-- Activity Switcher Buttons (10.1 to 10.8) -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 8px;">
          <div class="text-tertiary font-bold mb-xs" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
            🎯 2. Select Activity Code (10.1 to 10.8):
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7', '10.8'].map(code => {
              const count = (allTemplates || []).filter(t => t.code === code).length;
              const sample = (allTemplates || []).find(t => t.code === code) || {};
              const isSelected = code === this.selectedTemplateCode;
              return `
                <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary font-bold' : 'btn-secondary'}" onclick="ConfigModule.selectActivityTemplateCode('${code}')" style="font-size: 12px; padding: 6px 12px;">
                  <span>${sample.icon || '🎯'}</span> <strong>${code}</strong> <span class="badge ${isSelected ? 'badge-primary' : 'badge-secondary'}" style="font-size: 10px; margin-left: 4px; padding: 1px 5px;">${count}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Template Variants Switcher for Selected Activity & Country -->
      <div class="card p-md mb-md" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05)); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md);">
        <div class="flex justify-between items-center mb-sm" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="flex items-center gap-sm">
              <span class="font-bold text-primary" style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
                📑 Available Template Variants for Activity ${this.selectedTemplateCode} (${matchingTemplates.length} Available):
              </span>
              <span class="badge badge-indigo font-bold" style="font-size: 11px;">Scope: ${currentCountryObj.flag} ${currentCountryObj.label}</span>
            </div>
            <div class="text-secondary mt-xs" style="font-size: 12px;">
              Employees will be able to choose from these configured templates when budgeting this activity in the IMP ToT Program Matrix.
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <button type="button" class="btn btn-secondary btn-sm font-bold" onclick="ConfigModule.showCloneTemplateModal('${selectedTemplate.id}')" title="Clone this template to create a new variant">
              📋 Clone Template
            </button>
            ${!selectedTemplate.isDefault ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold text-warning" onclick="ConfigModule.setDefaultTemplate('${selectedTemplate.id}', '${selectedTemplate.countryCode || '*'}', '${selectedTemplate.code}')" title="Make this template the default for this activity and country">
                ⭐ Set as Default
              </button>
            ` : `
              <span class="badge badge-emerald font-bold" style="font-size: 11.5px; padding: 4px 10px;">⭐ Default Template</span>
            `}
            <button type="button" class="btn btn-ghost btn-sm font-bold" onclick="ConfigModule.showEditTemplateModal('${selectedTemplate.id}')" title="Edit Template Name, Scope, and Details">
              ✏️ Edit Template Info
            </button>
            ${selectedTemplate.id?.startsWith('tpl-custom-') || !selectedTemplate.id?.startsWith('tpl-global-') ? `
              <button type="button" class="btn btn-danger btn-sm font-bold" onclick="ConfigModule.deleteTemplate('${selectedTemplate.id}')" title="Delete custom template">
                🗑️ Delete
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Template Variant Pills / Selector Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
          ${matchingTemplates.map(t => {
            const isAct = t.id === selectedTemplate.id;
            const flag = t.countryCode === 'IN' ? '🇮🇳' : (t.countryCode === 'BD' ? '🇧🇩' : (t.countryCode === 'INDO' ? '🇮🇩' : (t.countryCode === 'NP' ? '🇳🇵' : (t.countryCode === 'US' ? '🇺🇸' : '🌍'))));
            const cName = t.country || (t.countryCode === '*' ? 'All Countries' : t.countryCode);
            return `
              <div class="card p-sm" onclick="ConfigModule.selectSpecificTemplate('${t.id}')" style="cursor: pointer; border: 2px solid ${isAct ? 'var(--accent-primary)' : 'var(--border-default)'}; background: ${isAct ? 'var(--bg-primary)' : 'var(--bg-secondary)'}; border-radius: 8px; transition: all 0.15s ease;">
                <div class="flex justify-between items-center mb-xs">
                  <div class="flex items-center gap-xs">
                    <span style="font-size: 1.1rem;">${t.icon || '🎯'}</span>
                    <strong style="color: ${isAct ? 'var(--accent-primary)' : 'var(--text-primary)'}; font-size: 12.5px;">${t.templateName || t.title}</strong>
                  </div>
                  ${t.isDefault ? '<span class="badge badge-emerald" style="font-size: 9.5px;">⭐ Default</span>' : ''}
                </div>
                <div class="flex items-center justify-between text-secondary" style="font-size: 11px;">
                  <span>${flag} <strong>${cName}</strong></span>
                  <span>${t.scaleDefaults?.daysCount || 2} Days &bull; ${t.scaleDefaults?.participantsCount || 25} Pax</span>
                  <span class="badge ${isAct ? 'badge-primary' : 'badge-secondary'}" style="font-size: 10px;">${t.lineItems?.length || 0} Lines</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Active Template Configuration Box -->
      <div class="card mb-lg" style="border-left: 4px solid var(--accent-primary);">
        <div class="card-header flex justify-between items-center" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="flex items-center gap-sm">
              <span class="badge ${selectedTemplate.badgeClass || 'badge-indigo'} font-bold" style="font-size: 12px;">
                ACTIVITY ${selectedTemplate.code}
              </span>
              <h3 style="margin: 0; color: var(--text-primary); font-size: 1.25rem;">
                ${selectedTemplate.icon || '🎯'} ${selectedTemplate.templateName || selectedTemplate.title}
              </h3>
              ${selectedTemplate.isDefault ? '<span class="badge badge-emerald font-bold" style="font-size: 10px;">⭐ Default</span>' : ''}
            </div>
            <div class="text-secondary mt-xs" style="font-size: 12px;">
              Country Scope: <strong>${selectedTemplate.country || 'All Countries'} (${selectedTemplate.countryCode || '*'})</strong> &bull; Linked 5D Activity: <code style="font-weight: bold;">${selectedTemplate.activityName}</code> &bull; ${selectedTemplate.lineItems?.length || 0} Cost Line Items
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <button class="btn btn-ghost btn-sm text-danger font-bold" onclick="ConfigModule.resetActivityTemplate('${selectedTemplate.id}')" title="Reset this template to factory default seed settings">
              ↺ Reset to Seed Defaults
            </button>
            <button class="btn btn-secondary btn-sm font-bold" onclick="ConfigModule.showTemplateLineItemModal()">
              ➕ + Add Line Item
            </button>
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.saveCurrentActivityTemplate()">
              💾 Save Template
            </button>
          </div>
        </div>

        <!-- Scale Defaults Configuration Sub-Box -->
        <div class="card p-md mb-md" style="background: var(--bg-primary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="font-bold mb-xs" style="font-size: 11.5px; text-transform: uppercase; color: var(--accent-secondary); letter-spacing: 0.05em;">
            ⚙️ Default Operational Scale Parameters (Pre-filled for Submitters)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Default Events / Batches</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="tplScaleEvents" value="${selectedTemplate.scaleDefaults?.eventCount || 1}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Default Days / Event</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="tplScaleDays" value="${selectedTemplate.scaleDefaults?.daysCount || 2}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Default Facilities</label>
              <input type="number" min="0" step="1" class="form-input font-bold" id="tplScaleFacilities" value="${selectedTemplate.scaleDefaults?.facilitiesCount || 10}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Default Trainees</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="tplScaleParticipants" value="${selectedTemplate.scaleDefaults?.participantsCount || 25}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Default Team Size</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="tplScaleTeamSize" value="${selectedTemplate.scaleDefaults?.teamSize || 2}">
            </div>
          </div>
        </div>

        <!-- Linked Cost Line Items Table -->
        <div class="table-container mb-none">
          <div class="flex justify-between items-center mb-xs">
            <span class="font-bold text-secondary" style="font-size: 11.5px; text-transform: uppercase;">
              📋 Linked Cost Line Items &amp; Benchmark Calculation Rules (${selectedTemplate.lineItems?.length || 0})
            </span>
            <span class="text-tertiary" style="font-size: 11px;">All items are selected by default for employees submitting training events</span>
          </div>

          <table class="data-table" id="templateLineItemsTable" style="font-size: 12px;">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="min-width: 240px;">Cost Line Item Description</th>
                <th style="min-width: 140px;">GL Account Binding</th>
                <th style="min-width: 180px;">Linked Rate Field</th>
                <th style="min-width: 240px;">Calculation Formula / Driver Basis</th>
                <th class="num" style="width: 80px;">Multiplier</th>
                <th style="width: 80px; text-align: center;">Default</th>
                <th style="width: 110px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="templateLineItemsBody">
              ${(selectedTemplate.lineItems || []).map((item, idx) => {
                const matchedField = allFieldDefs.find(f => f.key === item.rateField || f.fieldKey === item.rateField);
                const formulaDesc = item.formulaExpression || this.formulaTypeMap[item.formulaType] || item.formulaType || 'Standard Formula';

                return `
                  <tr data-line-id="${item.id}" data-line-idx="${idx}">
                    <td style="text-align: center; color: var(--text-tertiary); font-weight: 700;">${idx + 1}</td>
                    <td style="font-weight: 600; color: var(--text-primary);">
                      ${item.description}
                    </td>
                    <td>
                      <code>${item.ledgerCode || '93201'}</code>
                      <div style="font-size: 10px; color: var(--text-secondary);">${item.parentAccount || ''}</div>
                    </td>
                    <td>
                      <span class="badge ${item.rateField?.startsWith('custom_') || customFields.some(c => c.fieldKey === item.rateField) ? 'badge-indigo' : 'badge-cyan'}" style="font-size: 10.5px;">
                        🔗 ${matchedField ? matchedField.label || matchedField.name : item.rateField}
                      </span>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 11px;">
                      <code>${formulaDesc}</code>
                    </td>
                    <td class="num font-bold font-mono">
                      ${item.multiplier || 1}
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-emerald" style="font-size: 10px;">✅ Checked</span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                      <button type="button" class="btn btn-ghost btn-sm" onclick="ConfigModule.showTemplateLineItemModal('${item.id}')" title="Edit line item">✏️</button>
                      <button type="button" class="btn btn-danger btn-sm" onclick="ConfigModule.deleteTemplateLineItem('${item.id}')" title="Remove line item">🗑️</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async selectCountryForActivityTemplates(countryCode) {
    this.selectedCountryFilter = countryCode;
    this.selectedTemplateId = null;
    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async selectActivityTemplateCode(code) {
    this.selectedTemplateCode = code;
    this.selectedTemplateId = null;
    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async selectSpecificTemplate(templateId) {
    this.selectedTemplateId = templateId;
    const tpl = await db.getImpActivityTemplateById(templateId);
    if (tpl) this.selectedTemplateCode = tpl.code;
    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async showCreateTemplateModal() {
    const allTemplates = await db.getAllImpActivityTemplates();
    const activeCode = this.selectedTemplateCode || '10.1';
    const activeCountry = this.selectedCountryFilter !== '*' ? this.selectedCountryFilter : 'IN';
    const sampleTpl = allTemplates.find(t => t.code === activeCode) || allTemplates[0];

    const content = `
      <form id="createTemplateForm" style="font-size: 13px;">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Activity Code <span class="text-danger">*</span></label>
          <select class="form-select font-bold" id="newTplCode">
            <option value="10.1" ${activeCode === '10.1' ? 'selected' : ''}>10.1 - Bundled ToT (Master Trainers)</option>
            <option value="10.2" ${activeCode === '10.2' ? 'selected' : ''}>10.2 - Non-Bundled ToT (Facility Staff)</option>
            <option value="10.3" ${activeCode === '10.3' ? 'selected' : ''}>10.3 - Refresher ToT</option>
            <option value="10.4" ${activeCode === '10.4' ? 'selected' : ''}>10.4 - Medical Officer Training</option>
            <option value="10.5" ${activeCode === '10.5' ? 'selected' : ''}>10.5 - District Level Training</option>
            <option value="10.6" ${activeCode === '10.6' ? 'selected' : ''}>10.6 - Facility Launch & Collaterals</option>
            <option value="10.7" ${activeCode === '10.7' ? 'selected' : ''}>10.7 - Supportive Supervision</option>
            <option value="10.8" ${activeCode === '10.8' ? 'selected' : ''}>10.8 - Partnership & Leadership Visits</option>
          </select>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Template Name / Variant Title <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="newTplName" placeholder="e.g. State Division ToT (3 Days, 25 Pax), District Hub Workshop" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Country Scope <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="newTplCountry">
              <option value="*" ${activeCountry === '*' ? 'selected' : ''}>🌍 All Countries (Global Default)</option>
              <option value="IN" ${activeCountry === 'IN' ? 'selected' : ''}>🇮🇳 India</option>
              <option value="BD" ${activeCountry === 'BD' ? 'selected' : ''}>🇧🇩 Bangladesh</option>
              <option value="INDO" ${activeCountry === 'INDO' ? 'selected' : ''}>🇮🇩 Indonesia</option>
              <option value="NP" ${activeCountry === 'NP' ? 'selected' : ''}>🇳🇵 Nepal</option>
              <option value="US" ${activeCountry === 'US' ? 'selected' : ''}>🇺🇸 United States</option>
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold">Clone Line Items from Existing</label>
            <select class="form-select font-bold" id="newTplCloneSource">
              <option value="none">✨ Blank (No Line Items)</option>
              ${allTemplates.map(t => `
                <option value="${t.id}" ${(t.code === activeCode && t.isDefault) ? 'selected' : ''}>
                  ${t.icon || '🎯'} ${t.code} - ${t.templateName || t.title} (${t.country || 'Global'})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="font-bold mb-xs" style="font-size: 11px; text-transform: uppercase; color: var(--accent-primary);">
            Operational Scale Defaults
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 10.5px;">Batches</label>
              <input type="number" min="1" class="form-input font-bold" id="newTplEvents" value="1">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 10.5px;">Days</label>
              <input type="number" min="1" class="form-input font-bold" id="newTplDays" value="${sampleTpl.scaleDefaults?.daysCount || 2}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 10.5px;">Facilities</label>
              <input type="number" min="0" class="form-input font-bold" id="newTplFacilities" value="${sampleTpl.scaleDefaults?.facilitiesCount || 10}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 10.5px;">Trainees</label>
              <input type="number" min="1" class="form-input font-bold" id="newTplParticipants" value="${sampleTpl.scaleDefaults?.participantsCount || 20}">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 10.5px;">Team Size</label>
              <input type="number" min="1" class="form-input font-bold" id="newTplTeamSize" value="${sampleTpl.scaleDefaults?.teamSize || 2}">
            </div>
          </div>
        </div>

        <div class="form-group mb-none">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="newTplIsDefault" style="width: 16px; height: 16px;">
            <span class="font-bold">Set as Default Template for this Activity and Country</span>
          </label>
        </div>
      </form>
    `;

    Utils.showModal('➕ Create New Activity Template Variant', content, {
      modalWidth: '650px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Create Template',
          onClick: async () => {
            const name = Utils.$('#newTplName')?.value.trim();
            if (!name) {
              Utils.showToast('Please enter a template name.', 'warning');
              return;
            }

            const code = Utils.$('#newTplCode')?.value || '10.1';
            const countryCode = Utils.$('#newTplCountry')?.value || '*';
            const cloneSourceId = Utils.$('#newTplCloneSource')?.value;
            const isDef = Utils.$('#newTplIsDefault')?.checked;

            const countryMap = {
              '*': 'All Countries',
              'IN': 'India',
              'BD': 'Bangladesh',
              'INDO': 'Indonesia',
              'NP': 'Nepal',
              'US': 'United States'
            };

            let lineItems = [];
            let icon = '🎯';
            let badgeClass = 'badge-indigo';
            let componentId = 'bundled-tot';

            if (cloneSourceId && cloneSourceId !== 'none') {
              const src = await db.getImpActivityTemplateById(cloneSourceId) || allTemplates.find(t => t.id === cloneSourceId);
              if (src) {
                lineItems = JSON.parse(JSON.stringify(src.lineItems || []));
                icon = src.icon || icon;
                badgeClass = src.badgeClass || badgeClass;
                componentId = src.componentId || componentId;
              }
            } else {
              const src = allTemplates.find(t => t.code === code);
              if (src) {
                icon = src.icon || icon;
                badgeClass = src.badgeClass || badgeClass;
                componentId = src.componentId || componentId;
              }
            }

            const templateId = `tpl-${countryCode.toLowerCase()}-${code}-${Date.now()}`;
            const newTpl = {
              id: templateId,
              code: code,
              countryCode: countryCode,
              country: countryMap[countryCode] || countryCode,
              templateName: name,
              title: name,
              isDefault: isDef,
              activityName: `${code}-${name}`,
              componentId: componentId,
              icon: icon,
              badgeClass: badgeClass,
              hasToolPackage: (code === '10.1' || code === '10.2'),
              scaleDefaults: {
                eventCount: parseInt(Utils.$('#newTplEvents')?.value, 10) || 1,
                daysCount: parseInt(Utils.$('#newTplDays')?.value, 10) || 2,
                facilitiesCount: parseInt(Utils.$('#newTplFacilities')?.value, 10) || 10,
                participantsCount: parseInt(Utils.$('#newTplParticipants')?.value, 10) || 20,
                teamSize: parseInt(Utils.$('#newTplTeamSize')?.value, 10) || 2,
                toolPackage: 'Tool Package - 1 (Standard)'
              },
              lineItems: lineItems
            };

            await db.saveImpActivityTemplate(newTpl);
            if (isDef) {
              await db.setDefaultImpActivityTemplate(templateId, countryCode, code);
            }

            Utils.showToast(`✅ Created template variant "${name}" for Activity ${code}!`, 'success');
            ConfigModule.selectedTemplateCode = code;
            ConfigModule.selectedTemplateId = templateId;
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  async showCloneTemplateModal(sourceTemplateId) {
    const allTemplates = await db.getAllImpActivityTemplates();
    const src = allTemplates.find(t => t.id === sourceTemplateId) || allTemplates[0];

    const content = `
      <form id="cloneTemplateForm" style="font-size: 13px;">
        <div class="card p-sm mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
          <div class="flex items-center gap-xs">
            <span style="font-size: 1.1rem;">📋</span>
            <div>
              <strong>Cloning:</strong> ${src.icon || '🎯'} Activity ${src.code} &bull; ${src.templateName || src.title}
              <div class="text-secondary" style="font-size: 11px;">Contains ${src.lineItems?.length || 0} configured cost line items</div>
            </div>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">New Template Name <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="cloneTplName" value="${src.templateName || src.title} (Custom Copy)" required>
        </div>

        <div class="form-group mb-md">
          <label class="form-label font-bold">Target Country Scope <span class="text-danger">*</span></label>
          <select class="form-select font-bold" id="cloneTplCountry">
            <option value="*" ${src.countryCode === '*' ? 'selected' : ''}>🌍 All Countries (Global)</option>
            <option value="IN" ${src.countryCode === 'IN' ? 'selected' : ''}>🇮🇳 India</option>
            <option value="BD" ${src.countryCode === 'BD' ? 'selected' : ''}>🇧🇩 Bangladesh</option>
            <option value="INDO" ${src.countryCode === 'INDO' ? 'selected' : ''}>🇮🇩 Indonesia</option>
            <option value="NP" ${src.countryCode === 'NP' ? 'selected' : ''}>🇳🇵 Nepal</option>
            <option value="US" ${src.countryCode === 'US' ? 'selected' : ''}>🇺🇸 United States</option>
          </select>
        </div>
      </form>
    `;

    Utils.showModal(`📋 Clone Activity ${src.code} Template`, content, {
      modalWidth: '550px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '📋 Duplicate Template',
          onClick: async () => {
            const name = Utils.$('#cloneTplName')?.value.trim();
            if (!name) {
              Utils.showToast('Please enter a template name.', 'warning');
              return;
            }

            const countryCode = Utils.$('#cloneTplCountry')?.value || '*';
            const countryMap = {
              '*': 'All Countries',
              'IN': 'India',
              'BD': 'Bangladesh',
              'INDO': 'Indonesia',
              'NP': 'Nepal',
              'US': 'United States'
            };

            const templateId = `tpl-${countryCode.toLowerCase()}-${src.code}-${Date.now()}`;
            const clonedTpl = {
              ...JSON.parse(JSON.stringify(src)),
              id: templateId,
              templateName: name,
              title: name,
              countryCode: countryCode,
              country: countryMap[countryCode] || countryCode,
              isDefault: false
            };

            await db.saveImpActivityTemplate(clonedTpl);
            Utils.showToast(`✅ Cloned template as "${name}"!`, 'success');
            ConfigModule.selectedTemplateId = templateId;
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  async showEditTemplateModal(templateId) {
    const allTemplates = await db.getAllImpActivityTemplates();
    const tpl = allTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    const content = `
      <form id="editTemplateForm" style="font-size: 13px;">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Template Name / Variant Title <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="editTplName" value="${tpl.templateName || tpl.title || ''}" required>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Country Scope <span class="text-danger">*</span></label>
          <select class="form-select font-bold" id="editTplCountry">
            <option value="*" ${tpl.countryCode === '*' ? 'selected' : ''}>🌍 All Countries (Global)</option>
            <option value="IN" ${tpl.countryCode === 'IN' ? 'selected' : ''}>🇮🇳 India</option>
            <option value="BD" ${tpl.countryCode === 'BD' ? 'selected' : ''}>🇧🇩 Bangladesh</option>
            <option value="INDO" ${tpl.countryCode === 'INDO' ? 'selected' : ''}>🇮🇩 Indonesia</option>
            <option value="NP" ${tpl.countryCode === 'NP' ? 'selected' : ''}>🇳🇵 Nepal</option>
            <option value="US" ${tpl.countryCode === 'US' ? 'selected' : ''}>🇺🇸 United States</option>
          </select>
        </div>

        <div class="form-group mb-none">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="editTplIsDefault" ${tpl.isDefault ? 'checked' : ''} style="width: 16px; height: 16px;">
            <span class="font-bold">Set as Default Template for this Activity and Country</span>
          </label>
        </div>
      </form>
    `;

    Utils.showModal(`✏️ Edit Activity ${tpl.code} Template Info`, content, {
      modalWidth: '550px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Save Info',
          onClick: async () => {
            const name = Utils.$('#editTplName')?.value.trim();
            if (!name) {
              Utils.showToast('Please enter a template name.', 'warning');
              return;
            }

            const countryCode = Utils.$('#editTplCountry')?.value || '*';
            const isDef = Utils.$('#editTplIsDefault')?.checked;

            const countryMap = {
              '*': 'All Countries',
              'IN': 'India',
              'BD': 'Bangladesh',
              'INDO': 'Indonesia',
              'NP': 'Nepal',
              'US': 'United States'
            };

            tpl.templateName = name;
            tpl.title = name;
            tpl.countryCode = countryCode;
            tpl.country = countryMap[countryCode] || countryCode;
            tpl.isDefault = isDef;

            await db.saveImpActivityTemplate(tpl);
            if (isDef) {
              await db.setDefaultImpActivityTemplate(tpl.id, countryCode, tpl.code);
            }

            Utils.showToast(`✅ Updated template info for "${name}"!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  async setDefaultTemplate(templateId, countryCode, activityCode) {
    await db.setDefaultImpActivityTemplate(templateId, countryCode, activityCode);
    Utils.showToast('⭐ Template set as default for this activity and country!', 'success');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this custom activity template?')) return;
    await db.deleteImpActivityTemplate(templateId);
    Utils.showToast('🗑️ Template deleted.', 'info');
    this.selectedTemplateId = null;
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async showTemplateLineItemModal(lineId = null) {
    const templates = await db.getAllImpActivityTemplates();
    const selectedTemplate = (this.selectedTemplateId ? templates.find(t => t.id === this.selectedTemplateId) : null) ||
                             templates.find(t => t.code === this.selectedTemplateCode) || templates[0];
    const standardFields = await db.getAllImpStandardBenchmarkFields();
    const customFields = await db.getAllImpCustomRateFields();
    const existing = selectedTemplate.lineItems?.find(l => l.id === lineId);

    const allRateFields = [
      ...standardFields.map(s => ({ key: s.fieldKey || s.key, label: s.name, defaultGl: s.defaultGlCode || s.defaultGl, defaultFormula: s.defaultFormula, defaultMultiplier: s.defaultMultiplier || 1, formulaExpression: s.formulaExpression, parent: s.parentAccount })),
      ...customFields.map(c => ({ key: c.fieldKey, label: '⭐ ' + c.name + ' (Custom)', defaultGl: c.defaultGlCode, defaultFormula: c.defaultFormula, defaultMultiplier: c.defaultMultiplier || 1, formulaExpression: c.formulaExpression, parent: c.parentAccount }))
    ];

    const initialExpression = existing?.formulaExpression || (
      existing?.formulaType === 'events_days_trainers' ? 'events * days * trainers * rate * multiplier' :
      (existing?.formulaType === 'events_trainers' ? 'events * trainers * rate * multiplier' :
      (existing?.formulaType === 'facilities_rate' ? 'facilities * rate * multiplier' :
      (existing?.formulaType === 'facilities_multiplier' ? 'facilities * multiplier * rate' :
      (existing?.formulaType === 'events_rate' ? 'events * rate * multiplier' :
      (existing?.formulaType === 'events_days_hall' ? 'events * days * rate * multiplier' :
      (existing?.formulaType === 'events_days_participants' ? 'events * days * trainees * rate * multiplier' :
      (existing?.formulaType === 'events_days_honorarium' ? 'events * days * multiplier * rate' :
      (existing?.formulaType === 'participants_rate' ? 'trainees * rate * multiplier' :
      (existing?.formulaType === 'facilities_pc_cab' ? 'facilities * rate * multiplier' :
      (existing?.formulaType === 'facilities_pc_food' ? 'facilities * rate * multiplier' : 'events * days * trainers * rate * multiplier'))))))))))
    );

    const content = `
      <form id="templateLineItemForm" style="font-size: 13px;">
        <div class="card p-sm mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
          <div class="flex items-center justify-between">
            <span class="badge badge-indigo font-bold">ACTIVITY ${selectedTemplate.code} &bull; ${selectedTemplate.templateName || selectedTemplate.title}</span>
            <span class="badge badge-purple font-bold" style="font-size: 10px;">✨ AI Formula Engine</span>
          </div>
        </div>

        <div class="form-group mb-sm">
          <label class="form-label font-bold">Line Item Description <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="tplLineDesc" value="${existing?.description || ''}" placeholder="e.g. 🏨 Hotel Accommodation (Double Occupancy), 🩺 Doctor Honorarium" required>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Linked Benchmark Rate Field <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="tplLineRateField" onchange="ConfigModule.onTemplateRateFieldSelected(this.value)">
              ${allRateFields.map(rf => `
                <option value="${rf.key}" ${existing?.rateField === rf.key ? 'selected' : ''}>
                  ${rf.label}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold">GL Account &amp; Category <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="tplLineGl">
              <option value="93101" ${existing?.ledgerCode === '93101' ? 'selected' : ''}>Hotel Accommodation (Travel &amp; Lodging Expenses)</option>
              <option value="93104" ${existing?.ledgerCode === '93104' ? 'selected' : ''}>Cab/Auto (Travel &amp; Lodging Expenses)</option>
              <option value="93102" ${existing?.ledgerCode === '93102' ? 'selected' : ''}>Food Expenses (Travel &amp; Lodging Expenses)</option>
              <option value="93105" ${existing?.ledgerCode === '93105' ? 'selected' : ''}>Bus/Train (Travel &amp; Lodging Expenses)</option>
              <option value="93103" ${existing?.ledgerCode === '93103' ? 'selected' : ''}>Air fare (Travel &amp; Lodging Expenses)</option>
              <option value="93106" ${existing?.ledgerCode === '93106' ? 'selected' : ''}>Other incidental travel costs (Travel &amp; Lodging Expenses)</option>
              <option value="93204" ${existing?.ledgerCode === '93204' ? 'selected' : ''}>Printing expenses (Supplies &amp; Printing Costs)</option>
              <option value="93201" ${existing?.ledgerCode === '93201' ? 'selected' : ''}>Other Direct Expenses (Supplies &amp; Printing Costs)</option>
              <option value="93701" ${existing?.ledgerCode === '93701' ? 'selected' : ''}>Professional Charges (Professional &amp; Consultancy Charges)</option>
              <option value="93302" ${existing?.ledgerCode === '93302' ? 'selected' : ''}>Postage &amp; Courier Expenses (Communication Cost)</option>
              <option value="93301" ${existing?.ledgerCode === '93301' ? 'selected' : ''}>Internet Expenses (Communication Cost)</option>
              <option value="93401" ${existing?.ledgerCode === '93401' ? 'selected' : ''}>Software and Subscriptions (Office Expenses)</option>
              <option value="93404" ${existing?.ledgerCode === '93404' ? 'selected' : ''}>Stationery &amp; Consumables (Office Expenses)</option>
              <option value="93405" ${existing?.ledgerCode === '93405' ? 'selected' : ''}>Office Equipment Expense (Office Expenses)</option>
            </select>
          </div>
        </div>

        <!-- ✨ AI Formula Drafter Box inside Line Item Modal -->
        <div class="card p-md mb-md" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: var(--radius-md);">
          <div class="flex justify-between items-center mb-xs">
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.15rem;">✨</span>
              <strong style="color: #a855f7; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em;">
                AI Formula Drafter (5 Operating Variables)
              </strong>
            </div>
            <span class="text-tertiary" style="font-size: 10.5px;">Natural language → Formula</span>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-input" id="tplAiPromptInput" placeholder="Describe logic e.g. 'Lunch for all trainees across days', '2 Doctors per day'..." style="font-size: 12px; background: var(--bg-primary);">
            <button type="button" class="btn btn-primary font-bold" onclick="ConfigModule.triggerAiFormulaDraft(true)" style="white-space: nowrap; font-size: 11.5px; background: linear-gradient(135deg, #6366f1, #a855f7);">
              ✨ AI Draft
            </button>
          </div>

          <!-- Quick AI Suggestions -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span class="text-tertiary font-bold" style="font-size: 10px; text-transform: uppercase;">Quick Prompts:</span>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('2 guest doctors per day for each training batch', true)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🩺 2 Doctors / Day</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Daily lunch and snacks catering for all trainees', true)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🍱 Trainee Meals / Day</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('3 thali sets per facility with standard multiplier', true)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">📦 3 Sets / Facility</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Transit tickets roundtrip for trainers team per batch', true)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🚆 Transit / Trainer</button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="ConfigModule.fillAiPromptAndDraft('Venue hall rental per training day', true)" style="font-size: 10.5px; padding: 2px 8px; border: 1px solid var(--border-subtle);">🏢 Hall / Day</button>
          </div>

          <div id="tplAiDraftExplanation" style="display: none; margin-top: 8px; padding: 8px; background: var(--bg-card); border-radius: 6px; font-size: 11px; border-left: 3px solid #a855f7;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Editable Formula Expression Bar -->
        <div class="card p-md mb-none" style="background: var(--bg-primary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex justify-between items-center mb-xs">
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.1rem;">🧮</span>
              <strong style="color: var(--accent-primary); font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em;">
                Calculation Formula Expression
              </strong>
            </div>
            <span id="tplFormulaSyntaxBadge" class="badge badge-emerald" style="font-size: 10px;">✅ Valid Syntax</span>
          </div>

          <div class="form-group mb-xs">
            <input type="text" class="form-input font-mono font-bold" id="tplFormulaExpression" value="${initialExpression}" placeholder="e.g. events * days * trainers * rate * multiplier" oninput="ConfigModule.onFormulaExpressionInput(true)" style="font-size: 13px; color: var(--accent-primary); background: var(--bg-secondary);">
          </div>

          <!-- Variable Chips for Template Line -->
          <div class="mb-sm" style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
            <span class="text-tertiary font-bold" style="font-size: 10px; text-transform: uppercase;">Insert:</span>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'events', true)" style="font-size: 10.5px; color: #a855f7;">+ events</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'days', true)" style="font-size: 10.5px; color: #3b82f6;">+ days</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'trainers', true)" style="font-size: 10.5px; color: #10b981;">+ trainers</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'trainees', true)" style="font-size: 10.5px; color: #f59e0b;">+ trainees</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'facilities', true)" style="font-size: 10.5px; color: #ec4899;">+ facilities</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'rate', true)" style="font-size: 10.5px; color: var(--accent-primary);">+ rate</button>
            <button type="button" class="btn btn-xs btn-secondary font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', 'multiplier', true)" style="font-size: 10.5px;">+ multiplier</button>
            <span style="border-left: 1px solid var(--border-subtle); height: 16px; margin: 0 2px;"></span>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', ' * ', true)">*</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', ' + ', true)">+</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', ' ( ', true)">(</button>
            <button type="button" class="btn btn-xs btn-ghost font-bold font-mono" onclick="ConfigModule.insertFormulaToken('tplFormulaExpression', ' ) ', true)">)</button>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Standard Driver Rule</label>
              <select class="form-select font-bold" id="tplLineFormula" onchange="ConfigModule.onFormulaPresetSelected(this.value, true)">
                <option value="events_days_trainers" ${existing?.formulaType === 'events_days_trainers' ? 'selected' : ''}>Events × Days × Trainers × Rate (Hotel / Cab / Food DA)</option>
                <option value="events_trainers" ${existing?.formulaType === 'events_trainers' ? 'selected' : ''}>Events × Trainers × Rate (Transit / Airfare)</option>
                <option value="facilities_rate" ${existing?.formulaType === 'facilities_rate' ? 'selected' : ''}>Facilities × Rate (Collateral Kits / Launch Pkg)</option>
                <option value="facilities_multiplier" ${existing?.formulaType === 'facilities_multiplier' ? 'selected' : ''}>Facilities × Multiplier × Rate (Dolls = 2, Thalis = 3)</option>
                <option value="events_rate" ${existing?.formulaType === 'events_rate' ? 'selected' : ''}>Events × Rate (Banners / Courier / Handouts)</option>
                <option value="events_days_hall" ${existing?.formulaType === 'events_days_hall' ? 'selected' : ''}>Events × Days × Hall Rate</option>
                <option value="events_days_participants" ${existing?.formulaType === 'events_days_participants' ? 'selected' : ''}>Events × Days × Trainees × Catering Rate</option>
                <option value="events_days_honorarium" ${existing?.formulaType === 'events_days_honorarium' ? 'selected' : ''}>Events × Days × Honorarium Rate</option>
                <option value="participants_rate" ${existing?.formulaType === 'participants_rate' ? 'selected' : ''}>Trainees × Rate (Certificates &amp; Kits)</option>
                <option value="facilities_pc_cab" ${existing?.formulaType === 'facilities_pc_cab' ? 'selected' : ''}>Facilities × PC Cab Rate</option>
                <option value="facilities_pc_food" ${existing?.formulaType === 'facilities_pc_food' ? 'selected' : ''}>Facilities × PC Food Rate</option>
                <option value="custom_expression" ${existing?.formulaType === 'custom_expression' ? 'selected' : ''}>Custom Math Expression (AI / User Defined)</option>
              </select>
            </div>

            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Multiplier / Quantity</label>
              <input type="number" step="any" class="form-input font-bold font-mono" id="tplLineMultiplier" value="${existing?.multiplier || 1}" oninput="ConfigModule.updateFormulaSimulationPreview(true)">
              <div class="form-hint">e.g. 2 for Dolls, 3 for Thalis, 1 for standard</div>
            </div>
          </div>

          <!-- Live Preview -->
          <div class="card p-sm mb-none" style="background: rgba(99, 102, 241, 0.05); border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 6px;">
            <div class="flex justify-between items-center mb-xs">
              <span class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">
                🔍 Live Formula Simulation Preview
              </span>
              <span class="badge badge-purple" style="font-size: 10px;">Scale: 1 Batch, ${selectedTemplate.scaleDefaults?.daysCount || 2} Days, ${selectedTemplate.scaleDefaults?.teamSize || 2} Trainers, ${selectedTemplate.scaleDefaults?.participantsCount || 25} Trainees</span>
            </div>
            <div id="tplFormulaSimulationOutput" class="font-bold font-mono" style="color: var(--accent-primary); font-size: 12.5px;">
              <!-- Computed live via JS -->
            </div>
          </div>
        </div>
      </form>
    `;

    Utils.showModal(existing ? `✏️ Edit Line Item for ${selectedTemplate.templateName || selectedTemplate.title}` : `➕ Add Line Item to ${selectedTemplate.templateName || selectedTemplate.title}`, content, {
      modalWidth: '700px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Save Line Item',
          onClick: async () => {
            const desc = Utils.$('#tplLineDesc').value.trim();
            if (!desc) {
              Utils.showToast('Please enter line item description.', 'warning');
              return;
            }

            const glCode = Utils.$('#tplLineGl').value;
            const rateField = Utils.$('#tplLineRateField').value;
            const formula = Utils.$('#tplLineFormula').value;
            const formulaExpr = Utils.$('#tplFormulaExpression').value.trim() || 'events * days * trainers * rate * multiplier';
            const multiplier = Utils.parseNumber(Utils.$('#tplLineMultiplier').value) || 1;

            const validation = Utils.FormulaEvaluator.validate(formulaExpr);
            if (!validation.valid) {
              Utils.showToast(`Formula syntax error: ${validation.error}`, 'danger');
              return;
            }

            const parentMap = {
              '93101': 'Travel & Lodging Expenses',
              '93102': 'Travel & Lodging Expenses',
              '93103': 'Travel & Lodging Expenses',
              '93104': 'Travel & Lodging Expenses',
              '93105': 'Travel & Lodging Expenses',
              '93106': 'Travel & Lodging Expenses',
              '93201': 'Supplies & Printing Costs',
              '93204': 'Supplies & Printing Costs',
              '93301': 'Communication Cost',
              '93302': 'Communication Cost',
              '93303': 'Communication Cost',
              '93401': 'Office Expenses',
              '93404': 'Office Expenses',
              '93405': 'Office Expenses',
              '93701': 'Professional & Consultancy Charges',
              '93703': 'Professional & Consultancy Charges'
            };

            const lineItemObj = {
              id: existing?.id || ('line_' + Date.now()),
              description: desc,
              ledgerCode: glCode,
              parentAccount: parentMap[glCode] || 'Direct Cost',
              rateField: rateField,
              formulaType: formula,
              formulaExpression: formulaExpr,
              multiplier: multiplier,
              defaultActive: true
            };

            const activeTpl = (selectedTemplate.id ? await db.getImpActivityTemplateById(selectedTemplate.id) : null) ||
                             await db.getImpActivityTemplate(ConfigModule.selectedTemplateCode);
            if (!activeTpl.lineItems) activeTpl.lineItems = [];

            if (existing) {
              const idx = activeTpl.lineItems.findIndex(l => l.id === existing.id);
              if (idx !== -1) activeTpl.lineItems[idx] = lineItemObj;
            } else {
              activeTpl.lineItems.push(lineItemObj);
            }

            await db.saveImpActivityTemplate(activeTpl);
            Utils.showToast(`✅ Saved line item "${desc}"!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });

    setTimeout(() => this.updateFormulaSimulationPreview(true), 50);
  },

  async onTemplateRateFieldSelected(fieldKey) {
    const standardFields = await db.getAllImpStandardBenchmarkFields();
    const customFields = await db.getAllImpCustomRateFields();
    const all = [...standardFields, ...customFields];
    const match = all.find(f => f.fieldKey === fieldKey || f.key === fieldKey || f.id === fieldKey);
    if (!match) return;

    const glSelect = document.getElementById('tplLineGl');
    const formulaSelect = document.getElementById('tplLineFormula');
    const multInput = document.getElementById('tplLineMultiplier');
    const exprInput = document.getElementById('tplFormulaExpression');

    if (glSelect && match.defaultGlCode) glSelect.value = match.defaultGlCode;
    if (formulaSelect && match.defaultFormula) formulaSelect.value = match.defaultFormula;
    if (multInput && match.defaultMultiplier) multInput.value = match.defaultMultiplier;
    if (exprInput && match.formulaExpression) exprInput.value = match.formulaExpression;
    else if (exprInput && match.defaultFormula) this.onFormulaPresetSelected(match.defaultFormula, true);
  },

  async deleteTemplateLineItem(lineId) {
    if (!confirm('Are you sure you want to remove this cost line item from the template?')) return;
    const activeTpl = (this.selectedTemplateId ? await db.getImpActivityTemplateById(this.selectedTemplateId) : null) ||
                      await db.getImpActivityTemplate(this.selectedTemplateCode);
    activeTpl.lineItems = (activeTpl.lineItems || []).filter(l => l.id !== lineId);
    await db.saveImpActivityTemplate(activeTpl);
    Utils.showToast('🗑️ Removed line item from template.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async saveCurrentActivityTemplate() {
    const activeTpl = (this.selectedTemplateId ? await db.getImpActivityTemplateById(this.selectedTemplateId) : null) ||
                      await db.getImpActivityTemplate(this.selectedTemplateCode);
    
    // Capture scale defaults from DOM
    activeTpl.scaleDefaults = {
      eventCount: parseInt(Utils.$('#tplScaleEvents')?.value, 10) || 1,
      daysCount: parseInt(Utils.$('#tplScaleDays')?.value, 10) || 2,
      facilitiesCount: parseInt(Utils.$('#tplScaleFacilities')?.value, 10) || 10,
      participantsCount: parseInt(Utils.$('#tplScaleParticipants')?.value, 10) || 25,
      teamSize: parseInt(Utils.$('#tplScaleTeamSize')?.value, 10) || 2,
      toolPackage: activeTpl.scaleDefaults?.toolPackage || 'Tool Package - 1 (Standard)'
    };

    await db.saveImpActivityTemplate(activeTpl);
    Utils.showToast(`💾 Master Template "${activeTpl.templateName || activeTpl.title}" saved successfully!`, 'success');
  },

  async resetActivityTemplate(templateIdOrCode) {
    if (!confirm(`Are you sure you want to reset this template to seed defaults?`)) return;
    await db.resetImpActivityTemplate(templateIdOrCode);
    Utils.showToast(`↺ Reset template to seed defaults.`, 'info');
    this.selectedTemplateId = null;
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4: Department Access Control for ToT Program Budget & Activity Templates
  // ═══════════════════════════════════════════════════════════════════════════
  impDeptScopeFilter: 'all',
  impDeptTotFilter: 'all',
  impDeptSearchQuery: '',

  async renderImpDeptAccessTab(container, allDepartments) {
    if (!allDepartments) {
      allDepartments = Utils.sortDepartments(await db.getAll(STORES.departments));
    }

    const totEnabledCount = allDepartments.filter(d => Boolean(d.hasTotAccess)).length;

    const q = (this.impDeptSearchQuery || '').toLowerCase().trim();
    const filtered = allDepartments.filter(d => {
      const isTot = Boolean(d.hasTotAccess);
      const matchTot = this.impDeptTotFilter === 'all' || (this.impDeptTotFilter === 'enabled' && isTot) || (this.impDeptTotFilter === 'disabled' && !isTot);
      const matchScope = this.impDeptScopeFilter === 'all' || d.scope === this.impDeptScopeFilter;
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.codeTemplate.toLowerCase().includes(q) || (d.number && d.number.includes(q)) || d.id.toLowerCase().includes(q);
      return matchTot && matchScope && matchSearch;
    });

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="card p-md mb-md" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08)); border: 1.5px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-md);">
        <div class="flex justify-between items-center mb-sm" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="flex items-center gap-xs">
              <span style="font-size: 1.3rem;">🏢</span>
              <strong style="font-size: 14px; color: var(--text-primary);">Department Access Control for ToT Program Budget &amp; Templates (10.1–10.8)</strong>
              <span class="badge badge-emerald font-bold" style="font-size: 11px;">${totEnabledCount} of ${allDepartments.length} Departments Enabled</span>
            </div>
            <div class="text-secondary mt-xs" style="font-size: 12px; line-height: 1.4;">
              Select which departments have permission to view the <strong>"🎯 ToT Program Budget (IMP)"</strong> tab under Other Costs to budget Training events, batches, and use Activity Templates (10.1 to 10.8). Toggle access with a single click below.
            </div>
          </div>
          <div class="flex items-center gap-xs" style="flex-wrap: wrap;">
            <button class="btn btn-sm btn-secondary font-bold text-success" onclick="ConfigModule.bulkToggleDeptTotAccess(true)" title="Enable ToT template access for all departments">
              ✅ Enable All
            </button>
            <button class="btn btn-sm btn-secondary font-bold text-danger" onclick="ConfigModule.bulkToggleDeptTotAccess(false)" title="Disable ToT template access for all departments">
              🚫 Disable All
            </button>
            <button class="btn btn-sm btn-ghost font-bold" onclick="ConfigModule.resetDeptTotAccessToDefaults()" title="Reset to default Training & Implementation departments">
              🔄 Reset Defaults
            </button>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card p-sm mb-md flex justify-between items-center" style="background: var(--bg-secondary); border: 1px solid var(--border-default); flex-wrap: wrap; gap: 10px;">
        <div class="flex items-center gap-sm" style="flex-wrap: wrap;">
          <input type="text" class="form-input" id="impDeptSearchInput" value="${this.impDeptSearchQuery || ''}" placeholder="🔍 Search department by name or code..." style="max-width: 280px; font-size: 12.5px;">
          
          <select class="form-select" id="impDeptScopeSelect" style="max-width: 200px; font-size: 12.5px;">
            <option value="all" ${this.impDeptScopeFilter === 'all' ? 'selected' : ''}>🌐 All Scopes</option>
            <option value="country" ${this.impDeptScopeFilter === 'country' ? 'selected' : ''}>🏢 Country Specific</option>
            <option value="gl" ${this.impDeptScopeFilter === 'gl' ? 'selected' : ''}>🌍 Global (GL)</option>
            <option value="dp-cp" ${this.impDeptScopeFilter === 'dp-cp' ? 'selected' : ''}>📱 Digital Product (Country)</option>
            <option value="dp-gp" ${this.impDeptScopeFilter === 'dp-gp' ? 'selected' : ''}>📱 Digital Product (Global)</option>
            <option value="general" ${this.impDeptScopeFilter === 'general' ? 'selected' : ''}>🏷️ General / Cross-Cutting</option>
          </select>

          <select class="form-select font-bold" id="impDeptTotSelect" style="max-width: 220px; font-size: 12.5px;">
            <option value="all" ${this.impDeptTotFilter === 'all' ? 'selected' : ''}>🎯 All ToT Access States</option>
            <option value="enabled" ${this.impDeptTotFilter === 'enabled' ? 'selected' : ''}>✅ ToT Enabled Only (${totEnabledCount})</option>
            <option value="disabled" ${this.impDeptTotFilter === 'disabled' ? 'selected' : ''}>🚫 ToT Disabled Only (${allDepartments.length - totEnabledCount})</option>
          </select>
        </div>
        <div class="text-tertiary" style="font-size: 12px;">
          Showing <strong>${filtered.length}</strong> of <strong>${allDepartments.length}</strong> departments
        </div>
      </div>

      <!-- Department Access Grid / Table -->
      <div class="card mb-lg">
        <div class="table-responsive">
          <table class="table" style="font-size: 12.5px;">
            <thead>
              <tr style="background: var(--bg-surface);">
                <th style="width: 40px; text-align: center;">#</th>
                <th style="width: 200px;">Code Template</th>
                <th>Department Name</th>
                <th style="width: 140px;">Scope</th>
                <th style="width: 180px; text-align: center;">ToT Budget Access</th>
                <th style="width: 130px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr><td colspan="6" class="text-center p-lg text-secondary">No departments found matching the filter criteria.</td></tr>
              ` : filtered.map((d, idx) => {
                const scopeBadges = {
                  'country': '<span class="badge badge-cyan">Country Specific</span>',
                  'gl': '<span class="badge badge-violet">Global</span>',
                  'dp-gp': '<span class="badge badge-amber">Digital Product (Global)</span>',
                  'dp-cp': '<span class="badge badge-emerald">Digital Product (Country)</span>',
                  'general': '<span class="badge">General</span>'
                };
                const isTotActive = Boolean(d.hasTotAccess);

                return `
                  <tr style="${isTotActive ? 'background: rgba(16, 185, 129, 0.03);' : ''}">
                    <td style="text-align: center; color: var(--text-tertiary);">${d.number || (idx + 1)}</td>
                    <td><code style="font-weight: 700; font-size: 11.5px;">${d.codeTemplate}</code></td>
                    <td>
                      <strong style="color: var(--text-primary);">${d.name}</strong>
                      <div class="text-tertiary" style="font-size: 11px;">ID: <code>${d.id}</code></div>
                    </td>
                    <td>${scopeBadges[d.scope] || `<span class="badge">${d.scope}</span>`}</td>
                    <td style="text-align: center;">
                      ${isTotActive ? `
                        <span class="badge badge-emerald font-bold" style="font-size: 11px; padding: 4px 10px;">🎯 ToT Enabled</span>
                      ` : `
                        <span class="badge badge-secondary" style="font-size: 11px; padding: 4px 10px; opacity: 0.7;">🚫 ToT Disabled</span>
                      `}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-sm ${isTotActive ? 'btn-secondary text-danger font-bold' : 'btn-primary font-bold'}" onclick="ConfigModule.toggleDeptTotAccess('${d.id}')" title="Click to ${isTotActive ? 'remove' : 'grant'} ToT budget template access">
                        ${isTotActive ? '🚫 Remove ToT' : '🎯 Enable ToT'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event listeners
    container.querySelector('#impDeptSearchInput')?.addEventListener('input', (e) => {
      this.impDeptSearchQuery = e.target.value;
      if (this._impDeptSearchTimer) clearTimeout(this._impDeptSearchTimer);
      this._impDeptSearchTimer = setTimeout(() => this.renderImpDeptAccessTab(container, allDepartments), 200);
    });

    container.querySelector('#impDeptScopeSelect')?.addEventListener('change', (e) => {
      this.impDeptScopeFilter = e.target.value;
      this.renderImpDeptAccessTab(container, allDepartments);
    });

    container.querySelector('#impDeptTotSelect')?.addEventListener('change', (e) => {
      this.impDeptTotFilter = e.target.value;
      this.renderImpDeptAccessTab(container, allDepartments);
    });
  },

    // ════════════════════════════════════════════════════════════
  // ─── 9. UNIFIED PERMISSIONS & ACCESS MATRIX GOVERNANCE ───
  // ════════════════════════════════════════════════════════════
  _permActiveTab: 'matrix', // 'matrix' | 'roles' | 'lifecycle'
  _permTargetType: 'role',  // 'role' | 'user'
  _permSelectedRoleId: 'role-dept-lead',
  _permSelectedUserId: 'user-lead-hcomm',
  _permSelectedParent: 'all',
  _permSearchTerm: '',

  async renderRoles(container) {
    const roles = await db.getRoles();
    const users = await db.getUsers();
    const coa = await db.getChartOfAccounts();

    if (!roles.some(r => r.id === this._permSelectedRoleId)) {
      this._permSelectedRoleId = roles[0]?.id || 'role-admin';
    }
    if (!users.some(u => u.id === this._permSelectedUserId)) {
      this._permSelectedUserId = users[0]?.id || 'user-admin';
    }

    const getTierMeta = (r) => {
      if (!r) return { tier: 9, label: 'Custom Role', icon: '🛡️', color: 'gray', scope: 'Custom Configuration' };
      if (r.isSuperAdmin || r.id === 'role-admin') {
        return { tier: 1, label: 'Tier 1 • Super Admin', icon: '👑', color: 'primary', scope: 'Global / All Entities' };
      }
      if (r.isEntityAdmin || r.id === 'role-entity-admin') {
        return { tier: 2, label: 'Tier 2 • Entity Admin', icon: '🏛️', color: 'teal', scope: 'Scoped to Assigned Entity' };
      }
      if (r.id === 'role-hr-team') {
        return { tier: 3, label: 'Tier 3 • HR Team', icon: '👥', color: 'purple', scope: 'Entity Payroll & Personnel' };
      }
      if (r.id === 'role-dept-lead') {
        return { tier: 4, label: 'Tier 4 • Department Lead', icon: '📂', color: 'amber', scope: 'Assigned Department(s)' };
      }
      if (r.id === 'role-data-entry') {
        return { tier: 5, label: 'Tier 5 • Data Entry / Sub-Assignee', icon: '✏️', color: 'cyan', scope: 'Assigned Category Lines' };
      }
      if (r.id === 'role-country-director') {
        return { tier: 6, label: 'Tier 6 • Country Director', icon: '🌐', color: 'emerald', scope: 'Full Entity Budget Oversight' };
      }
      if (r.id === 'role-finance-mgr') {
        return { tier: 7, label: 'Tier 7 • Finance Team', icon: '💼', color: 'primary', scope: 'Verification & Approval' };
      }
      if (r.isFinalizer || r.id === 'role-finalizer') {
        return { tier: 8, label: 'Tier 8 • Budget Finalizer', icon: '🔒', color: 'rose', scope: 'Global Final Sign-off & Lock' };
      }
      return { tier: r.tier || 9, label: `Tier ${r.tier || 9} • Custom Role`, icon: '🛡️', color: r.badgeColor || 'gray', scope: 'Custom Configuration' };
    };

    const parentCategories = Array.from(new Set(coa.map(c => c.parentAccount).filter(Boolean)));

    container.innerHTML = `
      <div class="page-header flex justify-between items-center mb-md">
        <div>
          <div class="flex items-center gap-sm">
            <span style="font-size: 1.8rem;">🛡️</span>
            <div>
              <h2 style="margin:0;">Permissions & Access Matrix Governance</h2>
              <p style="margin:2px 0 0; color: var(--text-secondary); font-size: 13px;">
                Unified access control center: granular Chart of Accounts line-item matrix, role tier templates & department scoping
              </p>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm flex items-center gap-xs" id="syncStandardRolesBtn" title="Synchronize standard 8-tier role templates">
            <span>🔄</span> Sync Standard Roles
          </button>
          <button class="btn btn-primary btn-sm flex items-center gap-xs" id="addRoleBtn">
            <span>➕</span> Create New Role
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Bar -->
      <div class="card p-sm mb-md" style="background: var(--bg-card); border: 1px solid var(--border-default);">
        <div class="flex justify-between items-center flex-wrap gap-md">
          <div class="flex items-center gap-lg flex-wrap">
            <div class="flex items-center gap-sm">
              <span style="font-size: 1.6rem;">📊</span>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary);">Chart of Accounts Lines</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${coa.length} GL Accounts</div>
              </div>
            </div>
            <div style="width: 1px; height: 32px; background: var(--border-subtle);"></div>
            <div class="flex items-center gap-sm">
              <span style="font-size: 1.6rem;">👑</span>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary);">Role Tiers</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-primary);">${roles.length} Tiers</div>
              </div>
            </div>
            <div style="width: 1px; height: 32px; background: var(--border-subtle);"></div>
            <div class="flex items-center gap-sm">
              <span style="font-size: 1.6rem;">👥</span>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary);">Configured Users</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--success);">${users.length} Employees</div>
              </div>
            </div>
          </div>

          <div class="flex gap-xs">
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('config-users')" style="font-weight: 600;">
              👤 Manage Users & Access →
            </button>
          </div>
        </div>
      </div>

      <!-- Main Navigation Tabs -->
      <div class="tabs mb-md" id="permNavTabs">
        <button class="tab ${this._permActiveTab === 'matrix' ? 'active' : ''}" data-tab="matrix" style="font-size: 13.5px; font-weight: 700;">
          📊 Access Settings Matrix (Parent Accounts & Modules)
        </button>
        <button class="tab ${this._permActiveTab === 'roles' ? 'active' : ''}" data-tab="roles" style="font-size: 13.5px; font-weight: 700;">
          🎴 Role Hierarchy & Assigned Staff
        </button>
        <button class="tab ${this._permActiveTab === 'lifecycle' ? 'active' : ''}" data-tab="lifecycle" style="font-size: 13.5px; font-weight: 700;">
          🔄 5-Stage Budget Lifecycle Map
        </button>
      </div>

      <!-- Dynamic Tab Content -->
      <div id="permDynamicContainer"></div>
    `;

    const renderDynamicTab = () => {
      const target = container.querySelector('#permDynamicContainer');
      if (!target) return;

      if (this._permActiveTab === 'roles') {
        renderRolesTab(target);
      } else if (this._permActiveTab === 'lifecycle') {
        renderLifecycleTab(target);
      } else {
        renderMatrixTab(target);
      }
    };

    // ────────────────────────────────────────────────────────────
    // ─── TAB 1: ACCESS SETTINGS MATRIX (PARENT ACCOUNTS & MODULES) ───
    // ────────────────────────────────────────────────────────────
    const renderMatrixTab = (target) => {
      const activeRole = roles.find(r => r.id === this._permSelectedRoleId) || roles[0];
      const activeUser = users.find(u => u.id === this._permSelectedUserId) || users[0];
      const targetRoleMeta = getTierMeta(activeRole);

      // Section 1: Parent Expense Accounts (All 13 COA Parent Account Groups)
      const parentAccounts = [
        { key: 'salaries', label: 'Salaries and Wages', icon: '💼', group: 'Payroll Cost', desc: 'Direct compensation, full-time & part-time base salaries' },
        { key: 'gratuity', label: 'Health & Retirement Benefits (Gratuity & Bonus)', icon: '🎁', group: 'Payroll Benefits', desc: 'Statutory gratuity, annual performance bonus, provident fund & health benefits' },
        { key: 'other-staff', label: 'Other Staff Expenses', icon: '👥', group: 'Staff Development', desc: 'Staff training, learning & development, capacity building & team offsites' },
        { key: 'eha', label: 'Resource Persons (Direct Consultants / EHA)', icon: '🤝', group: 'Direct Consultants', desc: 'Program resource consultants, curriculum experts & external clinical advisors' },
        { key: 'fixed-assets', label: 'Fixed Assets (CapEx)', icon: '💻', group: 'Fixed Assets & CapEx', desc: 'Laptops, IT equipment, program hardware & office infrastructure' },
        { key: 'travel', label: 'Travel & Lodging Expenses', icon: '✈️', group: 'Operations Cost', desc: 'Hotel accommodation, airfare, local transport (cab/bus/train) & travel incidentals' },
        { key: 'supplies', label: 'Supplies & Printing Costs', icon: '🖨️', group: 'Operations Cost', desc: 'Training materials, participant collateral, office printing & stationary' },
        { key: 'communication', label: 'Communication Expenses', icon: '📡', group: 'Operations Cost', desc: 'High-speed internet, mobile recharges, Zoom/cloud software subscriptions' },
        { key: 'office', label: 'Office Expenses', icon: '🏢', group: 'Operations Cost', desc: 'Office utilities, repair & maintenance, facility upkeep & workspace rent' },
        { key: 'professional', label: 'Professional Charges', icon: '💼', group: 'Professional Fees', desc: 'Statutory audit fees, legal counsel, translation & technical evaluation' },
        { key: 'other-costs', label: 'Other Operating Expenses', icon: '📑', group: 'General OpEx', desc: 'Bank processing fees, government fees, contingency & miscellaneous costs' },
        { key: 'imp-tot-rates', label: 'ToT Program Budget (IMP)', icon: '🎯', group: 'Special Program Budget', desc: 'Trainer of Trainers implementation events, workshops & unit rates' },
        { key: 'total-dept-cost', label: 'Master Department Total Rollup', icon: '📊', group: 'Department Summary', desc: 'Consolidated master department totals, grand rollups & variance tracking' }
      ];

      // Section 2: System & Governance Modules
      const systemModules = [
        { key: 'employees', label: 'Employee Master & Personnel Records', icon: '🧑‍💼', group: 'Employee Master', desc: 'Permissions to view, add, edit, delete, and import employee records, salary bands, and designations' },
        { key: 'prior-period', label: 'Prior Period Costs Access & Upload Settings', icon: '⏳', group: 'Historical Reference', desc: 'Permissions to view, direct-edit, bulk upload, and reference prior year historical costs' },
        { key: 'reports', label: 'Financial Reports & Analytical Settings', icon: '📈', group: 'Analytics & Reporting', desc: 'Access to department summaries, multi-entity consolidated reports, donor reports & exports' },
        { key: 'config', label: 'All Other System Configurations', icon: '⚙️', group: 'System Setup & Governance', desc: 'Access to entities, department directories, budget cycle deadlines/locks, exchange rates, and dimensions' }
      ];

      const search = (this._permSearchTerm || '').trim().toLowerCase();
      const filterGroup = this._permSelectedParent || 'all';

      const filterItems = (items) => {
        return items.filter(item => {
          if (filterGroup !== 'all' && filterGroup !== 'parent-accounts' && filterGroup !== 'system-modules') {
            if (item.key !== filterGroup && item.group !== filterGroup) return false;
          }
          if (filterGroup === 'parent-accounts' && !parentAccounts.some(p => p.key === item.key)) return false;
          if (filterGroup === 'system-modules' && !systemModules.some(s => s.key === item.key)) return false;
          if (!search) return true;
          return (
            item.label.toLowerCase().includes(search) ||
            item.group.toLowerCase().includes(search) ||
            item.desc.toLowerCase().includes(search)
          );
        });
      };

      const filteredParents = filterItems(parentAccounts);
      const filteredModules = filterItems(systemModules);
      const totalFiltered = filteredParents.length + filteredModules.length;

      const getEffectivePerms = (key) => {
        if (this._permTargetType === 'role') {
          return activeRole.permissions?.[key] || {};
        } else {
          const uRole = roles.find(r => r.id === activeUser.roleId) || {};
          const roleStandard = uRole.permissions?.[key] || {};
          const userOverride = activeUser.categoryOverrides?.[key] || {};
          return { ...roleStandard, ...userOverride };
        }
      };

      target.innerHTML = `
        <!-- Target Selection & Filter Toolbar -->
        <div class="card p-md mb-md" style="background: var(--bg-card); border: 1px solid var(--border-default);">
          <div class="flex justify-between items-center flex-wrap gap-md mb-sm">
            <div class="flex items-center gap-sm">
              <label class="form-label font-bold" style="margin:0; font-size: 12px; text-transform: uppercase; color: var(--text-tertiary);">
                Configure Access Settings For:
              </label>
              <div class="btn-group">
                <button class="btn btn-sm ${this._permTargetType === 'role' ? 'btn-primary' : 'btn-ghost'}" id="targetRoleBtn" style="font-weight: 700;">
                  🛡️ By Role Hierarchy Tier
                </button>
                <button class="btn btn-sm ${this._permTargetType === 'user' ? 'btn-primary' : 'btn-ghost'}" id="targetUserBtn" style="font-weight: 700;">
                  👤 By Specific User Override
                </button>
              </div>
            </div>

            <!-- Role or User Dropdown Selector -->
            <div class="flex items-center gap-sm flex-wrap" style="flex: 1; max-width: 440px;">
              ${this._permTargetType === 'role' ? `
                <select class="form-select form-select-sm" id="permRoleSelect" style="font-weight: 700; width: 100%;">
                  ${roles.map(r => {
                    const m = getTierMeta(r);
                    return `<option value="${r.id}" ${r.id === this._permSelectedRoleId ? 'selected' : ''}>${m.icon} ${m.label} — ${r.name}</option>`;
                  }).join('')}
                </select>
              ` : `
                <select class="form-select form-select-sm" id="permUserSelect" style="font-weight: 700; width: 100%;">
                  ${users.map(u => {
                    const uRole = roles.find(r => r.id === u.roleId);
                    return `<option value="${u.id}" ${u.id === this._permSelectedUserId ? 'selected' : ''}>${u.avatar || '👤'} ${u.name} (${u.title || uRole?.name || u.roleId})</option>`;
                  }).join('')}
                </select>
              `}
            </div>
          </div>

          <!-- Secondary Filters & Search -->
          <div class="flex justify-between items-center flex-wrap gap-md pt-sm" style="border-top: 1px solid var(--border-subtle);">
            <div class="flex items-center gap-sm flex-wrap" style="flex: 1;">
              <div class="form-group" style="margin:0; min-width: 240px; flex: 1;">
                <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 2px;">Scope Group Filter</label>
                <select class="form-select form-select-sm" id="permParentFilter" style="width: 100%;">
                  <option value="all">📁 All Accounts & Modules (${parentAccounts.length + systemModules.length} scopes)</option>
                  <option value="parent-accounts" ${this._permSelectedParent === 'parent-accounts' ? 'selected' : ''}>📁 Parent Expense Accounts Only (${parentAccounts.length} items)</option>
                  <option value="system-modules" ${this._permSelectedParent === 'system-modules' ? 'selected' : ''}>⚙️ System & Governance Modules Only (${systemModules.length} items)</option>
                </select>
              </div>
              <div class="form-group" style="margin:0; min-width: 260px; flex: 1.2;">
                <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 2px;">Search Scopes</label>
                <input type="text" class="form-input form-input-sm" id="permSearchInput" placeholder="🔍 Search parent account name, module or description..." value="${this._permSearchTerm}">
              </div>
            </div>

            <div class="flex items-center gap-xs" style="align-self: flex-end; padding-bottom: 2px;">
              <button class="btn btn-ghost btn-sm text-primary font-bold" id="permGrantVisibleBtn">✓ Grant All</button>
              <button class="btn btn-ghost btn-sm text-danger" id="permClearVisibleBtn">✗ Clear All</button>
              <button class="btn btn-success btn-sm font-bold flex items-center gap-xs ml-xs" id="saveLinePermsTopBtn">
                <span>💾</span> Save
              </button>
            </div>
          </div>
        </div>

        <!-- Target Banner -->
        <div class="card p-sm mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(59, 130, 246, 0.25);">
          <div class="flex items-center gap-md">
            <span style="font-size: 2rem;">${this._permTargetType === 'role' ? targetRoleMeta.icon : (activeUser.avatar || '👤')}</span>
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary);">Active Target for Permissions:</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                ${this._permTargetType === 'role' ? activeRole.name : `${activeUser.name} — ${activeUser.title || activeUser.roleId}`}
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">
                ${this._permTargetType === 'role' ? `Hierarchy Level: ${targetRoleMeta.label} | Scope: ${targetRoleMeta.scope}` : `Primary Role: ${activeUser.roleId} | User Category Override Mode`}
              </div>
            </div>
          </div>
          <div class="badge badge-primary font-bold" style="padding: 6px 12px; font-size: 12px;">
            Showing ${totalFiltered} Parent Account & Module Scopes
          </div>
        </div>

        <!-- Parent Account Level Access Settings Matrix Table -->
        <div class="card p-0 mb-md" style="overflow: hidden; border: 1px solid var(--border-default);">
          <div class="table-container" style="max-height: 580px; overflow-y: auto;">
            <table class="data-table" id="unifiedLinePermTable" style="font-size: 12px; margin: 0;">
              <thead style="position: sticky; top: 0; background: var(--bg-card); z-index: 2;">
                <tr>
                  <th style="min-width: 260px;">Parent Account / System Module Scope</th>
                  <th style="min-width: 140px;">Classification</th>
                  ${Auth.OPERATIONS.map(op => `
                    <th style="text-align: center; min-width: 62px; font-size: 11px;" title="${op.label}">
                      ${op.icon || ''} ${op.label}
                    </th>
                  `).join('')}
                  <th style="text-align: center; width: 55px;">Toggle</th>
                </tr>
              </thead>
              <tbody>
                ${totalFiltered === 0 ? `
                  <tr>
                    <td colspan="11" class="text-center text-tertiary p-xl">
                      No parent accounts or system modules found matching your search filters.
                    </td>
                  </tr>
                ` : `
                  <!-- ─── SECTION 1: PARENT EXPENSE ACCOUNTS ─── -->
                  ${filteredParents.length > 0 ? `
                    <tr class="section-header-row" data-group="parents" style="background: #e2e8f0; border-top: 2px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="padding: 7px 10px;">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-xs">
                            <span style="font-size: 1.15rem;">📁</span>
                            <strong style="color: var(--text-primary); font-size: 12.5px;">Parent Expense Accounts (COA Categories)</strong>
                            <span class="text-tertiary" style="font-size: 11px; margin-left: 6px;">(${filteredParents.length} parent accounts)</span>
                          </div>
                          <button type="button" class="btn btn-ghost btn-xs matrix-group-toggle" data-group="parents" style="padding: 1px 6px; font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.75);">Toggle Group</button>
                        </div>
                      </td>
                      ${Auth.OPERATIONS.map(op => `
                        <td style="text-align: center; background: #e2e8f0; padding: 4px;">
                          <input type="checkbox" class="group-op-cb" data-group="parents" data-op="${op.key}" title="Toggle ${op.label} for all Parent Accounts" style="cursor: pointer; width: 14px; height: 14px;">
                        </td>
                      `).join('')}
                      <td style="text-align: center; background: #e2e8f0;">
                        <button type="button" class="btn btn-ghost btn-xs matrix-group-all-toggle" data-group="parents" style="padding: 2px 5px; font-size: 10px;">All</button>
                      </td>
                    </tr>
                    ${filteredParents.map(item => {
                      const effectivePerms = getEffectivePerms(item.key);
                      return `
                        <tr data-cat="${item.key}" data-group="parents">
                          <td style="padding: 4px 8px;">
                            <div class="flex items-center gap-xs">
                              <span style="font-size: 1rem;">${item.icon}</span>
                              <div>
                                <strong style="color: var(--text-primary); font-size: 12px;">${item.label}</strong>
                                <div class="text-tertiary" style="font-size: 10.5px; margin-top: 1px;">${item.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td style="padding: 4px 6px;"><span class="badge badge-subtle font-bold" style="font-size: 10px;">${item.group}</span></td>
                          ${Auth.OPERATIONS.map(op => `
                            <td style="text-align: center; vertical-align: middle; padding: 3px;">
                              <input type="checkbox" class="unified-perm-cb" data-group="parents" data-cat="${item.key}" data-op="${op.key}" ${effectivePerms[op.key] ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">
                            </td>
                          `).join('')}
                          <td style="text-align: center; vertical-align: middle; padding: 3px;">
                            <button type="button" class="btn btn-ghost btn-xs unified-row-toggle" data-cat="${item.key}" style="padding: 1px 5px; font-size: 10px;">Row</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  ` : ''}

                  <!-- ─── SECTION 2: SYSTEM & GOVERNANCE MODULES ─── -->
                  ${filteredModules.length > 0 ? `
                    <tr class="section-header-row" data-group="modules" style="background: #e2e8f0; border-top: 2px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="padding: 5px 8px;">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-xs">
                            <span style="font-size: 1.05rem;">⚙️</span>
                            <strong style="color: var(--text-primary); font-size: 12px;">System Governance, Reports & Historical Modules</strong>
                            <span class="text-tertiary" style="font-size: 10.5px; margin-left: 6px;">(${filteredModules.length} modules)</span>
                          </div>
                          <button type="button" class="btn btn-ghost btn-xs matrix-group-toggle" data-group="modules" style="padding: 1px 6px; font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.75);">Toggle Group</button>
                        </div>
                      </td>
                      ${Auth.OPERATIONS.map(op => `
                        <td style="text-align: center; background: #e2e8f0; padding: 3px;">
                          <input type="checkbox" class="group-op-cb" data-group="modules" data-op="${op.key}" title="Toggle ${op.label} for all System Modules" style="cursor: pointer; width: 14px; height: 14px;">
                        </td>
                      `).join('')}
                      <td style="text-align: center; background: #e2e8f0; padding: 3px;">
                        <button type="button" class="btn btn-ghost btn-xs matrix-group-all-toggle" data-group="modules" style="padding: 1px 5px; font-size: 10px;">All</button>
                      </td>
                    </tr>
                    ${filteredModules.map(item => {
                      const effectivePerms = getEffectivePerms(item.key);
                      return `
                        <tr data-cat="${item.key}" data-group="modules">
                          <td style="padding: 4px 8px;">
                            <div class="flex items-center gap-xs">
                              <span style="font-size: 1rem;">${item.icon}</span>
                              <div>
                                <strong style="color: var(--text-primary); font-size: 12px;">${item.label}</strong>
                                <div class="text-tertiary" style="font-size: 10.5px; margin-top: 1px;">${item.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td style="padding: 4px 6px;"><span class="badge badge-subtle font-bold" style="font-size: 10px;">${item.group}</span></td>
                          ${Auth.OPERATIONS.map(op => `
                            <td style="text-align: center; vertical-align: middle; padding: 3px;">
                              <input type="checkbox" class="unified-perm-cb" data-group="modules" data-cat="${item.key}" data-op="${op.key}" ${effectivePerms[op.key] ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">
                            </td>
                          `).join('')}
                          <td style="text-align: center; vertical-align: middle; padding: 3px;">
                            <button type="button" class="btn btn-ghost btn-xs unified-row-toggle" data-cat="${item.key}" style="padding: 1px 5px; font-size: 10px;">Row</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  ` : ''}
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Save Actions Card -->
        <div class="card p-md flex justify-between items-center mb-xl" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm">
            <span style="font-size: 1.5rem;">💾</span>
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">Save Access Settings Matrix</div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Apply and commit parent account & module access permissions for <strong>${this._permTargetType === 'role' ? activeRole.name : activeUser.name}</strong>
              </div>
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="ConfigModule.renderRoles(Utils.$('#pageContent'))">
              Cancel / Reset
            </button>
            <button class="btn btn-success btn-md font-bold flex items-center gap-xs" id="saveLinePermsBottomBtn" style="padding: 8px 24px; font-size: 13.5px;">
              <span>✓</span> Save Permissions Matrix
            </button>
          </div>
        </div>
      `;

      // Matrix Event Listeners
      target.querySelector('#targetRoleBtn')?.addEventListener('click', () => {
        this._permTargetType = 'role';
        renderDynamicTab();
      });
      target.querySelector('#targetUserBtn')?.addEventListener('click', () => {
        this._permTargetType = 'user';
        renderDynamicTab();
      });

      target.querySelector('#permRoleSelect')?.addEventListener('change', (e) => {
        this._permSelectedRoleId = e.target.value;
        renderDynamicTab();
      });
      target.querySelector('#permUserSelect')?.addEventListener('change', (e) => {
        this._permSelectedUserId = e.target.value;
        renderDynamicTab();
      });
      target.querySelector('#permParentFilter')?.addEventListener('change', (e) => {
        this._permSelectedParent = e.target.value;
        renderDynamicTab();
      });

      const searchEl = target.querySelector('#permSearchInput');
      if (searchEl) {
        searchEl.addEventListener('input', (e) => {
          this._permSearchTerm = e.target.value;
          clearTimeout(this._searchDebounce);
          this._searchDebounce = setTimeout(() => renderDynamicTab(), 200);
        });
      }

      target.querySelector('#permGrantVisibleBtn')?.addEventListener('click', () => {
        target.querySelectorAll('.unified-perm-cb, .group-op-cb').forEach(cb => cb.checked = true);
      });
      target.querySelector('#permClearVisibleBtn')?.addEventListener('click', () => {
        target.querySelectorAll('.unified-perm-cb, .group-op-cb').forEach(cb => cb.checked = false);
      });

      // Group operation checkbox toggle (cascades to all items in that group)
      target.querySelectorAll('.group-op-cb').forEach(groupCb => {
        groupCb.addEventListener('change', (e) => {
          const groupKey = e.target.getAttribute('data-group');
          const op = e.target.getAttribute('data-op');
          const isChecked = e.target.checked;
          target.querySelectorAll(`.unified-perm-cb[data-group="${groupKey}"][data-op="${op}"]`).forEach(cb => {
            cb.checked = isChecked;
            const catKey = cb.getAttribute('data-cat');
            if (op === 'view' && !isChecked) {
              target.querySelectorAll(`.unified-perm-cb[data-cat="${catKey}"]:not([data-op="view"])`).forEach(s => s.checked = false);
            } else if (op !== 'view' && isChecked) {
              const viewCb = target.querySelector(`.unified-perm-cb[data-cat="${catKey}"][data-op="view"]`);
              if (viewCb) viewCb.checked = true;
            }
          });
        });
      });

      // Group toggle button
      target.querySelectorAll('.matrix-group-toggle, .matrix-group-all-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const groupKey = btn.getAttribute('data-group');
          const cbs = target.querySelectorAll(`.unified-perm-cb[data-group="${groupKey}"]`);
          const allChecked = Array.from(cbs).every(cb => cb.checked);
          cbs.forEach(cb => cb.checked = !allChecked);
          target.querySelectorAll(`.group-op-cb[data-group="${groupKey}"]`).forEach(gcb => gcb.checked = !allChecked);
        });
      });

      // Logical RBAC Rule: If View is unchecked, automatically uncheck Add, Edit, Delete, Remarks, Review, Approve, Finalize.
      // If any non-view operation is checked, automatically check View.
      target.querySelectorAll('.unified-perm-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const catKey = e.target.getAttribute('data-cat');
          const op = e.target.getAttribute('data-op');
          if (op === 'view' && !e.target.checked) {
            target.querySelectorAll(`.unified-perm-cb[data-cat="${catKey}"]:not([data-op="view"])`).forEach(sibling => {
              sibling.checked = false;
            });
          } else if (op !== 'view' && e.target.checked) {
            const viewCb = target.querySelector(`.unified-perm-cb[data-cat="${catKey}"][data-op="view"]`);
            if (viewCb) viewCb.checked = true;
          }
        });
      });

      target.querySelectorAll('.unified-row-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const catKey = btn.getAttribute('data-cat');
          const cbs = target.querySelectorAll(`.unified-perm-cb[data-cat="${catKey}"]`);
          const allChecked = Array.from(cbs).every(cb => cb.checked);
          cbs.forEach(cb => cb.checked = !allChecked);
        });
      });

      const saveAction = async () => {
        const rows = target.querySelectorAll('#unifiedLinePermTable tbody tr[data-cat]');
        if (this._permTargetType === 'role') {
          const targetRole = roles.find(r => r.id === this._permSelectedRoleId);
          if (!targetRole) return;
          if (!targetRole.permissions) targetRole.permissions = {};

          rows.forEach(tr => {
            const catKey = tr.getAttribute('data-cat');
            if (!catKey) return;
            const perms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = tr.querySelector(`.unified-perm-cb[data-op="${op.key}"]`);
              perms[op.key] = cb ? cb.checked : false;
            });
            // Logical Rule: If view is false, ensure all other operations are false
            if (!perms.view) {
              Auth.OPERATIONS.forEach(op => { perms[op.key] = false; });
            }
            targetRole.permissions[catKey] = perms;
          });

          await db.saveRole(targetRole);
          await Auth.init();
          await db.logAudit({
            category: 'config',
            action: 'UPDATE',
            recordId: targetRole.id,
            description: `Updated access settings matrix for role "${targetRole.name}"`
          });
          Utils.showToast(`Access settings matrix saved for role "${targetRole.name}"!`, 'success');
        } else {
          const targetUser = users.find(u => u.id === this._permSelectedUserId);
          if (!targetUser) return;
          if (!targetUser.categoryOverrides) targetUser.categoryOverrides = {};

          rows.forEach(tr => {
            const catKey = tr.getAttribute('data-cat');
            if (!catKey) return;
            const perms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = tr.querySelector(`.unified-perm-cb[data-op="${op.key}"]`);
              perms[op.key] = cb ? cb.checked : false;
            });
            // Logical Rule: If view is false, ensure all other operations are false
            if (!perms.view) {
              Auth.OPERATIONS.forEach(op => { perms[op.key] = false; });
            }
            targetUser.categoryOverrides[catKey] = perms;
            if (targetUser.roleAssignments && Array.isArray(targetUser.roleAssignments)) {
              targetUser.roleAssignments.forEach(a => {
                if (!a.categoryOverrides) a.categoryOverrides = {};
                a.categoryOverrides[catKey] = perms;
              });
            }
          });

          await db.saveUser(targetUser);
          await Auth.init();
          await db.logAudit({
            category: 'config',
            action: 'UPDATE',
            recordId: targetUser.id,
            description: `Updated access settings matrix overrides for user "${targetUser.name}"`
          });
          Utils.showToast(`Access settings matrix overrides saved for user "${targetUser.name}"!`, 'success');
        }
      };

      target.querySelector('#saveLinePermsTopBtn')?.addEventListener('click', saveAction);
      target.querySelector('#saveLinePermsBottomBtn')?.addEventListener('click', saveAction);
    };

    // ────────────────────────────────────────────────────────────
    // ─── TAB 2: ROLE HIERARCHY & ASSIGNED STAFF (COMPACT GRID) ───
    // ────────────────────────────────────────────────────────────
    const renderRolesTab = (target) => {
      target.innerHTML = `
        <div class="card p-0 mb-xl" style="overflow: hidden; border: 1px solid var(--border-default);">
          <div class="card-header flex justify-between items-center p-sm" style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);">
            <div>
              <h3 style="margin:0; font-size: 1.15rem;">🎴 Role Hierarchy & Governance Authority Matrix</h3>
              <p class="text-secondary" style="margin:2px 0 0; font-size: 12px;">Defines baseline authority for <strong>Parent Accounts</strong>, <strong>Prior Period Costs</strong>, <strong>Reports</strong>, and <strong>Configurations</strong>. Individual GL line-item overrides are managed via the Granular Matrix.</p>
            </div>
            <div class="flex gap-xs">
              <span class="badge badge-primary font-bold">${roles.length} Configured Tiers</span>
              <span class="badge badge-emerald font-bold">${users.length} Active Staff</span>
            </div>
          </div>

          <div class="table-container" style="max-height: 560px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px; margin: 0;">
              <thead style="position: sticky; top: 0; background: var(--bg-card); z-index: 2;">
                <tr>
                  <th style="min-width: 130px;">Hierarchy Tier</th>
                  <th style="min-width: 180px;">Role Name & ID</th>
                  <th style="min-width: 140px;">Operational Scope</th>
                  <th style="min-width: 280px;">Assigned Personnel in Users & Access</th>
                  <th style="min-width: 130px; text-align: center;">Line Overrides</th>
                  <th style="min-width: 140px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${roles.map(r => {
                  const meta = getTierMeta(r);
                  const assignedUsers = users.filter(u => 
                    u.roleId === r.id || 
                    (u.roleAssignments && u.roleAssignments.some(a => a.roleId === r.id))
                  );
                  const customLinesCount = Object.keys(r.lineItemPermissions || {}).length;

                  return `
                    <tr style="border-left: 4px solid var(--${r.badgeColor === 'emerald' ? 'success' : r.badgeColor === 'cyan' ? 'accent-cyan' : r.badgeColor === 'teal' ? 'accent-cyan' : r.badgeColor === 'primary' ? 'accent-primary' : r.badgeColor === 'amber' ? 'warning' : r.badgeColor === 'rose' ? 'danger' : r.badgeColor === 'purple' ? 'purple' : 'border-default'});">
                      <td>
                        <div class="flex items-center gap-xs">
                          <span style="font-size: 1.2rem;">${meta.icon}</span>
                          <div>
                            <strong style="color: var(--text-primary); font-size: 12px;">${meta.label.split('•')[0]}</strong>
                            <div class="text-tertiary" style="font-size: 10px;">Level ${meta.tier * 10}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style="color: var(--text-primary); font-size: 12.5px;">${r.name}</strong>
                          <div class="flex items-center gap-xs mt-xs">
                            <span class="badge badge-${r.badgeColor || 'primary'}" style="font-size: 9.5px; padding: 1px 5px;">
                              ${r.isSystem ? 'System' : 'Custom'}
                            </span>
                            <code style="font-size: 10px; color: var(--text-tertiary);">${r.id}</code>
                          </div>
                          ${r.description ? `<div class="text-secondary" style="font-size: 11px; margin-top: 2px; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${Utils.escapeHtml(r.description)}">${Utils.escapeHtml(r.description)}</div>` : ''}
                        </div>
                      </td>
                      <td>
                        <span class="badge badge-cyan" style="font-size: 10.5px; padding: 3px 7px;">
                          📍 ${meta.scope}
                        </span>
                      </td>
                      <td>
                        ${assignedUsers.length > 0 ? `
                          <div class="flex gap-xs flex-wrap">
                            ${assignedUsers.map(u => `
                              <span class="badge badge-subtle flex items-center gap-xs" style="font-size: 11px; padding: 2px 6px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 4px;">
                                <span style="font-size: 1rem;">${u.avatar || '👤'}</span>
                                <strong>${u.name}</strong>
                                <span class="text-tertiary" style="font-size: 9.5px;">(${u.title || u.id})</span>
                                <button class="btn btn-ghost btn-xs text-primary" onclick="Auth.setCurrentUser('${u.id}')" title="Operate as this user" style="padding: 0 3px; font-size: 9px; margin-left: 2px;">🔑</button>
                              </span>
                            `).join('')}
                          </div>
                        ` : `
                          <span class="text-tertiary" style="font-size: 11px; font-style: italic;">No users assigned</span>
                        `}
                      </td>
                      <td style="text-align: center;">
                        <span class="badge ${customLinesCount > 0 ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10.5px;">
                          ${customLinesCount > 0 ? `⚙️ ${customLinesCount} Custom` : '📋 Standard'}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <div class="flex gap-xs justify-end items-center">
                          <button class="btn btn-primary btn-xs font-bold" onclick="ConfigModule.openLineMatrixForRole('${r.id}')" title="Configure granular GL line-item permissions for this role">
                            📊 Matrix →
                          </button>
                          <button class="btn btn-ghost btn-xs" onclick="ConfigModule.showRoleForm('${r.id}')" title="Edit role metadata">
                            ✏️
                          </button>
                          ${!r.isSystem ? `
                            <button class="btn btn-ghost btn-xs text-danger" onclick="ConfigModule.deleteRole('${r.id}')" title="Delete custom role">
                              🗑️
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    // ────────────────────────────────────────────────────────────
    // ─── TAB 3: 5-STAGE BUDGET LIFECYCLE MAP ───
    // ────────────────────────────────────────────────────────────
    const renderLifecycleTab = (target) => {
      const stages = [
        {
          num: 'Stage 1',
          icon: '👥',
          title: 'Payroll & Master Costs (HR Team)',
          tier: 'Tier 3 • HR Team',
          roles: ['role-hr-team'],
          desc: 'HR updates Salaries & Wages, Other Staff Expenses, Gratuity & Bonus, EHA Consultants, and Fixed Assets across all departments for the entity.',
          color: 'purple'
        },
        {
          num: 'Stage 2',
          icon: '📂',
          title: 'Department Operational Data Entry',
          tier: 'Tiers 4 & 5 • Dept Leads & Data Entry',
          roles: ['role-dept-lead', 'role-data-entry'],
          desc: 'Admin assigns department leads to fill Other Costs (Travel, Supplies, Communication, Office, Professional). Leads can either enter directly or sub-assign to State / Data Entry leads.',
          color: 'amber'
        },
        {
          num: 'Stage 3',
          icon: '🌐',
          title: 'Entity Budget Totality Review',
          tier: 'Tier 6 • Country Director',
          roles: ['role-country-director'],
          desc: 'Country Director reviews all consolidated departmental numbers and payroll rollups across the entity in totality.',
          color: 'emerald'
        },
        {
          num: 'Stage 4',
          icon: '💼',
          title: 'Financial Verification & Approval',
          tier: 'Tier 7 • Finance Team',
          roles: ['role-finance-mgr'],
          desc: 'Finance verifies ledger codes, tags, rate reasonableness, cross-checks department budgets, and grants formal Finance Approval.',
          color: 'primary'
        },
        {
          num: 'Stage 5',
          icon: '🔒',
          title: 'Budget Finalization & Rate Snapshot',
          tier: 'Tier 8 • Budget Finalizer (CFO / Super Admin)',
          roles: ['role-finalizer', 'role-admin'],
          desc: 'Finalizer signs off and locks the budget for the year. Rate snapshot (Exchange rates, Travel, TOT) is frozen immutably.',
          color: 'rose'
        }
      ];

      target.innerHTML = `
        <div class="card p-md" style="background: var(--bg-card); border: 1px solid var(--border-default);">
          <div class="card-header mb-md">
            <h3 style="margin:0; font-size: 1.2rem;">🔄 Organization Budget Dataflow & Governance Lifecycle</h3>
            <p class="text-secondary" style="margin:2px 0 0; font-size: 12.5px;">Step-by-step lifecycle of budget preparation, departmental delegation, review, approval, and final locking</p>
          </div>

          <div class="flex flex-col gap-md">
            ${stages.map((st) => {
              const assigned = users.filter(u => st.roles.includes(u.roleId) || (u.roleAssignments && u.roleAssignments.some(a => st.roles.includes(a.roleId))));
              return `
                <div class="card p-md" style="border-left: 5px solid var(--${st.color === 'purple' ? 'purple' : st.color === 'amber' ? 'warning' : st.color === 'emerald' ? 'success' : st.color === 'rose' ? 'danger' : 'accent-primary'}); background: rgba(0,0,0,0.015);">
                  <div class="flex justify-between items-start mb-xs">
                    <div class="flex items-center gap-sm">
                      <span style="font-size: 1.8rem;">${st.icon}</span>
                      <div>
                        <div class="flex items-center gap-xs">
                          <span class="badge badge-subtle font-bold" style="font-size: 10.5px;">${st.num}</span>
                          <span class="badge badge-${st.color}" style="font-size: 10.5px;">${st.tier}</span>
                        </div>
                        <h4 style="margin: 4px 0 2px; font-size: 1.15rem; color: var(--text-primary);">${st.title}</h4>
                      </div>
                    </div>
                    <div class="badge badge-subtle font-bold">
                      👥 ${assigned.length} Configured Personnel
                    </div>
                  </div>
                  <p class="text-secondary" style="font-size: 13px; margin: 4px 0 8px; line-height: 1.5;">${st.desc}</p>
                  <div class="flex gap-xs flex-wrap items-center pt-xs" style="border-top: 1px solid var(--border-subtle);">
                    <span class="text-tertiary font-bold" style="font-size: 11px;">Assigned Personnel:</span>
                    ${assigned.map(u => `
                      <span class="badge badge-subtle flex items-center gap-xs" style="font-size: 11px;">
                        <span>${u.avatar || '👤'}</span>
                        <strong>${u.name}</strong> (${u.title || u.id})
                        <button class="btn btn-ghost btn-xs text-primary" onclick="Auth.setCurrentUser('${u.id}')" title="Operate as this user" style="padding: 1px 4px; font-size: 9px;">🔑</button>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    // Initial render
    renderDynamicTab();

    // Tab Navigation Listener
    container.querySelectorAll('#permNavTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        container.querySelectorAll('#permNavTabs .tab').forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        this._permActiveTab = t.dataset.tab;
        renderDynamicTab();
      });
    });

    Utils.$('#addRoleBtn')?.addEventListener('click', () => this.showRoleForm());
    Utils.$('#syncStandardRolesBtn')?.addEventListener('click', async () => {
      if (await Utils.confirm('Reset/sync standard role permissions to default 8-tier templates from seed data?')) {
        const defaultRoles = SEED_DATA.defaultRoles || [];
        for (const def of defaultRoles) {
          await db.saveRole(def);
        }
        await Auth.init();
        Utils.showToast('Standard 8-tier roles synchronized successfully!', 'success');
        const pageContent = Utils.$('#pageContent');
        if (pageContent) ConfigModule.renderRoles(pageContent);
      }
    });
  },

  openLineMatrixForRole(roleId) {
    this._permActiveTab = 'matrix';
    this._permTargetType = 'role';
    this._permSelectedRoleId = roleId;
    const pageContent = Utils.$('#pageContent');
    if (pageContent) this.renderRoles(pageContent);
  },



  async showRoleForm(roleId = null) {
    const roles = await db.getRoles();
    const role = roleId ? roles.find(r => r.id === roleId) : null;
    const isEdit = !!role;

    const content = `
      <form id="roleModalForm">
        <div class="form-row mb-sm">
          <div class="form-group" style="flex: 2;">
            <label class="form-label font-bold">Role Name</label>
            <input type="text" class="form-input" id="roleFormName" value="${role?.name || ''}" placeholder="e.g. Regional Finance Manager" required>
          </div>
          <div class="form-group" style="flex: 1.2;">
            <label class="form-label font-bold">Hierarchy Authority Tier</label>
            <select class="form-select" id="roleFormTier">
              <option value="1" ${role?.tier === 1 ? 'selected' : ''}>👑 Tier 1 — Super Admin (Global / All Entities)</option>
              <option value="2" ${role?.tier === 2 ? 'selected' : ''}>🏛️ Tier 2 — Entity Admin (Assigned Entity Scoped)</option>
              <option value="3" ${role?.tier === 3 ? 'selected' : ''}>👥 Tier 3 — HR Team (Payroll & Personnel)</option>
              <option value="4" ${role?.tier === 4 ? 'selected' : ''}>📂 Tier 4 — Dept Lead (Assigned Dept Operations)</option>
              <option value="5" ${role?.tier === 5 ? 'selected' : ''}>✏️ Tier 5 — Data Entry / Sub-Assignee</option>
              <option value="6" ${role?.tier === 6 ? 'selected' : ''}>🌐 Tier 6 — Country Director (Entity Oversight)</option>
              <option value="7" ${role?.tier === 7 ? 'selected' : ''}>💼 Tier 7 — Finance Team (Verification & Approval)</option>
              <option value="8" ${role?.tier === 8 ? 'selected' : ''}>🔒 Tier 8 — Finalizer (Global Sign-off & Lock)</option>
              <option value="9" ${role?.tier === 9 || !role?.tier ? 'selected' : ''}>🛡️ Custom Hierarchy Tier</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label font-bold">Badge Color</label>
            <select class="form-select" id="roleFormColor">
              <option value="primary" ${role?.badgeColor === 'primary' ? 'selected' : ''}>Blue (Primary)</option>
              <option value="emerald" ${role?.badgeColor === 'emerald' ? 'selected' : ''}>Green (Emerald)</option>
              <option value="cyan" ${role?.badgeColor === 'cyan' ? 'selected' : ''}>Cyan (Teal)</option>
              <option value="teal" ${role?.badgeColor === 'teal' ? 'selected' : ''}>Teal (Entity Admin)</option>
              <option value="amber" ${role?.badgeColor === 'amber' ? 'selected' : ''}>Amber (Warning)</option>
              <option value="purple" ${role?.badgeColor === 'purple' ? 'selected' : ''}>Purple (HR/Data)</option>
              <option value="rose" ${role?.badgeColor === 'rose' ? 'selected' : ''}>Rose (Finalizer)</option>
              <option value="gray" ${role?.badgeColor === 'gray' ? 'selected' : ''}>Gray (Auditor)</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-md">
          <label class="form-label font-bold">Role Description & Operational Scope</label>
          <input type="text" class="form-input" id="roleFormDesc" value="${role?.description || ''}" placeholder="Describe role authority, responsibilities, and operational scope">
        </div>

        <div class="card p-md mb-sm" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(16, 185, 129, 0.06)); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: var(--radius-md);">
          <div class="flex items-center justify-between flex-wrap gap-sm">
            <div class="flex items-center gap-sm">
              <span style="font-size: 1.6rem;">🎛️</span>
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">Unified Access Settings Matrix</strong>
                <p style="margin: 2px 0 0; font-size: 11.5px; color: var(--text-secondary);">
                  All operational access settings for <strong>Parent Expense Accounts</strong>, <strong>Prior Period Costs</strong>, <strong>Financial Reports</strong>, and <strong>System Configurations</strong> are configured in the <strong>Access Settings Matrix</strong>.
                </p>
              </div>
            </div>
            ${isEdit ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="modalOpenMatrixBtn" style="white-space: nowrap;">
                📊 Open Access Matrix →
              </button>
            ` : ''}
          </div>
        </div>
      </form>
    `;

    Utils.showModal(isEdit ? `Edit Role & Hierarchy Tier — ${role.name}` : '➕ Create New Role & Hierarchy Tier', content, {
      size: 'md',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: isEdit ? '💾 Save Role Details' : '➕ Create Role',
          onClick: async () => {
            const name = Utils.$('#roleFormName').value.trim();
            if (!name) {
              Utils.showToast('Please enter a role name.', 'warning');
              return;
            }
            const description = Utils.$('#roleFormDesc').value.trim();
            const badgeColor = Utils.$('#roleFormColor').value;
            const tier = parseInt(Utils.$('#roleFormTier').value, 10) || 5;

            const roleObj = {
              ...role,
              id: role?.id || `role_${Utils.slugify(name)}`,
              name,
              tier,
              description,
              badgeColor,
              isSystem: role?.isSystem || false,
              isSuperAdmin: tier === 1,
              isEntityAdmin: tier === 2,
              isFinalizer: tier === 8,
              permissions: role?.permissions || {},
              lineItemPermissions: role?.lineItemPermissions || {}
            };

            await db.saveRole(roleObj);
            await Auth.init();
            await db.logAudit({
              category: 'config',
              action: isEdit ? 'UPDATE' : 'CREATE',
              recordId: roleObj.id,
              description: `${isEdit ? 'Updated' : 'Created'} RBAC role "${name}" (Tier ${tier})`,
              changes: { tier, description, badgeColor }
            });

            Utils.showToast(`Role "${name}" saved successfully!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderRoles(pageContent);
          }
        }));
      }
    });

    if (isEdit) {
      document.getElementById('modalOpenMatrixBtn')?.addEventListener('click', () => {
        const modal = document.querySelector('.modal-backdrop');
        if (modal) modal.remove();
        this.openMatrixForRole(role.id);
      });
    }
  },

  async deleteRole(roleId) {
    const users = await db.getUsers();
    const assigned = users.filter(u => u.roleId === roleId || (u.roleAssignments && u.roleAssignments.some(a => a.roleId === roleId)));
    if (assigned.length > 0) {
      Utils.showToast(`Cannot delete role: Assigned to ${assigned.length} user(s). Reassign them first.`, 'warning');
      return;
    }
    if (await Utils.confirm('Are you sure you want to delete this custom role?')) {
      await db.deleteRole(roleId);
      await db.logAudit({ category: 'config', action: 'DELETE', recordId: roleId, description: `Deleted role ${roleId}` });
      Utils.showToast('Role deleted.', 'info');
      const pageContent = Utils.$('#pageContent');
      if (pageContent) ConfigModule.renderRoles(pageContent);
    }
  },

  // ════════════════════════════════════════════════════════════
  // ─── 10. USER MANAGEMENT & CATEGORY CUSTOMIZATION ───
  // ════════════════════════════════════════════════════════════
  async renderUsers(container) {
    const users = await db.getUsers();
    const roles = await db.getRoles();
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);
    const activeUser = Auth.getCurrentUser();

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>👤 User Management & Access Scoping</h2>
          <p>Manage employees, assign role tiers (T1–T8), define entity/department scopes, and customize category-level permissions</p>
        </div>
        <button class="btn btn-primary" id="addUserBtn">➕ Add New User</button>
      </div>

      <div class="card p-sm mb-md flex justify-between items-center" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(59, 130, 246, 0.2);">
        <div class="flex items-center gap-md">
          <span style="font-size: 2rem;">${activeUser?.avatar || '👤'}</span>
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary);">Currently Operating As:</div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${activeUser?.name || 'System Admin'} <span class="badge badge-primary">${activeUser?.roleName || 'Admin'}</span></div>
            <div style="font-size: 12px; color: var(--text-secondary);">${activeUser?.email || ''} | Scope: ${activeUser?.entities === 'all' ? 'All Entities' : (activeUser?.entities || []).join(', ')}</div>
          </div>
        </div>
        <div class="badge badge-emerald font-bold" style="padding: 6px 12px;">Active Session</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Configured Users (${users.length})</div>
          <div class="card-subtitle">Employees with assigned roles across 8 tiers, department restrictions, and category overrides</div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>User / Employee</th>
                <th>Assigned Role & Tier</th>
                <th>Assigned Entities</th>
                <th>Assigned Departments</th>
                <th>Category Overrides</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const role = roles.find(r => r.id === u.roleId) || (u.roleAssignments && roles.find(r => r.id === u.roleAssignments[0]?.roleId)) || { name: u.roleId || 'Staff', badgeColor: 'subtle', tier: 5 };
                const hasOverrides = u.categoryOverrides && Object.keys(u.categoryOverrides).length > 0;
                
                // Entity display
                const uEnts = u.entities || (u.roleAssignments && u.roleAssignments[0]?.entities) || 'all';
                const entDisplay = uEnts === 'all' ? '<span class="badge badge-cyan">🌍 All Entities</span>' : (Array.isArray(uEnts) ? uEnts : [uEnts]).map(eId => {
                  const ent = entities.find(e => e.id === eId);
                  return `<span class="badge badge-subtle font-bold">${ent?.flag || ''} ${ent?.shortName || eId}</span>`;
                }).join(' ');

                // Department display
                const uDepts = u.departments || (u.roleAssignments && u.roleAssignments[0]?.departments) || 'all';
                const deptDisplay = uDepts === 'all' ? '<span class="badge badge-cyan">🏛️ All Departments</span>' : (Array.isArray(uDepts) ? uDepts : [uDepts]).map(dId => {
                  return `<span class="badge badge-subtle"><code>${dId.toUpperCase()}</code></span>`;
                }).join(' ');

                const tierNum = role.tier ? `T${role.tier}` : '';

                return `
                  <tr style="${u.id === activeUser?.id ? 'background: rgba(59, 130, 246, 0.04);' : ''}">
                    <td>
                      <div class="flex items-center gap-sm">
                        <span style="font-size: 1.4rem;">${u.avatar || '👤'}</span>
                        <div>
                          <strong>${u.name}</strong> ${u.id === activeUser?.id ? '<span class="badge badge-emerald" style="font-size: 10px;">YOU</span>' : ''}
                          <div class="text-tertiary" style="font-size: 11px;">${u.email} | ${u.title || 'Staff'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-${role.badgeColor || 'primary'} font-bold">
                        ${tierNum ? `[${tierNum}] ` : ''}${role.name}
                      </span>
                    </td>
                    <td>${entDisplay}</td>
                    <td>${deptDisplay}</td>
                    <td>
                      ${hasOverrides ? `
                        <span class="badge badge-purple font-bold" title="Has custom category-level permission overrides">⚡ Custom Overrides</span>
                      ` : '<span class="text-tertiary" style="font-size: 11px;">Role Standard</span>'}
                    </td>
                    <td>
                      <span class="badge badge-${u.status === 'active' ? 'emerald' : 'danger'}">${u.status || 'active'}</span>
                    </td>
                    <td>
                      <div class="flex gap-xs">
                        <button class="btn btn-ghost btn-sm" onclick="ConfigModule.showUserForm('${u.id}')" title="Edit user profile & permissions">✏️ Edit</button>
                        <button class="btn btn-ghost btn-sm" onclick="Auth.setCurrentUser('${u.id}')" title="Operate as this user">🔑 Switch</button>
                        ${u.id !== 'user-admin' ? `<button class="btn btn-ghost btn-sm text-danger" onclick="ConfigModule.deleteUser('${u.id}')" title="Delete user">🗑️</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    Utils.$('#addUserBtn').addEventListener('click', () => this.showUserForm());
  },

  async showUserForm(userId = null) {
    const users = await db.getUsers();
    const roles = await db.getRoles();
    const entities = await db.getAll(STORES.entities);
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const user = userId ? users.find(u => u.id === userId) : null;
    const isEdit = !!user;

    const currentRoleId = user?.roleId || (user?.roleAssignments && user?.roleAssignments[0]?.roleId) || roles[0]?.id || 'role-data-entry';
    const userEntities = user?.entities || (user?.roleAssignments && user?.roleAssignments[0]?.entities) || 'all';
    const userDepts = user?.departments || (user?.roleAssignments && user?.roleAssignments[0]?.departments) || 'all';
    const hasOverrides = !!(user?.categoryOverrides && Object.keys(user.categoryOverrides).length > 0);

    const content = `
      <form id="userModalForm">
        <div class="form-row mb-sm">
          <div class="form-group" style="flex: 2;">
            <label class="form-label font-bold">Full Name</label>
            <input type="text" class="form-input" id="userFormName" value="${user?.name || ''}" placeholder="e.g. Pooja Sharma" required>
          </div>
          <div class="form-group" style="flex: 2;">
            <label class="form-label font-bold">Email Address</label>
            <input type="email" class="form-input" id="userFormEmail" value="${user?.email || ''}" placeholder="pooja.sharma@noorahealth.org" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label font-bold">Avatar</label>
            <select class="form-select" id="userFormAvatar">
              <option value="👩‍💻" ${user?.avatar === '👩‍💻' ? 'selected' : ''}>👩‍💻 Tech / Data</option>
              <option value="👨‍💼" ${user?.avatar === '👨‍💼' ? 'selected' : ''}>👨‍💼 Admin</option>
              <option value="👩‍💼" ${user?.avatar === '👩‍💼' ? 'selected' : ''}>👩‍💼 Finance</option>
              <option value="👨‍⚕️" ${user?.avatar === '👨‍⚕️' ? 'selected' : ''}>👨‍⚕️ Medical / Health</option>
              <option value="👨‍🏫" ${user?.avatar === '👨‍🏫' ? 'selected' : ''}>👨‍🏫 Trainer / Lead</option>
              <option value="🕵️" ${user?.avatar === '🕵️' ? 'selected' : ''}>🕵️ Auditor</option>
              <option value="🏦" ${user?.avatar === '🏦' ? 'selected' : ''}>🏦 Executive / CFO</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-md">
          <div class="form-group" style="flex: 2;">
            <label class="form-label font-bold">Job Title / Designation</label>
            <input type="text" class="form-input" id="userFormTitle" value="${user?.title || ''}" placeholder="e.g. HCOMM Operations Associate">
          </div>
          <div class="form-group" style="flex: 2;">
            <label class="form-label font-bold">Assigned Role (8 Tiers)</label>
            <select class="form-select" id="userFormRole">
              ${roles.map(r => {
                const tierPrefix = r.tier ? `[Tier ${r.tier}] ` : '';
                return `<option value="${r.id}" ${r.id === currentRoleId ? 'selected' : ''}>${tierPrefix}${r.name}</option>`;
              }).join('')}
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label font-bold">Status</label>
            <select class="form-select" id="userFormStatus">
              <option value="active" ${user?.status !== 'inactive' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-md">
          <div class="form-group" style="flex: 1;">
            <label class="form-label font-bold">Mobile Number (for SMS / OTP Recovery)</label>
            <input type="text" class="form-input" id="userFormMobile" value="${user?.mobile || ''}" placeholder="e.g. +91 98765 43210">
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label font-bold">Sign-In Password</label>
            <input type="text" class="form-input" id="userFormPassword" value="${user?.password || 'Password@123'}" placeholder="Password@123">
          </div>
        </div>

        <!-- Entity & Department Scoping -->
        <div class="card p-sm mb-md" style="background: var(--bg-surface); border: 1px solid var(--border-default);">
          <h4 style="margin:0 0 8px; font-size: 13px; text-transform: uppercase;">🌍 Access Scoping: Entities & Departments</h4>
          
          <div class="form-row mb-sm">
            <div class="form-group" style="margin:0; flex: 1;">
              <label class="form-label font-bold">Entity Access:</label>
              <div class="flex gap-sm items-center mb-xs">
                <label style="font-size: 12px; cursor: pointer;"><input type="radio" name="entityScopeRadio" value="all" ${userEntities === 'all' ? 'checked' : ''}> All Entities</label>
                <label style="font-size: 12px; cursor: pointer;"><input type="radio" name="entityScopeRadio" value="custom" ${userEntities !== 'all' ? 'checked' : ''}> Specific Entities Only</label>
              </div>
              <div id="userEntityCheckboxes" class="flex gap-xs flex-wrap p-xs" style="background: rgba(0,0,0,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); ${userEntities === 'all' ? 'display: none;' : ''}">
                ${entities.map(e => {
                  const isChecked = Array.isArray(userEntities) && userEntities.includes(e.id);
                  return `<label style="font-size: 11.5px; margin-right: 8px; cursor: pointer;"><input type="checkbox" class="user-ent-cb" value="${e.id}" ${isChecked ? 'checked' : ''}> ${e.flag} ${e.shortName}</label>`;
                }).join('')}
              </div>
            </div>

            <div class="form-group" style="margin:0; flex: 1.5;">
              <label class="form-label font-bold">Department Access:</label>
              <div class="flex gap-sm items-center mb-xs">
                <label style="font-size: 12px; cursor: pointer;"><input type="radio" name="deptScopeRadio" value="all" ${userDepts === 'all' ? 'checked' : ''}> All Departments</label>
                <label style="font-size: 12px; cursor: pointer;"><input type="radio" name="deptScopeRadio" value="custom" ${userDepts !== 'all' ? 'checked' : ''}> Specific Departments Only</label>
              </div>
              <div id="userDeptCheckboxes" class="p-xs" style="max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); ${userDepts === 'all' ? 'display: none;' : ''}">
                ${departments.map(d => {
                  const isChecked = Array.isArray(userDepts) && userDepts.includes(d.id);
                  return `<label style="display: block; font-size: 11.5px; margin-bottom: 3px; cursor: pointer;"><input type="checkbox" class="user-dept-cb" value="${d.id}" ${isChecked ? 'checked' : ''}> <code>${d.codeTemplate ? d.codeTemplate.replace('{CC}', 'IN') : d.id.toUpperCase()}</code></label>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Category Level Customization (User Directive Feature) -->
        <div class="card p-sm" style="background: rgba(147, 51, 234, 0.03); border: 1px solid rgba(147, 51, 234, 0.3);">
          <div class="flex justify-between items-center mb-xs">
            <div>
              <h4 style="margin:0; font-size: 13px; color: var(--text-primary); text-transform: uppercase;">⚡ Category-Level Custom Permission Overrides</h4>
              <p class="text-secondary" style="margin:2px 0 0; font-size: 11.5px;">
                Customize exact operations (e.g. Allow updating <strong>Other Costs only</strong> while keeping <strong>Salaries view-only</strong> for ${user?.name || 'this user'}).
              </p>
            </div>
            <label style="font-size: 12px; font-weight: 700; cursor: pointer; color: var(--accent-primary);">
              <input type="checkbox" id="userEnableOverridesCb" ${hasOverrides ? 'checked' : ''}> Enable Custom Overrides
            </label>
          </div>

          <div id="userOverridesContainer" style="${hasOverrides ? '' : 'display: none;'}; margin-top: 8px;">
            <div class="table-container" style="max-height: 250px; overflow-y: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    ${Auth.OPERATIONS.map(op => `<th style="text-align: center; font-size: 10.5px; padding: 4px;">${op.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${Auth.CATEGORIES.map(cat => {
                    const selRole = roles.find(r => r.id === currentRoleId);
                    const defaultPerms = selRole?.permissions?.[cat.key] || {};
                    const customPerms = user?.categoryOverrides?.[cat.key] || defaultPerms;
                    return `
                      <tr data-cat="${cat.key}">
                        <td><strong>${cat.icon} ${cat.label}</strong></td>
                        ${Auth.OPERATIONS.map(op => `
                          <td style="text-align: center; padding: 4px;">
                            <input type="checkbox" class="user-custom-perm-cb" data-cat="${cat.key}" data-op="${op.key}" ${customPerms[op.key] ? 'checked' : ''} style="cursor: pointer;">
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
      </form>
    `;

    Utils.showModal(isEdit ? `Edit User Profile — ${user.name}` : 'Add New User', content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary',
          textContent: isEdit ? '💾 Update User' : '➕ Create User',
          onClick: async () => {
            const name = Utils.$('#userFormName').value.trim();
            const email = Utils.$('#userFormEmail').value.trim();
            if (!name || !email) {
              Utils.showToast('Name and Email are required.', 'warning');
              return;
            }

            const avatar = Utils.$('#userFormAvatar').value;
            const title = Utils.$('#userFormTitle').value.trim();
            const roleId = Utils.$('#userFormRole').value;
            const status = Utils.$('#userFormStatus').value;
            const mobile = Utils.$('#userFormMobile')?.value.trim() || user?.mobile || '';
            const password = Utils.$('#userFormPassword')?.value.trim() || user?.password || 'Password@123';

            // Entities Scope
            const entRadio = document.querySelector('input[name="entityScopeRadio"]:checked')?.value;
            let assignedEntities = 'all';
            if (entRadio === 'custom') {
              assignedEntities = Array.from(document.querySelectorAll('.user-ent-cb:checked')).map(cb => cb.value);
              if (assignedEntities.length === 0) assignedEntities = 'all';
            }

            // Departments Scope
            const deptRadio = document.querySelector('input[name="deptScopeRadio"]:checked')?.value;
            let assignedDepts = 'all';
            if (deptRadio === 'custom') {
              assignedDepts = Array.from(document.querySelectorAll('.user-dept-cb:checked')).map(cb => cb.value);
              if (assignedDepts.length === 0) assignedDepts = 'all';
            }

            // Custom Category Overrides
            const enableOverrides = document.getElementById('userEnableOverridesCb')?.checked;
            let categoryOverrides = null;
            if (enableOverrides) {
              categoryOverrides = {};
              Auth.CATEGORIES.forEach(cat => {
                categoryOverrides[cat.key] = {};
                Auth.OPERATIONS.forEach(op => {
                  const cb = document.querySelector(`.user-custom-perm-cb[data-cat="${cat.key}"][data-op="${op.key}"]`);
                  categoryOverrides[cat.key][op.key] = cb ? cb.checked : false;
                });
                // Logical RBAC Rule: If view is false, all other operations must be false
                if (!categoryOverrides[cat.key].view) {
                  Auth.OPERATIONS.forEach(op => { categoryOverrides[cat.key][op.key] = false; });
                }
              });
            }

            // Build roleAssignments structure
            const roleAssignments = [
              {
                assignmentId: `asgn_${user?.id || 'new'}_01`,
                roleId,
                entities: assignedEntities,
                departments: assignedDepts,
                categoryOverrides: categoryOverrides || {},
                lineItemOverrides: user?.lineItemOverrides || {}
              }
            ];

            const userObj = {
              id: user?.id || `user_${Date.now()}`,
              name,
              email,
              mobile,
              password,
              title,
              avatar,
              roleId,
              roleAssignments,
              status,
              entities: assignedEntities,
              departments: assignedDepts,
              categoryOverrides,
              createdAt: user?.createdAt || new Date().toISOString()
            };

            await db.saveUser(userObj);
            await db.logAudit({
              category: 'config',
              action: isEdit ? 'UPDATE' : 'CREATE',
              recordId: userObj.id,
              description: `${isEdit ? 'Updated' : 'Created'} user account "${name}" (${userObj.title}) with role "${roleId}"`,
              changes: { roleId, entities: assignedEntities, departments: assignedDepts, hasOverrides: !!categoryOverrides }
            });

            Utils.showToast(`User "${name}" saved successfully!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderUsers(pageContent);
          }
        }));
      }
    });

    // Toggle Handlers inside User Modal
    document.querySelectorAll('input[name="entityScopeRadio"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const box = document.getElementById('userEntityCheckboxes');
        if (box) box.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      });
    });

    document.querySelectorAll('input[name="deptScopeRadio"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const box = document.getElementById('userDeptCheckboxes');
        if (box) box.style.display = e.target.value === 'custom' ? 'block' : 'none';
      });
    });

    document.getElementById('userEnableOverridesCb')?.addEventListener('change', (e) => {
      const box = document.getElementById('userOverridesContainer');
      if (box) box.style.display = e.target.checked ? 'block' : 'none';
    });

    // View dependency cascade: Unchecking view clears add/edit/delete/etc.
    // Checking any non-view operation checks view.
    document.querySelectorAll('.user-custom-perm-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const catKey = e.target.getAttribute('data-cat');
        const op = e.target.getAttribute('data-op');
        if (op === 'view' && !e.target.checked) {
          document.querySelectorAll(`.user-custom-perm-cb[data-cat="${catKey}"]:not([data-op="view"])`).forEach(s => {
            s.checked = false;
          });
        } else if (op !== 'view' && e.target.checked) {
          const viewCb = document.querySelector(`.user-custom-perm-cb[data-cat="${catKey}"][data-op="view"]`);
          if (viewCb) viewCb.checked = true;
        }
      });
    });
  },

  async deleteUser(userId) {
    if (userId === 'user-admin') {
      Utils.showToast('Cannot delete default system admin.', 'error');
      return;
    }
    if (await Utils.confirm('Are you sure you want to delete this user profile?')) {
      await db.deleteUser(userId);
      await db.logAudit({ category: 'config', action: 'DELETE', recordId: userId, description: `Deleted user ${userId}` });
      Utils.showToast('User profile deleted.', 'info');
      const pageContent = Utils.$('#pageContent');
      if (pageContent) ConfigModule.renderUsers(pageContent);
    }
  },

  // ════════════════════════════════════════════════════════════
  // ─── 11. AUDIT LOGS & ALTERATION HISTORY ───
  // ════════════════════════════════════════════════════════════
  async renderAuditLogs(container) {
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);
    const users = await db.getUsers();
    let logs = await db.getAuditLogs();

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>📜 Backend Audit Trail & Alteration History</h2>
          <p>Immutable log of all data entries, modifications, deletions, approvals, and remarks across the organization</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" id="auditExportBtn">📥 Export Audit Logs</button>
          <button class="btn btn-ghost btn-sm" id="auditRefreshBtn">🔄 Refresh</button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="card p-sm mb-md" style="background: var(--bg-surface); border: 1px solid var(--border-default);">
        <div class="form-row mb-xs" style="gap: 8px;">
          <div class="form-group" style="margin:0; flex: 1; min-width: 120px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700;">Action:</label>
            <select class="form-select form-select-sm" id="auditActionFilter">
              <option value="">All Actions</option>
              <option value="CREATE">CREATE (Add)</option>
              <option value="UPDATE">UPDATE (Edit)</option>
              <option value="DELETE">DELETE</option>
              <option value="REVIEW">REVIEW</option>
              <option value="APPROVE">APPROVE</option>
              <option value="FINALIZE">FINALIZE</option>
              <option value="REMARKS">REMARKS</option>
            </select>
          </div>
          <div class="form-group" style="margin:0; flex: 1.2; min-width: 130px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700;">Category:</label>
            <select class="form-select form-select-sm" id="auditCategoryFilter">
              <option value="">All Categories</option>
              ${Auth.CATEGORIES.map(c => `<option value="${c.key}">${c.icon} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0; flex: 1.2; min-width: 130px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700;">User:</label>
            <select class="form-select form-select-sm" id="auditUserFilter">
              <option value="">All Users (${users.length})</option>
              ${users.map(u => `<option value="${u.id}">${u.name} (${u.roleId})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0; flex: 1; min-width: 110px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700;">Entity:</label>
            <select class="form-select form-select-sm" id="auditEntityFilter">
              <option value="">All Entities</option>
              ${entities.map(e => `<option value="${e.id}">${e.shortName}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0; flex: 1.3; min-width: 140px;">
            <label class="form-label" style="font-size: 11px; font-weight: 700;">Search:</label>
            <input type="text" class="form-input form-input-sm" id="auditSearchInput" placeholder="🔍 Description...">
          </div>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div id="auditLogCount" class="card-title">${logs.length} Audit Entries Recorded</div>
          <span class="badge badge-emerald font-bold">🔒 Tamper-Evident Store</span>
        </div>

        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="min-width: 150px;">Timestamp (UTC/Local)</th>
                <th style="min-width: 140px;">User & Role</th>
                <th style="min-width: 90px; text-align: center;">Action</th>
                <th style="min-width: 120px;">Category</th>
                <th style="min-width: 120px;">Scope</th>
                <th>Description</th>
                <th style="width: 70px; text-align: center;">Diff</th>
              </tr>
            </thead>
            <tbody id="auditTableBody"></tbody>
          </table>
        </div>
      </div>
    `;

    const actionFilterEl = container.querySelector('#auditActionFilter');
    const catFilterEl = container.querySelector('#auditCategoryFilter');
    const userFilterEl = container.querySelector('#auditUserFilter');
    const entFilterEl = container.querySelector('#auditEntityFilter');
    const searchInputEl = container.querySelector('#auditSearchInput');
    const tbody = container.querySelector('#auditTableBody');
    const countEl = container.querySelector('#auditLogCount');

    const renderRows = () => {
      const act = actionFilterEl.value;
      const cat = catFilterEl.value;
      const usr = userFilterEl.value;
      const ent = entFilterEl.value;
      const search = (searchInputEl.value || '').trim().toLowerCase();

      const filtered = logs.filter(l => {
        if (act && l.action !== act) return false;
        if (cat && l.category !== cat) return false;
        if (usr && l.userId !== usr) return false;
        if (ent && l.entityId !== ent) return false;
        if (search && !(l.description || '').toLowerCase().includes(search) && !(l.recordId || '').toLowerCase().includes(search)) return false;
        return true;
      });

      countEl.textContent = `Showing ${filtered.length} of ${logs.length} Audit Entries`;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-tertiary p-lg">No audit log entries matching filter.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(l => {
        const actionBadge = l.action === 'CREATE' ? 'badge-emerald' : l.action === 'UPDATE' ? 'badge-primary' : l.action === 'DELETE' ? 'badge-danger' : l.action === 'APPROVE' ? 'badge-cyan' : l.action === 'FINALIZE' ? 'badge-purple' : 'badge-amber';
        const formattedDate = new Date(l.timestamp).toLocaleString();
        const hasChanges = l.changes && Object.keys(l.changes).length > 0;

        return `
          <tr>
            <td><code style="font-size: 11px;">${formattedDate}</code></td>
            <td>
              <strong>${l.userName || l.userId}</strong>
              <div class="text-tertiary" style="font-size: 10.5px;">${l.userRole || 'User'}</div>
            </td>
            <td style="text-align: center;"><span class="badge ${actionBadge} font-bold">${l.action}</span></td>
            <td><span class="badge badge-subtle" style="font-size: 11px;">${l.category}</span></td>
            <td>
              ${l.entityId ? `<strong>${l.entityId.toUpperCase()}</strong>` : ''}
              ${l.deptId ? `<div class="text-secondary" style="font-size: 11px;"><code>${l.deptId.toUpperCase()}</code></div>` : ''}
            </td>
            <td style="font-size: 12px; color: var(--text-primary); max-width: 320px;">
              ${l.description}
              ${l.recordId ? `<div class="text-tertiary" style="font-size: 10px;">ID: <code>${l.recordId}</code></div>` : ''}
            </td>
            <td style="text-align: center;">
              ${hasChanges ? `
                <button class="btn btn-ghost btn-xs text-primary audit-diff-btn" data-id="${l.id}" title="View previous & current change diff" style="padding: 2px 6px;">🔍 Diff</button>
              ` : '—'}
            </td>
          </tr>
        `;
      }).join('');
    };

    renderRows();

    actionFilterEl.addEventListener('change', renderRows);
    catFilterEl.addEventListener('change', renderRows);
    userFilterEl.addEventListener('change', renderRows);
    entFilterEl.addEventListener('change', renderRows);
    searchInputEl.addEventListener('input', renderRows);

    container.querySelector('#auditRefreshBtn').addEventListener('click', async () => {
      logs = await db.getAuditLogs();
      renderRows();
      Utils.showToast('Audit trail refreshed!', 'info');
    });

    container.querySelector('#auditExportBtn').addEventListener('click', () => {
      this.exportAuditLogsToExcel(logs);
    });

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.audit-diff-btn');
      if (!btn) return;
      const logId = btn.getAttribute('data-id');
      const entry = logs.find(l => l.id === logId);
      if (entry) this.showAuditDiffModal(entry);
    });
  },

  showAuditDiffModal(entry) {
    const changes = entry.changes || {};
    const content = `
      <div>
        <div class="card p-sm mb-md" style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2);">
          <div class="flex justify-between items-center">
            <div>
              <strong>${entry.action}: ${entry.description}</strong>
              <div class="text-tertiary" style="font-size: 11px;">Executed by <strong>${entry.userName}</strong> (${entry.userRole}) at ${new Date(entry.timestamp).toLocaleString()}</div>
            </div>
            <span class="badge badge-primary font-mono">${entry.category}</span>
          </div>
        </div>

        <h4>Snapshot & Value Alterations:</h4>
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <pre style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: var(--radius-sm); font-size: 12px; line-height: 1.5; overflow-x: auto;"><code>${JSON.stringify(changes, null, 2)}</code></pre>
        </div>
      </div>
    `;

    Utils.showModal(`Audit Log Diff — ${entry.id}`, content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-primary', textContent: 'Close', onClick: close }));
      }
    });
  },

  exportAuditLogsToExcel(logs) {
    const headers = ['Audit ID', 'Timestamp (ISO)', 'Date Time (Local)', 'User ID', 'User Name', 'User Role', 'Action', 'Category', 'Year', 'Entity', 'Department', 'Record ID', 'Description', 'Changes JSON'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      new Date(l.timestamp).toLocaleString(),
      l.userId || '',
      l.userName || '',
      l.userRole || '',
      l.action || '',
      l.category || '',
      l.yearId || '',
      l.entityId || '',
      l.deptId || '',
      l.recordId || '',
      l.description || '',
      JSON.stringify(l.changes || '')
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
    XLSX.writeFile(wb, `Noora_Budget_Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    Utils.showToast(`Exported ${logs.length} audit trail records to Excel!`, 'success');
  },

  // ════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════
  // ─── 12. LINE-ITEM ROLES & PERMISSIONS MATRIX ───
  // ════════════════════════════════════════════════════════════
  async renderLinePermissions(container) {
    const roles = await db.getRoles();
    const users = await db.getUsers();
    let coa = await db.getChartOfAccounts();
    if (!coa || coa.length === 0) {
      coa = SEED_DATA.chartOfAccounts || [];
    }

    let targetType = 'role'; // 'role' | 'user'
    let selectedRoleId = roles[0]?.id || 'role-data-entry';
    let selectedUserId = users[0]?.id || '';
    let searchTerm = '';
    let selectedParent = 'all';

    const uniqueParents = Array.from(new Set(coa.map(c => c.parentAccount).filter(Boolean))).sort();

    const renderGrid = () => {
      let filtered = coa;
      if (selectedParent !== 'all') {
        filtered = filtered.filter(c => c.parentAccount === selectedParent);
      }
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        filtered = filtered.filter(c => 
          (c.glDescription && c.glDescription.toLowerCase().includes(s)) ||
          (c.ledgerCode && c.ledgerCode.toLowerCase().includes(s)) ||
          (c.parentAccount && c.parentAccount.toLowerCase().includes(s))
        );
      }

      const activeTargetRole = roles.find(r => r.id === selectedRoleId) || roles[0];
      const activeTargetUser = users.find(u => u.id === selectedUserId) || null;

      container.innerHTML = `
        <div class="page-header flex justify-between items-center">
          <div>
            <h2>🔐 Line-Item Roles & Permissions Matrix</h2>
            <p>Granular operational access control (View, Add, Edit, Delete, Remarks, Review, Approve, Finalize) for every GL account line item</p>
          </div>
          <button class="btn btn-primary" id="saveAllLinePermsBtn">💾 Save Line Permissions</button>
        </div>

        <!-- Target Selector & Filter Bar -->
        <div class="card p-md mb-md flex justify-between items-center flex-wrap gap-md" style="background: var(--bg-surface); border: 1px solid var(--border-default);">
          <div class="flex items-center gap-md flex-wrap">
            <div>
              <label class="form-label font-bold" style="margin: 0 0 4px; font-size: 12px;">Configure Permissions For:</label>
              <div class="flex gap-xs">
                <button type="button" class="btn btn-sm ${targetType === 'role' ? 'btn-primary' : 'btn-ghost'}" id="targetTypeRoleBtn">🛡️ Role Standard</button>
                <button type="button" class="btn btn-sm ${targetType === 'user' ? 'btn-primary' : 'btn-ghost'}" id="targetTypeUserBtn">👤 User Override</button>
              </div>
            </div>

            ${targetType === 'role' ? `
              <div>
                <label class="form-label font-bold" style="margin: 0 0 4px; font-size: 12px;">Select Role:</label>
                <select class="form-select" id="linePermRoleSelect" style="min-width: 220px; font-weight: 600;">
                  ${roles.map(r => `<option value="${r.id}" ${r.id === selectedRoleId ? 'selected' : ''}>${r.name} (${r.isSystem ? 'System' : 'Custom'})</option>`).join('')}
                </select>
              </div>
            ` : `
              <div>
                <label class="form-label font-bold" style="margin: 0 0 4px; font-size: 12px;">Select User / Employee:</label>
                <select class="form-select" id="linePermUserSelect" style="min-width: 260px; font-weight: 600;">
                  ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.avatar || '👤'} ${u.name} (${u.title || u.roleId})</option>`).join('')}
                </select>
              </div>
            `}

            <div>
              <label class="form-label font-bold" style="margin: 0 0 4px; font-size: 12px;">Parent Account Group:</label>
              <select class="form-select" id="linePermParentSelect" style="min-width: 180px;">
                <option value="all" ${selectedParent === 'all' ? 'selected' : ''}>All Groups (${coa.length} lines)</option>
                ${uniqueParents.map(p => `<option value="${p}" ${selectedParent === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="flex items-center gap-sm">
            <input type="text" class="form-input" id="linePermSearchInput" placeholder="🔍 Search GL description or ledger..." value="${Utils.escapeHtml(searchTerm)}" style="width: 240px;">
            <button type="button" class="btn btn-ghost btn-sm" id="lineGrantAllVisibleBtn" title="Grant all operations for visible rows">✓ Grant Visible</button>
            <button type="button" class="btn btn-ghost btn-sm text-danger" id="lineClearAllVisibleBtn" title="Clear all operations for visible rows">✗ Clear Visible</button>
          </div>
        </div>

        <!-- Target Info Banner -->
        <div class="card p-sm mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(16, 185, 129, 0.06)); border: 1px solid rgba(59, 130, 246, 0.2);">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.6rem;">${targetType === 'role' ? '🛡️' : (activeTargetUser?.avatar || '👤')}</span>
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary);">Configuring Permissions For:</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">
                ${targetType === 'role' ? activeTargetRole.name : `${activeTargetUser?.name} (${activeTargetUser?.title || ''})`}
              </div>
            </div>
          </div>
          <div class="badge badge-primary font-bold" style="padding: 6px 12px; font-size: 12px;">
            Showing ${filtered.length} Account Lines
          </div>
        </div>

        <!-- Matrix Data Table -->
        <div class="card">
          <div class="table-container" style="max-height: 520px; overflow-y: auto;">
            <table class="data-table" id="linePermMatrixTable">
              <thead>
                <tr>
                  <th style="min-width: 160px;">Parent Account</th>
                  <th style="min-width: 200px;">GL Line Item Description</th>
                  <th style="min-width: 100px;">Ledger Code</th>
                  <th style="min-width: 140px;">Default Source</th>
                  ${Auth.OPERATIONS.map(op => `<th style="text-align: center; min-width: 65px; font-size: 11px;">${op.label}</th>`).join('')}
                  <th style="text-align: center; width: 60px;">Toggle</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(item => {
                  const lineKey = item.ledgerCode ? String(item.ledgerCode).trim() : Utils.slugify(item.glDescription);
                  
                  let effectivePerms = {};
                  if (targetType === 'role') {
                    effectivePerms = activeTargetRole.lineItemPermissions?.[lineKey] || 
                                     activeTargetRole.permissions?.[item.parentAccount] || 
                                     activeTargetRole.permissions?.['other-costs'] || {};
                  } else {
                    const uRole = roles.find(r => r.id === activeTargetUser?.roleId) || {};
                    const roleStandard = uRole.lineItemPermissions?.[lineKey] || uRole.permissions?.[item.parentAccount] || uRole.permissions?.['other-costs'] || {};
                    const userOverride = activeTargetUser?.lineItemOverrides?.[lineKey] || {};
                    effectivePerms = { ...roleStandard, ...userOverride };
                  }

                  return `
                    <tr data-line-key="${lineKey}">
                      <td><strong>${item.parentAccount || '—'}</strong></td>
                      <td>${item.glDescription || '—'}</td>
                      <td><code>${item.ledgerCode || '—'}</code></td>
                      <td><span class="badge badge-subtle" style="font-size: 10.5px;">${item.category || item.subGroup || 'Standard'}</span></td>
                      ${Auth.OPERATIONS.map(op => `
                        <td style="text-align: center;">
                          <input type="checkbox" class="matrix-perm-cb" data-line-key="${lineKey}" data-op="${op.key}" ${effectivePerms[op.key] ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                        </td>
                      `).join('')}
                      <td style="text-align: center;">
                        <button type="button" class="btn btn-ghost btn-xs matrix-row-toggle" data-line-key="${lineKey}" style="padding: 2px 6px; font-size: 10px;">Row</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event listeners
      container.querySelector('#targetTypeRoleBtn')?.addEventListener('click', () => { targetType = 'role'; renderGrid(); });
      container.querySelector('#targetTypeUserBtn')?.addEventListener('click', () => { targetType = 'user'; renderGrid(); });

      container.querySelector('#linePermRoleSelect')?.addEventListener('change', (e) => { selectedRoleId = e.target.value; renderGrid(); });
      container.querySelector('#linePermUserSelect')?.addEventListener('change', (e) => { selectedUserId = e.target.value; renderGrid(); });
      container.querySelector('#linePermParentSelect')?.addEventListener('change', (e) => { selectedParent = e.target.value; renderGrid(); });

      const searchInput = container.querySelector('#linePermSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchTerm = e.target.value;
          // Debounced re-render
          clearTimeout(this._searchTimer);
          this._searchTimer = setTimeout(() => renderGrid(), 200);
        });
      }

      container.querySelector('#lineGrantAllVisibleBtn')?.addEventListener('click', () => {
        container.querySelectorAll('.matrix-perm-cb').forEach(cb => cb.checked = true);
      });
      container.querySelector('#lineClearAllVisibleBtn')?.addEventListener('click', () => {
        container.querySelectorAll('.matrix-perm-cb').forEach(cb => cb.checked = false);
      });

      container.querySelectorAll('.matrix-row-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const lKey = btn.getAttribute('data-line-key');
          const cbs = container.querySelectorAll(`.matrix-perm-cb[data-line-key="${lKey}"]`);
          const allChecked = Array.from(cbs).every(cb => cb.checked);
          cbs.forEach(cb => cb.checked = !allChecked);
        });
      });

      container.querySelector('#saveAllLinePermsBtn')?.addEventListener('click', async () => {
        const rows = container.querySelectorAll('#linePermMatrixTable tbody tr');
        if (targetType === 'role') {
          const targetRole = roles.find(r => r.id === selectedRoleId);
          if (!targetRole) return;
          if (!targetRole.lineItemPermissions) targetRole.lineItemPermissions = {};

          rows.forEach(tr => {
            const lKey = tr.getAttribute('data-line-key');
            if (!lKey) return;
            const perms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = tr.querySelector(`.matrix-perm-cb[data-op="${op.key}"]`);
              perms[op.key] = cb ? cb.checked : false;
            });
            targetRole.lineItemPermissions[lKey] = perms;
          });

          await db.saveRole(targetRole);
          await db.logAudit({
            category: 'roles',
            action: 'UPDATE',
            recordId: targetRole.id,
            description: `Saved batch line-item permissions for role "${targetRole.name}"`
          });
          Utils.showToast(`Batch line-item permissions saved for role "${targetRole.name}"!`, 'success');
        } else {
          const targetUser = users.find(u => u.id === selectedUserId);
          if (!targetUser) return;
          if (!targetUser.lineItemOverrides) targetUser.lineItemOverrides = {};

          rows.forEach(tr => {
            const lKey = tr.getAttribute('data-line-key');
            if (!lKey) return;
            const perms = {};
            Auth.OPERATIONS.forEach(op => {
              const cb = tr.querySelector(`.matrix-perm-cb[data-op="${op.key}"]`);
              perms[op.key] = cb ? cb.checked : false;
            });
            targetUser.lineItemOverrides[lKey] = perms;
          });

          await db.saveUser(targetUser);
          await db.logAudit({
            category: 'users',
            action: 'UPDATE',
            recordId: targetUser.id,
            description: `Saved batch line-item permission overrides for user "${targetUser.name}"`
          });
          Utils.showToast(`Batch line-item permission overrides saved for user "${targetUser.name}"!`, 'success');
        }
      });
    };

    renderGrid();
  },

  // ─── 13. Cloud Sync & Work Cloud Settings ───
  async renderCloudSync(container) {
    const config = (typeof CloudSyncModule !== 'undefined') ? CloudSyncModule._config : { enabled: false, url: '', anonKey: '' };
    const status = (typeof CloudSyncModule !== 'undefined') ? CloudSyncModule._status : 'local';

    let bannerClass = 'local';
    let bannerIcon = '☁️';
    let bannerTitle = 'Trial / Local Storage Mode';
    let bannerDesc = 'Application is currently storing data in your browser (IndexedDB). You can share this app via GitHub Pages / Vercel for testing, and connect a cloud database below for real-time multi-user synchronization.';

    if (status === 'connected') {
      bannerClass = 'connected';
      bannerIcon = '🟢';
      bannerTitle = 'Connected to Cloud Backend';
      bannerDesc = `Active connection established to ${config.url}. Real-time multi-user updates and automated data persistence are active.`;
    } else if (status === 'error') {
      bannerClass = 'error';
      bannerIcon = '⚠️';
      bannerTitle = 'Cloud Disconnected';
      bannerDesc = `Could not reach cloud database (${CloudSyncModule._lastError || 'Connection error'}). Working safely in local offline trial mode.`;
    }

    container.innerHTML = `
      <div class="page-header">
        <h2>Cloud Sync & Work Cloud Settings</h2>
        <p>Manage cloud database synchronization for multi-user trials and future enterprise deployment</p>
      </div>

      <div class="cloud-status-banner ${bannerClass}">
        <div>
          <div style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span>${bannerIcon}</span> <span>${bannerTitle}</span>
          </div>
          <div style="font-size: 0.88rem; margin-top: 4px; opacity: 0.9;">
            ${bannerDesc}
          </div>
        </div>
        ${config.lastSyncTimestamp ? `<div style="font-size: 0.8rem; font-family: var(--font-mono); opacity: 0.8;">Last Synced: ${new Date(config.lastSyncTimestamp).toLocaleTimeString()}</div>` : ''}
      </div>

      <div class="grid grid-cols-2 gap-lg mb-lg">
        <!-- Cloud Connection Configuration -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Cloud Database Configuration</div>
              <div class="card-subtitle">Connect a PostgreSQL / Supabase cloud instance for multi-user sync</div>
            </div>
            <span class="badge ${status === 'connected' ? 'badge-emerald' : 'badge-amber'}">${status.toUpperCase()}</span>
          </div>
          <div class="card-body">
            <form id="cloudConfigForm" onsubmit="event.preventDefault();">
              <div class="form-group mb-md">
                <label class="form-label">Backend Provider</label>
                <select class="form-select" id="cloudProvider">
                  <option value="supabase" ${config.provider === 'supabase' ? 'selected' : ''}>Supabase (PostgreSQL + Real-Time Engine)</option>
                  <option value="work-cloud" ${config.provider === 'work-cloud' ? 'selected' : ''}>Work Cloud / Internal REST PostgreSQL</option>
                </select>
              </div>

              <div class="form-group mb-md">
                <label class="form-label">Cloud Project URL</label>
                <input type="url" class="form-input" id="cloudUrl" placeholder="https://your-project.supabase.co" value="${config.url || ''}">
                <small class="text-secondary" style="font-size: 0.78rem;">Your Supabase Project URL or official work cloud API endpoint.</small>
              </div>

              <div class="form-group mb-md">
                <label class="form-label">API Key / Anon Public Key</label>
                <input type="password" class="form-input" id="cloudAnonKey" placeholder="eyJhbGciOi..." value="${config.anonKey || ''}">
                <small class="text-secondary" style="font-size: 0.78rem;">Public Anonymous Client Key for database REST API.</small>
              </div>

              <div class="flex items-center justify-between mt-lg pt-md" style="border-top: 1px solid var(--border-color);">
                <button type="button" class="btn btn-secondary" id="testCloudBtn">🔌 Test Connection</button>
                <div class="flex gap-sm">
                  <button type="button" class="btn btn-ghost text-danger" id="disconnectCloudBtn" ${!config.url ? 'style="display:none;"' : ''}>Disconnect</button>
                  <button type="button" class="btn btn-primary" id="saveCloudBtn">Save & Connect</button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Two-Way Data Synchronization Actions -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Data Migration & Sync Tools</div>
              <div class="card-subtitle">Push local trial data to cloud or restore cloud database to local</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-md">
              <div style="background: var(--bg-tertiary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">⬆️ Push Local Data to Cloud Database</div>
                <p class="text-secondary" style="font-size: 0.82rem; margin-bottom: 12px;">Uploads all local master data, budget lines, employees, and settings into your cloud tables.</p>
                <button type="button" class="btn btn-primary btn-sm" id="uploadCloudBtn" ${status !== 'connected' ? 'disabled' : ''}>
                  Upload All to Cloud Database
                </button>
              </div>

              <div style="background: var(--bg-tertiary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">⬇️ Pull Cloud Data to Local Cache</div>
                <p class="text-secondary" style="font-size: 0.82rem; margin-bottom: 12px;">Refreshes your local browser database with the latest state from the cloud database.</p>
                <button type="button" class="btn btn-secondary btn-sm" id="downloadCloudBtn" ${status !== 'connected' ? 'disabled' : ''}>
                  Download from Cloud Database
                </button>
              </div>

              <div id="syncProgressNotice" style="display: none; padding: 10px 14px; border-radius: var(--radius-md); background: rgba(59, 130, 246, 0.1); color: #2563eb; font-size: 0.85rem; font-weight: 600;">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cloud Deployment & Work Cloud Guide -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🚀 Deployment Lifecycle: Trial → Work Cloud</div>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3 gap-md">
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: var(--accent-primary);">1. Trial Web App</div>
              <p class="text-secondary" style="font-size: 0.82rem; line-height: 1.5;">
                Your repository has GitHub Pages and Vercel configs ready. Once pushed to GitHub, stakeholders can open the live link and test instantly on any device.
              </p>
            </div>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: var(--accent-primary);">2. Trial Cloud Database</div>
              <p class="text-secondary" style="font-size: 0.82rem; line-height: 1.5;">
                Create a free Supabase project, execute the SQL schema from <code>cloud/schema.sql</code>, enter the URL and Anon Key above, and click <strong>Upload All to Cloud</strong>.
              </p>
            </div>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: var(--accent-primary);">3. Official Work Cloud</div>
              <p class="text-secondary" style="font-size: 0.82rem; line-height: 1.5;">
                When ready for enterprise deployment on your company cloud (AWS / Azure / GCP), execute <code>cloud/schema.sql</code> on your internal PostgreSQL instance and switch the URL.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const testBtn = Utils.$('#testCloudBtn');
    const saveBtn = Utils.$('#saveCloudBtn');
    const disconnectBtn = Utils.$('#disconnectCloudBtn');
    const uploadBtn = Utils.$('#uploadCloudBtn');
    const downloadBtn = Utils.$('#downloadCloudBtn');
    const progressNotice = Utils.$('#syncProgressNotice');

    if (testBtn) {
      testBtn.onclick = async () => {
        const url = Utils.$('#cloudUrl').value.trim();
        const anonKey = Utils.$('#cloudAnonKey').value.trim();
        if (!url || !anonKey) {
          Utils.showToast('Please enter both Project URL and Public API Key', 'warning');
          return;
        }
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        const res = await CloudSyncModule.testConnection(url, anonKey);
        testBtn.disabled = false;
        testBtn.textContent = '🔌 Test Connection';
        if (res.success) {
          Utils.showToast('✓ Cloud connection successful!', 'success');
        } else {
          Utils.showToast(`Connection failed: ${res.message}`, 'danger');
        }
      };
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        const url = Utils.$('#cloudUrl').value.trim();
        const anonKey = Utils.$('#cloudAnonKey').value.trim();
        const provider = Utils.$('#cloudProvider').value;
        if (!url || !anonKey) {
          Utils.showToast('Please enter both Project URL and API Key', 'warning');
          return;
        }
        CloudSyncModule.saveConfig({ enabled: true, url, anonKey, provider });
        Utils.showToast('Cloud configuration saved & connecting...', 'success');
        setTimeout(() => this.renderCloudSync(container), 800);
      };
    }

    if (disconnectBtn) {
      disconnectBtn.onclick = () => {
        CloudSyncModule.saveConfig({ enabled: false, url: '', anonKey: '' });
        Utils.showToast('Disconnected from cloud backend. Switched to local trial mode.', 'info');
        this.renderCloudSync(container);
      };
    }

    if (uploadBtn) {
      uploadBtn.onclick = async () => {
        if (!confirm('This will upload all local master data and budget line items to the connected cloud database. Continue?')) return;
        uploadBtn.disabled = true;
        progressNotice.style.display = 'block';
        try {
          await CloudSyncModule.uploadAllToCloud((msg) => {
            progressNotice.textContent = msg;
          });
          Utils.showToast('✓ All local data successfully uploaded to cloud!', 'success');
        } catch (err) {
          Utils.showToast(`Upload failed: ${err.message}`, 'danger');
        } finally {
          uploadBtn.disabled = false;
          setTimeout(() => { progressNotice.style.display = 'none'; }, 4000);
        }
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = async () => {
        if (!confirm('This will download all data from the cloud database and overwrite local cache. Continue?')) return;
        downloadBtn.disabled = true;
        progressNotice.style.display = 'block';
        try {
          await CloudSyncModule.downloadAllFromCloud((msg) => {
            progressNotice.textContent = msg;
          });
          Utils.showToast('✓ All data successfully synced from cloud database!', 'success');
          if (typeof App !== 'undefined' && App.renderActiveModule) {
            App.renderActiveModule();
          }
        } catch (err) {
          Utils.showToast(`Download failed: ${err.message}`, 'danger');
        } finally {
          downloadBtn.disabled = false;
          setTimeout(() => { progressNotice.style.display = 'none'; }, 4000);
        }
      };
    }
  },

  openSettingsModal(tab = 'cloud-sync') {
    if (tab === 'cloud-sync') {
      if (typeof App !== 'undefined' && App.navigateTo) {
        App.navigateTo('config-cloud-sync');
      }
    }
  }
};

window.ConfigModule = ConfigModule;

