import { prisma } from '../lib/db';
import { VERIFIED_GOVERNMENT_SCHEMES, SchemeRawData } from './schemesData';
import {
  evaluateSchemeEligibility,
  isSchemeDataStale,
  UserEligibilityProfile,
  SchemeEligibilityResult,
} from './eligibilityEngine';

export interface SchemeSearchFilters {
  query?: string;
  category?: string;
  governmentLevel?: string;
  businessType?: string;
  minCost?: number;
  maxCost?: number;
  projectCost?: number;
  status?: string;
  location?: string;
  beneficiaryType?: string;
}

/**
 * Automatically seeds or updates verified government schemes on server start
 */
export async function bootstrapVerifiedSchemes(): Promise<void> {
  try {
    console.log('[SCHEMES DB] Bootstrapping verified government schemes...');

    for (const raw of VERIFIED_GOVERNMENT_SCHEMES) {
      const existing = await prisma.scheme.findUnique({
        where: { id: raw.id },
      });

      const schemePayload = {
        name: raw.name,
        fullName: raw.fullName,
        nameTa: raw.nameTa,
        fullNameTa: raw.fullNameTa,
        governmentLevel: raw.governmentLevel,
        department: raw.department,
        departmentTa: raw.departmentTa,
        category: raw.category,
        description: raw.description,
        descriptionTa: raw.descriptionTa,
        beneficiaryTypes: JSON.stringify(raw.beneficiaryTypes),
        businessTypes: JSON.stringify(raw.businessTypes),
        projectCostMin: raw.projectCostMin,
        projectCostMax: raw.projectCostMax,
        subsidyPercentage: raw.subsidyPercentage,
        subsidyMaximum: raw.subsidyMaximum,
        interestSubvention: raw.interestSubvention,
        ageRules: JSON.stringify(raw.ageRules),
        educationRules: JSON.stringify(raw.educationRules),
        residencyRules: JSON.stringify(raw.residencyRules),
        incomeRules: JSON.stringify(raw.incomeRules),
        sectorRules: JSON.stringify(raw.sectorRules),
        specialCategoryRules: JSON.stringify(raw.specialCategoryRules),
        applicationUrl: raw.applicationUrl,
        officialSourceUrl: raw.officialSourceUrl,
        officialDocumentUrl: raw.officialDocumentUrl,
        sourceAuthority: raw.sourceAuthority,
        lastVerifiedAt: new Date(raw.lastVerifiedAt),
        effectiveFrom: new Date(raw.effectiveFrom),
        effectiveTo: raw.effectiveTo ? new Date(raw.effectiveTo) : null,
        status: raw.status,
      };

      if (!existing) {
        await prisma.scheme.create({
          data: {
            id: raw.id,
            ...schemePayload,
          },
        });

        // Add initial audit log
        await prisma.schemeAuditLog.create({
          data: {
            schemeId: raw.id,
            action: 'CREATE',
            changedBy: 'system-bootstrap@urimaiyalar.ai',
            changes: JSON.stringify({ note: 'Initial official verified import' }),
            notes: 'Verified against Tamil Nadu and Central MSME Gazette Guidelines',
          },
        });

        // Add official sources
        for (const src of raw.sources) {
          await prisma.schemeSource.create({
            data: {
              schemeId: raw.id,
              authority: src.authority,
              title: src.title,
              documentUrl: src.documentUrl,
              portalUrl: src.portalUrl,
              version: src.version,
              effectiveDate: new Date(src.effectiveDate),
              verifiedAt: new Date(src.verifiedAt),
              status: src.status,
              notes: src.notes,
            },
          });
        }
      }
    }

    const count = await prisma.scheme.count();
    console.log(`[SCHEMES DB] Successfully verified and loaded ${count} schemes in database.`);
  } catch (err: any) {
    console.error('[SCHEMES DB ERROR] Failed to bootstrap schemes:', err?.message || err);
  }
}

