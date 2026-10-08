import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        purchases: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const data = req.body;
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

    const supplier = await prisma.supplier.create({
      data: {
        shopId: data.shopId || shop.id,
        name: data.name || 'New Supplier',
        phone: data.phone || null,
        address: data.address || null,
        outstandingBalance: Number(data.outstandingBalance) || 0,
        totalPurchases: Number(data.totalPurchases) || 0,
        totalPaid: Number(data.totalPaid) || 0,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        address: data.address !== undefined ? data.address : undefined,
        outstandingBalance: data.outstandingBalance !== undefined ? Number(data.outstandingBalance) : undefined,
        totalPurchases: data.totalPurchases !== undefined ? Number(data.totalPurchases) : undefined,
        totalPaid: data.totalPaid !== undefined ? Number(data.totalPaid) : undefined,
      },
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if supplier has purchases
    const purchasesCount = await prisma.purchase.count({ where: { supplierId: id } });
    if (purchasesCount > 0) {
      // Unlink purchases
      await prisma.purchase.updateMany({
        where: { supplierId: id },
        data: { supplierId: null },
      });
    }

    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// POST record payment to supplier
router.post('/:id/payment', async (req, res) => {
  try {
    const amount = Number(req.body.amount) || 0;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        outstandingBalance: { decrement: amount },
        totalPaid: { increment: amount },
      },
    });
    res.json(supplier);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record supplier payment' });
  }
});

export default router;
