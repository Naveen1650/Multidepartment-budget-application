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

const TABLE_COLUMNS = {
  entities: ['id', 'name', 'short_name', 'country_code', 'dept_prefix', 'country', 'currency', 'flag'],
  departments: ['id', 'number', 'code_template', 'name', 'scope', 'entity_mapping'],
  chart_of_accounts: ['id', 'parent_account', 'gl_description', 'ledger_code', 'linked_input_source'],
  budget_years: ['id', 'year', 'name', 'is_active', 'status', 'conversion_rates'],
  entity_dept_configs: ['id', 'year_id', 'entity_id', 'dept_id', 'is_active'],
  payroll_personnel: [
    'id', 'year_id', 'entity_id', 'dept_id', 'sub_category', 'employee_code',
    'department', 'name', 'designation', 'employee_status', 'date_of_joining',
    'banding', 'level', 'current_monthly_ctc', 'increment_pct', 'increment_value',
    'new_monthly_ctc', 'expense_type', 'location', 'donor', 'activity',
    'condition_area', 'monthly_values', 'total_cy', 'remarks'
  ],
  payroll_eha: [
    'id', 'year_id', 'entity_id', 'dept_id', 'name', 'designation', 'contract_type',
    'monthly_rate', 'location', 'donor', 'activity', 'condition_area',
    'monthly_values', 'total_cy', 'remarks'
  ],
  payroll_fixed_assets: [
    'id', 'year_id', 'entity_id', 'dept_id', 'category', 'description', 'quantity',
    'unit_cost', 'location', 'donor', 'activity', 'condition_area',
    'monthly_values', 'total_cy', 'remarks'
  ],
  non_payroll_costs: [
    'id', 'year_id', 'entity_id', 'dept_id', 'parent_account', 'gl_description',
    'ledger_code', 'sub_category', 'description', 'quantity', 'unit_rate',
    'basis_of_expense', 'location', 'donor', 'activity', 'condition_area',
    'monthly_values', 'total_cy', 'remarks'
  ],
  employees_master: [
    'id', 'employee_code', 'name', 'entity_id', 'dept_id', 'designation',
    'status', 'date_of_joining', 'band', 'level', 'monthly_ctc', 'location'
  ],
  imp_tot_events: [
    'id', 'year_id', 'entity_id', 'dept_id', 'program_name', 'event_name', 'state',
    'target_cadre', 'batches', 'participants_per_batch', 'days', 'location',
    'donor', 'activity', 'condition_area', 'monthly_values', 'total_cy', 'remarks'
  ],
  roles: ['id', 'name', 'tier', 'description', 'badge_color', 'is_system', 'permissions'],
  users: [
    'id', 'name', 'email', 'role_id', 'role_name',
    'assigned_entities', 'assigned_departments', 'category_overrides',
    'is_active', 'last_login'
  ],
  budget_lock_status: ['id', 'year_id', 'entity_id', 'dept_id', 'is_locked', 'locked_by', 'locked_at', 'reason']
};

const STORE_TABLE_MAP = {
  entities: 'entities',
  departments: 'departments',
  chartOfAccounts: 'chart_of_accounts',
  budgetYears: 'budget_years',
  entityDeptConfig: 'entity_dept_configs',
  payrollPersonnel: 'payroll_personnel',
  payrollEHA: 'payroll_eha',
  payrollFixedAsset: 'payroll_fixed_assets',
  nonPayrollCost: 'non_payroll_costs',
  employeesMaster: 'employees_master',
  impTotEvents: 'imp_tot_events',
  roles: 'roles',
  users: 'users',
  budgetLockStatus: 'budget_lock_status'
};

