import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

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
          address: 'Main Street'
        }
      });
    }

    const total = Number(data.total || data.totalAmount) || 0;
    const amountPaid = Number(data.amountPaid) || 0;
    const balanceDue = total - amountPaid;
    const paymentStatus = balanceDue <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid');
    
    const purchase = await prisma.purchase.create({
      data: {
        shopId: shop.id,
        purchaseNo: data.purchaseNo || `PUR-${Date.now()}`,
        supplierName: data.supplierName || 'General Supplier',
        supplierId: data.supplierId || null,
        total: total,
        amountPaid: amountPaid,
        balanceDue: balanceDue,
        paymentStatus: paymentStatus,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes || null,
        items: {
          create: data.items?.map((item: any) => ({
            productId: item.productId || 'temp-prod',
            productName: item.productName || 'Product',
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost || item.unitPrice || item.costPrice) || 0,
            total: Number(item.total) || 0,
            unit: item.unit || 'piece'
          })) || []
        }
      },
      include: { items: true }
    });

    // Update stock levels
    if (data.items) {
      for (const item of data.items) {
        const products = await prisma.product.findMany({ where: { shopId: shop.id } });
        const match = products.find(p => p.name.toLowerCase() === (item.productName || '').toLowerCase());
        if (match) {
          await prisma.product.update({
            where: { id: match.id },
            data: { currentStock: match.currentStock + Number(item.quantity || 0) }
          });
        }
      }
    }

    // Create alert for Wholesale partner & Retail owner
    try {
      await prisma.alert.create({
        data: {
          shopId: shop.id,
          type: 'WHOLESALE_ORDER',
          priority: 'HIGH',
          title: `B2B Order: ${data.supplierName || 'Wholesale Supplier'}`,
          titleTa: `மொத்த வியாபார ஆர்டர்: ${data.supplierName || 'மொத்த விற்பனையாளர்'}`,
          message: `Purchase #${purchase.purchaseNo} created for ₹${total} (${data.items?.length || 0} items). Status: PENDING`,
          messageTa: `கொள்முதல் #${purchase.purchaseNo} - ₹${total} (${data.items?.length || 0} பொருட்கள்). நிலை: நிலுவை`,
          read: false,
          actionLabel: 'View Wholesale Orders',
          actionRoute: 'purchases',
          date: new Date()
        }
      });
    } catch (e) {
      console.warn('Could not create purchase alert:', e);
    }

    res.status(201).json(purchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Update Purchase / Wholesale Order Status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const purchase = await prisma.purchase.findUnique({ where: { id } });
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase record not found' });
    }

    const updatedNotes = `${purchase.notes || ''} [Status: ${status || 'DISPATCHED'}]`.trim();
    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        notes: updatedNotes,
        paymentStatus: paymentStatus || purchase.paymentStatus
      },
      include: { items: true }
    });

    // Notify retailer of dispatch
    try {
      await prisma.alert.create({
        data: {
          shopId: purchase.shopId,
          type: 'ORDER_DISPATCHED',
          priority: 'HIGH',
          title: `Wholesale Order Dispatched: #${purchase.purchaseNo}`,
          titleTa: `சரக்கு அனுப்பப்பட்டது: #${purchase.purchaseNo}`,
          message: `${purchase.supplierName} has accepted & dispatched your order!`,
          messageTa: `${purchase.supplierName} உங்கள் சரக்கை அனுப்பிவிட்டது!`,
          read: false,
          actionLabel: 'Check Inventory',
          actionRoute: 'inventory',
          date: new Date()
        }
      });
    } catch {}

    res.json({ ...updated, status: status || 'DISPATCHED' });
  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(500).json({ error: 'Failed to update purchase status' });
  }
});

export default router;
