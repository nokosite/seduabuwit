# Troubleshooting Email Notification

## Issue: Email Tidak Terkirim Setelah Generate Tagihan / Kirim Reminder

### Checklist Debugging

#### 1. Check Environment
```javascript
// Di browser console setelah generate tagihan atau kirim reminder
// Development (localhost) - CALLS PRODUCTION API:
"Sending email notifications for Januari 2026..."
"Using API URL: https://seduabuwit.vercel.app/api/email/send-bulk-notification"
"✓ Email notifications: 45 sent, 0 failed"

// Production (Vercel) - CALLS LOCAL API:
"Sending email notifications for Januari 2026..."
"Using API URL: /api/email/send-bulk-notification"
"✓ Email notifications: 45 sent, 0 failed"
```

**How It Works:**
- ✅ **Development (localhost)**: Calls production API (`https://seduabuwit.vercel.app/api/email/*`)
- ✅ **Production (Vercel)**: Calls local serverless function (`/api/email/*`)
- ✅ **Email terkirim di BOTH environments** (development & production)

**Why This Approach?**
- Vite dev server tidak serve API routes (serverless functions)
- Development mode tetap bisa test email functionality
- Production API sudah deployed dan siap digunakan
- No CORS issues karena Vercel serverless functions allow all origins

---

#### 2. Check Vercel Logs (Production Only)

**Steps:**
1. Buka Vercel Dashboard: https://vercel.com
2. Pilih project: `spp-sdn2buwit`
3. Klik tab **Functions**
4. Cari function: `api/email/send-bulk-notification`
5. Lihat logs untuk error messages

**Expected Logs:**
```
[Email Notification] Processing for Januari 2026
[Email Notification] Found 45 pending payments
[Email Notification] Unique students: 45
[Email Notification] Fetched 45 student records
[Email Notification] Sending to parent1@gmail.com for Budi Santoso
[Email Notification] ✓ Sent to parent1@gmail.com
...
[Email Notification] Summary: 45 sent, 0 failed
```

**Common Errors:**
```
[Email Notification] No pending payments found for Januari 2026
→ Tagihan belum dibuat atau sudah dibayar semua

[Email Notification] No parent email for: Budi Santoso
→ Student tidak punya parentEmail field

[Email Notification] ✗ Failed for parent@gmail.com: validation_error
→ Email address invalid atau Resend API error
```

---

#### 3. Check Student Data (Parent Email)

**Query Firestore:**
```javascript
// Di Firebase Console
// Collection: students
// Filter: status == 'active'
// Check field: parentEmail
```

**Common Issues:**
- ❌ Field `parentEmail` kosong/null
- ❌ Field `parentEmail` tidak ada
- ❌ Email format salah (typo, spasi, dll)

**Fix:**
1. Buka Admin → Data Master → Siswa
2. Edit siswa yang tidak punya email
3. Tambahkan email orang tua yang valid
4. Save

---

#### 4. Check Resend API Status

**Verify Resend Configuration:**
1. Login ke https://resend.com
2. Check API Key masih valid
3. Check quota: Free tier = 100 emails/day
4. Check domain verification (jika pakai custom domain)

**Environment Variables (Vercel):**
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Test Resend API:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "SDN 2 Buwit <onboarding@resend.dev>",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

---

#### 5. Check Firestore Query

**Verify Payments Created:**
```javascript
// Di Firebase Console
// Collection: payments
// Filter: month == 'Januari 2026' AND status == 'pending'
// Should return records
```

**If Empty:**
- Generate tagihan belum berhasil
- Month format salah (harus "Januari 2026", bukan "01/2026")
- Status bukan "pending" (mungkin "unpaid" atau lainnya)

---

### Common Scenarios

#### Scenario 1: "No pending payments found"

**Cause:** Query tidak menemukan payments dengan status pending

**Debug:**
```javascript
// Check di Firebase Console
payments.where('month', '==', 'Januari 2026')
       .where('status', '==', 'pending')
```

**Fix:**
- Pastikan tagihan sudah di-generate
- Pastikan status = 'pending' (bukan 'unpaid')
- Pastikan format month = "Januari 2026" (bukan "01-2026")

---

#### Scenario 2: "No parent email"

**Cause:** Student record tidak punya field `parentEmail`

**Debug:**
```javascript
// Check di Firebase Console
students.doc(studentId).get()
// Check field: parentEmail
```

