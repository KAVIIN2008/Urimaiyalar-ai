import { SchemeRawData } from './schemesData';

export interface UserEligibilityProfile {
  age?: number;
  state?: string;
  district?: string;
  business_type?: 'MANUFACTURING' | 'SERVICE' | 'TRADING' | string;
  sector?: string;
  project_cost?: number;
  education?: 'BELOW_8TH' | '8TH_PASS' | '10TH_PASS' | '12TH_PASS' | 'DEGREE_DIPLOMA_ITI' | 'GRADUATE' | 'POST_GRADUATE' | string;
  entrepreneur_type?: 'FIRST_GENERATION' | 'EXISTING' | string;
  social_category?: 'GENERAL' | 'BC' | 'MBC' | 'SC' | 'ST' | 'OBC' | 'MINORITY' | string;
  annual_income?: number;
  residency_years?: number;
  existing_business?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'TRANSGENDER' | string;
  is_differently_abled?: boolean;
  is_ex_serviceman?: boolean;
  location_type?: 'RURAL' | 'URBAN' | string;
}

export type EligibilityStatus = 'MATCH' | 'PARTIAL_MATCH' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_INFORMATION';

export interface CriterionCheck {
  criterion: string;
  field: string;
  matched: boolean;
  message: string;
  userValue?: any;
  requiredRule?: any;
}

export interface MissingFieldRequirement {
  field: string;
  label: string;
  labelTa: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  options?: Array<{ value: string; label: string; labelTa: string }>;
  description: string;
  descriptionTa: string;
}

export interface SchemeEligibilityResult {
  scheme_id: string;
  scheme_name: string;
  scheme_full_name: string;
  status: EligibilityStatus;
  matched: CriterionCheck[];
  missing: MissingFieldRequirement[];
  failed: CriterionCheck[];
  estimated_subsidy?: {
    eligible_percentage: number;
    estimated_amount: number;
    max_subsidy_cap: number;
    interest_subvention_percent: number;
  };
  explanation: string;
  explanationTa: string;
  source: {
    authority: string;
    official_source_url: string;
    official_document_url: string;
    last_verified_at: string;
    is_stale: boolean;
  };
  verified_at: string;
  disclaimer: string;
  disclaimerTa: string;
}

const STALE_FRESHNESS_DAYS = 180;

export function isSchemeDataStale(lastVerifiedAt: string | Date): boolean {
  const verifiedTime = new Date(lastVerifiedAt).getTime();
  const diffDays = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
  return diffDays > STALE_FRESHNESS_DAYS;
}

function normalizeEducation(edu?: string): number {
  if (!edu) return -1;
  const upper = edu.toUpperCase();
  if (upper.includes('BELOW_8TH')) return 0;
  if (upper.includes('8TH')) return 1;
  if (upper.includes('10TH') || upper.includes('SSLC')) return 2;
  if (upper.includes('12TH') || upper.includes('HSC')) return 3;
  if (upper.includes('ITI') || upper.includes('DIPLOMA')) return 4;
  if (upper.includes('DEGREE') || upper.includes('GRADUATE') || upper.includes('B.') || upper.includes('B.TECH') || upper.includes('B.E') || upper.includes('B.COM') || upper.includes('B.SC')) return 5;
  if (upper.includes('POST') || upper.includes('MASTER') || upper.includes('MBA') || upper.includes('M.E') || upper.includes('M.TECH')) return 6;
  return 3;
}