const CloudSyncModule = {
  _client: null,
  _config: {
    enabled: false,
    url: '',
    anonKey: '',
    autoSync: true,
    lastSyncTimestamp: null,
    provider: 'supabase'
  },
  _status: 'local', // 'local' | 'connecting' | 'connected' | 'syncing' | 'error'
  _lastError: null,
  _isSyncing: false,
  _initialSyncDone: false,
  _pushQueue: new Map(), // store:id -> { storeName, record, timer }
  _realtimeSubscription: null,

  init() {
    this.loadConfig();
    this.renderNavbarBadge();
    if (this._config.enabled && this._config.url && this._config.anonKey) {
      this.connect();
    }
  },

  loadConfig() {
    try {
      if (DEFAULT_CLOUD_CONFIG.url && DEFAULT_CLOUD_CONFIG.anonKey) {
        this._config = { ...this._config, ...DEFAULT_CLOUD_CONFIG, enabled: true };
      }
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
      this._client = null;
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

      // Test connectivity by querying budget_years
      const { data, error } = await this._client.from('budget_years').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.warn('Cloud connection check:', error.message);
      }

      this._status = 'connected';
      this._lastError = null;
      this.updateNavbarBadge();
      this.subscribeRealtime();

      // Perform initial bidirectional auto-sync on connection
      if (this._config.autoSync && !this._initialSyncDone) {
        this._initialSyncDone = true;
        this.performInitialSync();
      }
    } catch (err) {
      console.error('Cloud connection failed:', err);
      this._status = 'error';
      this._lastError = err.message || 'Connection failed';
      this.updateNavbarBadge();
    }
  },

  async performInitialSync() {
    try {
      this._status = 'syncing';
      this.updateNavbarBadge();

      // 1. Download latest from cloud to ensure local DB has all team data
      await this.downloadAllFromCloud(() => {}, true);

      // 2. Also ensure any master records in local DB that are not yet in cloud get pushed
      await this.uploadAllToCloud(() => {}, true);

      this._status = 'connected';
      this.updateNavbarBadge();

      if (typeof App !== 'undefined' && App.renderCurrentPage) {
        App.renderCurrentPage();
      }
    } catch (err) {
      console.warn('Initial cloud sync notice:', err.message);
      this._status = 'connected';
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
        Utils.showToast('🔄 Synchronizing data with Cloud Database...', 'info');
      }
      // Download first, then upload
      await this.downloadAllFromCloud();
      await this.uploadAllToCloud();
      
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✓ Cloud data successfully synchronized with all team members!', 'success');
      }
      if (typeof App !== 'undefined' && App.renderCurrentPage) {
        App.renderCurrentPage();
      }
    } catch (err) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Sync warning: ${err.message}`, 'danger');
      }
    }
  },

  // ─── Real-Time Single Record Push (Hooked to db.put & db.add) ───
  pushRecordToCloud(storeName, record) {
    if (!this._client || !record || this._isSyncing) return;
    const table = STORE_TABLE_MAP[storeName] || STORE_TABLE_MAP[STORES[storeName]];
    if (!table) return;

    const queueKey = `${table}:${record.id || 'new'}`;
    if (this._pushQueue.has(queueKey)) {
      clearTimeout(this._pushQueue.get(queueKey).timer);
    }

    const timer = setTimeout(async () => {
      this._pushQueue.delete(queueKey);
      try {
        const sanitized = this._sanitizeRecord(table, record);
        if (!sanitized) return;
        const { error } = await this._client.from(table).upsert([sanitized]);
        if (error) {
          console.warn(`[CloudSync] Error pushing record to ${table}:`, error.message);
        } else {
          // Success dot pulse
          this._flashSyncIndicator();
        }
      } catch (err) {
        console.warn(`[CloudSync] Exception pushing to ${table}:`, err);
      }
    }, 250); // 250ms debounce for rapid edits

    this._pushQueue.set(queueKey, { storeName, record, timer });
  },

  // ─── Real-Time Batch Push (Hooked to db.putMany) ───
  async pushManyToCloud(storeName, records) {
    if (!this._client || !records || records.length === 0 || this._isSyncing) return;
    const table = STORE_TABLE_MAP[storeName] || STORE_TABLE_MAP[STORES[storeName]];
    if (!table) return;

    try {
      const sanitized = this._sanitizeBatch(table, records);
      if (!sanitized || sanitized.length === 0) return;

      // Chunk in groups of 100 for reliable transport
      for (let i = 0; i < sanitized.length; i += 100) {
        const chunk = sanitized.slice(i, i + 100);
        const { error } = await this._client.from(table).upsert(chunk);
        if (error) console.warn(`[CloudSync] Error batch pushing to ${table}:`, error.message);
      }
      this._flashSyncIndicator();
    } catch (err) {
      console.warn(`[CloudSync] Exception batch pushing to ${table}:`, err);
    }
  },

  // ─── Real-Time Cloud Deletion ───
  async deleteFromCloud(storeName, id) {
    if (!this._client || !id) return false;
    const table = STORE_TABLE_MAP[storeName] || STORE_TABLE_MAP[STORES[storeName]];
    if (!table) return false;

    try {
      const { error } = await this._client.from(table).delete().eq('id', id);
      if (error) {
        console.warn(`[CloudSync] Error deleting id="${id}" from ${table}:`, error.message);
        return false;
      }
      this._flashSyncIndicator();
      return true;
    } catch (err) {
      console.warn(`[CloudSync] Exception deleting from ${table}:`, err);
      return false;
    }
  },

  async deleteEntityFromCloud(entityId) {
    if (!this._client || !entityId) return false;
    try {
      await this._client.from('entities').delete().eq('id', entityId);
      await this._client.from('entity_dept_configs').delete().eq('entity_id', entityId);
      await this._client.from('payroll_personnel').delete().eq('entity_id', entityId);
      await this._client.from('payroll_eha').delete().eq('entity_id', entityId);
      await this._client.from('payroll_fixed_assets').delete().eq('entity_id', entityId);
      await this._client.from('non_payroll_costs').delete().eq('entity_id', entityId);
      return true;
    } catch (err) {
      console.warn(`[CloudSync] Exception deleting entity ${entityId}:`, err);
      return false;
    }
  },

  disconnect() {
    this._client = null;
    this._status = 'local';
    if (this._realtimeSubscription) {
      try { this._realtimeSubscription.unsubscribe(); } catch(e) {}
      this._realtimeSubscription = null;
    }
    this.updateNavbarBadge();
  },

  async testConnection(url, anonKey) {
    try {
      if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        return { success: false, message: 'Cloud client SDK is loading. Please try again in a moment.' };
      }
      const testClient = window.supabase.createClient(url, anonKey);
      const { data, error } = await testClient.from('budget_years').select('id').limit(1);
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully reached cloud instance!' };
    } catch (e) {
      return { success: false, message: e.message || 'Network error connecting to cloud endpoint' };
    }
  },

  // ─── Real-Time WebSocket Subscriptions ───
  subscribeRealtime() {
    if (!this._client || typeof this._client.channel !== 'function') return;
    if (this._realtimeSubscription) return;

    try {
      const channel = this._client.channel('noora_cloud_sync_realtime');

      // Listen to changes across all tables
      const tablesToListen = [
        'budget_years', 'entities', 'departments', 'entity_dept_configs',
        'payroll_personnel', 'payroll_eha', 'payroll_fixed_assets',
        'non_payroll_costs', 'employees_master', 'imp_tot_events', 'budget_lock_status'
      ];

      tablesToListen.forEach(table => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, async (payload) => {
          console.log(`[Realtime] Remote change detected on table "${table}":`, payload.eventType);

          // Find matching local store
          const storeName = Object.keys(STORE_TABLE_MAP).find(k => STORE_TABLE_MAP[k] === table);
          if (storeName && typeof db !== 'undefined' && STORES[storeName]) {
            const actualStore = STORES[storeName];
            if (payload.eventType === 'DELETE' && payload.old && payload.old.id) {
              await db.delete(actualStore, payload.old.id);
            } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
              const camel = CloudSyncModule._toCamelCase(payload.new);
              camel._fromCloud = true;
              await db.put(actualStore, camel);
            }
          }

          if (table === 'budget_lock_status' && typeof Auth !== 'undefined' && Auth.invalidateLockCache) {
            Auth.invalidateLockCache();
          }

          // Debounced re-render of active view
          if (typeof App !== 'undefined' && App.renderActiveModule) {
            App.renderActiveModule();
          }
        });
      });

      this._realtimeSubscription = channel.subscribe();
    } catch (e) {
      console.warn('Realtime subscription not active:', e);
    }
  },

  // ─── Full Store Upload & Download ───
  async uploadAllToCloud(progressCb = () => {}, silent = false) {
    if (!this._client) return { skipped: true };
    if (this._isSyncing) return { skipped: true };

    this._isSyncing = true;
    if (!silent) {
      this._status = 'syncing';
      this.updateNavbarBadge();
    }

    try {
      const stores = Object.keys(STORE_TABLE_MAP);
      for (let i = 0; i < stores.length; i++) {
        const storeKey = stores[i];
        const storeName = STORES[storeKey] || storeKey;
        const table = STORE_TABLE_MAP[storeKey];
        progressCb(`Uploading ${table} (${i + 1}/${stores.length})...`);
        
        const records = await db.getAll(storeName);
        if (records && records.length > 0) {
          const sanitized = this._sanitizeBatch(table, records);
          if (sanitized && sanitized.length > 0) {
            for (let j = 0; j < sanitized.length; j += 100) {
              const chunk = sanitized.slice(j, j + 100);
              const { error } = await this._client.from(table).upsert(chunk);
              if (error) console.warn(`[CloudSync] Error uploading table ${table}:`, error.message);
            }
          }
        }
      }

      this._config.lastSyncTimestamp = new Date().toISOString();
      try { localStorage.setItem('noora_cloud_sync_config', JSON.stringify(this._config)); } catch (e) {}
      this._status = 'connected';
      progressCb('Upload completed successfully!');
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

  async downloadAllFromCloud(progressCb = () => {}, silent = false) {
    if (!this._client) return { skipped: true };
    if (this._isSyncing) return { skipped: true };

    this._isSyncing = true;
    if (!silent) {
      this._status = 'syncing';
      this.updateNavbarBadge();
    }

    try {
      const stores = Object.keys(STORE_TABLE_MAP);
      for (let i = 0; i < stores.length; i++) {
        const storeKey = stores[i];
        const storeName = STORES[storeKey] || storeKey;
        const table = STORE_TABLE_MAP[storeKey];
        progressCb(`Downloading ${table} (${i + 1}/${stores.length})...`);

        const { data, error } = await this._client.from(table).select('*');
        if (!error && data && data.length > 0) {
          for (const raw of data) {
            const camel = this._toCamelCase(raw);
            camel._fromCloud = true; // prevent bounce-back push
            await db.put(storeName, camel);
          }
        }
      }

      this._config.lastSyncTimestamp = new Date().toISOString();
      try { localStorage.setItem('noora_cloud_sync_config', JSON.stringify(this._config)); } catch (e) {}
      this._status = 'connected';
      progressCb('Download completed successfully!');
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

  // ─── Schema Sanitizers & Key Normalizers ───
  _sanitizeRecord(table, record) {
    if (!record || typeof record !== 'object') return null;
    const allowed = TABLE_COLUMNS[table];
    const snake = this._toSnakeCase(record);
    const sanitized = {};

    if (allowed) {
      for (const col of allowed) {
        if (snake[col] !== undefined && snake[col] !== null) {
          sanitized[col] = snake[col];
        }
      }
    } else {
      Object.assign(sanitized, snake);
    }

    // Ensure valid id
    if (sanitized.id === undefined || sanitized.id === null || sanitized.id === '') {
      if (record.id !== undefined && record.id !== null && record.id !== '') {
        sanitized.id = record.id;
      }
    }

    return sanitized;
  },

  _sanitizeBatch(table, records) {
    if (!records || !Array.isArray(records)) return [];
    const allowed = TABLE_COLUMNS[table] || [];

    return records.map((record, index) => {
      const snake = this._toSnakeCase(record);
      const sanitized = {};
      
      if (allowed.length > 0) {
        for (const col of allowed) {
          sanitized[col] = (snake[col] !== undefined && snake[col] !== null) ? snake[col] : null;
        }
      } else {
        Object.assign(sanitized, snake);
      }

      if (sanitized.id === null || sanitized.id === undefined || sanitized.id === '') {
        if (record.id) {
          sanitized.id = record.id;
        } else if (['chart_of_accounts', 'entity_dept_configs', 'payroll_personnel', 'payroll_eha', 'payroll_fixed_assets', 'non_payroll_costs', 'employees_master', 'imp_tot_events', 'budget_lock_status'].includes(table)) {
          sanitized.id = index + 1;
        }
      }

      return sanitized;
    });
  },

  // ─── Case Conversion Utilities ───
  _toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('_')) continue; // Skip internal flags like _fromCloud
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

  _flashSyncIndicator() {
    const dot = document.querySelector('.cloud-blip-dot');
    if (dot) {
      dot.classList.add('syncing');
      setTimeout(() => dot.classList.remove('syncing'), 800);
    }
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
      tooltip = `Cloud Database: Connected & Live Synced (Supabase)`;
    } else if (this._status === 'syncing') {
      dotClass = 'syncing';
      tooltip = 'Cloud Database: Synchronizing with team...';
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
