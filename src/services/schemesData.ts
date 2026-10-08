export interface SchemeRawData {
  id: string;
  name: string;
  fullName: string;
  nameTa: string;
  fullNameTa: string;
  governmentLevel: 'STATE' | 'CENTRAL';
  department: string;
  departmentTa: string;
  category: 'CAPITAL_SUBSIDY' | 'EMPLOYMENT_GENERATION' | 'TECHNOLOGY_UPGRADATION' | 'INTEREST_SUBVENTION' | 'CREDIT_GUARANTEE';
  description: string;
  descriptionTa: string;
  beneficiaryTypes: string[];
  businessTypes: string[];
  projectCostMin: number;
  projectCostMax: number;
  subsidyPercentage: number;
  subsidyMaximum: number;
  interestSubvention: number;
  ageRules: {
    min: number;
    maxGeneral: number;
    maxSpecial: number;
    specialCategories: string[];
    description: string;
  };
  educationRules: {
    minimum: string; // 'ANY' | '8TH_PASS' | '10TH_PASS' | '12TH_PASS' | 'DEGREE_DIPLOMA_ITI'
    description: string;
  };
  residencyRules: {
    state: string;
    minYears: number;
    description: string;
  };
  incomeRules: {
    maxAnnualFamilyIncome: number | null;
    description: string;
  };
  sectorRules: {
    allowedSectors: string[];
    excludedSectors: string[];
    description: string;
  };
  specialCategoryRules: {
    promoterContributionGeneral: number;
    promoterContributionSpecial: number;
    specialCategories: string[];
    additionalBenefits: string;
  };
  applicationUrl: string;
  officialSourceUrl: string;
  officialDocumentUrl: string;
  sourceAuthority: string;
  lastVerifiedAt: string; // ISO
  effectiveFrom: string; // ISO
  effectiveTo?: string | null;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED';
  sources: Array<{
    authority: string;
    title: string;
    documentUrl: string;
    portalUrl: string;
    version: string;
    effectiveDate: string;
    verifiedAt: string;
    status: 'VERIFIED' | 'NEEDS_REVIEW' | 'HISTORICAL';
    notes?: string;
  }>;
}