/**
 * Format a Prisma Scheme entity into clean JSON response with parsed rules
 */
export function formatSchemeResponse(scheme: any) {
  const isStale = isSchemeDataStale(scheme.lastVerifiedAt);
  return {
    id: scheme.id,
    name: scheme.name,
    fullName: scheme.fullName,
    nameTa: scheme.nameTa,
    fullNameTa: scheme.fullNameTa,
    governmentLevel: scheme.governmentLevel,
    department: scheme.department,
    departmentTa: scheme.departmentTa,
    category: scheme.category,
    description: scheme.description,
    descriptionTa: scheme.descriptionTa,
    beneficiaryTypes: typeof scheme.beneficiaryTypes === 'string' ? JSON.parse(scheme.beneficiaryTypes) : scheme.beneficiaryTypes,
    businessTypes: typeof scheme.businessTypes === 'string' ? JSON.parse(scheme.businessTypes) : scheme.businessTypes,
    projectCostMin: scheme.projectCostMin,
    projectCostMax: scheme.projectCostMax,
    subsidyPercentage: scheme.subsidyPercentage,
    subsidyMaximum: scheme.subsidyMaximum,
    interestSubvention: scheme.interestSubvention,
    ageRules: typeof scheme.ageRules === 'string' ? JSON.parse(scheme.ageRules) : scheme.ageRules,
    educationRules: typeof scheme.educationRules === 'string' ? JSON.parse(scheme.educationRules) : scheme.educationRules,
    residencyRules: typeof scheme.residencyRules === 'string' ? JSON.parse(scheme.residencyRules) : scheme.residencyRules,
    incomeRules: typeof scheme.incomeRules === 'string' ? JSON.parse(scheme.incomeRules) : scheme.incomeRules,
    sectorRules: typeof scheme.sectorRules === 'string' ? JSON.parse(scheme.sectorRules) : scheme.sectorRules,
    specialCategoryRules: typeof scheme.specialCategoryRules === 'string' ? JSON.parse(scheme.specialCategoryRules) : scheme.specialCategoryRules,
    applicationUrl: scheme.applicationUrl,
    officialSourceUrl: scheme.officialSourceUrl,
    officialDocumentUrl: scheme.officialDocumentUrl,
    sourceAuthority: scheme.sourceAuthority,
    lastVerifiedAt: scheme.lastVerifiedAt,
    effectiveFrom: scheme.effectiveFrom,
    effectiveTo: scheme.effectiveTo,
    status: scheme.status,
    isStale,
    staleWarning: isStale ? 'Information may require verification. Always cross-check the official portal.' : null,
    sources: scheme.sources || [],
    auditLogs: scheme.auditLogs || [],
  };
}

/**
 * Retrieve all active schemes with filtering
 */
export async function getSchemes(filters: SchemeSearchFilters = {}) {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { not: 'ARCHIVED' };
  }

  if (filters.category && filters.category !== 'ALL') {
    where.category = filters.category;
  }

  if (filters.governmentLevel && filters.governmentLevel !== 'ALL') {
    where.governmentLevel = filters.governmentLevel;
  }

  const schemes = await prisma.scheme.findMany({
    where,
    include: {
      sources: true,
    },
    orderBy: {
      subsidyPercentage: 'desc',
    },
  });

  let formatted = schemes.map(formatSchemeResponse);

  // Filter in memory for JSON array fields if specified
  if (filters.businessType && filters.businessType !== 'ALL') {
    const bt = filters.businessType.toUpperCase();
    formatted = formatted.filter((s: any) => s.businessTypes.includes(bt));
  }

  if (filters.projectCost && filters.projectCost > 0) {
    formatted = formatted.filter(
      (s: any) => filters.projectCost! >= s.projectCostMin && filters.projectCost! <= s.projectCostMax
    );
  }

  return formatted;
}

/**
 * Search schemes in the database with debounce/query + faceted filters
 */
