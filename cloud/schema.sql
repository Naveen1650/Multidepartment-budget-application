-- ============================================================
-- NOORA HEALTH MULTI-DEPARTMENT BUDGET APPLICATION
-- Cloud Relational Database Schema (PostgreSQL / Supabase / AWS / Azure / GCP)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Entities
CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    country_code VARCHAR(10),
    dept_prefix VARCHAR(10),
    country VARCHAR(100),
    currency VARCHAR(10) NOT NULL,
    flag VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(20),
    code_template VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50),
    entity_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    parent_account VARCHAR(255) NOT NULL,
    gl_description VARCHAR(255) NOT NULL,
    ledger_code VARCHAR(50) NOT NULL,
    linked_input_source VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget Cycles / Years
CREATE TABLE IF NOT EXISTS budget_years (
    id VARCHAR(50) PRIMARY KEY,
    year INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'Draft',
    conversion_rates JSONB DEFAULT '{"USD": 1, "INR": 83.5, "BDT": 117, "IDR": 16200, "NPR": 133.5}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Entity Department Configuration
CREATE TABLE IF NOT EXISTS entity_dept_configs (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payroll Personnel (Salaries & Wages, Other Staff, Gratuity)
CREATE TABLE IF NOT EXISTS payroll_personnel (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    sub_category VARCHAR(100) NOT NULL, -- 'salaries-wages', 'other-staff-expenses', 'gratuity-bonus'
    employee_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    employee_status VARCHAR(50),
    date_of_joining VARCHAR(50),
    banding VARCHAR(50),
    level VARCHAR(50),
    current_monthly_ctc NUMERIC(15, 2) DEFAULT 0,
    increment_pct NUMERIC(5, 2) DEFAULT 0,
    increment_value NUMERIC(15, 2) DEFAULT 0,
    new_monthly_ctc NUMERIC(15, 2) DEFAULT 0,
    expense_type VARCHAR(100),
    location VARCHAR(100),
    donor VARCHAR(100),
    activity VARCHAR(100),
    condition_area VARCHAR(100),
    monthly_values JSONB DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}'::jsonb,
    total_cy NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payroll EHA (External Hired Assistance / Consultants)
CREATE TABLE IF NOT EXISTS payroll_eha (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    contract_type VARCHAR(100),
    monthly_rate NUMERIC(15, 2) DEFAULT 0,
    location VARCHAR(100),
    donor VARCHAR(100),
    activity VARCHAR(100),
    condition_area VARCHAR(100),
    monthly_values JSONB DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}'::jsonb,
    total_cy NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Fixed Assets / Capital Expenditure (CapEx)
CREATE TABLE IF NOT EXISTS payroll_fixed_assets (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    category VARCHAR(100),
    description VARCHAR(255),
    quantity INT DEFAULT 1,
    unit_cost NUMERIC(15, 2) DEFAULT 0,
    location VARCHAR(100),
    donor VARCHAR(100),
    activity VARCHAR(100),
    condition_area VARCHAR(100),
    monthly_values JSONB DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}'::jsonb,
    total_cy NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Non-Payroll Operating Costs
CREATE TABLE IF NOT EXISTS non_payroll_costs (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    parent_account VARCHAR(255),
    gl_description VARCHAR(255),
    ledger_code VARCHAR(50),
    sub_category VARCHAR(100),
    description VARCHAR(255),
    quantity NUMERIC(10, 2),
    unit_rate NUMERIC(15, 2),
    basis_of_expense TEXT,
    location VARCHAR(100),
    donor VARCHAR(100),
    activity VARCHAR(100),
    condition_area VARCHAR(100),
    monthly_values JSONB DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}'::jsonb,
    total_cy NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Employee Master (HR Roster)
CREATE TABLE IF NOT EXISTS employees_master (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(50) REFERENCES entities(id),
    dept_id VARCHAR(50) REFERENCES departments(id),
    designation VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    date_of_joining VARCHAR(50),
    band VARCHAR(50),
    level VARCHAR(50),
    monthly_ctc NUMERIC(15, 2) DEFAULT 0,
    location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. IMP Training Programs & Workshops
CREATE TABLE IF NOT EXISTS imp_tot_events (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    program_name VARCHAR(255),
    event_name VARCHAR(255),
    state VARCHAR(100),
    target_cadre VARCHAR(100),
    batches INT DEFAULT 1,
    participants_per_batch INT DEFAULT 0,
    days INT DEFAULT 1,
    location VARCHAR(100),
    donor VARCHAR(100),
    activity VARCHAR(100),
    condition_area VARCHAR(100),
    monthly_values JSONB DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}'::jsonb,
    total_cy NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Users & Roles (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tier INT NOT NULL,
    description TEXT,
    badge_color VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(id),
    role_name VARCHAR(100),
    assigned_entities JSONB DEFAULT '["*"]'::jsonb,
    assigned_departments JSONB DEFAULT '["*"]'::jsonb,
    category_overrides JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Trail & Remarks
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(50),
    user_name VARCHAR(255),
    role_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50),
    dept_id VARCHAR(50),
    category VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_lock_status (
    id SERIAL PRIMARY KEY,
    year_id VARCHAR(50) REFERENCES budget_years(id) ON DELETE CASCADE,
    entity_id VARCHAR(50) REFERENCES entities(id) ON DELETE CASCADE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    is_locked BOOLEAN DEFAULT false,
    locked_by VARCHAR(255),
    locked_at TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_payroll_personnel_lookup ON payroll_personnel(year_id, entity_id, dept_id);
CREATE INDEX IF NOT EXISTS idx_non_payroll_lookup ON non_payroll_costs(year_id, entity_id, dept_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_lookup ON audit_logs(timestamp DESC, entity_id, dept_id);