export const VERIFIED_GOVERNMENT_SCHEMES: SchemeRawData[] = [
  {
    id: 'needs',
    name: 'NEEDS',
    fullName: 'New Entrepreneur-cum-Enterprise Development Scheme',
    nameTa: 'புதிய தொழில்முனைவோர் மற்றும் நிறுவன மேம்பாட்டுத் திட்டம் (NEEDS)',
    fullNameTa: 'தமிழ்நாடு அரசு புதிய தொழில்முனைவோர் மற்றும் தொழில் நிறுவன மேம்பாட்டுத் திட்டம் (NEEDS)',
    governmentLevel: 'STATE',
    department: 'Department of MSME, Government of Tamil Nadu',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    category: 'CAPITAL_SUBSIDY',
    description: 'Special flagship scheme of Tamil Nadu Government assisting educated first-generation entrepreneurs to establish new manufacturing or service enterprises with 25% capital subsidy (up to ₹75 Lakhs) and 3% interest subvention.',
    descriptionTa: 'படித்த முதல் தலைமுறை தொழில்முனைவோர்கள் புதிய உற்பத்தி அல்லது சேவை நிறுவனங்களைத் தொடங்க 25% மூலதன மானியம் (அதிகபட்சம் ₹75 லட்சம் வரை) மற்றும் 3% வட்டி மானியம் வழங்கும் தமிழ்நாடு அரசின் முன்னணித் திட்டம்.',
    beneficiaryTypes: ['FIRST_GENERATION_ENTREPRENEUR', 'GRADUATE', 'DIPLOMA_HOLDER', 'WOMEN', 'SC_ST', 'BC_MBC'],
    businessTypes: ['MANUFACTURING', 'SERVICE'],
    projectCostMin: 1000000, // ₹10 Lakhs
    projectCostMax: 50000000, // ₹5 Crores
    subsidyPercentage: 25.0,
    subsidyMaximum: 7500000, // ₹75 Lakhs
    interestSubvention: 3.0, // 3%
    ageRules: {
      min: 21,
      maxGeneral: 35,
      maxSpecial: 45,
      specialCategories: ['WOMEN', 'SC', 'ST', 'BC', 'MBC', 'MINORITY', 'TRANSGENDER', 'EX_SERVICEMEN', 'DIFFERENTLY_ABLED'],
      description: 'Minimum 21 years; Maximum 35 for General Category, up to 45 for Women/SC/ST/BC/MBC/Minority/Differently Abled.',
    },
    educationRules: {
      minimum: 'DEGREE_DIPLOMA_ITI',
      description: 'Must possess Degree, Diploma, ITI, or accredited Vocational Training Certificate.',
    },
    residencyRules: {
      state: 'Tamil Nadu',
      minYears: 3,
      description: 'Applicant must have been a resident of Tamil Nadu for not less than 3 continuous years.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No ceiling on annual family income.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING', 'SERVICE'],
      excludedSectors: ['TRADING', 'DIRECT_FARMING', 'ALCOHOL', 'TOBACCO'],
      description: 'Only new Manufacturing and Service projects. Pure trading businesses are strictly excluded.',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 5,
      specialCategories: ['WOMEN', 'SC', 'ST', 'BC', 'MBC', 'MINORITY', 'EX_SERVICEMEN', 'DIFFERENTLY_ABLED'],
      additionalBenefits: 'Promoter contribution reduced from 10% to 5% of project cost for special categories, plus relaxed age ceiling up to 45 years.',
    },
    applicationUrl: 'https://msmeonline.tn.gov.in/needs/',
    officialSourceUrl: 'https://msmeonline.tn.gov.in/needs/',
    officialDocumentUrl: 'https://msmeonline.tn.gov.in/needs/needs_guidelines.pdf',
    sourceAuthority: 'Department of MSME, Government of Tamil Nadu (DIC / TIIC)',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2012-08-15T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Department of MSME, Govt of Tamil Nadu',
        title: 'NEEDS Scheme Operational Guidelines & G.O. Ms. No. 49',
        documentUrl: 'https://msmeonline.tn.gov.in/needs/needs_guidelines.pdf',
        portalUrl: 'https://msmeonline.tn.gov.in/needs/',
        version: 'G.O. 2024-26 Edition',
        effectiveDate: '2024-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Verified via official Tamil Nadu MSME Online Portal; ₹5 Crore upper limit and ₹75 Lakh subsidy ceiling confirmed.',
      },
    ],
  },
  {
    id: 'uyegp',
    name: 'UYEGP',
    fullName: 'Unemployed Youth Employment Generation Programme',
    nameTa: 'வேலையில்லா இளைஞர்களுக்கான வேலைவாய்ப்பு உருவாக்கும் திட்டம் (UYEGP)',
    fullNameTa: 'தமிழ்நாடு அரசு வேலையில்லா இளைஞர்களுக்கான வேலைவாய்ப்பு உருவாக்கும் திட்டம் (UYEGP)',
    governmentLevel: 'STATE',
    department: 'Department of MSME, Government of Tamil Nadu',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    category: 'EMPLOYMENT_GENERATION',
    description: 'Tamil Nadu government micro-enterprise loan and subsidy scheme mitigating youth unemployment. Provides 25% government subsidy for projects up to ₹15 Lakhs for manufacturing and up to ₹5 Lakhs for service/business.',
    descriptionTa: 'வேலையில்லா படித்த இளைஞர்கள் சொந்தமாக குறுந்தொழில் தொடங்க 25% வரை அரசு மானியம் வழங்கும் திட்டம் (உற்பத்தி ₹15 லட்சம் வரை, சேவை/வியாபாரம் ₹5 லட்சம் வரை).',
    beneficiaryTypes: ['UNEMPLOYED_YOUTH', 'WOMEN', 'SC_ST', 'BC_MBC', 'GENERAL'],
    businessTypes: ['MANUFACTURING', 'SERVICE', 'TRADING'],
    projectCostMin: 100000, // ₹1 Lakh
    projectCostMax: 1500000, // ₹15 Lakhs (Manufacturing) / ₹5L (Service/Business)
    subsidyPercentage: 25.0,
    subsidyMaximum: 375000, // ₹3.75 Lakhs (25% of ₹15L)
    interestSubvention: 0.0,
    ageRules: {
      min: 18,
      maxGeneral: 35,
      maxSpecial: 45,
      specialCategories: ['WOMEN', 'SC', 'ST', 'BC', 'MBC', 'MINORITY', 'EX_SERVICEMEN', 'DIFFERENTLY_ABLED', 'TRANSGENDER'],
      description: 'Minimum 18 years; Maximum 35 years for General, up to 45 years for Special Categories.',
    },
    educationRules: {
      minimum: '8TH_PASS',
      description: 'Minimum educational qualification is a pass in 8th Standard.',
    },
    residencyRules: {
      state: 'Tamil Nadu',
      minYears: 3,
      description: 'Applicant must be a permanent resident of Tamil Nadu for minimum 3 years.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: 500000, // ₹5 Lakhs
      description: 'Annual family income must not exceed ₹5,00,000 per annum.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING', 'SERVICE', 'TRADING'],
      excludedSectors: ['ALCOHOL', 'TOBACCO', 'SPECULATIVE_TRADING'],
      description: 'Eligible for Manufacturing (max ₹15L), Service (max ₹5L), and Business/Trading (max ₹5L).',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 5,
      specialCategories: ['WOMEN', 'SC', 'ST', 'BC', 'MBC', 'MINORITY', 'TRANSGENDER', 'EX_SERVICEMEN', 'DIFFERENTLY_ABLED'],
      additionalBenefits: 'Promoter equity only 5% for special categories; upper age relaxed to 45 years.',
    },
    applicationUrl: 'https://msmeonline.tn.gov.in/uyegp/',
    officialSourceUrl: 'https://msmeonline.tn.gov.in/uyegp/',
    officialDocumentUrl: 'https://msmeonline.tn.gov.in/uyegp/guidelines.pdf',
    sourceAuthority: 'District Industries Centres (DIC), Commissionerate of Industries and Commerce, Tamil Nadu',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2010-09-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Commissionerate of Industries and Commerce, Tamil Nadu',
        title: 'UYEGP Operational Scheme Guidelines & Circular',
        documentUrl: 'https://msmeonline.tn.gov.in/uyegp/guidelines.pdf',
        portalUrl: 'https://msmeonline.tn.gov.in/uyegp/',
        version: '2024 Revised Guidelines',
        effectiveDate: '2024-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Verified via official portal msmeonline.tn.gov.in/uyegp. Family income ceiling ₹5 Lakhs confirmed.',
      },
    ],
  },
  {
    id: 'pmegp',
    name: 'PMEGP',
    fullName: "Prime Minister's Employment Generation Programme",
    nameTa: 'பிரதமரின் வேலைவாய்ப்பு உருவாக்கும் திட்டம் (PMEGP)',
    fullNameTa: 'மத்திய அரசின் பிரதம மந்திரியின் வேலைவாய்ப்பு உருவாக்கும் திட்டம் (PMEGP)',
    governmentLevel: 'CENTRAL',
    department: 'Ministry of MSME, Government of India (KVIC)',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் அமைச்சகம், இந்திய அரசு',
    category: 'EMPLOYMENT_GENERATION',
    description: 'National credit-linked subsidy programme by Government of India providing 15% to 35% margin money subsidy for establishing new micro-enterprises in manufacturing (up to ₹50 Lakhs) and service sectors (up to ₹20 Lakhs).',
    descriptionTa: 'மத்திய அரசால் செயல்படுத்தப்படும் கடன் சார்ந்த மானியத் திட்டம். உற்பத்திக்கு ₹50 லட்சம் வரையிலும், சேவைக்கு ₹20 லட்சம் வரையிலும் 15% முதல் 35% வரை மானியம் வழங்கப்படுகிறது.',
    beneficiaryTypes: ['NEW_ENTREPRENEUR', 'RURAL_YOUTH', 'URBAN_YOUTH', 'WOMEN', 'SC_ST', 'OBC', 'MINORITY'],
    businessTypes: ['MANUFACTURING', 'SERVICE'],
    projectCostMin: 100000, // ₹1 Lakh
    projectCostMax: 5000000, // ₹50 Lakhs for Manufacturing (₹20 Lakhs for Service)
    subsidyPercentage: 35.0, // Up to 35% for Special Rural
    subsidyMaximum: 1750000, // ₹17.5 Lakhs (35% of ₹50 Lakhs)
    interestSubvention: 0.0,
    ageRules: {
      min: 18,
      maxGeneral: 99, // No upper age limit
      maxSpecial: 99,
      specialCategories: ['WOMEN', 'SC', 'ST', 'OBC', 'MINORITY', 'EX_SERVICEMEN', 'PH', 'NER'],
      description: 'Any individual above 18 years of age. No upper age limit.',
    },
    educationRules: {
      minimum: '8TH_PASS',
      description: 'At least 8th standard pass for projects costing above ₹10 Lakhs in manufacturing and above ₹5 Lakhs in service.',
    },
    residencyRules: {
      state: 'All India',
      minYears: 0,
      description: 'Indian citizen residing anywhere in India.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No income ceiling for setting up projects under PMEGP.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING', 'SERVICE'],
      excludedSectors: ['MEAT_PROCESSING', 'ALCOHOL_TOBACCO', 'BEEDIS', 'POLYTHENE_BAGS_BELOW_50_MICRONS', 'AGRICULTURE_PRODUCE_WITHOUT_PROCESSING'],
      description: 'Manufacturing (up to ₹50L) and Service (up to ₹20L). Pure retail trade is in the negative list.',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 5,
      specialCategories: ['WOMEN', 'SC', 'ST', 'OBC', 'MINORITY', 'EX_SERVICEMEN', 'PH', 'NER'],
      additionalBenefits: 'Urban Special: 25% subsidy; Rural Special: 35% subsidy. Own contribution reduced to 5%.',
    },
    applicationUrl: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    officialSourceUrl: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    officialDocumentUrl: 'https://www.kviconline.gov.in/pmegpeportal/jsp/pmegpscheme.jsp',
    sourceAuthority: 'Khadi and Village Industries Commission (KVIC), Ministry of MSME, Govt of India',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2008-08-15T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Ministry of MSME, Government of India & KVIC',
        title: 'PMEGP Scheme Guidelines & Operational Circular 2024-26',
        documentUrl: 'https://www.kviconline.gov.in/pmegpeportal/jsp/pmegpscheme.jsp',
        portalUrl: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
        version: 'Revised MoMSME Guidelines 2024',
        effectiveDate: '2024-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Project ceiling increased to ₹50L for Manufacturing and ₹20L for Service verified from kviconline.gov.in.',
      },
    ],
  },
  {
    id: 'tn-capital-subsidy',
    name: 'TN MSME Capital Subsidy',
    fullName: 'Special Capital Subsidy for Micro & Small Manufacturing Enterprises',
    nameTa: 'தமிழ்நாடு குறு மற்றும் சிறு உற்பத்தியாளர்களுக்கான மூலதன மானியம்',
    fullNameTa: 'தமிழ்நாடு அரசு தொழில் ரீதியாக பின்தங்கிய வட்டாரங்கள் & உற்பத்தி நிறுவனங்களுக்கான மூலதன மானியத் திட்டம்',
    governmentLevel: 'STATE',
    department: 'Department of MSME, Government of Tamil Nadu',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    category: 'CAPITAL_SUBSIDY',
    description: '25% capital subsidy on the value of eligible plant and machinery up to ₹50 Lakhs for micro and small manufacturing units set up in 254 industrially backward blocks, industrial estates, or thrust sectors in Tamil Nadu.',
    descriptionTa: 'தமிழ்நாட்டில் தொழில் ரீதியாக பின்தங்கிய 254 வட்டாரங்கள், சிட்கோ தொழிற்பேட்டைகள் அல்லது குறிப்பிட்ட உற்பத்தித் துறைகளில் நிறுவப்படும் ஆலை மற்றும் இயந்திரங்களின் மதிப்பில் 25% வரை (அதிகபட்சம் ₹50 லட்சம்) மூலதன மானியம்.',
    beneficiaryTypes: ['MICRO_ENTERPRISE', 'SMALL_ENTERPRISE', 'MANUFACTURER', 'WOMEN_ENTREPRENEUR', 'SC_ST'],
    businessTypes: ['MANUFACTURING'],
    projectCostMin: 500000, // ₹5 Lakhs
    projectCostMax: 50000000, // ₹5 Crores
    subsidyPercentage: 25.0,
    subsidyMaximum: 5000000, // ₹50 Lakhs
    interestSubvention: 0.0,
    ageRules: {
      min: 18,
      maxGeneral: 99,
      maxSpecial: 99,
      specialCategories: ['WOMEN', 'SC', 'ST', 'DIFFERENTLY_ABLED'],
      description: 'Any entrepreneur running a registered Micro or Small Manufacturing Enterprise.',
    },
    educationRules: {
      minimum: 'ANY',
      description: 'No specific minimum education qualification required. Valid Udyam Registration required.',
    },
    residencyRules: {
      state: 'Tamil Nadu',
      minYears: 1,
      description: 'The manufacturing unit must be located within Tamil Nadu.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No income ceiling for business enterprise capital subsidy.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING'],
      excludedSectors: ['SERVICE', 'TRADING'],
      description: 'Strictly for manufacturing enterprises set up in backward blocks, industrial estates, or state thrust sectors (Auto components, Electronics, Food processing, Textiles, Bio-tech, etc.).',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 10,
      specialCategories: ['WOMEN', 'SC', 'ST', 'DIFFERENTLY_ABLED'],
      additionalBenefits: 'Additional 5% special capital subsidy subject to maximum ₹2 Lakhs for enterprises owned by Women, SC/ST, or Differently Abled entrepreneurs.',
    },
    applicationUrl: 'https://msmeonline.tn.gov.in/',
    officialSourceUrl: 'https://msmeonline.tn.gov.in/',
    officialDocumentUrl: 'https://cms.tn.gov.in/sites/default/files/gos/msme_e_capital_subsidy.pdf',
    sourceAuthority: 'Department of MSME, Government of Tamil Nadu (DIC)',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2008-05-23T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Department of MSME, Government of Tamil Nadu',
        title: 'MSME Policy Incentive Guidelines - Capital Subsidy Schemes',
        documentUrl: 'https://cms.tn.gov.in/sites/default/files/gos/msme_e_capital_subsidy.pdf',
        portalUrl: 'https://msmeonline.tn.gov.in/',
        version: 'Tamil Nadu MSME Policy 2021-26',
        effectiveDate: '2021-02-16T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: '25% on Plant & Machinery up to ₹50L confirmed under current Tamil Nadu MSME Policy.',
      },
    ],
  },
  {
    id: 'beiss-interest-subvention',
    name: 'BEISS',
    fullName: 'Back-Ended Interest Subsidy Scheme',
    nameTa: 'பிற்பகல் வட்டி மானியத் திட்டம் (BEISS)',
    fullNameTa: 'தமிழ்நாடு அரசு பின்னேற்பு வட்டி மானியத் திட்டம் (BEISS)',
    governmentLevel: 'STATE',
    department: 'Department of MSME, Government of Tamil Nadu',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    category: 'INTEREST_SUBVENTION',
    description: '5% interest subvention on term loans availed by Micro and Small manufacturing enterprises from commercial banks or TIIC for modernization, technology adoption, or new unit setup up to ₹20 Lakhs over 5 years.',
    descriptionTa: 'வணிக வங்கிகள் அல்லது TIIC மூலம் புதிய இயந்திரங்கள் வாங்க அல்லது தொழில்நுட்ப மேம்பாட்டிற்கு பெறப்பட்ட கடன்களுக்கு 5% வட்டி மானியம் (5 ஆண்டுகளில் அதிகபட்சம் ₹20 லட்சம் வரை) வழங்கும் திட்டம்.',
    beneficiaryTypes: ['MICRO_ENTERPRISE', 'SMALL_ENTERPRISE', 'BORROWER', 'MANUFACTURER'],
    businessTypes: ['MANUFACTURING', 'SERVICE'],
    projectCostMin: 300000,
    projectCostMax: 50000000,
    subsidyPercentage: 5.0, // 5% interest subsidy
    subsidyMaximum: 2000000, // ₹20 Lakhs max over 5 years
    interestSubvention: 5.0,
    ageRules: {
      min: 18,
      maxGeneral: 99,
      maxSpecial: 99,
      specialCategories: [],
      description: 'Micro and Small Enterprise owners in Tamil Nadu with active bank term loans.',
    },
    educationRules: {
      minimum: 'ANY',
      description: 'No minimum educational qualification.',
    },
    residencyRules: {
      state: 'Tamil Nadu',
      minYears: 1,
      description: 'Enterprise must be established within Tamil Nadu.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No income ceiling.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING', 'SERVICE'],
      excludedSectors: ['TRADING'],
      description: 'Eligible for manufacturing and select service activities availing term loans under approved credit schemes.',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 10,
      specialCategories: [],
      additionalBenefits: 'Direct back-ended credit into the borrower loan account quarterly, reducing overall interest burden.',
    },
    applicationUrl: 'https://msmeonline.tn.gov.in/',
    officialSourceUrl: 'https://msmeonline.tn.gov.in/',
    officialDocumentUrl: 'https://msmeonline.tn.gov.in/beiss/guidelines.pdf',
    sourceAuthority: 'Department of MSME, Government of Tamil Nadu & TIIC',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2008-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Department of MSME, Government of Tamil Nadu',
        title: 'BEISS Operational Guidelines and Procedures',
        documentUrl: 'https://msmeonline.tn.gov.in/beiss/guidelines.pdf',
        portalUrl: 'https://msmeonline.tn.gov.in/',
        version: 'Tamil Nadu MSME Guidelines 2024',
        effectiveDate: '2024-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Confirmed 5% interest subvention for term loans with ₹20 Lakhs ceiling over 5 years.',
      },
    ],
  },
  {
    id: 'tn-energy-audit-subsidy',
    name: 'TN Energy Audit & Conservation Subsidy',
    fullName: 'Promotion of Energy Audit and Conservation of Energy in MSMEs (PEACE)',
    nameTa: 'ஆற்றல் தணிக்கை மற்றும் ஆற்றல் சேமிப்பு மானியத் திட்டம் (PEACE)',
    fullNameTa: 'தமிழ்நாடு குறு, சிறு மற்றும் நடுத்தரத் தொழில்களுக்கான ஆற்றல் பாதுகாப்பு மானியத் திட்டம்',
    governmentLevel: 'STATE',
    department: 'Department of MSME, Government of Tamil Nadu',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் நிறுவனங்கள் துறை, தமிழ்நாடு அரசு',
    category: 'TECHNOLOGY_UPGRADATION',
    description: '75% reimbursement of the cost of energy audit conducted by accredited energy auditors (max ₹75,000) and 25% capital subsidy on cost of eligible energy-saving equipment up to ₹10 Lakhs.',
    descriptionTa: 'சான்றளிக்கப்பட்ட தணிக்கையாளர்கள் மூலம் ஆற்றல் தணிக்கை செய்ய 75% வரை (அதிகபட்சம் ₹75,000) கட்டணத் திருப்பிளிப்பு மற்றும் மின்சாரத்தை சேமிக்கும் கருவிகள் வாங்க 25% (அதிகபட்சம் ₹10 லட்சம் வரை) மூலதன மானியம்.',
    beneficiaryTypes: ['MICRO_ENTERPRISE', 'SMALL_ENTERPRISE', 'MEDIUM_ENTERPRISE', 'MANUFACTURER'],
    businessTypes: ['MANUFACTURING'],
    projectCostMin: 100000,
    projectCostMax: 10000000,
    subsidyPercentage: 25.0,
    subsidyMaximum: 1000000, // ₹10 Lakhs max equipment subsidy
    interestSubvention: 0.0,
    ageRules: {
      min: 18,
      maxGeneral: 99,
      maxSpecial: 99,
      specialCategories: [],
      description: 'Operational MSME manufacturing units in Tamil Nadu.',
    },
    educationRules: {
      minimum: 'ANY',
      description: 'No educational criteria; unit must have valid Udyam certificate and active power connection.',
    },
    residencyRules: {
      state: 'Tamil Nadu',
      minYears: 1,
      description: 'Physical manufacturing plant situated in Tamil Nadu.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No income ceiling.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING'],
      excludedSectors: ['SERVICE', 'TRADING'],
      description: 'Manufacturing units seeking to reduce carbon footprint and electrical consumption.',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 25,
      promoterContributionSpecial: 25,
      specialCategories: [],
      additionalBenefits: '75% reimbursement for energy audit fees up to ₹75,000 in addition to machinery subsidy.',
    },
    applicationUrl: 'https://msmeonline.tn.gov.in/',
    officialSourceUrl: 'https://msmeonline.tn.gov.in/',
    officialDocumentUrl: 'https://msmeonline.tn.gov.in/peace/guidelines.pdf',
    sourceAuthority: 'Department of MSME, Government of Tamil Nadu (DIC)',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2015-06-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'Department of MSME, Government of Tamil Nadu',
        title: 'PEACE Scheme - Promotion of Energy Audit and Conservation in MSMEs',
        documentUrl: 'https://msmeonline.tn.gov.in/peace/guidelines.pdf',
        portalUrl: 'https://msmeonline.tn.gov.in/',
        version: 'PEACE 2024 Revision',
        effectiveDate: '2024-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Verified via official Tamil Nadu MSME portal msmeonline.tn.gov.in.',
      },
    ],
  },
  {
    id: 'cgtmse-collateral-free',
    name: 'CGTMSE Support',
    fullName: 'Credit Guarantee Fund Trust for Micro and Small Enterprises',
    nameTa: 'பிணையில்லா கடன் உத்தரவாதத் திட்டம் (CGTMSE)',
    fullNameTa: 'மத்திய அரசு மற்றும் தமிழ்நாடு MSME பிணையில்லா கடன் உத்தரவாதத் திட்டம்',
    governmentLevel: 'CENTRAL',
    department: 'Ministry of MSME, Govt of India & SIDBI (with TN DIC Facilitation)',
    departmentTa: 'குறு, சிறு மற்றும் நடுத்தரத் தொழில் அமைச்சகம் மற்றும் சிட்பி (SIDBI)',
    category: 'CREDIT_GUARANTEE',
    description: 'Collateral-free credit facility up to ₹5 Crores for micro and small enterprises with 75% to 85% credit guarantee coverage provided by CGTMSE without requiring third-party mortgage or immovable property collateral.',
    descriptionTa: 'சொத்து அடமானம் அல்லது மூன்றாம் நபர் பிணையில்லாமல் ₹5 கோடி வரை வங்கிக் கடன் பெற 75% முதல் 85% வரை கடன் உத்தரவாதம் வழங்கும் மத்திய அரசு & SIDBI திட்டம்.',
    beneficiaryTypes: ['MICRO_ENTERPRISE', 'SMALL_ENTERPRISE', 'NEW_ENTREPRENEUR', 'WOMEN', 'RETAIL_WHOLESALE'],
    businessTypes: ['MANUFACTURING', 'SERVICE', 'TRADING'],
    projectCostMin: 100000,
    projectCostMax: 50000000, // ₹5 Crores
    subsidyPercentage: 85.0, // Up to 85% guarantee coverage
    subsidyMaximum: 42500000, // ₹4.25 Crores coverage
    interestSubvention: 0.0,
    ageRules: {
      min: 18,
      maxGeneral: 99,
      maxSpecial: 99,
      specialCategories: ['WOMEN', 'SC', 'ST'],
      description: 'Any micro or small entrepreneur eligible for bank credit.',
    },
    educationRules: {
      minimum: 'ANY',
      description: 'No formal minimum educational certificate required.',
    },
    residencyRules: {
      state: 'All India',
      minYears: 0,
      description: 'Citizen of India with business in India.',
    },
    incomeRules: {
      maxAnnualFamilyIncome: null,
      description: 'No income ceiling.',
    },
    sectorRules: {
      allowedSectors: ['MANUFACTURING', 'SERVICE', 'TRADING'],
      excludedSectors: ['EDUCATIONAL_INSTITUTIONS', 'AGRICULTURE_DIRECT', 'SHG'],
      description: 'New and existing Micro and Small Enterprises including Retail Trade (Retail Trade eligible up to ₹2 Crores limit).',
    },
    specialCategoryRules: {
      promoterContributionGeneral: 10,
      promoterContributionSpecial: 5,
      specialCategories: ['WOMEN', 'SC', 'ST', 'ZED_CERTIFIED'],
      additionalBenefits: 'Guarantee coverage enhanced to 85% for Women entrepreneurs, SC/ST, and ZED certified units, with reduced annual guarantee fee.',
    },
    applicationUrl: 'https://www.cgtmse.in/',
    officialSourceUrl: 'https://www.cgtmse.in/',
    officialDocumentUrl: 'https://www.cgtmse.in/Default/ViewFile/?id=1682490516641_Circular_199.pdf',
    sourceAuthority: 'Credit Guarantee Fund Trust for Micro and Small Enterprises (SIDBI & MoMSME)',
    lastVerifiedAt: '2026-09-29T10:00:00.000Z',
    effectiveFrom: '2000-08-30T00:00:00.000Z',
    effectiveTo: null,
    status: 'ACTIVE',
    sources: [
      {
        authority: 'CGTMSE / Ministry of MSME, Govt of India',
        title: 'CGTMSE Circular No. 199/2023-24 - Enhancement of Credit Limit to ₹500 Lakhs',
        documentUrl: 'https://www.cgtmse.in/Default/ViewFile/?id=1682490516641_Circular_199.pdf',
        portalUrl: 'https://www.cgtmse.in/',
        version: 'Circular No. 199/2023-24',
        effectiveDate: '2023-04-01T00:00:00.000Z',
        verifiedAt: '2026-09-29T10:00:00.000Z',
        status: 'VERIFIED',
        notes: 'Limit enhanced to ₹5 Crores with 85% coverage for women & micro units verified from cgtmse.in.',
      },
    ],
  },
];
