# Email Reminder Implementation

## Overview

Implementasi fitur email reminder untuk tagihan Sumbangan Sukarela menggunakan Resend API. Fitur ini memungkinkan admin untuk mengirim email reminder ke orang tua siswa yang memiliki tagihan belum lunas, serta mengirim konfirmasi pembayaran otomatis setelah pembayaran berhasil.

## Features

### 1. **Email Reminder untuk Tagihan Belum Lunas**
- Admin dapat mengirim email reminder secara batch ke semua orang tua dengan tagihan belum lunas
- Email berisi detail tagihan (periode, jumlah, jatuh tempo)
- Link langsung ke halaman pembayaran
- Tracking status email (sent/not sent)

### 2. **Email Konfirmasi Pembayaran**
- Otomatis terkirim setelah pembayaran berhasil (via Duitku atau manual)
- Berisi detail pembayaran (periode, jumlah, metode, nomor referensi)
- Template HTML yang profesional dan responsive

### 3. **Email Tracking**
- Setiap email yang terkirim dicatat di Firestore
- Field `reminderEmailSent` dan `reminderEmailSentAt` untuk tracking reminder
- Field `confirmationEmailSent` dan `confirmationEmailSentAt` untuk tracking konfirmasi

## Files Created/Modified

### New Files:
1. **`src/services/emailService.js`** - Core email service dengan Resend SDK
2. **`src/services/emailTrackingService.js`** - Tracking email status di Firestore
3. **`api/email/send-confirmation.js`** - Vercel serverless function untuk konfirmasi email

### Modified Files:
1. **`src/components/Admin/MonitoringPenagihan.jsx`** - Tambah tombol "Kirim Reminder"
2. **`src/services/firestoreService.js`** - Integrasi email konfirmasi di manual payment
3. **`api/duitku/callback.js`** - Integrasi email konfirmasi di Duitku callback
4. **`.env.example`** - Tambah `RESEND_API_KEY`

## Setup Instructions

### 1. Install Dependencies
```bash
npm install resend
```

### 2. Setup Resend Account
1. Daftar di https://resend.com
2. Verify domain `sdn2buwit.sch.id` di Resend Dashboard
3. Generate API Key di https://resend.com/api-keys

### 3. Environment Variables
Tambahkan ke `.env`:
```env
RESEND_API_KEY=re_xxxxxxxxx
```

Untuk production (Vercel), tambahkan environment variable di Vercel Dashboard.

### 4. Update Firestore Rules (Optional)
Jika ingin tracking email status, pastikan Firestore rules mengizinkan update field email:
```javascript
match /payments/{paymentId} {
  allow update: if request.auth != null && 
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['reminderEmailSent', 'reminderEmailSentAt', 
                'confirmationEmailSent', 'confirmationEmailSentAt', 
                'updatedAt']);
}
```

## Usage

### Admin Dashboard - Send Reminder
1. Buka **Monitoring Penagihan**
2. Pilih bulan/tahun yang ingin dikirim reminder
3. Klik tombol **"Kirim Reminder"** (biru dengan icon envelope)
4. Konfirmasi jumlah email yang akan dikirim
5. Tunggu proses selesai (akan muncul alert dengan hasil)

### Automatic Confirmation Email
Email konfirmasi otomatis terkirim saat:
- Pembayaran via Duitku berhasil (callback dari Duitku)
- Admin konfirmasi pembayaran manual (cash/transfer)

## Email Templates

### Reminder Email
- **Subject**: `Reminder: Tagihan Sumbangan Sukarela [Bulan] [Tahun]`
- **From**: `SDN 2 Buwit <noreply@sdn2buwit.sch.id>`
- **Content**:
  - Header dengan logo sekolah
  - Detail tagihan (periode, jatuh tempo, jumlah)
  - Warning box untuk jatuh tempo
  - Button "Bayar Sekarang" ke dashboard parent
  - Footer dengan info sekolah

### Confirmation Email
- **Subject**: `Konfirmasi Pembayaran Sumbangan Sukarela [Bulan] [Tahun]`
- **From**: `SDN 2 Buwit <noreply@sdn2buwit.sch.id>`
- **Content**:
  - Success icon dan header
  - Detail pembayaran (periode, tanggal, metode, jumlah)
  - Nomor referensi (untuk bukti)
  - Footer dengan info sekolah

## API Endpoints

### `/api/email/send-confirmation`
**Method**: POST  
**Body**:
```json
{
  "paymentId": "payment_doc_id"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "email_id_from_resend"
  }
}
```

## Firestore Schema Updates

### `payments` Collection
Tambahan fields untuk tracking:
```javascript
{
  // ... existing fields
  reminderEmailSent: boolean,
  reminderEmailSentAt: timestamp,
  confirmationEmailSent: boolean,
  confirmationEmailSentAt: timestamp
}
```

## Resend Pricing

- **Free Tier**: 3,000 emails/bulan, 1 domain
- **Pro**: $20/bulan, 50,000 emails, unlimited domains

Untuk SDN 2 Buwit dengan ~100 siswa:
- Reminder bulanan: ~100 emails
- Konfirmasi pembayaran: ~100 emails/bulan
- **Total**: ~200 emails/bulan → **Free tier cukup**

## Testing

### Test Reminder Email
1. Pastikan ada tagihan belum lunas di Monitoring Penagihan
2. Pastikan student memiliki `parentEmail` di Firestore
3. Klik "Kirim Reminder"
4. Cek inbox email orang tua

### Test Confirmation Email
1. Lakukan pembayaran manual atau via Duitku
2. Cek inbox email orang tua
3. Verifikasi detail pembayaran di email

### Test Email Addresses (Resend Sandbox)
Untuk testing tanpa merusak reputation domain:
- `delivered@resend.dev` - Simulasi email terkirim
- `bounced@resend.dev` - Simulasi email bounce
- `complained@resend.dev` - Simulasi spam complaint

## Troubleshooting

### Email tidak terkirim
1. **Cek API Key**: Pastikan `RESEND_API_KEY` sudah di-set di environment variables
2. **Cek Domain**: Pastikan domain `sdn2buwit.sch.id` sudah verified di Resend
3. **Cek Parent Email**: Pastikan field `parentEmail` ada di document student
4. **Cek Console**: Lihat error di browser console atau Vercel logs

### Email masuk spam
1. Verify domain dengan SPF, DKIM, DMARC records
2. Gunakan subdomain untuk email (misal: `mail.sdn2buwit.sch.id`)
3. Warm up domain dengan mengirim email bertahap

### Rate Limiting
Resend free tier: 5 requests/second
- Implementasi sudah include delay 100ms antar email
- Untuk batch besar (>100 email), pertimbangkan upgrade ke Pro

## Future Improvements

1. **Scheduled Reminders**: Jadwalkan reminder otomatis 3 hari sebelum jatuh tempo
2. **Email Templates**: Buat template di Resend Dashboard untuk easier editing
3. **Email Analytics**: Track open rate, click rate dari Resend webhooks
4. **Unsubscribe**: Tambah link unsubscribe untuk compliance
5. **Email Queue**: Gunakan queue system untuk batch email besar

## Support

Untuk pertanyaan atau issue:
- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
- Project Issues: [GitHub Issues]
