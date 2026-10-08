import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo accounts...');

  // 1. Wholesale Owner
  const wholesaleShop = await prisma.shop.create({
    data: {
      name: 'Urimaiyalar Wholesale Hub',
      ownerName: 'Wholesale Demo User',
      phone: '9876543210',
      address: '100 Wholesale Market Road',
      shopType: 'WHOLESALE'
    }
  });

  await prisma.user.create({
    data: {
      email: 'demo.wholesale@urimaiyalar.ai',
      password: 'Demo@Wholesale2026', // In a real app, hash this!
      role: 'wholesale',
      name: 'Wholesale Demo User',
      shopId: wholesaleShop.id
    }
  });

  // 2. Retail Owner
  const retailShop = await prisma.shop.create({
    data: {
      name: 'Urimaiyalar Retail Store',
      ownerName: 'Retail Demo User',
      phone: '9876543211',
      address: '200 Retail Street',
      shopType: 'RETAIL'
    }
  });

  await prisma.user.create({
    data: {
      email: 'demo.retail@urimaiyalar.ai',
      password: 'Demo@Retail2026',
      role: 'retail',
      name: 'Retail Demo User',
      shopId: retailShop.id
    }
  });

  // 3. Customer
  await prisma.user.create({
    data: {
      email: 'demo.customer@urimaiyalar.ai',
      password: 'Demo@Customer2026',
      role: 'customer',
      name: 'Customer Demo User'
    }
  });

  console.log('Demo accounts created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
