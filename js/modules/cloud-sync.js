// ============================================================
// NOORA HEALTH BUDGET APP — Cloud Sync & Work Cloud Connector
// Modular synchronization engine supporting Supabase / PostgreSQL
// ============================================================

// Default cloud database configuration (applied automatically for all users on any device)
const DEFAULT_CLOUD_CONFIG = {
  enabled: true,
  url: 'https://bvippstctbtpvrdhxvwk.supabase.co',
  anonKey: 'sb_publishable_Ax6asJzLrxX58onAlOhGcQ_ftqqDEy6',
  autoSync: true,
  provider: 'supabase'
};

const CloudSyncModule = {
  _client: null,
  _config: {
    enabled: false,
    url: '',
    anonKey: '',
    autoSync: true,
    lastSyncTimestamp: null,
    provider: 'supabase' // 'supabase' | 'rest-postgresql'
  },
  _status: 'local', // 'local' | 'connecting' | 'connected' | 'syncing' | 'error'
  _lastError: null,
  _syncQueue: [],
  _isSyncing: false,
  _initialSyncDone: false,

  init() {
    this.loadConfig();
    this.renderNavbarBadge();
    if (this._config.enabled && this._config.url && this._config.anonKey) {
      this.connect();
    }
  },

  loadConfig() {
    try {
      // Apply built-in default config first (so other users connect automatically)
      if (DEFAULT_CLOUD_CONFIG.url && DEFAULT_CLOUD_CONFIG.anonKey) {
        this._config = { ...this._config, ...DEFAULT_CLOUD_CONFIG, enabled: true };
      }
      // Apply browser-specific user overrides if saved and valid
      const saved = localStorage.getItem('noora_cloud_sync_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url && parsed.anonKey) {
          this._config = { ...this._config, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load cloud sync config:', e);
    }
  },

  saveConfig(newConfig) {
    this._config = { ...this._config, ...newConfig };
    try {
      localStorage.setItem('noora_cloud_sync_config', JSON.stringify(this._config));
    } catch (e) {
      console.warn('Could not save cloud sync config:', e);
    }
    if (this._config.enabled && this._config.url && this._config.anonKey) {
      this._client = null; // reset client to re-connect with new credentials
      this.connect();
    } else {
      this.disconnect();
    }
    this.updateNavbarBadge();
  },

  async connect() {
    if (!this._config.url || !this._config.anonKey) {
      this._status = 'local';
      this.updateNavbarBadge();
      return;
    }

    if (this._client && this._status === 'connected') {
      return;
    }

    this._status = 'connecting';
    this.updateNavbarBadge();

    try {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        this._client = window.supabase.createClient(this._config.url, this._config.anonKey);
      } else {
        throw new Error('Supabase client SDK not available');
      }

      // Test connectivity by checking server ping / budget_years table
      const { data, error } = await this._client.from('budget_years').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.warn('Cloud connection warning:', error.message);
      }

      this._status = 'connected';
      this._lastError = null;
      this.updateNavbarBadge();
      this.subscribeRealtime();

      // One-time initial background sync on app load (without infinite loop)
      if (this._config.autoSync && !this._initialSyncDone) {
        this._initialSyncDone = true;
        this.downloadAllFromCloud().then(() => {
          if (typeof App !== 'undefined' && App.renderCurrentPage) {
            App.renderCurrentPage();
          }
        }).catch(err => {
          console.warn('Initial cloud sync download warning:', err);
        });
      }
    } catch (err) {
      console.error('Cloud connection failed:', err);
      this._status = 'error';
      this._lastError = err.message || 'Connection failed';
      this.updateNavbarBadge();
    }
  },

  async syncNow() {
    if (!this._client) {
      if (this._config.url && this._config.anonKey) {
        await this.connect();
      } else {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Cloud database is not configured. Please enter your credentials in Cloud Settings.', 'warning');
        }
        if (typeof App !== 'undefined') App.navigateTo('config-cloud-sync');
        return;
      }
    }
    try {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('🔄 Syncing latest data from Cloud Database...', 'info');
      }
      await this.downloadAllFromCloud();
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✓ Cloud data successfully synchronized!', 'success');
      }
      if (typeof App !== 'undefined' && App.renderCurrentPage) {
        App.renderCurrentPage();
      }
    } catch (err) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Sync failed: ${err.message}`, 'danger');
      }
    }
  },

  disconnect() {
    this._client = null;
    this._status = 'local';
    this.updateNavbarBadge();
  },

  async testConnection(url, anonKey) {
    try {
      if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        return { success: false, message: 'Cloud client SDK is loading. Please try again in a moment.' };
      }
      const testClient = window.supabase.createClient(url, anonKey);
      const { data, error } = await testClient.from('budget_years').select('count', { count: 'exact', head: true });
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully reached cloud instance!' };
    } catch (e) {
      return { success: false, message: e.message || 'Network error connecting to cloud endpoint' };
    }
  },

  // ─── Real-Time Subscriptions ───
  subscribeRealtime() {
    if (!this._client || typeof this._client.channel !== 'function') return;

    try {
      const channel = this._client.channel('public:all');
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_lock_status' }, async (payload) => {
          console.log('Realtime budget lock change:', payload);
          if (typeof Auth !== 'undefined' && Auth.invalidateLockCache) {
            Auth.invalidateLockCache();
          }
          if (typeof App !== 'undefined' && App.renderActiveModule) {
            App.renderActiveModule();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not active:', e);
    }
  },

  // ─── Cloud Sync Operations ───
  async uploadAllToCloud(progressCb = () => {}) {
    if (!this._client) throw new Error('Cloud client is not connected');
    if (this._isSyncing) return { skipped: true };

    this._isSyncing = true;
    this._status = 'syncing';
    this.updateNavbarBadge();

    const storeTableMap = {
      [STORES.entities]: 'entities',
      [STORES.departments]: 'departments',
      [STORES.chartOfAccounts]: 'chart_of_accounts',
      [STORES.budgetYears]: 'budget_years',
      [STORES.entityDeptConfig]: 'entity_dept_configs',
      [STORES.payrollPersonnel]: 'payroll_personnel',
      [STORES.payrollEHA]: 'payroll_eha',
      [STORES.payrollFixedAsset]: 'payroll_fixed_assets',
      [STORES.nonPayrollCost]: 'non_payroll_costs',
      [STORES.employeesMaster]: 'employees_master',
      [STORES.impTotEvents]: 'imp_tot_events',
      [STORES.roles]: 'roles',
      [STORES.users]: 'users'
    };

    try {
      const stores = Object.keys(storeTableMap);
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        const table = storeTableMap[store];
        progressCb(`Uploading ${table} (${i + 1}/${stores.length})...`);
        const records = await db.getAll(store);
        if (records && records.length > 0) {
          const formatted = records.map(r => this._toSnakeCase(r));
          const { error } = await this._client.from(table).upsert(formatted);
          if (error) console.warn(`Error uploading table ${table}:`, error.message);
        }
      }

      this._config.lastSyncTimestamp = new Date().toISOString();
      try {
        localStorage.setItem('noora_cloud_sync_config', JSON.stringify(this._config));
      } catch (e) {}
      this._status = 'connected';
      progressCb('Upload to cloud completed successfully!');
      return { success: true };
    } catch (err) {
      this._status = 'error';
      this._lastError = err.message;
      throw err;
    } finally {
      this._isSyncing = false;
      this.updateNavbarBadge();
    }
  },

  async downloadAllFromCloud(progressCb = () => {}) {
    if (!this._client) throw new Error('Cloud client is not connected');
    if (this._isSyncing) return { skipped: true };

    this._isSyncing = true;
    this._status = 'syncing';
    this.updateNavbarBadge();

    const storeTableMap = {
      [STORES.entities]: 'entities',
      [STORES.departments]: 'departments',
      [STORES.chartOfAccounts]: 'chart_of_accounts',
      [STORES.budgetYears]: 'budget_years',
      [STORES.entityDeptConfig]: 'entity_dept_configs',
      [STORES.payrollPersonnel]: 'payroll_personnel',
      [STORES.payrollEHA]: 'payroll_eha',
      [STORES.payrollFixedAsset]: 'payroll_fixed_assets',
      [STORES.nonPayrollCost]: 'non_payroll_costs',
      [STORES.employeesMaster]: 'employees_master',
      [STORES.impTotEvents]: 'imp_tot_events',
      [STORES.roles]: 'roles',
      [STORES.users]: 'users'
    };

    try {
      const stores = Object.keys(storeTableMap);
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        const table = storeTableMap[store];
        progressCb(`Downloading ${table} (${i + 1}/${stores.length})...`);
        const { data, error } = await this._client.from(table).select('*');
        if (!error && data && data.length > 0) {
          const camelCased = data.map(r => this._toCamelCase(r));
          for (const item of camelCased) {
            await db.put(store, item);
          }
        }
      }

      this._config.lastSyncTimestamp = new Date().toISOString();
      try {
        localStorage.setItem('noora_cloud_sync_config', JSON.stringify(this._config));
      } catch (e) {}
      this._status = 'connected';
      progressCb('Download from cloud completed successfully!');
      return { success: true };
    } catch (err) {
      this._status = 'error';
      this._lastError = err.message;
      throw err;
    } finally {
      this._isSyncing = false;
      this.updateNavbarBadge();
    }
  },

  // ─── Case Conversion Utilities ───
  _toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      res[snakeKey] = v;
    }
    return res;
  },

  _toCamelCase(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      const camelKey = k.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
      res[camelKey] = v;
    }
    return res;
  },

  // ─── Navbar Status Pill Component ───
  renderNavbarBadge() {
    let container = document.getElementById('cloud-sync-badge-container');
    if (!container) {
      const headerRight = document.querySelector('.header-right') || document.querySelector('.navbar-actions');
      if (!headerRight) return;
      container = document.createElement('div');
      container.id = 'cloud-sync-badge-container';
      container.className = 'cloud-sync-badge-container';
      headerRight.insertBefore(container, headerRight.firstChild);
    }
    this.updateNavbarBadge();
  },

  updateNavbarBadge() {
    const container = document.getElementById('cloud-sync-badge-container');
    if (!container) return;

    let dotClass = 'local';
    let tooltip = 'Storage: Local Offline Mode (Click to configure cloud)';

    if (this._status === 'connecting') {
      dotClass = 'connecting';
      tooltip = 'Cloud Database: Connecting...';
    } else if (this._status === 'connected') {
      dotClass = 'connected';
      tooltip = 'Cloud Database: Connected & Synced (Supabase)';
    } else if (this._status === 'syncing') {
      dotClass = 'syncing';
      tooltip = 'Cloud Database: Synchronizing...';
    } else if (this._status === 'error') {
      dotClass = 'error';
      tooltip = `Cloud Database: Offline (${this._lastError || 'Disconnected'})`;
    }

    container.innerHTML = `
      <button type="button" class="cloud-blip-btn" onclick="ConfigModule.openSettingsModal('cloud-sync')" title="${tooltip}" aria-label="${tooltip}">
        <span class="cloud-blip-dot ${dotClass}"></span>
      </button>
    `;
  }
};

window.CloudSyncModule = CloudSyncModule;
