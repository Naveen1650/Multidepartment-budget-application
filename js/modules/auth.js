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
    { key: 'salaries', label: 'Salaries & Wages', icon: '💼', group: 'Payroll' },
    { key: 'other-staff', label: 'Other Staff Expenses', icon: '👥', group: 'Payroll' },
    { key: 'gratuity', label: 'Gratuity & Bonus', icon: '🎁', group: 'Payroll' },
    { key: 'eha', label: 'EHA Consultants', icon: '🤝', group: 'Payroll' },
    { key: 'fixed-assets', label: 'Fixed Assets (CapEx)', icon: '💻', group: 'Fixed Assets' },
    { key: 'other-costs', label: 'Other Operating Costs', icon: '📑', group: 'Operations' },
    { key: 'total-dept-cost', label: 'Total Dept Cost Rollup', icon: '📊', group: 'Summary' },
    { key: 'imp-tot-rates', label: 'IMP ToT Rates & Programs', icon: '🎯', group: 'Programs' },
    { key: 'prior-period', label: 'Prior Period Actuals', icon: '⏳', group: 'Reference' },
    { key: 'reports', label: 'Financial Reports', icon: '📈', group: 'Reports' },
    { key: 'config', label: 'System Configuration', icon: '⚙️', group: 'Admin' }
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
    if (!lineItem) return 'other-costs';
    const parent = String(lineItem.parentAccount || '').toLowerCase();
    const glDesc = String(lineItem.glDescription || '').toLowerCase();
    const ledger = String(lineItem.ledgerCode || '').trim();

    if (parent.includes('salaries') || glDesc.includes('salaries') || glDesc.includes('wages') || ledger.startsWith('911')) return 'salaries';
    if (parent.includes('other staff') || parent.includes('training') || glDesc.includes('training') || glDesc.includes('development') || ledger.startsWith('913')) return 'other-staff';
    if (parent.includes('gratuity') || parent.includes('bonus') || glDesc.includes('gratuity') || glDesc.includes('bonus') || ledger.startsWith('912')) return 'gratuity';
    if (parent.includes('resource') || parent.includes('eha') || glDesc.includes('consultant') || glDesc.includes('eha') || ledger.startsWith('921')) return 'eha';
    if (parent.includes('fixed asset') || parent.includes('asset') || parent.includes('capex') || glDesc.includes('laptop') || glDesc.includes('printer')) return 'fixed-assets';
    if (parent.includes('tot') || glDesc.includes('tot') || glDesc.includes('program')) return 'imp-tot-rates';
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

    // Hierarchy visibility
    const myLevel = this.getUserHierarchyLevel(user);
    const creatorLevel = remark.assignedByRoleLevel || 10;
    return myLevel >= creatorLevel;
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

    for (const a of assignments) {
      // 1. User Line Item Overrides
      if (a.lineItemOverrides) {
        const lineOverride = (directKey && a.lineItemOverrides[directKey]) ||
                             (ledgerCode && a.lineItemOverrides[ledgerCode]) ||
                             (glDescSlug && a.lineItemOverrides[glDescSlug]);
        if (lineOverride && typeof lineOverride[operation] === 'boolean') {
          if (lineOverride[operation]) return true;
        }
      }

      // 2. User Category Overrides
      if (category && a.categoryOverrides && a.categoryOverrides[category]) {
        const catOverride = a.categoryOverrides[category];
        if (typeof catOverride[operation] === 'boolean') {
          if (catOverride[operation]) return true;
        }
      }

      // 3. Role-Level Permissions
      const role = this._roles.find(r => r.id === a.roleId);
      if (role) {
        // 3a. Role Line Item Permissions
        if (role.lineItemPermissions) {
          const roleLinePerm = (directKey && role.lineItemPermissions[directKey]) ||
                               (ledgerCode && role.lineItemPermissions[ledgerCode]) ||
                               (glDescSlug && role.lineItemPermissions[glDescSlug]);
          if (roleLinePerm && typeof roleLinePerm[operation] === 'boolean') {
            if (roleLinePerm[operation]) return true;
          }
        }

        // 3b. Role Category Permissions
        if (role.permissions) {
          if (category && role.permissions[category]) {
            if (role.permissions[category][operation] === true) return true;
          }
          if (context?.parentAccount && role.permissions[context.parentAccount]) {
            if (role.permissions[context.parentAccount][operation] === true) return true;
          }
        }
      }
    }
    return false;
  },

  async refreshLockStatus(yearId) {
    if (!yearId) return;
    try {
      const lockRec = await db.getLockStatus(yearId);
      this._lockStatusCache[String(yearId)] = lockRec ? lockRec.status : 'draft';
    } catch (e) {
      console.warn('Could not refresh lock status for year ' + yearId, e);
      this._lockStatusCache[String(yearId)] = 'draft';
    }
  },

  isYearLocked(yearId) {
    const status = this._lockStatusCache[String(yearId)];
    return status === 'finalized-locked';
  },

  _isLockedOperation(operation, context) {
    const yearId = context && context.yearId ? context.yearId : (typeof App !== 'undefined' ? App.selectedYear : null);
    if (!yearId) return false;
    if (this.isYearLocked(yearId)) {
      const writeOps = ['add', 'edit', 'delete', 'approve', 'finalize'];
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
    const canAdd = this.hasPermission('add', context);
    const canEdit = this.hasPermission('edit', context);
    const canDelete = this.hasPermission('delete', context);

    if (!canAdd) {
      container.querySelectorAll('.btn-add-row, button[onclick*="addRow"]').forEach(b => {
        b.style.display = 'none';
      });
    }
    if (!canEdit) {
      container.querySelectorAll('input:not([readonly]), select:not([disabled])').forEach(el => {
        if (!el.classList.contains('filter-control') && !el.closest('.toolbar-selectors')) {
          el.setAttribute('disabled', 'true');
          el.style.pointerEvents = 'none';
        }
      });
    }
    if (!canDelete) {
      container.querySelectorAll('.btn-delete-row, button[onclick*="deleteRow"]').forEach(b => {
        b.style.display = 'none';
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
