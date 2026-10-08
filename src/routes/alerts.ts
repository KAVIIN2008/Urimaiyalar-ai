import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST a new alert
router.post('/', async (req, res) => {
  try {
    const { type, priority, title, titleTa, message, messageTa, actionLabel, actionRoute } = req.body;
    let shop = await prisma.shop.findFirst();
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: 'Default Shop',
          ownerName: 'Owner',
          phone: '9876543210',
          address: 'Main Street',
        },
      });
    }

    const alert = await prisma.alert.create({
      data: {
        shopId: shop.id,
        type: type || 'SYSTEM',
        priority: priority || 'MEDIUM',
        title: title || 'New Notification',
        titleTa: titleTa || title || 'புதிய அறிவிப்பு',
        message: message || '',
        messageTa: messageTa || message || '',
        read: false,
        actionLabel: actionLabel || null,
        actionRoute: actionRoute || null,
        date: new Date(),
      },
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PUT mark alert as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: { read: true },
    });
    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// DELETE dismiss alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.alert.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
