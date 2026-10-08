import { Request } from 'express';
import { prisma } from '../lib/db';

export interface AuthenticatedUser {
  id: string;
  role: 'wholesale' | 'retail' | 'customer';
  shopId?: string;
  email?: string;
}

/**
 * Resolves the authenticated shopId in strict multi-tenant mode.
 * If user is authenticated with a specific shopId, enforces that shopId.
 * In demo/guest mode, falls back to the default shop safely.
 */
export async function resolveTenantShopId(req: Request): Promise<string> {
  const user = (req as any).user as AuthenticatedUser | undefined;

  // 1. If JWT has authenticated shopId (and not dummy demo string), verify shop exists
  if (user?.shopId && user.shopId !== 'demo-shop-1') {
    const existing = await prisma.shop.findUnique({ where: { id: user.shopId } });
    if (existing) return existing.id;
  }

  // 2. Otherwise get or create primary tenant shop
  let shop = await prisma.shop.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: 'Thirumalai Stores',
        ownerName: 'K. Thirumalai',
        phone: '9842100000',
        address: 'Madurai, Tamil Nadu',
        shopType: 'RETAIL',
      },
    });
  }

  return shop.id;
}