export async function searchSchemes(filters: SchemeSearchFilters) {
  const allSchemes = await getSchemes({ status: filters.status || 'ACTIVE' });
  const q = (filters.query || '').trim().toLowerCase();

  if (!q) {
    return allSchemes;
  }

  return allSchemes.filter((s: any) => {
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.fullName.toLowerCase().includes(q) ||
      (s.nameTa && s.nameTa.toLowerCase().includes(q)) ||
      (s.fullNameTa && s.fullNameTa.toLowerCase().includes(q)) ||
      s.department.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.descriptionTa && s.descriptionTa.toLowerCase().includes(q)) ||
      s.sourceAuthority.toLowerCase().includes(q);

    return matchesQuery;
  });
}

/**
 * Get scheme by ID
 */
export async function getSchemeById(id: string) {
  const scheme = await prisma.scheme.findUnique({
    where: { id },
    include: {
      sources: true,
      auditLogs: {
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
    },
  });

  if (!scheme) return null;
  return formatSchemeResponse(scheme);
}

/**
 * Check eligibility for a specific scheme
 */
export async function checkSchemeEligibility(schemeId: string, profile: UserEligibilityProfile): Promise<SchemeEligibilityResult | null> {
  const scheme = await getSchemeById(schemeId);
  if (!scheme) return null;
  return evaluateSchemeEligibility(scheme, profile);
}

/**
 * Check eligibility across all active schemes, ranked by match status
 */
export async function checkAllSchemesEligibility(profile: UserEligibilityProfile): Promise<SchemeEligibilityResult[]> {
  const schemes = await getSchemes({ status: 'ACTIVE' });
  const results = schemes.map((s: any) => evaluateSchemeEligibility(s, profile));

  // Rank: MATCH > PARTIAL_MATCH > INSUFFICIENT_INFORMATION > NOT_ELIGIBLE
  const priority: Record<string, number> = {
    MATCH: 1,
    PARTIAL_MATCH: 2,
    INSUFFICIENT_INFORMATION: 3,
    NOT_ELIGIBLE: 4,
  };

  return results.sort((a, b) => {
    const pDiff = (priority[a.status] || 99) - (priority[b.status] || 99);
    if (pDiff !== 0) return pDiff;
    // Secondary sort: highest estimated subsidy
    const subA = a.estimated_subsidy?.estimated_amount || 0;
    const subB = b.estimated_subsidy?.estimated_amount || 0;
    return subB - subA;
  });
}

/**
 * Admin: Create a new Scheme
 */
export async function adminCreateScheme(data: any, changedBy: string) {
  const created = await prisma.scheme.create({
    data: {
      id: data.id,
      name: data.name,
      fullName: data.fullName,
      nameTa: data.nameTa || data.name,
      fullNameTa: data.fullNameTa || data.fullName,
      governmentLevel: data.governmentLevel || 'STATE',
      department: data.department,
      departmentTa: data.departmentTa || data.department,
      category: data.category,
      description: data.description,
      descriptionTa: data.descriptionTa || data.description,
      beneficiaryTypes: JSON.stringify(data.beneficiaryTypes || []),
      businessTypes: JSON.stringify(data.businessTypes || []),
      projectCostMin: Number(data.projectCostMin || 0),
      projectCostMax: Number(data.projectCostMax || 10000000),
      subsidyPercentage: Number(data.subsidyPercentage || 0),
      subsidyMaximum: Number(data.subsidyMaximum || 0),
      interestSubvention: Number(data.interestSubvention || 0),
      ageRules: JSON.stringify(data.ageRules || {}),
      educationRules: JSON.stringify(data.educationRules || {}),
      residencyRules: JSON.stringify(data.residencyRules || {}),
      incomeRules: JSON.stringify(data.incomeRules || {}),
      sectorRules: JSON.stringify(data.sectorRules || {}),
      specialCategoryRules: JSON.stringify(data.specialCategoryRules || {}),
      applicationUrl: data.applicationUrl,
      officialSourceUrl: data.officialSourceUrl,
      officialDocumentUrl: data.officialDocumentUrl || data.officialSourceUrl,
      sourceAuthority: data.sourceAuthority,
      lastVerifiedAt: new Date(),
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      status: data.status || 'ACTIVE',
    },
  });

  await prisma.schemeAuditLog.create({
    data: {
      schemeId: created.id,
      action: 'CREATE',
      changedBy,
      changes: JSON.stringify(data),
      notes: data.auditNotes || 'Scheme created via Admin Management API',
    },
  });

  return formatSchemeResponse(created);
}

/**
 * Admin: Update an existing Scheme
 */
export async function adminUpdateScheme(id: string, updates: any, changedBy: string) {
  const existing = await prisma.scheme.findUnique({ where: { id } });
  if (!existing) throw new Error('Scheme not found');

  const updateData: any = {};
  const allowed = [
    'name', 'fullName', 'nameTa', 'fullNameTa', 'governmentLevel', 'department', 'departmentTa',
    'category', 'description', 'descriptionTa', 'projectCostMin', 'projectCostMax',
    'subsidyPercentage', 'subsidyMaximum', 'interestSubvention', 'applicationUrl',
    'officialSourceUrl', 'officialDocumentUrl', 'sourceAuthority', 'status',
  ];

  for (const k of allowed) {
    if (updates[k] !== undefined) {
      if (['projectCostMin', 'projectCostMax', 'subsidyPercentage', 'subsidyMaximum', 'interestSubvention'].includes(k)) {
        updateData[k] = Number(updates[k]);
      } else {
        updateData[k] = updates[k];
      }
    }
  }

  // Handle JSON serialized fields
  const jsonFields = ['beneficiaryTypes', 'businessTypes', 'ageRules', 'educationRules', 'residencyRules', 'incomeRules', 'sectorRules', 'specialCategoryRules'];
  for (const k of jsonFields) {
    if (updates[k] !== undefined) {
      updateData[k] = typeof updates[k] === 'string' ? updates[k] : JSON.stringify(updates[k]);
    }
  }

  // Update verified date if specified
  if (updates.lastVerifiedAt) {
    updateData.lastVerifiedAt = new Date(updates.lastVerifiedAt);
  }

  const updated = await prisma.scheme.update({
    where: { id },
    data: updateData,
  });

  await prisma.schemeAuditLog.create({
    data: {
      schemeId: id,
      action: 'UPDATE',
      changedBy,
      changes: JSON.stringify(updates),
      notes: updates.auditNotes || 'Scheme updated via Admin Management API',
    },
  });

  return formatSchemeResponse(updated);
}

/**
 * Admin: Verify Scheme facts and update lastVerifiedAt
 */
export async function adminVerifyScheme(id: string, changedBy: string, notes?: string) {
  const updated = await prisma.scheme.update({
    where: { id },
    data: {
      lastVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  await prisma.schemeAuditLog.create({
    data: {
      schemeId: id,
      action: 'VERIFY',
      changedBy,
      changes: JSON.stringify({ verifiedAt: new Date() }),
      notes: notes || 'Verified against official Government Portal and Gazette notification.',
    },
  });

  return formatSchemeResponse(updated);
}

/**
 * Admin: Archive Scheme
 */
export async function adminArchiveScheme(id: string, changedBy: string, notes?: string) {
  const updated = await prisma.scheme.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
    },
  });

  await prisma.schemeAuditLog.create({
    data: {
      schemeId: id,
      action: 'ARCHIVE',
      changedBy,
      changes: JSON.stringify({ status: 'ARCHIVED' }),
      notes: notes || 'Scheme archived and hidden from public active catalog.',
    },
  });

  return formatSchemeResponse(updated);
}

/**
 * Get audit logs for a scheme or all schemes
 */
export async function getSchemeAuditLogs(schemeId?: string) {
  const where = schemeId ? { schemeId } : {};
  return prisma.schemeAuditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
}
