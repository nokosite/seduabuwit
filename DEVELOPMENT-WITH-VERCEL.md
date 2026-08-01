# Development dengan Vercel Dev

## Mengapa Vercel Dev?

**Problem:**
- Vite dev server (`npm run dev`) tidak bisa menjalankan serverless functions (`/api/*`)
- Email API endpoints tidak tersedia di localhost:5173
- Harus call production API untuk testing (tidak ideal)

**Solution:**
- Gunakan `vercel dev` untuk development
- Vercel Dev menjalankan serverless functions secara lokal
- Email API tersedia di localhost tanpa CORS issues

---

## Setup

### 1. Install Vercel CLI (One-time)

```bash
npm install -g vercel
```

### 2. Login ke Vercel (One-time)

```bash
vercel login
```

Follow the prompts untuk login dengan GitHub/email.

### 3. Link Project (One-time)

```bash
vercel link
```

Pilih:
- **Scope:** Your account/team
- **Link to existing project?** Yes
- **Project name:** seduabuwit

---

## Development Commands

### Option 1: Vercel Dev (Recommended)

```bash
npm run dev:vercel
```

**Features:**
- ✅ Vite dev server (React hot reload)
- ✅ Serverless functions (`/api/*`)
- ✅ Email API works locally
- ✅ No CORS issues
- ✅ Environment variables from Vercel

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/email/*

### Option 2: Vite Only (Fast, No API)

```bash
npm run dev
```

**Features:**
- ✅ Vite dev server (React hot reload)
- ❌ No serverless functions
- ❌ Email API not available (404 errors)

**Use Case:**
- UI development only
- No need to test email functionality

---

## Environment Variables

Vercel Dev automatically loads environment variables from:
1. `.env` file (local)
2. Vercel project settings (pulled automatically)

**Required Variables:**
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Check Variables:**
```bash
vercel env ls
```

**Pull from Vercel:**
```bash
vercel env pull .env.local
```

---

## Testing Email Functionality

### 1. Start Vercel Dev

```bash
npm run dev:vercel
```

Wait for:
```
✓ Ready! Available at http://localhost:3000
```

### 2. Test Email Reminder

1. Open http://localhost:3000/admin
2. Login sebagai admin
3. Buka **Monitoring Penagihan**
4. Pilih bulan dengan tagihan belum lunas
5. Klik **"Kirim Reminder"**
6. Modal muncul → Klik **"Kirim Email"**
7. Check console:
   ```javascript
   📧 Sending reminder email to: parent@gmail.com via /api/email/send-reminder
   ✅ Berhasil mengirim 2 email reminder!
   ```
8. Check parent inbox untuk email

### 3. Test Generate Tagihan

1. Buka **Data Master** → **Tagihan**
2. Klik **"Generate Tagihan Bulanan"**
3. Pilih bulan & tahun
4. Klik **"Generate"**
5. Check console:
   ```javascript
   Sending email notifications for Januari 2026...
   Using API URL: /api/email/send-bulk-notification
   ✓ Email notifications: 2 sent, 0 failed
   ```

---

## Troubleshooting

### Issue: "Command not found: vercel"

**Solution:**
```bash
npm install -g vercel
```

### Issue: "Not authorized"

**Solution:**
```bash
vercel login
```

### Issue: "Project not linked"

**Solution:**
```bash
vercel link
```

### Issue: "Environment variables not found"

**Solution:**
```bash
# Pull from Vercel
vercel env pull .env.local

# Or manually create .env file
cp .env.example .env
# Edit .env with your credentials
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
vercel dev --listen 3001
```

---

## Comparison: Vite vs Vercel Dev

| Feature | `npm run dev` (Vite) | `npm run dev:vercel` (Vercel Dev) |
|---------|---------------------|----------------------------------|
| React Hot Reload | ✅ Fast | ✅ Fast |
| Serverless Functions | ❌ Not available | ✅ Available |
| Email API | ❌ 404 errors | ✅ Works locally |
| CORS Issues | ❌ Yes (if calling production) | ✅ No |
| Environment Variables | `.env` only | `.env` + Vercel settings |
| Startup Time | ~1 second | ~3-5 seconds |
| Use Case | UI development | Full-stack development |

---

## Recommended Workflow

**UI Development Only:**
```bash
npm run dev
```

**Testing Email/API Features:**
```bash
npm run dev:vercel
```

**Production Build:**
```bash
npm run build
vercel --prod
```

---

## Notes

- Vercel Dev runs on port **3000** by default (not 5173)
- First run might be slower (downloading dependencies)
- Environment variables are cached (restart if changed)
- Serverless functions have cold start (~1-2 seconds first call)

---

**Last Updated:** 2026-05-17  
**Version:** 1.0.0
