// ============================================================
// NOORA HEALTH BUDGET APP — IndexedDB Data Layer
// Wraps IndexedDB with a clean async API
// ============================================================

const DB_NAME = 'NooraBudgetDB';
const DB_VERSION = 12;

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
  impActivityTemplates: 'impActivityTemplates',
  impRateCategories: 'impRateCategories',
  roles: 'roles',
  users: 'users',
  auditLogs: 'auditLogs',
  remarksThreads: 'remarksThreads',
  budgetLockStatus: 'budgetLockStatus',
  lockedBudgets: 'lockedBudgets'
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
        if (!db.objectStoreNames.contains(STORES.impRateCategories)) {
          db.createObjectStore(STORES.impRateCategories, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.roles)) {
          db.createObjectStore(STORES.roles, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.users)) {
          const store = db.createObjectStore(STORES.users, { keyPath: 'id' });
          store.createIndex('roleId', 'roleId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.auditLogs)) {
          const store = db.createObjectStore(STORES.auditLogs, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('deptId', 'deptId', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('action', 'action', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.remarksThreads)) {
          const store = db.createObjectStore(STORES.remarksThreads, { keyPath: 'id' });
          store.createIndex('yearEntityDept', ['yearId', 'entityId', 'deptId'], { unique: false });
          store.createIndex('ledgerCode', 'ledgerCode', { unique: false });
          store.createIndex('assignedToUserId', 'assignedToUserId', { unique: false });
          store.createIndex('assignedByUserId', 'assignedByUserId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
        // ─── Budget Lock Stores ───
        if (!db.objectStoreNames.contains(STORES.budgetLockStatus)) {
          // Keyed by yearId. Status: 'draft' | 'under-review' | 'finance-approved' | 'finalized-locked'
          db.createObjectStore(STORES.budgetLockStatus, { keyPath: 'yearId' });
        }
        if (!db.objectStoreNames.contains(STORES.lockedBudgets)) {
          // Snapshot store: stores frozen budget data + rates at time of finalization
          const store = db.createObjectStore(STORES.lockedBudgets, { keyPath: 'id' });
          store.createIndex('yearId', 'yearId', { unique: false });
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
      request.onsuccess = () => {
        if (request.result !== undefined) {
          resolve(request.result);
        } else if (typeof key === 'string' && !isNaN(parseInt(key))) {
          // Fallback to numeric key
          try {
            const numReq = store.get(parseInt(key));
            numReq.onsuccess = () => resolve(numReq.result !== undefined ? numReq.result : null);
            numReq.onerror = () => resolve(null);
          } catch (e) {
            resolve(null);
          }
        } else if (typeof key === 'number') {
          // Fallback to string key
          try {
            const strReq = store.get(String(key));
            strReq.onsuccess = () => resolve(strReq.result !== undefined ? strReq.result : null);
            strReq.onerror = () => resolve(null);
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return null;
    const item = { ...data };

    // Strict Lock Enforcement for budget transaction stores (Entity-Scoped)
    const BUDGET_TX_STORES = [
      STORES.payrollPersonnel,
      STORES.payrollEHA,
      STORES.payrollFixedAsset,
      STORES.nonPayrollCost,
      STORES.totalCostSheet,
      STORES.travelPackages,
      STORES.impTotEvents
    ];
    if (BUDGET_TX_STORES.includes(storeName) && item.yearId) {
      if (await this.isYearLocked(item.yearId, item.entityId)) {
        console.warn(`[BudgetDB] Blocked put to ${storeName}: Budget cycle CY-${item.yearId} (${item.entityId || 'All'}) is locked.`);
        return null;
      }
    }

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

    const BUDGET_TX_STORES = [
      STORES.payrollPersonnel,
      STORES.payrollEHA,
      STORES.payrollFixedAsset,
      STORES.nonPayrollCost,
      STORES.totalCostSheet,
      STORES.travelPackages,
      STORES.impTotEvents
    ];
    if (BUDGET_TX_STORES.includes(storeName) && item.yearId) {
      if (await this.isYearLocked(item.yearId, item.entityId)) {
        console.warn(`[BudgetDB] Blocked add to ${storeName}: Budget cycle CY-${item.yearId} (${item.entityId || 'All'}) is locked.`);
        return null;
      }
    }

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

    const BUDGET_TX_STORES = [
      STORES.payrollPersonnel,
      STORES.payrollEHA,
      STORES.payrollFixedAsset,
      STORES.nonPayrollCost,
      STORES.totalCostSheet,
      STORES.travelPackages,
      STORES.impTotEvents
    ];
    if (BUDGET_TX_STORES.includes(storeName)) {
      const rec = await this.get(storeName, key);
      if (rec && rec.yearId && (await this.isYearLocked(rec.yearId, rec.entityId))) {
        console.warn(`[BudgetDB] Blocked delete from ${storeName}: Budget cycle CY-${rec.yearId} (${rec.entityId || 'All'}) is locked.`);
        return;
      }
    }

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
      let queryKey = key;
      if (Array.isArray(key) && Array.isArray(index.keyPath) && key.length < index.keyPath.length && typeof IDBKeyRange !== 'undefined') {
        const lower = [...key];
        const upper = [...key];
        while (lower.length < index.keyPath.length) lower.push('');
        while (upper.length < index.keyPath.length) upper.push('\uffff');
        queryKey = IDBKeyRange.bound(lower, upper);
      }
      const request = index.getAll(queryKey);
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
          const copy = { ...item };
          if (copy.id !== undefined && copy.id !== null && copy.id !== '') {
            store.put(copy);
          } else {
            delete copy.id;
            store.add(copy);
          }
        } catch {
          const copy = { ...item };
          delete copy.id;
          store.put(copy);
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
    } else {
      // Ensure any newly added standard COA accounts (e.g. 93701) are present
      if (this.db.objectStoreNames.contains(STORES.chartOfAccounts)) {
        const existingCoa = await this.getAll(STORES.chartOfAccounts);
        for (const account of (SEED_DATA.chartOfAccounts || [])) {
          if (!existingCoa.some(c => String(c.ledgerCode).trim() === String(account.ledgerCode).trim())) {
            await this.add(STORES.chartOfAccounts, account);
          }
        }
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
      const storedVersion = localStorage.getItem('noora_employees_master_version');
      const targetVersion = '2027_v3_all_depts_countries';
      const empCount = await this.count(STORES.employeesMaster);

      if ((empCount === 0 || storedVersion !== targetVersion) && SEED_DATA.sampleEmployeesMaster) {
        await this.clear(STORES.employeesMaster);
        await this.putMany(STORES.employeesMaster, SEED_DATA.sampleEmployeesMaster);
        localStorage.setItem('noora_employees_master_version', targetVersion);
        console.log(`[DB] Refreshed Employee Master with ${SEED_DATA.sampleEmployeesMaster.length} multi-country records (${targetVersion}).`);
      }
    }

    if (this.db.objectStoreNames.contains(STORES.priorYearActuals)) {
      const pyaCount = await this.count(STORES.priorYearActuals);
      if (pyaCount === 0 && SEED_DATA.priorYearActuals) {
        await this.putMany(STORES.priorYearActuals, SEED_DATA.priorYearActuals);
      }
    }

    if (this.db.objectStoreNames.contains(STORES.roles)) {
      const roleCount = await this.count(STORES.roles);
      if (SEED_DATA.defaultRoles) {
        if (roleCount === 0) {
          await this.putMany(STORES.roles, SEED_DATA.defaultRoles);
        } else {
          // Ensure all default roles are present and updated with tier info
          for (const defRole of SEED_DATA.defaultRoles) {
            const existing = await this.get(STORES.roles, defRole.id);
            if (!existing) {
              await this.put(STORES.roles, defRole);
            } else if (!existing.tier || existing.name !== defRole.name) {
              await this.put(STORES.roles, { ...defRole, ...existing, tier: defRole.tier, name: defRole.name, description: defRole.description, badgeColor: defRole.badgeColor, isSuperAdmin: defRole.isSuperAdmin, isEntityAdmin: defRole.isEntityAdmin, isFinalizer: defRole.isFinalizer });
            }
          }
        }
      }
    }

    if (this.db.objectStoreNames.contains(STORES.users)) {
      const userCount = await this.count(STORES.users);
      if (SEED_DATA.defaultUsers) {
        if (userCount === 0) {
          await this.putMany(STORES.users, SEED_DATA.defaultUsers);
        } else {
          // Ensure all default users are present with multi-role assignments
          for (const defUser of SEED_DATA.defaultUsers) {
            const existing = await this.get(STORES.users, defUser.id);
            if (!existing) {
              await this.put(STORES.users, defUser);
            } else if (!existing.roleAssignments || existing.roleAssignments.length === 0) {
              await this.put(STORES.users, { ...existing, roleAssignments: defUser.roleAssignments, roleId: defUser.roleId });
            }
          }
        }
      }
    }

    if (this.db.objectStoreNames.contains(STORES.auditLogs)) {
      const auditCount = await this.count(STORES.auditLogs);
      if (auditCount === 0 && SEED_DATA.sampleAuditLogs) {
        await this.putMany(STORES.auditLogs, SEED_DATA.sampleAuditLogs);
      }
    }

    if (this.db.objectStoreNames.contains(STORES.remarksThreads)) {
      const remCount = await this.count(STORES.remarksThreads);
      if (remCount === 0 && SEED_DATA.sampleRemarksThreads) {
        await this.putMany(STORES.remarksThreads, SEED_DATA.sampleRemarksThreads);
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
        const defaults = (SEED_DATA.sampleEmployeesMaster || []);
        if (defaults.length > 0) {
          await this.putMany(STORES.employeesMaster, defaults);
          const reloaded = await this.getAll(STORES.employeesMaster);
          const result = entityId ? (reloaded || defaults).filter(e => e.entityId === entityId) : (reloaded || defaults);
          return result;
        }
      }
      return list || [];
    } catch (err) {
      console.warn('Fallback getting employees master:', err);
      return (SEED_DATA.sampleEmployeesMaster || []).filter(e => !entityId || e.entityId === entityId);
    }
  }

  async resetEmployeesMasterToDefault() {
    try {
      await this.ready;
      if (this.db && this.db.objectStoreNames.contains(STORES.employeesMaster)) {
        await this.clear(STORES.employeesMaster);
        await this.putMany(STORES.employeesMaster, SEED_DATA.sampleEmployeesMaster || []);
        localStorage.setItem('noora_employees_master_version', '2027_v3_all_depts_countries');
        return await this.getAll(STORES.employeesMaster);
      }
      return SEED_DATA.sampleEmployeesMaster || [];
    } catch (err) {
      console.error('Failed to reset employees master:', err);
      throw err;
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

  async getEntityBudgetData(storeName, yearId, entityId) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) return [];
    try {
      const results = await this.getByIndex(storeName, 'yearEntityDept', [yearId, entityId]);
      if (results && results.length > 0) return results;
    } catch (e) {
      // fallback
    }
    try {
      const all = await this.getAll(storeName);
      return all.filter(r => String(r.yearId) === String(yearId) && String(r.entityId) === String(entityId));
    } catch (e) {
      return [];
    }
  }

  // ─── 🏛️ Hierarchical Country Default & 5D State Override Helper ───
  getCountryForLocation(location) {
    if (!location) return 'India';
    const loc = String(location).trim().toUpperCase();
    if (
      loc.includes('BANGLADESH') || loc.startsWith('BD-') || loc.startsWith('BD ') ||
      loc.startsWith('DHA-') || loc.startsWith('KHU-') || loc.startsWith('CTG-') ||
      loc.startsWith('RAJ-') || loc.startsWith('BAR-') || loc.startsWith('RAN-') ||
      loc.startsWith('SYL-') || loc.startsWith('MYM-') || loc.includes('DHAKA') ||
      loc.includes('KHULNA') || loc.includes('CHATTOGRAM')
    ) {
      return 'Bangladesh';
    }
    if (
      loc.includes('INDONESIA') || loc.startsWith('INDO-') || loc.startsWith('INDO ') ||
      loc.includes('JAVA') || loc.includes('JAKARTA') || loc.includes('BALI') ||
      loc.includes('SUMATRA') || loc.includes('KALIMANTAN') || loc.includes('SULAWESI') ||
      loc.includes('JOGJAKARTA')
    ) {
      return 'Indonesia';
    }
    if (loc.includes('NEPAL') || loc.startsWith('NP-') || loc.includes('KATHMANDU') || loc.includes('POKHARA')) {
      return 'Nepal';
    }
    if (
      loc === 'US' || loc === 'USA' || loc.includes('UNITED STATES') ||
      loc.startsWith('US-') || loc.includes('CALIFORNIA') || loc.includes('NEW YORK')
    ) {
      return 'USA';
    }
    return 'India';
  }

  async getAllImpUnitRates() {
    let customRates = [];
    try {
      customRates = await this.getAll(STORES.impUnitRates);
    } catch (e) {
      console.warn('Could not read STORES.impUnitRates:', e);
    }
    const defaultRates = SEED_DATA.defaultImpUnitRates || [];
    if (!customRates || customRates.length === 0) {
      return defaultRates;
    }

    // Always start with all default rates to guarantee baseline completeness
    const merged = defaultRates.map(d => ({ ...d }));
    
    customRates.forEach(cr => {
      const isCd = cr.isCountryDefault || cr.id?.startsWith('country_');
      const crCountry = cr.country || this.getCountryForLocation(cr.location);
      
      const idx = merged.findIndex(m => {
        if (isCd && m.isCountryDefault) {
          return (m.id === cr.id) || (m.country && crCountry && m.country.toLowerCase() === crCountry.toLowerCase());
        }
        if (!isCd && !m.isCountryDefault) {
          return (m.id === cr.id) || (m.location && cr.location && m.location.trim().toUpperCase() === cr.location.trim().toUpperCase());
        }
        return m.id === cr.id;
      });

      if (idx !== -1) {
        merged[idx] = { ...merged[idx], ...cr, country: crCountry || merged[idx].country };
        // Ensure stateName and currency are strictly consistent for country defaults
        if (merged[idx].isCountryDefault) {
          const normCountry = merged[idx].country || 'India';
          const normScope = normCountry === 'Bangladesh' ? 'All Hubs' : (normCountry === 'Indonesia' || normCountry === 'Nepal' ? 'All Regions' : 'All States');
          merged[idx].stateName = `${normCountry} Baseline (${normScope})`;
          
          if (normCountry === 'Indonesia') merged[idx].currency = 'IDR';
          else if (normCountry === 'Bangladesh') merged[idx].currency = 'BDT';
          else if (normCountry === 'Nepal') merged[idx].currency = 'NPR';
          else if (normCountry === 'USA') merged[idx].currency = 'USD';
          else if (normCountry === 'India') merged[idx].currency = 'INR';
        }
      } else {
        merged.push({
          ...cr,
          country: crCountry
        });
      }
    });

    return merged;
  }

  async getImpCountryDefaultRates(country) {
    const cName = (country || 'India').trim().toLowerCase();
    const defaults = SEED_DATA.defaultImpUnitRates || [];
    const seedDefault = defaults.find(r => r.isCountryDefault && r.country?.toLowerCase() === cName);

    const allRates = await this.getAllImpUnitRates();
    const countryMatch = allRates.find(r => r.isCountryDefault && r.country?.toLowerCase() === cName);
    
    const result = countryMatch || seedDefault || defaults.find(r => r.country?.toLowerCase() === cName) || defaults[0] || {};
    
    // Guarantee clean country, currency, and scope title
    const normCountry = cName === 'indonesia' ? 'Indonesia' : (cName === 'bangladesh' ? 'Bangladesh' : (cName === 'nepal' ? 'Nepal' : (cName === 'usa' || cName === 'united states' ? 'USA' : 'India')));
    const normCurr = normCountry === 'Indonesia' ? 'IDR' : (normCountry === 'Bangladesh' ? 'BDT' : (normCountry === 'Nepal' ? 'NPR' : (normCountry === 'USA' ? 'USD' : 'INR')));
    const normScope = normCountry === 'Bangladesh' ? 'All Hubs' : (normCountry === 'Indonesia' || normCountry === 'Nepal' ? 'All Regions' : 'All States');

    return {
      ...result,
      country: normCountry,
      currency: normCurr,
      stateName: `${normCountry} Baseline (${normScope})`,
      isCountryDefault: true
    };
  }

  async getImpUnitRates(location) {
    const country = this.getCountryForLocation(location);
    const countryDefault = await this.getImpCountryDefaultRates(country);
    
    const locClean = String(location || '').trim();
    const locUpper = locClean.toUpperCase();

    // Direct match for Country Default or bare country name
    if (!locClean || locUpper === country.toUpperCase() || locUpper.includes('COUNTRY DEFAULT') || locUpper === 'DEFAULT' || locUpper === 'DEFAULT (ALL LOCATIONS)') {
      return {
        ...countryDefault,
        location: `${country} (Country Default)`,
        _isCountryDefault: true,
        _parentCountry: country
      };
    }

    // Look for explicit state-level override strictly within the same country
    const allRates = await this.getAllImpUnitRates();
    const stateOverride = allRates.find(r => !r.isCountryDefault && this.getCountryForLocation(r.location) === country && (
      String(r.location || '').trim().toUpperCase() === locUpper ||
      (r.stateCode && r.stateCode.trim().toUpperCase() === locUpper)
    ));

    if (stateOverride) {
      // Merge state override over country default so all fields are guaranteed
      return {
        ...countryDefault,
        ...stateOverride,
        country: country,
        _isStateOverride: true,
        _parentCountry: country
      };
    }

    // Inherit from Country Default
    const prettyStateName = locClean.replace(/^(India|Indo-|BD-|NP-|US-)\s*/i, '').trim();
    return {
      ...countryDefault,
      location: locClean,
      stateName: `${prettyStateName} (${country} Default Inherited)`,
      stateCode: locClean.replace(/^India\s+/i, '').trim(),
      _isInheritedFromCountry: true,
      _parentCountry: country
    };
  }

  async saveImpUnitRate(rateObj) {
    if (!rateObj.id) {
      if (rateObj.isCountryDefault) {
        rateObj.id = 'country_' + (rateObj.country || 'india').toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        const existing = await this.getByIndex(STORES.impUnitRates, 'location', rateObj.location);
        if (existing && existing.length > 0) rateObj.id = existing[0].id;
      }
    }
    if (rateObj.id) {
      return this.put(STORES.impUnitRates, rateObj);
    }
    return this.add(STORES.impUnitRates, rateObj);
  }

  async revertStateOverrideToCountryDefault(location) {
    const locClean = String(location).trim().toUpperCase();
    const allCustom = await this.getAll(STORES.impUnitRates);
    const toDelete = allCustom.filter(r => !r.isCountryDefault && (
      String(r.location || '').trim().toUpperCase() === locClean ||
      (r.stateCode && locClean.includes(r.stateCode.toUpperCase()))
    ));
    for (const item of toDelete) {
      if (item.id) await this.delete(STORES.impUnitRates, item.id);
    }
    return true;
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

  // ─── IMP ToT Benchmark Rate Fields Helpers (Standard Built-In + Custom) ───
  async getAllImpStandardBenchmarkFields() {
    let savedOverrides = [];
    try {
      savedOverrides = (await this.getAll(STORES.impCustomRateFields)) || [];
    } catch (e) {
      console.warn('Could not read STORES.impCustomRateFields:', e);
    }
    const defaults = (typeof SEED_DATA !== 'undefined' && SEED_DATA.defaultImpStandardBenchmarkFields) || [];
    if (!savedOverrides || savedOverrides.length === 0) {
      return defaults;
    }
    return defaults.map(df => {
      const saved = savedOverrides.find(s => s.fieldKey === df.fieldKey || s.id === df.id);
      return saved ? { ...df, ...saved, isBuiltIn: true } : df;
    });
  }

  async getAllImpCustomRateFields() {
    let customFields = [];
    try {
      customFields = (await this.getAll(STORES.impCustomRateFields)) || [];
    } catch (e) {
      console.warn('Could not read STORES.impCustomRateFields:', e);
    }
    const defaultFields = (typeof SEED_DATA !== 'undefined' && SEED_DATA.defaultImpCustomRateFields) || [];
    const merged = [...defaultFields];
    if (customFields && customFields.length > 0) {
      customFields.forEach(cf => {
        if (!cf.isBuiltIn) {
          const idx = merged.findIndex(m => m.id === cf.id || m.fieldKey === cf.fieldKey);
          if (idx !== -1) merged[idx] = { ...merged[idx], ...cf };
          else merged.push(cf);
        }
      });
    }
    return merged;
  }

  async getAllImpBenchmarkFields() {
    const standardFields = await this.getAllImpStandardBenchmarkFields();
    const customFields = await this.getAllImpCustomRateFields();
    return [...standardFields, ...customFields];
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

  async resetStandardBenchmarkField(fieldKey) {
    const all = await this.getAll(STORES.impCustomRateFields);
    const match = all.find(f => f.fieldKey === fieldKey || f.id === fieldKey);
    if (match) {
      return this.delete(STORES.impCustomRateFields, match.id);
    }
  }

  // ─── IMP ToT Activity-Specific Templates Helpers (Activities 10.1 to 10.8) ───
  async getAllImpActivityTemplates() {
    let customTemplates = [];
    try {
      customTemplates = (await this.getAll(STORES.impActivityTemplates)) || [];
    } catch (e) {
      console.warn('Could not read STORES.impActivityTemplates:', e);
    }
    const defaultTemplates = (typeof SEED_DATA !== 'undefined' && SEED_DATA.defaultImpActivityTemplates) || [];
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
    const defaults = (typeof SEED_DATA !== 'undefined' && SEED_DATA.defaultImpActivityTemplates) || [];
    const fallback = all[0] || defaults[0] || {};
    if (!codeOrCompId) return fallback;

    const raw = String(codeOrCompId).trim();
    const key = raw.toLowerCase();

    // 1. Exact match by code or componentId
    let found = all.find(t => t.code?.toLowerCase() === key || t.componentId?.toLowerCase() === key);
    if (found) return found;

    // 2. Match by activity code prefix (e.g. '10.1', '10.2', '10.3', etc.)
    const codeMatch = raw.match(/^10\.[1-8]/) || raw.match(/10\.[1-8]/);
    if (codeMatch) {
      found = all.find(t => t.code === codeMatch[0]);
      if (found) return found;
    }

    // 3. Match by activityName or title
    found = all.find(t => 
      (t.activityName && (t.activityName.toLowerCase().startsWith(key) || t.activityName.toLowerCase().includes(key))) ||
      (t.title && (t.title.toLowerCase().startsWith(key) || t.title.toLowerCase().includes(key)))
    );
    if (found) return found;

    // 4. Match if key contains template activityName or title
    found = all.find(t => 
      (t.activityName && key.includes(t.activityName.toLowerCase())) ||
      (t.title && key.includes(t.title.toLowerCase()))
    );

    return found || fallback;
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

  // ─── IMP Benchmark Rate Field Categories (Admin Configurable) ───
  async getAllImpRateCategories() {
    let list = [];
    try {
      list = await this.getAll(STORES.impRateCategories);
    } catch (e) {
      console.warn('Could not fetch impRateCategories from store:', e);
    }

    if (!list || list.length === 0) {
      const defaults = SEED_DATA.defaultImpRateCategories || [];
      for (const cat of defaults) {
        try {
          await this.put(STORES.impRateCategories, cat);
        } catch (err) {}
      }
      return defaults;
    }
    return list;
  }

  async saveImpRateCategory(categoryObj) {
    if (!categoryObj.id && !categoryObj.code) {
      throw new Error('Category must have an ID or Code.');
    }
    if (!categoryObj.id) categoryObj.id = categoryObj.code;
    return this.put(STORES.impRateCategories, categoryObj);
  }

  async deleteImpRateCategory(id) {
    return this.delete(STORES.impRateCategories, id);
  }

  async resetImpRateCategories() {
    await this.clear(STORES.impRateCategories);
    const defaults = SEED_DATA.defaultImpRateCategories || [];
    for (const cat of defaults) {
      await this.put(STORES.impRateCategories, cat);
    }
    return defaults;
  }

  // ─── Prior Period Costs Helpers ───
  async getPriorPeriodCosts(yearId, entityId = null, deptId = null) {
    await this.ready;
    let list = [];
    try {
      list = await this.getAll(STORES.priorYearActuals);
    } catch (e) {
      console.warn('Error reading priorYearActuals:', e);
    }
    if (!list || list.length === 0) {
      list = SEED_DATA.priorYearActuals || [];
    }
    return list.filter(r => 
      (!yearId || String(r.yearId) === String(yearId) || !r.yearId) &&
      (!entityId || r.entityId === entityId) &&
      (!deptId || r.deptId === deptId)
    );
  }

  async savePriorPeriodCosts(yearId, records, replace = false) {
    await this.ready;
    if (replace) {
      const existing = await this.getAll(STORES.priorYearActuals);
      for (const ex of existing) {
        if (String(ex.yearId) === String(yearId)) {
          await this.delete(STORES.priorYearActuals, ex.id);
        }
      }
    }
    for (const rec of records) {
      await this.put(STORES.priorYearActuals, {
        ...rec,
        id: rec.id || `pya_${yearId}_${rec.entityId}_${rec.deptId}_${rec.ledgerCode || Utils.slugify(rec.glDescription || 'line')}`,
        yearId: String(yearId),
        priorCost: Utils.parseNumber(rec.priorCost)
      });
    }
  }

  async saveSinglePriorPeriodCost(yearId, record) {
    await this.ready;
    const id = record.id || `pya_${yearId}_${record.entityId}_${record.deptId}_${record.ledgerCode || Utils.slugify(record.glDescription || 'custom')}`;
    const rec = {
      ...record,
      id,
      yearId: String(yearId),
      priorCost: Utils.parseNumber(record.priorCost)
    };
    await this.put(STORES.priorYearActuals, rec);
    return rec;
  }

  async deletePriorPeriodCost(id) {
    await this.ready;
    await this.delete(STORES.priorYearActuals, id);
  }

  // ─── RBAC Roles & Users Helpers ───
  async getRoles() {
    await this.ready;
    let roles = [];
    try {
      roles = await this.getAll(STORES.roles);
    } catch (e) {
      console.warn('Error reading roles:', e);
    }
    const seedObj = typeof SEED_DATA !== 'undefined' ? SEED_DATA : (typeof window !== 'undefined' ? window.SEED_DATA : {});
    const defaultRoles = seedObj.defaultRoles || [];

    if (!roles || roles.length === 0) {
      roles = defaultRoles.map(r => ({ ...r }));
      if (roles.length > 0) {
        try { await this.putMany(STORES.roles, roles); } catch (e) {}
      }
    } else if (defaultRoles.length > 0) {
      // Merge missing default roles or update tier information
      for (const defRole of defaultRoles) {
        const existingIdx = roles.findIndex(r => r.id === defRole.id);
        if (existingIdx === -1) {
          roles.push({ ...defRole });
          try { await this.put(STORES.roles, defRole); } catch (e) {}
        } else {
          if (!roles[existingIdx].tier || roles[existingIdx].name !== defRole.name) {
            roles[existingIdx] = {
              ...defRole,
              ...roles[existingIdx],
              tier: defRole.tier,
              name: defRole.name,
              description: defRole.description,
              badgeColor: defRole.badgeColor,
              isSuperAdmin: defRole.isSuperAdmin,
              isEntityAdmin: defRole.isEntityAdmin,
              isFinalizer: defRole.isFinalizer
            };
            try { await this.put(STORES.roles, roles[existingIdx]); } catch (e) {}
          }
        }
      }
    }

    return roles.sort((a, b) => (a.tier || 99) - (b.tier || 99));
  }

  async saveRole(role) {
    await this.ready;
    const id = role.id || `role_${Utils.slugify(role.name || 'custom')}`;
    const r = { ...role, id };
    await this.put(STORES.roles, r);
    return r;
  }

  async deleteRole(id) {
    await this.ready;
    await this.delete(STORES.roles, id);
  }

  async getUsers() {
    await this.ready;
    let users = [];
    try {
      users = await this.getAll(STORES.users);
    } catch (e) {
      console.warn('Error reading users:', e);
    }
    const seedObj = typeof SEED_DATA !== 'undefined' ? SEED_DATA : (typeof window !== 'undefined' ? window.SEED_DATA : {});
    const defaultUsers = seedObj.defaultUsers || [];

    if (!users || users.length === 0) {
      users = defaultUsers.map(u => ({ ...u }));
      if (users.length > 0) {
        try { await this.putMany(STORES.users, users); } catch (e) {}
      }
    } else if (defaultUsers.length > 0) {
      for (const defUser of defaultUsers) {
        const existingIdx = users.findIndex(u => u.id === defUser.id);
        if (existingIdx === -1) {
          users.push({ ...defUser });
          try { await this.put(STORES.users, defUser); } catch (e) {}
        } else if (!users[existingIdx].roleAssignments || users[existingIdx].roleAssignments.length === 0) {
          users[existingIdx].roleAssignments = defUser.roleAssignments || [];
          users[existingIdx].roleId = defUser.roleId;
          try { await this.put(STORES.users, users[existingIdx]); } catch (e) {}
        } else if (users[existingIdx].id === 'user-lead-hcomm' && users[existingIdx].roleAssignments?.[0]?.categoryOverrides?.salaries?.view === true && !users[existingIdx]._customizedByUser) {
          users[existingIdx].roleAssignments[0].categoryOverrides = {};
          if (users[existingIdx].categoryOverrides) users[existingIdx].categoryOverrides = {};
          try { await this.put(STORES.users, users[existingIdx]); } catch (e) {}
        }
      }
    }
    return users;
  }

  async saveUser(user) {
    await this.ready;
    const id = user.id || `user_${Date.now()}`;
    const u = {
      ...user,
      id,
      createdAt: user.createdAt || new Date().toISOString()
    };
    await this.put(STORES.users, u);
    return u;
  }

  async deleteUser(id) {
    await this.ready;
    await this.delete(STORES.users, id);
  }

  // ─── Audit Trail & Alteration Logging Helpers ───
  async logAudit({ yearId = null, entityId = null, deptId = null, category = 'general', action = 'UPDATE', recordId = null, description = '', changes = null, user = null }) {
    try {
      await this.ready;
      const currentUser = user || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null) || { id: 'system', name: 'System Admin', roleName: 'System Administrator' };
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id || 'system',
        userName: currentUser.name || 'System User',
        userRole: currentUser.roleName || currentUser.roleId || 'Admin',
        yearId: yearId ? String(yearId) : null,
        entityId: entityId || null,
        deptId: deptId || null,
        category: category || 'general',
        action: action || 'UPDATE', // CREATE, UPDATE, DELETE, REVIEW, APPROVE, FINALIZE, REMARKS
        recordId: recordId ? String(recordId) : null,
        description: description || `${action} on ${category}`,
        changes: changes || null
      };
      await this.add(STORES.auditLogs, auditEntry);
      return auditEntry;
    } catch (err) {
      console.warn('Failed to log audit entry:', err);
      return null;
    }
  }

  async getAuditLogs(filter = {}) {
    await this.ready;
    let logs = [];
    try {
      logs = await this.getAll(STORES.auditLogs);
    } catch (e) {
      console.warn('Error reading audit logs:', e);
    }
    if (!logs || logs.length === 0) {
      const seedObj = typeof SEED_DATA !== 'undefined' ? SEED_DATA : (typeof window !== 'undefined' ? window.SEED_DATA : {});
      logs = seedObj.sampleAuditLogs || [];
    }
    return logs.filter(l => {
      if (filter.yearId && String(l.yearId) !== String(filter.yearId)) return false;
      if (filter.entityId && l.entityId !== filter.entityId) return false;
      if (filter.deptId && l.deptId !== filter.deptId) return false;
      if (filter.userId && l.userId !== filter.userId) return false;
      if (filter.category && l.category !== filter.category) return false;
      if (filter.action && l.action !== filter.action) return false;
      if (filter.startDate && new Date(l.timestamp) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(l.timestamp) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // ─── Collaborative Line Item Remarks & Tasks Helpers ───
  async getLineRemarks(yearId = null, entityId = null, deptId = null, ledgerCode = null) {
    await this.ready;
    let remarks = [];
    try {
      remarks = await this.getAll(STORES.remarksThreads);
    } catch (e) {
      console.warn('Error reading remarksThreads:', e);
    }
    if (!remarks || remarks.length === 0) {
      const seedObj = typeof SEED_DATA !== 'undefined' ? SEED_DATA : (typeof window !== 'undefined' ? window.SEED_DATA : {});
      remarks = seedObj.sampleRemarksThreads || [];
    }

    return remarks.filter(r => {
      if (yearId && String(r.yearId) !== String(yearId)) return false;
      if (entityId && r.entityId !== entityId) return false;
      if (deptId && r.deptId !== deptId) return false;
      if (ledgerCode && r.ledgerCode !== ledgerCode) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async saveLineRemark(remark) {
    await this.ready;
    const isNew = !remark.id;
    const id = remark.id || `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const r = {
      ...remark,
      id,
      createdAt: remark.createdAt || new Date().toISOString(),
      status: remark.status || 'open'
    };
    await this.put(STORES.remarksThreads, r);

    // Automatically log audit trail entry
    await this.logAudit({
      yearId: r.yearId,
      entityId: r.entityId,
      deptId: r.deptId,
      category: 'total-dept-cost',
      action: isNew ? 'CREATE' : 'UPDATE',
      recordId: r.id,
      description: `${isNew ? 'Added remark & assigned to' : 'Updated remark for'} ${r.assignedToUserName || 'Team'}: "${(r.text || '').slice(0, 60)}..." on line ${r.ledgerCode || r.glDescription}`,
      changes: { text: r.text, assignedTo: r.assignedToUserName, status: r.status }
    });

    return r;
  }

  async resolveLineRemark(remarkId, resolutionNote = '', user = null) {
    await this.ready;
    const currentUser = user || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null) || { id: 'system', name: 'System User' };
    const all = await this.getLineRemarks();
    const remark = all.find(r => r.id === remarkId);
    if (!remark) return null;

    remark.status = 'done';
    remark.resolvedAt = new Date().toISOString();
    remark.resolvedByUserId = currentUser.id;
    remark.resolvedByUserName = currentUser.name;
    remark.resolutionNote = resolutionNote || 'Marked as Done';

    await this.put(STORES.remarksThreads, remark);

    await this.logAudit({
      yearId: remark.yearId,
      entityId: remark.entityId,
      deptId: remark.deptId,
      category: 'total-dept-cost',
      action: 'UPDATE',
      recordId: remark.id,
      description: `Marked remark as DONE by ${currentUser.name} on line ${remark.ledgerCode || remark.glDescription}: "${remark.resolutionNote}"`,
      changes: { status: 'done', resolvedBy: currentUser.name, resolutionNote: remark.resolutionNote }
    });

    return remark;
  }

  async reopenLineRemark(remarkId, note = '', user = null) {
    await this.ready;
    const currentUser = user || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null) || { id: 'system', name: 'System User' };
    const all = await this.getLineRemarks();
    const remark = all.find(r => r.id === remarkId);
    if (!remark) return null;

    remark.status = 'open';
    remark.reopenedAt = new Date().toISOString();
    remark.reopenedByUserId = currentUser.id;
    remark.reopenedByUserName = currentUser.name;
    if (note) {
      remark.reopenNote = note;
    }

    await this.put(STORES.remarksThreads, remark);

    await this.logAudit({
      yearId: remark.yearId,
      entityId: remark.entityId,
      deptId: remark.deptId,
      category: 'total-dept-cost',
      action: 'UPDATE',
      recordId: remark.id,
      description: `Reopened remark thread by ${currentUser.name} on line ${remark.ledgerCode || remark.glDescription}`,
      changes: { status: 'open', reopenedBy: currentUser.name }
    });

    return remark;
  }

  async getDeptRemarksSummary(yearId, entityId, deptId) {
    const remarks = await this.getLineRemarks(yearId, entityId, deptId);
    const summaryByLedger = {};
    remarks.forEach(r => {
      const key = r.ledgerCode || (r.glDescription ? Utils.slugify(r.glDescription) : 'line');
      if (!summaryByLedger[key]) {
        summaryByLedger[key] = { total: 0, open: 0, done: 0, items: [] };
      }
      summaryByLedger[key].total++;
      if (r.status === 'done') {
        summaryByLedger[key].done++;
      } else {
        summaryByLedger[key].open++;
      }
      summaryByLedger[key].items.push(r);
    });
    return summaryByLedger;
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

  // ─── Budget Lock Status Helpers ───

  /**
   * Get lock status for a budget year (optionally scoped to a specific entity).
   * Returns: { yearId, entityId, status: 'draft'|'under-review'|'finance-approved'|'finalized-locked', ... }
   */
  async getLockStatus(yearId, entityId = null) {
    await this.ready;
    let status = 'draft';
    const sId = String(yearId || '');
    const nId = parseInt(sId);
    const sEntityId = entityId ? String(entityId).trim() : null;

    try {
      // 1. Check budgetLockStatus as baseline
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetLockStatus)) {
        if (sEntityId) {
          const entityLock = await this.get(STORES.budgetLockStatus, `${sId}_${sEntityId}`);
          if (entityLock && entityLock.status) {
            status = entityLock.status;
          }
        }
        if (!status || status === 'draft') {
          const record = (await this.get(STORES.budgetLockStatus, sId)) || (!isNaN(nId) ? await this.get(STORES.budgetLockStatus, nId) : null);
          if (record && record.status) {
            status = record.status;
          }
        }
      }

      // 2. budgetYears is the master record — its status takes highest precedence
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetYears)) {
        const yearRec = (await this.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await this.get(STORES.budgetYears, nId) : null);
        if (yearRec) {
          if (sEntityId && yearRec.entityStatuses && yearRec.entityStatuses[sEntityId]) {
            status = yearRec.entityStatuses[sEntityId];
          } else if (yearRec.status) {
            status = yearRec.status;
          }
        }
      }
    } catch (e) {}
    return { yearId: sId, entityId: sEntityId, status };
  }

  /**
   * Set lock status for a budget year or entity-specifically.
   * Allowed statuses: 'draft', 'active', 'under-review', 'finance-approved', 'finalized-locked', 'closed'
   */
  async setLockStatus(yearId, status, meta = {}) {
    await this.ready;
    const sId = String(yearId);
    const nId = parseInt(sId);
    const sEntityId = meta.entityId ? String(meta.entityId).trim() : null;

    if (sEntityId) {
      // Entity-specific status change
      const recordKey = `${sId}_${sEntityId}`;
      const record = {
        id: recordKey,
        yearId: sId,
        entityId: sEntityId,
        status,
        updatedAt: new Date().toISOString(),
        ...meta
      };
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetLockStatus)) {
        await this.put(STORES.budgetLockStatus, record);
      }
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetYears)) {
        const yearRec = (await this.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await this.get(STORES.budgetYears, nId) : null);
        if (yearRec) {
          yearRec.entityStatuses = yearRec.entityStatuses || {};
          yearRec.entityStatuses[sEntityId] = status;
          await this.put(STORES.budgetYears, yearRec);
        }
      }
      return record;
    } else {
      // Year-wide base status change
      const current = await this.getLockStatus(yearId);
      const record = {
        ...current,
        id: sId,
        yearId: sId,
        status,
        updatedAt: new Date().toISOString(),
        ...meta
      };
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetLockStatus)) {
        await this.put(STORES.budgetLockStatus, record);
      }
      if (this.db && this.db.objectStoreNames.contains(STORES.budgetYears)) {
        const yearRec = (await this.get(STORES.budgetYears, sId)) || (!isNaN(nId) ? await this.get(STORES.budgetYears, nId) : null);
        if (yearRec) {
          yearRec.status = status;
          if (meta.applyToAllEntities && meta.entities && Array.isArray(meta.entities)) {
            yearRec.entityStatuses = yearRec.entityStatuses || {};
            for (const ent of meta.entities) {
              const entId = ent.id || ent;
              yearRec.entityStatuses[entId] = status;
              if (this.db.objectStoreNames.contains(STORES.budgetLockStatus)) {
                await this.put(STORES.budgetLockStatus, {
                  id: `${sId}_${entId}`,
                  yearId: sId,
                  entityId: entId,
                  status,
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }
          await this.put(STORES.budgetYears, yearRec);
        }
      }
      return record;
    }
  }

  /**
   * Check if a budget year (or specific entity) is locked (read-only).
   * Only 'draft' and 'active' permit additions/edits.
   * Any other status ('under-review', 'finance-approved', 'finalized-locked', 'closed') is locked.
   */
  async isYearLocked(yearId, entityId = null) {
    const ls = await this.getLockStatus(yearId, entityId);
    return ls.status !== 'draft' && ls.status !== 'active';
  }

  /**
   * Finalize a budget year:
   * 1. Takes a rate snapshot (exchange rates, travel rates, TOT rates) at this moment.
   * 2. Sets budget lock status to 'finalized-locked'.
   * 3. Stores a locked budget snapshot record.
   * 4. Logs audit entry.
   * 
   * After this, ALL write operations on this yearId should be rejected (enforced in modules).
   */
  async finalizeBudget(yearId, { yearObj, entities, conversionRates, travelRates, totRates } = {}) {
    await this.ready;

    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : { id: 'system', name: 'System' };

    // Snapshot conversion rates
    const rateSnapshot = {
      conversionRates: conversionRates || {},
      travelRates: travelRates || [],
      totRates: totRates || [],
      snapshotTakenAt: new Date().toISOString(),
      snapshotTakenBy: currentUser.name || 'System',
      snapshotTakenByUserId: currentUser.id || 'system'
    };

    const snapshotRecord = {
      id: `lock_snapshot_${yearId}`,
      yearId: String(yearId),
      yearLabel: yearObj?.year || yearId,
      finalizedAt: new Date().toISOString(),
      finalizedBy: currentUser.name,
      finalizedByUserId: currentUser.id,
      rateSnapshot,
      entities: (entities || []).map(e => ({ id: e.id, shortName: e.shortName, currency: e.currency }))
    };

    if (this.db.objectStoreNames.contains(STORES.lockedBudgets)) {
      await this.put(STORES.lockedBudgets, snapshotRecord);
    }

    await this.setLockStatus(yearId, 'finalized-locked', {
      finalizedAt: snapshotRecord.finalizedAt,
      finalizedBy: snapshotRecord.finalizedBy,
      finalizedByUserId: snapshotRecord.finalizedByUserId
    });

    await this.logAudit({
      yearId: String(yearId),
      category: 'budget-lock',
      action: 'FINALIZE',
      recordId: `lock_snapshot_${yearId}`,
      description: `Budget CY-${yearObj?.year || yearId} FINALIZED & LOCKED by ${currentUser.name}. All data, exchange rates, travel rates, and TOT rates are now frozen.`,
      changes: { status: 'finalized-locked', snapshotTakenAt: snapshotRecord.finalizedAt }
    });

    console.log(`[BudgetDB] Budget ${yearId} FINALIZED & LOCKED by ${currentUser.name}`);
    return snapshotRecord;
  }

  /**
   * Get the rate snapshot for a finalized budget year.
   * Returns the frozen rates that were in effect at time of finalization.
   */
  async getLockedBudgetSnapshot(yearId) {
    await this.ready;
    if (!this.db || !this.db.objectStoreNames.contains(STORES.lockedBudgets)) return null;
    return this.get(STORES.lockedBudgets, `lock_snapshot_${yearId}`);
  }

  /**
   * Unlock a finalized budget — SUPER ADMIN ONLY.
   * Reverts status to 'draft' and logs audit trail.
   */
  async unlockBudget(yearId, reason = '') {
    await this.ready;
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!currentUser || (currentUser.roleId !== 'role-admin' && !currentUser.isAdmin)) {
      throw new Error('Only Super Admin can unlock a finalized budget.');
    }

    await this.setLockStatus(yearId, 'draft', {
      unlockedAt: new Date().toISOString(),
      unlockedBy: currentUser.name,
      unlockedByUserId: currentUser.id,
      unlockReason: reason
    });

    await this.logAudit({
      yearId: String(yearId),
      category: 'budget-lock',
      action: 'UPDATE',
      recordId: `lock_snapshot_${yearId}`,
      description: `Budget CY-${yearId} UNLOCKED by Super Admin ${currentUser.name}. Reason: "${reason}"`,
      changes: { status: 'draft', unlockedAt: new Date().toISOString() }
    });

    console.warn(`[BudgetDB] Budget ${yearId} UNLOCKED by ${currentUser.name}. Reason: ${reason}`);
    return true;
  }
}

// Singleton instance
const db = new BudgetDB();
window.db = db;
window.STORES = STORES;

