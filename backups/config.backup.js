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

  showEntityForm(entity = null) {
    const isEdit = !!entity;
    const content = `
      <form id="entityForm">
        <div class="form-group">
          <label class="form-label">Full Entity Name</label>
          <input type="text" class="form-input" id="entityName" value="${entity?.name || ''}" placeholder="e.g. Noora Health India Private Limited" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Short Name / Entity</label>
            <input type="text" class="form-input" id="entityShort" value="${entity?.shortName || ''}" placeholder="e.g. NHIPL" required>
          </div>
          <div class="form-group">
            <label class="form-label">Country Code (Dept Prefix)</label>
            <input type="text" class="form-input" id="entityPrefix" value="${entity?.deptPrefix || ''}" placeholder="e.g. IN" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" class="form-input" id="entityCountry" value="${entity?.country || ''}" placeholder="e.g. India" required>
          </div>
          <div class="form-group">
            <label class="form-label">Local Currency</label>
            <input type="text" class="form-input" id="entityCurrency" value="${entity?.currency || ''}" placeholder="e.g. INR" required>
          </div>
          <div class="form-group">
            <label class="form-label">Flag Emoji</label>
            <input type="text" class="form-input" id="entityFlag" value="${entity?.flag || '🏳️'}" placeholder="e.g. 🇮🇳">
          </div>
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
            const data = {
              id: entity?.id || Utils.slugify(Utils.$('#entityShort').value),
              name: Utils.$('#entityName').value,
              shortName: Utils.$('#entityShort').value,
              deptPrefix: Utils.$('#entityPrefix').value.toUpperCase(),
              countryCode: Utils.$('#entityPrefix').value.toUpperCase(),
              country: Utils.$('#entityCountry').value,
              currency: Utils.$('#entityCurrency').value.toUpperCase(),
              flag: Utils.$('#entityFlag').value || '🏳️'
            };
            await db.put(STORES.entities, data);
            Utils.showToast(`Entity ${data.shortName} saved!`, 'success');
            close();
            App.renderCurrentPage();
          }
        }));
      }
    });
  },

  async editEntity(id) {
    const entity = await db.get(STORES.entities, id);
    if (entity) this.showEntityForm(entity);
  },

  async deleteEntity(id) {
    if (await Utils.confirm('Are you sure you want to delete this entity?')) {
      await db.delete(STORES.entities, id);
      Utils.showToast('Entity deleted', 'info');
      App.renderCurrentPage();
    }
  },

  // ─── 2. Departments Configuration ───
  async renderDepartments(container) {
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
    const entities = await db.getAll(STORES.entities);

    container.innerHTML = `
      <div class="page-header">
        <h2>Departments Master Configuration</h2>
        <p>Define global, digital product, and country-specific department templates</p>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div>
            <div class="card-title">Master Department Templates (${departments.length})</div>
            <div class="card-subtitle">Country-specific departments auto-prefix with each country's code</div>
          </div>
          <button class="btn btn-primary" id="addDeptBtn">+ Add Department</button>
        </div>

        <div class="config-list" id="departmentsList">
          ${departments.map(d => {
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
                    <div class="item-name">${d.number ? d.number + '. ' : ''}<code>${d.codeTemplate}</code> — ${d.name} ${scopeBadges[d.scope] || ''}</div>
                    <div class="item-detail">Scope: ${d.scope} | Target Template: <code>${d.codeTemplate}</code></div>
                  </div>
                </div>
                <div class="item-actions">
                  <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editDepartment('${d.id}')">✏️ Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDepartment('${d.id}')">🗑️ Delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    Utils.$('#addDeptBtn').addEventListener('click', () => this.showDeptForm());
  },

  showDeptForm(dept = null) {
    const isEdit = !!dept;
    const content = `
      <form id="deptForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Number / Order Prefix</label>
            <input type="text" class="form-input" id="deptNum" value="${dept?.number || ''}" placeholder="e.g. 1">
          </div>
          <div class="form-group">
            <label class="form-label">Code Template (Use {CC} for Country Code)</label>
            <input type="text" class="form-input" id="deptCode" value="${dept?.codeTemplate || ''}" placeholder="e.g. {CC}-PDD-MED" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Department / Activity Name</label>
          <input type="text" class="form-input" id="deptName" value="${dept?.name || ''}" placeholder="e.g. Framework designing & Content creation" required>
        </div>
        <div class="form-group">
          <label class="form-label">Scope</label>
          <select class="form-select" id="deptScope">
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
          className: 'btn btn-primary',
          textContent: isEdit ? 'Save Changes' : 'Add Department',
          onClick: async () => {
            const data = {
              id: dept?.id || Utils.slugify(Utils.$('#deptCode').value),
              number: Utils.$('#deptNum').value,
              codeTemplate: Utils.$('#deptCode').value,
              name: Utils.$('#deptName').value,
              scope: Utils.$('#deptScope').value
            };
            await db.put(STORES.departments, data);
            Utils.showToast(`Department saved!`, 'success');
            close();
            App.renderCurrentPage();
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
      Utils.showToast('Department deleted', 'info');
      App.renderCurrentPage();
    }
  },

  // ─── 3. Budget Year Setup ───
  async renderBudgetYear(container) {
    const budgetYears = await db.getAll(STORES.budgetYears);
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);

    container.innerHTML = `
      <div class="page-header">
        <h2>Budget Year & Exchange Rates Setup</h2>
        <p>Define active budget cycles, USD exchange rates, and active departments per entity</p>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div>
            <div class="card-title">Budget Cycles (${budgetYears.length})</div>
            <div class="card-subtitle">Budgets run on Calendar Year (Jan–Dec)</div>
          </div>
          <button class="btn btn-primary" id="addYearBtn">+ Create Budget Year</button>
        </div>

        <div class="config-list">
          ${budgetYears.length === 0 ? `
            <div class="empty-state p-md">
              <p>No budget year configured yet. Click "+ Create Budget Year" to initialize CY-2026.</p>
            </div>
          ` : budgetYears.map(y => `
            <div class="config-list-item">
              <div class="item-info">
                <span class="status-dot ${y.status === 'active' ? 'active' : 'draft'}"></span>
                <div>
                  <div class="item-name">Calendar Year ${y.year} <span class="badge badge-${y.status === 'active' ? 'emerald' : 'amber'}">${y.status}</span></div>
                  <div class="item-detail">Prior Actuals Available: Jan–${y.actualsThroughMonth || 'Oct'} | Conversion Rates set for 5 currencies</div>
                </div>
              </div>
              <div class="item-actions">
                <button class="btn btn-ghost btn-sm" onclick="ConfigModule.configureYearRates('${y.id}')">💱 Rates</button>
                <button class="btn btn-ghost btn-sm" onclick="ConfigModule.configureYearDepts('${y.id}')">🏛️ Dept Activation</button>
                <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteBudgetYear('${y.id}')">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Utils.$('#addYearBtn').addEventListener('click', () => this.showBudgetYearForm());
  },

  showBudgetYearForm() {
    const currentYear = Utils.getCurrentYear();
    const content = `
      <form id="yearForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Calendar Year</label>
            <input type="number" class="form-input" id="yearNum" value="${currentYear + 1}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="yearStatus">
              <option value="active">Active (Open for Budgeting)</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Prior-Year Actuals Available Through Month</label>
          <select class="form-select" id="actualsThroughMonth">
            <option value="Sep">September (Jan-Sep)</option>
            <option value="Oct" selected>October (Jan-Oct)</option>
            <option value="Nov">November (Jan-Nov)</option>
          </select>
        </div>

        <h4 class="mt-md mb-md">Approved Currency Exchange Rates to USD (Fixed for the Year)</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">1 USD = INR (India)</label>
            <input type="number" step="0.01" class="form-input" id="rateINR" value="83.50">
          </div>
          <div class="form-group">
            <label class="form-label">1 USD = BDT (Bangladesh)</label>
            <input type="number" step="0.01" class="form-input" id="rateBDT" value="117.00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">1 USD = IDR (Indonesia)</label>
            <input type="number" step="1" class="form-input" id="rateIDR" value="16200">
          </div>
          <div class="form-group">
            <label class="form-label">1 USD = NPR (Nepal)</label>
            <input type="number" step="0.01" class="form-input" id="rateNPR" value="133.50">
          </div>
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
            const yearId = yearVal.toString();

            const yearObj = {
              id: yearId,
              year: parseInt(yearVal),
              status: Utils.$('#yearStatus').value,
              actualsThroughMonth: Utils.$('#actualsThroughMonth').value,
              conversionRates: {
                USD: 1.0,
                INR: parseFloat(Utils.$('#rateINR').value) || 83.5,
                BDT: parseFloat(Utils.$('#rateBDT').value) || 117.0,
                IDR: parseFloat(Utils.$('#rateIDR').value) || 16200,
                NPR: parseFloat(Utils.$('#rateNPR').value) || 133.5
              }
            };

            await db.put(STORES.budgetYears, yearObj);

            // Automatically activate all departments for all entities by default
            const entities = await db.getAll(STORES.entities);
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

            Utils.showToast(`Budget Year ${yearVal} created!`, 'success');
            close();
            App.populateGlobalSelectors();
            App.renderCurrentPage();
          }
        }));
      }
    });
  },

  async configureYearRates(yearId) {
    const year = await db.get(STORES.budgetYears, yearId);
    if (!year) return;

    const rates = year.conversionRates || { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 };

    const content = `
      <form id="ratesForm">
        <p class="mb-md">Set the pre-approved annual conversion rates to USD for <strong>CY-${year.year}</strong>:</p>
        <div class="form-row mb-sm">
          <div class="form-group">
            <label class="form-label">1 USD = INR (India)</label>
            <input type="number" step="0.01" class="form-input" id="rateINR" value="${rates.INR}">
          </div>
          <div class="form-group">
            <label class="form-label">1 USD = BDT (Bangladesh)</label>
            <input type="number" step="0.01" class="form-input" id="rateBDT" value="${rates.BDT}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">1 USD = IDR (Indonesia)</label>
            <input type="number" step="1" class="form-input" id="rateIDR" value="${rates.IDR}">
          </div>
          <div class="form-group">
            <label class="form-label">1 USD = NPR (Nepal)</label>
            <input type="number" step="0.01" class="form-input" id="rateNPR" value="${rates.NPR}">
          </div>
        </div>
      </form>
    `;

    Utils.showModal(`Exchange Rates — CY ${year.year}`, content, {
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Save Rates',
          onClick: async () => {
            year.conversionRates = {
              USD: 1.0,
              INR: parseFloat(Utils.$('#rateINR').value) || 83.5,
              BDT: parseFloat(Utils.$('#rateBDT').value) || 117.0,
              IDR: parseFloat(Utils.$('#rateIDR').value) || 16200,
              NPR: parseFloat(Utils.$('#rateNPR').value) || 133.5
            };
            await db.put(STORES.budgetYears, year);
            Utils.showToast('Rates updated successfully!', 'success');
            close();
            App.renderCurrentPage();
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
    configs.forEach(c => { configMap[`${c.yearId}_${c.entityId}_${c.deptId}`] = c.isActive; });

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
      const checklistContainer = content.querySelector('#deptChecklist');

      checklistContainer.innerHTML = departments.map(d => {
        const key = `${yearId}_${entityId}_${d.id}`;
        const isChecked = configMap[key] !== false;
        const displayName = Utils.getDeptName(d, entity.deptPrefix);

        return `
          <label class="form-checkbox p-sm" style="border-bottom: 1px solid var(--border-subtle);">
            <input type="checkbox" data-key="${key}" ${isChecked ? 'checked' : ''}>
            <span>${displayName} <span class="text-tertiary">(${d.name})</span></span>
          </label>
        `;
      }).join('');
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

    content.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        configMap[e.target.dataset.key] = e.target.checked;
      }
    });

    Utils.showModal(`Department Activation — CY ${year.year}`, content, {
      size: 'lg',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary', textContent: 'Save Activation Settings',
          onClick: async () => {
            for (const [key, isActive] of Object.entries(configMap)) {
              const [yId, entId, dId] = key.split('_');
              await db.put(STORES.entityDeptConfig, {
                id: key,
                yearId: yId,
                entityId: entId,
                deptId: dId,
                isActive
              });
            }
            Utils.showToast('Department activations updated!', 'success');
            close();
          }
        }));
      }
    });
  },

  async deleteBudgetYear(id) {
    if (await Utils.confirm('Are you sure you want to delete this budget year? All entries under it will be lost.')) {
      await db.delete(STORES.budgetYears, id);
      Utils.showToast('Budget year deleted', 'info');
      App.populateGlobalSelectors();
      App.renderCurrentPage();
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
    const coa = await db.getAll(STORES.chartOfAccounts);

    container.innerHTML = `
      <div class="page-header">
        <h2>Non-Payroll Chart of Accounts</h2>
        <p>Master account hierarchy (Sub Group → Parent Account → GL Description → Ledger Code)</p>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title">GL Line Items (${coa.length})</div>
          <button class="btn btn-primary" id="addCoaBtn">+ Add Account Line</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sub Group</th>
                <th>Parent Account</th>
                <th>GL Description</th>
                <th>Ledger Code</th>
                <th style="width: 80px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${coa.map(c => `
                <tr>
                  <td><span class="badge badge-cyan">${c.subGroup}</span></td>
                  <td><strong>${c.parentAccount}</strong></td>
                  <td>${c.glDescription}</td>
                  <td><code>${c.ledgerCode}</code></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteDimensionItem('${STORES.chartOfAccounts}', ${c.id})">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

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
              const data = {
                subGroup: Utils.$('#coaSubGroup').value,
                parentAccount: Utils.$('#coaParent').value,
                glDescription: Utils.$('#coaGl').value,
                ledgerCode: Utils.$('#coaCode').value
              };
              await db.add(STORES.chartOfAccounts, data);
              Utils.showToast('Account line added!', 'success');
              close();
              App.renderCurrentPage();
            }
          }));
        }
      });
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
      const entities = (await db.getAll(STORES.entities)) || [];
      const departments = (await db.getAll(STORES.departments)) || [];
      const years = (await db.getAll(STORES.budgetYears)) || [];
      let allEmployees = (await db.getEmployeesMaster()) || [];
      let selectedEntityId = 'all';
      let selectedDeptId = 'all';
      let searchQuery = '';

      // Exchange rates
      const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || {
        conversionRates: { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 }
      };
      const rates = currentYearObj.conversionRates || { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 };

      const getRateForEntity = (ent) => {
        if (!ent || !ent.currency || ent.currency === 'USD') return 1.0;
        return rates[ent.currency] || 1.0;
      };

      const toUSD = (amount, ent) => {
        const r = getRateForEntity(ent);
        return Utils.convertToUSD(amount, r);
      };

      const getAvailableDepartments = (entityId) => {
        if (!entityId || entityId === 'all') return [];
        const filtered = departments.filter(d => {
          if (d.entityMapping && typeof d.entityMapping[entityId] !== 'undefined') {
            return d.entityMapping[entityId] === true;
          }
          // NHIPL also shows GL departments
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
        const activeEntity = entities.find(e => e.id === selectedEntityId);
        const availableDepts = getAvailableDepartments(selectedEntityId);

        // Reset dept filter when switching to all entities or when dept not in available list
        if (isAllEntities || (selectedDeptId !== 'all' && !availableDepts.some(d => d.id === selectedDeptId))) {
          selectedDeptId = 'all';
        }

        let filtered = [...allEmployees];

        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(e => e.entityId === selectedEntityId);
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
          const ent = entities.find(x => x.id === e.entityId) || entities[0];
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
                <div class="metric-subtext">Consolidated USD reporting across all entities</div>
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
                  <option value="all">🏢 All Entities (USD Reporting)</option>
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
                <span class="badge badge-subtle font-mono">${filtered.length} of ${allEmployees.length} Shown</span>
              </div>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="sticky-col-1">Employee Code</th>
                    <th class="sticky-col-2">Name of Employee</th>
                    <th>Band</th>
                    ${isAllEntities ? '<th>Entity</th>' : ''}
                    <th>Date of Joining</th>
                    <th>Department</th>
                    <th>Reporting Manager</th>
                    <th class="num font-bold">${isAllEntities ? 'Annual CTC (USD / Local)' : `Annual CTC (${activeEntity.currency} &amp; USD)`}</th>
                    <th class="num font-bold" style="color: var(--accent-primary);">${isAllEntities ? 'Monthly CTC (USD / Local)' : `Monthly CTC (${activeEntity.currency} &amp; USD)`}</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="10" class="text-center text-muted" style="padding: 32px;">
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
                        <td class="sticky-col-1 font-mono font-bold">
                          <span class="badge badge-subtle font-mono font-bold" style="font-size: 11px;">${e.employeeCode || '—'}</span>
                        </td>
                        <td class="sticky-col-2">
                          <div class="font-bold flex items-center gap-xs">
                            <span>👤</span>
                            <span>${e.name || 'Unnamed Staff'}</span>
                          </div>
                          ${e.designation ? `<div class="text-tertiary" style="font-size: 11px;">${e.designation}</div>` : ''}
                        </td>
                        <td>
                          <span class="badge badge-cyan font-bold">${e.band || 'NH3'}</span>
                        </td>
                        ${isAllEntities ? `<td><span class="badge badge-subtle" style="font-size: 11px;">${ent.flag} ${ent.shortName}</span></td>` : ''}
                        <td style="font-size: 12px; font-family: var(--font-mono);">
                          ${e.doj ? Utils.formatDate(e.doj) : '—'}
                        </td>
                        <td>
                          <span class="badge badge-subtle font-mono font-bold" title="${e.department || deptObj.name || ''}">${deptShort}</span>
                        </td>
                        <td>
                          ${e.reportingManager ? `<span>👔 ${e.reportingManager}</span>` : '<span class="text-tertiary">—</span>'}
                        </td>
                        <td class="num font-mono">
                          ${isAllEntities ? `
                            <div class="font-bold" style="color: var(--accent-primary); font-size: 13px;">${Utils.formatCurrency(aUSD, 'USD')}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary" style="font-size: 11px;">(${Utils.formatCurrency(aCTC, empCurr)})</div>` : ''}
                          ` : `
                            <div class="font-bold" style="font-size: 13px;">${Utils.formatCurrency(aCTC, empCurr)}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary font-bold" style="font-size: 11px; color: var(--accent-primary);">≈ ${Utils.formatCurrency(aUSD, 'USD')}</div>` : ''}
                          `}
                        </td>
                        <td class="num font-mono" style="background: rgba(6, 182, 212, 0.04);">
                          ${isAllEntities ? `
                            <div class="font-bold" style="color: var(--accent-secondary); font-size: 13px;">${Utils.formatCurrency(mUSD, 'USD')}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary" style="font-size: 11px;">(${Utils.formatCurrency(mCTC, empCurr)})</div>` : ''}
                          ` : `
                            <div class="font-bold" style="font-size: 13px; color: var(--accent-primary);">${Utils.formatCurrency(mCTC, empCurr)}</div>
                            ${empCurr !== 'USD' ? `<div class="text-tertiary font-bold" style="font-size: 11px; color: var(--accent-secondary);">≈ ${Utils.formatCurrency(mUSD, 'USD')}</div>` : ''}
                          `}
                        </td>
                        <td>
                          <span class="badge ${e.status === 'Inactive' ? 'badge-subtle' : 'badge-emerald'}">
                            ${e.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-ghost btn-sm" onclick="ConfigModule.editEmployeeMaster(${e.id})">✏️ Edit</button>
                          <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteEmployeeMaster(${e.id})">🗑️</button>
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
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);
    const years = await db.getAll(STORES.budgetYears);
    const allEmployees = await db.getEmployeesMaster();
    const managerNames = Array.from(new Set(allEmployees.map(e => e.name).filter(Boolean)));

    const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || {
      conversionRates: { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 }
    };
    const rates = currentYearObj.conversionRates || { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 };

    const defaultEntity = entities.find(e => e.id === existing?.entityId) || entities[0];
    const aCTC = existing?.annualCTC || 0;
    const mCTC = existing?.monthlyCTC || Math.round(aCTC / 12);
    const rate = rates[defaultEntity?.currency] || 1.0;
    const usdVal = Utils.convertToUSD(aCTC, rate);

    const getAvailableDeptsForEntity = (entityId) => {
      const filtered = departments.filter(d => {
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
            <input type="text" class="form-input font-mono" id="mEmpCode" value="${existing?.employeeCode || 'NH-' + Math.floor(1000 + Math.random() * 9000)}" placeholder="e.g. NH-1045" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Name of the Employee</label>
            <input type="text" class="form-input" id="mEmpName" value="${existing?.name || ''}" placeholder="e.g. Simerneet Bajwa" required>
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
            <input type="text" class="form-input" id="mEmpManager" list="managerSuggestions" value="${existing?.reportingManager || ''}" placeholder="e.g. Dr. Shahed Alam">
            <datalist id="managerSuggestions">
              ${managerNames.map(m => `<option value="${m}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Designation / Role</label>
            <input type="text" class="form-input" id="mEmpDesignation" value="${existing?.designation || ''}" placeholder="e.g. Senior Health Communications Lead">
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

            const deptSelect = Utils.$('#mEmpDept');
            const deptId = deptSelect.value;
            const deptName = deptSelect.selectedOptions[0]?.dataset?.name || deptSelect.selectedOptions[0]?.textContent || deptId;
            const annualCTC = Utils.parseNumber(Utils.$('#mEmpAnnualCTC').value) || 0;
            const monthlyCTC = Math.round(annualCTC / 12);

            const data = {
              ...(existing || {}),
              employeeCode: code,
              name,
              band: Utils.$('#mEmpBand').value,
              doj: Utils.$('#mEmpDoj').value,
              entityId: Utils.$('#mEmpEntity').value,
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
      XLSX.utils.book_append_sheet(wb, ws, 'Employees Master');
      XLSX.writeFile(wb, 'Employees_Master_Bulk_Upload_Template.xlsx');
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...sampleRows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "Employees_Master_Bulk_Upload_Template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    Utils.showToast('Employee Master template downloaded!', 'success');
  },

  async downloadEmployeeMasterData() {
    const employees = this._currentFilteredEmployees && this._currentFilteredEmployees.length > 0 
      ? this._currentFilteredEmployees 
      : (await db.getEmployeesMaster());
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);
    const years = await db.getAll(STORES.budgetYears);
    const currentYearObj = years.find(y => y.id === App.selectedYear) || years[0] || {
      conversionRates: { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 }
    };
    const rates = currentYearObj.conversionRates || { USD: 1.0, INR: 83.5, BDT: 117.0, IDR: 16200, NPR: 133.5 };

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

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
        { wch: 10 }, { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 32 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Employees Master');
      XLSX.writeFile(wb, 'Employees_Master_Data_Export.xlsx');
      Utils.showToast(`Downloaded ${employees.length} Employee records successfully!`, 'success');
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "Employees_Master_Data_Export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      Utils.showToast(`Downloaded ${employees.length} Employee records successfully!`, 'success');
    }
  },

  async showEmployeeMasterUploadModal() {
    const entities = await db.getAll(STORES.entities);
    const departments = await db.getAll(STORES.departments);
    let parsedEmployees = [];

    const content = `
      <div id="bulkUploadModalBody" style="font-size: var(--font-size-sm);">
        <div class="card p-md mb-md" style="background: rgba(6, 182, 212, 0.04); border: 1.5px dashed rgba(6, 182, 212, 0.4);">
          <div class="flex justify-between items-center mb-sm flex-wrap gap-xs">
            <h4 style="font-weight: 700;">Select or Drop Excel (.xlsx, .xls) or CSV (.csv) File</h4>
            <button type="button" class="btn btn-secondary btn-sm" onclick="ConfigModule.downloadEmployeeMasterTemplate()">📥 Download Template</button>
          </div>
          <p class="text-tertiary mb-sm" style="font-size: 11px;">Upload your spreadsheet containing Employee Code, Name, Band, Date of Joining, Legal Entity, Department, Reporting Manager, Designation, Annual CTC, and Status.</p>
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

            for (const emp of parsedEmployees) {
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

            Utils.showToast(`Successfully uploaded in single go! (${addedCount} added, ${updatedCount} updated)`, 'success');
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
            ) || entities[0];

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
    const customFields = await db.getAllImpCustomRateFields();
    const templates = await db.getAllImpActivityTemplates();

    container.innerHTML = `
      <div class="page-header flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
        <div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-emerald font-bold">IMP BENCHMARK MASTER</span>
            <span class="badge badge-cyan font-bold">${allRates.length} Benchmark Sheets</span>
            <span class="badge badge-indigo font-bold">${templates.length} Activity Templates (10.1 - 10.8)</span>
          </div>
          <h2 class="mt-xs">Implementation (IMP) Benchmark Rates & Activity Templates Master</h2>
          <p>Admin Control Center: Configure Benchmark Unit Rates, Add Custom Rate Fields & Build Activity-Specific Templates for Activities 10.1 to 10.6</p>
        </div>
        <div class="flex items-center gap-sm">
          ${this.impRateActiveTab === 'matrix' ? `
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showImpUnitRateForm()">
              ➕ + Add Benchmark Rate
            </button>
          ` : (this.impRateActiveTab === 'custom-fields' ? `
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal()">
              ➕ + Add Custom Rate Field
            </button>
          ` : `
            <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showTemplateLineItemModal()">
              ➕ + Add Cost Line Item
            </button>
          `)}
        </div>
      </div>

      <!-- ─── Admin Navigation Tabs ─── -->
      <div class="tabs mb-md" style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 2px;">
        <button class="tab-btn ${this.impRateActiveTab === 'matrix' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('matrix')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'matrix' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'matrix' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          📊 1. Benchmark Rates Comparison Matrix (${allRates.length})
        </button>
        <button class="tab-btn ${this.impRateActiveTab === 'custom-fields' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('custom-fields')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'custom-fields' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'custom-fields' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'custom-fields' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          ⚙️ 2. Custom Benchmark Rate Fields (${customFields.length})
        </button>
        <button class="tab-btn ${this.impRateActiveTab === 'templates' ? 'active font-bold' : ''}" onclick="ConfigModule.switchImpRateTab('templates')" style="padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; border: 1px solid ${this.impRateActiveTab === 'templates' ? 'var(--accent-primary)' : 'transparent'}; background: ${this.impRateActiveTab === 'templates' ? 'var(--bg-secondary)' : 'transparent'}; color: ${this.impRateActiveTab === 'templates' ? 'var(--accent-primary)' : 'var(--text-secondary)'}; font-size: 13px;">
          📋 3. Activity Templates & Line Items Builder (10.1 to 10.6)
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
      await this.renderImpCustomFieldsTab(tabContainer, customFields);
    } else if (this.impRateActiveTab === 'templates') {
      await this.renderImpActivityTemplatesTab(tabContainer, templates, customFields);
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
    const uniqueCountries = Array.from(new Set(allRates.map(r => r.country || (r.location?.includes('India') ? 'India' : (r.location?.includes('Dhaka') || r.location?.includes('Khulna') ? 'Bangladesh' : 'Global'))).filter(Boolean))).sort();
    const uniqueLocations = Array.from(new Set(allRates.map(r => r.location).filter(Boolean))).sort();

    const filteredRates = allRates.filter(r => {
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

    const totalSheets = filteredRates.length;
    const countriesCount = new Set(filteredRates.map(r => r.country || 'India')).size;
    const avgKitCost = totalSheets > 0 ? Math.round(filteredRates.reduce((sum, r) => sum + (r.kitCost || 0), 0) / totalSheets) : 0;
    const avgHotelCost = totalSheets > 0 ? Math.round(filteredRates.reduce((sum, r) => sum + (r.hotelPerDay || 0), 0) / totalSheets) : 0;
    const avgHallCost = totalSheets > 0 ? Math.round(filteredRates.reduce((sum, r) => sum + (r.venueHallPerDay || 0), 0) / totalSheets) : 0;
    const avgPcCab = totalSheets > 0 ? Math.round(filteredRates.reduce((sum, r) => sum + (r.pcCabPerVisit || 0), 0) / totalSheets) : 0;

    container.innerHTML = `
      <!-- Filter Bar -->
      <div class="card mb-md p-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end;">
          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">🏢 Filter Entity:</label>
            <select class="form-select font-bold" id="filterImpRateEntity" onchange="ConfigModule.onImpRateFilterChange('entity', this.value)">
              <option value="all" ${this.impRateEntityFilter === 'all' ? 'selected' : ''}>🌐 All Entities (Global)</option>
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
                  ${c === 'India' ? '🇮🇳 India' : (c === 'Bangladesh' ? '🇧🇩 Bangladesh' : (c === 'Indonesia' ? '🇮🇩 Indonesia' : (c === 'USA' ? '🇺🇸 USA' : '🌐 ' + c)))}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold" style="font-size: 11px; text-transform: uppercase;">📍 Filter Location / State:</label>
            <select class="form-select" id="filterImpRateLocation" onchange="ConfigModule.onImpRateFilterChange('location', this.value)">
              <option value="all" ${this.impRateLocationFilter === 'all' ? 'selected' : ''}>📍 All 5D Locations</option>
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
              ↺ Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px;">
        <div class="card p-sm" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="text-secondary font-bold" style="font-size: 10.5px; text-transform: uppercase;">Active Geographies</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-primary); margin-top: 2px;">
            ${totalSheets} Locations
          </div>
          <div class="text-tertiary" style="font-size: 10.5px;">Across ${countriesCount} Countries</div>
        </div>

        <div class="card p-sm" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="text-secondary font-bold" style="font-size: 10.5px; text-transform: uppercase;">Avg. Collateral Kit</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--success); margin-top: 2px;">
            ₹ ${Utils.formatNumber(avgKitCost)}
          </div>
          <div class="text-tertiary" style="font-size: 10.5px;">Per facility launch kit</div>
        </div>

        <div class="card p-sm" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="text-secondary font-bold" style="font-size: 10.5px; text-transform: uppercase;">Avg. Hotel Benchmark</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #8b5cf6; margin-top: 2px;">
            ₹ ${Utils.formatNumber(avgHotelCost)}
          </div>
          <div class="text-tertiary" style="font-size: 10.5px;">Double Occ. per day</div>
        </div>

        <div class="card p-sm" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="text-secondary font-bold" style="font-size: 10.5px; text-transform: uppercase;">Avg. Hall Rental</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b; margin-top: 2px;">
            ₹ ${Utils.formatNumber(avgHallCost)}
          </div>
          <div class="text-tertiary" style="font-size: 10.5px;">Training venue / day</div>
        </div>

        <div class="card p-sm" style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="text-secondary font-bold" style="font-size: 10.5px; text-transform: uppercase;">Avg. PC Cab Visit</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-secondary); margin-top: 2px;">
            ₹ ${Utils.formatNumber(avgPcCab)}
          </div>
          <div class="text-tertiary" style="font-size: 10.5px;">Supportive supervision</div>
        </div>
      </div>

      <!-- Comparison Matrix Table -->
      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Multi-Entity & Country-Wise Benchmark Comparison Matrix (${filteredRates.length})</div>
            <div class="card-subtitle">Comprehensive multi-location unit rate benchmarks • Dynamic standard & custom rate columns</div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-primary font-bold" style="font-size: 11px;">Single-Page Matrix View</span>
          </div>
        </div>

        ${filteredRates.length === 0 ? `
          <div class="p-lg text-center text-muted">
            <div style="font-size: 1.8rem; margin-bottom: 6px;">🔍</div>
            <p>No benchmark rates match the selected entity, country, or search filters.</p>
            <button class="btn btn-secondary btn-sm" onclick="ConfigModule.resetImpRateFilters()">Reset Filters</button>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table" id="impAllRatesComparisonTable" style="font-size: 11px;">
              <thead>
                <tr>
                  <th class="sticky-col-1" style="min-width: 130px;">Country & Entity</th>
                  <th class="sticky-col-2" style="min-width: 140px;">5D Location Tag</th>
                  <th style="min-width: 120px;">State / Geo Name</th>
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
                  <th style="min-width: 90px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRates.map(r => {
                  const countryFlag = r.country === 'Bangladesh' ? '🇧🇩' : (r.country === 'Indonesia' ? '🇮🇩' : (r.country === 'USA' ? '🇺🇸' : (r.country === 'Global' ? '🌐' : '🇮🇳')));
                  const entityObj = entities.find(e => e.id === r.entityId) || { code: (r.entityId || 'ALL').toUpperCase() };
                  const currSymbol = r.currency === 'BDT' ? '৳' : (r.currency === 'USD' ? '$' : (r.currency === 'IDR' ? 'Rp' : '₹'));

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
                        <button class="btn btn-ghost btn-sm" onclick="ConfigModule.showImpUnitRateForm('${r.location}')" title="Edit rate configuration">✏️ Edit</button>
                        ${r.id ? `<button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteImpUnitRate(${r.id})" title="Delete custom rate">🗑️</button>` : ''}
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

  async showImpUnitRateForm(location = null) {
    let rateObj = null;
    if (location) {
      rateObj = await db.getImpUnitRates(location);
    }

    const isEdit = !!rateObj && !!rateObj.id;
    const customFields = await db.getAllImpCustomRateFields();

    const r = rateObj || {
      entityId: 'nhipl',
      country: 'India',
      stateCode: '',
      location: '',
      stateName: '',
      currency: 'INR',
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
    const dbLocs = await db.getAll(STORES.locations);
    const seedLocs = Object.values(SEED_DATA.locations || {}).flat();
    const allLocations = Array.from(new Set([
      ...dbLocs.map(l => typeof l === 'string' ? l : (l.name || String(l))),
      ...seedLocs,
      'India KA', 'India UP', 'India MH', 'India MP', 'India AP', 'India TS', 'India OR',
      'India PB', 'India HR', 'India TN', 'India RJ', 'India JK', 'India DL', 'India AS',
      'India JH', 'India BR', 'India WB', 'India GA', 'India KL', 'India UT', 'India UK',
      'DHA-Dhaka', 'KHU-Khulna', 'CTG-Chattogram', 'RAJ-Rajshahi', 'BAR-Barishal'
    ])).filter(Boolean).sort();

    const selectedLoc = r.location || (allLocations.includes('India KA') ? 'India KA' : allLocations[0] || '');
    const selectedEntity = r.entityId || 'nhipl';
    const selectedCountry = r.country || (selectedLoc.includes('India') ? 'India' : (selectedLoc.includes('DHA') || selectedLoc.includes('KHU') ? 'Bangladesh' : 'Global'));
    const selectedCurrency = r.currency || (selectedCountry === 'Bangladesh' ? 'BDT' : (selectedCountry === 'USA' ? 'USD' : 'INR'));

    const content = `
      <form id="impRateForm" style="font-size: 13px;">
        <!-- Section 1: Entity, Country & Geography -->
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
          <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
            <span style="font-size: 1.1rem;">📍</span>
            <div>
              <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">1. Entity, Country & 5D Location Identification</div>
              <div class="text-tertiary" style="font-size: 11px;">Assign this benchmark sheet to an Entity, Country, and 5D Location Dimension (D5)</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">🏢 Organization Entity <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateEntity">
                <option value="all" ${selectedEntity === 'all' ? 'selected' : ''}>🌐 All Entities (Global)</option>
                ${entities.map(e => `
                  <option value="${e.id}" ${selectedEntity === e.id ? 'selected' : ''}>🏢 ${e.name} (${e.code || e.id.toUpperCase()})</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">🌍 Country / Geography <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateCountry" onchange="ConfigModule.onRateCountryChanged(this.value)">
                <option value="India" ${selectedCountry === 'India' ? 'selected' : ''}>🇮🇳 India</option>
                <option value="Bangladesh" ${selectedCountry === 'Bangladesh' ? 'selected' : ''}>🇧🇩 Bangladesh</option>
                <option value="Indonesia" ${selectedCountry === 'Indonesia' ? 'selected' : ''}>🇮🇩 Indonesia</option>
                <option value="USA" ${selectedCountry === 'USA' ? 'selected' : ''}>🇺🇸 United States</option>
                <option value="Global" ${selectedCountry === 'Global' ? 'selected' : ''}>🌐 Global / Other</option>
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">📍 5D Location Tag (D5) <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="rateLocation" onchange="ConfigModule.onRateLocationSelected(this.value)" required>
                <option value="">-- Select 5D Location (D5) --</option>
                ${allLocations.map(loc => `
                  <option value="${loc}" ${(selectedLoc === loc) ? 'selected' : ''}>📍 ${loc}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">State / Geo Name <span class="text-danger">*</span></label>
              <input type="text" class="form-input" id="rateStateName" value="${r.stateName || (selectedLoc === 'India KA' ? 'Karnataka' : selectedLoc.replace('India ', ''))}" placeholder="e.g. Karnataka" required>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">State Code</label>
              <input type="text" class="form-input font-mono font-bold" id="rateStateCode" value="${r.stateCode || (selectedLoc === 'India KA' ? 'KA' : selectedLoc.replace('India ', ''))}" placeholder="e.g. KA" style="text-transform: uppercase;">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">Currency</label>
              <select class="form-select font-mono font-bold" id="rateCurrency">
                <option value="INR" ${selectedCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                <option value="BDT" ${selectedCurrency === 'BDT' ? 'selected' : ''}>BDT (৳)</option>
                <option value="USD" ${selectedCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                <option value="IDR" ${selectedCurrency === 'IDR' ? 'selected' : ''}>IDR (Rp)</option>
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

    Utils.showModal(isEdit ? `✏️ Edit Benchmark Rates: ${r.stateName || r.location}` : '➕ Add State Benchmark Rates', content, {
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
            const loc = Utils.$('#rateLocation').value.trim();
            const stateName = Utils.$('#rateStateName').value.trim();
            if (!loc || !stateName) {
              Utils.showToast('Please enter Location and State Name.', 'warning');
              return;
            }

            const entityId = Utils.$('#rateEntity')?.value || 'nhipl';
            const country = Utils.$('#rateCountry')?.value || 'India';
            const currency = Utils.$('#rateCurrency')?.value || 'INR';

            const updatedData = {
              id: r.id || undefined,
              entityId: entityId,
              country: country,
              location: loc,
              stateName: stateName,
              stateCode: Utils.$('#rateStateCode').value.trim().toUpperCase() || loc.replace('India ', ''),
              currency: currency,
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

  onRateCountryChanged(country) {
    const currSelect = document.getElementById('rateCurrency');
    if (!currSelect) return;
    if (country === 'Bangladesh') currSelect.value = 'BDT';
    else if (country === 'Indonesia') currSelect.value = 'IDR';
    else if (country === 'USA') currSelect.value = 'USD';
    else if (country === 'India') currSelect.value = 'INR';

    const currSymbol = country === 'Bangladesh' ? '৳' : (country === 'USA' ? '$' : (country === 'Indonesia' ? 'Rp' : '₹'));
    document.querySelectorAll('#impRateForm .rate-curr-label').forEach(el => {
      el.textContent = currSymbol;
    });
  },

  onRateLocationSelected(loc) {
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
      return;
    }

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
  },

  async deleteImpUnitRate(id) {
    if (!confirm('Are you sure you want to delete this custom state rate configuration?')) return;
    await db.delete(STORES.impUnitRates, id);
    Utils.showToast('🗑️ Deleted custom rate configuration.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: Custom Benchmark Rate Fields Manager
  // ═══════════════════════════════════════════════════════════════════════════
  async renderImpCustomFieldsTab(container, customFields) {
    container.innerHTML = `
      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Custom Benchmark Rate Fields (${customFields.length})</div>
            <div class="card-subtitle">Define additional cost rate variables (e.g. Doctor Honorarium, Stationery, Refreshments) to link to Activity Templates</div>
          </div>
          <button class="btn btn-primary btn-sm font-bold" onclick="ConfigModule.showCustomRateFieldModal()">
            ➕ + Add Custom Rate Field
          </button>
        </div>

        ${customFields.length === 0 ? `
          <div class="p-lg text-center text-muted">
            <div style="font-size: 2rem; margin-bottom: 8px;">⚙️</div>
            <h4>No Custom Rate Fields Defined</h4>
            <p class="mt-xs">Add your first custom rate field to link it to activity templates for 10.1 to 10.6.</p>
            <button class="btn btn-primary mt-sm" onclick="ConfigModule.showCustomRateFieldModal()">➕ Add Field</button>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th style="width: 220px;">Field Name</th>
                  <th style="width: 160px;">Field Key (Identifier)</th>
                  <th>Category</th>
                  <th>Default GL Account</th>
                  <th class="num">Default Unit Rate (₹)</th>
                  <th>Unit Description</th>
                  <th style="width: 100px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${customFields.map(cf => `
                  <tr>
                    <td class="font-bold text-primary">
                      ⭐ ${cf.name}
                    </td>
                    <td><code style="font-size: 11px;">${cf.fieldKey}</code></td>
                    <td>
                      <span class="badge ${cf.category === 'professional' ? 'badge-indigo' : (cf.category === 'printing' ? 'badge-cyan' : 'badge-emerald')}">
                        ${cf.category ? cf.category.toUpperCase() : 'GENERAL'}
                      </span>
                    </td>
                    <td><code>${cf.defaultGlCode || '93201'}</code> <span style="font-size: 11px; color: var(--text-secondary);">${cf.parentAccount || ''}</span></td>
                    <td class="num font-bold font-mono" style="color: var(--accent-primary);">
                      ₹ ${Utils.formatNumber(cf.defaultUnitRate || 0)}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 11.5px;">${cf.unitDesc || '—'}</td>
                    <td style="text-align: center; white-space: nowrap;">
                      <button class="btn btn-ghost btn-sm" onclick="ConfigModule.showCustomRateFieldModal('${cf.id}')" title="Edit field">✏️ Edit</button>
                      <button class="btn btn-danger btn-sm" onclick="ConfigModule.deleteCustomRateField('${cf.id}')" title="Delete field">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Standard Rate Fields Catalog Card for Reference -->
      <div class="card p-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
        <div class="flex items-center gap-sm mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
          <span style="font-size: 1.1rem;">📖</span>
          <div class="font-bold" style="font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">
            Standard Built-In Benchmark Rate Fields (${this.standardRateFields.length})
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; font-size: 11.5px;">
          ${this.standardRateFields.map(sf => `
            <div class="p-xs" style="background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-subtle);">
              <div class="font-bold text-primary">${sf.label}</div>
              <div class="text-tertiary font-mono" style="font-size: 10.5px;"><code>${sf.key}</code> &bull; GL ${sf.defaultGl}</div>
              <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">${sf.unit}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async showCustomRateFieldModal(fieldId = null) {
    let existing = null;
    if (fieldId) {
      const all = await db.getAllImpCustomRateFields();
      existing = all.find(f => f.id === fieldId || f.fieldKey === fieldId);
    }

    const coaList = await db.getAll(STORES.chartOfAccounts);

    const content = `
      <form id="customRateFieldForm" style="font-size: 13px;">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Field Display Name <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="customFieldName" value="${existing?.name || ''}" placeholder="e.g. Doctor / Specialist Honorarium, Refreshments, Lab Consumables" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Field Identifier Key <span class="text-danger">*</span></label>
            <input type="text" class="form-input font-mono" id="customFieldKey" value="${existing?.fieldKey || ''}" placeholder="e.g. doctorHonorarium" ${existing ? 'readonly' : ''} required>
            <div class="form-hint">Unique key (camelCase, e.g. doctorHonorarium)</div>
          </div>
          <div class="form-group mb-none">
            <label class="form-label font-bold">Field Category</label>
            <select class="form-select font-bold" id="customFieldCategory">
              <option value="professional" ${existing?.category === 'professional' ? 'selected' : ''}>🩺 Honorarium & Professional</option>
              <option value="printing" ${existing?.category === 'printing' ? 'selected' : ''}>📦 Printing & Collaterals</option>
              <option value="venue" ${existing?.category === 'venue' ? 'selected' : ''}>🏢 Venue, AV & Catering</option>
              <option value="travel" ${existing?.category === 'travel' ? 'selected' : ''}>🚕 Travel & Lodging</option>
              <option value="supervision" ${existing?.category === 'supervision' ? 'selected' : ''}>🚗 Supervision & Field</option>
              <option value="misc" ${existing?.category === 'misc' ? 'selected' : ''}>⚙️ Miscellaneous Direct Cost</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Default GL Account Binding</label>
            <select class="form-select font-bold" id="customFieldGl">
              <option value="93701" ${existing?.defaultGlCode === '93701' ? 'selected' : ''}>93701 Professional Charges</option>
              <option value="93201" ${existing?.defaultGlCode === '93201' ? 'selected' : ''}>93201 Other Direct Expenses</option>
              <option value="93204" ${existing?.defaultGlCode === '93204' ? 'selected' : ''}>93204 Supplies & Printing</option>
              <option value="93101" ${existing?.defaultGlCode === '93101' ? 'selected' : ''}>93101 Hotel Accommodation</option>
              <option value="93104" ${existing?.defaultGlCode === '93104' ? 'selected' : ''}>93104 Cab / Auto Travel</option>
              <option value="93102" ${existing?.defaultGlCode === '93102' ? 'selected' : ''}>93102 Food Allowance</option>
              <option value="93401" ${existing?.defaultGlCode === '93401' ? 'selected' : ''}>93401 Office Expenses</option>
              <option value="93302" ${existing?.defaultGlCode === '93302' ? 'selected' : ''}>93302 Postage & Courier</option>
            </select>
          </div>
          <div class="form-group mb-none">
            <label class="form-label font-bold">Default Benchmark Rate (₹)</label>
            <input type="number" class="form-input font-bold" id="customFieldDefaultRate" value="${existing?.defaultUnitRate || 1000}">
          </div>
        </div>

        <div class="form-group mb-none">
          <label class="form-label font-bold">Unit / Basis Description</label>
          <input type="text" class="form-input" id="customFieldUnitDesc" value="${existing?.unitDesc || ''}" placeholder="e.g. Per doctor / training session, Per participant booklet">
        </div>
      </form>
    `;

    Utils.showModal(existing ? `✏️ Edit Custom Rate Field: ${existing.name}` : '➕ Add Custom Benchmark Rate Field', content, {
      modalWidth: '580px',
      footer: (footer, close) => {
        footer.appendChild(Utils.createElement('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: close }));
        footer.appendChild(Utils.createElement('button', {
          className: 'btn btn-primary font-bold',
          textContent: '💾 Save Rate Field',
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
            const defaultRate = Utils.parseNumber(Utils.$('#customFieldDefaultRate').value) || 0;
            const unitDesc = Utils.$('#customFieldUnitDesc').value.trim();

            const parentMap = {
              '93701': 'Professional & Consultancy Charges',
              '93201': 'Other Direct Expenses',
              '93204': 'Supplies & Printing Costs',
              '93101': 'Travel & Lodging Expenses',
              '93104': 'Travel & Lodging Expenses',
              '93102': 'Travel & Lodging Expenses',
              '93401': 'Office Expenses',
              '93302': 'Communication Cost'
            };

            const fieldObj = {
              id: existing?.id || key,
              fieldKey: key,
              name: name,
              category: category,
              defaultGlCode: glCode,
              parentAccount: parentMap[glCode] || 'Direct Cost',
              defaultUnitRate: defaultRate,
              unitDesc: unitDesc
            };

            await db.saveImpCustomRateField(fieldObj);
            Utils.showToast(`✅ Saved custom rate field "${name}"!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });

    // Auto generate key from name on typing if new field
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

  async deleteCustomRateField(fieldId) {
    if (!confirm('Are you sure you want to delete this custom rate field? It will also be unlinked from any activity templates.')) return;
    await db.deleteImpCustomRateField(fieldId);
    Utils.showToast('🗑️ Deleted custom rate field.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: Activity Templates & Line Items Builder (Activities 10.1 to 10.6)
  // ═══════════════════════════════════════════════════════════════════════════
  async renderImpActivityTemplatesTab(container, templates, customFields) {
    const selectedTemplate = templates.find(t => t.code === this.selectedTemplateCode) || templates[0] || SEED_DATA.defaultImpActivityTemplates[0];
    this.selectedTemplateCode = selectedTemplate.code;

    container.innerHTML = `
      <!-- Activity Switcher Buttons (10.1 to 10.8) -->
      <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
        <div class="text-tertiary font-bold mb-xs" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
          🎯 Select Activity Template to Configure (Activities 10.1 to 10.8):
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${templates.map(t => `
            <button type="button" class="btn btn-sm ${t.code === this.selectedTemplateCode ? 'btn-primary font-bold' : 'btn-secondary'}" onclick="ConfigModule.selectActivityTemplate('${t.code}')" style="font-size: 12px; padding: 6px 12px;">
              <span>${t.icon || '🎯'}</span> <strong>${t.code}</strong> ${t.title.replace(/\([^)]*\)/g, '').trim()}
            </button>
          `).join('')}
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
                ${selectedTemplate.icon || '🎯'} ${selectedTemplate.title}
              </h3>
            </div>
            <div class="text-secondary mt-xs" style="font-size: 12px;">
              Linked 5D Activity: <code style="font-weight: bold;">${selectedTemplate.activityName}</code> &bull; ${selectedTemplate.lineItems?.length || 0} Linked Cost Line Items
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <button class="btn btn-ghost btn-sm text-danger font-bold" onclick="ConfigModule.resetActivityTemplate('${selectedTemplate.code}')" title="Reset this template to factory default seed settings">
              ↺ Reset to Default
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
              📋 Linked Cost Line Items & Benchmark Calculation Rules (${selectedTemplate.lineItems?.length || 0})
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
                const allFieldDefs = [...this.standardRateFields, ...customFields];
                const matchedField = allFieldDefs.find(f => f.key === item.rateField || f.fieldKey === item.rateField);
                const formulaDesc = this.formulaTypeMap[item.formulaType] || item.formulaType || 'Standard Formula';

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
                      ${formulaDesc}
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

  async selectActivityTemplate(code) {
    this.selectedTemplateCode = code;
    const pageContent = document.getElementById('pageContent');
    if (pageContent) return await this.renderImpUnitRates(pageContent);
  },

  async showTemplateLineItemModal(lineId = null) {
    const templates = await db.getAllImpActivityTemplates();
    const selectedTemplate = templates.find(t => t.code === this.selectedTemplateCode) || templates[0];
    const customFields = await db.getAllImpCustomRateFields();
    const existing = selectedTemplate.lineItems?.find(l => l.id === lineId);

    const allRateFields = [
      ...this.standardRateFields.map(s => ({ key: s.key, label: s.label, isCustom: false, parent: s.parentAccount })),
      ...customFields.map(c => ({ key: c.fieldKey, label: '⭐ ' + c.name + ' (Custom)', isCustom: true, parent: c.parentAccount }))
    ];

    const content = `
      <form id="templateLineItemForm" style="font-size: 13px;">
        <div class="form-group mb-sm">
          <label class="form-label font-bold">Line Item Description <span class="text-danger">*</span></label>
          <input type="text" class="form-input font-bold" id="tplLineDesc" value="${existing?.description || ''}" placeholder="e.g. 🏨 Hotel Accommodation (Double Occupancy), 🩺 Doctor Honorarium" required>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">GL Account & Category <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="tplLineGl">
              <option value="93101" ${existing?.ledgerCode === '93101' ? 'selected' : ''}>93101 Hotel Accommodation (Travel & Lodging)</option>
              <option value="93104" ${existing?.ledgerCode === '93104' ? 'selected' : ''}>93104 Local Cab Travel (Travel & Lodging)</option>
              <option value="93102" ${existing?.ledgerCode === '93102' ? 'selected' : ''}>93102 Food Allowance DA (Travel & Lodging)</option>
              <option value="93105" ${existing?.ledgerCode === '93105' ? 'selected' : ''}>93105 Bus / Train Transit (Travel & Lodging)</option>
              <option value="93103" ${existing?.ledgerCode === '93103' ? 'selected' : ''}>93103 Airfare Roundtrip (Travel & Lodging)</option>
              <option value="93204" ${existing?.ledgerCode === '93204' ? 'selected' : ''}>93204 Supplies & Printing (Collaterals, Kits, Props)</option>
              <option value="93201" ${existing?.ledgerCode === '93201' ? 'selected' : ''}>93201 Other Direct Expenses (Halls, Catering, AV)</option>
              <option value="93701" ${existing?.ledgerCode === '93701' ? 'selected' : ''}>93701 Professional Charges (Guest Honorarium / Doctors)</option>
              <option value="93302" ${existing?.ledgerCode === '93302' ? 'selected' : ''}>93302 Courier & Dispatch</option>
              <option value="93401" ${existing?.ledgerCode === '93401' ? 'selected' : ''}>93401 Office Expenses</option>
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold">Linked Benchmark Rate Field <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="tplLineRateField">
              ${allRateFields.map(rf => `
                <option value="${rf.key}" ${existing?.rateField === rf.key ? 'selected' : ''}>
                  ${rf.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group mb-none">
            <label class="form-label font-bold">Calculation Formula / Driver Rule <span class="text-danger">*</span></label>
            <select class="form-select font-bold" id="tplLineFormula">
              <option value="events_days_trainers" ${existing?.formulaType === 'events_days_trainers' ? 'selected' : ''}>Events × Days × Trainers × Rate (Hotel / Cab / Food DA)</option>
              <option value="events_trainers" ${existing?.formulaType === 'events_trainers' ? 'selected' : ''}>Events × Trainers × Rate (Transit / Airfare)</option>
              <option value="facilities_rate" ${existing?.formulaType === 'facilities_rate' ? 'selected' : ''}>Facilities × Rate (Collateral Kits / Launch Pkg)</option>
              <option value="facilities_multiplier" ${existing?.formulaType === 'facilities_multiplier' ? 'selected' : ''}>Facilities × Multiplier × Rate (Dolls = 2, Thalis = 3)</option>
              <option value="events_rate" ${existing?.formulaType === 'events_rate' ? 'selected' : ''}>Events × Rate (Banners / Courier / Handouts)</option>
              <option value="events_rate_dual" ${existing?.formulaType === 'events_rate_dual' ? 'selected' : ''}>Events × (Banners + Backdrops Rate)</option>
              <option value="events_days_hall_catering" ${existing?.formulaType === 'events_days_hall_catering' ? 'selected' : ''}>Events × Days × Hall + Events × Days × Trainees × Food</option>
              <option value="events_days_hall" ${existing?.formulaType === 'events_days_hall' ? 'selected' : ''}>Events × Days × Hall Rate</option>
              <option value="events_days_participants" ${existing?.formulaType === 'events_days_participants' ? 'selected' : ''}>Events × Days × Trainees × Catering Rate</option>
              <option value="events_days_honorarium" ${existing?.formulaType === 'events_days_honorarium' ? 'selected' : ''}>Events × Days × Honorarium Rate</option>
              <option value="participants_rate" ${existing?.formulaType === 'participants_rate' ? 'selected' : ''}>Trainees × Rate (Certificates & Kits)</option>
              <option value="facilities_pc_cab" ${existing?.formulaType === 'facilities_pc_cab' ? 'selected' : ''}>Facilities × PC Cab Rate</option>
              <option value="facilities_pc_food" ${existing?.formulaType === 'facilities_pc_food' ? 'selected' : ''}>Facilities × PC Food Rate</option>
            </select>
          </div>

          <div class="form-group mb-none">
            <label class="form-label font-bold">Multiplier / Quantity</label>
            <input type="number" min="1" step="1" class="form-input font-bold" id="tplLineMultiplier" value="${existing?.multiplier || 1}">
            <div class="form-hint">e.g. 2 for Dolls, 3 for Thalis, 1 for standard</div>
          </div>
        </div>
      </form>
    `;

    Utils.showModal(existing ? `✏️ Edit Line Item for Activity ${selectedTemplate.code}` : `➕ Add Line Item to Activity ${selectedTemplate.code}`, content, {
      modalWidth: '680px',
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
            const multiplier = Utils.parseNumber(Utils.$('#tplLineMultiplier').value) || 1;

            const parentMap = {
              '93101': 'Travel & Lodging Expenses',
              '93104': 'Travel & Lodging Expenses',
              '93102': 'Travel & Lodging Expenses',
              '93105': 'Travel & Lodging Expenses',
              '93103': 'Travel & Lodging Expenses',
              '93204': 'Supplies & Printing Costs',
              '93201': 'Other Direct Expenses',
              '93701': 'Professional & Consultancy Charges',
              '93302': 'Communication Cost',
              '93401': 'Office Expenses'
            };

            const lineItemObj = {
              id: existing?.id || ('line_' + Date.now()),
              description: desc,
              ledgerCode: glCode,
              parentAccount: parentMap[glCode] || 'Direct Cost',
              rateField: rateField,
              formulaType: formula,
              multiplier: multiplier,
              defaultActive: true
            };

            if (formula === 'events_rate_dual') {
              lineItemObj.secondaryRateField = 'backdropCost';
            }
            if (formula === 'events_days_hall_catering') {
              lineItemObj.secondaryRateField = 'venueFoodPerPerson';
            }

            const activeTpl = await db.getImpActivityTemplate(ConfigModule.selectedTemplateCode);
            if (!activeTpl.lineItems) activeTpl.lineItems = [];

            if (existing) {
              const idx = activeTpl.lineItems.findIndex(l => l.id === existing.id);
              if (idx !== -1) activeTpl.lineItems[idx] = lineItemObj;
            } else {
              activeTpl.lineItems.push(lineItemObj);
            }

            await db.saveImpActivityTemplate(activeTpl);
            Utils.showToast(`✅ Saved line item "${desc}" to Template ${activeTpl.code}!`, 'success');
            close();
            const pageContent = Utils.$('#pageContent');
            if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
          }
        }));
      }
    });
  },

  async deleteTemplateLineItem(lineId) {
    if (!confirm('Are you sure you want to remove this cost line item from the template?')) return;
    const activeTpl = await db.getImpActivityTemplate(this.selectedTemplateCode);
    activeTpl.lineItems = (activeTpl.lineItems || []).filter(l => l.id !== lineId);
    await db.saveImpActivityTemplate(activeTpl);
    Utils.showToast('🗑️ Removed line item from template.', 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  },

  async saveCurrentActivityTemplate() {
    const activeTpl = await db.getImpActivityTemplate(this.selectedTemplateCode);
    
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
    Utils.showToast(`💾 Master Template for Activity ${activeTpl.code} (${activeTpl.title}) saved successfully!`, 'success');
  },

  async resetActivityTemplate(code) {
    if (!confirm(`Are you sure you want to reset Activity ${code} template to original factory default settings?`)) return;
    await db.resetImpActivityTemplate(code);
    Utils.showToast(`↺ Reset Activity ${code} template to seed defaults.`, 'info');
    const pageContent = Utils.$('#pageContent');
    if (pageContent) ConfigModule.renderImpUnitRates(pageContent);
  }
};

window.ConfigModule = ConfigModule;

