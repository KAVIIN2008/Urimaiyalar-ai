import { Router } from 'express';
import { prisma } from '../lib/db';
import { calculateFinancialSummary, computeBusinessHealthScore } from '../utils/financeEngine';

const router = Router();

router.get('/summary', async (req, res) => {
  try {
    const [products, sales, purchases, expenses, customers, suppliers] = await Promise.all([
      prisma.product.findMany(),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.purchase.findMany({ include: { items: true } }),
      prisma.expense.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
    ]);

    // Map Prisma models to the format expected by our financeEngine
    const mappedSales = sales.map(s => ({
      ...s,
      items: s.items.map(i => ({ ...i, unitPrice: i.unitCost || i.unitPrice }))
    }));

    const summary = calculateFinancialSummary(
      products as any,
      mappedSales as any,
      purchases as any,
      expenses as any,
      customers as any,
      suppliers as any
    );

    const health = computeBusinessHealthScore(summary, products as any, customers as any);

    res.json({ summary, health });
  } catch (error) {
    console.error('Failed to calculate financial summary:', error);
    res.status(500).json({ error: 'Failed to calculate financial summary' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const shop = await prisma.shop.findFirst();
    if (!shop) {
      return res.json({
        businessName: 'My Shop',
        businessNameTa: 'என் கடை',
        ownerName: 'Owner',
        phone: '0000000000',
        district: 'Tamil Nadu',
        address: '',
      });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/load-sample', async (req, res) => {
  try {
    let shop = await prisma.shop.findFirst();
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: 'Thirumalai Stores',
          ownerName: 'K. Thirunavukkarasu',
          phone: '9842155678',
          address: '142, East Veli Street, Madurai - 625001',
          shopType: 'RETAIL'
        }
      });
    }

    // --- FULL CLEANUP: delete ALL demo records safely (child items first) ---
    try {
      const allSales = await prisma.sale.findMany({ where: { notes: 'DEMO' }, select: { id: true } });
      if (allSales.length > 0) {
        await prisma.saleItem.deleteMany({ where: { saleId: { in: allSales.map((s: any) => s.id) } } });
        await prisma.sale.deleteMany({ where: { id: { in: allSales.map((s: any) => s.id) } } });
      }

      const allPurchases = await prisma.purchase.findMany({ where: { notes: 'DEMO' }, select: { id: true } });
      if (allPurchases.length > 0) {
        await prisma.purchaseItem.deleteMany({ where: { purchaseId: { in: allPurchases.map((p: any) => p.id) } } });
        await prisma.purchase.deleteMany({ where: { id: { in: allPurchases.map((p: any) => p.id) } } });
      }

      await prisma.expense.deleteMany({ where: { notes: 'DEMO' } });
      await prisma.customer.deleteMany({ where: { address: 'DEMO' } });
      await prisma.supplier.deleteMany({ where: { address: 'DEMO' } });
      await prisma.product.deleteMany({ where: { code: 'DEMO' } });
    } catch (cleanupErr) {
      console.warn('[API] Warning during demo cleanup:', cleanupErr);
    }

    // Use timestamp suffix to guarantee unique invoice/purchase numbers on repeat calls
    const ts = Date.now();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 10, 0, 0);

    // Seed Products (purchasePrice mirrors costPrice for financeEngine COGS)
    const pRice = await prisma.product.create({ data: { shopId: shop.id, name: 'Premium Ponni Rice (25kg)', nameTa: 'பொன்னி புழுங்கல் அரிசி (25kg பை)', category: 'Rice & Grains', code: 'DEMO', currentStock: 18, unit: 'bag', sellingPrice: 1550, costPrice: 1350, minStock: 8 } });
    const pIdliRice = await prisma.product.create({ data: { shopId: shop.id, name: 'Idli Rice (25kg Bag)', nameTa: 'இட்லி அரிசி (25kg பை)', category: 'Rice & Grains', code: 'DEMO', currentStock: 4, unit: 'bag', sellingPrice: 1250, costPrice: 1050, minStock: 10 } });
    const pOil = await prisma.product.create({ data: { shopId: shop.id, name: 'Gold Winner Sunflower Oil (1L)', nameTa: 'சூரியகாந்தி எண்ணெய் (1 லிட்டர்)', category: 'Cooking Oils', code: 'DEMO', currentStock: 3, unit: 'packet', sellingPrice: 145, costPrice: 128, minStock: 15 } });
    const pSugar = await prisma.product.create({ data: { shopId: shop.id, name: 'Refined White Sugar', nameTa: 'வெள்ளை சர்க்கரை', category: 'grocery', code: 'DEMO', currentStock: 100, unit: 'kg', sellingPrice: 44, costPrice: 38, minStock: 20 } });
    const pWheat = await prisma.product.create({ data: { shopId: shop.id, name: 'Aashirvaad Atta (10kg)', nameTa: 'ஆசீர்வாத் கோதுமை மாவு (10kg)', category: 'grocery', code: 'DEMO', currentStock: 25, unit: 'bag', sellingPrice: 485, costPrice: 420, minStock: 10 } });
    const pDal = await prisma.product.create({ data: { shopId: shop.id, name: 'First Quality Toor Dal', nameTa: 'முதல் ரக துவரம் பருப்பு', category: 'pulses', code: 'DEMO', currentStock: 40, unit: 'kg', sellingPrice: 165, costPrice: 135, minStock: 10 } });

    // Seed Customers
    const cRamesh = await prisma.customer.create({ data: { shopId: shop.id, name: 'M. Ramesh', phone: '9842100001', address: 'DEMO', creditLimit: 5000, totalPurchases: 28500, totalUdhar: 800, createdAt: startOfMonth } });
    const cPriya = await prisma.customer.create({ data: { shopId: shop.id, name: 'Priya Selvaraj', phone: '9842154321', address: 'DEMO', creditLimit: 4000, totalPurchases: 19400, totalUdhar: 0, createdAt: lastWeek } });
    const cKumar = await prisma.customer.create({ data: { shopId: shop.id, name: 'M. Kumar', phone: '9842100003', address: 'DEMO', creditLimit: 10000, totalPurchases: 45000, totalUdhar: 1500, createdAt: startOfMonth } });
    const cAnitha = await prisma.customer.create({ data: { shopId: shop.id, name: 'R. Anitha', phone: '9842100004', address: 'DEMO', creditLimit: 3000, totalPurchases: 12000, totalUdhar: 0, createdAt: yesterday } });
    const cMurugan = await prisma.customer.create({ data: { shopId: shop.id, name: 'Murugan Tiffin Center', phone: '9843344556', address: 'DEMO', creditLimit: 30000, totalPurchases: 64200, totalUdhar: 0, createdAt: startOfMonth } });

    // Seed Suppliers
    const sCauvery = await prisma.supplier.create({ data: { shopId: shop.id, name: 'Cauvery Oil Traders', phone: '9443399887', address: 'DEMO', totalPurchases: 78000, totalPaid: 70000, outstandingBalance: 8000 } });
    const sMeenakshi = await prisma.supplier.create({ data: { shopId: shop.id, name: 'Sri Meenakshi Rice Mill', phone: '9842211223', address: 'DEMO', totalPurchases: 145000, totalPaid: 130000, outstandingBalance: 15000 } });

    // Seed Purchases (unique purchaseNo via timestamp)
    await prisma.purchase.create({
      data: {
        shopId: shop.id, purchaseNo: `PUR-${ts}-01`, supplierName: sMeenakshi.name, supplierId: sMeenakshi.id,
        total: 42750, amountPaid: 30000, balanceDue: 12750, paymentStatus: 'partial', date: startOfMonth, notes: 'DEMO',
        items: {
          create: [
            { productId: pRice.id, productName: pRice.name, quantity: 20, unitCost: 1350, total: 27000, unit: 'bag' },
            { productId: pIdliRice.id, productName: pIdliRice.name, quantity: 15, unitCost: 1050, total: 15750, unit: 'bag' }
          ]
        }
      }
    });

    await prisma.purchase.create({
      data: {
        shopId: shop.id, purchaseNo: `PUR-${ts}-02`, supplierName: sCauvery.name, supplierId: sCauvery.id,
        total: 3840, amountPaid: 3840, balanceDue: 0, paymentStatus: 'paid', date: lastWeek, notes: 'DEMO',
        items: {
          create: [
            { productId: pOil.id, productName: pOil.name, quantity: 30, unitCost: 128, total: 3840, unit: 'packet' }
          ]
        }
      }
    });

    // Seed Sales (unique invoiceNo via timestamp)
    await prisma.sale.create({
      data: {
        shopId: shop.id, invoiceNo: `INV-${ts}-01`, customerName: cRamesh.name, customerId: cRamesh.id, customerPhone: cRamesh.phone,
        subtotal: 1840, discount: 40, tax: 0, total: 1800, paymentType: 'credit', amountPaid: 1000, balanceDue: 800, date: today, notes: 'DEMO',
        items: {
          create: [
            { productId: pRice.id, productName: pRice.name, quantity: 1, unitPrice: 1550, total: 1550, unit: 'bag' },
            { productId: pOil.id, productName: pOil.name, quantity: 2, unitPrice: 145, total: 290, unit: 'packet' }
          ]
        }
      }
    });

    await prisma.sale.create({
      data: {
        shopId: shop.id, invoiceNo: `INV-${ts}-02`, customerName: cMurugan.name, customerId: cMurugan.id, customerPhone: cMurugan.phone,
        subtotal: 3325, discount: 25, tax: 0, total: 3300, paymentType: 'upi', amountPaid: 3300, balanceDue: 0, date: today, notes: 'DEMO',
        items: {
          create: [
            { productId: pIdliRice.id, productName: pIdliRice.name, quantity: 2, unitPrice: 1250, total: 2500, unit: 'bag' },
            { productId: pDal.id, productName: pDal.name, quantity: 5, unitPrice: 165, total: 825, unit: 'kg' }
          ]
        }
      }
    });

    await prisma.sale.create({
      data: {
        shopId: shop.id, invoiceNo: `INV-${ts}-03`, customerName: cPriya.name, customerId: cPriya.id, customerPhone: cPriya.phone,
        subtotal: 617, discount: 17, tax: 0, total: 600, paymentType: 'cash', amountPaid: 600, balanceDue: 0, date: today, notes: 'DEMO',
        items: {
          create: [
            { productId: pSugar.id, productName: pSugar.name, quantity: 3, unitPrice: 44, total: 132, unit: 'kg' },
            { productId: pWheat.id, productName: pWheat.name, quantity: 1, unitPrice: 485, total: 485, unit: 'bag' }
          ]
        }
      }
    });

    await prisma.sale.create({
      data: {
        shopId: shop.id, invoiceNo: `INV-${ts}-04`, customerName: cKumar.name, customerId: cKumar.id, customerPhone: cKumar.phone,
        subtotal: 3760, discount: 60, tax: 0, total: 3700, paymentType: 'credit', amountPaid: 2200, balanceDue: 1500, date: yesterday, notes: 'DEMO',
        items: {
          create: [
            { productId: pRice.id, productName: pRice.name, quantity: 2, unitPrice: 1550, total: 3100, unit: 'bag' },
            { productId: pDal.id, productName: pDal.name, quantity: 4, unitPrice: 165, total: 660, unit: 'kg' }
          ]
        }
      }
    });

    await prisma.sale.create({
      data: {
        shopId: shop.id, invoiceNo: `INV-${ts}-05`, customerName: cAnitha.name, customerId: cAnitha.id, customerPhone: cAnitha.phone,
        subtotal: 650, discount: 0, tax: 0, total: 650, paymentType: 'upi', amountPaid: 650, balanceDue: 0, date: lastWeek, notes: 'DEMO',
        items: {
          create: [
            { productId: pWheat.id, productName: pWheat.name, quantity: 1, unitPrice: 485, total: 485, unit: 'bag' },
            { productId: pDal.id, productName: pDal.name, quantity: 1, unitPrice: 165, total: 165, unit: 'kg' }
          ]
        }
      }
    });

    // Seed Expenses
    await prisma.expense.create({ data: { shopId: shop.id, title: 'Shop Rent (கடை வாடகை)', category: 'Rent', amount: 6000, date: startOfMonth, notes: 'DEMO' } });
    await prisma.expense.create({ data: { shopId: shop.id, title: 'Electricity Bill (மின் கட்டணம்)', category: 'Utilities', amount: 1450, date: lastWeek, notes: 'DEMO' } });
    await prisma.expense.create({ data: { shopId: shop.id, title: 'Goods Transport (சரக்கு ஆட்டோ வாடகை)', category: 'Transport', amount: 350, date: yesterday, notes: 'DEMO' } });
    await prisma.expense.create({ data: { shopId: shop.id, title: 'Tea & Refreshments (தேநீர்)', category: 'Miscellaneous', amount: 80, date: today, notes: 'DEMO' } });

    res.json({ success: true, message: 'Demo data loaded successfully' });
  } catch (error) {
    console.error('[API] Failed to load sample data:', error);
    res.status(500).json({ error: 'Failed to load sample data', detail: String(error) });
  }
});

router.post('/clear', async (req, res) => {
  try {
    // Delete all records in correct order to avoid foreign key constraint errors
    await prisma.saleItem.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.product.deleteMany();
    await prisma.memory.deleteMany();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    await prisma.saleItem.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.product.deleteMany();
    await prisma.memory.deleteMany();
    await prisma.shop.deleteMany();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset business' });
  }
});

export default router;
