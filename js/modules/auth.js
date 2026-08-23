// ============================================================
// NOORA HEALTH BUDGET APP — Authorization & RBAC Module (auth.js)
// Multi-Role Assignment Engine | Budget Lock Awareness | Granular RBAC
// ============================================================

const Auth = {
  _currentUser: null,
  _users: [],
  _roles: [],
  _lockStatusCache: {},

  CATEGORIES: [
    // ─── 1. Parent Expense Accounts (High-Level COA Groups) ───
    { key: 'salaries', label: 'Salaries and Wages', icon: '💼', group: 'Parent Accounts', isParentAccount: true },
    { key: 'gratuity', label: 'Health & Retirement Benefits (Gratuity & Bonus)', icon: '🎁', group: 'Parent Accounts', isParentAccount: true },
    { key: 'other-staff', label: 'Other Staff Expenses', icon: '👥', group: 'Parent Accounts', isParentAccount: true },
    { key: 'eha', label: 'Resource Persons (Direct Consultants / EHA)', icon: '🤝', group: 'Parent Accounts', isParentAccount: true },
    { key: 'fixed-assets', label: 'Fixed Assets (CapEx)', icon: '💻', group: 'Parent Accounts', isParentAccount: true },
    { key: 'travel', label: 'Travel & Lodging Expenses', icon: '✈️', group: 'Parent Accounts', isParentAccount: true },
    { key: 'supplies', label: 'Supplies & Printing', icon: '🖨️', group: 'Parent Accounts', isParentAccount: true },
    { key: 'communication', label: 'Communication Expenses', icon: '📡', group: 'Parent Accounts', isParentAccount: true },
    { key: 'office', label: 'Office Expenses', icon: '🏢', group: 'Parent Accounts', isParentAccount: true },
    { key: 'professional', label: 'Professional Charges', icon: '💼', group: 'Parent Accounts', isParentAccount: true },
    { key: 'other-costs', label: 'Other Operating Expenses', icon: '📑', group: 'Parent Accounts', isParentAccount: true },
    { key: 'imp-tot-rates', label: 'ToT Program Budget (IMP)', icon: '🎯', group: 'Parent Accounts', isParentAccount: true },
    { key: 'total-dept-cost', label: 'Master Department Total Rollup', icon: '📊', group: 'Parent Accounts', isParentAccount: true },

    // ─── 2. Employee Master ───
    { key: 'employees', label: 'Employee Master & Personnel Records', icon: '🧑‍💼', group: 'Employee Master', isParentAccount: false },

    // ─── 3. Prior Period Costs ───
    { key: 'prior-period', label: 'Prior Period Costs (View / Edit / Upload)', icon: '⏳', group: 'Prior Period Costs', isParentAccount: false },

    // ─── 4. Reports Settings & Analytics ───
    { key: 'reports', label: 'Reports Settings & Financial Analytics', icon: '📈', group: 'Reports Settings', isParentAccount: false },

    // ─── 5. System Configurations ───
    { key: 'config', label: 'All Other Configurations (Entities, Depts, Rates, Dimensions)', icon: '⚙️', group: 'All Other Configurations', isParentAccount: false }
  ],

  SYSTEM_MODULES: [
    { key: 'employees', label: 'Employee Master & Personnel Records', icon: '🧑‍💼', desc: 'Controls permissions to view, add, edit, delete, and import employee records, salary bands, and designations' },
    { key: 'prior-period', label: 'Prior Period Costs Access & Upload Settings', icon: '⏳', desc: 'Controls permissions to view, edit, bulk upload, and manage prior year historical reference costs' },
    { key: 'reports', label: 'Financial Reports & Analytical Settings', icon: '📈', desc: 'Controls access to master department rollups, multi-entity consolidated reports, donor analytics, and exports' },
    { key: 'config', label: 'All Other System Configurations', icon: '⚙️', desc: 'Controls access to entity setup, department directories, budget cycle deadlines/locks, exchange rates, and dimensions' }
  ],

  OPERATIONS: [
    { key: 'view', label: 'View', badge: 'badge-subtle', icon: '👁️' },
    { key: 'add', label: 'Add', badge: 'badge-cyan', icon: '➕' },
    { key: 'edit', label: 'Edit', badge: 'badge-primary', icon: '✏️' },
    { key: 'delete', label: 'Delete', badge: 'badge-danger', icon: '🗑️' },
    { key: 'remarks', label: 'Remarks', badge: 'badge-info', icon: '💬' },
    { key: 'review', label: 'Review', badge: 'badge-amber', icon: '🔍' },
    { key: 'approve', label: 'Approve', badge: 'badge-emerald', icon: '✅' },
    { key: 'finalize', label: 'Finalize', badge: 'badge-purple', icon: '🔒' }
  ],

  ROLE_HIERARCHY_LEVELS: {
    'role-admin': 100,
    'role-entity-admin': 90,
    'role-finalizer': 85,
    'role-finance-mgr': 80,
    'role-country-director': 75,
    'role-hr-team': 70,
    'role-dept-lead': 60,
    'role-data-entry': 40,
    'role-auditor': 30
  },

  async init() {
    await db.ready;
    this._users = await db.getUsers();
    this._roles = await db.getRoles();
    await this.refreshAllLockStatuses();

    const storedUserId = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('noora_active_user_id') || 'user-admin')
      : 'user-admin';

    this._currentUser = this._users.find(u => u.id === storedUserId) || this._users[0];
    this._enrichCurrentUser();
    console.log('[Auth] Initialized as ' + (this._currentUser ? this._currentUser.name : 'Unknown') + ' (' + (this._currentUser ? this._currentUser.roleName : 'None') + ')');
  },

  _enrichCurrentUser() {
    if (!this._currentUser) return;
    const primaryRole = this._roles.find(r => r.id === this._currentUser.roleId);
    this._currentUser.roleName = primaryRole ? primaryRole.name : (this._currentUser.roleId || 'Standard User');
    this._currentUser.isAdmin = this._currentUser.roleId === 'role-admin' || (primaryRole && primaryRole.isSuperAdmin);
    this._currentUser.isEntityAdmin = this._currentUser.roleId === 'role-entity-admin' || (primaryRole && primaryRole.isEntityAdmin);
    this._currentUser.isFinalizer = this._currentUser.roleId === 'role-finalizer' || (primaryRole && primaryRole.isFinalizer);

    if (!this._currentUser.roleAssignments || !this._currentUser.roleAssignments.length) {
      this._currentUser.roleAssignments = [
        {
          assignmentId: 'asgn_primary',
          roleId: this._currentUser.roleId,
          entities: this._currentUser.entities || 'all',
          departments: this._currentUser.departments || 'all',
          categoryOverrides: this._currentUser.categoryOverrides || {},
          lineItemOverrides: this._currentUser.lineItemOverrides || {}
        }
      ];
    }
  },

  getCurrentUser() {
    return this._currentUser;
  },

  async getAllUsers() {
    await db.ready;
    this._users = await db.getUsers();
    return this._users;
  },

  async getAllRoles() {
    await db.ready;
    this._roles = await db.getRoles();
    return this._roles;
  },

  async setCurrentUser(userId) {
    await db.ready;
    this._users = await db.getUsers();
    this._roles = await db.getRoles();
    const user = this._users.find(u => u.id === userId);
    if (user) {
      this._currentUser = user;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('noora_active_user_id', userId);
        }
      } catch (e) {}
      this._enrichCurrentUser();
      Utils.showToast('Switched active user to ' + user.name + ' (' + this._currentUser.roleName + ')', 'info');
      if (typeof App !== 'undefined') {
        if (App.populateGlobalSelectors) App.populateGlobalSelectors();
        if (App.renderCurrentPage) App.renderCurrentPage();
        if (App.updateNotificationBadge) App.updateNotificationBadge();
        if (App.updateSidebarVisibility) App.updateSidebarVisibility();
      }
    }
  },

  _getMatchingAssignments(user, entityId, deptId) {
    const assignments = user.roleAssignments || [];
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/^in-|^us-|^bd-|^indo-|^np-/, '');

    return assignments.filter(a => {
      if (a.entities !== 'all') {
        const ents = Array.isArray(a.entities) ? a.entities : [a.entities];
        if (entityId && !ents.some(e => e.toLowerCase() === entityId.toLowerCase())) {
          return false;
        }
      }
      if (a.departments !== 'all') {
        const depts = Array.isArray(a.departments) ? a.departments : [a.departments];
        if (deptId) {
          const directMatch = depts.some(d => d.toLowerCase() === deptId.toLowerCase());
          const normMatch = depts.some(d => norm(d) === norm(deptId));
          if (!directMatch && !normMatch) return false;
        }
      }
      return true;
    });
  },

  getCategoryForLineItem(lineItem) {
    if (!lineItem) return null;
    if (typeof lineItem === 'string') {
      const s = lineItem.toLowerCase();
      if (this.CATEGORIES.some(c => c.key === s)) return s;
    }
    if (lineItem.category && this.CATEGORIES.some(c => c.key === lineItem.category)) {
      return lineItem.category;
    }

    const parent = String(lineItem.parentAccount || '').toLowerCase();
    const glDesc = String(lineItem.glDescription || lineItem.itemName || '').toLowerCase();
    const ledger = String(lineItem.ledgerCode || '').trim();

    if (!parent && !glDesc && !ledger) {
      return lineItem.category || null;
    }

    if (parent.includes('salaries') || glDesc.includes('salaries') || glDesc.includes('wages') || ledger.startsWith('911')) return 'salaries';
    if (parent.includes('other staff') || parent.includes('training') || glDesc.includes('training') || glDesc.includes('development') || ledger.startsWith('913')) return 'other-staff';
    if (parent.includes('gratuity') || parent.includes('bonus') || parent.includes('retirement') || glDesc.includes('gratuity') || glDesc.includes('bonus') || ledger.startsWith('912')) return 'gratuity';
    if (parent.includes('resource') || parent.includes('eha') || glDesc.includes('consultant') || glDesc.includes('eha') || ledger.startsWith('921')) return 'eha';
    if (parent.includes('fixed asset') || parent.includes('asset') || parent.includes('capex') || glDesc.includes('laptop') || glDesc.includes('printer') || ledger.startsWith('113')) return 'fixed-assets';
    if (parent.includes('tot') || glDesc.includes('tot') || glDesc.includes('program')) return 'imp-tot-rates';
    if (parent.includes('travel') || glDesc.includes('travel') || glDesc.includes('lodging') || glDesc.includes('hotel') || glDesc.includes('air fare') || ledger.startsWith('931')) return 'travel';
    if (parent.includes('supplies') || parent.includes('printing') || glDesc.includes('printing') || ledger.startsWith('932')) return 'supplies';
    if (parent.includes('communication') || glDesc.includes('internet') || glDesc.includes('telecommunication') || ledger.startsWith('933')) return 'communication';
    if (parent.includes('office') || glDesc.includes('software') || glDesc.includes('stationery') || ledger.startsWith('934')) return 'office';
    if (parent.includes('professional') || glDesc.includes('consultan') || glDesc.includes('consultant') || ledger.startsWith('937')) return 'professional';
    return 'other-costs';
  },

  canViewRemark(remark, user) {
    if (!remark) return false;
    user = user || this.getCurrentUser();
    if (!user) return true;
    if (user.isAdmin || user.roleId === 'role-admin') return true;

    // Direct creator or assigned assignee can always view
    if (remark.assignedToUserId === user.id || remark.assignedByUserId === user.id) return true;

    // Entity and dept scope check
    if (remark.entityId && !this.canAccessEntity(remark.entityId)) return false;
    if (remark.entityId && remark.deptId && !this.canAccessDept(remark.entityId, remark.deptId)) return false;

    return true;
  },

  async getAccessibleUsersForDept(entityId, deptId) {
    await db.ready;
    let allUsers = [];
    try {
      allUsers = await db.getUsers();
    } catch (e) {
      console.warn('Error fetching users in getAccessibleUsersForDept:', e);
    }
    if (!allUsers || allUsers.length === 0) {
      const seedObj = typeof SEED_DATA !== 'undefined' ? SEED_DATA : (typeof window !== 'undefined' ? window.SEED_DATA : {});
      allUsers = seedObj.users || [];
    }

    // Return users mapped with role name for easy tagging
    const roles = await db.getRoles();
    return allUsers.map(u => {
      const r = roles.find(role => role.id === u.roleId);
      return {
        ...u,
        roleName: r ? r.name : (u.roleName || u.title || 'Team Member')
      };
    });
  },

  async saveLineItemRolePermissions(roleId, lineKey, perms) {
    const roles = await db.getRoles();
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    if (!role.lineItemPermissions) role.lineItemPermissions = {};
    role.lineItemPermissions[lineKey] = perms;
    await db.saveRole(role);
    await db.logAudit({
      category: 'config',
      action: 'UPDATE',
      recordId: role.id,
      description: `Updated line item permissions for role "${role.name}" on line "${lineKey}"`
    });
  },

  async saveLineItemUserOverride(userId, lineKey, perms) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!user.lineItemOverrides) user.lineItemOverrides = {};
    user.lineItemOverrides[lineKey] = perms;
    await db.saveUser(user);
    await db.logAudit({
      category: 'config',
      action: 'UPDATE',
      recordId: user.id,
      description: `Updated line item override for user "${user.name}" on line "${lineKey}"`
    });
  },

  _resolvePermissionFromAssignments(assignments, operation, category, context) {
    const ledgerCode = context?.ledgerCode ? String(context.ledgerCode).trim() : (typeof context === 'string' ? context : null);
    const glDescSlug = context?.glDescription ? Utils.slugify(context.glDescription) : null;
    const directKey = context?.lineKey || ledgerCode || glDescSlug;
    const targetCat = category || (context ? this.getCategoryForLineItem(context) : null);
    const userOverrides = this._currentUser?.categoryOverrides || {};
    const userLineOverrides = this._currentUser?.lineItemOverrides || {};

    for (const a of assignments) {
      // 1. User Line Item Overrides (Merged user-level and assignment-level overrides)
      const lineOverrides = { ...userLineOverrides, ...(a.lineItemOverrides || {}) };
      if (directKey && lineOverrides[directKey]) {
        const lineOverride = lineOverrides[directKey] ||
                             (ledgerCode && lineOverrides[ledgerCode]) ||
                             (glDescSlug && lineOverrides[glDescSlug]);
        if (lineOverride && typeof lineOverride[operation] === 'boolean') {
          return lineOverride[operation];
        }
      }

      // 2. User Category Overrides (Merged user-level and assignment-level overrides)
      const catOverrides = { ...userOverrides, ...(a.categoryOverrides || {}) };
      if (targetCat && catOverrides[targetCat]) {
        if (typeof catOverrides[targetCat][operation] === 'boolean') {
          return catOverrides[targetCat][operation];
        }
      }

      // 3. Role-Level Permissions (Defined in Role Hierarchy / Setup: Parent Accounts & Modules)
      const role = this._roles.find(r => r.id === a.roleId);
      if (role) {
        // 3a. Role Line Item Permissions (Configured via Granular Line-Item Matrix)
        if (role.lineItemPermissions && directKey) {
          const roleLinePerm = role.lineItemPermissions[directKey] ||
                               (ledgerCode && role.lineItemPermissions[ledgerCode]) ||
                               (glDescSlug && role.lineItemPermissions[glDescSlug]);
          if (roleLinePerm && typeof roleLinePerm[operation] === 'boolean') {
            return roleLinePerm[operation];
          }
        }

        // 3b. Role Parent Account & Module Permissions
        if (role.permissions) {
          if (targetCat && role.permissions[targetCat] && typeof role.permissions[targetCat][operation] === 'boolean') {
            return role.permissions[targetCat][operation];
          }
          if (category === 'other-costs' && !directKey && (role.permissions['other-costs']?.[operation] === true || role.permissions['travel']?.[operation] === true || role.permissions['supplies']?.[operation] === true || role.permissions['communication']?.[operation] === true || role.permissions['office']?.[operation] === true || role.permissions['professional']?.[operation] === true)) {
            return true;
          }
          if (context?.parentAccount && role.permissions[context.parentAccount] && typeof role.permissions[context.parentAccount][operation] === 'boolean') {
            return role.permissions[context.parentAccount][operation];
          }
        }
      }
    }
    return false;
  },

  async refreshAllLockStatuses() {
    try {
      this._lockStatusCache = {};
      const lockRecs = await db.getAll(STORES.budgetLockStatus);
      lockRecs.forEach(l => {
        if (l.yearId && l.status) {
          this._lockStatusCache[String(l.yearId)] = l.status;
          if (l.entityId) {
            this._lockStatusCache[`${l.yearId}_${l.entityId}`] = l.status;
          }
        }
        if (l.id && l.status) {
          this._lockStatusCache[String(l.id)] = l.status;
        }
      });
      const years = await db.getAll(STORES.budgetYears);
      years.forEach(y => {
        const s = y.status || 'draft';
        this._lockStatusCache[String(y.id)] = s;
        if (y.year) this._lockStatusCache[String(y.year)] = s;
        if (y.entityStatuses && typeof y.entityStatuses === 'object') {
          Object.entries(y.entityStatuses).forEach(([entId, stat]) => {
            if (stat) {
              this._lockStatusCache[`${y.id}_${entId}`] = stat;
              if (y.year) this._lockStatusCache[`${y.year}_${entId}`] = stat;
            }
          });
        }
      });
    } catch (e) {
      console.warn('[Auth] refreshAllLockStatuses error:', e);
    }
  },

  async refreshLockStatus(yearId, entityId = null) {
    if (!yearId) return;
    try {
      if (entityId) {
        const entityRec = await db.getLockStatus(yearId, entityId);
        const eStat = entityRec ? entityRec.status : 'draft';
        this._lockStatusCache[`${yearId}_${entityId}`] = eStat;
      }
      const lockRec = await db.getLockStatus(yearId);
      const status = lockRec ? lockRec.status : 'draft';
      this._lockStatusCache[String(yearId)] = status;
      if (lockRec?.year) this._lockStatusCache[String(lockRec.year)] = status;
    } catch (e) {
      console.warn('Could not refresh lock status for year ' + yearId, e);
      this._lockStatusCache[String(yearId)] = 'draft';
    }
  },

  getYearStatus(yearId, entityId = null) {
    const yId = String(yearId || (typeof App !== 'undefined' ? App.selectedYear : '2026'));
    const numOnly = yId.replace(/[^0-9]/g, '');

    // 1. Check entity-scoped status first if entityId provided
    if (entityId) {
      const eKey = `${yId}_${entityId}`;
      if (this._lockStatusCache[eKey]) {
        return this._lockStatusCache[eKey];
      }
      if (numOnly && this._lockStatusCache[`${numOnly}_${entityId}`]) {
        return this._lockStatusCache[`${numOnly}_${entityId}`];
      }
    }

    // 2. Fall back to year base status
    if (this._lockStatusCache[yId]) {
      return this._lockStatusCache[yId];
    }
    if (numOnly && this._lockStatusCache[numOnly]) {
      return this._lockStatusCache[numOnly];
    }
    return 'active';
  },

  getYearStatusLabel(yearId, entityId = null) {
    const status = this.getYearStatus(yearId, entityId);
    const map = {
      'draft': 'Draft (In Progress)',
      'active': 'Active (Open for Budgeting)',
      'under-review': 'Under Review (Dept Submissions)',
      'finance-approved': 'Finance Approved (Pending CFO)',
      'finalized-locked': 'Finalized & Locked (CFO Approved)',
      'closed': 'Closed / Archived'
    };
    return map[status] || status;
  },

  isYearEditable(yearId, entityId = null) {
    const status = this.getYearStatus(yearId, entityId);
    // Strict Business Rule: ONLY active or draft statuses allow any additions, cell edits, or modifications
    return status === 'draft' || status === 'active';
  },

  isYearLocked(yearId, entityId = null) {
    return !this.isYearEditable(yearId, entityId);
  },

  _isLockedOperation(operation, context) {
    const yearId = context && context.yearId ? context.yearId : (typeof App !== 'undefined' ? App.selectedYear : (typeof BudgetEntryModule !== 'undefined' ? BudgetEntryModule._yearId : null));
    const entityId = context && context.entityId ? context.entityId : (typeof BudgetEntryModule !== 'undefined' ? BudgetEntryModule.currentEntityId : null);
    if (!yearId) return false;
    if (this.isYearLocked(yearId, entityId)) {
      const writeOps = ['add', 'edit', 'delete', 'approve', 'finalize', 'upload', 'import', 'save'];
      return writeOps.includes(operation);
    }
    return false;
  },

  hasPermission(operation, context) {
    context = context || {};
    const user = this.getCurrentUser();
    if (!user) return true;

    if (user.isAdmin || user.roleId === 'role-admin') {
      if (this._isLockedOperation(operation, context)) return false;
      return true;
    }

    if (this._isLockedOperation(operation, context)) {
      return false;
    }

    const { entityId, deptId, category, ledgerCode, glDescription } = context;
    const lineKey = ledgerCode ? (glDescription ? ledgerCode + '_' + Utils.slugify(glDescription) : ledgerCode) : null;

    const matching = this._getMatchingAssignments(user, entityId, deptId);
    if (matching.length === 0) {
      if (user.isEntityAdmin && entityId && user.entities) {
        const userEnts = Array.isArray(user.entities) ? user.entities : [user.entities];
        if (userEnts.includes('all') || userEnts.includes(entityId)) return true;
      }
      return false;
    }

    // Logical RBAC Rule: If view access is false, no other operation (add, edit, delete, review, etc.) can be permitted!
    if (operation !== 'view') {
      const canView = this._resolvePermissionFromAssignments(matching, 'view', category, context);
      if (!canView) return false;
    }

    return this._resolvePermissionFromAssignments(matching, operation, category, context);
  },

  filterAccessibleEntities(entities) {
    const user = this.getCurrentUser();
    if (!user) return entities;
    if (user.isAdmin || user.roleId === 'role-admin') return entities;

    const allowed = new Set();
    (user.roleAssignments || []).forEach(a => {
      if (a.entities === 'all') {
        entities.forEach(e => allowed.add(e.id));
      } else if (Array.isArray(a.entities)) {
        a.entities.forEach(id => allowed.add(id));
      } else if (typeof a.entities === 'string') {
        allowed.add(a.entities);
      }
    });

    if (user.entities === 'all') return entities;
    if (Array.isArray(user.entities)) user.entities.forEach(id => allowed.add(id));

    if (allowed.size === 0) return entities;
    return entities.filter(e => allowed.has(e.id));
  },

  filterAccessibleDepts(departments, entityId) {
    const user = this.getCurrentUser();
    if (!user) return departments;
    if (user.isAdmin || user.roleId === 'role-admin') return departments;

    const norm = (s) => String(s || '').trim().toLowerCase().replace(/^in-|^us-|^bd-|^indo-|^np-/, '');

    const matchingAssignments = this._getMatchingAssignments(user, entityId, null);
    if (matchingAssignments.some(a => a.departments === 'all')) return departments;

    const allowedDepts = new Set();
    matchingAssignments.forEach(a => {
      if (Array.isArray(a.departments)) {
        a.departments.forEach(d => {
          allowedDepts.add(d.toLowerCase());
          allowedDepts.add(norm(d));
        });
      }
    });

    if (user.departments === 'all') return departments;
    if (Array.isArray(user.departments)) {
      user.departments.forEach(d => {
        allowedDepts.add(d.toLowerCase());
        allowedDepts.add(norm(d));
      });
    }

    if (allowedDepts.size === 0) return departments;
    return departments.filter(d => 
      allowedDepts.has(d.id.toLowerCase()) || 
      allowedDepts.has(norm(d.id)) ||
      (d.codeTemplate && allowedDepts.has(norm(d.codeTemplate)))
    );
  },

  canAccessEntity(entityId) {
    const user = this.getCurrentUser();
    if (!user || user.isAdmin) return true;
    const ents = this.filterAccessibleEntities([{ id: entityId }]);
    return ents.length > 0;
  },

  canAccessDept(entityId, deptId) {
    const user = this.getCurrentUser();
    if (!user || user.isAdmin) return true;
    const depts = this.filterAccessibleDepts([{ id: deptId }], entityId);
    return depts.length > 0;
  },

  getUserHierarchyLevel(user) {
    if (!user) return 10;
    if (user.isAdmin) return 100;
    return this.ROLE_HIERARCHY_LEVELS[user.roleId] || 50;
  },

  canFinalizeBudget() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.isAdmin || user.isFinalizer || user.roleId === 'role-finalizer';
  },

  async finalizeBudget(yearId, rateData) {
    const user = this.getCurrentUser();
    if (!this.canFinalizeBudget()) {
      throw new Error('Only Budget Finalizer or Super Admin can finalize and lock the budget.');
    }
    const result = await db.finalizeBudget(yearId, rateData);
    this._lockStatusCache[String(yearId)] = 'finalized-locked';
    return result;
  },

  async unlockBudget(yearId, reason) {
    const user = this.getCurrentUser();
    if (!user.isAdmin && user.roleId !== 'role-admin') {
      throw new Error('Only Super Administrator can unlock a finalized budget.');
    }
    const result = await db.unlockBudget(yearId, reason);
    this._lockStatusCache[String(yearId)] = 'draft';
    return result;
  },

  enforceCategoryUI(container, context) {
    if (!container) return;
    context = context || {};
    const yearId = context.yearId || (typeof App !== 'undefined' ? App.selectedYear : (typeof BudgetEntryModule !== 'undefined' ? BudgetEntryModule._yearId : null));
    const isLocked = yearId ? !this.isYearEditable(yearId) : false;

    const canAdd = !isLocked && this.hasPermission('add', context);
    const canEdit = !isLocked && this.hasPermission('edit', context);
    const canDelete = !isLocked && this.hasPermission('delete', context);

    if (!canAdd || isLocked) {
      container.querySelectorAll('.btn-add-row, button[onclick*="addRow"], button[onclick*="autoPopulate"], button[onclick*="showExpenseInputWizard"], button[onclick*="showExpenseLauncherModal"], button[onclick*="showTravelPackageWizard"], button[onclick*="saveAnnualMatrix"], #btnEmptyNewTrip, #btnQuickNewExpense, #btnNewTravelPkg').forEach(b => {
        b.style.display = 'none';
      });
    }
    if (!canEdit || isLocked) {
      container.querySelectorAll('input:not([readonly]), select:not([disabled])').forEach(el => {
        if (!el.classList.contains('filter-control') && !el.closest('.toolbar-selectors') && !el.classList.contains('year-status-selector')) {
          el.setAttribute('disabled', 'true');
          el.setAttribute('readonly', 'true');
          el.style.pointerEvents = 'none';
          el.style.cursor = 'not-allowed';
          el.style.opacity = '0.85';
          el.style.background = 'var(--bg-tertiary)';
        }
      });
      container.querySelectorAll('button[onclick*="editExpenseItem"], button[onclick*="editTravelPackage"]').forEach(b => {
        b.style.display = 'none';
      });
    }
    if (!canDelete || isLocked) {
      container.querySelectorAll('.btn-delete-row, button[onclick*="deleteRow"], button[onclick*="deleteExpenseItem"], button[onclick*="deleteTravelPackage"], button[onclick*="deleteEvent"]').forEach(b => {
        b.style.display = 'none';
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
