import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { timestamp: 'desc' }
    });
    const formatted = memories.map(m => ({
      ...m,
      content: m.description,
      contentTa: m.titleTa || m.description,
      tags: [m.category],
      createdDate: m.timestamp.toISOString(),
      relatedEntityName: m.entityName
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
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

    const memory = await prisma.memory.create({
      data: {
        shopId: shop.id,
        category: data.category || 'observation',
        title: data.title || 'Note',
        titleTa: data.titleTa || data.contentTa || null,
        description: data.description || data.content || data.title || '',
        entityName: data.entityName || data.relatedEntityName || null,
        importance: data.importance || 'medium',
      }
    });

    res.status(201).json({
      ...memory,
      content: memory.description,
      contentTa: memory.titleTa || memory.description,
      tags: [memory.category],
      createdDate: memory.timestamp.toISOString(),
      relatedEntityName: memory.entityName
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.memory.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const updated = await prisma.memory.update({
      where: { id: req.params.id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : (data.content !== undefined ? data.content : undefined),
        category: data.category !== undefined ? data.category : undefined,
        importance: data.importance !== undefined ? data.importance : undefined,
      }
    });
    res.json({
      ...updated,
      content: updated.description,
      contentTa: updated.titleTa || updated.description,
      tags: [updated.category],
      createdDate: updated.timestamp.toISOString(),
      relatedEntityName: updated.entityName
    });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

export default router;