**Fix:**
1. Update student record dengan parent email
2. Re-generate tagihan (atau manual trigger email)

---

#### Scenario 3: Email sent tapi tidak masuk inbox

**Possible Causes:**
- Email masuk ke **Spam/Junk folder**
- Email address typo
- Email provider blocking (Gmail, Yahoo, etc)
- Resend domain not verified

**Fix:**
1. Check spam folder
2. Verify email address correct
3. Add `onboarding@resend.dev` to contacts
4. Use custom verified domain (production)

---

#### Scenario 4: Firestore "in" query limitation

**Cause:** Firestore `in` query max 10 items, tapi ada >10 siswa

**Already Fixed:** API now chunks studentIds into batches of 10

**Verify:**
```javascript
// Check logs
[Email Notification] Unique students: 45
[Email Notification] Fetched 45 student records
// Should match
```

---

### Manual Email Trigger (Workaround)

Jika auto-email gagal, bisa trigger manual via API:

**Using Postman/Thunder Client:**
```
POST https://seduabuwit.vercel.app/api/email/send-bulk-notification
Content-Type: application/json

{
  "month": "Januari",
  "year": 2026
}
```

**Expected Response:**
```json
{
  "success": true,
  "sent": 45,
  "failed": 0,
  "sentEmails": [...],
  "failedEmails": []
}
```

---

### Monitoring Email Delivery

**Check Resend Dashboard:**
1. Login to https://resend.com
2. Go to **Emails** tab
3. Filter by date/status
4. Check delivery status:
   - ✅ Delivered
   - ⏳ Queued
   - ❌ Failed
   - 🔄 Bounced

**Email Tags:**
- `type: payment-notification`
- `month: Januari 2026`
- `student_id: xxx`

---

### Prevention Checklist

Before generating tagihan or sending reminders:

- [ ] All active students have valid `parentEmail`
- [ ] Resend API key is valid
- [ ] Resend quota not exceeded (100/day for free)
- [ ] Environment variables set in Vercel
- [ ] Test with 1-2 students first
- [ ] Check Vercel function logs after generate

---

## Manual Email Reminder

### Feature: Kirim Reminder ke Tagihan Belum Lunas

**Location:** Admin → Dashboard → Monitoring Penagihan

**Flow:**
1. Pilih bulan & tahun
2. Klik tombol "Kirim Reminder" (orange button)
3. **Modal konfirmasi muncul** dengan jumlah email yang akan dikirim
4. Klik "Kirim Email" untuk konfirmasi
5. System kirim email ke semua orang tua dengan tagihan belum lunas

**Modal Design:**
- Header: Orange theme dengan icon envelope
- Title: "Kirim Email Reminder"
- Message: "Apakah Anda yakin ingin mengirim email reminder ke [N] orang tua dengan tagihan belum lunas?"
- Buttons: "Batal" (outline) | "Kirim Email" (orange solid)

**Development Mode:**
```javascript
// Console output di localhost (calls production API)
📧 Sending reminder email to: parent1@gmail.com via https://seduabuwit.vercel.app/api/email/send-reminder
📧 Sending reminder email to: parent2@gmail.com via https://seduabuwit.vercel.app/api/email/send-reminder
✅ Berhasil mengirim 2 email reminder!
```

**Production Mode:**
```javascript
// Console output di Vercel (calls local API)
📧 Sending reminder email to: parent1@gmail.com via /api/email/send-reminder
📧 Sending reminder email to: parent2@gmail.com via /api/email/send-reminder
✅ Berhasil mengirim 2 email reminder!
```

**Production Mode:**
```javascript
// Success
✅ Berhasil mengirim 2 email reminder!

// Partial failure
Email reminder terkirim: 2
Gagal: 1

Detail gagal:
- Budi Santoso: validation_error
```

**Common Issues:**
- ❌ Modal tidak muncul → Check browser console for errors
- ❌ CORS error → Check Vercel serverless function allows all origins
- ❌ Email tidak terkirim → Check Vercel logs & Resend dashboard
- ❌ "Failed to fetch" → Check production API is deployed and accessible

---

### Contact Support

If issue persists:
1. Screenshot Vercel function logs
2. Screenshot browser console logs
3. Export sample student data (without sensitive info)
4. Note: month/year that failed
5. Contact developer with above info

---

**Last Updated:** 2026-05-17  
**Version:** 1.1.0
