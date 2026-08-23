// ============================================================
// NOORA HEALTH BUDGET APP — Reports & Consolidation Module
// Reports: Department Summary, Entity Summary, India Consolidated,
// Global USD Consolidated, and 5-Dimensional Analytics
// ============================================================

const ReportsModule = {
  activeTab: 'global-usd', // global-usd | india-consolidated | entity-summary | dept-summary
  globalSubTab: 'summary', // summary | line-items
  indiaSubTab: 'summary',  // summary | line-items
  entitySubTab: 'summary', // summary | line-items

  isMonthsCollapsed() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('noora_budget_months_collapsed') === 'true';
    }
    return false;
  },

  async render(container) {
    const years = await db.getAll(STORES.budgetYears);
    const entities = await db.getAll(STORES.entities);
    const departments = Utils.sortDepartments(await db.getAll(STORES.departments));

    const yearId = this._selectedYear || App.selectedYear || years[0]?.id || '2026';
    const activeYearObj = years.find(y => String(y.id) === String(yearId) || String(y.year) === String(yearId)) || years[0] || { id: '2026', year: 2026, conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
    this._selectedYear = activeYearObj.id;
    App.selectedYear = activeYearObj.id;

    // Sync global selector if present in DOM
    const globalYearSelect = Utils.$('#globalYearSelect');
    if (globalYearSelect && globalYearSelect.value !== activeYearObj.id) {
      globalYearSelect.value = activeYearObj.id;
    }

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Consolidated Budget Reports</h2>
          <p>Multi-level financial consolidation in local currencies and converted USD for <strong>CY-${activeYearObj.year}</strong></p>
        </div>
        <div class="flex gap-sm items-center">
          <div class="flex items-center gap-xs" style="background: var(--bg-card); padding: 4px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
            <label class="form-label" style="margin:0; font-size:12px; font-weight:600; white-space:nowrap;">Budget Year:</label>
            <select class="form-select form-select-sm" id="reportYearSelect" style="width: auto; min-width: 110px; font-weight:600;">
              ${years.map(y => `<option value="${y.id}" ${String(y.id) === String(activeYearObj.id) ? 'selected' : ''}>CY-${y.year}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-secondary btn-sm flex items-center gap-xs" id="exportReportBtn">
            <span>📥</span> Export Excel
          </button>
          <button class="btn btn-primary btn-sm flex items-center gap-xs" id="exportFullBookBtn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <span>📗</span> Export Global Budget Book (All Sheets)
          </button>
        </div>
      </div>

      <!-- Report Tabs -->
      <div class="tabs mb-lg" id="reportTabs">
        <button class="tab ${this.activeTab === 'global-usd' ? 'active' : ''}" data-tab="global-usd">
          🌍 Global USD Consolidated
        </button>
        <button class="tab ${this.activeTab === 'india-consolidated' ? 'active' : ''}" data-tab="india-consolidated">
          🇮🇳 India Consolidated (INR)
        </button>
        <button class="tab ${this.activeTab === 'entity-summary' ? 'active' : ''}" data-tab="entity-summary">
          🏢 Entity Summary
        </button>
        <button class="tab ${this.activeTab === 'dept-summary' ? 'active' : ''}" data-tab="dept-summary">
          🏛️ Department Summary
        </button>
      </div>

      <!-- Report Content Area -->
      <div id="reportContainer"></div>
    `;

    // Year change listener inside reports
    const reportYearSelect = container.querySelector('#reportYearSelect');
    if (reportYearSelect) {
      reportYearSelect.addEventListener('change', (e) => {
        this._selectedYear = e.target.value;
        App.selectedYear = e.target.value;
        const gSelect = Utils.$('#globalYearSelect');
        if (gSelect) gSelect.value = e.target.value;
        this.render(container);
      });
    }

    // Attach delegated click listener on container for Total column header collapse/expand
    if (!container._monthsToggleBound) {
      container._monthsToggleBound = true;
      container.addEventListener('click', (e) => {
        const th = e.target.closest('[data-toggle-months]');
        if (th) {
          e.preventDefault();
          e.stopPropagation();
          const table = th.closest('.data-table');
          if (!table) return;
          table.classList.toggle('months-collapsed');
          const isCollapsed = table.classList.contains('months-collapsed');
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('noora_budget_months_collapsed', isCollapsed ? 'true' : 'false');
          }
          if (typeof BudgetEntryModule !== 'undefined') {
            BudgetEntryModule._monthsCollapsedState = isCollapsed;
          }
          const arrow = th.querySelector('.months-toggle-arrow');
          if (arrow) arrow.innerHTML = isCollapsed ? '&#9654;' : '&#9664;';
          th.title = isCollapsed ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)';
        }
      });
    }

    container.querySelectorAll('#reportTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        container.querySelectorAll('#reportTabs .tab').forEach(tab => tab.classList.remove('active'));
        t.classList.add('active');
        this.activeTab = t.dataset.tab;
        const fullBookBtn = container.querySelector('#exportFullBookBtn');
        if (fullBookBtn) {
          fullBookBtn.style.display = this.activeTab === 'global-usd' ? 'inline-flex' : 'none';
        }
        this.renderReportContent(container.querySelector('#reportContainer'), activeYearObj.id, activeYearObj, entities, departments);
      });
    });

    this.renderReportContent(container.querySelector('#reportContainer'), activeYearObj.id, activeYearObj, entities, departments);
  },

  async renderReportContent(container, yearId, yearObj, entities, departments) {
    if (this.activeTab === 'global-usd') {
      await this.renderGlobalUSDReport(container, yearId, yearObj, entities);
    } else if (this.activeTab === 'india-consolidated') {
      await this.renderIndiaReport(container, yearId, yearObj, entities);
    } else if (this.activeTab === 'entity-summary') {
      await this.renderEntitySummaryReport(container, yearId, entities);
    } else if (this.activeTab === 'dept-summary') {
      await this.renderDeptSummaryReport(container, yearId, entities, departments);
    } else if (this.activeTab === 'dimensions') {
      await this.renderDimensionReport(container, yearId, yearObj, entities, departments);
    }
  },

  // ─── Reusable Helper: Build Consolidated Line Items across entities & departments ───
  async buildConsolidatedLineItems(entityList, yearId, conversionRates) {
    const coa = await db.getAll(STORES.chartOfAccounts);
    const cleanStr = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const allSalaries = [];
    const allOtherStaff = [];
    const allGratuity = [];
    const allEha = [];
    const allFixedAssets = [];
    const allNonPayroll = [];

    for (const e of entityList) {
      const rate = conversionRates?.[e.currency] || 1.0;
      const payroll = await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id);
      const salaries = payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
      const otherStaff = payroll.filter(p => p.subCategory === 'other-staff-expenses');
      const gratuity = payroll.filter(p => p.subCategory === 'gratuity-bonus');
      const eha = await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id);
      const fixedAssets = await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id);
      const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);

      const attachRate = (rows) => rows.map(r => ({ ...r, currency: e.currency, rate }));
      allSalaries.push(...attachRate(salaries));
      allOtherStaff.push(...attachRate(otherStaff));
      allGratuity.push(...attachRate(gratuity));
      allEha.push(...attachRate(eha));
      allFixedAssets.push(...attachRate(fixedAssets));
      allNonPayroll.push(...attachRate(nonPayroll));
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
      let linkedSource = '';
      let sourceIcon = '📑';
      const accGlClean = cleanStr(account.glDescription);
      const accLedgerClean = cleanStr(account.ledgerCode);
      const accParentClean = cleanStr(account.parentAccount);

      let rollup = { monthlyLocal: Array(12).fill(0), monthlyUSD: Array(12).fill(0), totalLocal: 0, totalUSD: 0 };

      if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911') || accParentClean.includes('salariesandwages')) {
        linkedSource = 'Payroll — Salaries & Wages';
        sourceIcon = '👥';
        rollup = sumRowsWithConversion(allSalaries);
      } else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913') || accParentClean.includes('otherstaff')) {
        linkedSource = 'Payroll — Other Staff Expenses';
        sourceIcon = '👥';
        rollup = sumRowsWithConversion(allOtherStaff);
      } else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912') || accParentClean.includes('health') || accParentClean.includes('retirement')) {
        linkedSource = 'Payroll — Gratuity & Bonus';
        sourceIcon = '👥';
        rollup = sumRowsWithConversion(allGratuity);
      } else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921') || accParentClean.includes('resourceperson')) {
        linkedSource = 'Payroll — EHA Consultants';
        sourceIcon = '🤝';
        rollup = sumRowsWithConversion(allEha);
      } else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113') || accParentClean.includes('fixedasset')) {
        linkedSource = 'Fixed Assets';
        sourceIcon = '💻';
        rollup = sumRowsWithConversion(allFixedAssets);
      } else {
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
        subGroup: account.subGroup,
        parentAccount: account.parentAccount,
        glDescription: account.glDescription,
        ledgerCode: account.ledgerCode,
        linkedSource,
        sourceIcon,
        monthlyLocal: rollup.monthlyLocal,
        monthlyUSD: rollup.monthlyUSD,
        totalLocal: rollup.totalLocal,
        totalUSD: rollup.totalUSD
      };
    });

    // Custom non-payroll lines added in any department
    const customGroupMap = {};
    allNonPayroll.forEach((o, idx) => {
      if (!matchedOtherCostIndices.has(idx)) {
        const key = `${o.parentAccount || 'Other Costs'}__${o.glDescription || 'Misc'}__${o.ledgerCode || '93999'}`;
        if (!customGroupMap[key]) {
          customGroupMap[key] = {
            parentAccount: o.parentAccount || 'Other Costs',
            glDescription: o.glDescription || 'Miscellaneous Expense',
            ledgerCode: o.ledgerCode || '93999',
            categoryKey: o.categoryKey || this.getOtherCostCategory(o),
            rows: []
          };
        }
        customGroupMap[key].rows.push(o);
      }
    });

    Object.values(customGroupMap).forEach(cg => {
      const rollup = sumRowsWithConversion(cg.rows);
      const catLabels = {
        travel: { label: 'Travel & Lodging Package', icon: '✈️' },
        supplies: { label: 'Supplies & Printing', icon: '🖨️' },
        communication: { label: 'Communication Expenses', icon: '📡' },
        office: { label: 'Office Expenses', icon: '🏢' },
        professional: { label: 'Professional & Consulting', icon: '💼' },
        other: { label: 'Other Operating Costs', icon: '📑' }
      };
      const cMeta = catLabels[cg.categoryKey] || catLabels.other;
      lines.push({
        subGroup: 'Direct Cost',
        parentAccount: cg.parentAccount,
        glDescription: cg.glDescription,
        ledgerCode: cg.ledgerCode,
        linkedSource: cMeta.label,
        sourceIcon: cMeta.icon,
        monthlyLocal: rollup.monthlyLocal,
        monthlyUSD: rollup.monthlyUSD,
        totalLocal: rollup.totalLocal,
        totalUSD: rollup.totalUSD
      });
    });

    // ─── Filter lines strictly by View Permission ───
    const visibleLines = lines.filter(r => {
      if (typeof Auth === 'undefined') return true;
      const catKey = Auth.getCategoryForLineItem(r);
      return Auth.hasPermission('view', {
        category: catKey,
        ledgerCode: r.ledgerCode,
        glDescription: r.glDescription,
        parentAccount: r.parentAccount
      });
    });

    return visibleLines;
  },

  // ─── Global Consolidated (USD) Report ───
  async renderGlobalUSDReport(container, yearId, yearObj, entities) {
    const updateView = async () => {
      const isLineItems = this.globalSubTab === 'line-items';

      if (!isLineItems) {
        // Entity summary view
        const reportData = await Promise.all(entities.map(async e => {
          const payroll = await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id);
          const eha = await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id);
          const fixedAssets = await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id);
          const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);

          const rowsToSum = [];
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'salaries', entityId: e.id })) {
            rowsToSum.push(...payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages'));
          }
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-staff', entityId: e.id })) {
            rowsToSum.push(...payroll.filter(p => p.subCategory === 'other-staff-expenses'));
          }
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'gratuity', entityId: e.id })) {
            rowsToSum.push(...payroll.filter(p => p.subCategory === 'gratuity-bonus'));
          }
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'eha', entityId: e.id })) {
            rowsToSum.push(...eha);
          }
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'fixed-assets', entityId: e.id })) {
            rowsToSum.push(...fixedAssets);
          }
          if (typeof Auth === 'undefined' || Auth.hasPermission('view', { category: 'other-costs', entityId: e.id })) {
            rowsToSum.push(...nonPayroll);
          }

          const monthlyLocal = Array(12).fill(0);
          let totalLocal = 0;

          rowsToSum.forEach(row => {
            if (row.monthlyValues) {
              Object.entries(row.monthlyValues).forEach(([mIdx, val]) => {
                const num = Utils.parseNumber(val);
                monthlyLocal[mIdx] += num;
                totalLocal += num;
              });
            }
          });

          const rate = yearObj.conversionRates?.[e.currency] || 1.0;
          const monthlyUSD = monthlyLocal.map(v => Utils.convertToUSD(v, rate));
          const totalUSD = Utils.convertToUSD(totalLocal, rate);

          return { entity: e, currency: e.currency, rate, monthlyLocal, totalLocal, monthlyUSD, totalUSD };
        }));

        const grandMonthlyUSD = Array(12).fill(0);
        let grandTotalUSD = 0;

        reportData.forEach(r => {
          r.monthlyUSD.forEach((v, idx) => grandMonthlyUSD[idx] += v);
          grandTotalUSD += r.totalUSD;
        });

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div>
                <div class="card-title">🌐 Global Consolidated Budget (USD) — CY-${yearObj.year}</div>
                <div class="card-subtitle">Values converted to USD using approved budget exchange rates</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.exportGlobalUSDReport()">📊 Export Excel</button>
            </div>

            <!-- Sub-tabs: Entity Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.globalSubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Entity (USD)</button>
              <button class="sub-tab ${this.globalSubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (All Countries Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
                <thead>
                  <tr>
                    <th class="sticky-col">Entity</th>
                    <th>Currency</th>
                    <th class="num">Exchange Rate</th>
                    <th class="num">Total Budget (Local Currency)</th>
                    <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total (USD) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                    ${SEED_DATA.months.map(m => `<th class="num month-group">${m} (USD)</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map(r => `
                    <tr>
                      <td class="sticky-col"><strong>${r.entity.flag} ${r.entity.shortName}</strong></td>
                      <td><code>${r.currency}</code></td>
                      <td class="num">${r.rate.toFixed(2)}</td>
                      <td class="num font-bold">${Utils.formatCurrency(r.totalLocal, r.currency)}</td>
                      <td class="num font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(r.totalUSD, 'USD')}</td>
                      ${r.monthlyUSD.map(v => `<td class="num month-col">${Utils.formatCurrency(v, 'USD')}</td>`).join('')}
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td class="sticky-col">GRAND TOTAL (GLOBAL USD)</td>
                    <td>USD</td>
                    <td class="num">1.00</td>
                    <td class="num text-muted">—</td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatCurrency(grandTotalUSD, 'USD')}</td>
                    ${grandMonthlyUSD.map(v => `<td class="num month-col">${Utils.formatCurrency(v, 'USD')}</td>`).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        // Clubbed line items across all countries
        const lines = await this.buildConsolidatedLineItems(entities, yearId, yearObj.conversionRates);
        const grandTotalUSD = lines.reduce((sum, r) => sum + r.totalUSD, 0);
        const grandMonthlyUSD = Array(12).fill(0);
        lines.forEach(r => {
          r.monthlyUSD.forEach((v, idx) => grandMonthlyUSD[idx] += v);
        });

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div>
                <div class="card-title">🌐 Global Consolidated Line Item Budget (USD) — CY-${yearObj.year}</div>
                <div class="card-subtitle">All departments across all countries clubbed by GL Line Item and converted to USD</div>
              </div>
              <div class="flex gap-sm">
                <span class="badge badge-emerald">🌐 All 5 Countries Clubbed</span>
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.exportGlobalUSDReport()">📊 Export Excel</button>
              </div>
            </div>

            <!-- Sub-tabs: Entity Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.globalSubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Entity (USD)</button>
              <button class="sub-tab ${this.globalSubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (All Countries Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
                <thead>
                  <tr>
                    <th class="sticky-col-1">Parent Account</th>
                    <th class="sticky-col-2">GL Line Item Description</th>
                    <th>Ledger Code</th>
                    <th>Linked Input Source</th>
                    <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${yearObj.year} (USD $) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                    ${SEED_DATA.months.map(m => `<th class="num month-group">${m}-${yearObj.year} (USD)</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  <!-- ─── Line Items ─── -->
                  ${lines.map(r => `
                    <tr>
                      <td class="sticky-col-1 font-bold"><strong>${r.parentAccount || ''}</strong></td>
                      <td class="sticky-col-2 font-medium">${r.glDescription || ''}</td>
                      <td><code>${r.ledgerCode || ''}</code></td>
                      <td><span class="badge ${r.linkedSource.includes('Travel') ? 'badge-cyan' : r.linkedSource.includes('Supplies') ? 'badge-primary' : r.linkedSource.includes('Communication') ? 'badge-info' : r.linkedSource.includes('Office') ? 'badge-warning' : r.linkedSource.includes('Professional') ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 11px; white-space: nowrap;">${r.sourceIcon} ${r.linkedSource}</span></td>
                      <td class="num font-bold" style="color: ${r.totalUSD > 0 ? 'var(--accent-primary)' : 'inherit'};">
                        ${Utils.formatCurrency(r.totalUSD, 'USD')}
                      </td>
                      ${r.monthlyUSD.map(v => `
                        <td class="num month-col font-mono" style="${v > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatCurrency(v, 'USD')}</td>
                      `).join('')}
                    </tr>
                  `).join('')}

                  <!-- ─── Bottom Master Rollup Total ─── -->
                  <tr class="total-row">
                    <td class="sticky-col-1 font-bold">GRAND TOTAL (GLOBAL USD):</td>
                    <td class="sticky-col-2 font-bold">Consolidated USD</td>
                    <td colspan="2"></td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">
                      ${Utils.formatCurrency(grandTotalUSD, 'USD')}
                    </td>
                    ${grandMonthlyUSD.map(v => `
                      <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(v, 'USD')}</td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Attach sub-tab listeners
      container.querySelectorAll('.sub-tab').forEach(st => {
        st.addEventListener('click', () => {
          this.globalSubTab = st.dataset.subtab;
          updateView();
        });
      });
    };

    await updateView();
  },

  // ─── India Consolidated (INR) Report ───
  async renderIndiaReport(container, yearId, yearObj, entities) {
    const indiaEntities = entities.filter(e => e.country === 'India');
    const inrRate = yearObj.conversionRates?.INR || 83.5;

    const updateView = async () => {
      const isLineItems = this.indiaSubTab === 'line-items';

      if (!isLineItems) {
        // Summary by Entity
        const reportData = await Promise.all(indiaEntities.map(async e => {
          const payroll = await db.getEntityBudgetData(STORES.payrollPersonnel, yearId, e.id);
          const eha = await db.getEntityBudgetData(STORES.payrollEHA, yearId, e.id);
          const fixedAssets = await db.getEntityBudgetData(STORES.payrollFixedAsset, yearId, e.id);
          const nonPayroll = await db.getEntityBudgetData(STORES.nonPayrollCost, yearId, e.id);

          const monthly = Array(12).fill(0);
          let total = 0;

          [...payroll, ...eha, ...fixedAssets, ...nonPayroll].forEach(row => {
            if (row.monthlyValues) {
              Object.entries(row.monthlyValues).forEach(([mIdx, val]) => {
                const num = Utils.parseNumber(val);
                monthly[mIdx] += num;
                total += num;
              });
            }
          });

          const totalUSD = Utils.convertToUSD(total, inrRate);

          return { entity: e, monthly, total, totalUSD };
        }));

        const grandMonthly = Array(12).fill(0);
        let grandTotal = 0;
        reportData.forEach(r => {
          r.monthly.forEach((v, idx) => grandMonthly[idx] += v);
          grandTotal += r.total;
        });
        const grandTotalUSD = Utils.convertToUSD(grandTotal, inrRate);

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div>
                <div class="card-title">🇮🇳 India Consolidated Budget (NHIPL + YAIF) — CY-${yearObj.year}</div>
                <div class="card-subtitle">Showing totals in INR (₹) and converted USD ($) @ 1 USD = ${inrRate} INR</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.exportReport('india-consolidated')">📊 Export Excel</button>
            </div>

            <!-- Sub-tabs: Entity Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.indiaSubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Entity (INR & USD)</button>
              <button class="sub-tab ${this.indiaSubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (NHIPL + YAIF Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
                <thead>
                  <tr>
                    <th class="sticky-col">India Entity</th>
                    <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total (INR ₹) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                    <th class="num font-bold">Total (USD $)</th>
                    ${SEED_DATA.months.map(m => `<th class="num month-group">${m} (INR ₹)</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map(r => `
                    <tr>
                      <td class="sticky-col"><strong>${r.entity.flag} ${r.entity.name} (${r.entity.shortName})</strong></td>
                      <td class="num font-bold">${Utils.formatCurrency(r.total, 'INR')}</td>
                      <td class="num font-bold" style="color: var(--accent-primary);">≈ ${Utils.formatCurrency(r.totalUSD, 'USD')}</td>
                      ${r.monthly.map(v => `<td class="num month-col">${Utils.formatCurrency(v, 'INR')}</td>`).join('')}
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td class="sticky-col">INDIA CONSOLIDATED TOTAL</td>
                    <td class="num font-bold">${Utils.formatCurrency(grandTotal, 'INR')}</td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">≈ ${Utils.formatCurrency(grandTotalUSD, 'USD')}</td>
                    ${grandMonthly.map(v => `<td class="num month-col">${Utils.formatCurrency(v, 'INR')}</td>`).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        // Clubbed line items across NHIPL and YAIF
        const lines = await this.buildConsolidatedLineItems(indiaEntities, yearId, yearObj.conversionRates);
        const grandTotalINR = lines.reduce((sum, r) => sum + r.totalLocal, 0);
        const grandMonthlyINR = Array(12).fill(0);
        lines.forEach(r => {
          r.monthlyLocal.forEach((v, idx) => grandMonthlyINR[idx] += v);
        });

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div>
                <div class="card-title">🇮🇳 India Consolidated Line Item Budget (NHIPL + YAIF) — CY-${yearObj.year}</div>
                <div class="card-subtitle">All departments across NHIPL & YAIF clubbed by GL Line Item in INR (₹) and USD ($)</div>
              </div>
              <div class="flex gap-sm">
                <span class="badge badge-emerald">🇮🇳 NHIPL + YAIF Combined</span>
                <button class="btn btn-secondary btn-sm" onclick="ExcelIOModule.exportReport('india-consolidated')">📊 Export Excel</button>
              </div>
            </div>

            <!-- Sub-tabs: Entity Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.indiaSubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Entity (INR & USD)</button>
              <button class="sub-tab ${this.indiaSubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (NHIPL + YAIF Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
                <thead>
                  <tr>
                    <th class="sticky-col-1">Parent Account</th>
                    <th class="sticky-col-2">GL Line Item Description</th>
                    <th>Ledger Code</th>
                    <th>Linked Input Source</th>
                    <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${yearObj.year} (INR ₹ & USD $) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                    ${SEED_DATA.months.map(m => `<th class="num month-group">${m}-${yearObj.year} (INR ₹)</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  <!-- ─── Line Items ─── -->
                  ${lines.map(r => `
                    <tr>
                      <td class="sticky-col-1 font-bold"><strong>${r.parentAccount || ''}</strong></td>
                      <td class="sticky-col-2 font-medium">${r.glDescription || ''}</td>
                      <td><code>${r.ledgerCode || ''}</code></td>
                      <td><span class="badge ${r.linkedSource.includes('Travel') ? 'badge-cyan' : r.linkedSource.includes('Supplies') ? 'badge-primary' : r.linkedSource.includes('Communication') ? 'badge-info' : r.linkedSource.includes('Office') ? 'badge-warning' : r.linkedSource.includes('Professional') ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 11px; white-space: nowrap;">${r.sourceIcon} ${r.linkedSource}</span></td>
                      <td class="num font-bold" style="color: ${r.totalLocal > 0 ? 'var(--accent-primary)' : 'inherit'};">
                        ${Utils.formatDualCurrency(r.totalLocal, 'INR', inrRate, { multiline: true })}
                      </td>
                      ${r.monthlyLocal.map(v => `
                        <td class="num month-col font-mono" style="${v > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatCurrency(v, 'INR')}</td>
                      `).join('')}
                    </tr>
                  `).join('')}

                  <!-- ─── Bottom Master Rollup Total ─── -->
                  <tr class="total-row">
                    <td class="sticky-col-1 font-bold">INDIA CONSOLIDATED TOTAL:</td>
                    <td class="sticky-col-2 font-bold">INR ₹ & USD $</td>
                    <td colspan="2"></td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">
                      ${Utils.formatDualCurrency(grandTotalINR, 'INR', inrRate, { multiline: true })}
                    </td>
                    ${grandMonthlyINR.map(v => `
                      <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(v, 'INR')}</td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Attach sub-tab listeners
      container.querySelectorAll('.sub-tab').forEach(st => {
        st.addEventListener('click', () => {
          this.indiaSubTab = st.dataset.subtab;
          updateView();
        });
      });
    };

    await updateView();
  },

  // ─── Single Entity Summary Report ───
  async renderEntitySummaryReport(container, yearId, entities) {
    let selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
    const years = await db.getAll(STORES.budgetYears);
    const activeYearObj = years.find(y => y.id === yearId) || { year: 2026, conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };

    const updateView = async () => {
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const departments = Utils.sortDepartments(await db.getAll(STORES.departments));
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;
      const isLineItems = this.entitySubTab === 'line-items';

      if (!isLineItems) {
        // Department breakdown view
        const deptData = await Promise.all(departments.map(async d => {
          const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, d.id);
          const salaries = payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
          const otherStaffGratuity = payroll.filter(p => p.subCategory === 'other-staff-expenses' || p.subCategory === 'gratuity-bonus');
          const eha = await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, d.id);
          const fixedAssets = await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, d.id);
          const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, d.id);

          let salariesTotal = 0;
          let otherStaffGratuityTotal = 0;
          let ehaTotal = 0;
          let fixedAssetsTotal = 0;
          let nonPayrollTotal = 0;

          salaries.forEach(p => salariesTotal += Utils.parseNumber(p.totalCY));
          otherStaffGratuity.forEach(p => otherStaffGratuityTotal += Utils.parseNumber(p.totalCY));
          eha.forEach(p => ehaTotal += Utils.parseNumber(p.totalCY));
          fixedAssets.forEach(f => fixedAssetsTotal += Utils.parseNumber(f.totalCY));
          nonPayroll.forEach(p => nonPayrollTotal += Utils.parseNumber(p.totalCY));

          const grandTotal = salariesTotal + otherStaffGratuityTotal + ehaTotal + fixedAssetsTotal + nonPayrollTotal;

          return {
            dept: d,
            displayName: Utils.getDeptName(d, entity.deptPrefix),
            salariesTotal,
            otherStaffGratuityTotal,
            ehaTotal,
            fixedAssetsTotal,
            nonPayrollTotal,
            grandTotal
          };
        }));

        const activeDepts = deptData.filter(d => d.grandTotal > 0);

        const totalSalaries = activeDepts.reduce((sum, d) => sum + d.salariesTotal, 0);
        const totalOtherStaffGratuity = activeDepts.reduce((sum, d) => sum + d.otherStaffGratuityTotal, 0);
        const totalEha = activeDepts.reduce((sum, d) => sum + d.ehaTotal, 0);
        const totalFixedAssets = activeDepts.reduce((sum, d) => sum + d.fixedAssetsTotal, 0);
        const totalNonPayroll = activeDepts.reduce((sum, d) => sum + d.nonPayrollTotal, 0);
        const grandEntityTotal = activeDepts.reduce((sum, d) => sum + d.grandTotal, 0);

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div class="form-inline gap-md">
                <label class="form-label" style="margin:0; font-weight: 600;">Select Entity / Country:</label>
                <select class="form-select" id="reportEntitySelect" style="width: auto;">
                  ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntityId ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.name})</option>`).join('')}
                </select>
              </div>
              <div class="flex gap-sm items-center">
                <div class="badge badge-emerald" style="font-size: var(--font-size-sm);">${activeDepts.length} Budgeted Department(s)</div>
                <div class="badge badge-cyan" style="font-size: var(--font-size-sm);">Currency: <strong>${entity.currency}</strong></div>
                ${entity.currency !== 'USD' ? `<div class="badge badge-subtle" style="font-size: var(--font-size-sm);">1 USD = <strong>${rate} ${entity.currency}</strong></div>` : ''}
              </div>
            </div>

            <!-- Sub-tabs: Department Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.entitySubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Department</button>
              <button class="sub-tab ${this.entitySubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (All Departments Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="sticky-col">Department</th>
                    <th class="num">Salaries & Wages</th>
                    <th class="num">Other Staff & Benefits</th>
                    <th class="num">EHA Consultants</th>
                    <th class="num">Fixed Assets</th>
                    <th class="num">Other Costs</th>
                    <th class="num font-bold">Total Dept Budget (${entity.currency} / USD)</th>
                  </tr>
                </thead>
                <tbody>
                  ${activeDepts.length === 0 ? `
                    <tr>
                      <td colspan="7" class="text-center text-muted" style="padding: 32px;">
                        No budgeted department records found for <strong>${entity.flag} ${entity.shortName}</strong> in CY-${activeYearObj.year}.
                        <br><button class="btn btn-primary btn-sm mt-sm" onclick="DashboardModule.goToDeptBudget('${entity.id}', '${departments[0]?.id}')">✏️ Enter First Department Budget</button>
                      </td>
                    </tr>
                  ` : activeDepts.map(d => `
                    <tr>
                      <td class="sticky-col">
                        <a href="javascript:void(0)" onclick="DashboardModule.goToDeptBudget('${entity.id}', '${d.dept.id}')" style="color: var(--accent-primary); font-weight: 600; text-decoration: none;" title="Open Department Budget">
                          ${d.displayName} ↗
                        </a>
                      </td>
                      <td class="num">${Utils.formatDualCurrency(d.salariesTotal, entity.currency, rate, { multiline: true })}</td>
                      <td class="num">${Utils.formatDualCurrency(d.otherStaffGratuityTotal, entity.currency, rate, { multiline: true })}</td>
                      <td class="num">${Utils.formatDualCurrency(d.ehaTotal, entity.currency, rate, { multiline: true })}</td>
                      <td class="num">${Utils.formatDualCurrency(d.fixedAssetsTotal, entity.currency, rate, { multiline: true })}</td>
                      <td class="num">${Utils.formatDualCurrency(d.nonPayrollTotal, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(d.grandTotal, entity.currency, rate, { multiline: true })}</td>
                    </tr>
                  `).join('')}
                  ${activeDepts.length > 0 ? `
                    <tr class="total-row">
                      <td class="sticky-col">${entity.shortName} TOTAL</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(totalSalaries, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(totalOtherStaffGratuity, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(totalEha, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(totalFixedAssets, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold">${Utils.formatDualCurrency(totalNonPayroll, entity.currency, rate, { multiline: true })}</td>
                      <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">${Utils.formatDualCurrency(grandEntityTotal, entity.currency, rate, { multiline: true })}</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        // Clubbed line items across all departments of this entity
        const lines = await this.buildConsolidatedLineItems([entity], yearId, activeYearObj.conversionRates);
        const grandTotalLocal = lines.reduce((sum, r) => sum + r.totalLocal, 0);
        const grandMonthlyLocal = Array(12).fill(0);
        lines.forEach(r => {
          r.monthlyLocal.forEach((v, idx) => grandMonthlyLocal[idx] += v);
        });

        container.innerHTML = `
          <div class="card mb-lg">
            <div class="card-header flex justify-between items-center">
              <div class="form-inline gap-md">
                <label class="form-label" style="margin:0; font-weight: 600;">Select Entity / Country:</label>
                <select class="form-select" id="reportEntitySelect" style="width: auto;">
                  ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntityId ? 'selected' : ''}>${e.flag} ${e.shortName} (${e.name})</option>`).join('')}
                </select>
              </div>
              <div class="flex gap-sm items-center">
                <span class="badge badge-emerald">${entity.shortName} All Departments Clubbed</span>
                <div class="badge badge-cyan" style="font-size: var(--font-size-sm);">Currency: <strong>${entity.currency}</strong></div>
                ${entity.currency !== 'USD' ? `<div class="badge badge-subtle" style="font-size: var(--font-size-sm);">1 USD = <strong>${rate} ${entity.currency}</strong></div>` : ''}
              </div>
            </div>

            <!-- Sub-tabs: Department Summary vs Consolidated Line Items -->
            <div class="sub-tabs mb-md">
              <button class="sub-tab ${this.entitySubTab === 'summary' ? 'active' : ''}" data-subtab="summary">🏢 Summary by Department</button>
              <button class="sub-tab ${this.entitySubTab === 'line-items' ? 'active' : ''}" data-subtab="line-items">📑 Consolidated Line Items (All Departments Clubbed)</button>
            </div>

            <div class="table-container">
              <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
                <thead>
                  <tr>
                    <th class="sticky-col-1">Parent Account</th>
                    <th class="sticky-col-2">GL Line Item Description</th>
                    <th>Ledger Code</th>
                    <th>Linked Input Source</th>
                    <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${activeYearObj.year} (${entity.currency} & USD) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                    ${SEED_DATA.months.map(m => `<th class="num month-group">${m}-${activeYearObj.year}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  <!-- ─── Line Items ─── -->
                  ${lines.map(r => `
                    <tr>
                      <td class="sticky-col-1 font-bold"><strong>${r.parentAccount || ''}</strong></td>
                      <td class="sticky-col-2 font-medium">${r.glDescription || ''}</td>
                      <td><code>${r.ledgerCode || ''}</code></td>
                      <td><span class="badge ${r.linkedSource.includes('Travel') ? 'badge-cyan' : r.linkedSource.includes('Supplies') ? 'badge-primary' : r.linkedSource.includes('Communication') ? 'badge-info' : r.linkedSource.includes('Office') ? 'badge-warning' : r.linkedSource.includes('Professional') ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 11px; white-space: nowrap;">${r.sourceIcon} ${r.linkedSource}</span></td>
                      <td class="num font-bold" style="color: ${r.totalLocal > 0 ? 'var(--accent-primary)' : 'inherit'};">
                        ${Utils.formatDualCurrency(r.totalLocal, entity.currency, rate, { multiline: true })}
                      </td>
                      ${r.monthlyLocal.map(v => `
                        <td class="num month-col font-mono" style="${v > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatCurrency(v, entity.currency)}</td>
                      `).join('')}
                    </tr>
                  `).join('')}

                  <!-- ─── Bottom Master Rollup Total ─── -->
                  <tr class="total-row">
                    <td class="sticky-col-1 font-bold">${entity.shortName} TOTAL:</td>
                    <td class="sticky-col-2 font-bold">${entity.currency} & USD</td>
                    <td colspan="2"></td>
                    <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">
                      ${Utils.formatDualCurrency(grandTotalLocal, entity.currency, rate, { multiline: true })}
                    </td>
                    ${grandMonthlyLocal.map(v => `
                      <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(v, entity.currency)}</td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Entity select listener
      const entitySelect = container.querySelector('#reportEntitySelect');
      if (entitySelect) {
        entitySelect.addEventListener('change', (e) => {
          selectedEntityId = e.target.value;
          ReportsModule.selectedEntityId = e.target.value;
          updateView();
        });
      }

      // Sub-tab listeners
      container.querySelectorAll('.sub-tab').forEach(st => {
        st.addEventListener('click', () => {
          this.entitySubTab = st.dataset.subtab;
          updateView();
        });
      });
    };

    await updateView();
  },

  // Helper to categorize other non-payroll costs
  getOtherCostCategory(account) {
    const gl = String(account.glDescription || '').toLowerCase();
    const parent = String(account.parentAccount || '').toLowerCase();
    const code = String(account.ledgerCode || '');

    if (code.startsWith('931') || parent.includes('travel') || gl.includes('hotel') || gl.includes('food') || gl.includes('air') || gl.includes('cab') || gl.includes('bus') || gl.includes('train')) return 'travel';
    if (code.startsWith('932') || parent.includes('supplies') || parent.includes('printing') || gl.includes('print')) return 'supplies';
    if (code.startsWith('933') || parent.includes('communication') || gl.includes('internet') || gl.includes('postage') || gl.includes('telecom')) return 'communication';
    if (code.startsWith('934') || parent.includes('office') || gl.includes('software') || gl.includes('stationery') || gl.includes('equipment')) return 'office';
    if (code.startsWith('937') || parent.includes('professional') || parent.includes('consultancy') || gl.includes('consultant')) return 'professional';
    return 'other';
  },

  // ─── Department Summary Report (Total Dept Cost Format) ───
  async renderDeptSummaryReport(container, yearId, entities, departments) {
    let selectedEntityId = ReportsModule.selectedEntityId || App.selectedEntity || entities[0]?.id || '';
    let selectedDeptId = ReportsModule.selectedDeptId || App.selectedDept || departments[0]?.id || '';
    const years = await db.getAll(STORES.budgetYears);
    const activeYearObj = years.find(y => y.id === yearId) || { year: 2026, conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
    const budgetYear = activeYearObj.year || 2026;

    const updateView = async () => {
      const entity = entities.find(e => e.id === selectedEntityId) || entities[0];
      const rate = activeYearObj.conversionRates?.[entity.currency] || 1.0;
      const coa = await db.getAll(STORES.chartOfAccounts);

      const entityConfigs = await db.getEntityDeptConfigForYear(yearId, entity.id);
      const activeDeptIds = new Set(entityConfigs.filter(c => c.isActive).map(c => c.deptId));
      const entityDepts = departments.filter(d => activeDeptIds.size === 0 || activeDeptIds.has(d.id));
      if (entityDepts.length > 0 && !entityDepts.find(d => d.id === selectedDeptId)) {
        selectedDeptId = entityDepts[0].id;
      }
      const dept = entityDepts.find(d => d.id === selectedDeptId) || departments.find(d => d.id === selectedDeptId) || departments[0];

      // Fetch all input records for this department & year
      const personnelAll = await db.getBudgetData(STORES.payrollPersonnel, yearId, entity.id, dept.id);
      const salariesRows = personnelAll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages');
      const otherStaffRows = personnelAll.filter(p => p.subCategory === 'other-staff-expenses');
      const gratuityRows = personnelAll.filter(p => p.subCategory === 'gratuity-bonus');
      const ehaRows = await db.getBudgetData(STORES.payrollEHA, yearId, entity.id, dept.id);
      const fixedAssetRows = await db.getBudgetData(STORES.payrollFixedAsset, yearId, entity.id, dept.id);
      const otherCostRows = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, dept.id);

      // Fetch stored basis and remarks notes from totalCostSheet
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

      // Fetch prior period costs for this entity and department
      const priorCosts = await db.getPriorPeriodCosts(yearId, entity.id, dept.id);
      const priorYear = activeYearObj.priorYear || (budgetYear - 1);
      const priorMap = {};
      priorCosts.forEach(p => {
        if (p.ledgerCode) priorMap[cleanStr(p.ledgerCode)] = p.priorCost || 0;
        if (p.glDescription) priorMap[cleanStr(p.glDescription)] = p.priorCost || 0;
      });

      const lines = coa.map(account => {
        let linkedSource = '';
        let sourceIcon = '📑';
        let rollup = { monthlyValues: Array(12).fill(0), totalCY: 0 };
        let basis = '';
        let remarks = savedRemarksMap[account.ledgerCode] || savedRemarksMap[account.glDescription] || '';

        const accGlClean = cleanStr(account.glDescription);
        const accLedgerClean = cleanStr(account.ledgerCode);
        const accParentClean = cleanStr(account.parentAccount);

        // 1. Salaries and Wages
        if (accGlClean.includes('salariesandwages') || accLedgerClean.startsWith('911') || accParentClean.includes('salariesandwages')) {
          linkedSource = 'Payroll — Salaries & Wages';
          sourceIcon = '👥';
          rollup = sumMonths(salariesRows);
          basis = salariesRows.length > 0 ? `${salariesRows.length} Employee(s)` : '';
        }
        // 2. Staff Training, Learning (Other Staff Expenses)
        else if (accGlClean.includes('stafftraining') || accLedgerClean.startsWith('913') || accParentClean.includes('otherstaff')) {
          linkedSource = 'Payroll — Other Staff Expenses';
          sourceIcon = '👥';
          rollup = sumMonths(otherStaffRows);
          basis = otherStaffRows.length > 0 ? `${otherStaffRows.length} Item(s)` : '';
        }
        // 3. Gratuity and Bonus
        else if (accGlClean.includes('gratuity') || accLedgerClean.startsWith('912') || accParentClean.includes('health') || accParentClean.includes('retirement')) {
          linkedSource = 'Payroll — Gratuity & Bonus';
          sourceIcon = '👥';
          rollup = sumMonths(gratuityRows);
          basis = gratuityRows.length > 0 ? `${gratuityRows.length} Item(s)` : '';
        }
        // 4. Program Resource Consultant (EHA)
        else if (accGlClean.includes('programresource') || accGlClean.includes('eha') || accLedgerClean.startsWith('921') || accParentClean.includes('resourceperson')) {
          linkedSource = 'Payroll — EHA Consultants';
          sourceIcon = '🤝';
          rollup = sumMonths(ehaRows);
          basis = ehaRows.length > 0 ? `${ehaRows.length} Consultant(s)` : '';
        }
        // 5. Fixed Assets (Laptop/Printer)
        else if (accGlClean.includes('laptop') || accGlClean.includes('printer') || accLedgerClean.startsWith('113') || accParentClean.includes('fixedasset')) {
          linkedSource = 'Fixed Assets';
          sourceIcon = '💻';
          rollup = sumMonths(fixedAssetRows);
          basis = fixedAssetRows.length > 0 ? `${fixedAssetRows.length} Asset(s)` : '';
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

          const bases = matchingOther.map(o => o.basisOfExpense).filter(Boolean);
          if (bases.length > 0) {
            basis = bases.join('; ');
          }

          if (!remarks) {
            const rems = matchingOther.map(o => o.remarks).filter(Boolean);
            if (rems.length > 0) remarks = rems.join('; ');
          }
        }

        const savedBasis = savedBasisMap[account.ledgerCode] || savedBasisMap[account.glDescription];
        if (savedBasis) basis = savedBasis;

        const priorCost = priorMap[accLedgerClean] || priorMap[accGlClean] || 0;

        return {
          subGroup: account.subGroup,
          parentAccount: account.parentAccount,
          glDescription: account.glDescription,
          ledgerCode: account.ledgerCode,
          linkedSource,
          sourceIcon,
          basisOfExpense: basis,
          remarks,
          monthlyValues: rollup.monthlyValues,
          totalCY: rollup.totalCY,
          priorCost
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
          const priorCost = priorMap[cleanStr(o.ledgerCode)] || priorMap[cleanStr(o.glDescription)] || 0;

          lines.push({
            subGroup: o.subGroup || 'Direct Cost',
            parentAccount: o.parentAccount || 'Other Costs',
            glDescription: o.glDescription || 'Miscellaneous Expense',
            ledgerCode: o.ledgerCode || '93999',
            linkedSource: cMeta.label,
            sourceIcon: cMeta.icon,
            basisOfExpense: o.basisOfExpense || '',
            remarks: o.remarks || '',
            monthlyValues: months,
            totalCY: total,
            priorCost
          });
        }
      });

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

      const totalCost = visibleLines.reduce((sum, r) => sum + r.totalCY, 0);
      const totalPriorCost = visibleLines.reduce((sum, r) => sum + (r.priorCost || 0), 0);
      const colMonthlySums = Array(12).fill(0);
      visibleLines.forEach(r => {
        if (r.monthlyValues) {
          r.monthlyValues.forEach((v, idx) => {
            colMonthlySums[idx] += (Utils.parseNumber(v) || 0);
          });
        }
      });

      const remarksSummary = await db.getDeptRemarksSummary(yearId, entity.id, dept.id);

      const deptDisplayName = Utils.getDeptName(dept, entity.deptPrefix);

      container.innerHTML = `
        <div class="card mb-lg">
          <div class="card-header flex justify-between items-center">
            <div class="form-inline gap-md">
              <div>
                <label class="form-label" style="margin:0; font-weight: 600;">Entity:</label>
                <select class="form-select" id="deptReportEntitySelect" style="width: auto;">
                  ${entities.map(e => `<option value="${e.id}" ${e.id === selectedEntityId ? 'selected' : ''}>${e.flag} ${e.shortName}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label" style="margin:0; font-weight: 600;">Department:</label>
                <select class="form-select" id="deptReportDeptSelect" style="min-width: 250px;">
                  ${entityDepts.map(d => `<option value="${d.id}" ${d.id === dept.id ? 'selected' : ''}>${Utils.getDeptName(d, entity.deptPrefix)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="flex gap-sm items-center">
              <div class="badge badge-cyan" style="font-size: var(--font-size-sm);">Currency: <strong>${entity.currency}</strong></div>
              ${entity.currency !== 'USD' ? `<div class="badge badge-subtle" style="font-size: var(--font-size-sm);">1 USD = <strong>${rate} ${entity.currency}</strong></div>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="DashboardModule.goToDeptBudget('${entity.id}', '${dept.id}')" title="Edit department inputs">✏️ Edit in Budget Entry</button>
              <button class="btn btn-ghost btn-sm" onclick="ConfigModule.managePriorPeriodCosts('${yearId}', '${entity.id}', '${dept.id}')" title="Directly update prior period costs in application">📊 Edit Prior Period</button>
            </div>
          </div>

          <!-- Total Dept Cost Summary KPI Banner -->
          <div class="card p-md mb-md flex items-center justify-between" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.06)); border: 1px solid rgba(16, 185, 129, 0.2);">
            <div class="flex items-center gap-lg">
              <div>
                <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Dept Cost Lines</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary);">${lines.length} Account Lines</div>
              </div>
              <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
                <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Total Dept Cost Budget (${entity.currency})</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--success);">${Utils.formatCurrency(totalCost, entity.currency)}</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
                  ${entity.currency !== 'USD' ? `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalCost, rate), 'USD')} <span class="text-tertiary" style="font-size: 11px;">(@ ${rate} ${entity.currency}/USD)</span>` : ''}
                </div>
              </div>
              <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
                <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Prior Period Cost (${entity.currency})</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent-primary);">${Utils.formatCurrency(totalPriorCost, entity.currency)}</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px;">
                  ${totalPriorCost > 0 ? `Change vs Prior: <strong>${((totalCost - totalPriorCost) / totalPriorCost * 100).toFixed(1)}%</strong>` : 'Historical Base'}
                </div>
              </div>
              <div style="border-left: 1px solid var(--border-subtle); padding-left: var(--space-lg);">
                <div class="text-tertiary" style="font-size: var(--font-size-xs); text-transform: uppercase;">Department</div>
                <div style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">${deptDisplayName}</div>
              </div>
            </div>
            <div>
              <span class="badge badge-emerald" style="padding: 6px 12px; font-size: 12px;">🔗 Master Rollup Format</span>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table ${this.isMonthsCollapsed() ? 'months-collapsed' : ''}">
              <thead>
                <tr>
                  <th class="sticky-col-1">Parent Account</th>
                  <th class="sticky-col-2">GL Line Item Description</th>
                  <th>Ledger Code</th>
                  <th>Linked Input Source</th>
                  <th style="min-width: 130px;">Basis of Expense</th>
                  <th class="num font-bold total-toggle-th month-group" data-toggle-months title="${this.isMonthsCollapsed() ? 'Click to expand monthly columns (Jan–Dec)' : 'Click to collapse monthly columns (Jan–Dec)'}">Total CY-${budgetYear} (${entity.currency} & USD) <span class="months-toggle-arrow">${this.isMonthsCollapsed() ? '&#9654;' : '&#9664;'}</span></th>
                  ${SEED_DATA.months.map(m => `<th class="num month-group">${m}-${budgetYear}</th>`).join('')}
                  <th class="num font-bold prior-cost-col" style="min-width: 140px; background: #e2e8f0; color: var(--accent-primary);">Prior Period Cost (${entity.currency})</th>
                  <th style="min-width: 180px;">Remarks & Tasks</th>
                </tr>
              </thead>
              <tbody>
                <!-- ─── Master Account Lines ─── -->
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
                    <tr>
                      <td class="sticky-col-1 font-bold"><strong>${r.parentAccount || ''}</strong></td>
                      <td class="sticky-col-2 font-medium">${r.glDescription || ''}</td>
                      <td><code>${r.ledgerCode || ''}</code></td>
                      <td><span class="badge ${r.linkedSource.includes('Travel') ? 'badge-cyan' : r.linkedSource.includes('Supplies') ? 'badge-primary' : r.linkedSource.includes('Communication') ? 'badge-info' : r.linkedSource.includes('Office') ? 'badge-warning' : r.linkedSource.includes('Professional') ? 'badge-emerald' : 'badge-subtle'}" style="font-size: 11px; white-space: nowrap;">${r.sourceIcon} ${r.linkedSource}</span></td>
                      <td style="font-size: 11.5px; color: var(--text-secondary); max-width: 200px;">${r.basisOfExpense || '—'}</td>
                      <td class="num font-bold" style="color: ${r.totalCY > 0 ? 'var(--accent-primary)' : 'inherit'};">
                        ${Utils.formatDualCurrency(r.totalCY, entity.currency, rate, { multiline: true })}
                      </td>
                      ${SEED_DATA.months.map((m, idx) => `
                        <td class="num month-col font-mono" style="${r.monthlyValues[idx] > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${Utils.formatCurrency(r.monthlyValues[idx] || 0, entity.currency)}</td>
                      `).join('')}
                      <td class="num prior-cost-col font-mono" style="background: rgba(59, 130, 246, 0.03); color: ${r.priorCost > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'}; font-weight: ${r.priorCost > 0 ? '600' : 'normal'};">${r.priorCost > 0 ? Utils.formatCurrency(r.priorCost, entity.currency) : '—'}</td>
                      <td style="font-size: 11.5px; color: var(--text-primary); max-width: 240px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${r.remarks || '<span class="text-tertiary">—</span>'}</span>
                          ${taskBadgeHtml}
                          <button type="button" class="btn btn-ghost btn-xs flex items-center gap-xs" style="padding: 2px 5px; font-size: 10px; border-radius: 8px; color: var(--text-secondary); border: 1px solid var(--border-subtle); background: var(--bg-surface); white-space: nowrap; flex-shrink: 0;" onclick="BudgetEntryModule.openLinePermissionsModal('${r.ledgerCode}', '${Utils.escapeHtml(r.glDescription)}', '${r.parentAccount || 'other-costs'}')" title="View and customize Roles & Permissions for this line item">🛡️</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}

                <!-- ─── Bottom Master Rollup Total ─── -->
                <tr class="total-row">
                  <td class="sticky-col-1 font-bold">TOTAL DEPT BUDGET:</td>
                  <td class="sticky-col-2 font-bold">${entity.currency} & USD</td>
                  <td colspan="3"></td>
                  <td class="num font-bold" style="color: var(--accent-primary); font-size: 1.05rem;">
                    ${Utils.formatDualCurrency(totalCost, entity.currency, rate, { multiline: true })}
                  </td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(colMonthlySums[idx] || 0, entity.currency)}</td>
                  `).join('')}
                  <td class="num prior-cost-col font-mono font-bold" style="background: rgba(59, 130, 246, 0.08); color: var(--accent-primary);">${Utils.formatCurrency(totalPriorCost, entity.currency)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelector('#deptReportEntitySelect').addEventListener('change', (e) => {
        selectedEntityId = e.target.value;
        ReportsModule.selectedEntityId = e.target.value;
        updateView();
      });

      container.querySelector('#deptReportDeptSelect').addEventListener('change', (e) => {
        selectedDeptId = e.target.value;
        ReportsModule.selectedDeptId = e.target.value;
        updateView();
      });
    };

    await updateView();
  },

  // ─── 5-Dimensional Analytics & Line-Item Wise Reports ───
  async renderDimensionReport(container, yearId, yearObj, entities, departments) {
    this.dimensionKey = this.dimensionKey || 'donor'; // donor | location | activity | conditionArea
    this.dimensionScope = this.dimensionScope || 'all'; // all | india | entityId
    this.dimensionViewMode = this.dimensionViewMode || 'line-items'; // line-items | summary
    this.dimensionParentAccount = this.dimensionParentAccount || 'all'; // all | parentAccountName
    this.dimensionSearchQuery = this.dimensionSearchQuery || '';

    const activeYearObj = yearObj || { year: 2026, conversionRates: { USD: 1, INR: 83.5, BDT: 117, IDR: 16200, NPR: 133.5 } };
    const budgetYear = activeYearObj.year || 2026;

    const dimMeta = {
      dept: { title: 'Department', icon: '🏢', plural: 'Departments', defaultVal: 'General Department' },
      donor: { title: 'Donor / Funding Source', icon: '👤', plural: 'Donors', defaultVal: 'General Fund / Unrestricted' },
      location: { title: 'Geographic Location', icon: '📍', plural: 'Locations', defaultVal: 'All Locations' },
      activity: { title: 'Activity Stream', icon: '🎯', plural: 'Activities', defaultVal: 'Direct Service' },
      conditionArea: { title: 'Health Condition Area', icon: '🩺', plural: 'Condition Areas', defaultVal: 'All' },
      '5d': { title: 'Consolidated 5D Master Matrix', icon: '🌐', plural: '5D Matrix', defaultVal: '5D Master Matrix' }
    };

    const updateView = async () => {
      let targetEntities = entities;
      let currencyLabel = 'USD';
      let scopeTitle = 'Global Consolidated (All Entities)';
      let defaultRate = 1.0;

      if (this.dimensionScope === 'india') {
        targetEntities = entities.filter(e => e.country === 'India');
        currencyLabel = 'INR';
        scopeTitle = 'India Consolidated (NHIPL + YAIF)';
        defaultRate = activeYearObj.conversionRates?.INR || 83.5;
      } else if (this.dimensionScope !== 'all') {
        targetEntities = entities.filter(e => e.id === this.dimensionScope);
        if (targetEntities.length === 0) targetEntities = entities;
        currencyLabel = targetEntities[0].currency;
        scopeTitle = `${targetEntities[0].flag} ${targetEntities[0].name} (${targetEntities[0].shortName})`;
        defaultRate = activeYearObj.conversionRates?.[targetEntities[0].currency] || 1.0;
      }

      // Collect all bottom-up records from all 4 budget stores
      const rawLineItems = [];
      const get12Months = (row) => {
        const arr = Array(12).fill(0);
        if (!row || !row.monthlyValues) return arr;
        if (Array.isArray(row.monthlyValues)) return row.monthlyValues.map(v => Utils.parseNumber(v));
        Object.entries(row.monthlyValues).forEach(([k, v]) => {
          const idx = parseInt(k, 10);
          if (idx >= 0 && idx < 12) arr[idx] = Utils.parseNumber(v);
        });
        return arr;
      };

      for (const e of targetEntities) {
        const rate = activeYearObj.conversionRates?.[e.currency] || 1.0;
        for (const d of departments) {
          const deptShort = Utils.getDeptShortCode(d, e.deptPrefix);
          const deptName = Utils.getDeptName(d, e.deptPrefix);

          // 1. Salaries
          const payroll = await db.getBudgetData(STORES.payrollPersonnel, yearId, e.id, d.id);
          payroll.filter(p => !p.subCategory || p.subCategory === 'salaries-wages').forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Direct Service',
              conditionArea: r.conditionArea || 'All',
              parentAccount: 'Payroll & Personnel',
              glDescription: 'Salaries & Wages',
              ledgerCode: '91101',
              linkedSource: 'Payroll — Salaries',
              itemDescription: `${r.name || 'Staff'}${r.designation ? ' (' + r.designation + ')' : ''}`,
              basisOfExpense: `${r.banding || 'NH3'} - ${r.employeeStatus || 'Existing'}`,
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });

          // 2. Other Staff Expenses
          payroll.filter(p => p.subCategory === 'other-staff-expenses').forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Operations',
              conditionArea: r.conditionArea || 'All',
              parentAccount: 'Payroll & Personnel',
              glDescription: 'Staff Insurance & Welfare',
              ledgerCode: '91301',
              linkedSource: 'Payroll — Other Staff',
              itemDescription: r.name || r.expenseType || 'Staff Expense',
              basisOfExpense: r.expenseType || 'Staff Benefit',
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });

          // 3. Gratuity & Bonus
          payroll.filter(p => p.subCategory === 'gratuity-bonus').forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Operations',
              conditionArea: r.conditionArea || 'All',
              parentAccount: 'Payroll & Personnel',
              glDescription: 'Gratuity & Statutory Bonus',
              ledgerCode: '91201',
              linkedSource: 'Payroll — Gratuity',
              itemDescription: r.name || 'Bonus Provision',
              basisOfExpense: r.expenseType || 'Bonus',
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });

          // 4. EHA Consultants
          const eha = await db.getBudgetData(STORES.payrollEHA, yearId, e.id, d.id);
          eha.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Direct Service',
              conditionArea: r.conditionArea || 'All',
              parentAccount: 'Professional Fees',
              glDescription: 'Program Resource Consultants (EHA)',
              ledgerCode: '92101',
              linkedSource: 'Payroll — EHA',
              itemDescription: `${r.name || r.consultantName || 'Consultant'}${r.designation ? ' (' + r.designation + ')' : ''}`,
              basisOfExpense: r.contractType || 'Retainer',
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });

          // 5. Fixed Assets
          const fixedAssets = await db.getBudgetData(STORES.payrollFixedAsset, yearId, e.id, d.id);
          fixedAssets.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
              location: r.location || 'All Locations',
              donor: r.donor || 'General Fund',
              activity: r.activity || 'Operations',
              conditionArea: r.conditionArea || 'All',
              parentAccount: 'Fixed Assets & Hardware',
              glDescription: 'Computers, Hardware & Equipment',
              ledgerCode: '11301',
              linkedSource: 'Fixed Assets',
              itemDescription: `${r.category || 'IT Hardware'}: ${r.description || r.itemDescription || 'Equipment'}`,
              basisOfExpense: `Qty: ${r.quantity || 1}`,
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });

          // 6. Non-Payroll / Operating / Travel Costs
          const nonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, e.id, d.id);
          nonPayroll.forEach(r => {
            const mVals = get12Months(r);
            const totalLocal = Utils.parseNumber(r.totalCY) || mVals.reduce((sum, v) => sum + v, 0);
            const totalUSD = Utils.convertToUSD(totalLocal, rate);
            rawLineItems.push({
              entityShort: e.shortName, entityName: e.name, currency: e.currency, rate,
              deptShort, deptName,
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
              monthlyLocal: mVals,
              monthlyUSD: mVals.map(v => Utils.convertToUSD(v, rate)),
              totalLocal, totalUSD,
              remarks: r.remarks || ''
            });
          });
        }
      }

      // Unique Parent Accounts for Filter Dropdown
      const uniqueParentAccounts = Array.from(new Set(rawLineItems.map(r => r.parentAccount).filter(Boolean))).sort();

      // Apply Parent Account Filter
      let filteredItems = rawLineItems;
      if (this.dimensionParentAccount && this.dimensionParentAccount !== 'all') {
        filteredItems = filteredItems.filter(r => (r.parentAccount || '').toLowerCase() === this.dimensionParentAccount.toLowerCase());
      }

      // Filter by search query
      const q = String(this.dimensionSearchQuery || '').toLowerCase().trim();
      if (q) {
        filteredItems = filteredItems.filter(r => {
          return (r.itemDescription && r.itemDescription.toLowerCase().includes(q)) ||
                 (r.glDescription && r.glDescription.toLowerCase().includes(q)) ||
                 (r.parentAccount && r.parentAccount.toLowerCase().includes(q)) ||
                 (r.ledgerCode && r.ledgerCode.includes(q)) ||
                 (r.donor && r.donor.toLowerCase().includes(q)) ||
                 (r.location && r.location.toLowerCase().includes(q)) ||
                 (r.activity && r.activity.toLowerCase().includes(q)) ||
                 (r.conditionArea && r.conditionArea.toLowerCase().includes(q)) ||
                 (r.deptShort && r.deptShort.toLowerCase().includes(q)) ||
                 (r.entityShort && r.entityShort.toLowerCase().includes(q));
        });
      }

      // Group items by active dimension
      const dimKey = this.dimensionKey || 'donor';
      const groups = {};
      filteredItems.forEach(item => {
        let val;
        if (dimKey === 'dept') {
          val = String(item.deptName || item.deptShort || 'General Department').trim();
        } else if (dimKey === '5d') {
          val = 'Consolidated 5D Master Budget';
        } else {
          val = String(item[dimKey] || (dimMeta[dimKey] ? dimMeta[dimKey].defaultVal : 'All')).trim();
        }
        if (!groups[val]) groups[val] = [];
        groups[val].push(item);
      });

      const groupKeys = Object.keys(groups).sort((a, b) => {
        const totalA = groups[a].reduce((sum, r) => sum + (this.dimensionScope === 'india' ? r.totalLocal : r.totalUSD), 0);
        const totalB = groups[b].reduce((sum, r) => sum + (this.dimensionScope === 'india' ? r.totalLocal : r.totalUSD), 0);
        return totalB - totalA;
      });

      const grandTotalUSD = filteredItems.reduce((sum, r) => sum + r.totalUSD, 0);
      const grandTotalLocal = filteredItems.reduce((sum, r) => sum + r.totalLocal, 0);
      const grandMonthlyUSD = Array(12).fill(0);
      const grandMonthlyLocal = Array(12).fill(0);

      filteredItems.forEach(r => {
        r.monthlyUSD.forEach((v, idx) => grandMonthlyUSD[idx] += v);
        r.monthlyLocal.forEach((v, idx) => grandMonthlyLocal[idx] += v);
      });

      const activeMeta = dimMeta[dimKey] || dimMeta.donor;

      container.innerHTML = `
        <div class="card mb-lg" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border-default); overflow: hidden;">
          <!-- Compact Single-Row Toolbar (Minimised Space) -->
          <div class="p-sm flex justify-between items-center flex-wrap gap-sm" style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); padding: 8px 14px;">
            <!-- Left: Dimension Tabs & Selectors -->
            <div class="flex items-center gap-sm flex-wrap">
              <!-- Dimension Pills -->
              <div class="flex gap-1 items-center" style="background: var(--bg-card); padding: 2px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
                <button class="btn btn-sm ${dimKey === 'dept' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="dept" style="padding: 4px 10px; font-size: 11.5px;">🏢 By Dept</button>
                <button class="btn btn-sm ${dimKey === 'donor' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="donor" style="padding: 4px 10px; font-size: 11.5px;">👤 By Donor</button>
                <button class="btn btn-sm ${dimKey === 'location' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="location" style="padding: 4px 10px; font-size: 11.5px;">📍 By Location</button>
                <button class="btn btn-sm ${dimKey === 'activity' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="activity" style="padding: 4px 10px; font-size: 11.5px;">🎯 By Activity</button>
                <button class="btn btn-sm ${dimKey === 'conditionArea' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="conditionArea" style="padding: 4px 10px; font-size: 11.5px;">🩺 By Condition Area</button>
                <button class="btn btn-sm ${dimKey === '5d' ? 'btn-primary font-bold' : 'btn-ghost'}" data-dim="5d" style="padding: 4px 10px; font-size: 11.5px;">🌐 5D Consolidated</button>
              </div>

              <!-- Parent Account Ledger Filter -->
              <div class="flex items-center gap-xs" style="background: var(--bg-card); padding: 2px 8px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
                <label style="margin:0; font-size: 11px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">Parent Account:</label>
                <select class="form-select form-select-sm" id="dimParentAccountSelect" style="width: auto; max-width: 220px; font-size: 11.5px; font-weight: 600; padding: 2px 6px;">
                  <option value="all" ${this.dimensionParentAccount === 'all' ? 'selected' : ''}>📂 All Accounts (${uniqueParentAccounts.length})</option>
                  ${uniqueParentAccounts.map(pa => `<option value="${Utils.escapeHtml(pa)}" ${this.dimensionParentAccount === pa ? 'selected' : ''}>${Utils.escapeHtml(pa)}</option>`).join('')}
                </select>
              </div>

              <!-- Scope Select -->
              <div class="flex items-center gap-xs" style="background: var(--bg-card); padding: 2px 8px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
                <label style="margin:0; font-size: 11px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">Scope:</label>
                <select class="form-select form-select-sm" id="dimScopeSelect" style="width: auto; font-size: 11.5px; font-weight: 600; padding: 2px 6px;">
                  <option value="all" ${this.dimensionScope === 'all' ? 'selected' : ''}>🌐 Global (USD)</option>
                  <option value="india" ${this.dimensionScope === 'india' ? 'selected' : ''}>🇮🇳 India (INR)</option>
                  ${entities.map(e => `<option value="${e.id}" ${this.dimensionScope === e.id ? 'selected' : ''}>${e.flag} ${e.shortName}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Right: View Mode, Search & Export Button -->
            <div class="flex items-center gap-xs flex-wrap">
              <!-- View Mode Toggle -->
              <div class="flex gap-1" style="background: var(--bg-card); padding: 2px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
                <button class="btn btn-sm ${this.dimensionViewMode === 'line-items' ? 'btn-primary font-bold' : 'btn-ghost'}" data-vmode="line-items" style="padding: 3px 9px; font-size: 11px;">📑 Line-Items</button>
                <button class="btn btn-sm ${this.dimensionViewMode === 'summary' ? 'btn-primary font-bold' : 'btn-ghost'}" data-vmode="summary" style="padding: 3px 9px; font-size: 11px;">📊 Summary</button>
              </div>

              <!-- Search Bar -->
              <input type="text" id="dimSearchInput" class="form-input form-input-sm" placeholder="🔍 Search line items..." value="${Utils.escapeHtml(this.dimensionSearchQuery)}" style="width: 155px; font-size: 11.5px; padding: 3px 8px;">

              <!-- Export Excel Button -->
              <button class="btn btn-primary btn-sm flex items-center gap-xs font-bold" style="padding: 4px 10px; font-size: 11.5px;" onclick="ExcelIOModule.exportDimensionReport(ReportsModule.dimensionKey || 'donor', ReportsModule.dimensionScope || 'all')">
                <span>📥</span> Export Excel
              </button>
            </div>
          </div>

          <!-- Ultra-Compact Single-Row Summary Strip (Minimised Space) -->
          <div class="flex items-center justify-between flex-wrap gap-sm" style="background: rgba(15, 23, 42, 0.03); border-bottom: 1px solid var(--border-subtle); padding: 7px 14px; font-size: 12px;">
            <div class="flex items-center gap-xs">
              <span class="text-tertiary font-semibold" style="font-size: 11px; text-transform: uppercase;">Total Budget:</span>
              <span class="font-bold font-mono" style="font-size: 13.5px; color: var(--accent-primary);">
                ${this.dimensionScope === 'india' ? Utils.formatCurrency(grandTotalLocal, 'INR') : Utils.formatCurrency(grandTotalUSD, 'USD')}
              </span>
              <span class="text-tertiary" style="font-size: 11px;">
                (${this.dimensionScope === 'india' ? Utils.formatCurrency(grandTotalUSD, 'USD') : (currencyLabel !== 'USD' ? Utils.formatCurrency(grandTotalLocal, currencyLabel) : 'Consolidated USD')})
              </span>
            </div>

            <div style="height: 14px; width: 1px; background: var(--border-subtle);"></div>

            <div class="flex items-center gap-xs">
              <span class="text-tertiary font-semibold" style="font-size: 11px; text-transform: uppercase;">${activeMeta.plural}:</span>
              <span class="badge badge-emerald font-bold font-mono" style="font-size: 11px; padding: 1px 6px;">${groupKeys.length} Categories</span>
            </div>

            <div style="height: 14px; width: 1px; background: var(--border-subtle);"></div>

            <div class="flex items-center gap-xs">
              <span class="text-tertiary font-semibold" style="font-size: 11px; text-transform: uppercase;">Line Items:</span>
              <span class="badge badge-subtle font-bold font-mono" style="font-size: 11px; padding: 1px 6px;">${filteredItems.length} Records</span>
            </div>

            <div style="height: 14px; width: 1px; background: var(--border-subtle);"></div>

            <div class="flex items-center gap-xs">
              <span class="text-tertiary font-semibold" style="font-size: 11px; text-transform: uppercase;">Top Category:</span>
              <span class="badge badge-primary font-bold" style="font-size: 11px; padding: 1px 6px;">${groupKeys[0] || 'None'}</span>
              <span class="text-secondary font-mono font-bold" style="font-size: 11.5px;">
                ${groupKeys[0] ? (this.dimensionScope === 'india' ? Utils.formatCurrency(groups[groupKeys[0]].reduce((s, r) => s + r.totalLocal, 0), 'INR') : Utils.formatCurrency(groups[groupKeys[0]].reduce((s, r) => s + r.totalUSD, 0), 'USD')) : ''}
              </span>
            </div>

            ${this.dimensionParentAccount !== 'all' ? `
              <div style="height: 14px; width: 1px; background: var(--border-subtle);"></div>
              <div class="flex items-center gap-xs">
                <span class="badge badge-warning font-bold" style="font-size: 10.5px; padding: 1px 6px;">Filter: ${this.dimensionParentAccount}</span>
                <a href="javascript:void(0)" id="clearParentAccountFilterBtn" style="font-size: 11px; color: var(--accent-primary); text-decoration: underline; font-weight: 600;">Clear</a>
              </div>
            ` : ''}
          </div>

          <!-- Main Report Content -->
          <div style="padding: 10px;">
            ${filteredItems.length === 0 ? `
              <div class="text-center text-muted" style="padding: 32px 16px;">
                <div style="font-size: 2rem; margin-bottom: 6px;">🧭</div>
                <div class="font-bold" style="font-size: 1rem;">No dimension records found matching your filters.</div>
                <div class="text-tertiary mt-xs" style="font-size: 12px;">Try adjusting the Parent Account filter or search query.</div>
              </div>
            ` : this.dimensionViewMode === 'summary' ? `
              <!-- Summary Mode: Compact Table with Budget Share % and Monthly Breakdown -->
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="sticky-col-1">${activeMeta.title}</th>
                      <th style="width: 85px; text-align: center;">Line Items</th>
                      <th style="width: 130px; text-align: center;">Budget Share</th>
                      <th class="num font-bold total-toggle-th month-group" data-toggle-months title="Click to collapse/expand monthly columns">
                        Total CY-${budgetYear} (${this.dimensionScope === 'india' ? 'INR ₹' : 'USD $'}) <span class="months-toggle-arrow">&#9664;</span>
                      </th>
                      ${SEED_DATA.months.map(m => `<th class="num month-group">${m}-${budgetYear}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${groupKeys.map(grpVal => {
                      const grpItems = groups[grpVal];
                      const grpLocal = grpItems.reduce((s, r) => s + r.totalLocal, 0);
                      const grpUSD = grpItems.reduce((s, r) => s + r.totalUSD, 0);
                      const grpValNum = this.dimensionScope === 'india' ? grpLocal : grpUSD;
                      const grandValNum = this.dimensionScope === 'india' ? grandTotalLocal : grandTotalUSD;
                      const pct = grandValNum > 0 ? ((grpValNum / grandValNum) * 100).toFixed(1) : '0.0';
                      const grpMonthly = Array(12).fill(0);
                      grpItems.forEach(r => {
                        (this.dimensionScope === 'india' ? r.monthlyLocal : r.monthlyUSD).forEach((v, idx) => grpMonthly[idx] += v);
                      });

                      return `
                        <tr>
                          <td class="sticky-col-1 font-bold">
                            <span class="flex items-center gap-xs">
                              <span>${activeMeta.icon}</span>
                              <span>${grpVal}</span>
                            </span>
                          </td>
                          <td style="text-align: center;"><span class="badge badge-subtle font-mono">${grpItems.length}</span></td>
                          <td style="text-align: center;">
                            <div class="flex items-center gap-xs">
                              <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: var(--accent-primary); border-radius: 3px;"></div>
                              </div>
                              <span class="font-mono text-tertiary" style="font-size: 11px; min-width: 38px;">${pct}%</span>
                            </div>
                          </td>
                          <td class="num font-bold font-mono" style="color: var(--accent-primary);">
                            ${this.dimensionScope === 'india' ? Utils.formatCurrency(grpLocal, 'INR') : Utils.formatCurrency(grpUSD, 'USD')}
                          </td>
                          ${grpMonthly.map(v => `
                            <td class="num month-col font-mono" style="${v > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'}">${this.dimensionScope === 'india' ? Utils.formatCurrency(v, 'INR') : Utils.formatCurrency(v, 'USD')}</td>
                          `).join('')}
                        </tr>
                      `;
                    }).join('')}
                    <!-- ─── Bottom Master Rollup Total ─── -->
                    <tr class="total-row">
                      <td class="sticky-col-1 font-bold">GRAND TOTAL (${activeMeta.plural.toUpperCase()})</td>
                      <td style="text-align: center;" class="font-bold">${filteredItems.length}</td>
                      <td style="text-align: center;" class="font-bold">100.0%</td>
                      <td class="num font-bold font-mono" style="color: var(--accent-primary); font-size: 1.05rem;">
                        ${this.dimensionScope === 'india' ? Utils.formatCurrency(grandTotalLocal, 'INR') : Utils.formatCurrency(grandTotalUSD, 'USD')}
                      </td>
                      ${(this.dimensionScope === 'india' ? grandMonthlyLocal : grandMonthlyUSD).map(v => `
                        <td class="num month-col font-mono font-bold" style="color: var(--accent-primary);">${this.dimensionScope === 'india' ? Utils.formatCurrency(v, 'INR') : Utils.formatCurrency(v, 'USD')}</td>
                      `).join('')}
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : `
              <!-- Line-Item Wise Details: Grouped Tables with Compact Headers & Subtotals -->
              <div class="flex flex-col gap-md">
                ${groupKeys.map(grpVal => {
                  const grpItems = groups[grpVal];
                  const grpLocal = grpItems.reduce((s, r) => s + r.totalLocal, 0);
                  const grpUSD = grpItems.reduce((s, r) => s + r.totalUSD, 0);
                  const grpMonthly = Array(12).fill(0);
                  grpItems.forEach(r => {
                    (this.dimensionScope === 'india' ? r.monthlyLocal : r.monthlyUSD).forEach((v, idx) => grpMonthly[idx] += v);
                  });

                  return `
                    <div class="card" style="border: 1px solid var(--border-subtle); overflow: hidden; margin-bottom: 4px;">
                      <!-- Group Header Banner -->
                      <div class="p-sm flex justify-between items-center flex-wrap gap-xs" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(6, 182, 212, 0.08)); border-bottom: 1px solid var(--border-subtle); padding: 6px 12px;">
                        <div class="flex items-center gap-xs">
                          <span style="font-size: 1.1rem;">${activeMeta.icon}</span>
                          <div>
                            <span class="font-bold" style="font-size: 13.5px; color: var(--text-primary);">${grpVal}</span>
                            <span class="text-tertiary ml-xs font-mono" style="font-size: 11px;">(${grpItems.length} line items)</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-xs">
                          <span class="text-tertiary" style="font-size: 11px; text-transform: uppercase;">Subtotal:</span>
                          <span class="font-bold font-mono" style="font-size: 13px; color: var(--accent-primary);">
                            ${this.dimensionScope === 'india' ? Utils.formatCurrency(grpLocal, 'INR') : Utils.formatCurrency(grpUSD, 'USD')}
                          </span>
                        </div>
                      </div>

                      <!-- Group Table -->
                      <div class="table-container">
                        <table class="data-table">
                          <thead>
                            <tr>
                              <th class="sticky-col-1">GL Account & Line Description</th>
                              <th style="width: 90px; text-align: center;">Dept</th>
                              <th style="width: 75px; text-align: center;">Entity</th>
                              <th>Item / Expense Details</th>
                              <th style="width: 150px;">5D Dimension Tags</th>
                              <th class="num font-bold total-toggle-th month-group" data-toggle-months title="Click to collapse/expand monthly columns">
                                Total (${this.dimensionScope === 'india' ? 'INR' : 'USD'}) <span class="months-toggle-arrow">&#9664;</span>
                              </th>
                              ${SEED_DATA.months.map(m => `<th class="num month-group">${m}</th>`).join('')}
                            </tr>
                          </thead>
                          <tbody>
                            ${grpItems.map(r => `
                              <tr>
                                <td class="sticky-col-1">
                                  <div class="font-bold" style="font-size: 11.5px;">${r.glDescription}</div>
                                  <div class="text-tertiary flex items-center gap-xs" style="font-size: 10.5px;">
                                    <code>${r.ledgerCode}</code>
                                    <span>•</span>
                                    <span>${r.parentAccount}</span>
                                  </div>
                                </td>
                                <td style="text-align: center;"><span class="badge badge-subtle font-mono font-bold" style="font-size: 10.5px;" title="${r.deptName}">${r.deptShort}</span></td>
                                <td style="text-align: center;"><span class="badge badge-cyan font-bold" style="font-size: 10px;">${r.entityShort}</span></td>
                                <td style="font-size: 11.5px;">
                                  <div class="font-medium">${r.itemDescription || '—'}</div>
                                  ${r.basisOfExpense ? `<div class="text-tertiary" style="font-size: 10.5px;">${r.basisOfExpense}</div>` : ''}
                                </td>
                                <td>
                                  <div class="flex flex-col gap-1" style="font-size: 9.5px;">
                                    ${dimKey !== 'location' ? `<span class="badge badge-subtle" style="padding: 1px 4px;" title="Location">📍 ${r.location}</span>` : ''}
                                    ${dimKey !== 'donor' ? `<span class="badge badge-emerald" style="padding: 1px 4px;" title="Donor">👤 ${r.donor}</span>` : ''}
                                    ${dimKey !== 'activity' ? `<span class="badge badge-info" style="padding: 1px 4px;" title="Activity">🎯 ${r.activity}</span>` : ''}
                                    ${dimKey !== 'conditionArea' ? `<span class="badge badge-warning" style="padding: 1px 4px;" title="Condition Area">🩺 ${r.conditionArea}</span>` : ''}
                                  </div>
                                </td>
                                <td class="num font-mono font-bold" style="color: var(--accent-primary); font-size: 11.5px;">
                                  <div>${this.dimensionScope === 'india' ? Utils.formatCurrency(r.totalLocal, 'INR') : Utils.formatCurrency(r.totalUSD, 'USD')}</div>
                                  ${r.currency !== 'USD' && this.dimensionScope !== 'india' ? `<div class="text-tertiary font-normal" style="font-size: 9.5px;">(${Utils.formatCurrency(r.totalLocal, r.currency)})</div>` : ''}
                                </td>
                                ${(this.dimensionScope === 'india' ? r.monthlyLocal : r.monthlyUSD).map(v => `
                                  <td class="num month-col font-mono" style="${v > 0 ? 'font-weight: 600;' : 'color: var(--text-tertiary);'} font-size: 11px;">${this.dimensionScope === 'india' ? Utils.formatCurrency(v, 'INR') : Utils.formatCurrency(v, 'USD')}</td>
                                `).join('')}
                              </tr>
                            `).join('')}
                            <tr class="total-row">
                              <td class="sticky-col-1 font-bold" style="font-size: 12px;">SUBTOTAL: ${grpVal}</td>
                              <td colspan="4" class="text-tertiary font-medium" style="font-size: 11px;">${grpItems.length} Line Items</td>
                              <td class="num font-mono font-bold" style="color: var(--accent-primary); font-size: 12px;">
                                ${this.dimensionScope === 'india' ? Utils.formatCurrency(grpLocal, 'INR') : Utils.formatCurrency(grpUSD, 'USD')}
                              </td>
                              ${grpMonthly.map(v => `
                                <td class="num month-col font-mono font-bold" style="color: var(--accent-primary); font-size: 11px;">${this.dimensionScope === 'india' ? Utils.formatCurrency(v, 'INR') : Utils.formatCurrency(v, 'USD')}</td>
                              `).join('')}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      // Event listeners inside Dimension Report
      container.querySelector('#dimScopeSelect')?.addEventListener('change', (e) => {
        this.dimensionScope = e.target.value;
        updateView();
      });

      container.querySelector('#dimParentAccountSelect')?.addEventListener('change', (e) => {
        this.dimensionParentAccount = e.target.value;
        updateView();
      });

      container.querySelector('#clearParentAccountFilterBtn')?.addEventListener('click', () => {
        this.dimensionParentAccount = 'all';
        updateView();
      });

      container.querySelectorAll('[data-dim]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.dimensionKey = btn.dataset.dim;
          updateView();
        });
      });

      container.querySelectorAll('[data-vmode]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.dimensionViewMode = btn.dataset.vmode;
          updateView();
        });
      });

      const searchInput = container.querySelector('#dimSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.dimensionSearchQuery = e.target.value;
          updateView();
        });
      }
    };

    await updateView();
  }
};

window.ReportsModule = ReportsModule;
