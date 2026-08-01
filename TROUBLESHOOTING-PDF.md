# Troubleshooting PDF Generation

## Common Issues & Solutions

### 1. PDF Download Tidak Berfungsi

**Symptoms:**
- Tombol "Unduh Format PDF" tidak menghasilkan file
- Error message "Gagal mengunduh laporan PDF"
- Browser console menunjukkan error

**Possible Causes:**
- Data payments kosong atau null
- Format data tidak sesuai (missing fields)
- Browser blocking download
- jsPDF library error

**Solutions:**
1. **Check Data:**
   ```javascript
   // Pastikan filteredPayments tidak kosong
   console.log('Filtered Payments:', filteredPayments);
   ```

2. **Check Browser Console:**
   - Buka Developer Tools (F12)
   - Lihat tab Console untuk error message
   - Error "PDF Generation Error:" akan muncul jika ada masalah

3. **Check Browser Settings:**
   - Pastikan browser tidak memblokir download
   - Check popup blocker settings
   - Try different browser (Chrome, Firefox, Safari)

4. **Verify Data Format:**
   ```javascript
   // Data payment harus punya fields:
   {
     nisn: string,
     studentName: string,
     studentClass: string,
     month: string,
     status: 'paid' | 'pending',
     paidAt: Timestamp,
     paymentMethod: string,
     totalAmount: number
   }
   ```

### 2. PDF Kosong atau Corrupt

**Symptoms:**
- PDF berhasil didownload tapi tidak bisa dibuka
- PDF terbuka tapi kosong
- PDF terbuka tapi data tidak lengkap

**Solutions:**
1. **Check Data Size:**
   - Jika data terlalu banyak (>1000 records), PDF bisa corrupt
   - Gunakan filter untuk reduce data size
   - Split menjadi multiple PDF

2. **Check Special Characters:**
   - Nama siswa dengan karakter khusus bisa cause issue
   - jsPDF default font tidak support semua Unicode characters
   - Solution: data sanitization atau upgrade jsPDF

3. **Memory Issue:**
   - Large dataset bisa cause browser memory issue
   - Close other tabs
   - Restart browser
   - Try on device dengan RAM lebih besar

### 3. Format Tanggal Error

**Symptoms:**
- Tanggal muncul sebagai "-" atau "Invalid Date"
- Error "Cannot read property 'toDate' of undefined"

**Solutions:**
1. **Check Firestore Timestamp:**
   ```javascript
   // Pastikan paidAt adalah Firestore Timestamp
   // Bukan string atau Date object
   ```

2. **Already Fixed:**
   - formatDate() sudah ada try-catch
   - Akan return "-" jika timestamp invalid
   - Check console untuk error details

### 4. Currency Format Error

**Symptoms:**
- Jumlah bayar muncul sebagai "NaN" atau "Rp 0"
- Format currency tidak sesuai

**Solutions:**
1. **Check totalAmount Field:**
   ```javascript
   // Pastikan totalAmount adalah number, bukan string
   payment.totalAmount = parseInt(payment.totalAmount);
   ```

2. **Fallback to amount:**
   - Code sudah handle fallback ke `payment.amount`
   - Jika keduanya null, akan jadi 0

### 5. Status Filter Tidak Bekerja

**Symptoms:**
- Filter status "Lunas" atau "Belum Lunas" tidak filter data
- Semua data tetap muncul

**Solutions:**
1. **Check Status Value:**
   ```javascript
   // Status harus 'paid' atau 'pending'
   // Bukan 'lunas' atau 'belum lunas'
   ```

2. **Check Filter Logic:**
   - Code sudah handle 'pending' dan 'unpaid' status
   - Jika ada status lain, tambahkan di filter logic

## Debugging Steps

### Step 1: Enable Console Logging
```javascript
// Tambahkan di handleDownloadPDF()
console.log('Generating PDF with data:', filteredPayments);
console.log('Filters:', filters);
```

### Step 2: Test dengan Data Minimal
1. Filter data menjadi 1-5 records saja
2. Test PDF generation
3. Jika berhasil, issue ada di data size atau specific record

### Step 3: Check Individual Records
```javascript
// Test setiap field
filteredPayments.forEach((payment, index) => {
  console.log(`Record ${index}:`, {
    nisn: payment.nisn,
    name: payment.studentName,
    amount: payment.totalAmount,
    date: payment.paidAt
  });
});
```

### Step 4: Test di Browser Lain
- Chrome: Best compatibility
- Firefox: Good alternative
- Safari: Kadang ada issue dengan download
- Edge: Usually works fine

## Known Limitations

1. **Max Records:** ~500 records per PDF (performance)
2. **File Size:** ~5MB max (browser limitation)
3. **Font Support:** Default font tidak support semua Unicode
4. **Mobile:** PDF generation bisa lambat di mobile device

## Upgrade Path

Jika masih ada issue, consider upgrade jsPDF:

```bash
# Current version
npm list jspdf
# jspdf@4.2.1

# Upgrade to latest stable
npm install jspdf@latest jspdf-autotable@latest

# Or specific version
npm install jspdf@2.5.2 jspdf-autotable@3.8.4
```

**Note:** Upgrade jsPDF bisa break existing code. Test thoroughly!

## Contact

Jika issue masih berlanjut:
1. Screenshot error message di console
2. Export sample data (tanpa data sensitif)
3. Describe steps to reproduce
4. Contact developer

---

**Last Updated:** 2026-05-17  
**Version:** 1.0.0
