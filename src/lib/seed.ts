import { prisma } from './db';
import { initialProducts, initialCustomers, initialExpenses } from '../data/demoData';

export async function seedDatabase() {
  try {
    if (!prisma.shop) return;
    const shopCount = await prisma.shop.count();
    if (shopCount === 0) {
      console.log('🌱 Seeding database with initial Tamil Nadu store data...');

      // 1. Create Default Shop
      const defaultShop = await prisma.shop.create({
        data: {
          id: 'shop-1',
          name: 'Thirumalai Stores',
          ownerName: 'Thirumalai Krishnan',
          phone: '9842100000',
          address: '142, East Veli Street, Madurai, Tamil Nadu',
          gstin: '33ABCDE1234F1Z5',
        },
      });

      // 2. Seed Initial Products
      for (const prod of initialProducts) {
        await prisma.product.create({
          data: {
            id: prod.id,
            shopId: defaultShop.id,
            name: prod.name,
            nameTa: prod.nameTa,
            category: prod.category,
            costPrice: prod.purchasePrice || 0,
            sellingPrice: prod.sellingPrice || 0,
            currentStock: prod.currentStock || 0,
            minStock: prod.minStock || 0,
            unit: prod.unit || 'piece',
          },
        });
      }

      // 3. Seed Initial Customers
      for (const cust of initialCustomers) {
        await prisma.customer.create({
          data: {
            id: cust.id,
            shopId: defaultShop.id,
            name: cust.name,
            phone: cust.phone,
            address: cust.address,
            creditLimit: cust.creditLimit || 5000,
            totalPurchases: cust.totalPurchases || 0,
            totalUdhar: cust.outstandingBalance || 0,
          },
        });
      }

      // 4. Seed Initial Expenses
      for (const exp of initialExpenses) {
        await prisma.expense.create({
          data: {
            id: exp.id,
            shopId: defaultShop.id,
            title: exp.title,
            amount: exp.amount,
            category: exp.category,
            date: new Date(exp.date),
            notes: exp.notes || '',
          },
        });
      }

      console.log('✅ Database successfully seeded!');
    }
  } catch (err) {
    console.warn('Database seed notice:', err);
  }
}
