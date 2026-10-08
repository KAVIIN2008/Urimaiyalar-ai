import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// Customer Login by Phone
router.post('/auth/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Search customer by matching phone
    let customer = await prisma.customer.findFirst({
      where: {
        phone: {
          contains: cleanPhone.slice(-10) // match last 10 digits
        }
      }
    });

    // If not found in database, check if it's one of the demo phones and auto-create
    if (!customer) {
      const isRamesh = cleanPhone.includes('9842100001') || cleanPhone.includes('9443210987');
      const isPriya = cleanPhone.includes('9842154321') || cleanPhone.includes('9789022334');
      const isKumar = cleanPhone.includes('9842100003');

      const name = isRamesh ? 'M. Ramesh' : isPriya ? 'Priya Selvaraj' : isKumar ? 'M. Kumar' : `Customer (${phone})`;
      const totalUdhar = isRamesh ? 800 : isKumar ? 1500 : 0;

      customer = await prisma.customer.create({
        data: {
          name,
          phone,
          address: 'Madurai, Tamil Nadu',
          creditLimit: 5000,
          totalPurchases: isRamesh ? 28500 : 15000,
          totalUdhar,
        }
      });
    }

    // Fetch customer's sales bills
    const bills = await prisma.sale.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { customerPhone: { contains: cleanPhone.slice(-10) } }
        ]
      },
      include: {
        items: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address || 'Madurai, Tamil Nadu',
        landmark: 'Near Bus Stop',
        creditLimit: customer.creditLimit,
        totalPurchases: customer.totalPurchases,
        totalUdhar: customer.totalUdhar,
        outstandingBalance: customer.totalUdhar,
      },
      bills: bills.map((b: any) => ({
        id: b.id,
        invoiceNo: b.invoiceNo,
        date: b.date,
        total: b.total,
        amountPaid: b.amountPaid,
        balanceDue: b.balanceDue,
        paymentType: b.paymentType,
        items: b.items || []
      }))
    });
  } catch (error) {
    console.error('[CUSTOMER AUTH API] Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate customer' });
  }
});

// Customer Registration
router.post('/auth/register', async (req, res) => {
  try {
    const { name, phone, address, landmark, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address: `${address || ''} ${landmark ? `(${landmark})` : ''}`.trim(),
        creditLimit: 3000,
        totalPurchases: 0,
        totalUdhar: 0,
      }
    });

    res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        landmark: landmark || '',
        creditLimit: customer.creditLimit,
        totalPurchases: 0,
        totalUdhar: 0,
        outstandingBalance: 0,
      },
      bills: []
    });
  } catch (error) {
    console.error('[CUSTOMER AUTH API] Register error:', error);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// Customer New Order (handles both /order and /orders)
router.post(['/order', '/orders'], async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, items, total, notes, paymentType } = req.body;

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

    const invoiceNo = `ORD-${Date.now().toString().slice(-6)}`;
    const sale = await prisma.sale.create({
      data: {
        shopId: shop.id,
        invoiceNo,
        customerName: customerName || 'Valued Customer',
        customerId,
        customerPhone,
        subtotal: total || 0,
        discount: 0,
        tax: 0,
        total: total || 0,
        paymentType: paymentType || 'credit',
        amountPaid: paymentType === 'cash' ? total : 0,
        balanceDue: paymentType === 'cash' ? 0 : total,
        notes: `Customer Portal Order: ${notes || ''}`.trim(),
        items: {
          create: (items || []).map((it: any) => ({
            productId: it.productId || 'custom',
            productName: it.productName || it.name,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'unit',
            unitPrice: Number(it.unitPrice) || Number(it.price) || 0,
            total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || Number(it.price) || 0)
          }))
        }
      }
    });

    // Notify retailer with real-time Alert
    await prisma.alert.create({
      data: {
        shopId: shop.id,
        type: 'CUSTOMER_ORDER',
        priority: 'CRITICAL',
        title: `Online Order: ${customerName || 'Customer'}`,
        titleTa: `புதிய ஆன்லைன் ஆர்டர்: ${customerName || 'வாடிக்கையாளர்'}`,
        message: `Order #${invoiceNo} received for ₹${total || 0} (${(items || []).length} items)`,
        messageTa: `ரசீது #${invoiceNo} - ₹${total || 0} (${(items || []).length} பொருட்கள்)`,
        read: false,
        actionLabel: 'View in Sales',
        actionRoute: 'sales',
        date: new Date()
      }
    });

    res.status(201).json({ success: true, orderId: sale.id, invoiceNo });
  } catch (error) {
    console.error('[CUSTOMER ORDER API] Order placement error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Customer Submit Query / Message to Retail Store
router.post('/query', async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, queryCategory } = req.body;
    const queryText = (req.body.queryText || req.body.query || req.body.message || '').trim();
    if (!queryText) {
      return res.status(400).json({ error: 'Query message text is required' });
    }

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

    const cleanName = customerName || 'Customer';
    const cleanPhone = customerPhone || 'Unspecified';

    // 1. Create a high-priority business Alert for the retailer
    const alert = await prisma.alert.create({
      data: {
        shopId: shop.id,
        type: 'CUSTOMER_QUERY',
        priority: 'CRITICAL',
        title: `Customer Query: ${cleanName}`,
        titleTa: `வாடிக்கையாளர் வினவல்: ${cleanName}`,
        message: `"${queryText}" — Contact: ${cleanPhone}`,
        messageTa: `"${queryText}" — தொடர்பு: ${cleanPhone}`,
        read: false,
        actionLabel: 'View in Khata',
        actionRoute: 'credit',
        date: new Date()
      }
    });

    // 2. Also register into Business Memory so AI Assistant knows about this customer request
    await prisma.memory.create({
      data: {
        shopId: shop.id,
        category: 'customer_query',
        title: `Customer Inquiry from ${cleanName}`,
        titleTa: `${cleanName}-இடமிருந்து வந்த வினவல்`,
        description: `Customer (${cleanPhone}) asked: "${queryText}". Category: ${queryCategory || 'General Inquiry'}.`,
        entityName: cleanName,
        importance: 'high',
        timestamp: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your query has reached the retail store owner!',
      alertId: alert.id
    });
  } catch (error) {
    console.error('[CUSTOMER QUERY API] Error:', error);
    res.status(500).json({ error: 'Failed to submit customer query' });
  }
});

export default router;
