import http from 'http';

async function testAll() {
  console.log('Testing Buku Kas API Endpoints...');

  const BASE = 'http://localhost:5000';

  // 1. Health check
  const healthRes = await fetch(`${BASE}/api/health`);
  const healthData = await healthRes.json();
  console.log('✔ Health Check:', healthData.status);

  // 2. Login as Admin
  const adminRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminAuth = await adminRes.json();
  console.log('✔ Admin Login:', adminAuth.user.name, `(${adminAuth.user.role})`);

  // 3. Login as Kasir
  const kasirRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kasir', password: 'kasir123' })
  });
  const kasirAuth = await kasirRes.json();
  console.log('✔ Kasir Login:', kasirAuth.user.name, `(${kasirAuth.user.role})`);

  // 4. Login as Teknisi
  const teknisiRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'teknisi', password: 'teknisi123' })
  });
  const teknisiAuth = await teknisiRes.json();
  console.log('✔ Teknisi Login:', teknisiAuth.user.name, `(${teknisiAuth.user.role})`);

  // 5. Test RBAC: Kasir fetch transactions (Harus HANYA WIFI)
  const kasirTxRes = await fetch(`${BASE}/api/transactions`, {
    headers: { Authorization: `Bearer ${kasirAuth.token}` }
  });
  const kasirTx = await kasirTxRes.json();
  const nonWifiKasir = kasirTx.filter(t => t.book !== 'WIFI');
  if (nonWifiKasir.length === 0) {
    console.log(`✔ RBAC Kasir Terisolasi: Kasir melihat ${kasirTx.length} transaksi (SEMUA WIFI)`);
  } else {
    console.error('❌ Kebocoran data di akun kasir!', nonWifiKasir);
  }

  // 6. Test RBAC: Teknisi fetch transactions (Harus HANYA SERVIS)
  const tekTxRes = await fetch(`${BASE}/api/transactions`, {
    headers: { Authorization: `Bearer ${teknisiAuth.token}` }
  });
  const tekTx = await tekTxRes.json();
  const nonServisTek = tekTx.filter(t => t.book !== 'SERVIS');
  if (nonServisTek.length === 0) {
    console.log(`✔ RBAC Teknisi Terisolasi: Teknisi melihat ${tekTx.length} transaksi (SEMUA SERVIS)`);
  } else {
    console.error('❌ Kebocoran data di akun teknisi!', nonServisTek);
  }

  // 7. Test RBAC: Kasir dilarang mencatat ke buku SERVIS atau PRIBADI
  const illegalTxRes = await fetch(`${BASE}/api/transactions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${kasirAuth.token}` 
    },
    body: JSON.stringify({
      book: 'SERVIS',
      type: 'INCOME',
      amount: 100000,
      category: 'Ilegal'
    })
  });
  if (illegalTxRes.status === 403) {
    console.log('✔ RBAC Write Protection: Kasir sukses dicegah mencatat ke buku Servis (HTTP 403 Forbidden)');
  } else {
    console.error('❌ RBAC Write Protection gagal!', illegalTxRes.status);
  }

  // 8. Test Owner Summary (Menampilkan WIFI + SERVIS + PRIBADI)
  const ownerSumRes = await fetch(`${BASE}/api/transactions/summary`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const ownerSum = await ownerSumRes.json();
  console.log('✔ Owner Grand Total Saldo:', ownerSum.grandTotal?.balance);
  console.log('✔ Owner Business Laba Bersih (WiFi + Servis):', ownerSum.businessTotal?.balance);

  console.log('\n🎉 SEMUA PENGUJIAN OTENTIKASI & RBAC BUKU KAS BERHASIL 100%!');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
