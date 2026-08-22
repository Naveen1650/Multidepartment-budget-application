// ============================================================
// NOORA HEALTH BUDGET APP — IndexedDB Data Layer
// Wraps IndexedDB with a clean async API
// ============================================================

const DB_NAME = 'NooraBudgetDB';
const DB_VERSION = 8;

const STORES = {
  entities: 'entities',
  departments: 'departments',
  locations: 'locations',
  donors: 'donors',
  activities: 'activities',
  conditionAreas: 'conditionAreas',
  chartOfAccounts: 'chartOfAccounts',
  conversionRates: 'conversionRates',
  budgetYears: 'budgetYears',
  entityDeptConfig: 'entityDeptConfig',
  payrollPersonnel: 'payrollPersonnel',
  payrollEHA: 'payrollEHA',
  payrollFixedAsset: 'payrollFixedAsset',
  nonPayrollCost: 'nonPayrollCost',
  travelRates: 'travelRates',
  travelPackages: 'travelPackages',
  employeesMaster: 'employeesMaster',
  totalCostSheet: 'totalCostSheet',
  priorYearBudget: 'priorYearBudget',
  priorYearActuals: 'priorYearActuals',
  impUnitRates: 'impUnitRates',
  impTotEvents: 'impTotEvents',
  impCustomRateFields: 'impCustomRateFields',
  impActivityTemplates: 'impActivityTemplates'
};

