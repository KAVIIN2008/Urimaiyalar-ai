import { Router } from 'express';
import { prisma } from '../lib/db';
import { resolveTenantShopId } from '../server/tenantHelper';

const router = Router();

// GET all customers with tenant isolation & pagination
router.get('/', async (req, res) => {
  try {
    const shopId = await resolveTenantShopId(req);
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const where: any = { shopId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Normalize fields to match frontend Customer type
    const normalized = customers.map((c) => ({
      ...c,
      totalCredit: c.creditLimit,
      totalPaid: (c as any).totalPaid ?? 0,
      outstandingBalance: c.totalUdhar,
      purchaseCount: 0,
      lastTransactionDate: c.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      nameTa: c.name,
      notes: '',
    }));

    res.json(normalized);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer by ID with tenant isolation (IDOR protection)
router.get('/:id', async (req, res) => {
  try {
    const shopId = await resolveTenantShopId(req);
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, shopId },
      include: { sales: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found or unauthorized' });
    }

    res.json({
      ...customer,
      totalCredit: customer.creditLimit,
      totalPaid: 0,
      outstandingBalance: customer.totalUdhar,
      purchaseCount: customer.sales?.length || 0,
      nameTa: customer.name,
    });
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create customer — explicitly map fields to avoid Prisma unknown field errors
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const shopId = await resolveTenantShopId(req);

    const customer = await prisma.customer.create({
      data: {
        shopId,
        name: body.name || 'New Customer',
        phone: body.phone || '9842100000',
        address: body.address || null,
        creditLimit: Number(body.creditLimit || body.totalCredit) || 5000,
        totalPurchases: Number(body.totalPurchases) || 0,
        totalUdhar: Number(body.totalUdhar || body.outstandingBalance) || 0,
      },
    });

    // Normalize response
    const normalized = {
      ...customer,
      totalCredit: customer.creditLimit,
      totalPaid: 0,
      outstandingBalance: customer.totalUdhar,
      purchaseCount: 0,
      lastTransactionDate: customer.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      nameTa: customer.name,
      notes: '',
    };

    res.status(201).json(normalized);
  } catch (error) {
    console.error('Failed to create customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT update customer with tenant isolation
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const shopId = await resolveTenantShopId(req);

    // Verify ownership
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, shopId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found or unauthorized' });
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        address: body.address !== undefined ? body.address : undefined,
        creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : undefined,
        totalUdhar: body.outstandingBalance !== undefined ? Number(body.outstandingBalance) : undefined,
      },
    });

    const normalized = {
      ...customer,
      totalCredit: customer.creditLimit,
      totalPaid: 0,
      outstandingBalance: customer.totalUdhar,
      purchaseCount: 0,
      lastTransactionDate: customer.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      nameTa: customer.name,
      notes: '',
    };
    res.json(normalized);
  } catch (error) {
    console.error('Failed to update customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer with tenant isolation
router.delete('/:id', async (req, res) => {
  try {
    const shopId = await resolveTenantShopId(req);
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, shopId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found or unauthorized' });
    }

    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// POST record customer payment (atomic transaction)
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const payAmt = Number(amount) || 0;
    const customerId = req.params.id;
    const shopId = await resolveTenantShopId(req);

    if (payAmt <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.findFirst({ where: { id: customerId, shopId } });
      if (!cust) throw new Error('Customer not found or unauthorized');

      const newUdhar = Math.max(0, cust.totalUdhar - payAmt);
      const updatedCust = await tx.customer.update({
        where: { id: customerId },
        data: {
          totalUdhar: newUdhar,
        },
      });

      // Update credit ledger records
      const creditRecs = await tx.creditRecord.findMany({
        where: { partyId: customerId, type: 'customer', status: 'active', shopId },
      });

      if (creditRecs.length > 0) {
        let remainingPayment = payAmt;
        for (const rec of creditRecs) {
          if (remainingPayment <= 0) break;
          const applyAmt = Math.min(rec.outstandingAmount, remainingPayment);
          await tx.creditRecord.update({
            where: { id: rec.id },
            data: {
              amountPaid: { increment: applyAmt },
              outstandingAmount: { decrement: applyAmt },
              status: rec.outstandingAmount - applyAmt <= 0 ? 'cleared' : 'active',
            },
          });
          remainingPayment -= applyAmt;
        }
      }

      await tx.memory.create({
        data: {
          shopId,
          title: `Payment received: ₹${payAmt} from ${cust.name}`,
          titleTa: `வாடிக்கையாளர் வரவு: ₹${payAmt} (${cust.name})`,
          description: `Customer paid ₹${payAmt}. Remaining balance: ₹${newUdhar}. Notes: ${notes || 'Direct payment'}`,
          category: 'payment',
          entityName: cust.name,
          importance: 'medium',
        },
      });

      return updatedCust;
    });

    res.json({
      success: true,
      outstandingBalance: result.totalUdhar,
      customer: result,
    });
  } catch (error: any) {
    console.error('Failed to record customer payment:', error);
    res.status(500).json({ error: error.message || 'Failed to record customer payment' });
  }
});

export default router;
