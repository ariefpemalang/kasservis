import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

async function seed() {
  console.log('Seeding initial users and initial transactions...');

  const users = [
    {
      username: 'admin',
      password: 'admin123',
      name: 'Owner Superadmin',
      role: 'owner'
    },
    {
      username: 'kasir',
      password: 'kasir123',
      name: 'Kasir WiFi',
      role: 'kasir_wifi'
    },
    {
      username: 'teknisi',
      password: 'teknisi123',
      name: 'Teknisi Servis',
      role: 'teknisi'
    }
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const created = await prisma.user.create({
        data: {
          username: u.username,
          password: hashedPassword,
          name: u.name,
          role: u.role
        }
      });
      console.log(`Created user: ${u.username} (${u.role})`);
    } else {
      console.log(`User ${u.username} already exists.`);
    }
  }

  // Cek apakah sudah ada transaksi awal
  const txCount = await prisma.transaction.count();
  if (txCount === 0) {
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
    const kasirUser = await prisma.user.findUnique({ where: { username: 'kasir' } });
    const teknisiUser = await prisma.user.findUnique({ where: { username: 'teknisi' } });

    const samples = [
      // Buku WiFi
      {
        book: 'WIFI',
        type: 'INCOME',
        amount: 250000,
        category: 'Iuran Bulanan WiFi',
        notes: 'Pembayaran WiFi Paket 20 Mbps Bpk Agus Blok B',
        userId: kasirUser.id,
        date: new Date()
      },
      {
        book: 'WIFI',
        type: 'EXPENSE',
        amount: 120000,
        category: 'Alat & Kabel',
        notes: 'Beli 1 roll Drop Core FO 100m + 10 pcs Fast Connector',
        userId: kasirUser.id,
        date: new Date()
      },
      // Buku Servis
      {
        book: 'SERVIS',
        type: 'INCOME',
        amount: 350000,
        category: 'Ongkos Servis Laptop',
        notes: 'Servis Laptop Lenovo ganti keyboard & install ulang',
        userId: teknisiUser.id,
        date: new Date()
      },
      {
        book: 'SERVIS',
        type: 'EXPENSE',
        amount: 180000,
        category: 'Beli Sparepart',
        notes: 'Beli Keyboard Laptop Lenovo Ideapad di toko sparepart',
        userId: teknisiUser.id,
        date: new Date()
      },
      // Buku Pribadi (Hanya Owner)
      {
        book: 'PRIBADI',
        type: 'INCOME',
        amount: 1500000,
        category: 'Bagi Hasil Usaha',
        notes: 'Pengambilan profit usaha bulan ini ke tabungan pribadi',
        userId: adminUser.id,
        date: new Date()
      },
      {
        book: 'PRIBADI',
        type: 'EXPENSE',
        amount: 75000,
        category: 'Kebutuhan Pribadi',
        notes: 'Beli makan siang & kopi',
        userId: adminUser.id,
        date: new Date()
      }
    ];

    for (const s of samples) {
      await prisma.transaction.create({ data: s });
    }
    console.log(`Seeded ${samples.length} sample transactions.`);
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding:', err);
  process.exit(1);
});
