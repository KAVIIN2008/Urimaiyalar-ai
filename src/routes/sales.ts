import { Router } from 'express';
import { prisma } from '../lib/db';
import { resolveTenantShopId } from '../server/tenantHelper';

const router = Router();

// GET all sales with tenant isolation & pagination
router.get('/', async (req, res) => {
  try {
    const shopId = await resolveTenantShopId(req);
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const sales = await prisma.sale.findMany({
      where: { shopId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    res.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// POST record sale with atomic stock reduction and customer credit tracking
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentType,
      amountPaid,
      balanceDue,
      notes,
    } = req.body;

    const shopId = await resolveTenantShopId(req);

    const parsedTotal = Number(total) || 0;
    const parsedAmountPaid = Number(amountPaid) || 0;
    const parsedBalanceDue = balanceDue !== undefined ? Number(balanceDue) : (parsedTotal - parsedAmountPaid);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check stock availability for all items before committing sale
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId && item.productId !== 'custom' && item.productId !== 'custom-item') {
            const product = await tx.product.findFirst({
              where: { id: item.productId, shopId },
            });
            if (product && product.currentStock < Number(item.quantity || 1)) {
              // Note: If negative stock is disallowed, throw error
              // For retail tolerance, stock is clamped to minimum 0 or decremented
              console.warn(`[STOCK WARNING] Item ${product.name} low stock: ${product.currentStock} vs requested ${item.quantity}`);
            }
          }
        }
      }

      // 2. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          shopId,
          invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null,
          customerId: customerId || null,
          subtotal: Number(subtotal) || parsedTotal,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          total: parsedTotal,
          paymentType: paymentType || 'cash',
          amountPaid: parsedAmountPaid,
          balanceDue: Math.max(0, parsedBalanceDue),
          notes: notes || null,
          items: {
            create: Array.isArray(items)
              ? items.map((item: any) => ({
                  productId: item.productId || 'custom',
                  productName: item.productName || 'Item',
                  quantity: Number(item.quantity) || 1,
                  unit: item.unit || 'pcs',
                  unitPrice: Number(item.unitPrice) || 0,
                  total: Number(item.total) || 0,
                }))
              : [],
          },
        },
        include: { items: true },
      });

      // 3. Atomically Update Inventory
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId && item.productId !== 'custom' && item.productId !== 'custom-item') {
            const product = await tx.product.findFirst({ where: { id: item.productId, shopId } });
            if (product) {
              const newStock = Math.max(0, product.currentStock - Number(item.quantity || 1));
              await tx.product.update({
                where: { id: item.productId },
                data: { currentStock: newStock },
              });

              // Low stock alert check
              if (newStock <= product.minStock) {
                await tx.alert.create({
                  data: {
                    shopId,
                    type: 'LOW_STOCK',
                    priority: newStock <= 0 ? 'CRITICAL' : 'HIGH',
                    title: `Low Stock: ${product.name}`,
                    titleTa: `குறைந்த இருப்பு: ${product.nameTa || product.name}`,
                    message: `Stock fell to ${newStock} ${product.unit}. Minimum required is ${product.minStock}.`,
                    messageTa: `இருப்பு ${newStock} ${product.unit} ஆக குறைந்தது. குறைந்தபட்ச இருப்பு ${product.minStock}.`,
                    actionRoute: 'inventory',
                  },
                });
              }
            }
          }
        }
      }

      // 4. Update Customer Udhar if credit / balance due
      if (sale.balanceDue > 0) {
        let custId = customerId;
        if (!custId && customerName && customerName !== 'Walk-in Customer') {
          const existCust = await tx.customer.findFirst({
            where: { name: customerName, shopId },
          });
          if (existCust) {
            custId = existCust.id;
          } else {
            const newCust = await tx.customer.create({
              data: {
                shopId,
                name: customerName,
                phone: customerPhone || '9842100000',
                totalPurchases: sale.total,
                totalUdhar: sale.balanceDue,
                creditLimit: 5000,
              },
            });
            custId = newCust.id;
          }
        }

        if (custId) {
          await tx.customer.update({
            where: { id: custId },
            data: {
              totalPurchases: { increment: sale.total },
              totalUdhar: { increment: sale.balanceDue },
            },
          });
          await tx.creditRecord.create({
            data: {
              shopId,
              type: 'customer',
              partyId: custId,
              partyName: customerName || 'Customer',
              partyPhone: customerPhone || null,
              totalCredit: sale.balanceDue,
              outstandingAmount: sale.balanceDue,
            },
          });
        }
      }

      await tx.memory.create({
        data: {
          shopId,
          title: `Sale to ${sale.customerName}: ₹${sale.total}`,
          titleTa: `${sale.customerName} விற்பனை: ₹${sale.total}`,
          description: `Recorded sale of ₹${sale.total}. Items: ${(items || []).map((i: any) => i.productName).join(', ')}.`,
          category: 'sale',
          entityName: sale.customerName,
          importance: sale.total > 5000 ? 'high' : 'medium',
        },
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to record sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// DELETE Sale with tenant check
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = await resolveTenantShopId(req);

    const existing = await prisma.sale.findFirst({ where: { id, shopId } });
    if (!existing) {
      return res.status(404).json({ error: 'Sale not found or unauthorized' });
    }

    await prisma.$transaction([
      prisma.saleItem.deleteMany({ where: { saleId: id } }),
      prisma.sale.delete({ where: { id } }),
    ]);

    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Failed to delete sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

export default router;