class BudgetDB {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Master data stores
        if (!db.objectStoreNames.contains(STORES.entities)) {
          db.createObjectStore(STORES.entities, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.departments)) {
          db.createObjectStore(STORES.departments, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.locations)) {
          const store = db.createObjectStore(STORES.locations, { keyPath: 'id', autoIncrement: true });
          store.createIndex('entityId', 'entityId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.donors)) {
          const store = db.createObjectStore(STORES.donors, { keyPath: 'id', autoIncrement: true });
          store.createIndex('entityId', 'entityId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.activities)) {
          db.createObjectStore(STORES.activities, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORES.conditionAreas)) {
          db.createObjectStore(STORES.conditionAreas, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORES.chartOfAccounts)) {
          db.createObjectStore(STORES.chartOfAccounts, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORES.conversionRates)) {
          const store = db.createObjectStore(STORES.conversionRates, { keyPath: 'id', autoIncrement: true });
          store.createIndex('year', 'year', { unique: false });
        }

        // Budget config stores
        if (!db.objectStoreNames.contains(STORES.budgetYears)) {
          db.createObjectStore(STORES.budgetYears, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.entityDeptConfig)) {
          const store = db.createObjectStore(STORES.entityDeptConfig, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntity', ['yearId', 'entityId'], { unique: false });
        }

        // Budget data stores
        if (!db.objectStoreNames.contains(STORES.payrollPersonnel)) {
          const store = db.createObjectStore(STORES.payrollPersonnel, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.payrollEHA)) {
          const store = db.createObjectStore(STORES.payrollEHA, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.payrollFixedAsset)) {
          const store = db.createObjectStore(STORES.payrollFixedAsset, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.nonPayrollCost)) {
          const store = db.createObjectStore(STORES.nonPayrollCost, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.travelRates)) {
          const store = db.createObjectStore(STORES.travelRates, { keyPath: 'id', autoIncrement: true });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('entityLocation', ['entityId', 'location'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.travelPackages)) {
          const store = db.createObjectStore(STORES.travelPackages, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.employeesMaster)) {
          const store = db.createObjectStore(STORES.employeesMaster, { keyPath: 'id', autoIncrement: true });
          store.createIndex('employeeCode', 'employeeCode', { unique: false });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('deptId', 'deptId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.totalCostSheet)) {
          const store = db.createObjectStore(STORES.totalCostSheet, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.priorYearBudget)) {
          const store = db.createObjectStore(STORES.priorYearBudget, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntity', ['yearId', 'entityId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.priorYearActuals)) {
          const store = db.createObjectStore(STORES.priorYearActuals, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntity', ['yearId', 'entityId'], { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.impUnitRates)) {
          const store = db.createObjectStore(STORES.impUnitRates, { keyPath: 'id', autoIncrement: true });
          store.createIndex('location', 'location', { unique: false });
          store.createIndex('stateCode', 'stateCode', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.impTotEvents)) {
          const store = db.createObjectStore(STORES.impTotEvents, { keyPath: 'id', autoIncrement: true });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
          store.createIndex('month', 'month', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.impCustomRateFields)) {
          db.createObjectStore(STORES.impCustomRateFields, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.impActivityTemplates)) {
          db.createObjectStore(STORES.impActivityTemplates, { keyPath: 'code' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ─── Generic CRUD Operations ───

  async getAll(storeName) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      console.warn(`Object store ${storeName} not in DB yet, returning fallback.`);
      if (storeName === STORES.employeesMaster) return SEED_DATA.sampleEmployeesMaster || [];
      if (storeName === STORES.travelRates) return SEED_DATA.defaultTravelRates || [];
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return null;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return null;
    const item = { ...data };
    if (item.id === undefined || item.id === null || item.id === '' || item.id === 'null' || item.id === 'undefined') {
      delete item.id;
      return this.add(storeName, item);
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, data) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return null;
    const item = { ...data };
    if (item.id === undefined || item.id === null || item.id === '' || item.id === 'null' || item.id === 'undefined') {
      delete item.id;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, key) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      if (!store.indexNames.contains(indexName)) {
        resolve([]);
        return;
      }
      const index = store.index(indexName);
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return 0;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async putMany(storeName, items) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => {
        try {
          if (item.id !== undefined) {
            store.put(item);
          } else {
            store.add(item);
          }
        } catch {
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ─── Seed Data Loading ───

  async seedIfEmpty() {
    await this.ready;
    const entityCount = await this.count(STORES.entities);

    if (entityCount === 0) {
      console.log('Seeding database with initial master data...');
      await this.putMany(STORES.entities, SEED_DATA.entities);
      await this.putMany(STORES.departments, SEED_DATA.departments);

      for (const [entityId, locs] of Object.entries(SEED_DATA.locations)) {
        for (const name of locs) {
          await this.add(STORES.locations, { entityId, name });
        }
      }

      for (const [entityId, donorList] of Object.entries(SEED_DATA.donors)) {
        for (const name of donorList) {
          await this.add(STORES.donors, { entityId, name });
        }
      }

      for (const name of SEED_DATA.activities) {
        await this.add(STORES.activities, { name });
      }

      for (const name of SEED_DATA.conditionAreas) {
        await this.add(STORES.conditionAreas, { name });
      }

      for (const account of SEED_DATA.chartOfAccounts) {
        await this.add(STORES.chartOfAccounts, account);
      }

      if (SEED_DATA.samplePersonnel) {
        await this.putMany(STORES.payrollPersonnel, SEED_DATA.samplePersonnel);
      }
    }

    // Always ensure travelRates and employeesMaster are populated if empty
    if (this.db.objectStoreNames.contains(STORES.travelRates)) {
      const travelCount = await this.count(STORES.travelRates);
      if (travelCount === 0 && SEED_DATA.defaultTravelRates) {
        await this.putMany(STORES.travelRates, SEED_DATA.defaultTravelRates);
      }
    }

    if (this.db.objectStoreNames.contains(STORES.employeesMaster)) {
      const empCount = await this.count(STORES.employeesMaster);
      if (empCount === 0 && SEED_DATA.sampleEmployeesMaster) {
        await this.putMany(STORES.employeesMaster, SEED_DATA.sampleEmployeesMaster);
      }
    }

    console.log('Database readiness verified!');
    return true;
  }

  // ─── Helper Methods ───

  async getLocationsForEntity(entityId) {
    return this.getByIndex(STORES.locations, 'entityId', entityId);
  }

  async getEmployeesMaster(entityId = null) {
    try {
      await this.ready;
      if (!this.db || !this.db.objectStoreNames.contains(STORES.employeesMaster)) {
        const defaults = (SEED_DATA.sampleEmployeesMaster || []).filter(e => !entityId || e.entityId === entityId);
        return defaults;
      }

      let list = [];
      if (entityId) {
        list = await this.getByIndex(STORES.employeesMaster, 'entityId', entityId);
      } else {
        list = await this.getAll(STORES.employeesMaster);
      }

      if (!list || list.length === 0) {
        const defaults = (SEED_DATA.sampleEmployeesMaster || []).filter(e => !entityId || e.entityId === entityId);
        if (defaults.length > 0) {
          await this.putMany(STORES.employeesMaster, defaults);
          const reloaded = await this.getAll(STORES.employeesMaster);
          return reloaded && reloaded.length > 0 ? reloaded : defaults;
        }
      }
      return list || [];
    } catch (err) {
      console.warn('Fallback getting employees master:', err);
      return (SEED_DATA.sampleEmployeesMaster || []).filter(e => !entityId || e.entityId === entityId);
    }
  }

  async getTravelRatesForEntity(entityId) {
    try {
      await this.ready;
      if (!this.db || !this.db.objectStoreNames.contains(STORES.travelRates)) {
        return (SEED_DATA.defaultTravelRates || []).filter(r => r.entityId === entityId);
      }

      const rates = await this.getByIndex(STORES.travelRates, 'entityId', entityId);
      if (!rates || rates.length === 0) {
        const defaults = (SEED_DATA.defaultTravelRates || []).filter(r => r.entityId === entityId);
        if (defaults.length > 0) {
          await this.putMany(STORES.travelRates, defaults);
          return defaults;
        }
      }
      return rates || [];
    } catch (err) {
      console.warn('Fallback getting travel rates:', err);
      return (SEED_DATA.defaultTravelRates || []).filter(r => r.entityId === entityId);
    }
  }

  async getTravelRate(entityId, location, category) {
    const rates = await this.getTravelRatesForEntity(entityId);
    const norm = (s) => String(s || '').trim().toLowerCase();
    const locNorm = norm(location);
    const catNorm = norm(category);

    // 1. Exact match on location & category
    let match = rates.find(r => norm(r.location) === locNorm && norm(r.category) === catNorm && !r.isDefault && !norm(r.location).includes('default'));
    if (match) return { ...match, isFallback: false };

    // 2. Any match for specific location
    match = rates.find(r => norm(r.location) === locNorm && !r.isDefault && !norm(r.location).includes('default'));
    if (match) return { ...match, isFallback: false };

    // 3. Fallback: Default rate for the specific category (City / Non-City)
    match = rates.find(r => (r.isDefault || norm(r.location).includes('default') || norm(r.location) === 'all') && norm(r.category) === catNorm);
    if (match) return { ...match, isFallback: true };

    // 4. Fallback: Any Default rate for entity
    match = rates.find(r => r.isDefault || norm(r.location).includes('default') || norm(r.location) === 'all');
    if (match) return { ...match, isFallback: true };

    // 5. General entity rate fallback
    if (rates.length > 0) return { ...rates[0], isFallback: true };

    // 6. Hardcoded emergency fallback
    return {
      entityId,
      location: 'Default Fallback',
      category: category || 'City',
      hotelPerDay: 3000,
      foodPerDay: 1000,
      cabPerDay: 1000,
      airfarePerTrip: 8000,
      busTrainPerTrip: 2000,
      currency: 'INR',
      isFallback: true
    };
  }

  async getDonorsForEntity(entityId) {
    return this.getByIndex(STORES.donors, 'entityId', entityId);
  }

  async getConversionRatesForYear(year) {
    return this.getByIndex(STORES.conversionRates, 'year', year);
  }

  async getEntityDeptConfigForYear(yearId, entityId) {
    return this.getByIndex(STORES.entityDeptConfig, 'yearEntity', [yearId, entityId]);
  }

  async getBudgetData(storeName, yearId, entityId, deptId) {
    return this.getByIndex(storeName, 'yearEntityDept', [yearId, entityId, deptId]);
  }

  // ─── IMP ToT Benchmark Rates & Events Helpers ───
  async getAllImpUnitRates() {
    const customRates = await this.getAll(STORES.impUnitRates);
    const defaultRates = SEED_DATA.defaultImpUnitRates || [];
    if (!customRates || customRates.length === 0) {
      return defaultRates;
    }
    // Merge custom rates over default rates
    const merged = [...defaultRates];
    customRates.forEach(cr => {
      const idx = merged.findIndex(m => m.location === cr.location || (m.stateCode && m.stateCode === cr.stateCode));
      if (idx !== -1) merged[idx] = { ...merged[idx], ...cr };
      else merged.push(cr);
    });
    return merged;
  }

  async getImpUnitRates(location) {
    const allRates = await this.getAllImpUnitRates();
    if (!location) {
      return allRates.find(r => r.stateCode === 'KA' || r.location === 'India KA') || allRates[0] || {};
    }
    // Match by exact location, or state code within location (e.g. 'India KA' -> 'KA')
    const locClean = String(location).trim().toUpperCase();
    const match = allRates.find(r => 
      String(r.location).trim().toUpperCase() === locClean ||
      (r.stateCode && locClean.includes(r.stateCode.toUpperCase()))
    );
    return match || allRates.find(r => r.stateCode === 'DEFAULT') || allRates[0] || {};
  }

  async saveImpUnitRate(rateObj) {
    if (!rateObj.id) {
      const existing = await this.getByIndex(STORES.impUnitRates, 'location', rateObj.location);
      if (existing && existing.length > 0) rateObj.id = existing[0].id;
    }
    if (rateObj.id) {
      return this.put(STORES.impUnitRates, rateObj);
    }
    return this.add(STORES.impUnitRates, rateObj);
  }

  async getImpTotEvents(yearId, entityId, deptId) {
    return this.getBudgetData(STORES.impTotEvents, yearId, entityId, deptId);
  }

  async saveImpTotEvent(eventObj) {
    if (eventObj.id) {
      return this.put(STORES.impTotEvents, eventObj);
    }
    return this.add(STORES.impTotEvents, eventObj);
  }

  async deleteImpTotEvent(id) {
    return this.delete(STORES.impTotEvents, id);
  }

  // ─── IMP ToT Custom Rate Fields Helpers ───
  async getAllImpCustomRateFields() {
    const customFields = await this.getAll(STORES.impCustomRateFields);
    const defaultFields = SEED_DATA.defaultImpCustomRateFields || [];
    if (!customFields || customFields.length === 0) {
      return defaultFields;
    }
    const merged = [...defaultFields];
    customFields.forEach(cf => {
      const idx = merged.findIndex(m => m.id === cf.id || m.fieldKey === cf.fieldKey);
      if (idx !== -1) merged[idx] = { ...merged[idx], ...cf };
      else merged.push(cf);
    });
    return merged;
  }

  async saveImpCustomRateField(fieldObj) {
    if (!fieldObj.id) {
      fieldObj.id = fieldObj.fieldKey || ('field_' + Date.now());
    }
    if (!fieldObj.fieldKey) {
      fieldObj.fieldKey = fieldObj.id;
    }
    return this.put(STORES.impCustomRateFields, fieldObj);
  }

  async deleteImpCustomRateField(id) {
    return this.delete(STORES.impCustomRateFields, id);
  }

  // ─── IMP ToT Activity-Specific Templates Helpers (Activities 10.1 to 10.8) ───
  async getAllImpActivityTemplates() {
    const customTemplates = await this.getAll(STORES.impActivityTemplates);
    const defaultTemplates = SEED_DATA.defaultImpActivityTemplates || [];
    if (!customTemplates || customTemplates.length === 0) {
      return defaultTemplates;
    }
    const merged = [...defaultTemplates];
    customTemplates.forEach(ct => {
      const idx = merged.findIndex(m => m.code === ct.code || m.componentId === ct.componentId);
      if (idx !== -1) merged[idx] = { ...merged[idx], ...ct };
      else merged.push(ct);
    });
    return merged;
  }

  async getImpActivityTemplate(codeOrCompId) {
    const all = await this.getAllImpActivityTemplates();
    if (!codeOrCompId) return all[0] || {};
    const key = String(codeOrCompId).trim();
    return all.find(t => 
      t.code === key || 
      t.componentId === key || 
      (t.activityName && t.activityName.startsWith(key)) ||
      (t.activityName && t.activityName.includes(key))
    ) || all[0] || {};
  }

  async saveImpActivityTemplate(templateObj) {
    if (!templateObj.code) {
      throw new Error('Activity template must have a valid activity code (e.g. 10.1)');
    }
    return this.put(STORES.impActivityTemplates, templateObj);
  }

  async resetImpActivityTemplate(code) {
    return this.delete(STORES.impActivityTemplates, code);
  }

  async resetAllImpActivityTemplates() {
    return this.clear(STORES.impActivityTemplates);
  }

  // Get department display name with country prefix
  getDeptDisplayName(dept, entityOrPrefix) {
    const prefix = typeof entityOrPrefix === 'string' 
      ? entityOrPrefix 
      : entityOrPrefix?.deptPrefix || '';
    
    if (dept.scope === 'gl' || dept.scope === 'dp-gp' || dept.scope === 'general') {
      return dept.codeTemplate;
    }
    
    const code = dept.codeTemplate.replace('{CC}', prefix);
    const num = dept.number ? `${dept.number}. ` : '';
    return `${num}${code}`;
  }
}

// Singleton instance
const db = new BudgetDB();
window.db = db;
window.STORES = STORES;
