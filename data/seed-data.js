// ============================================================
// NOORA HEALTH BUDGET APP — Seed Data
// Pre-loaded master data extracted from uploaded Excel files
// ============================================================

const SEED_DATA = {

  // ─── Entities ───
  entities: [
    { id: 'noora-us', name: 'Noora (HQ/Centralized)', shortName: 'Noora', countryCode: 'US', deptPrefix: 'US', country: 'United States', currency: 'USD', flag: '🇺🇸' },
    { id: 'nhipl', name: 'Noora Health India Private Limited', shortName: 'NHIPL', countryCode: 'IN', deptPrefix: 'IN', country: 'India', currency: 'INR', flag: '🇮🇳' },
    { id: 'yaif', name: 'Yo Shade Innovation Foundation', shortName: 'YAIF', countryCode: 'IN', deptPrefix: 'IN', country: 'India', currency: 'INR', flag: '🇮🇳' },
    { id: 'nhbd', name: 'Noora Health Bangladesh', shortName: 'NHBD', countryCode: 'BD', deptPrefix: 'BD', country: 'Bangladesh', currency: 'BDT', flag: '🇧🇩' },
    { id: 'nh-indo', name: 'Noora Health Indonesia', shortName: 'NH Indo', countryCode: 'INDO', deptPrefix: 'INDO', country: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
    { id: 'nh-nepal', name: 'Noora Health Nepal', shortName: 'NH Nepal', countryCode: 'NP', deptPrefix: 'NP', country: 'Nepal', currency: 'NPR', flag: '🇳🇵' }
  ],

  // ─── Department Master List ───
  // scope: 'country' = country-specific (auto-prefixed), 'gl' = global, 'dp-gp' = digital product global, 'dp-cp' = digital product country, 'general' = general
  departments: [
    // ─── 1. Country-Specific Departments ───
    // PDD (Product Design & Development / Content / Tools)
    { id: 'pdd-med', number: '1', codeTemplate: '{CC}-PDD-MED', name: 'Framework designing & Content creation (Medical)', scope: 'country', entityMapping: { nhipl: true, yaif: false } },
    { id: 'pdd-hcomm', number: '1', codeTemplate: '{CC}-PDD-HCOMM', name: 'Framework designing & Content creation (Health Comm)', scope: 'country', entityMapping: { nhipl: true, yaif: false } },
    { id: 'pdd-cdes', number: '2', codeTemplate: '{CC}-PDD-CDES', name: 'Tool Development (Creative Design)', scope: 'country', entityMapping: { nhipl: true, yaif: false } },
    { id: 'pdd-film', number: '2', codeTemplate: '{CC}-PDD-FILM', name: 'Tool Development (Film)', scope: 'country', entityMapping: { nhipl: true, yaif: false } },
    { id: 'pdd-ssdes', number: '3', codeTemplate: '{CC}-PDD-SSDES', name: 'Needs finding, Testing & prototyping', scope: 'country', entityMapping: { nhipl: true, yaif: false } },

    // PD (Program Delivery / Implementation / Training)
    { id: 'pdel-trng', number: '9', codeTemplate: '{CC}-PDEL-TRNG', name: 'Training design and delivery', scope: 'country', entityMapping: { nhipl: true, yaif: true, nhbd: true, 'nh-indo': true, 'nh-nepal': true, 'noora-us': true } },
    { id: 'pdel-imp', number: '10', codeTemplate: '{CC}-PDEL-IMP', name: 'Implementation (ToTs, Supervision, etc.)', scope: 'country', entityMapping: { nhipl: true, yaif: true, nhbd: true, 'nh-indo': true, 'nh-nepal': true, 'noora-us': true } },
    { id: 'pdel-partner', number: '', codeTemplate: '{CC}-PDEL-PARTNER IMP', name: 'Partner Implementation', scope: 'country', entityMapping: { nhipl: true, yaif: true, nhbd: true, 'nh-indo': true, 'nh-nepal': true, 'noora-us': true } },

    // M&E (Monitoring & Evaluation / Research)
    { id: 'me-monitoring', number: '5', codeTemplate: '{CC}-M&E-MONITORING', name: 'Monitoring', scope: 'country', entityMapping: { nhipl: false, yaif: true } },
    { id: 'me-eval', number: '6', codeTemplate: '{CC}-M&E-EVAL', name: 'Research (Evaluation)', scope: 'country', entityMapping: { nhipl: false, yaif: true } },

    // OPS (Operations / Support / Finance / P&C / Fundraising)
    { id: 'ops-admin', number: '11', codeTemplate: '{CC}-OPS-ADMIN', name: 'Country Support (Administration)', scope: 'country', entityMapping: { nhipl: true, yaif: true } },
    { id: 'ops-fin', number: '11', codeTemplate: '{CC}-OPS-FIN', name: 'Country Support (Finance)', scope: 'country', entityMapping: { nhipl: true, yaif: true } },
    { id: 'ops-pc', number: '11', codeTemplate: '{CC}-OPS-P&C', name: 'Country Support (People & Culture)', scope: 'country', entityMapping: { nhipl: true, yaif: true } },
    { id: 'ops-fr', number: '15', codeTemplate: '{CC}-OPS-FR', name: 'Fundraising & Development', scope: 'country', entityMapping: { nhipl: true, yaif: false } },

    // RMM (Resource Mobilization & Marketing)
    { id: 'rmm', number: '7', codeTemplate: '{CC}-RMM', name: 'RMM (Advocacy, Collaboration, Admin Mgmt)', scope: 'country', entityMapping: { nhipl: true, yaif: false } },

    // ─── 2. Digital Product — Country-Specific (DP-CP) ───
    { id: 'dp-cp-prodmngt', number: '4', codeTemplate: 'DP-CP-PRODMNGT', name: 'Remote Engagement Service (Country Product Mgmt)', scope: 'dp-cp', entityMapping: { nhipl: true, yaif: true } },
    { id: 'dp-cp-product', number: '8', codeTemplate: 'DP-CP-PRODUCT', name: 'Platform Dev & Management (Country Product)', scope: 'dp-cp', entityMapping: { nhipl: true, yaif: false } },
    { id: 'dp-cp-eng', number: '8', codeTemplate: 'DP-CP-ENG', name: 'Platform Dev & Management (Country Engineering)', scope: 'dp-cp', entityMapping: { nhipl: true, yaif: false } },

    // ─── 3. Digital Product — Global (DP-GP) ───
    { id: 'dp-gp-product', number: '8', codeTemplate: 'DP-GP-PRODUCT', name: 'Platform Dev & Management (Global Product)', scope: 'dp-gp' },
    { id: 'dp-gp-eng', number: '8', codeTemplate: 'DP-GP-ENG', name: 'Platform Dev & Management (Global Engineering)', scope: 'dp-gp' },

    // ─── 4. Global Departments (GL) ───
    // I&L (Insights & Learning / Training / Strategy / NIAB)
    { id: 'gl-learn-impact', number: '20', codeTemplate: 'GL-I&L-LEARN &IMPACT STGY', name: 'Knowledge sharing and dissemination', scope: 'gl' },
    { id: 'gl-hcw-trng', number: '9', codeTemplate: 'GL-I&L-HCW PROD & TRNG', name: 'Health Care Worker Products & Training', scope: 'gl' },
    { id: 'gl-niab', number: '12', codeTemplate: 'GL-I&L-NIAB', name: 'Noora In a Box (NIAB)', scope: 'gl' },

    // C&I (Creative & Innovation / Research / Comms)
    { id: 'gl-labs', number: '13', codeTemplate: 'GL-C&I-LABS', name: 'Design research on caregiving', scope: 'gl' },
    { id: 'gl-res-eval', number: '14', codeTemplate: 'GL-C&I-RES & EVAL', name: 'Evaluation (Global)', scope: 'gl' },
    { id: 'gl-comms-brand', number: '16', codeTemplate: 'GL-C&I-COMMS & BRAND', name: 'Communications & Brand', scope: 'gl' },

    // OPS (Global Operations / Support / Finance / P&C)
    { id: 'gl-ops-fin', number: '18', codeTemplate: 'GL-OPS-FIN', name: 'Global Support (Finance)', scope: 'gl' },
    { id: 'gl-ops-pc', number: '18', codeTemplate: 'GL-OPS-P&C', name: 'Global Support (People & Culture)', scope: 'gl' },
    { id: 'gl-ops-admin', number: '18', codeTemplate: 'GL-OPS-ADMIN', name: 'Global Support (Administration)', scope: 'gl' },

    // RMM (Global Resource Mobilization)
    { id: 'gl-rmm', number: '7', codeTemplate: 'GL-RMM', name: 'RMM (Global)', scope: 'gl' },

    // Others
    { id: 'gl-prg-exp', number: '17', codeTemplate: 'GL-PRG EXP-EXP & IMP', name: 'Strategic Global Development', scope: 'gl' },

    // ─── 5. General (Cross-cutting) ───
    { id: 'gen-payroll', number: '21', codeTemplate: 'Payroll & Benefits', name: 'Payroll & Benefits', scope: 'general' },
    { id: 'gen-immersion', number: '22', codeTemplate: 'Program Immersion', name: 'Program Immersion', scope: 'general' },
    { id: 'gen-atr', number: '23', codeTemplate: 'All Team Retreat', name: 'All Team Retreat', scope: 'general' }
  ],

  // ─── Locations per Entity ───
  locations: {
    'nhipl': [
      'India', 'India KA', 'India MH', 'India OR', 'India PB', 'India HR', 'India AP',
      'India MP', 'India HP', 'India TN', 'India RJ', 'India JK', 'India DL', 'India AS',
      'India JH', 'Indonesia', 'Bangladesh', 'Nepal', 'USA', 'Other Country'
    ],
    'yaif': [
      'India', 'India KA', 'India MH', 'India OR', 'India PB', 'India HR', 'India AP',
      'India MP', 'India HP', 'India TN', 'India RJ', 'India JK', 'India DL', 'India AS',
      'India JH', 'Indonesia', 'Bangladesh', 'Nepal', 'USA', 'Other Country'
    ],
    'nhbd': [
      'KHU-Bagerhat', 'CTG-Bandarban', 'BAR-Barguna', 'BAR-Barishal', 'BAR-Bhola',
      'RAJ-Bogura', 'CTG-Brahmanbaria', 'CTG-Chandpur', 'RAJ-Chapainawabganj',
      'CTG-Chattogram', 'KHU-Chuadanga', 'CTG-Cox\'s Bazar', 'CTG-Cumilla',
      'DHA-Dhaka', 'RAN-Dinajpur', 'DHA-Faridpur', 'CTG-Feni', 'RAN-Gaibandha',
      'DHA-Gazipur', 'DHA-Gopalganj', 'SYL-Habiganj', 'MYM-Jamalpur',
      'KHU-Jashore', 'BAR-Jhalakathi', 'KHU-Jhenaidah', 'RAJ-Joypurhat',
      'CTG-Khagrachhari', 'KHU-Khulna', 'DHA-Kishoreganj', 'RAN-Kurigram',
      'KHU-Kushtia', 'CTG-Lakshmipur', 'RAN-Lalmonirhat', 'DHA-Madaripur',
      'KHU-Magura', 'DHA-Manikganj', 'KHU-Meherpur', 'SYL-Moulvibazar',
      'DHA-Munshiganj', 'MYM-Mymensingh', 'RAJ-Naogaon', 'KHU-Narail',
      'DHA-Narayanganj', 'DHA-Narsingdi', 'RAJ-Natore', 'MYM-Netrokona',
      'RAN-Nilphamari', 'CTG-Noakhali', 'RAJ-Pabna', 'RAN-Panchagarh',
      'BAR-Patuakhali', 'BAR-Pirojpur', 'DHA-Rajbari', 'RAJ-Rajshahi',
      'CTG-Rangamati', 'RAN-Rangpur', 'KHU-Satkhira', 'DHA-Shariatpur',
      'MYM-Sherpur', 'RAJ-Sirajganj', 'SYL-Sunamganj', 'SYL-Sylhet',
      'DHA-Tangail', 'RAN-Thakurgaon',
      'India', 'Indonesia', 'US', 'Other Country'
    ],
    'nh-indo': [
      'Indonesia', 'Indo-East Java', 'Indo-Central Java', 'Indo-West Java',
      'Indo-Jakarta', 'Indo-Bali', 'Indo-Sumatra', 'Indo-West Kalimantan',
      'Indo-Jogjakarta', 'Indo-Southeast Sulawesi', 'India-Bangalore',
      'Nepal', 'Others Countries', 'Others'
    ],
    'noora-us': [
      'US', 'Nepal', 'India', 'Bangladesh', 'Indonesia'
    ],
    'nh-nepal': [
      'Nepal', 'India', 'Bangladesh', 'Indonesia', 'US'
    ]
  },

  // ─── Donors per Entity ───
  donors: {
    'nhipl': ['NHIPL'],
    'yaif': ['YAIF'],
    'nhbd': ['NH BD'],
    'nh-indo': ['NH INDO'],
    'noora-us': ['NH US'],
    'nh-nepal': ['NH NP']
  },

  // ─── Activities ───
  activities: [
    'All',
    '1-Framework designing and Content creation',
    '2. Tool Development',
    '3-Needs finding,Testing and prototyping',
    '4. Remote Engagement Service',
    '5-Monitoring',
    '6-Research',
    '7.1-RMM-Advocacy',
    '7.2-RMM-Collaboration',
    '7.3-RMM-Administrative management',
    '8.Platform Development & Management',
    '9.Training design and delivery',
    '10.1-Bundled ToT- Master trainers',
    '10.2-Non-bundled ToTs-Master Trainers',
    '10.3-Booster/ Refresher Training',
    '10.4-Medical Officer training',
    '10.5-District level training',
    '10.6-Facility Launch',
    '10.7-Supportive Supervision',
    '10.8-Partnership Visits',
    '11.Country Support',
    '12.1-Strategic Global Development-Advocacy',
    '12.2-Strategic Global Development-Collaboration',
    '13.Design research on caregiving',
    '14.Evaluation',
    '15.Fundraising & Development',
    '16.Communications & Brand',
    '17.1-Strategic Global Development-Advocacy',
    '17.2-Strategic Global Development-Collaboration',
    '18.Global Support',
    '19.1-Coordination of on-ground trainings (TOTs)',
    '19.2-On-ground supervision and engagement',
    '20.Knowledge sharing and dissemination',
    '21-.Payroll & Benefits',
    '22.Program Immersion',
    '23. All Team Retreat'
  ],

  // ─── Condition Areas ───
  conditionAreas: [
    'All',
    'Maternal & Newborn Care',
    'Tuberculosis Care',
    'General Medical & Surgical Care',
    'Oncology Care',
    'Cardiac Care',
    'Covid-19 Care',
    'Others'
  ],

  // ─── Non-Payroll Chart of Accounts ───
  chartOfAccounts: [
    // Payroll-related
    { subGroup: 'Payroll Cost', parentAccount: 'Salaries and Wages', glDescription: 'Salaries and Wages', ledgerCode: '91101-91107' },
    { subGroup: 'Payroll Cost', parentAccount: 'Health and Retirement Benefits', glDescription: 'Gratuity & Bonus', ledgerCode: '91201-91207' },
    { subGroup: 'Payroll Cost', parentAccount: 'Other Staff Expenses', glDescription: 'Staff Training, Learning & Development Exp', ledgerCode: '91302' },
    { subGroup: 'Direct Consultants', parentAccount: 'Resource Persons', glDescription: 'Program Resource Consultant (EHA)', ledgerCode: '92101' },

    // Non-Payroll — Direct Cost
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Hotel Accommodation', ledgerCode: '93101' },
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Food Expenses', ledgerCode: '93102' },
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Air fare', ledgerCode: '93103' },
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Cab/Auto', ledgerCode: '93104' },
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Bus/Train', ledgerCode: '93105' },
    { subGroup: 'Direct Cost', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Other incidental travel costs', ledgerCode: '93106' },
    { subGroup: 'Direct Cost', parentAccount: 'Supplies & Printing Costs', glDescription: 'Other Direct Expenses', ledgerCode: '93201' },
    { subGroup: 'Direct Cost', parentAccount: 'Supplies & Printing Costs', glDescription: 'Printing expenses', ledgerCode: '93204' },
    { subGroup: 'Direct Cost', parentAccount: 'Communication Cost', glDescription: 'Internet Expenses', ledgerCode: '93301' },
    { subGroup: 'Direct Cost', parentAccount: 'Communication Cost', glDescription: 'Postage & Courier Expenses', ledgerCode: '93302' },
    { subGroup: 'Direct Cost', parentAccount: 'Communication Cost', glDescription: 'Telecommunication expenses', ledgerCode: '93303' },
    { subGroup: 'Direct Cost', parentAccount: 'Office Expenses', glDescription: 'Software and Subscriptions', ledgerCode: '93401' },
    { subGroup: 'Direct Cost', parentAccount: 'Office Expenses', glDescription: 'Stationery & Consumables', ledgerCode: '93404' },
    { subGroup: 'Direct Cost', parentAccount: 'Office Expenses', glDescription: 'Office Equipment Expense', ledgerCode: '93405' },

    // Non-Payroll — Indirect Cost
    { subGroup: 'Indirect Cost', parentAccount: 'Professional & Consultancy Charges', glDescription: 'Admin Consultants', ledgerCode: '93703' },

    // Fixed Assets
    { subGroup: 'Fixed Assets', parentAccount: 'Fixed Assets', glDescription: 'Laptop/ Printer', ledgerCode: '11301' }
  ],

  // ─── Payroll Sub-categories ───
  payrollSubGroups: [
    'Full Time Employee',
    'External hired Assistance'
  ],

  payrollSalaryTypes: [
    'Salaries and Wages',
    'Staff Training, Learning & Development Expenses'
  ],

  // ─── Calendar Months ───
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  // ─── Employee Bandings & Levels ───
  bandings: ['NH1', 'NH2', 'NH3', 'NH4', 'NH5'],
  levels: ['L1', 'L2', 'L3', 'L4'],

  // ─── Sample Personnel Seed Data ───
  samplePersonnel: [
    {
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      name: 'Simerneet Bajwa',
      designation: 'Senior Health Communications Lead',
      banding: 'NH4',
      level: 'L3',
      currentMonthlyCTC: 359333,
      newMonthlyCTC: 359333,
      incrementPct: 0,
      incrementValue: 0,
      monthlyValues: { 0: 359333, 1: 359333, 2: 359333, 3: 359333, 4: 359333, 5: 359333, 6: 359333, 7: 359333, 8: 359333, 9: 359333, 10: 359333, 11: 359333 },
      totalCY: 4312000,
      location: 'India KA',
      donor: 'NHIPL',
      activity: '1-Framework designing and Content creation',
      conditionArea: 'Maternal & Newborn Care'
    },
    {
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      name: 'Sandeep Kumar Dwivedi',
      designation: 'Senior Manager Creative Content & Translation',
      banding: 'NH3',
      level: 'L3',
      currentMonthlyCTC: 205592,
      newMonthlyCTC: 224095,
      incrementPct: 9,
      incrementValue: 18503,
      monthlyValues: { 0: 224095, 1: 224095, 2: 224095, 3: 224095, 4: 224095, 5: 224095, 6: 224095, 7: 224095, 8: 224095, 9: 224095, 10: 224095, 11: 224095 },
      totalCY: 2689139,
      location: 'India DL',
      donor: 'NHIPL',
      activity: '2. Tool Development',
      conditionArea: 'General Medical & Surgical Care'
    },
    {
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      name: 'Tarana Rajkumar Emmanuel',
      designation: 'Associate Manager Creative Content',
      banding: 'NH3',
      level: 'L1',
      currentMonthlyCTC: 120408,
      newMonthlyCTC: 131245,
      incrementPct: 9,
      incrementValue: 10837,
      monthlyValues: { 0: 131245, 1: 131245, 2: 131245, 3: 131245, 4: 131245, 5: 131245, 6: 131245, 7: 131245, 8: 131245, 9: 131245, 10: 131245, 11: 131245 },
      totalCY: 1574941,
      location: 'India KA',
      donor: 'NHIPL',
      activity: '1-Framework designing and Content creation',
      conditionArea: 'Maternal & Newborn Care'
    }
  ],

  // ─── Masterlist of Employees Seed Data ───
  sampleEmployeesMaster: [
    {
      employeeCode: 'NH-1001',
      name: 'Simerneet Bajwa',
      band: 'NH4',
      doj: '2021-06-15',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      department: 'PDD - Medical Content',
      reportingManager: 'Dr. Shahed Alam',
      annualCTC: 4312000,
      monthlyCTC: 359333,
      designation: 'Senior Health Communications Lead',
      location: 'India KA',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1002',
      name: 'Sandeep Kumar Dwivedi',
      band: 'NH3',
      doj: '2022-03-01',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      department: 'PDD - Medical Content',
      reportingManager: 'Simerneet Bajwa',
      annualCTC: 2689139,
      monthlyCTC: 224095,
      designation: 'Senior Manager Creative Content & Translation',
      location: 'India DL',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1003',
      name: 'Tarana Rajkumar Emmanuel',
      band: 'NH3',
      doj: '2023-01-10',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      department: 'PDD - Medical Content',
      reportingManager: 'Simerneet Bajwa',
      annualCTC: 1574941,
      monthlyCTC: 131245,
      designation: 'Associate Manager Creative Content',
      location: 'India KA',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1004',
      name: 'Dr. Shahed Alam',
      band: 'NH5',
      doj: '2019-01-01',
      entityId: 'nhipl',
      deptId: 'pdd-med',
      department: 'PDD - Medical Content',
      reportingManager: 'Edith Elliott',
      annualCTC: 6500000,
      monthlyCTC: 541667,
      designation: 'Vice President - Medical Content & Programs',
      location: 'India KA',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1005',
      name: 'Ananya Sharma',
      band: 'NH2',
      level: 'Level 2',
      doj: '2023-08-01',
      entityId: 'nhipl',
      deptId: 'me-monitoring',
      department: 'Monitoring',
      reportingManager: 'Dr. Shahed Alam',
      annualCTC: 960000,
      monthlyCTC: 80000,
      designation: 'Data Analyst & M&E Associate',
      location: 'India KA',
      donor: 'Main Donor / Core Fund',
      activity: '5.1 Monitoring System Maintenance',
      conditionArea: 'Maternal Health',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1006',
      name: 'Rajesh Varma',
      band: 'NH4',
      level: 'Level 4',
      doj: '2020-04-15',
      entityId: 'nhipl',
      deptId: 'pdd-hcomm',
      department: 'Framework designing & Content creation (Health Comm)',
      reportingManager: 'Simerneet Bajwa',
      annualCTC: 3850000,
      monthlyCTC: 320833,
      designation: 'Lead — Healthcare Communications',
      location: 'India KA',
      donor: 'Main Donor / Core Fund',
      activity: '1.2 Health Comm Framework Design',
      conditionArea: 'Maternal Health',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1007',
      name: 'Pooja Sharma',
      band: 'NH2',
      level: 'Level 2',
      doj: '2023-05-10',
      entityId: 'nhipl',
      deptId: 'pdd-hcomm',
      department: 'Framework designing & Content creation (Health Comm)',
      reportingManager: 'Rajesh Varma',
      annualCTC: 1200000,
      monthlyCTC: 100000,
      designation: 'HCOMM Operations Associate',
      location: 'India KA',
      donor: 'Main Donor / Core Fund',
      activity: '1.2 Health Comm Framework Design',
      conditionArea: 'Maternal Health',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1008',
      name: 'Amitabh Sen',
      band: 'NH4',
      level: 'Level 4',
      doj: '2021-11-01',
      entityId: 'nhipl',
      deptId: 'pdel-trng',
      department: 'Training design and delivery',
      reportingManager: 'Dr. Shahed Alam',
      annualCTC: 4200000,
      monthlyCTC: 350000,
      designation: 'Lead — Training & Program Delivery',
      location: 'India DL',
      donor: 'Main Donor / Core Fund',
      activity: '9.1 Training Curriculum & Tool Design',
      conditionArea: 'Newborn Care',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1009',
      name: 'Vikram Malhotra',
      band: 'NH3',
      level: 'Level 3',
      doj: '2022-07-15',
      entityId: 'nhipl',
      deptId: 'pdel-trng',
      department: 'Training design and delivery',
      reportingManager: 'Amitabh Sen',
      annualCTC: 2400000,
      monthlyCTC: 200000,
      designation: 'Senior Master Trainer',
      location: 'India MP',
      donor: 'Main Donor / Core Fund',
      activity: '9.2 State Level Master Training',
      conditionArea: 'Newborn Care',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1010',
      name: 'Deepa Nair',
      band: 'NH4',
      level: 'Level 4',
      doj: '2019-08-20',
      entityId: 'nhipl',
      deptId: 'ops-admin',
      department: 'Country Support (Administration)',
      reportingManager: 'Priya Iyer',
      annualCTC: 3600000,
      monthlyCTC: 300000,
      designation: 'HR & People Operations Manager',
      location: 'India KA',
      donor: 'Main Donor / Core Fund',
      activity: '11.1 General Administration',
      conditionArea: 'General Health',
      status: 'Active'
    },
    {
      employeeCode: 'NH-1011',
      name: 'Sneha Rao',
      band: 'NH4',
      level: 'Level 4',
      doj: '2020-02-01',
      entityId: 'nhipl',
      deptId: 'ops-fin',
      department: 'Country Support (Finance)',
      reportingManager: 'Priya Iyer',
      annualCTC: 4500000,
      monthlyCTC: 375000,
      designation: 'Finance & Compliance Manager',
      location: 'India KA',
      donor: 'Main Donor / Core Fund',
      activity: '11.2 Financial Management & Audit',
      conditionArea: 'General Health',
      status: 'Active'
    },
    {
      employeeCode: 'NH-US-001',
      name: 'Edith Elliott',
      band: 'NH5',
      level: 'Level 5',
      doj: '2015-01-01',
      entityId: 'noora-us',
      deptId: 'pdd-med',
      department: 'Framework designing & Content creation (Medical)',
      reportingManager: 'Board of Directors',
      annualCTC: 180000,
      monthlyCTC: 15000,
      designation: 'Chief Executive Officer',
      location: 'United States',
      donor: 'Global Core Fund',
      activity: '1.1 Medical Protocol Development',
      conditionArea: 'Maternal Health',
      status: 'Active'
    }
  ],

  // ─── Default Admin Benchmark Travel Rates (Location & City / Non-City) ───
  defaultTravelRates: [
    // India (INR) — Default Fallback Rates
    { entityId: 'nhipl', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'nhipl', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    // India (INR) — Specific Locations
    { entityId: 'nhipl', location: 'India KA', category: 'City', hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India KA', category: 'Non-City', hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India DL', category: 'City', hotelPerDay: 4000, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India DL', category: 'Non-City', hotelPerDay: 2500, foodPerDay: 800, cabPerDay: 900, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India MH', category: 'City', hotelPerDay: 4000, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India MH', category: 'Non-City', hotelPerDay: 2400, foodPerDay: 800, cabPerDay: 900, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    { entityId: 'nhipl', location: 'India PB', category: 'City', hotelPerDay: 3000, foodPerDay: 900, cabPerDay: 1000, airfarePerTrip: 7500, busTrainPerTrip: 2000, currency: 'INR' },
    { entityId: 'nhipl', location: 'India PB', category: 'Non-City', hotelPerDay: 2000, foodPerDay: 600, cabPerDay: 700, airfarePerTrip: 6000, busTrainPerTrip: 1200, currency: 'INR' },
    { entityId: 'nhipl', location: 'India MP', category: 'City', hotelPerDay: 2800, foodPerDay: 850, cabPerDay: 1000, airfarePerTrip: 7500, busTrainPerTrip: 2000, currency: 'INR' },
    { entityId: 'nhipl', location: 'India MP', category: 'Non-City', hotelPerDay: 1800, foodPerDay: 600, cabPerDay: 700, airfarePerTrip: 6000, busTrainPerTrip: 1200, currency: 'INR' },

    { entityId: 'yaif', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'yaif', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    { entityId: 'yaif', location: 'India KA', category: 'City', hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'yaif', location: 'India KA', category: 'Non-City', hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },
    { entityId: 'yaif', location: 'India DL', category: 'City', hotelPerDay: 4000, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 8500, busTrainPerTrip: 2500, currency: 'INR' },
    { entityId: 'yaif', location: 'India DL', category: 'Non-City', hotelPerDay: 2500, foodPerDay: 800, cabPerDay: 900, airfarePerTrip: 6500, busTrainPerTrip: 1500, currency: 'INR' },

    // Bangladesh (BDT) — Default & Specific
    { entityId: 'nhbd', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 7500, busTrainPerTrip: 1800, currency: 'BDT' },
    { entityId: 'nhbd', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6000, busTrainPerTrip: 1000, currency: 'BDT' },
    { entityId: 'nhbd', location: 'DHA-Dhaka', category: 'City', hotelPerDay: 4000, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 8500, busTrainPerTrip: 2000, currency: 'BDT' },
    { entityId: 'nhbd', location: 'DHA-Dhaka', category: 'Non-City', hotelPerDay: 2500, foodPerDay: 800, cabPerDay: 1000, airfarePerTrip: 6500, busTrainPerTrip: 1200, currency: 'BDT' },
    { entityId: 'nhbd', location: 'CTG-Chittagong', category: 'City', hotelPerDay: 3500, foodPerDay: 1000, cabPerDay: 1200, airfarePerTrip: 7500, busTrainPerTrip: 1800, currency: 'BDT' },
    { entityId: 'nhbd', location: 'CTG-Chittagong', category: 'Non-City', hotelPerDay: 2200, foodPerDay: 700, cabPerDay: 800, airfarePerTrip: 6000, busTrainPerTrip: 1000, currency: 'BDT' },

    // Indonesia (IDR) — Default & Specific
    { entityId: 'nh-indo', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 700000, foodPerDay: 220000, cabPerDay: 280000, airfarePerTrip: 1600000, busTrainPerTrip: 450000, currency: 'IDR' },
    { entityId: 'nh-indo', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 450000, foodPerDay: 160000, cabPerDay: 180000, airfarePerTrip: 1200000, busTrainPerTrip: 300000, currency: 'IDR' },
    { entityId: 'nh-indo', location: 'Indo-Jakarta', category: 'City', hotelPerDay: 750000, foodPerDay: 250000, cabPerDay: 300000, airfarePerTrip: 1800000, busTrainPerTrip: 500000, currency: 'IDR' },
    { entityId: 'nh-indo', location: 'Indo-Jakarta', category: 'Non-City', hotelPerDay: 500000, foodPerDay: 180000, cabPerDay: 200000, airfarePerTrip: 1400000, busTrainPerTrip: 350000, currency: 'IDR' },
    { entityId: 'nh-indo', location: 'Indonesia', category: 'City', hotelPerDay: 700000, foodPerDay: 220000, cabPerDay: 280000, airfarePerTrip: 1600000, busTrainPerTrip: 450000, currency: 'IDR' },
    { entityId: 'nh-indo', location: 'Indonesia', category: 'Non-City', hotelPerDay: 450000, foodPerDay: 160000, cabPerDay: 180000, airfarePerTrip: 1200000, busTrainPerTrip: 300000, currency: 'IDR' },

    // Nepal (NPR) — Default & Specific
    { entityId: 'nh-nepal', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 4500, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 10000, busTrainPerTrip: 2000, currency: 'NPR' },
    { entityId: 'nh-nepal', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 2800, foodPerDay: 800, cabPerDay: 1000, airfarePerTrip: 8000, busTrainPerTrip: 1200, currency: 'NPR' },
    { entityId: 'nh-nepal', location: 'Nepal', category: 'City', hotelPerDay: 4500, foodPerDay: 1200, cabPerDay: 1500, airfarePerTrip: 10000, busTrainPerTrip: 2000, currency: 'NPR' },
    { entityId: 'nh-nepal', location: 'Nepal', category: 'Non-City', hotelPerDay: 2800, foodPerDay: 800, cabPerDay: 1000, airfarePerTrip: 8000, busTrainPerTrip: 1200, currency: 'NPR' },

    // US (USD) — Default & Specific
    { entityId: 'noora-us', location: 'Default (All Locations)', category: 'City', isDefault: true, hotelPerDay: 180, foodPerDay: 70, cabPerDay: 60, airfarePerTrip: 450, busTrainPerTrip: 120, currency: 'USD' },
    { entityId: 'noora-us', location: 'Default (All Locations)', category: 'Non-City', isDefault: true, hotelPerDay: 120, foodPerDay: 50, cabPerDay: 40, airfarePerTrip: 350, busTrainPerTrip: 80, currency: 'USD' },
    { entityId: 'noora-us', location: 'US', category: 'City', hotelPerDay: 180, foodPerDay: 70, cabPerDay: 60, airfarePerTrip: 450, busTrainPerTrip: 120, currency: 'USD' },
    { entityId: 'noora-us', location: 'US', category: 'Non-City', hotelPerDay: 120, foodPerDay: 50, cabPerDay: 40, airfarePerTrip: 350, busTrainPerTrip: 80, currency: 'USD' }
  ],

  // ─── Implementation (IMP) ToT Standard Benchmark Unit Rates (Country Defaults & 5D State Overrides) ───
  defaultImpUnitRates: [
    // ─── 🏛️ Tier 1: Country-Level Default Benchmark Rates ───
    {
      id: 'country_india',
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'IN-DEFAULT',
      location: 'India (Country Default)',
      stateName: 'India Baseline (All States)',
      currency: 'INR',
      isCountryDefault: true,
      hotelPerDay: 1890,
      cabPerDay: 5000,
      foodPerDay: 1000,
      busTrainPerTrip: 1888,
      kitCost: 4799,
      dollCost: 266,
      thaliCost: 180,
      bannerCost: 1008,
      backdropCost: 3360,
      venueHallPerDay: 5250,
      venueFoodPerPerson: 750,
      courierPerEvent: 800,
      launchCollaterals: 8159,
      otherPrinting: 1500,
      pcCabPerVisit: 4725,
      pcFoodPerVisit: 1260,
      nonPcHotelPerDay: 2363,
      nonPcCabPerDay: 4200,
      nonPcFoodPerDay: 1180,
      airfareRoundtrip: 16520,
      leadershipHotelPerDay: 5985
    },
    {
      id: 'country_bangladesh',
      entityId: 'nhbd',
      country: 'Bangladesh',
      stateCode: 'BD-DEFAULT',
      location: 'Bangladesh (Country Default)',
      stateName: 'Bangladesh Baseline (All Hubs)',
      currency: 'BDT',
      isCountryDefault: true,
      hotelPerDay: 3000,
      cabPerDay: 5500,
      foodPerDay: 1100,
      busTrainPerTrip: 1350,
      kitCost: 5500,
      dollCost: 350,
      thaliCost: 220,
      bannerCost: 1150,
      backdropCost: 3900,
      venueHallPerDay: 6000,
      venueFoodPerPerson: 875,
      courierPerEvent: 550,
      launchCollaterals: 9250,
      otherPrinting: 1700,
      pcCabPerVisit: 4750,
      pcFoodPerVisit: 1300,
      nonPcHotelPerDay: 2650,
      nonPcCabPerDay: 4250,
      nonPcFoodPerDay: 1200,
      airfareRoundtrip: 11000,
      leadershipHotelPerDay: 6500
    },
    {
      id: 'country_indonesia',
      entityId: 'nh-indo',
      country: 'Indonesia',
      stateCode: 'ID-DEFAULT',
      location: 'Indonesia (Country Default)',
      stateName: 'Indonesia Baseline (All Regions)',
      currency: 'IDR',
      isCountryDefault: true,
      hotelPerDay: 650000,
      cabPerDay: 850000,
      foodPerDay: 250000,
      busTrainPerTrip: 300000,
      kitCost: 850000,
      dollCost: 65000,
      thaliCost: 45000,
      bannerCost: 200000,
      backdropCost: 750000,
      venueHallPerDay: 1200000,
      venueFoodPerPerson: 150000,
      courierPerEvent: 100000,
      launchCollaterals: 1500000,
      otherPrinting: 250000,
      pcCabPerVisit: 750000,
      pcFoodPerVisit: 200000,
      nonPcHotelPerDay: 750000,
      nonPcCabPerDay: 900000,
      nonPcFoodPerDay: 280000,
      airfareRoundtrip: 2500000,
      leadershipHotelPerDay: 1500000
    },
    {
      id: 'country_nepal',
      entityId: 'nh-nepal',
      country: 'Nepal',
      stateCode: 'NP-DEFAULT',
      location: 'Nepal (Country Default)',
      stateName: 'Nepal Baseline (All Regions)',
      currency: 'NPR',
      isCountryDefault: true,
      hotelPerDay: 4500,
      cabPerDay: 4000,
      foodPerDay: 1200,
      busTrainPerTrip: 1500,
      kitCost: 6000,
      dollCost: 400,
      thaliCost: 250,
      bannerCost: 1500,
      backdropCost: 4500,
      venueHallPerDay: 7000,
      venueFoodPerPerson: 950,
      courierPerEvent: 650,
      launchCollaterals: 10000,
      otherPrinting: 1800,
      pcCabPerVisit: 5000,
      pcFoodPerVisit: 1400,
      nonPcHotelPerDay: 3500,
      nonPcCabPerDay: 4500,
      nonPcFoodPerDay: 1300,
      airfareRoundtrip: 12000,
      leadershipHotelPerDay: 7500
    },
    {
      id: 'country_usa',
      entityId: 'noora-us',
      country: 'USA',
      stateCode: 'US-DEFAULT',
      location: 'USA (Country Default)',
      stateName: 'USA Baseline (All States)',
      currency: 'USD',
      isCountryDefault: true,
      hotelPerDay: 180,
      cabPerDay: 60,
      foodPerDay: 70,
      busTrainPerTrip: 120,
      kitCost: 75,
      dollCost: 15,
      thaliCost: 10,
      bannerCost: 45,
      backdropCost: 120,
      venueHallPerDay: 350,
      venueFoodPerPerson: 40,
      courierPerEvent: 30,
      launchCollaterals: 250,
      otherPrinting: 50,
      pcCabPerVisit: 150,
      pcFoodPerVisit: 80,
      nonPcHotelPerDay: 220,
      nonPcCabPerDay: 90,
      nonPcFoodPerDay: 85,
      airfareRoundtrip: 450,
      leadershipHotelPerDay: 300
    },

    // ─── 📍 Tier 2: Specific 5D State/Location Overrides ───
    {
      id: 'rate_india_mh',
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'MH',
      location: 'India MH',
      stateName: 'Maharashtra',
      currency: 'INR',
      isCountryDefault: false,
      hotelPerDay: 2363,
      cabPerDay: 4725,
      foodPerDay: 1180,
      busTrainPerTrip: 2000,
      kitCost: 4799,
      dollCost: 266,
      thaliCost: 180,
      bannerCost: 756,
      backdropCost: 2478,
      venueHallPerDay: 5250,
      venueFoodPerPerson: 1500,
      courierPerEvent: 950,
      launchCollaterals: 8159,
      otherPrinting: 1500,
      pcCabPerVisit: 4725,
      pcFoodPerVisit: 1260,
      nonPcHotelPerDay: 2363,
      nonPcCabPerDay: 4200,
      nonPcFoodPerDay: 1180,
      airfareRoundtrip: 16520,
      leadershipHotelPerDay: 5985
    },
    {
      id: 'rate_india_od',
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'OD',
      location: 'India OD',
      stateName: 'Odisha',
      currency: 'INR',
      isCountryDefault: false,
      hotelPerDay: 2000,
      cabPerDay: 4500,
      foodPerDay: 1000,
      busTrainPerTrip: 1888,
      kitCost: 4799,
      dollCost: 266,
      thaliCost: 180,
      bannerCost: 1344,
      backdropCost: 3360,
      venueHallPerDay: 5250,
      venueFoodPerPerson: 1000,
      courierPerEvent: 950,
      launchCollaterals: 8159,
      otherPrinting: 1500,
      pcCabPerVisit: 4725,
      pcFoodPerVisit: 1260,
      nonPcHotelPerDay: 2363,
      nonPcCabPerDay: 4200,
      nonPcFoodPerDay: 1180,
      airfareRoundtrip: 16520,
      leadershipHotelPerDay: 5985
    },
    {
      id: 'rate_bd_dha',
      entityId: 'nhbd',
      country: 'Bangladesh',
      stateCode: 'BD-DHA',
      location: 'DHA-Dhaka',
      stateName: 'Dhaka Division',
      currency: 'BDT',
      isCountryDefault: false,
      hotelPerDay: 3500,
      cabPerDay: 6000,
      foodPerDay: 1200,
      busTrainPerTrip: 1500,
      kitCost: 5500,
      dollCost: 350,
      thaliCost: 220,
      bannerCost: 1200,
      backdropCost: 4000,
      venueHallPerDay: 6500,
      venueFoodPerPerson: 900,
      courierPerEvent: 600,
      launchCollaterals: 9500,
      otherPrinting: 1800,
      pcCabPerVisit: 5000,
      pcFoodPerVisit: 1400,
      nonPcHotelPerDay: 2800,
      nonPcCabPerDay: 4500,
      nonPcFoodPerDay: 1300,
      airfareRoundtrip: 12000,
      leadershipHotelPerDay: 7000
    },
    {
      id: 'rate_bd_khu',
      entityId: 'nhbd',
      country: 'Bangladesh',
      stateCode: 'BD-KHU',
      location: 'KHU-Khulna',
      stateName: 'Khulna Division',
      currency: 'BDT',
      isCountryDefault: false,
      hotelPerDay: 2800,
      cabPerDay: 5000,
      foodPerDay: 1000,
      busTrainPerTrip: 1200,
      kitCost: 5500,
      dollCost: 350,
      thaliCost: 220,
      bannerCost: 1100,
      backdropCost: 3800,
      venueHallPerDay: 5500,
      venueFoodPerPerson: 850,
      courierPerEvent: 500,
      launchCollaterals: 9000,
      otherPrinting: 1600,
      pcCabPerVisit: 4500,
      pcFoodPerVisit: 1200,
      nonPcHotelPerDay: 2500,
      nonPcCabPerDay: 4000,
      nonPcFoodPerDay: 1100,
      airfareRoundtrip: 10000,
      leadershipHotelPerDay: 6000
    }
  ],

  // ─── IMP ToT Standard Built-In Benchmark Rate Fields (Admin Configurable) ───
  defaultImpStandardBenchmarkFields: [
    { id: 'hotelPerDay', fieldKey: 'hotelPerDay', name: '🏨 Hotel Accommodation (Double Occupancy)', category: 'travel', defaultGlCode: '93101', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per trainer / night', defaultFormula: 'events_days_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'cabPerDay', fieldKey: 'cabPerDay', name: '🚕 Local Cab Travel', category: 'travel', defaultGlCode: '93104', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per vehicle / day', defaultFormula: 'events_days_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'foodPerDay', fieldKey: 'foodPerDay', name: '🍱 Trainer Food Allowance (Per Diem)', category: 'travel', defaultGlCode: '93102', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per trainer / day', defaultFormula: 'events_days_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'busTrainPerTrip', fieldKey: 'busTrainPerTrip', name: '🚆 Bus / Train Roundtrip Transit', category: 'travel', defaultGlCode: '93105', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per trainer / roundtrip', defaultFormula: 'events_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'kitCost', fieldKey: 'kitCost', name: '📦 Training Collateral Kits', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per facility kit package', defaultFormula: 'facilities_rate', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'dollCost', fieldKey: 'dollCost', name: '🎎 Doll Model Sets (Per Unit)', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per doll model (2 sets/facility)', defaultFormula: 'facilities_multiplier', defaultMultiplier: 2, isBuiltIn: true },
    { id: 'thaliCost', fieldKey: 'thaliCost', name: '🍽️ Thali Model Sets (Per Unit)', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per thali model (3 sets/facility)', defaultFormula: 'facilities_multiplier', defaultMultiplier: 3, isBuiltIn: true },
    { id: 'bannerCost', fieldKey: 'bannerCost', name: '🏷️ Training Banners (3x6 ft Pair)', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per training batch / facility', defaultFormula: 'events_rate', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'backdropCost', fieldKey: 'backdropCost', name: '🎭 Stage Backdrop Setup', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per batch stage setup', defaultFormula: 'events_rate', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'venueHallPerDay', fieldKey: 'venueHallPerDay', name: '🏢 Training Venue Hall Rental', category: 'venue', defaultGlCode: '93201', parentAccount: 'Other Direct Expenses', unitDesc: 'Per hall / training day', defaultFormula: 'events_days_hall', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'venueFoodPerPerson', fieldKey: 'venueFoodPerPerson', name: '🍽️ Participant Food & Catering', category: 'venue', defaultGlCode: '93201', parentAccount: 'Other Direct Expenses', unitDesc: 'Per participant / day', defaultFormula: 'events_days_participants', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'launchCollaterals', fieldKey: 'launchCollaterals', name: '🚀 Facility Launch Collateral Package', category: 'printing', defaultGlCode: '93204', parentAccount: 'Supplies & Printing Costs', unitDesc: 'Per facility launch setup', defaultFormula: 'facilities_rate', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'courierPerEvent', fieldKey: 'courierPerEvent', name: '📦 Courier & Collateral Dispatch', category: 'communication', defaultGlCode: '93302', parentAccount: 'Communication Cost', unitDesc: 'Per dispatch batch', defaultFormula: 'events_rate', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'pcCabPerVisit', fieldKey: 'pcCabPerVisit', name: '🚗 Program Coordinator (PC) Cab Visit', category: 'supervision', defaultGlCode: '93104', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per monitoring visit', defaultFormula: 'facilities_pc_cab', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'pcFoodPerVisit', fieldKey: 'pcFoodPerVisit', name: '🍱 PC Food Allowance (Per Visit)', category: 'supervision', defaultGlCode: '93102', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per monitoring visit', defaultFormula: 'facilities_pc_food', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'nonPcHotelPerDay', fieldKey: 'nonPcHotelPerDay', name: '🏨 Specialist / Non-PC Hotel', category: 'travel', defaultGlCode: '93101', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per night / person', defaultFormula: 'events_days_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'airfareRoundtrip', fieldKey: 'airfareRoundtrip', name: '✈️ Flight Airfare Roundtrip', category: 'travel', defaultGlCode: '93103', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per person / roundtrip', defaultFormula: 'events_trainers', defaultMultiplier: 1, isBuiltIn: true },
    { id: 'leadershipHotelPerDay', fieldKey: 'leadershipHotelPerDay', name: '🏨 Leadership Hotel Accommodation', category: 'travel', defaultGlCode: '93101', parentAccount: 'Travel & Lodging Expenses', unitDesc: 'Per night / person', defaultFormula: 'events_days_trainers', defaultMultiplier: 1, isBuiltIn: true }
  ],

  // ─── IMP ToT Custom Benchmark Rate Fields (Admin Configurable) ───
  defaultImpCustomRateFields: [
    {
      id: 'doctorHonorarium',
      fieldKey: 'doctorHonorarium',
      name: '🩺 Doctor / Specialist Honorarium',
      category: 'professional',
      defaultGlCode: '93701',
      parentAccount: 'Professional & Consultancy Charges',
      unitDesc: 'Per doctor / session',
      defaultFormula: 'events_days_honorarium',
      defaultMultiplier: 1,
      isBuiltIn: false
    },
    {
      id: 'stationeryCertificates',
      fieldKey: 'stationeryCertificates',
      name: '📚 Stationery, Certificates & Badges',
      category: 'printing',
      defaultGlCode: '93204',
      parentAccount: 'Supplies & Printing Costs',
      unitDesc: 'Per participant kit',
      defaultFormula: 'participants_rate',
      defaultMultiplier: 1,
      isBuiltIn: false
    },
    {
      id: 'avRentalPerDay',
      fieldKey: 'avRentalPerDay',
      name: '📽️ AV & Projector Equipment Rental',
      category: 'venue',
      defaultGlCode: '93201',
      parentAccount: 'Other Direct Expenses',
      unitDesc: 'Per training day',
      defaultFormula: 'events_days_hall',
      defaultMultiplier: 1,
      isBuiltIn: false
    }
  ],

  // ─── IMP Benchmark Rate Field Categories (Admin Configurable) ───
  defaultImpRateCategories: [
    { id: 'travel', code: 'travel', name: 'Travel & Lodging', icon: '🚕', colorClass: 'badge-indigo', isBuiltIn: true },
    { id: 'printing', code: 'printing', name: 'Supplies, Kits & Printing', icon: '📦', colorClass: 'badge-cyan', isBuiltIn: true },
    { id: 'venue', code: 'venue', name: 'Venue Hall, AV & Catering', icon: '🏢', colorClass: 'badge-emerald', isBuiltIn: true },
    { id: 'professional', code: 'professional', name: 'Professional & Doctor Honorarium', icon: '🩺', colorClass: 'badge-indigo', isBuiltIn: true },
    { id: 'supervision', code: 'supervision', name: 'Supportive Supervision & Monitoring', icon: '🚗', colorClass: 'badge-purple', isBuiltIn: true },
    { id: 'communication', code: 'communication', name: 'Postage & Courier', icon: '📦', colorClass: 'badge-cyan', isBuiltIn: true },
    { id: 'digital', code: 'digital', name: 'Digital & Technology', icon: '💻', colorClass: 'badge-cyan', isBuiltIn: false },
    { id: 'translation', code: 'translation', name: 'Translation & Localization', icon: '🌐', colorClass: 'badge-purple', isBuiltIn: false },
    { id: 'misc', code: 'misc', name: 'Miscellaneous Direct Expenses', icon: '⚙️', colorClass: 'badge-secondary', isBuiltIn: true }
  ],

  // ─── IMP ToT Activity-Specific Master Templates (Activities 10.1 to 10.8) ───
  defaultImpActivityTemplates: [
    {
      code: '10.1',
      activityName: '10.1-Bundled ToT- Master trainers',
      componentId: 'bundled-tot',
      title: 'State Level Bundled ToT (Master Trainers)',
      icon: '🏛️',
      badgeClass: 'badge-indigo',
      hasToolPackage: true,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 3,
        facilitiesCount: 15,
        participantsCount: 30,
        teamSize: 3,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-101-hotel',
          description: '🏨 Hotel Accommodation (Double Occupancy)',
          ledgerCode: '93101',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'hotelPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-cab',
          description: '🚕 Local Cab Travel',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-food',
          description: '🍱 Trainer Food Allowance (Per Diem)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'foodPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-transit',
          description: '🚆 Bus / Train Roundtrip Transit',
          ledgerCode: '93105',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'busTrainPerTrip',
          formulaType: 'events_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-kits',
          description: '📦 Training Collateral Kits',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'kitCost',
          formulaType: 'facilities_rate',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-dolls',
          description: '🎎 Doll Model Sets (2 per facility)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'dollCost',
          formulaType: 'facilities_multiplier',
          multiplier: 2,
          defaultActive: true
        },
        {
          id: 'line-101-thalis',
          description: '🍽️ Thali Model Sets (3 per facility)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'thaliCost',
          formulaType: 'facilities_multiplier',
          multiplier: 3,
          defaultActive: true
        },
        {
          id: 'line-101-banners',
          description: '🏷️ Banners & Stage Backdrops (3x6 ft)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          secondaryRateField: 'backdropCost',
          formulaType: 'events_rate_dual',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-101-venue',
          description: '🏢 Venue Hall Rental & Participant Catering',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueHallPerDay',
          secondaryRateField: 'venueFoodPerPerson',
          formulaType: 'events_days_hall_catering',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.2',
      activityName: '10.2-Non-bundled ToTs-Master Trainers',
      componentId: 'non-bundled-tot',
      title: 'State Level Non-Bundled ToT (Master Trainers)',
      icon: '🏛️',
      badgeClass: 'badge-indigo',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 3,
        facilitiesCount: 15,
        participantsCount: 30,
        teamSize: 3,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-102-hotel',
          description: '🏨 Hotel Accommodation (Double Occupancy)',
          ledgerCode: '93101',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'hotelPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-102-cab',
          description: '🚕 Local Cab Travel',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-102-food',
          description: '🍱 Trainer Food Allowance (Per Diem)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'foodPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-102-transit',
          description: '🚆 Bus / Train Roundtrip Transit',
          ledgerCode: '93105',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'busTrainPerTrip',
          formulaType: 'events_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-102-banners',
          description: '🏷️ Banners & Stage Backdrops (3x6 ft)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          secondaryRateField: 'backdropCost',
          formulaType: 'events_rate_dual',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-102-venue',
          description: '🏢 Venue Hall Rental & Participant Catering',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueHallPerDay',
          secondaryRateField: 'venueFoodPerPerson',
          formulaType: 'events_days_hall_catering',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.3',
      activityName: '10.3-Booster/ Refresher Training',
      componentId: 'refresher-tot',
      title: 'Booster / Refresher Training',
      icon: '🔄',
      badgeClass: 'badge-cyan',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 1,
        facilitiesCount: 10,
        participantsCount: 25,
        teamSize: 2,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-103-cab',
          description: '🚕 Local Cab Travel',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-103-food',
          description: '🍱 Trainer Food Allowance (Per Diem)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'foodPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-103-venue',
          description: '🏢 Venue Hall Rental & Participant Catering',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueHallPerDay',
          secondaryRateField: 'venueFoodPerPerson',
          formulaType: 'events_days_hall_catering',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-103-materials',
          description: '📋 Refresher Handouts & Training Materials',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          formulaType: 'events_rate',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.4',
      activityName: '10.4-Medical Officer training',
      componentId: 'mo-training',
      title: 'Medical Officer Training (MO Training)',
      icon: '🩺',
      badgeClass: 'badge-emerald',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 1,
        facilitiesCount: 10,
        participantsCount: 25,
        teamSize: 2,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-104-cab',
          description: '🚕 Local Cab Travel',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-104-food',
          description: '🍱 Trainer Food Allowance (Per Diem)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'foodPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-104-hall',
          description: '🏢 Medical Training Venue Hall Rental',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueHallPerDay',
          formulaType: 'events_days_hall',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-104-catering',
          description: '🍽️ MO Participant Catering & High Tea',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueFoodPerPerson',
          formulaType: 'events_days_participants',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-104-honorarium',
          description: '🩺 Doctor / Specialist Guest Honorarium',
          ledgerCode: '93701',
          parentAccount: 'Professional & Consultancy Charges',
          rateField: 'doctorHonorarium',
          formulaType: 'events_days_honorarium',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-104-materials',
          description: '📚 MO Clinical Protocols & Stationery',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          formulaType: 'events_rate',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.5',
      activityName: '10.5-District level training',
      componentId: 'district-tot',
      title: 'District Level Training (HWC / CHO Training)',
      icon: '🏥',
      badgeClass: 'badge-emerald',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 2,
        facilitiesCount: 10,
        participantsCount: 20,
        teamSize: 2,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-105-hotel',
          description: '🏨 Hotel Accommodation (Double Occupancy)',
          ledgerCode: '93101',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'hotelPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-105-cab',
          description: '🚕 District Local Cab Travel',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-105-food',
          description: '🍱 Trainer Food Allowance (Per Diem)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'foodPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-105-kits',
          description: '📦 HWC / CHO Training Collateral Kits',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'kitCost',
          formulaType: 'facilities_rate',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-105-venue',
          description: '🏢 District Training Hall Rental & Catering',
          ledgerCode: '93201',
          parentAccount: 'Other Direct Expenses',
          rateField: 'venueHallPerDay',
          secondaryRateField: 'venueFoodPerPerson',
          formulaType: 'events_days_hall_catering',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-105-banners',
          description: '🏷️ District Banners & Signage',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          formulaType: 'events_rate',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.6',
      activityName: '10.6-Facility Launch',
      componentId: 'facility-launch',
      title: 'Facility Launch & Collateral Deployment',
      icon: '🚀',
      badgeClass: 'badge-cyan',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 1,
        facilitiesCount: 15,
        participantsCount: 10,
        teamSize: 2,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-106-launch-pkg',
          description: '🚀 Facility Launch Collateral Packages',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'launchCollaterals',
          formulaType: 'facilities_rate',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-106-dolls',
          description: '🎎 Doll Model Sets (2 per facility)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'dollCost',
          formulaType: 'facilities_multiplier',
          multiplier: 2,
          defaultActive: true
        },
        {
          id: 'line-106-thalis',
          description: '🍽️ Thali Model Sets (3 per facility)',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'thaliCost',
          formulaType: 'facilities_multiplier',
          multiplier: 3,
          defaultActive: true
        },
        {
          id: 'line-106-banners',
          description: '🏷️ Facility Launch Banners & Backdrops',
          ledgerCode: '93204',
          parentAccount: 'Supplies & Printing Costs',
          rateField: 'bannerCost',
          formulaType: 'facilities_rate',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-106-supervision',
          description: '🚗 Launch Supervision & PC Travel Visits',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'pcCabPerVisit',
          formulaType: 'facilities_pc_cab',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-106-courier',
          description: '📦 Facility Collateral Dispatch Courier',
          ledgerCode: '93302',
          parentAccount: 'Communication Cost',
          rateField: 'courierPerEvent',
          formulaType: 'events_rate',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.7',
      activityName: '10.7-Supportive Supervision',
      componentId: 'supervision-visits',
      title: 'Supportive Supervision & Monitoring (PCs & Non-PCs)',
      icon: '🚗',
      badgeClass: 'badge-indigo',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 1,
        facilitiesCount: 10,
        participantsCount: 5,
        teamSize: 1,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-107-pc-cab',
          description: '🚗 Program Coordinator (PC) Cab Visit',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'pcCabPerVisit',
          formulaType: 'facilities_pc_cab',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-107-pc-food',
          description: '🍱 PC Food Allowance (Per Visit)',
          ledgerCode: '93102',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'pcFoodPerVisit',
          formulaType: 'facilities_pc_food',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-107-nonpc-hotel',
          description: '🏨 Specialist / Non-PC Hotel Accommodation',
          ledgerCode: '93101',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'nonPcHotelPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        }
      ]
    },
    {
      code: '10.8',
      activityName: '10.8-Partnership Visits',
      componentId: 'partnership-visits',
      title: 'Partnership & Leadership Visits',
      icon: '✈️',
      badgeClass: 'badge-cyan',
      hasToolPackage: false,
      scaleDefaults: {
        eventCount: 1,
        daysCount: 2,
        facilitiesCount: 5,
        participantsCount: 4,
        teamSize: 2,
        toolPackage: 'Tool Package - 1 (Standard)'
      },
      lineItems: [
        {
          id: 'line-108-airfare',
          description: '✈️ Roundtrip Flight Airfare',
          ledgerCode: '93103',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'airfareRoundtrip',
          formulaType: 'events_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-108-hotel',
          description: '🏨 Leadership Hotel Accommodation',
          ledgerCode: '93101',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'leadershipHotelPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        },
        {
          id: 'line-108-cab',
          description: '🚕 Local Travel & Vehicle Hire',
          ledgerCode: '93104',
          parentAccount: 'Travel & Lodging Expenses',
          rateField: 'cabPerDay',
          formulaType: 'events_days_trainers',
          multiplier: 1,
          defaultActive: true
        }
      ]
    }
  ],

  // ─── Prior Period Costs Seed Data (CY-2025 Actuals for CY-2026 Budget Comparison) ───
  priorYearActuals: [
    { id: 'pya-yaif-pdel-91101', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Personnel Expenses', glDescription: 'Salaries and Wages', ledgerCode: '91101', priorCost: 2850000, currency: 'INR', remarks: 'CY-2025 audited actuals' },
    { id: 'pya-yaif-pdel-91301', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Personnel Expenses', glDescription: 'Staff Training, Learning and Development', ledgerCode: '91301', priorCost: 120000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-yaif-pdel-91201', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Personnel Expenses', glDescription: 'Gratuity', ledgerCode: '91201', priorCost: 142500, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-yaif-pdel-92101', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Program Resource Person - Consultant', glDescription: 'Program Resource Person - Consultant', ledgerCode: '92101', priorCost: 450000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-yaif-pdel-11301', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Fixed Assets', glDescription: 'Laptop', ledgerCode: '11301', priorCost: 180000, currency: 'INR', remarks: 'CY-2025 asset additions' },
    { id: 'pya-yaif-pdel-93101', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Hotel Accommodation', ledgerCode: '93101', priorCost: 320000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-yaif-pdel-93103', yearId: '2026', entityId: 'yaif', deptId: 'pdel-imp', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Air fare', ledgerCode: '93103', priorCost: 410000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-nhipl-pdd-91101', yearId: '2026', entityId: 'nhipl', deptId: 'in-pdd-med', parentAccount: 'Personnel Expenses', glDescription: 'Salaries and Wages', ledgerCode: '91101', priorCost: 3600000, currency: 'INR', remarks: 'CY-2025 audited actuals' },
    { id: 'pya-nhipl-pdd-93101', yearId: '2026', entityId: 'nhipl', deptId: 'in-pdd-med', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Hotel Accommodation', ledgerCode: '93101', priorCost: 260000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-nhipl-pdd-93103', yearId: '2026', entityId: 'nhipl', deptId: 'in-pdd-med', parentAccount: 'Travel & Lodging Expenses', glDescription: 'Air fare', ledgerCode: '93103', priorCost: 340000, currency: 'INR', remarks: 'CY-2025 actuals' },
    { id: 'pya-us-exec-91101', yearId: '2026', entityId: 'noora-us', deptId: 'us-exec', parentAccount: 'Personnel Expenses', glDescription: 'Salaries and Wages', ledgerCode: '91101', priorCost: 240000, currency: 'USD', remarks: 'CY-2025 actuals' },
    { id: 'pya-bd-pdd-91101', yearId: '2026', entityId: 'nhbd', deptId: 'bd-pdd-med', parentAccount: 'Personnel Expenses', glDescription: 'Salaries and Wages', ledgerCode: '91101', priorCost: 1800000, currency: 'BDT', remarks: 'CY-2025 actuals' }
  ],

  // ─── RBAC: Standard Role Definitions (8 Tier System) ───
  defaultRoles: [
    // ─── TIER 1: Super Admin ───
    {
      id: 'role-admin',
      name: 'System Administrator',
      tier: 1,
      description: 'Super-user with unrestricted access across all entities, departments, and operations. Can unlock finalized budgets.',
      isSystem: true,
      badgeColor: 'emerald',
      isSuperAdmin: true,
      permissions: {
        'salaries': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'other-staff': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'gratuity': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'eha': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'fixed-assets': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'other-costs': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'total-dept-cost': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'imp-tot-rates': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'prior-period': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'reports': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'config': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true }
      }
    },
    // ─── TIER 2: Entity Admin ───
    {
      id: 'role-entity-admin',
      name: 'Entity Administrator',
      tier: 2,
      description: 'Full admin access within assigned entity/entities only. Cannot access other entities or unlock finalized budgets.',
      isSystem: true,
      badgeColor: 'teal',
      isEntityAdmin: true,
      permissions: {
        'salaries': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'other-staff': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'gratuity': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'eha': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'fixed-assets': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'other-costs': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'total-dept-cost': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'imp-tot-rates': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'prior-period': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'reports': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true },
        'config': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: true }
      }
    },
    // ─── TIER 3: HR Team ───
    {
      id: 'role-hr-team',
      name: 'HR Team',
      tier: 3,
      description: 'Updates Payroll costs (Salaries, Other Staff, Gratuity, EHA, Fixed Assets) for assigned departments/entities.',
      isSystem: true,
      badgeColor: 'blue',
      permissions: {
        'salaries': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'other-staff': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'gratuity': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'eha': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'fixed-assets': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'other-costs': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'imp-tot-rates': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'prior-period': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'reports': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── TIER 4: Department Lead ───
    {
      id: 'role-dept-lead',
      name: 'Department Lead',
      tier: 4,
      description: 'Fills Other Costs for their departments. Payroll view access configurable by Admin. Can delegate to sub-assignees.',
      isSystem: true,
      badgeColor: 'primary',
      permissions: {
        'salaries': { view: false, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'other-staff': { view: false, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'gratuity': { view: false, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'eha': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'fixed-assets': { view: false, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'other-costs': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'imp-tot-rates': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: false, finalize: false },
        'prior-period': { view: true, add: false, edit: true, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'reports': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── TIER 5: Data Entry / Sub-Assignee ───
    {
      id: 'role-data-entry',
      name: 'Data Entry / Sub-Assignee',
      tier: 5,
      description: 'Fills specific categories or lines assigned by Admin. Can view everything their lead can see, but edits only what is explicitly assigned.',
      isSystem: true,
      badgeColor: 'purple',
      permissions: {
        'salaries': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'other-staff': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'gratuity': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'eha': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'other-costs': { view: true, add: true, edit: true, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'imp-tot-rates': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'prior-period': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'reports': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── TIER 6: Country Director ───
    {
      id: 'role-country-director',
      name: 'Country Director',
      tier: 6,
      description: 'Reviews full budget for their entity. Sees all departments by default (Admin can restrict). Can add remarks and mark reviewed.',
      isSystem: true,
      badgeColor: 'amber',
      permissions: {
        'salaries': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'other-staff': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'gratuity': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'eha': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'other-costs': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'imp-tot-rates': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'prior-period': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
        'reports': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: false, finalize: false },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── TIER 7: Finance Team ───
    {
      id: 'role-finance-mgr',
      name: 'Finance Team',
      tier: 7,
      description: 'Entity-wise verification and approval. Internal access tiers configurable by Admin. Finance approval is a prerequisite for Final Sign-off.',
      isSystem: true,
      badgeColor: 'cyan',
      permissions: {
        'salaries': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'other-staff': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'gratuity': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'eha': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'fixed-assets': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'other-costs': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'total-dept-cost': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'imp-tot-rates': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'prior-period': { view: true, add: true, edit: true, delete: true, remarks: true, review: true, approve: true, finalize: false },
        'reports': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: false },
        'config': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── TIER 8: Finalizer ───
    {
      id: 'role-finalizer',
      name: 'Budget Finalizer',
      tier: 8,
      description: 'Final global sign-off. Once Finalized, ALL budget data is locked — no edits by anyone (including Entity Admins). Exchange rates, travel rates, and TOT rates are snapshotted at time of finalization.',
      isSystem: true,
      badgeColor: 'rose',
      isFinalizer: true,
      permissions: {
        'salaries': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'other-staff': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'gratuity': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'eha': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'other-costs': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'imp-tot-rates': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'prior-period': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'reports': { view: true, add: false, edit: false, delete: false, remarks: true, review: true, approve: true, finalize: true },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    },
    // ─── LEGACY COMPAT: Auditor / Viewer ───
    {
      id: 'role-auditor',
      name: 'Auditor / Viewer',
      tier: 5,
      description: 'Read-only access across all budget sheets and reports without editing or approval capabilities.',
      isSystem: true,
      badgeColor: 'gray',
      permissions: {
        'salaries': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'other-staff': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'gratuity': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'eha': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'other-costs': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'imp-tot-rates': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'prior-period': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'reports': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
        'config': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
      }
    }
  ],

  // ─── Users Seed Data — Multi-Role Assignment Model ───
  // Each user can have multiple roleAssignments, each with its own role, entity scope, dept scope,
  // and optional category/line-item overrides. Backward-compatible: if only 'roleId' present, treated as single global assignment.
  defaultUsers: [
    // ─── TIER 1: Super Admin ───
    {
      id: 'user-admin',
      name: 'Arun Kumar',
      email: 'arun.admin@noorahealth.org',
      title: 'Global Systems & Budget Admin',
      roleId: 'role-admin',          // legacy compat (also drives initial enrichment)
      roleAssignments: [
        {
          assignmentId: 'asgn-admin-01',
          roleId: 'role-admin',
          entities: 'all',
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👨‍💼',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    // ─── TIER 2: Entity Admin (NHIPL) ───
    {
      id: 'user-entity-admin-nhipl',
      name: 'Priya Iyer',
      email: 'priya.ea@noorahealth.org',
      title: 'NHIPL Entity Administrator',
      roleId: 'role-entity-admin',
      roleAssignments: [
        {
          assignmentId: 'asgn-ea-nhipl-01',
          roleId: 'role-entity-admin',
          entities: ['nhipl'],
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👩‍💼',
      createdAt: '2026-01-02T00:00:00.000Z'
    },
    // ─── TIER 3: HR Team ───
    {
      id: 'user-hr-team',
      name: 'Deepa Nair',
      email: 'deepa.hr@noorahealth.org',
      title: 'HR Manager — India',
      roleId: 'role-hr-team',
      roleAssignments: [
        {
          assignmentId: 'asgn-hr-nhipl-01',
          roleId: 'role-hr-team',
          entities: ['nhipl', 'yaif'],
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👩‍🏫',
      createdAt: '2026-01-03T00:00:00.000Z'
    },
    // ─── TIER 4: Department Lead — HCOMM ───
    {
      id: 'user-lead-hcomm',
      name: 'Rajesh Varma',
      email: 'rajesh.hcomm@noorahealth.org',
      title: 'Lead — Healthcare Communications',
      roleId: 'role-dept-lead',
      roleAssignments: [
        {
          assignmentId: 'asgn-lead-hcomm-01',
          roleId: 'role-dept-lead',
          entities: ['nhipl', 'yaif'],
          departments: ['pdd-hcomm'],
          // Admin has configured: Payroll view = true for this lead
          categoryOverrides: {
            'salaries': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
            'other-staff': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
            'gratuity': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
            'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false }
          },
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👨‍⚕️',
      createdAt: '2026-01-05T00:00:00.000Z'
    },
    // ─── TIER 4: Department Lead — PDEL (multi-dept example) ───
    {
      id: 'user-lead-pdel',
      name: 'Amitabh Sen',
      email: 'amitabh.pdel@noorahealth.org',
      title: 'Program Director — Implementation',
      roleId: 'role-dept-lead',
      roleAssignments: [
        {
          assignmentId: 'asgn-lead-pdel-01',
          roleId: 'role-dept-lead',
          entities: ['yaif', 'nhipl'],
          departments: ['pdel-imp', 'pdel-trng'],
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👨‍🏫',
      createdAt: '2026-01-12T00:00:00.000Z'
    },
    // ─── TIER 5: Data Entry / Sub-Assignee (HCOMM Other Costs only) ───
    {
      id: 'user-pooja-hcomm',
      name: 'Pooja Sharma',
      email: 'pooja.sharma@noorahealth.org',
      title: 'HCOMM Operations Associate',
      roleId: 'role-data-entry',
      roleAssignments: [
        {
          assignmentId: 'asgn-de-hcomm-01',
          roleId: 'role-data-entry',
          entities: ['nhipl'],
          departments: ['pdd-hcomm'],
          // Admin has granted: only Other Costs edit. View payroll for reference.
          categoryOverrides: {
            'salaries': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
            'other-staff': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
            'gratuity': { view: false, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
            'fixed-assets': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false },
            'other-costs': { view: true, add: true, edit: true, delete: true, remarks: true, review: false, approve: false, finalize: false },
            'total-dept-cost': { view: true, add: false, edit: false, delete: false, remarks: true, review: false, approve: false, finalize: false },
            'reports': { view: true, add: false, edit: false, delete: false, remarks: false, review: false, approve: false, finalize: false }
          },
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👩‍💻',
      createdAt: '2026-01-10T00:00:00.000Z'
    },
    // ─── TIER 6: Country Director ───
    {
      id: 'user-country-director',
      name: 'Dr. Kavitha Menon',
      email: 'kavitha.cd@noorahealth.org',
      title: 'Country Director — India',
      roleId: 'role-country-director',
      roleAssignments: [
        {
          assignmentId: 'asgn-cd-india-01',
          roleId: 'role-country-director',
          entities: ['nhipl', 'yaif'],
          departments: 'all',   // Country Directors see all depts by default
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👩‍⚕️',
      createdAt: '2026-01-07T00:00:00.000Z'
    },
    // ─── TIER 7: Finance Team ───
    {
      id: 'user-fin-mgr',
      name: 'Sneha Rao',
      email: 'sneha.finance@noorahealth.org',
      title: 'Finance Controller — India',
      roleId: 'role-finance-mgr',
      roleAssignments: [
        {
          assignmentId: 'asgn-fin-india-01',
          roleId: 'role-finance-mgr',
          entities: ['nhipl', 'yaif'],
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '👩‍💼',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    // ─── TIER 8: Finalizer ───
    {
      id: 'user-finalizer',
      name: 'Suresh Babu',
      email: 'suresh.cfo@noorahealth.org',
      title: 'Chief Financial Officer (CFO)',
      roleId: 'role-finalizer',
      roleAssignments: [
        {
          assignmentId: 'asgn-fin-global-01',
          roleId: 'role-finalizer',
          entities: 'all',
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '🏦',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    // ─── EXAMPLE: Multi-role User (HR for NHIPL + Lead for PDEL) ───
    {
      id: 'user-auditor',
      name: 'Vikram Mehta',
      email: 'vikram.audit@external.org',
      title: 'External Financial Auditor',
      roleId: 'role-auditor',
      roleAssignments: [
        {
          assignmentId: 'asgn-auditor-01',
          roleId: 'role-auditor',
          entities: 'all',
          departments: 'all',
          categoryOverrides: {},
          lineItemOverrides: {}
        }
      ],
      status: 'active',
      avatar: '🕵️',
      createdAt: '2026-01-15T00:00:00.000Z'
    }
  ],


  // ─── Initial Sample Audit Trail Entries ───
  sampleAuditLogs: [
    {
      id: 'audit-001',
      timestamp: '2026-08-20T10:15:30.000Z',
      userId: 'user-admin',
      userName: 'Arun Kumar',
      userRole: 'System Administrator',
      yearId: '2026',
      entityId: 'yaif',
      deptId: 'pdel-imp',
      category: 'prior-period',
      action: 'CREATE',
      recordId: 'pya-yaif-pdel-91101',
      description: 'Initialized CY-2025 prior period actuals for Salaries & Wages (91101)',
      changes: {
        previous: null,
        current: { ledgerCode: '91101', priorCost: 2850000, currency: 'INR' }
      }
    },
    {
      id: 'audit-002',
      timestamp: '2026-08-21T14:22:10.000Z',
      userId: 'user-fin-mgr',
      userName: 'Sneha Rao',
      userRole: 'Finance Manager',
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'in-pdd-med',
      category: 'salaries',
      action: 'UPDATE',
      recordId: 'nhipl-emp-101',
      description: 'Updated annual base salary for Lead Medical Specialist',
      changes: {
        previous: { baseSalary: 3400000 },
        current: { baseSalary: 3600000 }
      }
    }
  ],

  // ─── Initial Line Item Remark Threads & Action Items ───
  sampleRemarksThreads: [
    {
      id: 'rem-001',
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'in-pdd-hcomm',
      ledgerCode: '93101',
      glDescription: 'Hotel Accommodation',
      text: 'Please cross-verify the Q3 cohort hotel tariff with the updated rates before finalizing.',
      assignedByUserId: 'user-lead-hcomm',
      assignedByUserName: 'Rajesh Varma',
      assignedByRoleLevel: 50,
      assignedToUserId: 'user-pooja-hcomm',
      assignedToUserName: 'Pooja Sharma',
      status: 'open',
      createdAt: '2026-08-21T09:30:00.000Z',
      resolvedAt: null,
      resolvedByUserId: null,
      resolvedByUserName: null,
      resolutionNote: null
    },
    {
      id: 'rem-002',
      yearId: '2026',
      entityId: 'nhipl',
      deptId: 'in-pdd-hcomm',
      ledgerCode: '93103',
      glDescription: 'Air fare',
      text: 'Need breakdown of flight travel for regional site visits in October.',
      assignedByUserId: 'user-fin-mgr',
      assignedByUserName: 'Sneha Rao',
      assignedByRoleLevel: 80,
      assignedToUserId: 'user-lead-hcomm',
      assignedToUserName: 'Rajesh Varma',
      status: 'done',
      createdAt: '2026-08-20T11:00:00.000Z',
      resolvedAt: '2026-08-21T15:45:00.000Z',
      resolvedByUserId: 'user-lead-hcomm',
      resolvedByUserName: 'Rajesh Varma',
      resolutionNote: 'Attached flight schedule breakdown for 4 trainers across 3 states.'
    }
  ]
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.SEED_DATA = SEED_DATA;
}


