import { Router, Request, Response } from 'express';
import {
  getSchemes,
  searchSchemes,
  getSchemeById,
  checkSchemeEligibility,
  checkAllSchemesEligibility,
} from '../services/schemesDbService';

const router = Router();

// GET /api/schemes/search (Must be defined before /:id)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      governmentLevel,
      businessType,
      projectCost,
      status,
      location,
      beneficiaryType,
    } = req.query;

    const results = await searchSchemes({
      query: (q as string) || '',
      category: category as string,
      governmentLevel: governmentLevel as string,
      businessType: businessType as string,
      projectCost: projectCost ? Number(projectCost) : undefined,
      status: status as string,
      location: location as string,
      beneficiaryType: beneficiaryType as string,
    });

    res.json({
      count: results.length,
      schemes: results,
    });
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Search failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_SEARCH_SCHEMES', message: error?.message });
  }
});

// POST /api/schemes/check-eligibility
router.post('/check-eligibility', async (req: Request, res: Response) => {
  try {
    const { scheme_id, ...profile } = req.body;

    if (scheme_id) {
      const evaluation = await checkSchemeEligibility(scheme_id, profile);
      if (!evaluation) {
        return res.status(404).json({ error: 'SCHEME_NOT_FOUND', message: `Scheme ${scheme_id} does not exist.` });
      }
      return res.json(evaluation);
    }

    // Evaluate against all active schemes
    const evaluations = await checkAllSchemesEligibility(profile);
    res.json({
      count: evaluations.length,
      evaluations,
    });
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Eligibility check failed:', error?.message || error);
    res.status(500).json({ error: 'ELIGIBILITY_CHECK_FAILED', message: error?.message });
  }
});

// GET /api/schemes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, governmentLevel, businessType, projectCost, status } = req.query;

    const schemes = await getSchemes({
      category: category as string,
      governmentLevel: governmentLevel as string,
      businessType: businessType as string,
      projectCost: projectCost ? Number(projectCost) : undefined,
      status: status as string,
    });

    res.json(schemes);
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Get schemes failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_SCHEMES', message: error?.message });
  }
});

// GET /api/schemes/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scheme = await getSchemeById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Government Scheme not found' });
    }
    res.json(scheme);
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Get scheme failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_SCHEME', message: error?.message });
  }
});

// GET /api/schemes/:id/sources
router.get('/:id/sources', async (req: Request, res: Response) => {
  try {
    const scheme = await getSchemeById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Government Scheme not found' });
    }
    res.json({
      schemeId: scheme.id,
      schemeName: scheme.name,
      sourceAuthority: scheme.sourceAuthority,
      officialSourceUrl: scheme.officialSourceUrl,
      officialDocumentUrl: scheme.officialDocumentUrl,
      applicationUrl: scheme.applicationUrl,
      lastVerifiedAt: scheme.lastVerifiedAt,
      isStale: scheme.isStale,
      sources: scheme.sources || [],
    });
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Get sources failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_SOURCES', message: error?.message });
  }
});

// GET /api/schemes/:id/eligibility
router.get('/:id/eligibility', async (req: Request, res: Response) => {
  try {
    const scheme = await getSchemeById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Government Scheme not found' });
    }

    res.json({
      schemeId: scheme.id,
      schemeName: scheme.name,
      ageRules: scheme.ageRules,
      educationRules: scheme.educationRules,
      residencyRules: scheme.residencyRules,
      incomeRules: scheme.incomeRules,
      sectorRules: scheme.sectorRules,
      specialCategoryRules: scheme.specialCategoryRules,
      projectCostMin: scheme.projectCostMin,
      projectCostMax: scheme.projectCostMax,
      subsidyPercentage: scheme.subsidyPercentage,
      subsidyMaximum: scheme.subsidyMaximum,
      interestSubvention: scheme.interestSubvention,
    });
  } catch (error: any) {
    console.error('[SCHEMES API ERROR] Get eligibility rules failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_RULES', message: error?.message });
  }
});

export default router;
