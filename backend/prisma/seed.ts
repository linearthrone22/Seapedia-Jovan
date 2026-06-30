import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Admin
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@seapedia.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@seapedia.com',
      password: adminPassword,
      roles: { create: [{ role: RoleType.ADMIN }] },
    },
  });

  // 2. Seed Seller 1
  const sellerPassword = await bcrypt.hash('Seller123!', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller1@seapedia.com' },
    update: {},
    create: {
      username: 'seller1',
      email: 'seller1@seapedia.com',
      password: sellerPassword,
      roles: { create: [{ role: RoleType.SELLER }] },
    },
  });

  // 3. Seed Seller 1's Store
  const store = await prisma.store.upsert({
    where: { sellerId: seller.id },
    update: {},
    create: {
      name: 'Toko Elektronik Jaya',
      description: 'Penyedia barang elektronik kelautan dan aksesoris navigasi berkualitas.',
      sellerId: seller.id,
    },
  });

  // 4. Seed Products for Store
  const productsData = [
    {
      name: 'Eco Marine Outboard Motor 15HP',
      description: 'Ultra-quiet, fuel-efficient 4-stroke outboard motor designed for coastal waters and fishing boats.',
      price: 18500000,
      stock: 5,
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Deepsea Sonar Fishfinder',
      description: 'High-definition dual-frequency fishfinder with built-in GPS and maps for deep water navigation.',
      price: 4200000,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1544724480-22c66839c994?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marine Waterproof VHF Radio',
      description: 'Floating 6W handheld marine VHF radio with active noise cancellation and weather alerts.',
      price: 1950000,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1615461066841-60a63788b201?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Waterproof Action Camera 4K',
      description: 'Rugged action camera waterproof up to 30m, dual screens, and ultra-stabilization features.',
      price: 2450000,
      stock: 7,
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marine Navigation Panel Monitor',
      description: 'High-visibility anti-glare touch monitor with customized NMEA2000 marine integrations.',
      price: 9800000,
      stock: 4,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        stock: prod.stock,
        imageUrl: prod.imageUrl,
        storeId: store.id,
      },
    });
  }

  console.log('Seed complete: admin@seapedia.com / Admin123!, seller1@seapedia.com / Seller123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
