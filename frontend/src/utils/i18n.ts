export type Language = 'en' | 'bn';

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandSubtitle: string;
  scenarioPreset: string;
  customScenario: string;
  apiOnline: string;
  apiConnecting: string;
  apiOffline: string;
  optimizeEnergy: string;
  optimizing: string;
  language: string;
  themeToggle: string;

  // Real-time Timer
  liveTime: string;
  operationalHour: string;
  peakHour: string;
  offPeakHour: string;
  solveDuration: string;

  // Menu Bar
  menuFile: string;
  menuOperations: string;
  menuView: string;
  menuLanguage: string;
  menuTools: string;
  menuHelp: string;

  // Navigation Items
  navDashboard: string;
  navScenario: string;
  navMatrix: string;
  navBattery: string;
  navDirectives: string;
  navResults: string;
  navCharts: string;
  navHistory: string;
  navDocs: string;

  // Metric Cards
  totalCost: string;
  baselineCost: string;
  netSavings: string;
  totalDemand: string;
  usableSolar: string;
  batteryThroughput: string;
  hoursOptimized: string;
  optimalStatus: string;
  savingsRatio: string;

  // Scenario & Operator Directives
  scenarioTitle: string;
  scenarioBadge: string;
  scenarioDesc: string;
  scenarioIdLabel: string;
  operatorNote: string;
  addNote: string;
  removeNote: string;
  clearNotes: string;
  quickTemplates: string;
  emptyNoteWarning: string;

  // Battery (BESS)
  batteryTitle: string;
  batteryBadge: string;
  batteryDesc: string;
  socGauge: string;
  initialSoc: string;
  minReserveFloor: string;
  capacityKwh: string;
  initialEnergyKwh: string;
  minReserveKwh: string;
  chargeRateKw: string;
  dischargeRateKw: string;
  roundTripEff: string;

  // Energy Matrix
  matrixTitle: string;
  matrixDesc: string;
  colHour: string;
  colDemand: string;
  colSolar: string;
  colTariff: string;
  colNetDemand: string;
  resetDefault: string;
  editJson: string;

  // AI Interpretation
  aiTitle: string;
  aiBadge: string;
  aiDesc: string;
  applied: string;
  noOp: string;
  directiveType: string;
  timeWindow: string;
  adjustment: string;
  explanation: string;
  guardrailVerified: string;

  // Results & Schedule
  resultsTitle: string;
  resultsBadge: string;
  resultsDesc: string;
  solverStatus: string;
  solverTime: string;
  verificationAudit: string;
  auditPassed: string;
  gridImportKwh: string;
  batteryAction: string;
  batteryEnergyAfter: string;
  exportJson: string;
  viewRawJson: string;

  // Top Navbar Center
  navTopDashboard: string;
  navTopOperations: string;
  navTopAnalytics: string;
  navTopOptimization: string;
  navTopReports: string;

  // Hero Section
  heroGreetingMorning: string;
  heroGreetingAfternoon: string;
  heroGreetingEvening: string;
  heroGreetingNight: string;
  heroTitle: string;
  heroSubtitle: string;
  systemStatusLabel: string;
  lastUpdatedLabel: string;
  refreshTooltip: string;

  // Energy Flow Centerpiece
  energyFlowTitle: string;
  energyFlowSubtitle: string;
  solarFlowLabel: string;
  gridFlowLabel: string;
  campusLoadLabel: string;
  batteryFlowLabel: string;
  flowSpeedLabel: string;
  generatingBadge: string;
  importingBadge: string;
  chargingBadge: string;
  dischargingBadge: string;
  standbyBadge: string;

  // System Health
  systemHealthTitle: string;
  systemHealthSubtitle: string;
  gridHealth: string;
  solarHealth: string;
  batteryHealth: string;
  optimizerHealth: string;
  llmHealth: string;

  // AI Energy Intelligence
  aiIntelligenceTitle: string;
  aiDefaultInsight: string;
  potentialSavingLabel: string;
  gridReductionLabel: string;
  carbonReductionLabel: string;
  viewAiAnalysisBtn: string;

  // Optimization Action Card
  readyToOptimizeTitle: string;
  readyToOptimizeDesc: string;
  runOptimizationBtn: string;
  stepAnalyzingDemand: string;
  stepForecastingSolar: string;
  stepOptimizingBattery: string;
  stepCalculatingGrid: string;
  stepGeneratingSchedule: string;
  stepOptimizationComplete: string;

  // Notifications
  notificationsTitle: string;
  noNewNotifications: string;
  noticePeakTariff: string;
  noticeSolarPeak: string;
  noticeAuditPassed: string;

  // Footer & Info
  systemArchitecture: string;
  optimizerEngine: string;
  llmInterpreter: string;
  auditMode: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandTitle: 'GridWise',
    brandSubtitle: 'Smart Campus Microgrid Optimizer',
    scenarioPreset: 'Scenario Preset',
    customScenario: 'Custom Scenario',
    apiOnline: 'API Online',
    apiConnecting: 'Connecting...',
    apiOffline: 'API Offline',
    optimizeEnergy: 'Optimize Energy',
    optimizing: 'Optimizing...',
    language: 'Language',
    themeToggle: 'Toggle Theme',

    liveTime: 'Live Time',
    operationalHour: 'Current Hour',
    peakHour: 'Peak Tariff',
    offPeakHour: 'Off-Peak Tariff',
    solveDuration: 'Solve Duration',

    menuFile: 'File',
    menuOperations: 'Operations',
    menuView: 'View',
    menuLanguage: 'Language',
    menuTools: 'Tools',
    menuHelp: 'Help',

    navDashboard: 'Dashboard Overview',
    navScenario: 'Scenario & Notes',
    navMatrix: '24-Hour Energy Data',
    navBattery: 'Battery Storage',
    navDirectives: 'AI Interpretation',
    navResults: 'Optimal Schedule',
    navCharts: 'Energy Analytics',
    navHistory: 'Run History',
    navDocs: 'API & Specs',

    totalCost: 'Total Optimized Cost',
    baselineCost: 'Without Battery Cost',
    netSavings: 'Net Cost Savings',
    totalDemand: 'Total 24h Demand',
    usableSolar: 'Usable Solar PV',
    batteryThroughput: 'Battery Cycles & DoD',
    hoursOptimized: '24 Hours Optimized',
    optimalStatus: 'Globally Optimal',
    savingsRatio: 'savings achieved',

    scenarioTitle: 'Scenario & Operator Directives',
    scenarioBadge: 'Natural Language Input',
    scenarioDesc: 'Provide 1 to 3 operational notes. The LLM interpreter extracts mathematical constraints with deterministic guardrails.',
    scenarioIdLabel: 'Scenario ID',
    operatorNote: 'Operator Note',
    addNote: 'Add Note',
    removeNote: 'Remove',
    clearNotes: 'Clear',
    quickTemplates: 'Quick Note Templates (Click to insert):',
    emptyNoteWarning: 'Operator notes cannot be blank before optimizing.',

    batteryTitle: 'Battery Energy Storage System (BESS)',
    batteryBadge: 'Hardware Specs',
    batteryDesc: 'Physical limits, rate boundaries, and reserve floors enforced deterministically by the LP solver.',
    socGauge: 'State of Charge Gauge',
    initialSoc: 'Initial SOC',
    minReserveFloor: 'Min Reserve Floor',
    capacityKwh: 'Capacity (kWh)',
    initialEnergyKwh: 'Initial Energy (kWh)',
    minReserveKwh: 'Min Reserve (kWh)',
    chargeRateKw: 'Max Charge Rate (kW)',
    dischargeRateKw: 'Max Discharge Rate (kW)',
    roundTripEff: 'Efficiency (%)',

    matrixTitle: '24-Hour Energy Profile Matrix',
    matrixDesc: 'Hourly load demands, rooftop solar generation forecasts, and time-of-use (TOU) tariff pricing.',
    colHour: 'Hour',
    colDemand: 'Load Demand (kWh)',
    colSolar: 'Solar PV (kWh)',
    colTariff: 'Grid Tariff (BDT/kWh)',
    colNetDemand: 'Net Demand (kWh)',
    resetDefault: 'Reset to Default',
    editJson: 'Edit Raw JSON',

    aiTitle: 'AI Interpretation & Extracted Directives',
    aiBadge: 'Gemini 2.5 Flash + Guardrails',
    aiDesc: 'Structured directives parsed from operator notes, passed through deterministic range clippers.',
    applied: 'Applied Directive',
    noOp: 'No-Op (Ignored)',
    directiveType: 'Directive Type',
    timeWindow: 'Time Window',
    adjustment: 'Mathematical Adjustment',
    explanation: 'AI Rationale',
    guardrailVerified: 'Guardrail Validated',

    resultsTitle: 'Optimal 24-Hour Dispatch Schedule',
    resultsBadge: 'PuLP + CBC Linear Program',
    resultsDesc: 'Provably minimum cost 24-hour hourly battery charging, discharging, and grid purchasing schedule.',
    solverStatus: 'Solver Status',
    solverTime: 'Solve Duration',
    verificationAudit: 'Independent Replay Verification',
    auditPassed: '100% Physics & Constraint Verified',
    gridImportKwh: 'Grid Purchase (kWh)',
    batteryAction: 'Battery Action',
    batteryEnergyAfter: 'Ending Storage (kWh)',
    exportJson: 'Export JSON',
    viewRawJson: 'View JSON Raw Data',

    // Top Navbar Center
    navTopDashboard: 'Dashboard',
    navTopOperations: 'Operations',
    navTopAnalytics: 'Analytics',
    navTopOptimization: 'Optimization',
    navTopReports: 'Reports',

    // Hero Section
    heroGreetingMorning: 'Good morning',
    heroGreetingAfternoon: 'Good afternoon',
    heroGreetingEvening: 'Good evening',
    heroGreetingNight: 'Good evening',
    heroTitle: 'Campus Energy Intelligence Center',
    heroSubtitle: 'Real-time 24-hour microgrid optimization, solar utilization & battery scheduling',
    systemStatusLabel: 'System Status',
    lastUpdatedLabel: 'Last updated',
    refreshTooltip: 'Refresh microgrid telemetry',

    // Energy Flow Centerpiece
    energyFlowTitle: 'Live Energy Flow',
    energyFlowSubtitle: 'Interactive real-time campus microgrid dispatch topology',
    solarFlowLabel: 'Solar PV Array',
    gridFlowLabel: 'Utility Grid',
    campusLoadLabel: 'Campus Load',
    batteryFlowLabel: 'Battery Storage',
    flowSpeedLabel: 'Flow active',
    generatingBadge: 'Generating',
    importingBadge: 'Importing',
    chargingBadge: 'Charging',
    dischargingBadge: 'Discharging',
    standbyBadge: 'Standby',

    // System Health
    systemHealthTitle: 'System Health',
    systemHealthSubtitle: 'Real-time telemetry & service connectivity',
    gridHealth: 'GRID',
    solarHealth: 'SOLAR',
    batteryHealth: 'BATTERY',
    optimizerHealth: 'OPTIMIZER',
    llmHealth: 'LLM ENGINE',

    // AI Energy Intelligence
    aiIntelligenceTitle: 'AI Energy Intelligence',
    aiDefaultInsight: 'Solar generation is projected to peak around 12:00–14:00. Pre-charging BESS during off-peak hours and utilizing peak solar will minimize peak evening tariff penalties.',
    potentialSavingLabel: 'Potential Saving',
    gridReductionLabel: 'Grid Reduction',
    carbonReductionLabel: 'CO₂ Avoided',
    viewAiAnalysisBtn: 'View AI Analysis →',

    // Optimization Action Card
    readyToOptimizeTitle: 'Ready to Optimize?',
    readyToOptimizeDesc: 'Execute high-precision 24-hour Linear Programming (PuLP + CBC) with Gemini AI guardrail verification.',
    runOptimizationBtn: '⚡ Run Optimization',
    stepAnalyzingDemand: 'Analyzing demand & tariff profiles...',
    stepForecastingSolar: 'Forecasting solar generation curve...',
    stepOptimizingBattery: 'Optimizing battery charge/discharge vectors...',
    stepCalculatingGrid: 'Calculating optimal grid power purchase...',
    stepGeneratingSchedule: 'Generating provably minimal cost schedule...',
    stepOptimizationComplete: 'Optimization Complete ✓',

    // Notifications
    notificationsTitle: 'Live System Notifications',
    noNewNotifications: 'No active warnings or alerts.',
    noticePeakTariff: 'Peak grid tariff window (BDT 14.50/kWh) active from 17:00 to 22:00.',
    noticeSolarPeak: 'Forecasted solar generation exceeds campus daytime baseline demand.',
    noticeAuditPassed: 'Mathematical replay audit passed with 100% balance validation.',

    // Footer & Info
    systemArchitecture: 'Microgrid Operations',
    optimizerEngine: 'PuLP + CBC LP',
    llmInterpreter: 'Gemini 2.5 Flash',
    auditMode: 'Fail-Closed Audit',
  },
  bn: {
    brandTitle: 'গ্রিডওয়াইজ',
    brandSubtitle: 'স্মার্ট ক্যাম্পাস মাইক্রোগ্রিড অপটিমাইজার',
    scenarioPreset: 'সিনারিও প্রিসেট',
    customScenario: 'কাস্টম সিনারিও',
    apiOnline: 'এপিআই অনলাইন',
    apiConnecting: 'সংযুক্ত হচ্ছে...',
    apiOffline: 'এপিআই অফলাইন',
    optimizeEnergy: 'অপটিমাইজ করুন',
    optimizing: 'অপটিমাইজ হচ্ছে...',
    language: 'ভাষা',
    themeToggle: 'থিম পরিবর্তন',

    liveTime: 'লাইভ সময়',
    operationalHour: 'চলতি সময়সীমা',
    peakHour: 'পিক আওয়ার (উচ্চ মূল্য)',
    offPeakHour: 'অফ-পিক আওয়ার (স্বাভাবিক মূল্য)',
    solveDuration: 'সমাধান সময়',

    menuFile: 'ফাইল (File)',
    menuOperations: 'অপারেশন (Operations)',
    menuView: 'ভিউ (View)',
    menuLanguage: 'ভাষা (Language)',
    menuTools: 'টুলস (Tools)',
    menuHelp: 'সাহায্য (Help)',

    navDashboard: 'ড্যাশবোর্ড ওভারভিউ',
    navScenario: 'সিনারিও ও নোট',
    navMatrix: '২৪ ঘণ্টার এনার্জি ডাটা',
    navBattery: 'ব্যাটারি স্টোরেজ',
    navDirectives: 'এআই ইন্টারপ্রিটেশন',
    navResults: 'অপটিমাল শিডিউল',
    navCharts: 'এনার্জি অ্যানালিটিক্স',
    navHistory: 'রান হিস্ট্রি',
    navDocs: 'এপিআই ও স্পেক্স',

    totalCost: 'মোট অপটিমাইজড খরচ',
    baselineCost: 'ব্যাটারি ছাড়া বেসলাইন খরচ',
    netSavings: 'মোট বিদ্যুৎ সাশ্রয়',
    totalDemand: '২৪ ঘণ্টার মোট চাহিদা',
    usableSolar: 'ব্যবহারযোগ্য সৌরবিদ্যুৎ',
    batteryThroughput: 'ব্যাটারি সাইকেল ও চার্জ',
    hoursOptimized: '২৪ ঘণ্টার অপটিমাইজেশন',
    optimalStatus: 'গাণিতিকভাবে সর্বনিম্ন (Optimal)',
    savingsRatio: 'খরচ সাশ্রয় অর্জিত',

    scenarioTitle: 'সিনারিও ও অপারেটর ডিরেক্টিভ',
    scenarioBadge: 'মানুষের সাধারণ ভাষার ইনপুট',
    scenarioDesc: '১ থেকে ৩টি অপারেটর নির্দেশিকা লিখুন। এলএলএম ইন্টারপ্রেটার এগুলোকে নিরাপদ গাণিতিক শর্তে রূপান্তর করবে।',
    scenarioIdLabel: 'সিনারিও আইডি',
    operatorNote: 'অপারেটর নোট',
    addNote: 'নোট যোগ করুন',
    removeNote: 'মুছুন',
    clearNotes: 'খালি করুন',
    quickTemplates: 'রেডিমেড নোট টেমপ্লেট (ক্লিক করে বসান):',
    emptyNoteWarning: 'অপটিমাইজ করার আগে কোনো নোট খালি রাখা যাবে না।',

    batteryTitle: 'ব্যাটারি এনার্জি স্টোরেজ সিস্টেম (BESS)',
    batteryBadge: 'হার্ডওয়্যার স্পেসিফিকেশন',
    batteryDesc: 'ব্যাটারির শারীরিক ধারণক্ষমতা, চার্জ রেট এবং ন্যূনতম রিজার্ভ সীমা PuLP সলভার কঠোরভাবে প্রয়োগ করে।',
    socGauge: 'ব্যাটারি চার্জ লেভেল গেজ (SoC)',
    initialSoc: 'প্রারম্ভিক চার্জ (Initial)',
    minReserveFloor: 'সর্বনিম্ন রিজার্ভ সীমা',
    capacityKwh: 'ক্যাপাসিটি (kWh)',
    initialEnergyKwh: 'শুরুর চার্জ (kWh)',
    minReserveKwh: 'সর্বনিম্ন রিজার্ভ (kWh)',
    chargeRateKw: 'চার্জিং রেট (kW)',
    dischargeRateKw: 'ডিসচার্জিং রেট (kW)',
    roundTripEff: 'কার্যক্ষমতা (%)',

    matrixTitle: '২৪ ঘণ্টার এনার্জি প্রোফাইল ম্যাট্রিক্স',
    matrixDesc: 'প্রতি ঘণ্টার বিদ্যুতের চাহিদা (লোড), সোলার উৎপাদন পূর্বাভাস এবং পিক/অফ-পিক গ্রিড বিদ্যুতের মূল্য।',
    colHour: 'ঘণ্টা',
    colDemand: 'লোড চাহিদা (kWh)',
    colSolar: 'সৌর উৎপাদন (kWh)',
    colTariff: 'গ্রিড মূল্য (টাকা/kWh)',
    colNetDemand: 'নেট চাহিদা (kWh)',
    resetDefault: 'ডিফল্টে রিসেট',
    editJson: 'র\' JSON এডিট',

    aiTitle: 'এআই ইন্টারপ্রিটেশন ও এক্সট্রাক্টেড ডিরেক্টিভ',
    aiBadge: 'Gemini 2.5 Flash + গার্ডরেলস',
    aiDesc: 'অপারেটর নোট থেকে নিষ্কাশিত কাঠামোগত শর্তসমূহ, যা সেফটি রেঞ্জের মধ্যে ভ্যালিডেট করা হয়েছে।',
    applied: 'প্রযোজ্য শর্ত (Applied)',
    noOp: 'প্রযোজ্য নয় / বাদ (No-Op)',
    directiveType: 'ডিরেক্টিভ প্রকার',
    timeWindow: 'সময়সীমা (ঘণ্টা)',
    adjustment: 'গাণিতিক পরিবর্তন',
    explanation: 'এআই সিদ্ধান্ত ও ব্যাখ্যা',
    guardrailVerified: 'গার্ডরেল দ্বারা যাচাইকৃত',

    resultsTitle: 'সর্বনিম্ন খরচের ২৪ ঘণ্টার ডিসপ্যাচ শিডিউল',
    resultsBadge: 'PuLP + CBC লিনিয়ার প্রোগ্রাম',
    resultsDesc: 'গাণিতিকভাবে নিশ্চিত সর্বনিম্ন খরচে কোন ঘণ্টায় ব্যাটারি চার্জ/ডিসচার্জ হবে এবং গ্রিড থেকে বিদ্যুৎ কেনা হবে।',
    solverStatus: 'সলভার স্ট্যাটাস',
    solverTime: 'সমাধানের সময়',
    verificationAudit: 'স্বাধীন রিপ্লে ভেরিফিকেশন',
    auditPassed: '১০০% ফিজিক্স ও ব্যালেন্স অডিট উত্তীর্ণ',
    gridImportKwh: 'গ্রিড বিদ্যুৎ কেনা (kWh)',
    batteryAction: 'ব্যাটারি অ্যাকশন',
    batteryEnergyAfter: 'অবশিষ্ট চার্জ (kWh)',
    exportJson: 'JSON ডাউনলোড',
    viewRawJson: 'JSON ডাটা দেখুন',

    // Top Navbar Center
    navTopDashboard: 'ড্যাশবোর্ড',
    navTopOperations: 'অপারেশনস',
    navTopAnalytics: 'অ্যানালিটিক্স',
    navTopOptimization: 'অপটিমাইজেশন',
    navTopReports: 'রিপোর্টস',

    // Hero Section
    heroGreetingMorning: 'শুভ সকাল',
    heroGreetingAfternoon: 'শুভ দুপুর',
    heroGreetingEvening: 'শুভ সন্ধ্যা',
    heroGreetingNight: 'শুভ রাত্রি',
    heroTitle: 'ক্যাম্পাস এনার্জি ইন্টেলিজেন্স সেন্টার',
    heroSubtitle: 'রিয়েল-টাইম ২৪ ঘণ্টার মাইক্রোগ্রিড অপটিমাইজেশন, সোলার ব্যবহার ও ব্যাটারি শিডিউলিং',
    systemStatusLabel: 'সিস্টেম স্ট্যাটাস',
    lastUpdatedLabel: 'সর্বশেষ আপডেট',
    refreshTooltip: 'মাইক্রোগ্রিড ডাটা রিফ্রেশ করুন',

    // Energy Flow Centerpiece
    energyFlowTitle: 'লাইভ এনার্জি ফ্লো',
    energyFlowSubtitle: 'ক্যাম্পাস মাইক্রোগ্রিড পাওয়ার ট্রান্সফার ও ডিরেকশন ট্র্যাকিং',
    solarFlowLabel: 'সোলার পিভি অ্যারে',
    gridFlowLabel: 'জাতীয় গ্রিড',
    campusLoadLabel: 'ক্যাম্পাস মোট চাহিদা',
    batteryFlowLabel: 'ব্যাটারি স্টোরেজ (BESS)',
    flowSpeedLabel: 'প্রবাহ সক্রিয়',
    generatingBadge: 'উৎপাদনরত',
    importingBadge: 'গ্রিড থেকে আমদানি',
    chargingBadge: 'চার্জ হচ্ছে',
    dischargingBadge: 'ডিসচার্জ হচ্ছে',
    standbyBadge: 'স্ট্যান্ডবাই',

    // System Health
    systemHealthTitle: 'সিস্টেম হেলথ',
    systemHealthSubtitle: 'সার্ভিস সংযোগ ও রিয়েল-টাইম টেলিমিতি',
    gridHealth: 'গ্রিড (GRID)',
    solarHealth: 'সোলার (SOLAR)',
    batteryHealth: 'ব্যাটারি (BATTERY)',
    optimizerHealth: 'সলভার (OPTIMIZER)',
    llmHealth: 'এআই ইঞ্জিন (LLM)',

    // AI Energy Intelligence
    aiIntelligenceTitle: 'এআই এনার্জি ইন্টেলিজেন্স',
    aiDefaultInsight: 'দুপুর ১২:০০ থেকে ১৪:০০ ঘটিকায় সৌরবিদ্যুৎ উৎপাদন শীর্ষে পৌঁছাবে। অফ-পিক সময়ে ব্যাটারি চার্জ করে রাখলে সন্ধ্যার পিক আওয়ারে গ্রিডের চড়া মূল্য এড়ানো সম্ভব হবে।',
    potentialSavingLabel: 'সম্ভাব্য সাশ্রয়',
    gridReductionLabel: 'গ্রিড হ্রাস',
    carbonReductionLabel: 'CO₂ নির্গমন হ্রাস',
    viewAiAnalysisBtn: 'এআই অ্যানালাইসিস দেখুন →',

    // Optimization Action Card
    readyToOptimizeTitle: 'অপটিমাইজ করতে প্রস্তুত?',
    readyToOptimizeDesc: 'লিনিয়ার প্রোগ্রামিং (PuLP + CBC) এবং জেমিনি এআই গার্ডরেল ভেরিফিকেশনের মাধ্যমে সর্বনিম্ন খরচের শিডিউল তৈরি করুন।',
    runOptimizationBtn: '⚡ অপটিমাইজ করুন',
    stepAnalyzingDemand: 'চাহিদা ও ট্যারিফ প্রোফাইল বিশ্লেষণ হচ্ছে...',
    stepForecastingSolar: 'সৌরবিদ্যুৎ উৎপাদন কার্ভ প্রক্ষেপণ হচ্ছে...',
    stepOptimizingBattery: 'ব্যাটারি চার্জ/ডিসচার্জ ভেক্টর নির্ণয় হচ্ছে...',
    stepCalculatingGrid: 'গ্রিড বিদ্যুৎ ক্রয়ের পরিমাণ অপটিমাইজ হচ্ছে...',
    stepGeneratingSchedule: 'সর্বনিম্ন খরচের চূড়ান্ত শিডিউল তৈরি হচ্ছে...',
    stepOptimizationComplete: 'অপটিমাইজেশন সম্পন্ন হয়েছে ✓',

    // Notifications
    notificationsTitle: 'সিস্টেম নোটিফিকেশন',
    noNewNotifications: 'কোনো নতুন সতর্কতা বা বার্তা নেই।',
    noticePeakTariff: 'পিক আওয়ার ট্যারিফ (১৪.৫০ টাকা/kWh) সক্রিয় সময়: ১৭:০০ হতে ২২:০০।',
    noticeSolarPeak: 'পূর্বাভাসকৃত সৌর উৎপাদন ক্যাম্পাসের বেসলাইন চাহিদার চেয়ে বেশি।',
    noticeAuditPassed: 'স্বাধীন রিপ্লে ভেরিফিকেশন ১০০% ফিজিক্স ব্যালেন্স পাস করেছে।',

    systemArchitecture: 'মাইক্রোগ্রিড অপারেশনস',
    optimizerEngine: 'PuLP + CBC LP সলভার',
    llmInterpreter: 'Gemini 2.5 Flash',
    auditMode: 'ফিজিক্স অডিট মোড',
  },
};
