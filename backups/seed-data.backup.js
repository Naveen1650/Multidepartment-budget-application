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
      doj: '2023-08-01',
      entityId: 'nhipl',
      deptId: 'mne-ops',
      department: 'M&E Operations',
      reportingManager: 'Dr. Shahed Alam',
      annualCTC: 960000,
      monthlyCTC: 80000,
      designation: 'Data Analyst & M&E Associate',
      location: 'India KA',
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

  // ─── Implementation (IMP) ToT Standard Benchmark Unit Rates by State/Location ───
  defaultImpUnitRates: [
    {
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'KA',
      location: 'India KA',
      stateName: 'Karnataka',
      currency: 'INR',
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
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'AP',
      location: 'India AP',
      stateName: 'Andhra Pradesh',
      currency: 'INR',
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
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'TS',
      location: 'India TS',
      stateName: 'Telangana',
      currency: 'INR',
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
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'MH',
      location: 'India MH',
      stateName: 'Maharashtra',
      currency: 'INR',
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
      entityId: 'nhipl',
      country: 'India',
      stateCode: 'OD',
      location: 'India OD',
      stateName: 'Odisha',
      currency: 'INR',
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
      entityId: 'nhbd',
      country: 'Bangladesh',
      stateCode: 'BD-DHA',
      location: 'DHA-Dhaka',
      stateName: 'Dhaka Division',
      currency: 'BDT',
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
      entityId: 'nhbd',
      country: 'Bangladesh',
      stateCode: 'BD-KHU',
      location: 'KHU-Khulna',
      stateName: 'Khulna Division',
      currency: 'BDT',
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
    },
    {
      entityId: 'all',
      country: 'Global',
      stateCode: 'DEFAULT',
      location: 'Default (All Locations)',
      stateName: 'Default Standard Rates',
      currency: 'INR',
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
    }
  ],

  // ─── IMP ToT Custom Benchmark Rate Fields (Admin Configurable) ───
  defaultImpCustomRateFields: [
    {
      id: 'doctorHonorarium',
      fieldKey: 'doctorHonorarium',
      name: 'Doctor / Specialist Honorarium',
      category: 'professional',
      defaultGlCode: '93701',
      parentAccount: 'Professional & Consultancy Charges',
      defaultUnitRate: 5000,
      unitDesc: 'Per doctor / session'
    },
    {
      id: 'stationeryCertificates',
      fieldKey: 'stationeryCertificates',
      name: 'Stationery, Certificates & Badges',
      category: 'printing',
      defaultGlCode: '93204',
      parentAccount: 'Supplies & Printing Costs',
      defaultUnitRate: 150,
      unitDesc: 'Per participant kit'
    },
    {
      id: 'avRentalPerDay',
      fieldKey: 'avRentalPerDay',
      name: 'AV & Projector Equipment Rental',
      category: 'venue',
      defaultGlCode: '93201',
      parentAccount: 'Other Direct Expenses',
      defaultUnitRate: 1500,
      unitDesc: 'Per training day'
    }
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
  ]
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.SEED_DATA = SEED_DATA;
}


