import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    // Normalize: frontend uses purchasePrice, DB uses costPrice
    const normalized = products.map((p) => ({
      ...p,
      purchasePrice: p.costPrice,
      lastUpdated: p.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    }));
    res.json(normalized);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create product — explicitly map fields to avoid Prisma unknown field errors
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Auto-create shop if needed
    let shop = await prisma.shop.findFirst();
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: 'Default Shop',
          ownerName: 'Owner',
          phone: '9876543210',
          address: 'Tamil Nadu, India',
        },
      });
    }

    // Map frontend fields → Prisma schema fields
    // Frontend sends: purchasePrice → Prisma has: costPrice
    const product = await prisma.product.create({
      data: {
        shopId: body.shopId || shop.id,
        name: body.name || 'New Product',
        nameTa: body.nameTa || body.name || 'புதிய பொருள்',
        category: body.category || 'general',
        costPrice: Number(body.costPrice || body.purchasePrice) || 0,
        sellingPrice: Number(body.sellingPrice) || 0,
        currentStock: Number(body.currentStock) || 0,
        minStock: Number(body.minStock) || 5,
        unit: body.unit || 'piece',
        code: body.code || null,
      },
    });

    const normalized = {
      ...product,
      purchasePrice: product.costPrice,
      lastUpdated: product.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };

    res.status(201).json(normalized);
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product — explicitly map fields
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        nameTa: body.nameTa,
        category: body.category,
        costPrice: body.costPrice !== undefined ? Number(body.costPrice)
          : body.purchasePrice !== undefined ? Number(body.purchasePrice) : undefined,
        sellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : undefined,
        currentStock: body.currentStock !== undefined ? Number(body.currentStock) : undefined,
        minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
        unit: body.unit,
      },
    });
    const normalized = {
      ...product,
      purchasePrice: product.costPrice,
      lastUpdated: product.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
    res.json(normalized);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
