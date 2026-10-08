import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST create expense
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

    const expense = await prisma.expense.create({
      data: {
        shopId: data.shopId || shop.id,
        title: data.title || data.description || 'General Expense',
        titleTa: data.titleTa || null,
        category: data.category || 'miscellaneous',
        amount: Number(data.amount) || 0,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes || data.paymentMode || null,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title: data.title || data.description !== undefined ? data.title || data.description : undefined,
        category: data.category !== undefined ? data.category : undefined,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
