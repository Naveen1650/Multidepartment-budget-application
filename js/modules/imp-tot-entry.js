// ============================================================
// NOORA HEALTH BUDGET APP — Implementation (IMP) ToT Budget Module
// Option 1: Annual Batch Matrix Planner (Activities 10.1 to 10.8)
// Available strictly when Implementation department (IN-PDEL-IMP / IN-PDEL-TRNG) is active
// ============================================================

const ImpTotModule = {
  activeViewMode: 'matrix', // 'matrix' (Option 1: Annual Matrix Grid) or 'registry' (Detailed Cards)
  activeMonthFilter: 'all', // 'all' or 0..11
  activeLocationFilter: 'all', // 'all' or location name e.g. 'India KA'
  matrixState: {}, // Cache of in-memory matrix: matrixState[location][code][monthIdx] = { count, scale, costLines, unitCost, totalCost, eventId, isCustomized }
  _container: null,
  _yearId: '2026',
  _entity: null,
  _dept: null,
  _budgetYear: 2026,
  _locations: [],
  _donors: [],
  _activities: [],
  _conditionAreas: [],

  // Component metadata mapping to 5D Activities
  components: {
    'bundled-tot': {
      id: 'bundled-tot',
      code: '10.1',
      title: 'State Level Bundled ToT (Master Trainers)',
      defaultActivity: '10.1-Bundled ToT- Master trainers',
      icon: '🏛️',
      badgeClass: 'badge-indigo',
      hasToolPackage: true
    },
    'non-bundled-tot': {
      id: 'non-bundled-tot',
      code: '10.2',
      title: 'State Level Non-Bundled ToT (Master Trainers)',
      defaultActivity: '10.2-Non-bundled ToTs-Master Trainers',
      icon: '🏛️',
      badgeClass: 'badge-indigo',
      hasToolPackage: false
    },
    'refresher-tot': {
      id: 'refresher-tot',
      code: '10.3',
      title: 'Booster / Refresher Training',
      defaultActivity: '10.3-Booster/ Refresher Training',
      icon: '🔄',
      badgeClass: 'badge-cyan',
      hasToolPackage: false
    },
    'mo-training': {
      id: 'mo-training',
      code: '10.4',
      title: 'Medical Officer Training (MO Training)',
      defaultActivity: '10.4-Medical Officer training',
      icon: '🩺',
      badgeClass: 'badge-emerald',
      hasToolPackage: false
    },
    'district-tot': {
      id: 'district-tot',
      code: '10.5',
      title: 'District Level Training (HWC / CHO Training)',
      defaultActivity: '10.5-District level training',
      icon: '🏥',
      badgeClass: 'badge-emerald',
      hasToolPackage: false
    },
    'facility-launch': {
      id: 'facility-launch',
      code: '10.6',
      title: 'Facility Launch & Collateral Deployment',
      defaultActivity: '10.6-Facility Launch',
      icon: '🚀',
      badgeClass: 'badge-cyan',
      hasToolPackage: false
    },
    'supervision-visits': {
      id: 'supervision-visits',
      code: '10.7',
      title: 'Supportive Supervision & Monitoring (PCs & Non-PCs)',
      defaultActivity: '10.7-Supportive Supervision',
      icon: '🚗',
      badgeClass: 'badge-indigo',
      hasToolPackage: false
    },
    'partnership-visits': {
      id: 'partnership-visits',
      code: '10.8',
      title: 'Partnership & Leadership Visits',
      defaultActivity: '10.8-Partnership Visits',
      icon: '✈️',
      badgeClass: 'badge-cyan',
      hasToolPackage: false
    }
  },

  // Check if department is Implementation department
  isImpDept(dept) {
    if (!dept) return false;
    const id = (dept.id || '').toLowerCase();
    const name = (dept.name || '').toLowerCase();
    const code = (dept.codeTemplate || '').toLowerCase();
    return id.includes('imp') || id.includes('pdel') || name.includes('implementation') || name.includes('training') || code.includes('imp');
  },

  // Switch View Mode: 'matrix' vs 'registry'
  setViewMode(mode) {
    this.activeViewMode = mode;
    return this.render(this._container, this._yearId, this._entity, this._dept, this._budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
  },

  // Filter by location
  filterByLocation(loc) {
    this.activeLocationFilter = loc;
    return this.render(this._container, this._yearId, this._entity, this._dept, this._budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
  },

  // Filter by month (for Registry View)
  filterByMonth(monthIdx) {
    this.activeMonthFilter = monthIdx;
    return this.render(this._container, this._yearId, this._entity, this._dept, this._budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
  },

  // Calculate Unit Batch Cost and line breakdown for an activity template given unit rates and scale
  calculateActivityBatchCost(template, rates, customFields, scaleOverride = null) {
    const scale = scaleOverride || template.scaleDefaults || {
      eventCount: 1,
      daysCount: 1,
      facilitiesCount: 10,
      participantsCount: 25,
      teamSize: 2,
      toolPackage: 'Tool Package - 1 (Standard)'
    };

    const events = 1; // Base per single batch
    const days = scale.daysCount || 1;
    const facilities = scale.facilitiesCount || 0;
    const participants = scale.participantsCount || 0;
    const teamSize = scale.teamSize || 1;

    const lines = [];
    let batchTotal = 0;

    (template.lineItems || []).forEach(item => {
      let unitRate = rates[item.rateField] !== undefined ? rates[item.rateField] : 0;
      if (unitRate === 0) {
        const cf = customFields.find(c => c.fieldKey === item.rateField || c.id === item.rateField);
        if (cf) unitRate = cf.defaultUnitRate || 0;
      }

      let secUnitRate = 0;
      if (item.secondaryRateField) {
        secUnitRate = rates[item.secondaryRateField] !== undefined ? rates[item.secondaryRateField] : 0;
      }

      const multiplier = item.multiplier || 1;
      let calculatedAmount = 0;
      let basisText = '';

      if (item.formulaExpression) {
        const scope = {
          events: events,
          days: days,
          trainers: teamSize,
          teamSize: teamSize,
          facilities: facilities,
          trainees: participants,
          participants: participants,
          rate: unitRate,
          unitRate: unitRate,
          multiplier: multiplier,
          secRate: secUnitRate
        };
        try {
          calculatedAmount = Utils.FormulaEvaluator.evaluate(item.formulaExpression, scope);
          basisText = `1 Batch × Math: ${item.formulaExpression}`;
        } catch (e) {
          calculatedAmount = multiplier * unitRate;
          basisText = `Flat Rate × ${multiplier}`;
        }
      } else {
        switch (item.formulaType) {
          case 'events_days_trainers':
            calculatedAmount = events * days * teamSize * multiplier * unitRate;
            basisText = `1 Batch × ${days} Days × ${teamSize} Trainers`;
            break;
          case 'events_trainers':
            calculatedAmount = events * teamSize * multiplier * unitRate;
            basisText = `1 Batch × ${teamSize} Trainers × Transit`;
            break;
          case 'facilities_rate':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × Rate`;
            break;
          case 'facilities_multiplier':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × ${multiplier} Sets`;
            break;
          case 'events_rate':
            calculatedAmount = events * multiplier * unitRate;
            basisText = `1 Batch × Rate`;
            break;
          case 'events_rate_dual':
            calculatedAmount = events * multiplier * (unitRate + secUnitRate);
            basisText = `1 Batch × (Banner + Backdrop)`;
            break;
          case 'events_days_hall_catering':
            calculatedAmount = (events * days * unitRate) + (events * days * participants * secUnitRate);
            basisText = `1 Batch × ${days} Days × (Hall + ${participants} Trainees Food)`;
            break;
          case 'events_days_hall':
            calculatedAmount = events * days * multiplier * unitRate;
            basisText = `1 Batch × ${days} Days × Hall`;
            break;
          case 'events_days_participants':
            calculatedAmount = events * days * participants * multiplier * unitRate;
            basisText = `1 Batch × ${days} Days × ${participants} Trainees Food`;
            break;
          case 'events_days_honorarium':
            calculatedAmount = events * days * multiplier * unitRate;
            basisText = `1 Batch × ${days} Days × Honorarium`;
            break;
          case 'participants_rate':
            calculatedAmount = participants * multiplier * unitRate;
            basisText = `${participants} Trainees × Rate`;
            break;
          case 'facilities_pc_cab':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × PC Cab`;
            break;
          case 'facilities_pc_food':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × PC Food`;
            break;
          default:
            calculatedAmount = multiplier * unitRate;
            basisText = `Flat Rate × ${multiplier}`;
            break;
        }
      }

      const isSelected = item.defaultActive !== false;
      if (isSelected) {
        batchTotal += calculatedAmount;
      }

      lines.push({
        id: item.id,
        description: item.description,
        ledgerCode: item.ledgerCode,
        parentAccount: item.parentAccount,
        rateField: item.rateField,
        formulaType: item.formulaType,
        basis: basisText,
        unitRate: unitRate,
        amount: calculatedAmount,
        isSelected: isSelected,
        isCustom: false
      });
    });

    return {
      batchTotal: batchTotal,
      costLines: lines,
      scale: scale
    };
  },

  // Main Entry Point
  async render(container, yearId, entity, dept, budgetYear, locations, donors, activities, conditionAreas) {
    this._container = container;
    this._yearId = yearId;
    this._entity = entity;
    this._dept = dept;
    this._budgetYear = budgetYear;
    this._locations = locations || [];
    this._donors = donors || [];
    this._activities = activities || [];
    this._conditionAreas = conditionAreas || [];

    if (this.activeViewMode === 'matrix') {
      await this.renderMatrixPlanner(container);
    } else {
      await this.renderRegistryView(container);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 OPTION 1: ANNUAL BATCH MATRIX PLANNER (Spreadsheet Grid View)
  // ═══════════════════════════════════════════════════════════════════════════
  async renderMatrixPlanner(container) {
    const yearId = this._yearId;
    const entity = this._entity;
    const dept = this._dept;
    const budgetYear = this._budgetYear;

    const events = await db.getImpTotEvents(yearId, entity.id, dept.id);
    const templates = await db.getAllImpActivityTemplates();
    const customFields = await db.getAllImpCustomRateFields();
    const conversionRate = (await db.getConversionRatesForYear(budgetYear))?.[0]?.rateToUSD || 83.5;

    // Collect all available locations
    const allLocationsList = Array.from(new Set([
      ...this._locations.map(l => typeof l === 'string' ? l : (l.name || String(l))),
      ...events.map(e => e.location).filter(Boolean)
    ])).filter(Boolean).sort();

    const activeLocation = (this.activeLocationFilter !== 'all' && this.activeLocationFilter)
      ? this.activeLocationFilter
      : (allLocationsList[0] || 'India KA');
    this.activeLocationFilter = activeLocation;

    const rates = await db.getImpUnitRates(activeLocation);

    // Initialize or load Matrix State for activeLocation
    if (!this.matrixState[activeLocation]) {
      this.matrixState[activeLocation] = {};
    }

    const activityList = Object.values(this.components);

    // Pre-calculate standard batch cost for each activity
    const stdBatchCosts = {};
    activityList.forEach(comp => {
      const tpl = templates.find(t => t.code === comp.code) || SEED_DATA.defaultImpActivityTemplates.find(t => t.code === comp.code) || SEED_DATA.defaultImpActivityTemplates[0];
      stdBatchCosts[comp.code] = this.calculateActivityBatchCost(tpl, rates, customFields);
    });

    // Populate matrixState from existing DB events or standard templates
    activityList.forEach(comp => {
      const code = comp.code;
      if (!this.matrixState[activeLocation][code]) {
        this.matrixState[activeLocation][code] = {};
      }

      for (let mIdx = 0; mIdx < 12; mIdx++) {
        // Look for existing saved event in this location, activity, and month
        const existingEvent = events.find(e => 
          (e.location || '').trim() === activeLocation.trim() && 
          (e.componentId === comp.id || (e.activity && e.activity.startsWith(code))) && 
          parseInt(e.monthIdx, 10) === mIdx
        );

        if (!this.matrixState[activeLocation][code][mIdx] || this.matrixState[activeLocation][code][mIdx]._fresh) {
          if (existingEvent) {
            const count = existingEvent.scale?.eventCount || 1;
            const totalCost = existingEvent.totalCost || 0;
            const unitCost = count > 0 ? (totalCost / count) : stdBatchCosts[code].batchTotal;
            this.matrixState[activeLocation][code][mIdx] = {
              count: count,
              scale: existingEvent.scale || stdBatchCosts[code].scale,
              costLines: existingEvent.costLines || stdBatchCosts[code].costLines,
              unitCost: unitCost,
              totalCost: totalCost,
              eventId: existingEvent.id,
              isCustomized: (existingEvent.customLines && existingEvent.customLines.length > 0) || (unitCost !== stdBatchCosts[code].batchTotal)
            };
          } else {
            this.matrixState[activeLocation][code][mIdx] = {
              count: 0,
              scale: { ...stdBatchCosts[code].scale },
              costLines: JSON.parse(JSON.stringify(stdBatchCosts[code].costLines)),
              unitCost: stdBatchCosts[code].batchTotal,
              totalCost: 0,
              eventId: null,
              isCustomized: false
            };
          }
        }
      }
    });

    // Calculate Summary Metrics
    let totalAnnualBatches = 0;
    let totalAnnualCost = 0;
    let totalTrainees = 0;
    let totalFacilities = 0;

    const monthlyBatches = Array(12).fill(0);
    const monthlyCosts = Array(12).fill(0);
    const activityRowTotals = {};

    activityList.forEach(comp => {
      const code = comp.code;
      let rowBatches = 0;
      let rowCost = 0;

      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const cell = this.matrixState[activeLocation][code][mIdx];
        const cnt = cell.count || 0;
        const cost = cnt * cell.unitCost;
        cell.totalCost = cost;

        rowBatches += cnt;
        rowCost += cost;
        monthlyBatches[mIdx] += cnt;
        monthlyCosts[mIdx] += cost;

        if (cnt > 0) {
          totalTrainees += (cnt * (cell.scale?.participantsCount || 0));
          totalFacilities += (cnt * (cell.scale?.facilitiesCount || 0));
        }
      }

      activityRowTotals[code] = { batches: rowBatches, cost: rowCost };
      totalAnnualBatches += rowBatches;
      totalAnnualCost += rowCost;
    });

    container.innerHTML = `
      <div class="card mb-lg" style="border-left: 4px solid var(--accent-primary); background: var(--bg-secondary);">
        <!-- Top Toolbar Header -->
        <div class="flex justify-between items-center mb-md" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="flex items-center gap-sm">
              <span class="badge badge-primary font-bold" style="font-size: 11px;">OPTION 1: ANNUAL BATCH MATRIX</span>
              <span class="badge badge-emerald font-bold" style="font-size: 11px;">⚡ Fast Direct In-Cell Entry</span>
            </div>
            <h2 class="mt-xs" style="font-size: 1.35rem; color: var(--text-primary); margin-bottom: 2px;">
              🎯 Annual Training Planner — ${activeLocation} (FY ${budgetYear})
            </h2>
            <div class="text-secondary" style="font-size: 12px;">
              Type the number of planned batches directly into monthly cells &bull; Instant live calculation &bull; Auto-syncs to GL Accounts
            </div>
          </div>

          <!-- View Mode Toggle Buttons -->
          <div class="flex items-center gap-sm">
            <div class="btn-group" style="display: flex; background: var(--bg-primary); padding: 3px; border-radius: 8px; border: 1px solid var(--border-default);">
              <button type="button" class="btn btn-sm ${this.activeViewMode === 'matrix' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="ImpTotModule.setViewMode('matrix')" style="font-size: 11.5px; padding: 5px 12px;">
                📊 1. Annual Matrix Grid
              </button>
              <button type="button" class="btn btn-sm ${this.activeViewMode === 'registry' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="ImpTotModule.setViewMode('registry')" style="font-size: 11.5px; padding: 5px 12px;">
                📋 2. Detailed Event Registry (${events.length})
              </button>
            </div>
            <button class="btn btn-secondary btn-sm font-bold" onclick="App.navigateTo('config-imp-rates')">
              ⚙️ Manage Benchmark Rates
            </button>
          </div>
        </div>

        <!-- ─── 5D Dimension Filter & Location Switcher ─── -->
        <div class="card p-md mb-md" style="background: var(--bg-primary); border: 1px solid var(--border-default); box-shadow: var(--shadow-sm);">
          <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 12px; align-items: end;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11.5px;">📍 Planning Location / State <span class="text-danger">*</span></label>
              <select class="form-select font-bold" id="matrixLocationSelect" onchange="ImpTotModule.filterByLocation(this.value)" style="font-size: 13px; color: var(--accent-primary);">
                ${allLocationsList.map(loc => `
                  <option value="${loc}" ${loc === activeLocation ? 'selected' : ''}>📍 ${loc}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">🏥 5D Condition Area</label>
              <select class="form-select font-bold" id="matrixConditionSelect">
                ${this._conditionAreas.map(c => typeof c === 'string' ? `<option value="${c}">${c}</option>` : `<option value="${c.name || c.areaName}">${c.name || c.areaName}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">🤝 5D Donor Tag</label>
              <select class="form-select font-bold" id="matrixDonorSelect">
                ${this._donors.map(d => typeof d === 'string' ? `<option value="${d}">${d}</option>` : `<option value="${d.name}">${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">👤 Program Lead</label>
              <input type="text" class="form-input font-bold" id="matrixLeadInput" value="State Program Team" placeholder="Lead Name...">
            </div>
          </div>
        </div>

        <!-- ─── Live Summary KPI Cards ─── -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div class="card p-md" style="background: var(--bg-card); border-left: 4px solid var(--accent-primary);">
            <div class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">Total Annual Training Budget</div>
            <div id="kpiAnnualBudget" style="font-size: 1.45rem; font-weight: 800; color: var(--accent-primary); margin-top: 2px;">
              ${Utils.formatCurrency(totalAnnualCost, entity.currency)}
            </div>
            <div id="kpiAnnualBudgetUsd" class="text-tertiary font-mono font-bold" style="font-size: 11px; margin-top: 2px;">
              ≈ ${Utils.formatCurrency(Utils.convertToUSD(totalAnnualCost, conversionRate), 'USD')}
            </div>
          </div>
          <div class="card p-md" style="background: var(--bg-card); border-left: 4px solid var(--success);">
            <div class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">Total Planned Batches</div>
            <div id="kpiAnnualBatches" style="font-size: 1.45rem; font-weight: 800; color: var(--success); margin-top: 2px;">
              ${totalAnnualBatches} Batches
            </div>
            <div class="text-tertiary" style="font-size: 11px; margin-top: 2px;">Across Activities 10.1 to 10.8</div>
          </div>
          <div class="card p-md" style="background: var(--bg-card); border-left: 4px solid #8b5cf6;">
            <div class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">Total Trainees Reached</div>
            <div id="kpiAnnualTrainees" style="font-size: 1.45rem; font-weight: 800; color: #8b5cf6; margin-top: 2px;">
              ${totalTrainees} Trainees
            </div>
            <div class="text-tertiary" style="font-size: 11px; margin-top: 2px;">Master Trainers, MOs & CHOs</div>
          </div>
          <div class="card p-md" style="background: var(--bg-card); border-left: 4px solid #f59e0b;">
            <div class="text-secondary font-bold" style="font-size: 11px; text-transform: uppercase;">Launching Facilities</div>
            <div id="kpiAnnualFacilities" style="font-size: 1.45rem; font-weight: 800; color: #f59e0b; margin-top: 2px;">
              ${totalFacilities} Facilities
            </div>
            <div class="text-tertiary" style="font-size: 11px; margin-top: 2px;">Hospitals & Health Centers</div>
          </div>
        </div>

        <!-- ─── THE ANNUAL BATCH MATRIX TABLE ─── -->
        <div class="card mb-none" style="border: 1px solid var(--border-default); box-shadow: var(--shadow-md);">
          <div class="card-header flex justify-between items-center" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-default);">
            <div>
              <div class="card-title font-bold" style="font-size: 1.1rem; color: var(--text-primary);">
                📊 12-Month Batch Allocation Grid (Activities 10.1 to 10.8)
              </div>
              <div class="card-subtitle" style="font-size: 11.5px;">
                Enter the number of batches per month &bull; Click <strong>⚙️</strong> to customize days, trainees or exclude hotel/venue costs for any specific month
              </div>
            </div>
            <div class="flex items-center gap-xs">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ImpTotModule.applyQuickQuarterlyPreset()" title="Add 1 batch per quarter across all activities">
                📑 1 Batch / Quarter
              </button>
              <button type="button" class="btn btn-ghost btn-sm text-danger font-bold" onclick="ImpTotModule.resetMatrixGrid()" title="Clear all matrix inputs to zero">
                ↺ Reset All
              </button>
            </div>
          </div>

          <div class="table-container mb-none" style="overflow-x: auto; max-height: 600px;">
            <table class="data-table" id="impAnnualBatchMatrixTable" style="font-size: 12px; width: 100%; border-collapse: separate; border-spacing: 0;">
              <thead>
                <tr>
                  <th class="sticky-col-1" style="min-width: 240px; background: var(--bg-secondary); z-index: 5;">Activity & Scale Norms</th>
                  <th class="sticky-col-2 num font-bold" style="min-width: 110px; background: var(--bg-secondary); z-index: 5;">Norm Rate / Batch</th>
                  ${SEED_DATA.months.map((m, idx) => `
                    <th class="num font-bold month-col" style="min-width: 86px; text-align: center;">${m}-${budgetYear}</th>
                  `).join('')}
                  <th class="num font-bold" style="min-width: 80px; text-align: center; background: rgba(99, 102, 241, 0.08);">Batches</th>
                  <th class="num font-bold" style="min-width: 130px; background: rgba(99, 102, 241, 0.08);">Annual Cost (${entity.currency})</th>
                </tr>
              </thead>
              <tbody>
                <!-- Activity Rows (10.1 to 10.8) -->
                ${activityList.map(comp => {
                  const code = comp.code;
                  const stdCostObj = stdBatchCosts[code];
                  const scale = stdCostObj.scale;
                  const rowTotals = activityRowTotals[code] || { batches: 0, cost: 0 };
                  const scaleDesc = `${scale.daysCount || 1}d &bull; ${scale.participantsCount || 25}p &bull; ${scale.teamSize || 2}t`;

                  return `
                    <tr class="matrix-act-row" data-act-code="${code}" style="border-bottom: 1px solid var(--border-subtle);">
                      <td class="sticky-col-1 font-bold" style="background: var(--bg-secondary);">
                        <div class="flex items-center gap-xs">
                          <span style="font-size: 15px;">${comp.icon}</span>
                          <div>
                            <span class="badge ${comp.badgeClass || 'badge-cyan'}" style="font-size: 10.5px; padding: 2px 6px;">${comp.code}</span>
                            <span style="color: var(--text-primary); font-size: 12px; margin-left: 2px;">${comp.title.replace(/\([^)]*\)/g, '').trim()}</span>
                            <div class="text-tertiary font-mono" style="font-size: 10px; margin-top: 2px;">Norm: ${scaleDesc}</div>
                          </div>
                        </div>
                      </td>

                      <td class="sticky-col-2 num font-bold font-mono" style="background: var(--bg-secondary); color: var(--accent-secondary); font-size: 12px;">
                        ${Utils.formatCurrency(stdCostObj.batchTotal, entity.currency)}
                      </td>

                      <!-- 12 Monthly Batch Input Cells -->
                      ${SEED_DATA.months.map((m, idx) => {
                        const cell = this.matrixState[activeLocation][code][idx];
                        const cnt = cell.count || 0;
                        const cost = cell.totalCost || (cnt * cell.unitCost);
                        const isCustom = cell.isCustomized;

                        return `
                          <td class="month-col" style="text-align: center; padding: 6px 4px; ${cnt > 0 ? 'background: rgba(6, 182, 212, 0.05);' : ''}">
                            <div class="flex flex-col items-center gap-none">
                              <div class="flex items-center justify-center gap-none" style="width: 100%;">
                                <input type="number" min="0" max="99" step="1" 
                                       class="form-input matrix-cell-input font-bold font-mono" 
                                       data-act="${code}" data-month="${idx}" 
                                       value="${cnt}" 
                                       oninput="ImpTotModule.onMatrixCellInput('${code}', ${idx}, this.value)"
                                       style="width: 44px; height: 28px; text-align: center; padding: 2px; font-size: 12px; ${cnt > 0 ? 'border-color: var(--accent-primary); background: var(--bg-primary); color: var(--accent-primary);' : 'color: var(--text-tertiary);'}">
                                <button type="button" class="btn btn-ghost btn-xs matrix-gear-btn" 
                                        onclick="ImpTotModule.showMatrixCellCustomizer('${code}', ${idx})" 
                                        title="Customize line items, trainees, or duration for this month" 
                                        style="padding: 2px 3px; font-size: 10px; opacity: ${isCustom ? '1' : '0.4'};">
                                  ${isCustom ? '⭐' : '⚙️'}
                                </button>
                              </div>
                              <div class="matrix-cell-cost-label font-bold font-mono mt-none" id="cellCost_${code}_${idx}" style="font-size: 9.5px; color: ${cnt > 0 ? 'var(--accent-secondary)' : 'transparent'}; white-space: nowrap; height: 14px;">
                                ${cnt > 0 ? Utils.formatCurrency(cost, entity.currency) : ''}
                              </div>
                            </div>
                          </td>
                        `;
                      }).join('')}

                      <!-- Row Total Batches -->
                      <td class="num font-bold font-mono" id="rowBatches_${code}" style="text-align: center; font-size: 13px; color: ${rowTotals.batches > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)'}; background: rgba(99, 102, 241, 0.04);">
                        ${rowTotals.batches}
                      </td>

                      <!-- Row Total Budget -->
                      <td class="num font-bold font-mono" id="rowCost_${code}" style="font-size: 12.5px; color: ${rowTotals.cost > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)'}; background: rgba(99, 102, 241, 0.04);">
                        ${Utils.formatCurrency(rowTotals.cost, entity.currency)}
                      </td>
                    </tr>
                  `;
                }).join('')}

                <!-- Bottom Total Row -->
                <tr class="total-row" style="background: var(--bg-primary); border-top: 2px solid var(--border-default);">
                  <td class="sticky-col-1 font-bold">TOTAL MONTHLY BUDGET:</td>
                  <td class="sticky-col-2 font-bold num text-secondary" style="font-size: 11px;">(${entity.currency})</td>
                  ${SEED_DATA.months.map((m, idx) => `
                    <td class="num month-col font-mono font-bold" id="bottomColTotal_${idx}" style="text-align: center; color: var(--accent-primary); font-size: 11px; padding: 8px 4px;">
                      <div class="col-batches font-bold" style="font-size: 12px;">${monthlyBatches[idx]}</div>
                      <div class="col-cost text-secondary" style="font-size: 10px;">${monthlyCosts[idx] > 0 ? Utils.formatCurrency(monthlyCosts[idx], entity.currency) : '—'}</div>
                    </td>
                  `).join('')}
                  <td class="num font-bold" id="bottomGrandBatches" style="text-align: center; font-size: 13px; color: var(--accent-primary);">
                    ${totalAnnualBatches}
                  </td>
                  <td class="num font-bold" id="bottomGrandCost" style="font-size: 13px; color: var(--accent-primary);">
                    ${Utils.formatCurrency(totalAnnualCost, entity.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Actions & Save Bar -->
          <div class="card-footer flex justify-between items-center p-md" style="background: var(--bg-secondary); border-top: 1px solid var(--border-default); flex-wrap: wrap; gap: 12px;">
            <div class="flex items-center gap-md">
              <span class="text-secondary font-bold" style="font-size: 12.5px;">
                Annual Training Package Budget for <strong>${activeLocation}</strong>:
              </span>
              <span id="barAnnualGrandTotal" style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">
                ${Utils.formatCurrency(totalAnnualCost, entity.currency)}
              </span>
              <span id="barAnnualGrandTotalUsd" class="text-secondary font-bold font-mono" style="font-size: 12px;">
                (≈ ${Utils.formatCurrency(Utils.convertToUSD(totalAnnualCost, conversionRate), 'USD')})
              </span>
            </div>
            <div class="flex items-center gap-sm">
              <button type="button" class="btn btn-ghost font-bold" onclick="ImpTotModule.renderMatrixPlanner(ImpTotModule._container)">
                ↺ Cancel Changes
              </button>
              <button type="button" class="btn btn-primary font-bold" onclick="ImpTotModule.saveAnnualMatrix()" style="padding: 8px 24px; font-size: 13.5px; background: linear-gradient(135deg, var(--accent-primary), #6366f1); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                💾 Save & Apply Annual Matrix to Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Interactive Live Cell Calculation on Typing (Zero DOM teardown)
  onMatrixCellInput(actCode, monthIdx, val) {
    const activeLocation = this.activeLocationFilter;
    if (!this.matrixState[activeLocation] || !this.matrixState[activeLocation][actCode]) return;

    const count = parseInt(val, 10) || 0;
    const cell = this.matrixState[activeLocation][actCode][monthIdx];
    cell.count = count;
    cell.totalCost = count * cell.unitCost;

    const currency = this._entity?.currency || 'INR';
    const conversionRate = 83.5;

    // Update in-cell cost subtext
    const costLabel = document.getElementById(`cellCost_${actCode}_${monthIdx}`);
    if (costLabel) {
      costLabel.textContent = count > 0 ? Utils.formatCurrency(cell.totalCost, currency) : '';
      costLabel.style.color = count > 0 ? 'var(--accent-secondary)' : 'transparent';
    }

    // Recompute Row Total
    let rowBatches = 0;
    let rowCost = 0;
    for (let m = 0; m < 12; m++) {
      const c = this.matrixState[activeLocation][actCode][m];
      rowBatches += (c.count || 0);
      rowCost += (c.totalCost || 0);
    }
    const rowBatchesEl = document.getElementById(`rowBatches_${actCode}`);
    if (rowBatchesEl) {
      rowBatchesEl.textContent = rowBatches;
      rowBatchesEl.style.color = rowBatches > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)';
    }
    const rowCostEl = document.getElementById(`rowCost_${actCode}`);
    if (rowCostEl) {
      rowCostEl.textContent = Utils.formatCurrency(rowCost, currency);
      rowCostEl.style.color = rowCost > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)';
    }

    // Recompute Column Totals and Grand Total
    let totalAnnualBatches = 0;
    let totalAnnualCost = 0;
    let totalTrainees = 0;
    let totalFacilities = 0;

    const colBatches = Array(12).fill(0);
    const colCosts = Array(12).fill(0);

    Object.keys(this.matrixState[activeLocation]).forEach(code => {
      for (let m = 0; m < 12; m++) {
        const c = this.matrixState[activeLocation][code][m];
        const cnt = c.count || 0;
        const cst = c.totalCost || 0;
        colBatches[m] += cnt;
        colCosts[m] += cst;
        totalAnnualBatches += cnt;
        totalAnnualCost += cst;

        if (cnt > 0) {
          totalTrainees += (cnt * (c.scale?.participantsCount || 0));
          totalFacilities += (cnt * (c.scale?.facilitiesCount || 0));
        }
      }
    });

    // Update Top and Bottom Column headers
    for (let m = 0; m < 12; m++) {
      const topCol = document.getElementById(`topColTotal_${m}`);
      const btmCol = document.getElementById(`bottomColTotal_${m}`);
      const colHtml = `
        <div class="col-batches font-bold" style="font-size: 12px;">${colBatches[m]}</div>
        <div class="col-cost text-secondary" style="font-size: 10px;">${colCosts[m] > 0 ? Utils.formatCurrency(colCosts[m], currency) : '—'}</div>
      `;
      if (topCol) topCol.innerHTML = colHtml;
      if (btmCol) btmCol.innerHTML = colHtml;
    }

    // Update Grand Totals in Top & Bottom Table Headers
    const topGB = document.getElementById('topGrandBatches');
    const topGC = document.getElementById('topGrandCost');
    const btmGB = document.getElementById('bottomGrandBatches');
    const btmGC = document.getElementById('bottomGrandCost');
    if (topGB) topGB.textContent = totalAnnualBatches;
    if (topGC) topGC.textContent = Utils.formatCurrency(totalAnnualCost, currency);
    if (btmGB) btmGB.textContent = totalAnnualBatches;
    if (btmGC) btmGC.textContent = Utils.formatCurrency(totalAnnualCost, currency);

    // Update Bottom Summary Bar
    const barTotal = document.getElementById('barAnnualGrandTotal');
    const barTotalUsd = document.getElementById('barAnnualGrandTotalUsd');
    if (barTotal) barTotal.textContent = Utils.formatCurrency(totalAnnualCost, currency);
    if (barTotalUsd) barTotalUsd.textContent = `(≈ ${Utils.formatCurrency(Utils.convertToUSD(totalAnnualCost, conversionRate), 'USD')})`;

    // Update Top Summary KPI Cards
    const kpiCost = document.getElementById('kpiAnnualBudget');
    const kpiCostUsd = document.getElementById('kpiAnnualBudgetUsd');
    const kpiBatches = document.getElementById('kpiAnnualBatches');
    const kpiTrainees = document.getElementById('kpiAnnualTrainees');
    const kpiFacilities = document.getElementById('kpiAnnualFacilities');
    if (kpiCost) kpiCost.textContent = Utils.formatCurrency(totalAnnualCost, currency);
    if (kpiCostUsd) kpiCostUsd.textContent = `≈ ${Utils.formatCurrency(Utils.convertToUSD(totalAnnualCost, conversionRate), 'USD')}`;
    if (kpiBatches) kpiBatches.textContent = `${totalAnnualBatches} Batches`;
    if (kpiTrainees) kpiTrainees.textContent = `${totalTrainees} Trainees`;
    if (kpiFacilities) kpiFacilities.textContent = `${totalFacilities} Facilities`;
  },

  // Cell Customizer Slide-Over Modal (Tweak scale or uncheck line items for a specific month)
  async showMatrixCellCustomizer(actCode, monthIdx) {
    const activeLocation = this.activeLocationFilter;
    const cell = this.matrixState[activeLocation]?.[actCode]?.[monthIdx];
    if (!cell) return;

    const comp = Object.values(this.components).find(c => c.code === actCode) || this.components['bundled-tot'];
    const monthName = SEED_DATA.months[monthIdx] || 'Jan';
    const currency = this._entity?.currency || 'INR';

    const tpl = await db.getImpActivityTemplate(actCode);
    const rates = await db.getImpUnitRates(activeLocation);
    const customFields = await db.getAllImpCustomRateFields();

    const scale = cell.scale || tpl.scaleDefaults;
    const costLines = cell.costLines || (this.calculateActivityBatchCost(tpl, rates, customFields, scale).costLines);

    let calculatedBatchCost = 0;
    costLines.forEach(l => {
      if (l.isSelected !== false) calculatedBatchCost += l.amount;
    });

    const modalContent = `
      <form id="matrixCustomizerForm" style="font-size: 12.5px;">
        <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default);">
          <div class="flex items-center gap-sm mb-xs">
            <span class="badge ${comp.badgeClass || 'badge-cyan'} font-bold">${comp.code}</span>
            <strong style="color: var(--text-primary); font-size: 14px;">${comp.title}</strong>
          </div>
          <div class="text-secondary" style="font-size: 11.5px;">
            📍 Location: <strong>${activeLocation}</strong> &bull; 📅 Month: <strong>${monthName}-${this._budgetYear}</strong>
          </div>
        </div>

        <!-- Scale Parameters -->
        <div class="card p-md mb-md" style="background: var(--bg-primary); border: 1px solid var(--border-default);">
          <div class="font-bold mb-xs" style="font-size: 11px; text-transform: uppercase; color: var(--accent-secondary);">
            ⚙️ Operational Scale Parameters for ${monthName}
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Duration (Days)</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="custScaleDays" value="${scale.daysCount || 1}" oninput="ImpTotModule.recalculateCustomizerLive('${actCode}')">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Trainees / Pax</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="custScaleParticipants" value="${scale.participantsCount || 25}" oninput="ImpTotModule.recalculateCustomizerLive('${actCode}')">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Trainers Team Size</label>
              <input type="number" min="1" step="1" class="form-input font-bold" id="custScaleTeamSize" value="${scale.teamSize || 2}" oninput="ImpTotModule.recalculateCustomizerLive('${actCode}')">
            </div>
            <div class="form-group mb-none">
              <label class="form-label font-bold" style="font-size: 11px;">Facilities Count</label>
              <input type="number" min="0" step="1" class="form-input font-bold" id="custScaleFacilities" value="${scale.facilitiesCount || 10}" oninput="ImpTotModule.recalculateCustomizerLive('${actCode}')">
            </div>
          </div>
        </div>

        <!-- Line Items with Checkboxes -->
        <div class="card p-md mb-none" style="background: var(--bg-primary); border: 1px solid var(--border-default);">
          <div class="flex justify-between items-center mb-xs">
            <span class="font-bold text-secondary" style="font-size: 11px; text-transform: uppercase;">
              📋 Cost Items Inclusion / Exclusion
            </span>
            <span class="text-tertiary" style="font-size: 10.5px;">Uncheck items to exclude from calculation</span>
          </div>

          <div class="table-container mb-none" style="max-height: 260px; overflow-y: auto;">
            <table class="data-table" id="custLinesTable" style="font-size: 11.5px;">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">Inc</th>
                  <th>Cost Item Description</th>
                  <th>GL Line Item (Parent Account)</th>
                  <th class="num">Unit Rate</th>
                  <th class="num">Batch Amount (${currency})</th>
                </tr>
              </thead>
              <tbody id="custLinesBody">
                ${costLines.map((l, idx) => {
                  const glInfo = Utils.getGlInfo(l.ledgerCode);
                  return `
                    <tr data-line-id="${l.id}" data-formula="${l.formulaType}" data-formula-expr="${l.formulaExpression || ''}" data-rate-field="${l.rateField}" data-multiplier="${l.multiplier || 1}">
                      <td style="text-align: center;">
                        <input type="checkbox" class="cust-line-cb" ${l.isSelected !== false ? 'checked' : ''} onchange="ImpTotModule.recalculateCustomizerLive('${actCode}')" style="width: 15px; height: 15px; accent-color: var(--accent-primary);">
                      </td>
                      <td style="font-weight: 600; color: var(--text-primary);">${l.description}</td>
                      <td>
                        <div class="font-bold" style="font-size: 11px;">${glInfo.desc}</div>
                        <div style="font-size: 9.5px; color: var(--text-secondary);"><code style="font-size: 9.5px;">${l.ledgerCode}</code> &bull; ${l.parentAccount || glInfo.parent}</div>
                      </td>
                      <td class="num font-mono">${Utils.formatNumber(l.unitRate)}</td>
                      <td class="num font-bold font-mono cust-line-amt" style="color: ${l.isSelected !== false ? 'var(--accent-primary)' : 'var(--text-tertiary)'};">
                        ${l.isSelected !== false ? Utils.formatCurrency(l.amount, currency) : '<span style="text-decoration: line-through;">' + Utils.formatCurrency(l.amount, currency) + '</span>'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    `;

    Utils.showModal(`⚙️ Customize Batch: Activity ${comp.code} (${monthName}-${this._budgetYear})`, modalContent, {
      modalWidth: '650px',
      footer: (footer, close) => {
        footer.innerHTML = `
          <div class="flex justify-between items-center" style="width: 100%;">
            <div>
              <span class="text-secondary font-bold" style="font-size: 12px;">Adjusted Cost / Batch: </span>
              <span id="custModalBatchTotal" style="font-size: 1.25rem; font-weight: 800; color: var(--accent-primary);">
                ${Utils.formatCurrency(calculatedBatchCost, currency)}
              </span>
            </div>
            <div class="flex items-center gap-xs">
              <button type="button" class="btn btn-ghost btn-sm" id="btnCancelCustModal">Cancel</button>
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="btnApplyAllMonths">Apply to All 12 Months</button>
              <button type="button" class="btn btn-primary btn-sm font-bold" id="btnApplyThisMonth">Apply to ${monthName} Only</button>
            </div>
          </div>
        `;

        document.getElementById('btnCancelCustModal')?.addEventListener('click', close);

        // Apply to This Month
        document.getElementById('btnApplyThisMonth')?.addEventListener('click', () => {
          this.applyCustomizerChanges(actCode, monthIdx, false);
          close();
        });

        // Apply to All 12 Months
        document.getElementById('btnApplyAllMonths')?.addEventListener('click', () => {
          this.applyCustomizerChanges(actCode, monthIdx, true);
          close();
        });
      }
    });
  },

  // Live Recalculate inside Customizer Modal
  async recalculateCustomizerLive(actCode) {
    const form = document.getElementById('matrixCustomizerForm');
    if (!form) return;

    const days = parseInt(document.getElementById('custScaleDays')?.value, 10) || 1;
    const participants = parseInt(document.getElementById('custScaleParticipants')?.value, 10) || 1;
    const teamSize = parseInt(document.getElementById('custScaleTeamSize')?.value, 10) || 1;
    const facilities = parseInt(document.getElementById('custScaleFacilities')?.value, 10) || 0;

    const activeLocation = this.activeLocationFilter;
    const rates = await db.getImpUnitRates(activeLocation);
    const customFields = await db.getAllImpCustomRateFields();
    const currency = this._entity?.currency || 'INR';

    let batchTotal = 0;

    form.querySelectorAll('#custLinesBody tr').forEach(row => {
      const cb = row.querySelector('.cust-line-cb');
      const isChecked = cb ? cb.checked : true;
      const formula = row.dataset.formula;
      const formulaExpr = row.dataset.formulaExpr;
      const rateField = row.dataset.rateField;
      const multiplier = Utils.parseNumber(row.dataset.multiplier) || 1;

      let unitRate = rates[rateField] !== undefined ? rates[rateField] : 0;
      if (unitRate === 0) {
        const cf = customFields.find(c => c.fieldKey === rateField || c.id === rateField);
        if (cf) unitRate = cf.defaultUnitRate || 0;
      }

      let lineAmount = 0;
      if (formulaExpr) {
        const scope = {
          events: 1,
          days: days,
          trainers: teamSize,
          teamSize: teamSize,
          facilities: facilities,
          trainees: participants,
          participants: participants,
          rate: unitRate,
          unitRate: unitRate,
          multiplier: multiplier
        };
        try {
          lineAmount = Utils.FormulaEvaluator.evaluate(formulaExpr, scope);
        } catch (e) {
          lineAmount = multiplier * unitRate;
        }
      } else {
        switch (formula) {
          case 'events_days_trainers': lineAmount = days * teamSize * multiplier * unitRate; break;
          case 'events_trainers': lineAmount = teamSize * multiplier * unitRate; break;
          case 'facilities_rate': lineAmount = facilities * multiplier * unitRate; break;
          case 'facilities_multiplier': lineAmount = facilities * multiplier * unitRate; break;
          case 'events_days_hall_catering': lineAmount = (days * unitRate) + (days * participants * (rates.venueFoodPerPerson || 750)); break;
          case 'events_days_hall': lineAmount = days * multiplier * unitRate; break;
          case 'events_days_participants': lineAmount = days * participants * multiplier * unitRate; break;
          case 'events_days_honorarium': lineAmount = days * multiplier * unitRate; break;
          case 'participants_rate': lineAmount = participants * multiplier * unitRate; break;
          default: lineAmount = multiplier * unitRate; break;
        }
      }

      const amtCell = row.querySelector('.cust-line-amt');
      if (amtCell) {
        amtCell.innerHTML = isChecked ? Utils.formatCurrency(lineAmount, currency) : `<span style="text-decoration: line-through;">${Utils.formatCurrency(lineAmount, currency)}</span>`;
        amtCell.style.color = isChecked ? 'var(--accent-primary)' : 'var(--text-tertiary)';
      }

      if (isChecked) {
        batchTotal += lineAmount;
      }
    });

    const totalEl = document.getElementById('custModalBatchTotal');
    if (totalEl) totalEl.textContent = Utils.formatCurrency(batchTotal, currency);
  },

  // Save changes from Customizer modal into matrixState
  async applyCustomizerChanges(actCode, monthIdx, applyToAllMonths) {
    const form = document.getElementById('matrixCustomizerForm');
    if (!form) return;

    const days = parseInt(document.getElementById('custScaleDays')?.value, 10) || 1;
    const participants = parseInt(document.getElementById('custScaleParticipants')?.value, 10) || 1;
    const teamSize = parseInt(document.getElementById('custScaleTeamSize')?.value, 10) || 1;
    const facilities = parseInt(document.getElementById('custScaleFacilities')?.value, 10) || 0;

    const activeLocation = this.activeLocationFilter;
    const rates = await db.getImpUnitRates(activeLocation);
    const customFields = await db.getAllImpCustomRateFields();
    const tpl = await db.getImpActivityTemplate(actCode);

    const targetMonths = applyToAllMonths ? Array.from({ length: 12 }, (_, i) => i) : [monthIdx];

    targetMonths.forEach(m => {
      const cell = this.matrixState[activeLocation][actCode][m];
      cell.scale = {
        eventCount: cell.count || 1,
        daysCount: days,
        facilitiesCount: facilities,
        participantsCount: participants,
        teamSize: teamSize,
        toolPackage: 'Tool Package - 1 (Standard)'
      };

      let newBatchTotal = 0;
      const updatedLines = [];

      form.querySelectorAll('#custLinesBody tr').forEach(row => {
        const lineId = row.dataset.lineId;
        const cb = row.querySelector('.cust-line-cb');
        const isChecked = cb ? cb.checked : true;
        const formula = row.dataset.formula;
        const rateField = row.dataset.rateField;
        const multiplier = Utils.parseNumber(row.dataset.multiplier) || 1;

        let unitRate = rates[rateField] !== undefined ? rates[rateField] : 0;
        if (unitRate === 0) {
          const cf = customFields.find(c => c.fieldKey === rateField || c.id === rateField);
          if (cf) unitRate = cf.defaultUnitRate || 0;
        }

        let lineAmount = 0;
        switch (formula) {
          case 'events_days_trainers': lineAmount = days * teamSize * multiplier * unitRate; break;
          case 'events_trainers': lineAmount = teamSize * multiplier * unitRate; break;
          case 'facilities_rate': lineAmount = facilities * multiplier * unitRate; break;
          case 'facilities_multiplier': lineAmount = facilities * multiplier * unitRate; break;
          case 'events_days_hall_catering': lineAmount = (days * unitRate) + (days * participants * (rates.venueFoodPerPerson || 750)); break;
          case 'events_days_hall': lineAmount = days * multiplier * unitRate; break;
          case 'events_days_participants': lineAmount = days * participants * multiplier * unitRate; break;
          case 'events_days_honorarium': lineAmount = days * multiplier * unitRate; break;
          case 'participants_rate': lineAmount = participants * multiplier * unitRate; break;
          default: lineAmount = multiplier * unitRate; break;
        }

        if (isChecked) {
          newBatchTotal += lineAmount;
        }

        const tplLine = tpl.lineItems?.find(l => l.id === lineId) || {};
        updatedLines.push({
          id: lineId,
          description: tplLine.description || 'Cost Item',
          ledgerCode: tplLine.ledgerCode || '93201',
          parentAccount: tplLine.parentAccount || 'Direct Cost',
          rateField: rateField,
          formulaType: formula,
          unitRate: unitRate,
          amount: isChecked ? lineAmount : 0,
          originalCalculatedAmount: lineAmount,
          isSelected: isChecked,
          isCustom: false
        });
      });

      cell.unitCost = newBatchTotal;
      cell.costLines = updatedLines;
      cell.isCustomized = true;
      cell.totalCost = (cell.count || 0) * newBatchTotal;
    });

    Utils.showToast(`✅ Customized batch parameters applied for Activity ${actCode}!`, 'success');
    this.renderMatrixPlanner(this._container);
  },

  // Save the full Annual Batch Matrix into IndexedDB and sync to NonPayrollCost
  async saveAnnualMatrix() {
    try {
      const activeLocation = this.activeLocationFilter;
      const entity = this._entity;
      const dept = this._dept;
      const yearId = this._yearId;
      const budgetYear = this._budgetYear;

      const conditionArea = document.getElementById('matrixConditionSelect')?.value || 'Maternal & Newborn Care';
      const donor = document.getElementById('matrixDonorSelect')?.value || 'Gates Foundation';
      const lead = document.getElementById('matrixLeadInput')?.value || 'State Program Team';

      const matrixData = this.matrixState[activeLocation];
      if (!matrixData) return;

      let savedCount = 0;
      let totalPlanAmount = 0;

      for (const code of Object.keys(matrixData)) {
        const comp = Object.values(this.components).find(c => c.code === code) || this.components['bundled-tot'];

        for (let mIdx = 0; mIdx < 12; mIdx++) {
          const cell = matrixData[code][mIdx];
          const count = cell.count || 0;

          if (count > 0) {
            const scale = {
              eventCount: count,
              daysCount: cell.scale?.daysCount || 1,
              facilitiesCount: (cell.scale?.facilitiesCount || 0) * count,
              participantsCount: (cell.scale?.participantsCount || 25) * count,
              teamSize: cell.scale?.teamSize || 2,
              toolPackage: cell.scale?.toolPackage || 'Tool Package - 1 (Standard)'
            };

            // Scale cost lines by batch count
            const scaledCostLines = (cell.costLines || []).map(l => ({
              ...l,
              amount: (l.isSelected !== false) ? (l.amount * count) : 0,
              originalCalculatedAmount: (l.originalCalculatedAmount || l.amount) * count
            }));

            const eventCost = count * cell.unitCost;
            totalPlanAmount += eventCost;

            const eventObj = {
              yearId: String(yearId),
              entityId: entity.id,
              deptId: dept.id,
              componentId: comp.id,
              monthIdx: mIdx,
              location: activeLocation,
              conditionArea: conditionArea,
              activity: comp.defaultActivity || `${comp.code}-${comp.title}`,
              donor: donor,
              employeeName: lead,
              details: `${comp.title} (${count} Batch${count === 1 ? '' : 'es'})`,
              scaleSummary: `${count} Batch${count === 1 ? '' : 'es'} &bull; ${scale.daysCount}d &bull; ${scale.participantsCount} Pax &bull; ${scale.facilitiesCount} Facs`,
              scale: scale,
              costLines: scaledCostLines,
              totalCost: eventCost
            };

            if (cell.eventId) {
              eventObj.id = cell.eventId;
            }

            const savedId = await db.saveImpTotEvent(eventObj);
            cell.eventId = cell.eventId || savedId;
            eventObj.id = cell.eventId;

            // Sync to NonPayroll
            await this.syncEventToNonPayroll(eventObj);
            savedCount++;
          } else if (cell.eventId) {
            // Event was cleared to 0 batches -> Delete from DB & delete synced records
            const allNonPayroll = await db.getBudgetData(STORES.nonPayrollCost, yearId, entity.id, dept.id);
            const existingLinked = allNonPayroll.filter(r => r.impTotEventId === cell.eventId);
            for (const r of existingLinked) {
              await db.delete(STORES.nonPayrollCost, r.id);
            }
            await db.deleteImpTotEvent(cell.eventId);
            cell.eventId = null;
          }
        }
      }

      Utils.showToast(`🎉 Annual Training Plan for ${activeLocation} saved successfully (${savedCount} Batches scheduled)!`, 'success');

      // Refresh Grid & Other Costs if active
      if (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) {
        await BudgetEntryModule.renderGrid(entity, dept, budgetYear, BudgetEntryModule._actualsMonth || 'Oct');
      } else {
        await this.renderMatrixPlanner(this._container);
      }
    } catch (err) {
      console.error('Error saving Annual Matrix:', err);
      Utils.showToast('Error saving Annual Matrix: ' + err.message, 'danger');
    }
  },

  // Reset entire matrix to 0
  resetMatrixGrid() {
    if (!confirm(`Are you sure you want to reset all batch entries for ${this.activeLocationFilter} to 0?`)) return;
    const activeLocation = this.activeLocationFilter;
    if (this.matrixState[activeLocation]) {
      Object.keys(this.matrixState[activeLocation]).forEach(code => {
        for (let m = 0; m < 12; m++) {
          this.matrixState[activeLocation][code][m].count = 0;
          this.matrixState[activeLocation][code][m].totalCost = 0;
        }
      });
    }
    this.renderMatrixPlanner(this._container);
  },

  // Quick Preset: 1 Batch per Quarter across activities
  applyQuickQuarterlyPreset() {
    const activeLocation = this.activeLocationFilter;
    if (!this.matrixState[activeLocation]) return;
    // Months 1 (May), 4 (Aug), 7 (Nov), 10 (Feb)
    const quarterMonths = [1, 4, 7, 10];
    Object.keys(this.matrixState[activeLocation]).forEach(code => {
      for (let m = 0; m < 12; m++) {
        if (quarterMonths.includes(m)) {
          this.matrixState[activeLocation][code][m].count = 1;
        }
      }
    });
    this.renderMatrixPlanner(this._container);
    Utils.showToast('📑 Applied 1 Batch / Quarter preset across all activities.', 'info');
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 DETAILED EVENT REGISTRY VIEW (Itemized List & Cards)
  // ═══════════════════════════════════════════════════════════════════════════
  async renderRegistryView(container) {
    const yearId = this._yearId;
    const entity = this._entity;
    const dept = this._dept;
    const budgetYear = this._budgetYear;

    const events = await db.getImpTotEvents(yearId, entity.id, dept.id);
    const conversionRate = (await db.getConversionRatesForYear(budgetYear))?.[0]?.rateToUSD || 83.5;

    const allLocationsList = Array.from(new Set([
      ...this._locations.map(l => typeof l === 'string' ? l : (l.name || String(l))),
      ...events.map(e => e.location).filter(Boolean)
    ])).filter(Boolean).sort();

    const locationFilteredEvents = this.activeLocationFilter === 'all'
      ? events
      : events.filter(e => (e.location || '').trim() === this.activeLocationFilter.trim());

    const filteredEvents = this.activeMonthFilter === 'all'
      ? locationFilteredEvents
      : locationFilteredEvents.filter(e => String(e.monthIdx) === String(this.activeMonthFilter));

    const totalAnnualCost = events.reduce((sum, e) => sum + (Utils.parseNumber(e.totalCost) || 0), 0);
    const totalLocationCost = locationFilteredEvents.reduce((sum, e) => sum + (Utils.parseNumber(e.totalCost) || 0), 0);
    const totalFilteredCost = filteredEvents.reduce((sum, e) => sum + (Utils.parseNumber(e.totalCost) || 0), 0);

    container.innerHTML = `
      <div class="card mb-lg" style="border-left: 4px solid var(--accent-secondary); background: var(--bg-secondary);">
        <div class="flex justify-between items-center mb-md" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="flex items-center gap-sm">
              <span class="badge badge-primary font-bold">EVENT REGISTRY</span>
              <span class="badge badge-indigo font-bold">📋 Itemized Breakdown</span>
            </div>
            <h2 class="mt-xs" style="font-size: 1.35rem; color: var(--text-primary); margin-bottom: 2px;">
              📋 Scheduled Training Events Registry (${filteredEvents.length})
            </h2>
            <div class="text-secondary" style="font-size: 12px;">
              Individual event audit &bull; Line-item expense breakdown &bull; Scale variables &bull; GL mappings
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <div class="btn-group" style="display: flex; background: var(--bg-primary); padding: 3px; border-radius: 8px; border: 1px solid var(--border-default);">
              <button type="button" class="btn btn-sm ${this.activeViewMode === 'matrix' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="ImpTotModule.setViewMode('matrix')" style="font-size: 11.5px; padding: 5px 12px;">
                📊 1. Annual Matrix Grid
              </button>
              <button type="button" class="btn btn-sm ${this.activeViewMode === 'registry' ? 'btn-primary font-bold' : 'btn-ghost'}" onclick="ImpTotModule.setViewMode('registry')" style="font-size: 11.5px; padding: 5px 12px;">
                📋 2. Detailed Event Registry (${events.length})
              </button>
            </div>
            <button class="btn btn-primary btn-sm font-bold" onclick="ImpTotModule.showEventWizard('bundled-tot')">
              ➕ + Plan Single Event
            </button>
          </div>
        </div>

        <!-- Location & Month Filter -->
        <div class="card p-md mb-md" style="background: var(--bg-primary); border: 1px solid var(--border-default);">
          <div class="flex items-center justify-between gap-md mb-sm" style="flex-wrap: wrap;">
            <div class="flex items-center gap-sm">
              <label class="form-label font-bold mb-none" style="font-size: 11.5px;">📍 Filter Location:</label>
              <select class="form-select font-bold" onchange="ImpTotModule.filterByLocation(this.value)" style="min-width: 220px; font-size: 12px;">
                <option value="all" ${this.activeLocationFilter === 'all' ? 'selected' : ''}>🌍 All Locations (${events.length})</option>
                ${allLocationsList.map(loc => `
                  <option value="${loc}" ${this.activeLocationFilter === loc ? 'selected' : ''}>📍 ${loc}</option>
                `).join('')}
              </select>
            </div>
            <div class="month-tabs" style="display: flex; gap: 6px; overflow-x: auto;">
              <button type="button" class="sub-tab ${this.activeMonthFilter === 'all' ? 'active' : ''}" onclick="ImpTotModule.filterByMonth('all')">All Months</button>
              ${SEED_DATA.months.map((m, idx) => `
                <button type="button" class="sub-tab ${String(this.activeMonthFilter) === String(idx) ? 'active' : ''}" onclick="ImpTotModule.filterByMonth(${idx})">${m}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Table of Events -->
        <div class="table-container mb-none">
          <table class="data-table" id="impTotMasterTable">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Expand</th>
                <th class="sticky-col-1">Scheduled Month</th>
                <th class="sticky-col-2">Activity & Component</th>
                <th>Additional Details / Purpose</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Donor</th>
                <th>Scale Summary</th>
                <th class="num font-bold">Total Cost (${entity.currency})</th>
                <th class="num font-bold">Total USD</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.length === 0 ? `
                <tr><td colspan="11" class="text-center p-lg text-muted">No scheduled training packages match the filter. Use the <strong>Annual Matrix Grid</strong> to plan events.</td></tr>
              ` : filteredEvents.map(evt => {
                const comp = this.components[evt.componentId] || this.components['bundled-tot'];
                const monthName = SEED_DATA.months[evt.monthIdx] || 'Jan';
                return `
                  <tr class="exp-item-main-row" data-row-id="${evt.id}">
                    <td style="text-align: center;">
                      <button type="button" class="btn-expand-row" data-target="imp-breakdown-${evt.id}">▶</button>
                    </td>
                    <td class="sticky-col-1 font-bold">📅 ${monthName}-${budgetYear}</td>
                    <td class="sticky-col-2 font-bold">${comp.icon} ${comp.code} ${comp.title}</td>
                    <td>${evt.details || '—'}</td>
                    <td><code>${evt.location}</code></td>
                    <td>${evt.conditionArea || '—'}</td>
                    <td>${evt.donor || '—'}</td>
                    <td style="font-size: 11px; color: var(--text-secondary);">${evt.scaleSummary || '1 Event'}</td>
                    <td class="num font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(evt.totalCost, entity.currency)}</td>
                    <td class="num font-bold" style="color: var(--accent-secondary);">≈ ${Utils.formatCurrency(Utils.convertToUSD(evt.totalCost, conversionRate), 'USD')}</td>
                    <td style="white-space: nowrap;">
                      <button class="btn btn-ghost btn-sm" onclick="ImpTotModule.showEventWizard('${evt.componentId}', ${evt.id})">✏️ Edit</button>
                      <button class="btn btn-danger btn-sm" onclick="ImpTotModule.deleteEvent(${evt.id})">🗑️</button>
                    </td>
                  </tr>
                  <tr class="exp-breakdown-row" id="imp-breakdown-${evt.id}" style="display: none;">
                    <td colspan="11">
                      <div class="p-md" style="background: var(--bg-card); border-radius: 6px;">
                        <table class="data-table" style="font-size: 11px;">
                          <thead>
                            <tr>
                              <th>Cost Line Item</th>
                              <th>GL Line Item (Parent Account)</th>
                              <th>Basis</th>
                              <th class="num">Unit Rate</th>
                              <th class="num">Amount (${entity.currency})</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(evt.costLines || []).map(l => {
                              const glInfo = Utils.getGlInfo(l.ledgerCode);
                              return `
                                <tr>
                                  <td style="font-weight: 600;">${l.description}</td>
                                  <td>
                                    <div class="font-bold" style="font-size: 11px;">${glInfo.desc}</div>
                                    <div style="font-size: 9.5px; color: var(--text-secondary);"><code style="font-size: 9.5px;">${l.ledgerCode}</code> &bull; ${l.parentAccount || glInfo.parent}</div>
                                  </td>
                                  <td style="color: var(--text-secondary);">${l.basis}</td>
                                  <td class="num">${Utils.formatNumber(l.unitRate)}</td>
                                  <td class="num font-bold" style="color: var(--accent-primary);">${Utils.formatCurrency(l.amount, entity.currency)}</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
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

    this.bindAccordionToggles(container);
  },

  showNewEventDropdown(btn) {
    const menu = document.getElementById('impEventDropdownMenu');
    if (!menu) return;
    const isShown = menu.style.display === 'block';
    menu.style.display = isShown ? 'none' : 'block';
    
    const closeHandler = (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeHandler);
      }
    };
    if (!isShown) {
      setTimeout(() => document.addEventListener('click', closeHandler), 50);
    }
  },

  bindAccordionToggles(container) {
    container.querySelectorAll('.btn-expand-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.dataset.target;
        const targetRow = document.getElementById(targetId);
        if (targetRow) {
          const isHidden = targetRow.style.display === 'none';
          targetRow.style.display = isHidden ? 'table-row' : 'none';
          btn.textContent = isHidden ? '▼' : '▶';
          btn.classList.toggle('expanded', isHidden);
        }
      });
    });
  },

  toggleAllBreakdowns(btn) {
    const isExpanding = btn.textContent.includes('▶');
    document.querySelectorAll('#impTotMasterTable .exp-breakdown-row').forEach(row => {
      row.style.display = isExpanding ? 'table-row' : 'none';
    });
    document.querySelectorAll('#impTotMasterTable .btn-expand-row').forEach(b => {
      b.textContent = isExpanding ? '▼' : '▶';
      b.classList.toggle('expanded', isExpanding);
    });
    btn.textContent = isExpanding ? '▼ Collapse All' : '▶ Expand All';
  },

  // ─── Modal Wizard to Create / Edit a Training Event ───
  async showEventWizard(compKey, editEventId = null) {
    const comp = this.components[compKey] || this.components['bundled-tot'];
    
    // Guaranteed Context Resolution
    const entity = this._entity || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) || (await db.getAll(STORES.entities))[0] || SEED_DATA.entities[0];
    const dept = this._dept || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._dept) || (await db.getAll(STORES.departments))[0] || SEED_DATA.departments[0];
    const yearId = this._yearId || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._yearId) || App.selectedYear || '2026';
    const budgetYear = this._budgetYear || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._budgetYear) || 2026;

    const rawLocs = (this._locations && this._locations.length > 0)
      ? this._locations
      : ((typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._locations && BudgetEntryModule._locations.length > 0)
        ? BudgetEntryModule._locations
        : (await db.getLocationsForEntity(entity.id)));

    const rawDonors = (this._donors && this._donors.length > 0)
      ? this._donors
      : ((typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._donors && BudgetEntryModule._donors.length > 0)
        ? BudgetEntryModule._donors
        : (await db.getDonorsForEntity(entity.id)));

    const rawActivities = (this._activities && this._activities.length > 0)
      ? this._activities
      : ((typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._activities && BudgetEntryModule._activities.length > 0)
        ? BudgetEntryModule._activities
        : (await db.getAll(STORES.activities)));

    const rawConditions = (this._conditionAreas && this._conditionAreas.length > 0)
      ? this._conditionAreas
      : ((typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._conditionAreas && BudgetEntryModule._conditionAreas.length > 0)
        ? BudgetEntryModule._conditionAreas
        : (await db.getAll(STORES.conditionAreas)));

    // Cache locally
    this._entity = entity;
    this._dept = dept;
    this._yearId = yearId;
    this._budgetYear = budgetYear;
    this._locations = rawLocs && rawLocs.length > 0 ? rawLocs : (SEED_DATA.locations[entity.id] || [{ name: 'India KA' }]);
    this._donors = rawDonors && rawDonors.length > 0 ? rawDonors : (SEED_DATA.donors[entity.id] || [{ name: 'Gates Foundation' }]);
    this._activities = rawActivities && rawActivities.length > 0 ? rawActivities : SEED_DATA.activities;
    this._conditionAreas = rawConditions && rawConditions.length > 0 ? rawConditions : SEED_DATA.conditionAreas;

    // Normalize array elements to string values
    const locNames = this._locations.map(l => typeof l === 'string' ? l : (l.name || String(l)));
    const donorNames = this._donors.map(d => typeof d === 'string' ? d : (d.name || String(d)));
    const actNames = this._activities.map(a => typeof a === 'string' ? a : (a.name || a.activityName || String(a)));
    const condNames = this._conditionAreas.map(c => typeof c === 'string' ? c : (c.name || c.areaName || String(c)));

    // Load master employees list
    const masterEmployees = (await db.getEmployeesMaster())
      .filter(e => e.entityId === entity.id && e.status !== 'Inactive')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    let existingEvent = null;
    if (editEventId) {
      existingEvent = await db.get(STORES.impTotEvents, editEventId);
    }

    const allTemplates = await db.getAllImpActivityTemplates();
    const defaultActivity = existingEvent?.activity || comp.defaultActivity;
    const activeTemplate = await db.getImpActivityTemplate(defaultActivity || comp.code || comp.id);

    const defaultMonth = existingEvent ? existingEvent.monthIdx : (this.activeMonthFilter !== 'all' ? this.activeMonthFilter : 0);
    const defaultLocation = existingEvent?.location || (this.activeLocationFilter !== 'all' ? this.activeLocationFilter : (locNames[0] || 'India KA'));
    const defaultDonor = existingEvent?.donor || donorNames[0] || 'Gates Foundation';
    const defaultCondition = existingEvent?.conditionArea || condNames[0] || 'Maternal & Newborn Care';
    const defaultEmployee = existingEvent?.employeeName || masterEmployees[0]?.name || '';
    const defaultDetails = existingEvent?.details || '';

    // Scale defaults from existing event or active template
    const scale = existingEvent?.scale || activeTemplate?.scaleDefaults || {
      eventCount: 1,
      daysCount: comp.id === 'mo-training' ? 1 : (comp.id === 'district-tot' ? 2 : 3),
      facilitiesCount: comp.id === 'district-tot' ? 10 : 15,
      participantsCount: comp.id === 'district-tot' ? 20 : (comp.id === 'mo-training' ? 25 : 30),
      teamSize: comp.id === 'district-tot' ? 2 : (comp.id === 'mo-training' ? 2 : 3),
      toolPackage: 'Tool Package - 1 (Standard)'
    };

    const customLines = existingEvent?.customLines || [];
    const rates = await db.getImpUnitRates(defaultLocation);

    // Remove any lingering old modal overlay
    const oldOverlay = document.getElementById('impEventModalOverlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'impEventModalOverlay';

    overlay.innerHTML = `
      <div class="modal modal-fullscreen" style="display: flex; flex-direction: column; max-height: 94vh; background: var(--bg-primary);">
        <!-- Header -->
        <div class="modal-header flex justify-between items-center" style="border-bottom: 1px solid var(--border-subtle); padding: 14px 24px; background: var(--bg-secondary);">
          <div>
            <div class="flex items-center gap-sm">
              <span class="badge ${comp.badgeClass || 'badge-cyan'} font-bold" style="font-size: 11px;" id="impModalBadge">${activeTemplate?.code || comp.code}</span>
              <h3 style="margin: 0; color: var(--text-primary); font-size: 1.25rem; font-weight: 700;" id="impModalTitle">
                ${existingEvent ? `✏️ Edit Training Package: ${activeTemplate?.title || comp.title}` : `🎯 Plan ${activeTemplate?.title || comp.title}`}
              </h3>
            </div>
            <div class="text-secondary" style="font-size: 12px; margin-top: 3px;" id="impModalSubtitle">
              Template-Driven Scale Engine &bull; Master Template: <strong>${activeTemplate?.code || '10.1'} - ${activeTemplate?.title || comp.title}</strong>
            </div>
          </div>
          <button class="modal-close" id="btnCloseImpModal" style="font-size: 1.4rem;">&times;</button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px; background: var(--bg-primary);">
          <form id="impEventForm">
            <!-- 1. 5D Dimensions & Event Scheduling -->
            <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); box-shadow: var(--shadow-sm);">
              <div class="flex items-center justify-between mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
                  1. 5-Dimensional Budget Tagging &amp; Master Template Selection
                </div>
                <span class="badge badge-cyan" style="font-size: 10px;">5D Dimensions &amp; Template</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <div class="form-group mb-none" style="grid-column: span 2;">
                  <label class="form-label font-bold" style="font-size: 11px; color: var(--accent-primary);">📋 Master Activity Template <span class="text-danger">*</span></label>
                  <select class="form-select font-bold" id="impTemplateSelect" onchange="ImpTotModule.onTemplateSelectChanged(this.value)" style="border: 1.5px solid var(--accent-primary); background: var(--bg-card); font-size: 12px; padding: 6px 10px;">
                    ${allTemplates.map(t => `
                      <option value="${t.code}" ${t.code === (activeTemplate?.code || '10.1') ? 'selected' : ''}>
                        ${t.icon || '🎯'} Activity ${t.code}: ${t.title}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">📅 Scheduled Budget Month <span class="text-danger">*</span></label>
                  <select class="form-select font-bold" id="impMonthSelect">
                    ${SEED_DATA.months.map((m, idx) => `
                      <option value="${idx}" ${String(defaultMonth) === String(idx) ? 'selected' : ''}>${m}-${budgetYear}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">🌐 5D Location / Geography <span class="text-danger">*</span></label>
                  <select class="form-select font-bold" id="impLocationSelect" onchange="ImpTotModule.onLocationChanged(this.value)">
                    ${locNames.map(loc => `
                      <option value="${loc}" ${loc === defaultLocation ? 'selected' : ''}>${loc}</option>
                    `).join('')}
                    ${!locNames.includes('India KA') ? '<option value="India KA">India KA</option>' : ''}
                    ${!locNames.includes('India AP') ? '<option value="India AP">India AP</option>' : ''}
                    ${!locNames.includes('India TS') ? '<option value="India TS">India TS</option>' : ''}
                    ${!locNames.includes('India MH') ? '<option value="India MH">India MH</option>' : ''}
                    ${!locNames.includes('India OD') ? '<option value="India OD">India OD</option>' : ''}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">🏷️ 5D Activity Dimension <span class="text-danger">*</span></label>
                  <select class="form-select font-bold" id="impActivitySelect" onchange="ImpTotModule.onActivitySelectChanged(this.value)">
                    ${actNames.filter(a => a.startsWith('10.') || a.toLowerCase().includes('tot') || a.toLowerCase().includes('training') || a.toLowerCase().includes('launch') || a.toLowerCase().includes('supervision') || a.toLowerCase().includes('visit')).map(a => `
                      <option value="${a}" ${a === defaultActivity ? 'selected' : ''}>${a}</option>
                    `).join('')}
                    ${!actNames.includes(comp.defaultActivity) ? `<option value="${comp.defaultActivity}" selected>${comp.defaultActivity}</option>` : ''}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">🏥 5D Condition Area <span class="text-danger">*</span></label>
                  <select class="form-select" id="impConditionSelect">
                    ${condNames.map(c => `
                      <option value="${c}" ${c === defaultCondition ? 'selected' : ''}>${c}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">🤝 5D Donor <span class="text-danger">*</span></label>
                  <select class="form-select" id="impDonorSelect">
                    ${donorNames.map(d => `
                      <option value="${d}" ${d === defaultDonor ? 'selected' : ''}>${d}</option>
                    `).join('')}
                    ${!donorNames.includes('Gates Foundation') ? '<option value="Gates Foundation">Gates Foundation</option>' : ''}
                  </select>
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">👤 Responsible Program Lead</label>
                  <select class="form-select" id="impEmployeeSelect">
                    <option value="">-- Select Staff Lead (Optional) --</option>
                    ${masterEmployees.map(emp => `
                      <option value="${emp.name}" ${emp.name === defaultEmployee ? 'selected' : ''}>👤 ${emp.name} (${emp.designation || emp.band || 'Staff'})</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="mt-sm form-group mb-none">
                <label class="form-label font-bold" style="font-size: 11px;">📝 Additional Details / Specific Purpose Notes</label>
                <input type="text" class="form-input" id="impDetailsInput" value="${defaultDetails}" placeholder="e.g. SIHFW State Institute Batch 1 & 2 - District Master Trainers (Mandya & Hassan Districts)...">
              </div>
            </div>

            <!-- 2. Operational Scale Inputs -->
            <div class="card p-md mb-md" style="background: var(--bg-secondary); border: 1px solid var(--border-default); box-shadow: var(--shadow-sm);">
              <div class="flex justify-between items-center mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <div class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
                  2. Operational Scale Parameters &amp; Benchmark Rate Driver
                </div>
                <div id="impRateNotice" class="badge badge-cyan font-bold" style="font-size: 11px; padding: 4px 10px;">
                  📍 Loaded Benchmark Rates: <strong>${rates.stateName || defaultLocation}</strong> (${rates.currency || entity.currency || 'INR'})
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">No. of Events / Batches</label>
                  <input type="number" min="1" step="1" class="form-input font-bold" id="scaleEvents" value="${scale.eventCount || 1}" oninput="ImpTotModule.recalculateModalCost()">
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">Duration (Days / Event)</label>
                  <input type="number" min="1" step="1" class="form-input font-bold" id="scaleDays" value="${scale.daysCount || 2}" oninput="ImpTotModule.recalculateModalCost()">
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">Launching Facilities</label>
                  <input type="number" min="0" step="1" class="form-input font-bold" id="scaleFacilities" value="${scale.facilitiesCount || 15}" oninput="ImpTotModule.recalculateModalCost()">
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">Trainees / Participants</label>
                  <input type="number" min="1" step="1" class="form-input font-bold" id="scaleParticipants" value="${scale.participantsCount || 30}" oninput="ImpTotModule.recalculateModalCost()">
                </div>
                <div class="form-group mb-none">
                  <label class="form-label font-bold" style="font-size: 11px;">Team Size (Trainers)</label>
                  <input type="number" min="1" step="1" class="form-input font-bold" id="scaleTeamSize" value="${scale.teamSize || 2}" oninput="ImpTotModule.recalculateModalCost()">
                </div>
                ${comp.hasToolPackage ? `
                  <div class="form-group mb-none">
                    <label class="form-label font-bold" style="font-size: 11px;">Tool Package</label>
                    <select class="form-select font-bold" id="scaleToolPkg" onchange="ImpTotModule.recalculateModalCost()">
                      <option value="Tool Package - 1 (Standard)" ${scale.toolPackage?.includes('1') ? 'selected' : ''}>Tool Package - 1 (Standard)</option>
                      <option value="Tool Package - 2 (Required)" ${scale.toolPackage?.includes('2') ? 'selected' : ''}>Tool Package - 2 (Required)</option>
                    </select>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 3. Template-Linked Cost Line Items (With Selection Checkboxes) -->
            <div class="card p-md mb-none" style="background: var(--bg-secondary); border: 1px solid var(--border-default); box-shadow: var(--shadow-sm);">
              <div class="flex justify-between items-center mb-sm" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                <div>
                  <div class="flex items-center gap-xs mb-xs">
                    <span class="font-bold" style="font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
                      3. Template-Linked Budget Cost Line Items &amp; Calculation Breakdown
                    </span>
                    <span class="badge badge-indigo font-bold" id="impActiveTemplateBadge" style="font-size: 11px; padding: 2px 8px;">
                      📋 Template: ${activeTemplate?.code || '10.1'} - ${activeTemplate?.title || comp.title}
                    </span>
                  </div>
                  <div class="text-tertiary" style="font-size: 11px;">
                    Cost line items loaded from Master Activity Template. Select or deselect to include/exclude. (All selected by default ✅)
                  </div>
                </div>
                <div class="flex items-center gap-xs">
                  <button type="button" class="btn btn-ghost btn-sm" onclick="ImpTotModule.toggleAllLineCheckboxes(true)" style="font-size: 11px;">
                    ☑️ Select All
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" onclick="ImpTotModule.toggleAllLineCheckboxes(false)" style="font-size: 11px;">
                    ⬜ Deselect All
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm font-bold" onclick="ImpTotModule.addCustomCostLineInModal()" style="border-color: var(--accent-primary); color: var(--accent-primary); font-size: 11px;">
                    ➕ + Add Custom Cost Line
                  </button>
                </div>
              </div>

              <div class="table-container mb-none">
                <table class="data-table" id="modalCostItemsTable" style="font-size: 12px; width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 50px; text-align: center;">Include</th>
                      <th style="min-width: 210px;">Cost Line Item Description</th>
                      <th style="min-width: 190px;">GL Line Item (Parent Account)</th>
                      <th style="min-width: 210px;">Calculation Basis / Unit Formula</th>
                      <th class="num" id="modalUnitRateHeader" style="min-width: 95px;">Unit Rate (${rates.currency || entity.currency || 'INR'})</th>
                      <th class="num font-bold" id="modalAllocatedHeader" style="min-width: 130px;">Allocated Amount (${rates.currency || entity.currency || 'INR'})</th>
                      <th class="num font-bold" style="min-width: 100px;">USD Equiv.</th>
                      <th style="width: 80px; text-align: center;">Type</th>
                    </tr>
                  </thead>
                  <tbody id="modalCostItemsBody">
                    <!-- Dynamic rows populated by recalculateModalCost() -->
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer flex justify-between items-center" style="border-top: 1px solid var(--border-subtle); padding: 14px 24px; background: var(--bg-secondary);">
          <div class="flex items-center gap-md">
            <span class="text-secondary font-bold" style="font-size: 13px;">Total Calculated Event Budget: </span>
            <span id="modalGrandTotalDisplay" style="font-size: 1.35rem; font-weight: 700; color: var(--accent-primary);">
              0
            </span>
            <span id="modalGrandTotalUsdDisplay" style="font-size: 0.92rem; font-weight: 600; color: var(--accent-secondary);">
              ≈ $0 USD
            </span>
          </div>
          <div class="flex items-center gap-sm">
            <button type="button" class="btn btn-ghost" id="btnCancelImpModal">Cancel</button>
            <button type="button" class="btn btn-primary font-bold" id="btnSaveImpEvent" onclick="ImpTotModule.saveEventFromModal('${comp.id}', ${editEventId || 'null'})">
              💾 ${existingEvent ? 'Save Changes' : 'Save Training Package'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initial calculation with existing cost lines if any
    await this.recalculateModalCost(comp.id, rates, customLines, existingEvent?.costLines);

    // Bind Close events
    const closeModal = () => {
      overlay.remove();
      document.removeEventListener('keydown', handleEsc);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEsc);

    document.getElementById('btnCloseImpModal')?.addEventListener('click', closeModal);
    document.getElementById('btnCancelImpModal')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  },

  // Helper to generate formatted GL options: GL Line Item (Parent Account)
  getGlSelectOptions(selectedCode) {
    const code = String(selectedCode || '93101').trim();
    const options = [
      { code: '93101', desc: 'Hotel Accommodation', parent: 'Travel & Lodging Expenses' },
      { code: '93104', desc: 'Cab/Auto', parent: 'Travel & Lodging Expenses' },
      { code: '93102', desc: 'Food Expenses', parent: 'Travel & Lodging Expenses' },
      { code: '93105', desc: 'Bus/Train', parent: 'Travel & Lodging Expenses' },
      { code: '93103', desc: 'Air fare', parent: 'Travel & Lodging Expenses' },
      { code: '93106', desc: 'Other incidental travel costs', parent: 'Travel & Lodging Expenses' },
      { code: '93204', desc: 'Printing expenses', parent: 'Supplies & Printing Costs' },
      { code: '93201', desc: 'Other Direct Expenses', parent: 'Supplies & Printing Costs' },
      { code: '93701', desc: 'Professional Charges', parent: 'Professional & Consultancy Charges' },
      { code: '93703', desc: 'Admin Consultants', parent: 'Professional & Consultancy Charges' },
      { code: '93302', desc: 'Postage & Courier Expenses', parent: 'Communication Cost' },
      { code: '93301', desc: 'Internet Expenses', parent: 'Communication Cost' },
      { code: '93303', desc: 'Telecommunication expenses', parent: 'Communication Cost' },
      { code: '93401', desc: 'Software and Subscriptions', parent: 'Office Expenses' },
      { code: '93404', desc: 'Stationery & Consumables', parent: 'Office Expenses' },
      { code: '93405', desc: 'Office Equipment Expense', parent: 'Office Expenses' },
      { code: '11301', desc: 'Laptop / Printer', parent: 'Fixed Assets' }
    ];

    return options.map(opt => `
      <option value="${opt.code}" ${opt.code === code ? 'selected' : ''}>
        ${opt.desc} (${opt.parent})
      </option>
    `).join('');
  },

  onLineGlChanged(selectEl) {
    const row = selectEl.closest('tr');
    if (!row) return;
    const newGl = selectEl.value;
    row.dataset.glCode = newGl;
    const glInfo = Utils.getGlInfo(newGl);
    row.dataset.parentAcc = glInfo.parent;
    const codeBadge = row.querySelector('.gl-code-badge');
    if (codeBadge) codeBadge.textContent = newGl;
    const parentSpan = row.querySelector('.gl-parent-span');
    if (parentSpan) parentSpan.textContent = glInfo.parent;
  },

  // When Master Activity Template changes in modal, re-load active template and sync dimensions
  async onTemplateSelectChanged(templateCode) {
    const tpl = await db.getImpActivityTemplate(templateCode);
    const titleEl = document.getElementById('impModalTitle');
    const badgeEl = document.getElementById('impModalBadge');
    const subtitleEl = document.getElementById('impModalSubtitle');
    const tplBadgeEl = document.getElementById('impActiveTemplateBadge');
    const actSelect = document.getElementById('impActivitySelect');

    if (titleEl && tpl) {
      titleEl.innerHTML = `🎯 Plan ${tpl.title}`;
    }
    if (badgeEl && tpl) {
      badgeEl.textContent = tpl.code;
    }
    if (subtitleEl && tpl) {
      subtitleEl.innerHTML = `Template-Driven Scale Engine &bull; Master Template: <strong>${tpl.code} - ${tpl.title}</strong>`;
    }
    if (tplBadgeEl && tpl) {
      tplBadgeEl.textContent = `📋 Template: ${tpl.code} - ${tpl.title}`;
    }
    if (actSelect && tpl) {
      // Find matching option in 5D activity select
      for (let i = 0; i < actSelect.options.length; i++) {
        if (actSelect.options[i].value === tpl.activityName || actSelect.options[i].value.startsWith(tpl.code)) {
          actSelect.selectedIndex = i;
          break;
        }
      }
    }

    // Apply template scale defaults
    if (tpl && tpl.scaleDefaults) {
      const elEvents = document.getElementById('scaleEvents');
      const elDays = document.getElementById('scaleDays');
      const elFac = document.getElementById('scaleFacilities');
      const elPart = document.getElementById('scaleParticipants');
      const elTeam = document.getElementById('scaleTeamSize');
      const elPkg = document.getElementById('scaleToolPkg');

      if (elEvents && tpl.scaleDefaults.eventCount !== undefined) elEvents.value = tpl.scaleDefaults.eventCount;
      if (elDays && tpl.scaleDefaults.daysCount !== undefined) elDays.value = tpl.scaleDefaults.daysCount;
      if (elFac && tpl.scaleDefaults.facilitiesCount !== undefined) elFac.value = tpl.scaleDefaults.facilitiesCount;
      if (elPart && tpl.scaleDefaults.participantsCount !== undefined) elPart.value = tpl.scaleDefaults.participantsCount;
      if (elTeam && tpl.scaleDefaults.teamSize !== undefined) elTeam.value = tpl.scaleDefaults.teamSize;
      if (elPkg && tpl.scaleDefaults.toolPackage !== undefined) elPkg.value = tpl.scaleDefaults.toolPackage;
    }

    this.recalculateModalCost();
  },

  // When activity changes in modal, re-load active template and recalculate
  async onActivitySelectChanged(activityName) {
    const tpl = await db.getImpActivityTemplate(activityName);
    const tplSelect = document.getElementById('impTemplateSelect');
    if (tplSelect && tpl && tpl.code) {
      tplSelect.value = tpl.code;
    }
    const titleEl = document.getElementById('impModalTitle');
    const badgeEl = document.getElementById('impModalBadge');
    const subtitleEl = document.getElementById('impModalSubtitle');
    const tplBadgeEl = document.getElementById('impActiveTemplateBadge');

    if (titleEl && tpl) {
      titleEl.innerHTML = `🎯 Plan ${tpl.title}`;
    }
    if (badgeEl && tpl) {
      badgeEl.textContent = tpl.code;
    }
    if (subtitleEl && tpl) {
      subtitleEl.innerHTML = `Template-Driven Scale Engine &bull; Master Template: <strong>${tpl.code} - ${tpl.title}</strong>`;
    }
    if (tplBadgeEl && tpl) {
      tplBadgeEl.textContent = `📋 Template: ${tpl.code} - ${tpl.title}`;
    }
    this.recalculateModalCost();
  },

  // When location changes in modal, re-fetch rates and recalculate
  async onLocationChanged(newLoc) {
    const rates = await db.getImpUnitRates(newLoc);
    const notice = document.getElementById('impRateNotice');
    if (notice) {
      notice.innerHTML = `📍 Loaded Benchmark Rates: <strong>${rates.stateName || newLoc}</strong> (${rates.currency || 'INR'})`;
    }
    const unitHeader = document.getElementById('modalUnitRateHeader');
    if (unitHeader) {
      unitHeader.textContent = `Unit Rate (${rates.currency || this._entity?.currency || 'INR'})`;
    }
    const allocHeader = document.getElementById('modalAllocatedHeader');
    if (allocHeader) {
      allocHeader.textContent = `Allocated Amount (${rates.currency || this._entity?.currency || 'INR'})`;
    }
    this.recalculateModalCost(null, rates);
  },

  // Recalculate cost lines based on the active template, location unit rates, and employee checkboxes
  async recalculateModalCost(compIdOverride = null, ratesOverride = null, customLinesOverride = null, existingSavedLines = null) {
    const form = document.getElementById('impEventForm');
    if (!form) return;

    const locSelect = document.getElementById('impLocationSelect');
    const location = locSelect ? locSelect.value : 'India KA';
    const rates = ratesOverride || (await db.getImpUnitRates(location));

    const tplSelect = document.getElementById('impTemplateSelect');
    const actSelect = document.getElementById('impActivitySelect');
    const templateKey = (tplSelect && tplSelect.value) || (actSelect && actSelect.value) || '10.1';

    // Fetch active Admin Template for this activity
    const template = await db.getImpActivityTemplate(templateKey);
    const customFields = await db.getAllImpCustomRateFields();

    const events = parseInt(document.getElementById('scaleEvents')?.value, 10) || 1;
    const days = parseInt(document.getElementById('scaleDays')?.value, 10) || 1;
    const facilities = parseInt(document.getElementById('scaleFacilities')?.value, 10) || 0;
    const participants = parseInt(document.getElementById('scaleParticipants')?.value, 10) || 0;
    const teamSize = parseInt(document.getElementById('scaleTeamSize')?.value, 10) || 1;
    const toolPkg = document.getElementById('scaleToolPkg')?.value || 'Tool Package - 1 (Standard)';

    const tbody = document.getElementById('modalCostItemsBody');
    if (!tbody) return;

    // Collect current checkbox toggle states from DOM to preserve user selections
    const lineSelectionMap = {};
    tbody.querySelectorAll('tr.auto-cost-row').forEach(row => {
      const lineId = row.dataset.lineId;
      const cb = row.querySelector('.line-item-toggle-cb');
      if (lineId && cb) {
        lineSelectionMap[lineId] = cb.checked;
      }
    });

    // If initial load with saved lines, use saved isSelected status
    if (existingSavedLines && existingSavedLines.length > 0 && Object.keys(lineSelectionMap).length === 0) {
      existingSavedLines.forEach(sl => {
        if (sl.id) {
          lineSelectionMap[sl.id] = (sl.isSelected !== false);
        }
      });
    }

    // Collect existing custom lines currently in the DOM
    const existingCustomLines = [];
    tbody.querySelectorAll('tr.custom-row').forEach(row => {
      const descInput = row.querySelector('.custom-desc-input');
      const glSelect = row.querySelector('.custom-gl-select');
      const basisInput = row.querySelector('.custom-basis-input');
      const amountInput = row.querySelector('.custom-amount-input');
      const cb = row.querySelector('.line-item-toggle-cb');
      if (descInput && amountInput) {
        existingCustomLines.push({
          isCustom: true,
          isSelected: cb ? cb.checked : true,
          description: descInput.value,
          glCode: glSelect ? glSelect.value : '93201',
          basis: basisInput ? basisInput.value : 'Custom addition',
          amount: Utils.parseNumber(amountInput.value) || 0
        });
      }
    });

    const customLines = customLinesOverride || existingCustomLines;

    // Build line items from active Admin Template
    const templateLines = (template && template.lineItems && template.lineItems.length > 0)
      ? template.lineItems
      : (SEED_DATA.defaultImpActivityTemplates[0].lineItems);

    const calculatedLines = [];

    templateLines.forEach(item => {
      // Find unit rate for this line's rateField
      let unitRate = rates[item.rateField] !== undefined ? rates[item.rateField] : 0;
      if (unitRate === 0) {
        const cf = customFields.find(c => c.fieldKey === item.rateField || c.id === item.rateField);
        if (cf) unitRate = cf.defaultUnitRate || 0;
      }

      let secUnitRate = 0;
      if (item.secondaryRateField) {
        secUnitRate = rates[item.secondaryRateField] !== undefined ? rates[item.secondaryRateField] : 0;
      }

      const multiplier = item.multiplier || 1;
      let calculatedAmount = 0;
      let basisText = '';

      if (item.formulaExpression) {
        const scope = {
          events: events,
          days: days,
          trainers: teamSize,
          teamSize: teamSize,
          facilities: facilities,
          trainees: participants,
          participants: participants,
          rate: unitRate,
          unitRate: unitRate,
          multiplier: multiplier,
          secRate: secUnitRate
        };
        try {
          calculatedAmount = Utils.FormulaEvaluator.evaluate(item.formulaExpression, scope);
          basisText = `Formula: ${item.formulaExpression}`;
        } catch (e) {
          calculatedAmount = events * multiplier * unitRate;
          basisText = `Flat Rate × ${multiplier}`;
        }
      } else {
        switch (item.formulaType) {
          case 'events_days_trainers':
            calculatedAmount = events * days * teamSize * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${days} Day${days === 1 ? '' : 's'} × ${teamSize} Trainer${teamSize === 1 ? '' : 's'}`;
            break;

          case 'events_trainers':
            calculatedAmount = events * teamSize * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${teamSize} Trainer${teamSize === 1 ? '' : 's'} × Transit Rate`;
            break;

          case 'facilities_rate':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilit${facilities === 1 ? 'y' : 'ies'} × Unit Rate`;
            break;

          case 'facilities_multiplier':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilit${facilities === 1 ? 'y' : 'ies'} × ${multiplier} Sets per Facility`;
            break;

          case 'events_rate':
            calculatedAmount = events * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × Rate`;
            break;

          case 'events_rate_dual':
            calculatedAmount = events * multiplier * (unitRate + secUnitRate);
            basisText = `${events} Event${events === 1 ? '' : 's'} × (Banner ${rates.currency || 'INR'} ${Utils.formatNumber(unitRate)} + Backdrop ${rates.currency || 'INR'} ${Utils.formatNumber(secUnitRate)})`;
            break;

          case 'events_days_hall_catering':
            calculatedAmount = (events * days * unitRate) + (events * days * participants * secUnitRate);
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${days} Days × (Hall ${rates.currency || 'INR'} ${Utils.formatNumber(unitRate)} + ${participants} Trainees Catering ${rates.currency || 'INR'} ${Utils.formatNumber(secUnitRate)})`;
            break;

          case 'events_days_hall':
            calculatedAmount = events * days * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${days} Days × Hall Rate`;
            break;

          case 'events_days_participants':
            calculatedAmount = events * days * participants * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${days} Days × ${participants} Trainees Catering`;
            break;

          case 'events_days_honorarium':
            calculatedAmount = events * days * multiplier * unitRate;
            basisText = `${events} Event${events === 1 ? '' : 's'} × ${days} Days × Honorarium`;
            break;

          case 'participants_rate':
            calculatedAmount = participants * multiplier * unitRate;
            basisText = `${participants} Trainees × Rate`;
            break;

          case 'facilities_pc_cab':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × PC Cab Rate`;
            break;

          case 'facilities_pc_food':
            calculatedAmount = facilities * multiplier * unitRate;
            basisText = `${facilities} Facilities × PC Food Rate`;
            break;

          case 'fixed_amount':
          default:
            calculatedAmount = multiplier * unitRate;
            basisText = `Flat Rate × ${multiplier}`;
            break;
        }
      }

      // Determine if checked (default = true)
      const isSelected = (lineSelectionMap[item.id] !== undefined)
        ? lineSelectionMap[item.id]
        : (item.defaultActive !== false);

      const activeLedgerCode = item.ledgerCode || '93101';
      const glInfo = Utils.getGlInfo(activeLedgerCode);

      calculatedLines.push({
        id: item.id,
        description: item.description,
        ledgerCode: activeLedgerCode,
        parentAccount: item.parentAccount || glInfo.parent,
        glDescription: glInfo.desc,
        rateField: item.rateField,
        formulaType: item.formulaType,
        basis: basisText,
        unitRate: unitRate,
        amount: calculatedAmount,
        isSelected: isSelected,
        isCustom: false
      });
    });

    // Render HTML rows
    let grandTotal = 0;
    let html = '';
    const currency = this._entity?.currency || 'INR';
    const convRate = (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._conversionRates?.[currency]) || 83.5;

    calculatedLines.forEach(l => {
      if (l.isSelected) {
        grandTotal += l.amount;
      }
      const usdEquiv = Utils.convertToUSD(l.isSelected ? l.amount : 0, convRate);
      const isMuted = !l.isSelected;
      const glInfo = Utils.getGlInfo(l.ledgerCode);

      html += `
        <tr class="auto-cost-row ${isMuted ? 'text-muted' : ''}" data-line-id="${l.id}" data-line-desc="${l.description}" data-gl-code="${l.ledgerCode}" data-parent-acc="${l.parentAccount || glInfo.parent}" data-basis="${l.basis}" data-rate="${l.unitRate}" data-amount="${l.amount}" data-formula="${l.formulaType}" style="${isMuted ? 'opacity: 0.45; background: rgba(0,0,0,0.1);' : ''}">
          <td style="text-align: center;">
            <input type="checkbox" class="line-item-toggle-cb" data-line-id="${l.id}" ${l.isSelected ? 'checked' : ''} onchange="ImpTotModule.updateLineItemSelectionLive()" title="Toggle this cost line in calculation" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary);">
          </td>
          <td style="text-align: left; font-weight: 600; color: ${isMuted ? 'var(--text-tertiary)' : 'var(--text-primary)'};">
            ${l.description}
          </td>
          <td style="text-align: left;">
            <div class="font-bold" style="font-size: 11.5px; color: ${isMuted ? 'var(--text-tertiary)' : 'var(--text-primary)'};">
              ${glInfo.desc}
            </div>
            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 4px;">
              <code style="font-size: 9.5px; font-weight: 600; padding: 1px 4px; border-radius: 3px; background: rgba(99, 102, 241, 0.08); color: var(--accent-primary);">${l.ledgerCode}</code>
              <span>&bull; ${l.parentAccount || glInfo.parent}</span>
            </div>
          </td>
          <td style="text-align: left; color: var(--text-secondary); font-size: 11px;">
            ${l.basis}
          </td>
          <td class="num font-mono">
            ${Utils.formatNumber(l.unitRate)}
          </td>
          <td class="num font-bold font-mono" style="color: ${isMuted ? 'var(--text-tertiary)' : 'var(--accent-primary)'}; font-size: 13px;">
            ${l.isSelected ? Utils.formatCurrency(l.amount, currency) : '<span style="font-size: 11px; text-decoration: line-through;">' + Utils.formatCurrency(l.amount, currency) + '</span> (Excluded)'}
          </td>
          <td class="num font-mono" style="color: var(--text-secondary); font-size: 11px;">
            ≈ ${Utils.formatCurrency(usdEquiv, 'USD')}
          </td>
          <td style="text-align: center;">
            <span class="badge ${l.isSelected ? 'badge-cyan' : 'badge-secondary'}" style="font-size: 10px;">
              ${l.isSelected ? 'Template' : 'Deselected'}
            </span>
          </td>
        </tr>
      `;
    });

    // Render Custom Rows
    customLines.forEach((cl, idx) => {
      const isSelected = cl.isSelected !== false;
      const clAmt = Utils.parseNumber(cl.amount) || 0;
      if (isSelected) {
        grandTotal += clAmt;
      }
      const clUsd = Utils.convertToUSD(isSelected ? clAmt : 0, convRate);

      html += `
        <tr class="custom-row" id="customRow_${idx}" style="background: rgba(99, 102, 241, 0.04); ${!isSelected ? 'opacity: 0.45;' : ''}">
          <td style="text-align: center;">
            <input type="checkbox" class="line-item-toggle-cb custom-toggle-cb" ${isSelected ? 'checked' : ''} onchange="ImpTotModule.updateLineItemSelectionLive()" title="Toggle custom cost line" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary);">
          </td>
          <td style="text-align: left;">
            <input type="text" class="form-input custom-desc-input" value="${cl.description || ''}" placeholder="Enter custom cost item..." style="font-size: 12px; font-weight: 600;">
          </td>
          <td style="text-align: left;">
            <select class="form-select custom-gl-select font-bold" style="font-size: 11px; padding: 4px 6px; width: 100%; max-width: 250px;" title="Select GL Line Item Description (Parent Account)">
              ${this.getGlSelectOptions(cl.glCode || '93201')}
            </select>
          </td>
          <td style="text-align: left;">
            <input type="text" class="form-input custom-basis-input" value="${cl.basis || ''}" placeholder="Quantity / Calculation remarks" style="font-size: 11px;">
          </td>
          <td class="num font-mono">
            <span class="text-tertiary" style="font-size: 11px;">Manual</span>
          </td>
          <td class="num">
            <input type="number" class="form-input custom-amount-input font-bold font-mono" value="${cl.amount || 0}" style="text-align: right; color: var(--accent-secondary); width: 120px; display: inline-block;" oninput="ImpTotModule.updateCustomAmountLive()">
          </td>
          <td class="num font-mono custom-usd-cell" style="color: var(--text-secondary); font-size: 11px;">
            ≈ ${Utils.formatCurrency(clUsd, 'USD')}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); ImpTotModule.updateCustomAmountLive();" title="Remove custom line" style="padding: 2px 6px;">🗑️</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    const totalEl = document.getElementById('modalGrandTotalDisplay');
    if (totalEl) {
      totalEl.textContent = Utils.formatCurrency(grandTotal, currency);
    }
    const totalUsdEl = document.getElementById('modalGrandTotalUsdDisplay');
    if (totalUsdEl) {
      totalUsdEl.textContent = `(≈ ${Utils.formatCurrency(Utils.convertToUSD(grandTotal, convRate), 'USD')})`;
    }
  },

  // Toggle all checkboxes in the wizard (Select All / Deselect All)
  toggleAllLineCheckboxes(shouldSelect) {
    const tbody = document.getElementById('modalCostItemsBody');
    if (!tbody) return;
    tbody.querySelectorAll('.line-item-toggle-cb').forEach(cb => {
      cb.checked = shouldSelect;
    });
    this.updateLineItemSelectionLive();
  },

  // Live recalculation when checkboxes are toggled
  updateLineItemSelectionLive() {
    const tbody = document.getElementById('modalCostItemsBody');
    if (!tbody) return;

    const currency = this._entity?.currency || 'INR';
    const convRate = (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._conversionRates?.[currency]) || 83.5;

    let grandTotal = 0;

    // Update auto rows styling and sum
    tbody.querySelectorAll('tr.auto-cost-row').forEach(row => {
      const cb = row.querySelector('.line-item-toggle-cb');
      const isChecked = cb ? cb.checked : true;
      const amt = Utils.parseNumber(row.dataset.amount) || 0;

      row.classList.toggle('text-muted', !isChecked);
      row.style.opacity = isChecked ? '1' : '0.45';
      row.style.background = isChecked ? '' : 'rgba(0,0,0,0.1)';

      const badge = row.querySelector('.badge');
      if (badge) {
        badge.className = `badge ${isChecked ? 'badge-cyan' : 'badge-secondary'}`;
        badge.textContent = isChecked ? 'Template' : 'Deselected';
      }

      const amtCell = row.cells[5];
      if (amtCell) {
        amtCell.innerHTML = isChecked 
          ? Utils.formatCurrency(amt, currency)
          : `<span style="font-size: 11px; text-decoration: line-through;">${Utils.formatCurrency(amt, currency)}</span> (Excluded)`;
      }

      const usdCell = row.cells[6];
      if (usdCell) {
        usdCell.textContent = `≈ ${Utils.formatCurrency(Utils.convertToUSD(isChecked ? amt : 0, convRate), 'USD')}`;
      }

      if (isChecked) {
        grandTotal += amt;
      }
    });

    // Update custom rows
    tbody.querySelectorAll('tr.custom-row').forEach(row => {
      const cb = row.querySelector('.custom-toggle-cb');
      const isChecked = cb ? cb.checked : true;
      const amtInput = row.querySelector('.custom-amount-input');
      const usdCell = row.querySelector('.custom-usd-cell');
      const amt = Utils.parseNumber(amtInput?.value) || 0;

      row.style.opacity = isChecked ? '1' : '0.45';

      if (usdCell) {
        usdCell.textContent = `≈ ${Utils.formatCurrency(Utils.convertToUSD(isChecked ? amt : 0, convRate), 'USD')}`;
      }

      if (isChecked) {
        grandTotal += amt;
      }
    });

    const totalEl = document.getElementById('modalGrandTotalDisplay');
    if (totalEl) totalEl.textContent = Utils.formatCurrency(grandTotal, currency);

    const totalUsdEl = document.getElementById('modalGrandTotalUsdDisplay');
    if (totalUsdEl) totalUsdEl.textContent = `(≈ ${Utils.formatCurrency(Utils.convertToUSD(grandTotal, convRate), 'USD')})`;
  },

  addCustomCostLineInModal() {
    const tbody = document.getElementById('modalCostItemsBody');
    if (!tbody) return;

    const currency = this._entity?.currency || 'INR';
    const convRate = (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._conversionRates?.[currency]) || 83.5;

    const tr = document.createElement('tr');
    tr.className = 'custom-row';
    tr.style.background = 'rgba(99, 102, 241, 0.04)';
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="line-item-toggle-cb custom-toggle-cb" checked onchange="ImpTotModule.updateLineItemSelectionLive()" title="Toggle custom cost line" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary);">
      </td>
      <td style="text-align: left;">
        <input type="text" class="form-input custom-desc-input" placeholder="Enter custom cost item (e.g. Doctor Honorarium, Simulation Props)..." style="font-size: 12px; font-weight: 600;">
      </td>
      <td style="text-align: left;">
        <select class="form-select custom-gl-select font-bold" style="font-size: 11px; padding: 4px 6px; width: 100%; max-width: 250px;" title="Select GL Line Item Description (Parent Account)">
          ${this.getGlSelectOptions('93701')}
        </select>
      </td>
      <td style="text-align: left;">
        <input type="text" class="form-input custom-basis-input" placeholder="Quantity / Calculation remarks" style="font-size: 11px;">
      </td>
      <td class="num font-mono">
        <span class="text-tertiary" style="font-size: 11px;">Manual</span>
      </td>
      <td class="num">
        <input type="number" class="form-input custom-amount-input font-bold font-mono" value="0" style="text-align: right; color: var(--accent-secondary); width: 120px; display: inline-block;" oninput="ImpTotModule.updateCustomAmountLive()">
      </td>
      <td class="num font-mono custom-usd-cell" style="color: var(--text-secondary); font-size: 11px;">
        ≈ $0.00
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); ImpTotModule.updateCustomAmountLive();" title="Remove custom line" style="padding: 2px 6px;">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  },

  updateCustomAmountLive() {
    this.updateLineItemSelectionLive();
  },

  // Save Event from Modal to DB and sync with NonPayroll and TotalCost
  async saveEventFromModal(compKey, editEventId = null) {
    try {
      const comp = this.components[compKey] || this.components['bundled-tot'];
      const monthIdx = parseInt(document.getElementById('impMonthSelect')?.value, 10) || 0;
      const location = document.getElementById('impLocationSelect')?.value || 'India KA';
      const conditionArea = document.getElementById('impConditionSelect')?.value || 'Maternal & Newborn Care';
      const activity = document.getElementById('impActivitySelect')?.value || comp.defaultActivity;
      const donor = document.getElementById('impDonorSelect')?.value || 'Gates Foundation';
      const employeeName = document.getElementById('impEmployeeSelect')?.value || '';
      const details = document.getElementById('impDetailsInput')?.value || '';

      const events = parseInt(document.getElementById('scaleEvents')?.value, 10) || 1;
      const days = parseInt(document.getElementById('scaleDays')?.value, 10) || 1;
      const facilities = parseInt(document.getElementById('scaleFacilities')?.value, 10) || 0;
      const participants = parseInt(document.getElementById('scaleParticipants')?.value, 10) || 0;
      const teamSize = parseInt(document.getElementById('scaleTeamSize')?.value, 10) || 1;
      const toolPkg = document.getElementById('scaleToolPkg')?.value || 'Tool Package - 1 (Standard)';

      const entity = this._entity || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) || (await db.getAll(STORES.entities))[0] || SEED_DATA.entities[0];
      const dept = this._dept || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._dept) || (await db.getAll(STORES.departments))[0] || SEED_DATA.departments[0];
      const yearId = this._yearId || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._yearId) || App.selectedYear || '2026';
      const budgetYear = this._budgetYear || (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._budgetYear) || 2026;

      const costLines = [];
      let grandTotal = 0;

      // Collect auto lines with isSelected checkbox status and configured template GL
      document.querySelectorAll('#modalCostItemsBody tr.auto-cost-row').forEach(r => {
        const cb = r.querySelector('.line-item-toggle-cb');
        const isSelected = cb ? cb.checked : true;
        const amt = Utils.parseNumber(r.dataset.amount) || 0;
        const selectedGl = r.dataset.glCode || '93101';
        const glInfo = Utils.getGlInfo(selectedGl);
        
        if (isSelected) {
          grandTotal += amt;
        }

        costLines.push({
          id: r.dataset.lineId,
          isCustom: false,
          isSelected: isSelected,
          description: r.dataset.lineDesc,
          ledgerCode: selectedGl,
          parentAccount: glInfo.parent || r.dataset.parentAcc || 'Direct Cost',
          glDescription: glInfo.desc,
          basis: r.dataset.basis,
          unitRate: Utils.parseNumber(r.dataset.rate) || 0,
          amount: isSelected ? amt : 0,
          originalCalculatedAmount: amt
        });
      });

      // Collect custom lines with isSelected checkbox status
      const customLines = [];
      document.querySelectorAll('#modalCostItemsBody tr.custom-row').forEach(r => {
        const cb = r.querySelector('.custom-toggle-cb');
        const isSelected = cb ? cb.checked : true;
        const desc = r.querySelector('.custom-desc-input')?.value || 'Custom Expense';
        const glCode = r.querySelector('.custom-gl-select')?.value || '93201';
        const glInfo = Utils.getGlInfo(glCode);
        const basis = r.querySelector('.custom-basis-input')?.value || 'Manual addition';
        const amt = Utils.parseNumber(r.querySelector('.custom-amount-input')?.value) || 0;
        
        if (isSelected) {
          grandTotal += amt;
        }

        const customItem = {
          isCustom: true,
          isSelected: isSelected,
          description: desc,
          ledgerCode: glCode,
          parentAccount: glInfo.parent || 'Supplies & Printing Costs',
          glDescription: glInfo.desc,
          basis: basis,
          unitRate: 0,
          amount: isSelected ? amt : 0,
          originalCalculatedAmount: amt
        };
        costLines.push(customItem);
        customLines.push(customItem);
      });

      const eventObj = {
        yearId: String(yearId),
        entityId: entity.id,
        deptId: dept.id,
        componentId: comp.id,
        monthIdx: monthIdx,
        location: location,
        conditionArea: conditionArea,
        activity: activity,
        donor: donor,
        employeeName: employeeName,
        details: details,
        scaleSummary: `${events} Event${events === 1 ? '' : 's'} &bull; ${days} Day${days === 1 ? '' : 's'} &bull; ${facilities} Facs &bull; ${participants} Trainees &bull; ${teamSize} Staff`,
        scale: {
          eventCount: events,
          daysCount: days,
          facilitiesCount: facilities,
          participantsCount: participants,
          teamSize: teamSize,
          toolPackage: toolPkg
        },
        costLines: costLines,
        customLines: customLines,
        totalCost: grandTotal
      };

      if (editEventId && editEventId !== 'null' && editEventId !== 'undefined') {
        eventObj.id = editEventId;
      }

      const savedId = await db.saveImpTotEvent(eventObj);
      eventObj.id = (editEventId && editEventId !== 'null' && editEventId !== 'undefined') ? editEventId : savedId;

      // Sync to nonPayrollCost store
      await this.syncEventToNonPayroll(eventObj);

      // Close modal
      document.getElementById('impEventModalOverlay')?.remove();

      Utils.showToast(`🎯 Training Package "${comp.title}" saved successfully!`, 'success');

      // Re-render UI and ensure the saved event is immediately displayed
      this.activeMonthFilter = 'all'; // Show all months so newly saved event is immediately in view
      if (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) {
        if (BudgetEntryModule.activeTab === 'other-costs') {
          BudgetEntryModule.activeOtherCostSubTab = 'tot';
        }
        await BudgetEntryModule.renderGrid(entity, dept, budgetYear, BudgetEntryModule._actualsMonth || 'Oct');
      } else if (this._container) {
        await this.render(this._container, yearId, entity, dept, budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
      }
    } catch (err) {
      console.error('Error saving Training Package event:', err);
      Utils.showToast('Error saving training package: ' + err.message, 'danger');
    }
  },

  // Synchronize ToT Event costs into nonPayrollCost so they automatically flow into Other Costs & Total Dept Cost
  async syncEventToNonPayroll(eventObj) {
    const allNonPayroll = await db.getBudgetData(STORES.nonPayrollCost, eventObj.yearId, eventObj.entityId, eventObj.deptId);
    // Remove existing linked records for this event
    const existingLinked = allNonPayroll.filter(r => r.impTotEventId === eventObj.id);
    for (const r of existingLinked) {
      await db.delete(STORES.nonPayrollCost, r.id);
    }

    // Group cost lines by GL Account / Parent Account
    const coaGroups = {};
    (eventObj.costLines || []).forEach(line => {
      // Exclude deselected / excluded items or 0-amount lines
      if (line.isSelected === false || !line.amount || line.amount <= 0) return;

      const code = line.ledgerCode || '93201';
      if (!coaGroups[code]) {
        coaGroups[code] = {
          ledgerCode: code,
          parentAccount: line.parentAccount || 'Other Costs',
          glDescription: line.description.replace(/^[^\s]+\s/, ''), // Remove leading emoji
          totalAmount: 0,
          remarks: []
        };
      }
      coaGroups[code].totalAmount += line.amount;
      coaGroups[code].remarks.push(`${line.description}: ${Utils.formatCurrency(line.amount, 'INR')}`);
    });

    // Create nonPayrollCost row for each GL code with amount in the scheduled month
    for (const code of Object.keys(coaGroups)) {
      const g = coaGroups[code];
      const monthlyValues = {};
      monthlyValues[eventObj.monthIdx] = g.totalAmount;

      const nonPayrollItem = {
        yearId: eventObj.yearId,
        entityId: eventObj.entityId,
        deptId: eventObj.deptId,
        parentAccount: g.parentAccount,
        glDescription: g.glDescription,
        ledgerCode: g.ledgerCode,
        itemName: `${eventObj.activity} — ${eventObj.details || eventObj.location}`,
        employeeName: eventObj.employeeName || 'Implementation Team',
        activity: eventObj.activity,
        location: eventObj.location,
        donor: eventObj.donor,
        conditionArea: eventObj.conditionArea,
        remarks: `[IMP ToT ${SEED_DATA.months[eventObj.monthIdx]}] ${eventObj.scaleSummary} (${g.remarks.join(', ')})`,
        monthlyValues: monthlyValues,
        totalCY: g.totalAmount,
        isImpTot: true,
        impTotEventId: eventObj.id
      };

      await db.add(STORES.nonPayrollCost, nonPayrollItem);
    }
  },

  async duplicateEvent(eventId) {
    const existing = await db.get(STORES.impTotEvents, eventId);
    if (!existing) return;

    const copy = { ...existing };
    delete copy.id;
    copy.monthIdx = (copy.monthIdx + 1) % 12; // Next month
    copy.details = `${copy.details || ''} (Copy)`.trim();

    const newId = await db.saveImpTotEvent(copy);
    copy.id = newId;
    await this.syncEventToNonPayroll(copy);

    Utils.showToast(`📋 Duplicated to ${SEED_DATA.months[copy.monthIdx]}-${this._budgetYear}!`, 'info');
    if (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) {
      const grid = document.getElementById('gridContainer') || BudgetEntryModule._container;
      if (grid) {
        await BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth || 'Oct');
      }
    } else if (this._container) {
      await this.render(this._container, this._yearId, this._entity, this._dept, this._budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
    }
  },

  async deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this training event? It will also remove the linked budget lines from Other Costs.')) {
      return;
    }

    // Delete linked nonPayroll rows
    const allNonPayroll = await db.getBudgetData(STORES.nonPayrollCost, this._yearId, this._entity.id, this._dept.id);
    const existingLinked = allNonPayroll.filter(r => r.impTotEventId === eventId);
    for (const r of existingLinked) {
      await db.delete(STORES.nonPayrollCost, r.id);
    }

    await db.deleteImpTotEvent(eventId);
    Utils.showToast('🗑️ Training event deleted.', 'info');
    if (typeof BudgetEntryModule !== 'undefined' && BudgetEntryModule._entity) {
      const grid = document.getElementById('gridContainer') || BudgetEntryModule._container;
      if (grid) {
        await BudgetEntryModule.renderGrid(BudgetEntryModule._entity, BudgetEntryModule._dept, BudgetEntryModule._budgetYear, BudgetEntryModule._actualsMonth || 'Oct');
      }
    } else if (this._container) {
      await this.render(this._container, this._yearId, this._entity, this._dept, this._budgetYear, this._locations, this._donors, this._activities, this._conditionAreas);
    }
  }
};

window.ImpTotModule = ImpTotModule;
