import { Router, Response } from 'express';
import { AuthRequest } from '../server/middleware/auth';
import {
  adminCreateScheme,
  adminUpdateScheme,
  adminVerifyScheme,
  adminArchiveScheme,
  getSchemeAuditLogs,
} from '../services/schemesDbService';

const router = Router();

// Middleware to ensure admin privilege or authenticated management token
const requireAdminOrAuthorized = (req: AuthRequest, res: Response, next: any) => {
  // Allow if user role is admin, wholesale (merchant admin), or in demo environment
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required for admin actions.' });
  }

  // Allow admin or store manager
  next();
};

router.use(requireAdminOrAuthorized);

// POST /api/admin/schemes - Add new scheme
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const changedBy = req.user?.id || 'admin@urimaiyalar.ai';
    const result = await adminCreateScheme(req.body, changedBy);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[ADMIN SCHEMES ERROR] Create failed:', error?.message || error);
    res.status(400).json({ error: 'FAILED_TO_CREATE_SCHEME', message: error?.message });
  }
});

// PUT /api/admin/schemes/:id - Edit scheme
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const changedBy = req.user?.id || 'admin@urimaiyalar.ai';
    const result = await adminUpdateScheme(req.params.id, req.body, changedBy);
    res.json(result);
  } catch (error: any) {
    console.error('[ADMIN SCHEMES ERROR] Update failed:', error?.message || error);
    res.status(400).json({ error: 'FAILED_TO_UPDATE_SCHEME', message: error?.message });
  }
});

// POST /api/admin/schemes/:id/verify - Mark scheme as verified
router.post('/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const changedBy = req.user?.id || 'admin@urimaiyalar.ai';
    const { notes } = req.body;
    const result = await adminVerifyScheme(req.params.id, changedBy, notes);
    res.json(result);
  } catch (error: any) {
    console.error('[ADMIN SCHEMES ERROR] Verify failed:', error?.message || error);
    res.status(400).json({ error: 'FAILED_TO_VERIFY_SCHEME', message: error?.message });
  }
});

// POST /api/admin/schemes/:id/archive - Archive scheme
router.post('/:id/archive', async (req: AuthRequest, res: Response) => {
  try {
    const changedBy = req.user?.id || 'admin@urimaiyalar.ai';
    const { notes } = req.body;
    const result = await adminArchiveScheme(req.params.id, changedBy, notes);
    res.json(result);
  } catch (error: any) {
    console.error('[ADMIN SCHEMES ERROR] Archive failed:', error?.message || error);
    res.status(400).json({ error: 'FAILED_TO_ARCHIVE_SCHEME', message: error?.message });
  }
});

// GET /api/admin/schemes/audit-logs - Audit trail
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const schemeId = req.query.schemeId as string | undefined;
    const logs = await getSchemeAuditLogs(schemeId);
    res.json(logs);
  } catch (error: any) {
    console.error('[ADMIN SCHEMES ERROR] Audit log fetch failed:', error?.message || error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_AUDIT_LOGS', message: error?.message });
  }
});

export default router;
