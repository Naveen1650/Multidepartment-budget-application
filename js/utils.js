// ============================================================
// NOORA HEALTH BUDGET APP — Utility Functions
// Currency formatting, calculations, and helpers
// ============================================================

const Utils = {

  // ─── Currency Formatting ───

  formatCurrency(value, currency = 'INR', showSymbol = true) {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';

    const symbols = { USD: '$', INR: '₹', BDT: '৳', IDR: 'Rp', NPR: 'रू' };
    const symbol = showSymbol ? (symbols[currency] || currency + ' ') : '';

    // Indian number formatting for INR
    if (currency === 'INR' || currency === 'NPR') {
      return symbol + this.formatIndianNumber(num);
    }

    return symbol + num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  },

  formatIndianNumber(num) {
    if (num === 0) return '0';
    const isNegative = num < 0;
    num = Math.abs(Math.round(num));
    const str = num.toString();
    
    if (str.length <= 3) return (isNegative ? '-' : '') + str;
    
    let result = str.slice(-3);
    let remaining = str.slice(0, -3);
    
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    
    if (remaining.length > 0) {
      result = remaining + ',' + result;
    }
    
    return (isNegative ? '-' : '') + result;
  },

  getGlInfo(code) {
    if (!code) return { code: '', desc: 'Direct Expense', parent: 'Operating Expenses', label: 'Direct Expense' };
    const c = String(code).trim();
    const map = {
      '93101': { desc: 'Hotel Accommodation', parent: 'Travel & Lodging Expenses' },
      '93102': { desc: 'Food Expenses', parent: 'Travel & Lodging Expenses' },
      '93103': { desc: 'Air fare', parent: 'Travel & Lodging Expenses' },
      '93104': { desc: 'Cab/Auto', parent: 'Travel & Lodging Expenses' },
      '93105': { desc: 'Bus/Train', parent: 'Travel & Lodging Expenses' },
      '93106': { desc: 'Other incidental travel costs', parent: 'Travel & Lodging Expenses' },
      '93201': { desc: 'Other Direct Expenses', parent: 'Supplies & Printing Costs' },
      '93204': { desc: 'Printing expenses', parent: 'Supplies & Printing Costs' },
      '93301': { desc: 'Internet Expenses', parent: 'Communication Cost' },
      '93302': { desc: 'Postage & Courier Expenses', parent: 'Communication Cost' },
      '93303': { desc: 'Telecommunication expenses', parent: 'Communication Cost' },
      '93401': { desc: 'Software and Subscriptions', parent: 'Office Expenses' },
      '93404': { desc: 'Stationery & Consumables', parent: 'Office Expenses' },
      '93405': { desc: 'Office Equipment Expense', parent: 'Office Expenses' },
      '93701': { desc: 'Professional Charges', parent: 'Professional & Consultancy Charges' },
      '93703': { desc: 'Admin Consultants', parent: 'Professional & Consultancy Charges' },
      '11301': { desc: 'Laptop / Printer', parent: 'Fixed Assets' }
    };
    if (map[c]) {
      return {
        code: c,
        desc: map[c].desc,
        parent: map[c].parent,
        label: `${map[c].desc} (${map[c].parent})`
      };
    }
    return {
      code: c,
      desc: `GL Line ${c}`,
      parent: 'Direct Cost',
      label: `GL Line ${c}`
    };
  },

  escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeJs(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  },

  formatNumber(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
  },

  parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\r\n|\n|\r/);
    const result = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const row = [];
      let inQuotes = false;
      let field = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(field.trim());
          field = '';
        } else {
          field += char;
        }
      }
      row.push(field.trim());
      result.push(row);
    }
    return result;
  },

  // ─── Date Helpers ───

  getCurrentYear() {
    return new Date().getFullYear();
  },

  getMonthName(index, short = true) {
    const months = short
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[index] || '';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = this.getMonthName(d.getMonth(), true);
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  },

  // ─── Calculations ───

  sumArray(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    return arr.reduce((sum, val) => sum + (this.parseNumber(val) || 0), 0);
  },

  sumMonthlyValues(monthlyValues) {
    if (!monthlyValues) return 0;
    return Object.values(monthlyValues).reduce((sum, val) => sum + (this.parseNumber(val) || 0), 0);
  },

  calculateIncrement(currentCTC, incrementPct) {
    const ctc = this.parseNumber(currentCTC);
    const pct = this.parseNumber(incrementPct);
    return Math.round(ctc * (pct / 100));
  },

  convertToUSD(amount, rate) {
    if (!rate || rate === 0) return amount;
    return Math.round(amount / rate);
  },

  formatDualCurrency(localAmount, currency = 'INR', rate = 1.0, options = {}) {
    const num = this.parseNumber(localAmount);
    const localFormatted = this.formatCurrency(num, currency);
    if (!currency || currency === 'USD' || !rate || rate === 1.0) {
      return localFormatted;
    }
    const usdAmount = this.convertToUSD(num, rate);
    const usdFormatted = this.formatCurrency(usdAmount, 'USD');
    
    if (options.multiline) {
      return `<div class="dual-curr"><span class="curr-local">${localFormatted}</span><br><span class="curr-usd text-tertiary" style="font-size: 0.85em; font-weight: 500;">≈ ${usdFormatted}</span></div>`;
    }
    if (options.badge) {
      return `${localFormatted} <span class="badge badge-cyan" style="font-size: 0.78em; margin-left: 4px; padding: 2px 6px;">≈ ${usdFormatted}</span>`;
    }
    return `${localFormatted} (≈ ${usdFormatted})`;
  },

  // ─── ID Generation ───

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  // ─── DOM Helpers ───

  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else if (key === 'dataset') Object.entries(val).forEach(([k, v]) => el.dataset[k] = v);
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  },

  // ─── Toast Notifications ───

  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = this.createElement('div', { className: 'toast-container' });
      document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };

    const toast = this.createElement('div', { className: `toast ${type}` }, [
      this.createElement('span', { textContent: icons[type] || 'ℹ' }),
      this.createElement('span', { className: 'toast-message', textContent: message }),
      this.createElement('button', {
        className: 'toast-close',
        textContent: '×',
        onClick: () => toast.remove()
      })
    ]);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ─── Modal Helpers ───

  showModal(title, content, options = {}, sizeParam = '') {
    let buttons = null;
    let sizeClass = '';
    let footerOption = null;

    if (Array.isArray(options)) {
      buttons = options;
      if (sizeParam) {
        sizeClass = sizeParam.startsWith('modal-') ? sizeParam : `modal-${sizeParam}`;
      }
    } else if (typeof options === 'object' && options !== null) {
      if (options.size) {
        sizeClass = options.size.startsWith('modal-') ? options.size : `modal-${options.size}`;
      }
      footerOption = options.footer;
    } else if (typeof options === 'string') {
      sizeClass = options.startsWith('modal-') ? options : `modal-${options}`;
    }

    // Dynamic stacking z-index for nested modals
    const existingOverlays = document.querySelectorAll('.modal-overlay');
    const zIndex = 1000 + (existingOverlays.length * 20);

    const overlay = this.createElement('div', { className: 'modal-overlay active' });
    overlay.style.zIndex = zIndex;

    const modal = this.createElement('div', { className: `modal ${sizeClass}`.trim() }, [
      this.createElement('div', { className: 'modal-header' }, [
        this.createElement('h3', { textContent: title }),
        this.createElement('button', {
          className: 'modal-close',
          textContent: '×',
          onClick: () => overlay.remove()
        })
      ]),
      this.createElement('div', { className: 'modal-body' })
    ]);

    if (options && typeof options === 'object' && !Array.isArray(options)) {
      if (options.modalWidth) {
        modal.style.width = options.modalWidth;
        modal.style.maxWidth = options.modalWidth;
      }
      if (options.modalHeight) {
        modal.style.height = options.modalHeight;
        modal.style.maxHeight = options.modalHeight;
      }
    }

    const body = modal.querySelector('.modal-body');
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }

    if (buttons && buttons.length > 0) {
      const footer = this.createElement('div', { className: 'modal-footer' });
      buttons.forEach(b => {
        const btn = this.createElement('button', {
          className: `btn ${b.class || b.className || 'btn-secondary'}`,
          textContent: b.label || b.text || 'Button'
        });
        if (b.onclick || b.onClick) {
          btn.addEventListener('click', (e) => {
            const handler = b.onclick || b.onClick;
            handler(e, () => overlay.remove());
          });
        }
        footer.appendChild(btn);
      });
      modal.appendChild(footer);
    } else if (footerOption) {
      const footer = this.createElement('div', { className: 'modal-footer' });
      if (typeof footerOption === 'function') {
        footerOption(footer, () => overlay.remove());
      } else {
        footer.innerHTML = footerOption;
      }
      modal.appendChild(footer);
    }

    // Escape key listener to close only topmost overlay
    const escListener = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        const overlays = document.querySelectorAll('.modal-overlay');
        if (overlays.length > 0 && overlays[overlays.length - 1] === overlay) {
          overlay.remove();
        }
      }
    };
    document.addEventListener('keydown', escListener);

    const origRemove = overlay.remove.bind(overlay);
    overlay.remove = function() {
      document.removeEventListener('keydown', escListener);
      origRemove();
    };

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    return overlay;
  },

  closeModal(all = false) {
    const overlays = document.querySelectorAll('.modal-overlay.active, .modal-overlay');
    if (overlays.length === 0) return;
    if (all) {
      overlays.forEach(o => o.remove());
    } else {
      // Remove only the topmost active modal
      overlays[overlays.length - 1].remove();
    }
  },

  // ─── Confirm Dialog ───

  async confirm(message, title = 'Confirm') {
    return new Promise(resolve => {
      const content = this.createElement('p', { textContent: message });
      const modal = this.showModal(title, content, {
        footer: (footer, close) => {
          footer.appendChild(this.createElement('button', {
            className: 'btn btn-ghost',
            textContent: 'Cancel',
            onClick: () => { close(); resolve(false); }
          }));
          footer.appendChild(this.createElement('button', {
            className: 'btn btn-danger',
            textContent: 'Confirm',
            onClick: () => { close(); resolve(true); }
          }));
        }
      });
    });
  },

  // ─── Debounce ───

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ─── Department Name with Prefix ───

  getDeptName(dept, prefix) {
    if (!dept) return '';
    if (dept.scope === 'gl' || dept.scope === 'dp-gp' || dept.scope === 'general') {
      const num = dept.number ? `${dept.number}. ` : '';
      return `${num}${dept.codeTemplate}`;
    }
    const code = dept.codeTemplate.replace('{CC}', prefix);
    const num = dept.number ? `${dept.number}. ` : '';
    return `${num}${code}`;
  },

  getDeptShortCode(dept, prefix = 'IN') {
    if (!dept) return '';
    let p = typeof prefix === 'string' ? prefix : (prefix?.deptPrefix || 'IN');
    if (!p || p === 'all') p = 'IN';
    if (dept.codeTemplate) {
      return dept.codeTemplate.replace('{CC}', p);
    }
    if (dept.id) return dept.id.toUpperCase();
    return String(dept);
  },

  // ─── Department Grouping & Sorting ───
  // Tier Order: 1. Country specific, 2. DP-CP, 3. DP-GP, 4. GL, 5. General / others
  // Inside Country/DP-CP/DP-GP: PDD -> PD -> M&E -> OPS -> RMM -> others
  // Inside GL: I&L -> C&I -> OPS -> RMM -> others
  getDepartmentSortRank(dept) {
    if (!dept) return 99999;
    const scope = (dept.scope || '').toLowerCase();
    const code = (dept.codeTemplate || dept.id || '').toUpperCase();
    const name = (dept.name || '').toUpperCase();
    const id = (dept.id || '').toLowerCase();

    // 1. Tier Rank
    let tierScore = 5000;
    if (scope === 'country') tierScore = 1000;
    else if (scope === 'dp-cp') tierScore = 2000;
    else if (scope === 'dp-gp') tierScore = 3000;
    else if (scope === 'gl') tierScore = 4000;
    else tierScore = 5000;

    // 2. Group Rank inside Tier
    let groupScore = 900;
    if (scope === 'gl') {
      // GL Grouping: I&L, C&I, OPS, RMM, others
      if (code.includes('I&L') || id.includes('learn') || id.includes('hcw') || id.includes('niab') || name.includes('KNOWLEDGE') || name.includes('BOX')) {
        groupScore = 100; // I&L
      } else if (code.includes('C&I') || id.includes('labs') || id.includes('res-eval') || id.includes('comms-brand') || name.includes('CAREGIVING') || name.includes('COMMUNICATIONS')) {
        groupScore = 200; // C&I
      } else if (code.includes('OPS') || id.includes('gl-ops') || name.includes('GLOBAL SUPPORT')) {
        groupScore = 300; // OPS
      } else if (code.includes('RMM') || id === 'gl-rmm') {
        groupScore = 400; // RMM
      } else {
        groupScore = 500; // others (e.g. Strategic Global Development)
      }
    } else {
      // Country, DP-CP, DP-GP, and others: PDD, PD, M&E, OPS, RMM, others
      if (code.includes('PDD') || id.startsWith('pdd') || name.includes('FRAMEWORK') || name.includes('TOOL DEV') || name.includes('NEEDS FINDING')) {
        groupScore = 100; // PDD
      } else if (code.includes('PDEL') || code.includes('PD-') || id.startsWith('pdel') || name.includes('TRAINING') || name.includes('IMPLEMENTATION') || name.includes('PARTNER')) {
        groupScore = 200; // PD
      } else if (code.includes('M&E') || code.includes('ME-') || id.startsWith('me-') || name.includes('MONITORING') || name.includes('EVALUATION') || name.includes('RESEARCH')) {
        groupScore = 300; // M&E
      } else if (code.includes('OPS') || id.startsWith('ops') || name.includes('COUNTRY SUPPORT') || name.includes('FUNDRAISING') || code.includes('ADMIN') || code.includes('FIN') || code.includes('P&C') || code.includes('FR')) {
        groupScore = 400; // OPS
      } else if (code.includes('RMM') || id === 'rmm') {
        groupScore = 500; // RMM
      } else {
        groupScore = 600; // others (e.g. DP-CP, DP-GP, General)
      }
    }

    const num = parseInt(dept.number) || 99;
    return tierScore + groupScore + (num * 0.01);
  },

  sortDepartments(departments) {
    if (!Array.isArray(departments)) return [];
    return [...departments].sort((a, b) => {
      const rankA = this.getDepartmentSortRank(a);
      const rankB = this.getDepartmentSortRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });
  },

  // ─── Excel Column Helpers ───

  monthColumns(year) {
    return Array.from({ length: 12 }, (_, i) => ({
      key: `m${i}`,
      label: `${this.getMonthName(i)}-${year}`,
      month: i
    }));
  },

  // ─── Mathematical Formula Evaluator for 5 Operating Variables ───
  FormulaEvaluator: {
    // Validates formula string syntax
    validate(expression) {
      if (!expression || typeof expression !== 'string' || !expression.trim()) {
        return { valid: false, error: 'Expression cannot be empty' };
      }
      const clean = expression.trim();
      if (!/^[a-zA-Z0-9_\s\+\-\*\/\%\(\)\.]+$/.test(clean)) {
        return { valid: false, error: 'Expression contains invalid characters' };
      }
      try {
        const dummyScope = { events: 1, days: 1, trainers: 1, trainees: 1, facilities: 1, rate: 1, multiplier: 1, secRate: 1 };
        this.evaluate(clean, dummyScope);
        return { valid: true };
      } catch (err) {
        return { valid: false, error: err.message };
      }
    },

    // Evaluates expression with scope { events, days, trainers, trainees, facilities, rate, multiplier, ... }
    evaluate(expression, scope = {}) {
      if (!expression || typeof expression !== 'string') return 0;
      let expr = expression.trim();
      if (!expr) return 0;

      // Normalize common synonyms
      const normalizedScope = {
        events: scope.events !== undefined ? Number(scope.events) : 1,
        days: scope.days !== undefined ? Number(scope.days) : 1,
        trainers: scope.trainers !== undefined ? Number(scope.trainers) : (scope.teamSize !== undefined ? Number(scope.teamSize) : 1),
        teamSize: scope.trainers !== undefined ? Number(scope.trainers) : (scope.teamSize !== undefined ? Number(scope.teamSize) : 1),
        trainees: scope.trainees !== undefined ? Number(scope.trainees) : (scope.participants !== undefined ? Number(scope.participants) : 1),
        participants: scope.trainees !== undefined ? Number(scope.trainees) : (scope.participants !== undefined ? Number(scope.participants) : 1),
        facilities: scope.facilities !== undefined ? Number(scope.facilities) : 1,
        rate: scope.rate !== undefined ? Number(scope.rate) : (scope.unitRate !== undefined ? Number(scope.unitRate) : 0),
        unitRate: scope.rate !== undefined ? Number(scope.rate) : (scope.unitRate !== undefined ? Number(scope.unitRate) : 0),
        multiplier: scope.multiplier !== undefined ? Number(scope.multiplier) : 1,
        secRate: scope.secRate !== undefined ? Number(scope.secRate) : (scope.secondaryRate !== undefined ? Number(scope.secondaryRate) : 0)
      };

      // Substitute variables with numbers using word boundaries
      const varKeys = Object.keys(normalizedScope).sort((a, b) => b.length - a.length);
      for (const key of varKeys) {
        const regex = new RegExp('\\b' + key + '\\b', 'gi');
        expr = expr.replace(regex, String(normalizedScope[key]));
      }

      // Check that only numbers, operators, and parentheses remain
      if (!/^[0-9\s\+\-\*\/\%\(\)\.]+$/.test(expr)) {
        throw new Error('Unresolved variable or invalid token in expression');
      }

      // Evaluate safely via Function without arbitrary scope access
      try {
        const fn = new Function(`'use strict'; return (${expr});`);
        const res = fn();
        return isNaN(res) || !isFinite(res) ? 0 : Math.round(res * 100) / 100;
      } catch (e) {
        throw new Error('Math evaluation error: ' + e.message);
      }
    }
  },

  // ─── AI Formula Drafter & Operating Variables Reasoner ───
  FormulaAI: {
    draftFormula(promptText) {
      if (!promptText || typeof promptText !== 'string') {
        return {
          expression: 'events * days * trainers * rate * multiplier',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          variablesUsed: ['events', 'days', 'trainers'],
          explanation: 'Standard Batch × Days × Trainers calculation',
          sampleMath: '1 Batch × 2 Days × 2 Trainers × ₹1,890 = ₹7,560'
        };
      }

      const p = promptText.toLowerCase().trim();

      // Extract explicit numbers / multipliers (e.g. "2 guest doctors", "3 sets", "10 kits", "18% tax", "3.5 per facility")
      let detectedMultiplier = 1;
      const numMatch = p.match(/(\d+(\.\d+)?)\s*(?:guest\s*|external\s*|master\s*|visiting\s*|additional\s*)?(doctors?|specialists?|sets?|kits?|models?|thalis?|dolls?|times?|per facility|per event|per day|rounds?|trips?|pairs?|units?|%|percent)/i);
      if (numMatch && numMatch[1]) {
        detectedMultiplier = parseFloat(numMatch[1]);
        if (p.includes('%') || p.includes('tax') || p.includes('percent')) {
          detectedMultiplier = 1 + (detectedMultiplier / 100);
        }
      } else {
        const directNum = p.match(/\b(\d+(\.\d+)?)\s+(?:guest\s*|external\s*|master\s*|visiting\s*)?(per|for each|each|doctors?|specialists?|trainers?|participants?|kits?|sets?)\b/i);
        if (directNum && directNum[1]) {
          detectedMultiplier = parseFloat(directNum[1]);
        }
      }

      // Detect operating variables from context
      const hasDays = /day|daily|duration|night|session|hour/i.test(p);
      const hasTrainers = /trainer|faculty|staff|team|master trainer|instructor/i.test(p);
      const hasTrainees = /trainee|participant|attendee|student|nurse|doctor|candidate|guest|member/i.test(p);
      const hasFacilities = /facilit|hospital|clinic|center|hub|location|site/i.test(p);
      const hasTransit = /flight|airfare|transit|ticket|bus|train|travel|trip|journey/i.test(p);
      const hasHall = /hall|venue|room|auditorium|rent|av|projector|space/i.test(p);
      const hasCatering = /food|meal|lunch|dinner|breakfast|snack|catering|refreshment|da|per diem/i.test(p);
      const hasHonorarium = /honorarium|doctor|specialist|consultant|expert|stipend|speaker/i.test(p);
      const hasCollateral = /kit|collateral|package|doll|thali|banner|backdrop|stationery|badge|certificate|print|manual/i.test(p);

      let formulaType = 'custom_expression';
      let expression = '';
      let variablesUsed = [];
      let explanation = '';

      // Pattern 1: Facility Multiplier / Kits (e.g. Dolls = 2/fac, Thalis = 3/fac, Kits per facility)
      if (hasFacilities && (hasCollateral || p.includes('kit') || p.includes('set') || p.includes('model') || p.includes('launch') || p.includes('package'))) {
        const mult = detectedMultiplier > 1 ? detectedMultiplier : (p.includes('thali') ? 3 : (p.includes('doll') ? 2 : 1));
        detectedMultiplier = mult;
        formulaType = mult > 1 ? 'facilities_multiplier' : 'facilities_rate';
        expression = mult > 1 ? `facilities * ${mult} * rate` : `facilities * rate * multiplier`;
        variablesUsed = ['facilities'];
        explanation = `Calculates cost for all targeted facilities (${mult > 1 ? mult + ' units per facility' : '1 package per facility'}).`;
      }
      // Pattern 2: Doctor / Specialist Honorarium (e.g. 2 doctors per day for each batch)
      else if (hasHonorarium || (p.includes('doctor') && !hasTrainees)) {
        const doctors = detectedMultiplier > 1 ? detectedMultiplier : 1;
        formulaType = 'events_days_honorarium';
        expression = `events * days * ${doctors} * rate`;
        variablesUsed = ['events', 'days'];
        detectedMultiplier = doctors;
        explanation = `Calculates honorarium for ${doctors} doctor/specialist(s) across all batch training days.`;
      }
      // Pattern 3: Trainee Catering / Participant Meals per day (e.g. Lunch and tea for 25 trainees for 2 days)
      else if ((hasTrainees || p.includes('participant')) && (hasCatering || hasDays)) {
        formulaType = 'events_days_participants';
        expression = `events * days * trainees * rate * multiplier`;
        variablesUsed = ['events', 'days', 'trainees'];
        explanation = `Calculates daily catering allowance for all participants throughout each training batch day.`;
      }
      // Pattern 4: Trainee Certificates, Stationery & Kits (per participant, not per day)
      else if (hasTrainees && (hasCollateral || p.includes('badge') || p.includes('stationery') || p.includes('certificate'))) {
        formulaType = 'participants_rate';
        expression = `events * trainees * rate * multiplier`;
        variablesUsed = ['events', 'trainees'];
        explanation = `Calculates individual kit & certificate cost for each participating trainee across batches.`;
      }
      // Pattern 5: Venue Hall Rental per training day
      else if (hasHall && hasDays) {
        formulaType = 'events_days_hall';
        expression = `events * days * rate * multiplier`;
        variablesUsed = ['events', 'days'];
        explanation = `Calculates venue hall rental cost multiplied by the number of training days in each batch.`;
      }
      // Pattern 6: Transit / Travel Tickets per trainer (not per day)
      else if (hasTransit || (hasTrainers && !hasDays)) {
        formulaType = 'events_trainers';
        expression = `events * trainers * rate * multiplier`;
        variablesUsed = ['events', 'trainers'];
        explanation = `Calculates roundtrip transit tickets for the trainer team per training batch.`;
      }
      // Pattern 7: Supervision Cab / Food per facility visit
      else if (hasFacilities && (p.includes('cab') || p.includes('visit') || p.includes('supervision') || p.includes('monitoring'))) {
        formulaType = p.includes('food') ? 'facilities_pc_food' : 'facilities_pc_cab';
        expression = `facilities * rate * multiplier`;
        variablesUsed = ['facilities'];
        explanation = `Calculates supportive supervision monitoring visits across all target facilities.`;
      }
      // Pattern 8: Flat event-level cost (e.g. Banners, Backdrop, Courier)
      else if (p.includes('flat') || p.includes('banner') || p.includes('courier') || p.includes('dispatch') || (!hasDays && !hasTrainers && !hasTrainees && !hasFacilities)) {
        formulaType = 'events_rate';
        expression = `events * rate * multiplier`;
        variablesUsed = ['events'];
        explanation = `Calculates fixed direct cost per event batch regardless of duration or participants.`;
      }
      // Pattern 9: Default Full Team × Days Daily Allowance / Hotel / Cab
      else {
        formulaType = 'events_days_trainers';
        expression = `events * days * trainers * rate * multiplier`;
        variablesUsed = ['events', 'days', 'trainers'];
        explanation = `Calculates daily rate (Hotel, Cab, Food DA) for all trainers across the training batch duration.`;
      }

      // Generate sample evaluation math
      const sampleScope = { events: 1, days: 2, trainers: 2, trainees: 25, facilities: 10, rate: 1000, multiplier: detectedMultiplier };
      let sampleVal = 0;
      try {
        sampleVal = Utils.FormulaEvaluator.evaluate(expression, sampleScope);
      } catch(e) {
        sampleVal = 0;
      }
      const sampleMath = `Sample: 1 Batch × 2 Days × 2 Trainers × 25 Trainees × 10 Facs @ ₹1,000 => ₹${Utils.formatNumber(sampleVal)}`;

      return {
        expression: expression,
        formulaType: formulaType,
        multiplier: detectedMultiplier,
        variablesUsed: variablesUsed,
        explanation: explanation,
        sampleMath: sampleMath
      };
    }
  }
};

window.Utils = Utils;
