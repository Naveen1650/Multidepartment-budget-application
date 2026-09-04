// ============================================================
// NOORA HEALTH BUDGET APP — Dashboard Module
// High-level overview of budget status, entity metrics & quick access
// ============================================================

const DashboardModule = {
  _isDragging: false,

  async render(container) {
    try {
      await this._renderInner(container);
    } catch (err) {
      console.error('[Dashboard] Render error:', err);
      container.innerHTML = `
        <div class="empty-state" style="padding: 60px 20px;">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 12px;">⚠️</div>
          <h3 style="margin-bottom: 8px;">Dashboard Error</h3>
          <p class="text-secondary" style="margin-bottom: 16px;">${err.message || 'An unexpected error occurred loading the dashboard.'}</p>
          <button class="btn btn-primary" onclick="App.renderCurrentPage()">↺ Retry</button>
        </div>
      `;
    }
  },

  async _renderInner(container) {
    const years = (await db.getAll(STORES.budgetYears)) || [];
    const rawDepts = (await db.getAll(STORES.departments)) || [];
    const departments = Utils.sortDepartments(rawDepts);

    // No budget year configured yet — show setup prompt immediately
    if (years.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 60px 20px; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 16px;">📅</div>
          <h3 style="margin-bottom: 8px;">No Budget Year Configured</h3>
          <p class="text-secondary" style="margin-bottom: 20px; max-width: 480px; margin-left: auto; margin-right: auto;">
            The dashboard requires at least one Budget Year to be set up. Go to <strong>Configuration → Budget Year Setup</strong> to create your first budget year with exchange rates.
          </p>
          <button class="btn btn-primary" onclick="App.navigateTo('config-budget-year')">⚙️ Set Up Budget Year</button>
        </div>
      `;
      return;
    }

    let activeYearObj = null;
    if (App.selectedYear) {
      activeYearObj = years.find(y => String(y.id) === String(App.selectedYear) || String(y.year) === String(App.selectedYear));
    }
    if (!activeYearObj && years.length > 0) {
      activeYearObj = years[0];
      App.selectedYear = activeYearObj.id;
    }

    const yearId = activeYearObj ? activeYearObj.id : (App.selectedYear || '2026');
    const yearLabel = activeYearObj ? `CY-${activeYearObj.year}` : 'CY-2026';

    const rawEntities = (await db.getActiveEntitiesForYear(yearId)) || [];
    const entities = typeof Auth !== 'undefined' ? Auth.filterAccessibleEntities(rawEntities) : rawEntities;

    // Apply stored country box arrangement if present
    let orderedEntities = [...entities];
    try {
      const savedOrder = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('noora_dashboard_country_order') || 'null') : null;
      if (savedOrder && Array.isArray(savedOrder)) {
        orderedEntities.sort((a, b) => {
          const idxA = savedOrder.indexOf(a.id);
          const idxB = savedOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }
    } catch (e) {
      console.warn('Could not parse stored country order', e);
    }

    // ── BULK FETCH: 4 DB calls total (instead of entities × depts × 4) ──
    let allPayroll = [], allEha = [], allFixedAssets = [], allNonPayroll = [];
    try {
      [allPayroll, allEha, allFixedAssets, allNonPayroll] = await Promise.all([
        db.getAll(STORES.payrollPersonnel),
        db.getAll(STORES.payrollEHA),
        db.getAll(STORES.payrollFixedAsset),
        db.getAll(STORES.nonPayrollCost)
      ]);
    } catch (e) {
      console.warn('[Dashboard] Bulk fetch error:', e);
    }

    // Ensure conversion rates are resolved
    if (activeYearObj) {
      activeYearObj.conversionRates = Utils.getConversionRates(activeYearObj);
    }
    const conversionRates = activeYearObj?.conversionRates || Utils.getConversionRates(activeYearObj);

    // Helper: calculate total for a budget record
    const getItemCost = (item) => {
      if (!item) return 0;
      const mValues = item.monthlyValues || item.monthly_values;
      if (mValues && typeof mValues === 'object') {
        const sumM = Object.values(mValues).reduce((sum, v) => sum + Utils.parseNumber(v), 0);
        if (sumM > 0) return sumM;
      }
      const cy = Utils.parseNumber(item.totalCY !== undefined ? item.totalCY : item.totalCy);
      return cy || 0;
    };

    // Helper: filter records for yearId + entityId
    const filterEntityData = (arr, eId) =>
      arr.filter(r => (String(r.yearId) === String(yearId) || String(r.year_id) === String(yearId) || String(r.year) === String(yearId) || (activeYearObj && String(r.year) === String(activeYearObj.year))) && String(r.entityId) === String(eId));

    // Helper: filter records for yearId + entityId + deptId
    const filterData = (arr, eId, dId) =>
      arr.filter(r => (String(r.yearId) === String(yearId) || String(r.year_id) === String(yearId) || String(r.year) === String(yearId) || (activeYearObj && String(r.year) === String(activeYearObj.year))) && String(r.entityId) === String(eId) && String(r.deptId) === String(dId));

    // Calculate budget metrics per entity — pure synchronous after bulk fetch
    const entityMetrics = orderedEntities.map(e => {
      const rate = conversionRates[e.currency] || 1.0;

      // Entity-wide totals across all stores
      const entPayroll     = filterEntityData(allPayroll, e.id);
      const entEha         = filterEntityData(allEha, e.id);
      const entFixedAssets = filterEntityData(allFixedAssets, e.id);
      const entNonPayroll  = filterEntityData(allNonPayroll, e.id);

      let totalLocal = 0;
      entPayroll.forEach(p     => { totalLocal += getItemCost(p); });
      entEha.forEach(p         => { totalLocal += getItemCost(p); });
      entFixedAssets.forEach(f => { totalLocal += getItemCost(f); });
      entNonPayroll.forEach(p  => { totalLocal += getItemCost(p); });

      const totalLineCount = entPayroll.length + entEha.length + entFixedAssets.length + entNonPayroll.length;

      let budgetedDeptsCount = 0;
      const deptBreakdowns = departments.map(d => {
        const payroll     = filterData(allPayroll,     e.id, d.id);
        const eha         = filterData(allEha,         e.id, d.id);
        const fixedAssets = filterData(allFixedAssets, e.id, d.id);
        const nonPayroll  = filterData(allNonPayroll,  e.id, d.id);

        let deptCost = 0;
        payroll.forEach(p     => { deptCost += getItemCost(p); });
        eha.forEach(p         => { deptCost += getItemCost(p); });
        fixedAssets.forEach(f => { deptCost += getItemCost(f); });
        nonPayroll.forEach(p  => { deptCost += getItemCost(p); });

        const lineCount = payroll.length + eha.length + fixedAssets.length + nonPayroll.length;
        if (deptCost > 0 || lineCount > 0) budgetedDeptsCount++;

        return {
          dept: d,
          deptName: Utils.getDeptName(d, e.deptPrefix),
          deptCost,
          deptCostUSD: deptCost / rate,
          lineCount
        };
      });

      const totalUSD = totalLocal / rate;

      return {
        entity: e,
        rate,
        totalLocal,
        totalUSD,
        budgetedDeptsCount,
        entriesCount: totalLineCount,
        deptBreakdowns
      };
    });

    const globalTotalUSD       = entityMetrics.reduce((sum, m) => sum + m.totalUSD, 0);
    const totalLineItemsGlobal = entityMetrics.reduce((sum, m) => sum + m.entriesCount, 0);
    const indiaMetrics   = entityMetrics.filter(m => m.entity.country === 'India');
    const indiaTotalINR  = indiaMetrics.reduce((sum, m) => sum + m.totalLocal, 0);
    const indiaTotalUSD  = indiaMetrics.reduce((sum, m) => sum + m.totalUSD, 0);

    const hasCustomOrder = !!localStorage.getItem('noora_dashboard_country_order');

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Executive Budget Dashboard</h2>
          <p>Consolidated country and entity totals aggregated from <strong>Total Dept Costs</strong> for <strong>${yearLabel}</strong></p>
        </div>
        <div>
          <button class="btn btn-primary" onclick="App.navigateTo('budget-entry')">✏️ Enter Budget Data</button>
        </div>
      </div>

      <!-- Top Summary Metrics -->
      <div class="metric-grid mb-lg">
        <div class="metric-card cyan">
          <div class="metric-label">Global Consolidated Budget (USD)</div>
          <div class="metric-value">${Utils.formatCurrency(globalTotalUSD, 'USD')}</div>
          <div class="metric-change positive">Sum of Total Dept Costs across all entities</div>
        </div>

        <div class="metric-card violet">
          <div class="metric-label">Active Entities & Countries</div>
          <div class="metric-value">${entities.length} Entities</div>
          <div class="metric-change">US, IN, BD, ID, NP</div>
        </div>

        <div class="metric-card amber">
          <div class="metric-label">Budget Year</div>
          <div class="metric-value">${activeYearObj ? activeYearObj.year : '2026'}</div>
          <div class="metric-change">Calendar Year (Jan-Dec)</div>
        </div>

        <div class="metric-card emerald">
          <div class="metric-label">Total Dept Line Items</div>
          <div class="metric-value">${totalLineItemsGlobal} Lines</div>
          <div class="metric-change positive">Across All Departments</div>
        </div>
      </div>

      <!-- Entity Cards Section (Draggable & Rearrangeable) -->
      <div class="card mb-lg">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Country & Entity Budget Summary (${yearLabel})</div>
            <div class="card-subtitle">Aggregated from Total Dept Costs &bull; <em>Drag and drop boxes to rearrange layout</em></div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="badge badge-subtle" style="font-size: 11px; padding: 4px 8px;">⠿ Drag to Reorder</span>
            ${hasCustomOrder ? `
              <button class="btn btn-ghost btn-sm" id="resetOrderBtn" title="Reset rearranged boxes to default order">↺ Reset Layout</button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="DashboardModule.goToGlobalUSDReport()">📈 View Full Consolidated Report</button>
          </div>
        </div>

        <div class="entity-grid" id="dashboardEntityGrid">
          ${entityMetrics.map(m => `
            <div class="entity-card" draggable="true" data-entity-id="${m.entity.id}" id="entity-card-${m.entity.id}">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-sm">
                  <span class="entity-flag">${m.entity.flag}</span>
                  <span class="badge badge-cyan">${m.entity.currency}</span>
                </div>
                <span class="entity-card-drag-handle" title="Drag to rearrange country box" onclick="event.stopPropagation()">⠿</span>
              </div>
              <div class="entity-name mt-xs">${m.entity.shortName}</div>
              <div class="entity-currency">${m.entity.name} (${m.entity.country})</div>
              
              <div class="entity-budget">${Utils.formatCurrency(m.totalLocal, m.entity.currency)}</div>
              <div class="entity-budget-usd">≈ ${Utils.formatCurrency(m.totalUSD, 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${m.rate} ${m.entity.currency}/USD)</span></div>
              
              <div class="mt-md flex justify-between items-center text-muted" style="font-size: var(--font-size-xs);">
                <span>${m.entriesCount} Line Items</span>
                <span style="color: var(--accent-primary); font-weight: 600;">View Summary →</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Department Rollup Table -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Department Total Cost Rollup by Entity</div>
            <div class="card-subtitle">Showing each department's contribution to its country/entity total budget</div>
          </div>
        </div>
        <div class="table-container" style="max-height: 360px;">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sticky-col">Entity / Country</th>
                <th>Department</th>
                <th>Currency</th>
                <th class="num">Exchange Rate</th>
                <th class="num font-bold">Total Dept Cost (Local Currency)</th>
                <th class="num font-bold">Total Dept Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              ${entityMetrics.map(m => {
                const activeDepts = m.deptBreakdowns.filter(d => d.deptCost > 0);
                if (activeDepts.length === 0) {
                  return `
                    <tr>
                      <td class="sticky-col font-bold" style="background: var(--bg-card); border-right: 1px solid var(--border-default);">
                        ${m.entity.flag} ${m.entity.shortName} <span class="text-tertiary">(${m.entity.country})</span>
                      </td>
                      <td colspan="3" class="text-muted" style="padding: 10px 14px;">No budgeted departments yet with values.</td>
                      <td class="num text-muted">${Utils.formatCurrency(0, m.entity.currency)}</td>
                      <td class="num text-muted">≈ $0</td>
                    </tr>
                  `;
                }

                return activeDepts.map((d, dIdx) => `
                  <tr>
                    ${dIdx === 0 ? `<td class="sticky-col font-bold" rowspan="${activeDepts.length}" style="vertical-align: top; background: var(--bg-card); border-right: 1px solid var(--border-default);">${m.entity.flag} ${m.entity.shortName} <span class="text-tertiary">(${m.entity.country})</span></td>` : ''}
                    <td>
                      <a href="javascript:void(0)" onclick="DashboardModule.goToDeptBudget('${m.entity.id}', '${d.dept.id}')" style="color: var(--accent-primary); font-weight: 600; text-decoration: none;" title="Open Department Budget">
                        ${d.deptName} ↗
                      </a>
                    </td>
                    <td><code>${m.entity.currency}</code></td>
                    <td class="num">${m.rate}</td>
                    <td class="num font-bold">${Utils.formatCurrency(d.deptCost, m.entity.currency)}</td>
                    <td class="num font-bold" style="color: var(--accent-primary);">≈ ${Utils.formatCurrency(d.deptCostUSD, 'USD')}</td>
                  </tr>
                `).join('') + `
                  <tr style="background: rgba(37, 99, 235, 0.05); font-weight: 700; border-bottom: 2px solid var(--border-default);">
                    <td colspan="4" class="text-right" style="padding-right: 16px;"><strong>${m.entity.shortName} TOTAL DEPT COST (${activeDepts.length} DEPARTMENTS):</strong></td>
                    <td class="num font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(m.totalLocal, m.entity.currency)}</td>
                    <td class="num font-bold" style="color: var(--accent-primary);">≈ ${Utils.formatCurrency(m.totalUSD, 'USD')}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row" style="font-size: 0.95rem;">
                <td colspan="5" class="text-right" style="padding-right: 16px;">GLOBAL CONSOLIDATED TOTAL (ALL DEPARTMENTS & COUNTRIES):</td>
                <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.1rem;">${Utils.formatCurrency(globalTotalUSD, 'USD')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach Drag and Drop handlers
    this.setupDraggableCards(container);

    const resetBtn = container.querySelector('#resetOrderBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetCountryOrder(container);
      });
    }
  },

  setupDraggableCards(container) {
    const grid = container.querySelector('#dashboardEntityGrid');
    if (!grid) return;

    let draggedCard = null;
    let draggedId = null;

    grid.querySelectorAll('.entity-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        DashboardModule._isDragging = true;
        draggedCard = card;
        draggedId = card.dataset.entityId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        grid.querySelectorAll('.entity-card').forEach(c => c.classList.remove('drag-over'));
        draggedCard = null;
        draggedId = null;
        setTimeout(() => {
          DashboardModule._isDragging = false;
        }, 120);
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedCard && card !== draggedCard) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (draggedCard && card !== draggedCard) {
          const bounding = card.getBoundingClientRect();
          const offset = e.clientX - bounding.left;

          if (offset > bounding.width / 2) {
            card.after(draggedCard);
          } else {
            card.before(draggedCard);
          }

          // Persist the new order to localStorage
          const currentCards = Array.from(grid.querySelectorAll('.entity-card'));
          const newOrder = currentCards.map(c => c.dataset.entityId);
          localStorage.setItem('noora_dashboard_country_order', JSON.stringify(newOrder));
          Utils.showToast('Country boxes rearranged and saved!', 'success');

          // Re-render to sync the department table order seamlessly
          DashboardModule.render(container);
        }
      });

      card.addEventListener('click', (e) => {
        if (DashboardModule._isDragging) {
          e.preventDefault();
          return;
        }
        const entityId = card.dataset.entityId;
        if (entityId) {
          DashboardModule.selectEntityAndGo(entityId);
        }
      });
    });
  },

  resetCountryOrder(container) {
    localStorage.removeItem('noora_dashboard_country_order');
    Utils.showToast('Country layout reset to default order', 'info');
    this.render(container);
  },

  goToGlobalUSDReport() {
    ReportsModule.activeTab = 'global-usd';
    ReportsModule.globalSubTab = 'summary';
    App.navigateTo('reports');
  },

  goToIndiaReport() {
    ReportsModule.activeTab = 'india-consolidated';
    ReportsModule.indiaSubTab = 'summary';
    App.navigateTo('reports');
  },

  selectEntityAndGo(entityId) {
    App.selectedEntity = entityId;
    ReportsModule.selectedEntityId = entityId;
    ReportsModule.activeTab = 'entity-summary';
    ReportsModule.entitySubTab = 'summary';
    App.navigateTo('reports');
  },

  goToDeptBudget(entityId, deptId) {
    App.selectedEntity = entityId;
    const select = Utils.$('#globalEntitySelect');
    if (select) select.value = entityId;
    BudgetEntryModule.currentEntityId = entityId;
    BudgetEntryModule.currentDeptId = deptId;
    BudgetEntryModule.activeTab = 'total-costs';
    App.navigateTo('budget-entry');
  }
};

window.DashboardModule = DashboardModule;