export function evaluateSchemeEligibility(
  scheme: any, // SchemeRawData or Prisma Scheme
  profile: UserEligibilityProfile
): SchemeEligibilityResult {
  const matched: CriterionCheck[] = [];
  const failed: CriterionCheck[] = [];
  const missing: MissingFieldRequirement[] = [];

  const ageRules = typeof scheme.ageRules === 'string' ? JSON.parse(scheme.ageRules) : scheme.ageRules;
  const educationRules = typeof scheme.educationRules === 'string' ? JSON.parse(scheme.educationRules) : scheme.educationRules;
  const residencyRules = typeof scheme.residencyRules === 'string' ? JSON.parse(scheme.residencyRules) : scheme.residencyRules;
  const incomeRules = typeof scheme.incomeRules === 'string' ? JSON.parse(scheme.incomeRules) : scheme.incomeRules;
  const sectorRules = typeof scheme.sectorRules === 'string' ? JSON.parse(scheme.sectorRules) : scheme.sectorRules;
  const specialRules = typeof scheme.specialCategoryRules === 'string' ? JSON.parse(scheme.specialCategoryRules) : scheme.specialCategoryRules;
  const businessTypes: string[] = typeof scheme.businessTypes === 'string' ? JSON.parse(scheme.businessTypes) : scheme.businessTypes;

  const isSpecialCategory =
    profile.gender === 'FEMALE' ||
    profile.gender === 'TRANSGENDER' ||
    ['SC', 'ST', 'BC', 'MBC', 'MINORITY', 'OBC'].includes((profile.social_category || '').toUpperCase()) ||
    profile.is_differently_abled === true ||
    profile.is_ex_serviceman === true;

  // 1. AGE CHECK
  if (profile.age !== undefined && profile.age !== null) {
    const minAge = ageRules.min || 18;
    const maxAge = isSpecialCategory ? (ageRules.maxSpecial || ageRules.maxGeneral || 99) : (ageRules.maxGeneral || 99);

    if (profile.age < minAge) {
      failed.push({
        criterion: 'Age Requirement',
        field: 'age',
        matched: false,
        message: `Applicant age (${profile.age}) is below minimum required age of ${minAge} years.`,
        userValue: profile.age,
        requiredRule: { min: minAge, max: maxAge },
      });
    } else if (profile.age > maxAge) {
      failed.push({
        criterion: 'Age Requirement',
        field: 'age',
        matched: false,
        message: `Applicant age (${profile.age}) exceeds maximum age ceiling of ${maxAge} years for this category.`,
        userValue: profile.age,
        requiredRule: { min: minAge, max: maxAge },
      });
    } else {
      matched.push({
        criterion: 'Age Requirement',
        field: 'age',
        matched: true,
        message: `Age ${profile.age} is within eligible window (${minAge}-${maxAge} years).`,
        userValue: profile.age,
      });
    }
  } else {
    missing.push({
      field: 'age',
      label: 'Applicant Age',
      labelTa: 'விண்ணப்பதாரர் வயது',
      type: 'number',
      description: `Required to verify eligibility against age limits (${ageRules.min}-${ageRules.maxGeneral} years).`,
      descriptionTa: `வயது வரம்பை (${ageRules.min}-${ageRules.maxGeneral} வயது) சரிபார்க்க தேவை.`,
    });
  }

  // 2. BUSINESS / SECTOR TYPE CHECK
  if (profile.business_type) {
    const userBType = profile.business_type.toUpperCase();
    const isSupported = businessTypes.includes(userBType);

    if (!isSupported) {
      failed.push({
        criterion: 'Business Type',
        field: 'business_type',
        matched: false,
        message: `Business type "${profile.business_type}" is not supported. This scheme strictly supports: ${businessTypes.join(', ')}.`,
        userValue: profile.business_type,
        requiredRule: businessTypes,
      });
    } else {
      matched.push({
        criterion: 'Business Type',
        field: 'business_type',
        matched: true,
        message: `Business type "${profile.business_type}" is eligible under this scheme.`,
        userValue: profile.business_type,
      });
    }
  } else {
    missing.push({
      field: 'business_type',
      label: 'Business Activity / Type',
      labelTa: 'தொழில் வகை',
      type: 'select',
      options: [
        { value: 'MANUFACTURING', label: 'Manufacturing (உற்பத்தி)', labelTa: 'உற்பத்தி' },
        { value: 'SERVICE', label: 'Service Enterprise (சேவை நிறுவனம்)', labelTa: 'சேவை நிறுவனம்' },
        { value: 'TRADING', label: 'Business / Trading / Retail (வணிகம் / விற்பனை)', labelTa: 'வணிகம் / விற்பனை' },
      ],
      description: `Scheme eligibility depends heavily on whether your business is Manufacturing, Service, or Trading.`,
      descriptionTa: `தொழில் உற்பத்தி, சேவை அல்லது வியாபாரம் என்பதைப் பொறுத்து மானிய தகுதி அமைகிறது.`,
    });
  }

  // 3. PROJECT COST CHECK
  if (profile.project_cost !== undefined && profile.project_cost !== null) {
    const minCost = scheme.projectCostMin;
    const maxCost = scheme.projectCostMax;

    if (profile.project_cost < minCost) {
      failed.push({
        criterion: 'Project Cost Minimum',
        field: 'project_cost',
        matched: false,
        message: `Proposed project cost of ₹${profile.project_cost.toLocaleString()} is below the minimum required cost of ₹${minCost.toLocaleString()}.`,
        userValue: profile.project_cost,
        requiredRule: { min: minCost, max: maxCost },
      });
    } else if (profile.project_cost > maxCost) {
      failed.push({
        criterion: 'Project Cost Ceiling',
        field: 'project_cost',
        matched: false,
        message: `Proposed project cost of ₹${profile.project_cost.toLocaleString()} exceeds the maximum allowable ceiling of ₹${maxCost.toLocaleString()}.`,
        userValue: profile.project_cost,
        requiredRule: { min: minCost, max: maxCost },
      });
    } else {
      matched.push({
        criterion: 'Project Cost Range',
        field: 'project_cost',
        matched: true,
        message: `Project cost ₹${profile.project_cost.toLocaleString()} is within the eligible range (₹${minCost.toLocaleString()} to ₹${maxCost.toLocaleString()}).`,
        userValue: profile.project_cost,
      });
    }
  } else {
    missing.push({
      field: 'project_cost',
      label: 'Estimated Project Cost (₹)',
      labelTa: 'மதிப்பிடப்பட்ட திட்டச் செலவு (₹)',
      type: 'number',
      description: `Required to calculate exact eligible subsidy and verify project limits (₹${scheme.projectCostMin.toLocaleString()} - ₹${scheme.projectCostMax.toLocaleString()}).`,
      descriptionTa: `மானியம் கணக்கிடவும் திட்ட வரம்புகளை சரிபார்க்கவும் தேவை.`,
    });
  }

  // 4. EDUCATION CHECK
  if (educationRules.minimum && educationRules.minimum !== 'ANY') {
    if (profile.education) {
      const userLevel = normalizeEducation(profile.education);
      let requiredLevel = 1;
      if (educationRules.minimum === '8TH_PASS') requiredLevel = 1;
      else if (educationRules.minimum === '10TH_PASS') requiredLevel = 2;
      else if (educationRules.minimum === 'DEGREE_DIPLOMA_ITI') requiredLevel = 4;

      if (userLevel < requiredLevel) {
        failed.push({
          criterion: 'Educational Qualification',
          field: 'education',
          matched: false,
          message: `Educational qualification (${profile.education}) does not meet the published minimum requirement: ${educationRules.description}`,
          userValue: profile.education,
          requiredRule: educationRules.minimum,
        });
      } else {
        matched.push({
          criterion: 'Educational Qualification',
          field: 'education',
          matched: true,
          message: `Education qualification (${profile.education}) satisfies requirement (${educationRules.description}).`,
          userValue: profile.education,
        });
      }
    } else {
      missing.push({
        field: 'education',
        label: 'Educational Qualification',
        labelTa: 'கல்வித் தகுதி',
        type: 'select',
        options: [
          { value: 'DEGREE_DIPLOMA_ITI', label: 'Degree / Diploma / ITI / Vocational', labelTa: 'பட்டப்படிப்பு / டிப்ளமோ / ITI' },
          { value: '12TH_PASS', label: '12th Standard Pass (HSC)', labelTa: '12ஆம் வகுப்பு தேர்ச்சி' },
          { value: '10TH_PASS', label: '10th Standard Pass (SSLC)', labelTa: '10ஆம் வகுப்பு தேர்ச்சி' },
          { value: '8TH_PASS', label: '8th Standard Pass', labelTa: '8ஆம் வகுப்பு தேர்ச்சி' },
          { value: 'BELOW_8TH', label: 'Below 8th Standard', labelTa: '8ஆம் வகுப்புக்கு கீழ்' },
        ],
        description: `This scheme requires minimum: ${educationRules.description}`,
        descriptionTa: `இந்த திட்டத்திற்கு குறைந்தபட்ச கல்வி: ${educationRules.description}`,
      });
    }
  }

  // 5. RESIDENCY CHECK (For State Schemes)
  if (scheme.governmentLevel === 'STATE') {
    if (profile.state) {
      const isTN = profile.state.toLowerCase().includes('tamil') || profile.state.toLowerCase().includes('tn');
      if (!isTN) {
        failed.push({
          criterion: 'State Residency',
          field: 'state',
          matched: false,
          message: `This is a Government of Tamil Nadu scheme requiring resident enterprise within Tamil Nadu. Selected state: ${profile.state}.`,
          userValue: profile.state,
          requiredRule: 'Tamil Nadu',
        });
      } else {
        matched.push({
          criterion: 'State Residency',
          field: 'state',
          matched: true,
          message: 'Applicant enterprise is located in Tamil Nadu.',
          userValue: profile.state,
        });
      }
    } else {
      missing.push({
        field: 'state',
        label: 'Business Location / State',
        labelTa: 'வணிக மாநிலம்',
        type: 'text',
        description: 'Tamil Nadu State schemes require physical establishment in Tamil Nadu.',
        descriptionTa: 'தமிழ்நாடு அரசு திட்டங்களுக்கு நிறுவனம் தமிழ்நாட்டில் அமைய வேண்டும்.',
      });
    }
  }

  // 6. FIRST-GENERATION / EXISTING BUSINESS REQUIREMENT (e.g. NEEDS)
  if (scheme.id === 'needs') {
    if (profile.entrepreneur_type !== undefined || profile.existing_business !== undefined) {
      const isFirstGen = profile.entrepreneur_type === 'FIRST_GENERATION' || profile.existing_business === false;
      if (!isFirstGen) {
        failed.push({
          criterion: 'First-Generation Entrepreneur',
          field: 'entrepreneur_type',
          matched: false,
          message: 'NEEDS is strictly reserved for First-Generation Entrepreneurs without prior manufacturing/service enterprise ownership.',
          userValue: profile.entrepreneur_type || (profile.existing_business ? 'EXISTING' : 'FIRST_GENERATION'),
        });
      } else {
        matched.push({
          criterion: 'First-Generation Entrepreneur',
          field: 'entrepreneur_type',
          matched: true,
          message: 'Applicant qualifies as a First-Generation Entrepreneur.',
          userValue: 'FIRST_GENERATION',
        });
      }
    } else {
      missing.push({
        field: 'entrepreneur_type',
        label: 'Entrepreneur Status',
        labelTa: 'தொழில்முனைவோர் நிலை',
        type: 'select',
        options: [
          { value: 'FIRST_GENERATION', label: 'First-Generation Entrepreneur (புதிய முதல் தலைமுறை)', labelTa: 'புதிய முதல் தலைமுறை' },
          { value: 'EXISTING', label: 'Existing Business Owner (ஏற்கனவே தொழில் உள்ளவர்)', labelTa: 'ஏற்கனவே தொழில் உள்ளவர்' },
        ],
        description: 'NEEDS specifically requires you to be a first-generation entrepreneur.',
        descriptionTa: 'NEEDS திட்டத்திற்கு நீங்கள் முதல் தலைமுறை தொழில்முனைவோராக இருக்க வேண்டும்.',
      });
    }
  }

  // 7. ANNUAL FAMILY INCOME CEILING (e.g. UYEGP has ₹5L limit)
  if (incomeRules.maxAnnualFamilyIncome !== null && incomeRules.maxAnnualFamilyIncome !== undefined) {
    if (profile.annual_income !== undefined && profile.annual_income !== null) {
      if (profile.annual_income > incomeRules.maxAnnualFamilyIncome) {
        failed.push({
          criterion: 'Family Income Ceiling',
          field: 'annual_income',
          matched: false,
          message: `Annual family income (₹${profile.annual_income.toLocaleString()}) exceeds published scheme limit of ₹${incomeRules.maxAnnualFamilyIncome.toLocaleString()}.`,
          userValue: profile.annual_income,
          requiredRule: { max: incomeRules.maxAnnualFamilyIncome },
        });
      } else {
        matched.push({
          criterion: 'Family Income Ceiling',
          field: 'annual_income',
          matched: true,
          message: `Annual family income ₹${profile.annual_income.toLocaleString()} is within the ceiling of ₹${incomeRules.maxAnnualFamilyIncome.toLocaleString()}.`,
          userValue: profile.annual_income,
        });
      }
    } else {
      missing.push({
        field: 'annual_income',
        label: 'Annual Family Income (₹)',
        labelTa: 'ஆண்டு குடும்ப வருமானம் (₹)',
        type: 'number',
        description: `Scheme requires family income under ₹${incomeRules.maxAnnualFamilyIncome.toLocaleString()} per annum.`,
        descriptionTa: `குடும்ப வருமானம் ஆண்டுக்கு ₹${incomeRules.maxAnnualFamilyIncome.toLocaleString()}க்குள் இருக்க வேண்டும்.`,
      });
    }
  }

  // 8. SUBSIDY CALCULATION IF PROJECT COST PROVIDED
  let estimatedSubsidy: SchemeEligibilityResult['estimated_subsidy'];
  if (profile.project_cost && profile.project_cost > 0) {
    let applicablePercentage = scheme.subsidyPercentage;

    // Special category logic for PMEGP (urban 15%/25%, rural 25%/35%)
    if (scheme.id === 'pmegp') {
      const isRural = profile.location_type === 'RURAL';
      if (isRural) {
        applicablePercentage = isSpecialCategory ? 35.0 : 25.0;
      } else {
        applicablePercentage = isSpecialCategory ? 25.0 : 15.0;
      }
    }

    const calculatedRaw = Math.round((profile.project_cost * applicablePercentage) / 100);
    const capped = Math.min(calculatedRaw, scheme.subsidyMaximum);

    estimatedSubsidy = {
      eligible_percentage: applicablePercentage,
      estimated_amount: capped,
      max_subsidy_cap: scheme.subsidyMaximum,
      interest_subvention_percent: scheme.interestSubvention || 0,
    };
  }

  // STATUS DETERMINATION
  let status: EligibilityStatus;
  let explanation = '';
  let explanationTa = '';

  if (failed.length > 0) {
    status = 'NOT_ELIGIBLE';
    explanation = `You do not meet ${failed.length} published criteria for ${scheme.name}: ${failed.map((f) => f.message).join(' ')}`;
    explanationTa = `${scheme.nameTa || scheme.name} திட்டத்திற்கான ${failed.length} அரசு நிபந்தனைகளை நீங்கள் தற்போது பூர்த்தி செய்யவில்லை: ${failed.map((f) => f.message).join(' ')}`;
  } else if (missing.length > 0 && matched.length === 0) {
    status = 'INSUFFICIENT_INFORMATION';
    explanation = `Additional applicant details are needed (${missing.map((m) => m.label).join(', ')}) to verify your eligibility for ${scheme.name}.`;
    explanationTa = `${scheme.nameTa || scheme.name} திட்ட தகுதியை உறுதிப்படுத்த மேலும் விவரங்கள் (${missing.map((m) => m.labelTa).join(', ')}) தேவைப்படுகின்றன.`;
  } else if (missing.length > 0) {
    status = 'PARTIAL_MATCH';
    explanation = `You meet ${matched.length} verified criteria, but ${missing.length} field(s) require confirmation (${missing.map((m) => m.label).join(', ')}).`;
    explanationTa = `நீங்கள் ${matched.length} நிபந்தனைகளை பூர்த்தி செய்துள்ளீர்கள். மீதமுள்ள ${missing.length} விவரங்களை (${missing.map((m) => m.labelTa).join(', ')}) உறுதிப்படுத்தினால் இறுதி தகுதியை அறியலாம்.`;
  } else {
    status = 'MATCH';
    explanation = `You appear to meet all published criteria for ${scheme.name} based on provided data! Estimated subsidy grant: ₹${estimatedSubsidy?.estimated_amount.toLocaleString() || scheme.subsidyMaximum.toLocaleString()}.`;
    explanationTa = `அரசு வெளியிட்டுள்ள வழிகாட்டுதல்களின்படி நீங்கள் ${scheme.nameTa || scheme.name} திட்டத்திற்கு தகுதியுடையவராகத் தோன்றுகிறீர்கள்! உத்தேச மானியம்: ₹${estimatedSubsidy?.estimated_amount.toLocaleString() || scheme.subsidyMaximum.toLocaleString()}.`;
  }

  const isStale = isSchemeDataStale(scheme.lastVerifiedAt);

  return {
    scheme_id: scheme.id,
    scheme_name: scheme.name,
    scheme_full_name: scheme.fullName,
    status,
    matched,
    missing,
    failed,
    estimated_subsidy: estimatedSubsidy,
    explanation,
    explanationTa,
    source: {
      authority: scheme.sourceAuthority,
      official_source_url: scheme.officialSourceUrl,
      official_document_url: scheme.officialDocumentUrl,
      last_verified_at: new Date(scheme.lastVerifiedAt).toISOString(),
      is_stale: isStale,
    },
    verified_at: new Date(scheme.lastVerifiedAt).toISOString(),
    disclaimer: 'You appear to meet the published eligibility criteria. Final approval is subject to the implementing authority/bank and applicable scheme rules.',
    disclaimerTa: 'அரசு வெளியிட்டுள்ள தகுதி வரம்புகளின்படி நீங்கள் தகுதியுடையவராகத் தெரிகிறீர்கள். இறுதி ஒப்புதல் மற்றும் மானிய அனுமதி சம்பந்தப்பட்ட அரசுத் துறை/வங்கியின் நேரடி பரிசீலனைக்கு உட்பட்டது.',
  };
}
