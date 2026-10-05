import argon2 from 'argon2';
import { PrismaClient, Role } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const requiredEnv = [
  'SEED_ADMIN_PHONE',
  'SEED_ADMIN_PASSWORD',
  'SEED_STORE_OWNER_PHONE',
  'SEED_STORE_OWNER_PASSWORD',
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`${key} is required to seed the database`);
}

async function main() {
  const adminPasswordHash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD!);
  const storeOwnerPasswordHash = await argon2.hash(process.env.SEED_STORE_OWNER_PASSWORD!);

  await prisma.user.upsert({
    where: { phone: process.env.SEED_ADMIN_PHONE! },
    update: { name: 'Pooja Store Admin', passwordHash: adminPasswordHash, role: Role.ADMIN, isActive: true },
    create: { name: 'Pooja Store Admin', phone: process.env.SEED_ADMIN_PHONE!, passwordHash: adminPasswordHash, role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { phone: process.env.SEED_STORE_OWNER_PHONE! },
    update: { name: 'Test Store Owner', passwordHash: storeOwnerPasswordHash, role: Role.STORE_OWNER, isActive: true, storeName: 'Test Pooja Stores', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    create: { name: 'Test Store Owner', phone: process.env.SEED_STORE_OWNER_PHONE!, passwordHash: storeOwnerPasswordHash, role: Role.STORE_OWNER, storeName: 'Test Pooja Stores', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  });

  const productData = [
    { category: 'Kumkum', name: 'Kumkum', description: 'Premium Kumkum', price: 80, stockQuantity: 100, minimumOrderQuantity: 10, unit: 'packet' },
    { category: 'Camphor', name: 'Camphor', description: 'Pure camphor tablets', price: 150, stockQuantity: 50, minimumOrderQuantity: 5, unit: 'box' },
    { category: 'Agarbatti', name: 'Agarbatti', description: 'Sandalwood fragrance', price: 120, stockQuantity: 200, minimumOrderQuantity: 10, unit: 'box' },
    { category: 'Oil', name: 'Pooja Oil', description: 'Clean burning oil', price: 180, stockQuantity: 50, minimumOrderQuantity: 5, unit: 'bottle' },
    { category: 'Wicks', name: 'Cotton Wicks', description: 'Hand-rolled cotton wicks', price: 60, stockQuantity: 500, minimumOrderQuantity: 20, unit: 'packet' },
    { category: 'Pooja Items', name: 'Sandalwood Powder', description: 'Finely milled powder', price: 200, stockQuantity: 30, minimumOrderQuantity: 5, unit: 'packet' },
  ];

  for (const item of productData) {
    const { category: categoryName, ...product } = item;
    const category = await prisma.category.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } });
    await prisma.product.upsert({
      where: { id: `seed-${item.name.toLowerCase().replaceAll(' ', '-')}` },
      update: { ...product, categoryId: category.id, isActive: true },
      create: { id: `seed-${item.name.toLowerCase().replaceAll(' ', '-')}`, ...product, categoryId: category.id },
    });
  }

  console.log('Seeded admin, store-owner, categories, and wholesale products.');
}

main().finally(() => prisma.$disconnect());
