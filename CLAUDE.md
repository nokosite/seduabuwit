# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sumbangan Sukarela SDN 2 Buwit is a school payment management system for SDN 2 Buwit elementary school. The application manages student billing, payment tracking, and reporting with Duitku payment gateway integration.

**Tech Stack:**
- Frontend: React 19 + Vite 8 + React Router 7 + Tailwind CSS 4
- Backend: Firebase (Auth, Firestore) + Vercel Serverless Functions
- Payment: Duitku Payment Gateway (Sandbox)
- UI Components: shadcn/ui + Phosphor Icons
- Charts: Recharts
- Reports: ExcelJS + jsPDF
- Animation: GSAP 3.15

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Expose localhost via Cloudflare Tunnel (for cross-device testing)
cloudflared tunnel --url http://localhost:5173
```

## Architecture

### Application Structure

```
src/
├── App.jsx                    # Root component with routing
├── main.jsx                   # Entry point
├── index.css                  # Global styles + Tailwind
├── contexts/
│   └── AuthContext.jsx        # Firebase auth state + role management
├── components/
│   ├── Admin/                 # Admin dashboard components
│   │   ├── AdminSection.jsx   # Main admin container with tabs
│   │   ├── AdminNavbar.jsx    # Horizontal navbar with green gradient
│   │   ├── DashboardView.jsx  # Dashboard tab (stats + quick actions)
│   │   ├── DataMasterView.jsx # Data Master tab (4 sub-tabs)
│   │   ├── MonitoringPenagihan.jsx # Billing monitoring with monthly grouping
│   │   ├── IncomeChart.jsx    # Income chart (Bar + Line)
│   │   └── LaporanView.jsx    # Reports tab (Excel/PDF export)
│   ├── Parent/                # Parent dashboard components
│   │   ├── ParentSection.jsx  # Main parent container
│   │   ├── TagihanCard.jsx    # Payment bill card
│   │   └── RiwayatPembayaran.jsx # Payment history
│   ├── Modals/                # Modal components
│   │   ├── ModalDuitku.jsx    # Payment modal
│   │   ├── ModalTambahData.jsx # Add student modal
│   │   ├── ModalEditStudent.jsx # Edit student modal
│   │   ├── ModalEditParent.jsx # Edit parent credentials
│   │   ├── ModalEditKelas.jsx # Edit class modal
│   │   ├── ModalEditTarif.jsx # Edit tarif modal (2-step confirmation)
│   │   ├── ModalBulkImport.jsx # Bulk import students via Excel
│   │   └── Toast.jsx          # Notification component
│   ├── Login/
│   │   └── LoginSection.jsx   # Split layout login with school logo
│   └── ui/                    # shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── badge.jsx
│       ├── dialog.jsx
│       └── toast.jsx
├── pages/
│   └── PaymentSuccess.jsx     # Payment success page
├── services/
│   ├── duitkuService.js       # Duitku API integration (mock in dev)
│   ├── firestoreService.js    # Firestore CRUD operations
│   └── reportService.js       # Excel/PDF report generation
├── firebase/
│   └── config.js              # Firebase config (primary + secondary app)
├── hooks/
│   └── useFirestore.js        # Firestore custom hook
└── assets/                    # Static assets (logo, illustrations)

api/
└── duitku/                    # Vercel serverless functions
    ├── get-payment-methods.js # Get available payment methods
    ├── create-transaction.js  # Create payment transaction
    ├── check-status.js        # Check transaction status
    ├── callback.js            # Payment callback handler
    └── return.js              # Payment return handler
```

### Authentication Flow

Firebase Authentication with role-based access control:
- **Admin role**: Full access to dashboard, data management, reports, and settings
- **Parent role**: View bills and payment history for their linked student

**Key Implementation Details:**
- User roles stored in Firestore `users` collection with `role` field
- `AuthContext` manages auth state and provides `currentUser` + `userRole`
- Secondary Firebase app (`secondaryAuth`) used for creating parent accounts without logging out admin
- Default password for all parents: `password123`
- Admin can edit parent email/password via `ModalEditParent`

**Login Credentials (Development):**
- Admin: `admin@sdn2buwit.com` / `password123`
- Parent: `parent@sdn2buwit.com` / `password123`

### Payment Flow

1. Admin generates monthly bills via "Generate Tagihan" button (Admin Dashboard green card)
2. Parent views pending bills in `ParentSection`
3. Parent clicks "Bayar Sekarang" to open `ModalDuitku`
4. Parent selects payment method (VA, E-Wallet, QRIS)
5. `duitkuService.createTransaction()` creates payment via `/api/duitku/create-transaction`
6. User completes payment via Duitku
7. Duitku sends callback to `/api/duitku/callback`
8. Callback handler updates Firestore payment status
9. Frontend reflects updated payment status in real-time

**Important Notes:**
- Development mode uses mock data in `duitkuService.js` to bypass CORS
- Production API calls go through Vercel serverless functions in `/api/duitku/`
- Duitku sandbox credentials in `BACKEND-DOCS.md`

### Firestore Collections

**Core Collections:**
- `users`: User profiles with `role` (admin/parent) and `studentId` (for parents)
- `students`: Student master data (name, NISN, class, parentEmail, userId)
- `payments`: Payment bills (status: pending/paid, includes deadline)
- `transactions`: Payment history records (linked to payments)
- `classes`: Class data (tingkat 1-6, status active/inactive)
- `settings`: App settings (tarif sumbangan, biaya admin)

**Data Relationships:**
- `users.studentId` → `students.id` (parent-student link)
- `students.userId` → `users.id` (student-parent link)
- `payments.studentId` → `students.id` (bill-student link)
- `transactions.paymentId` → `payments.id` (transaction-bill link)

**Auto-Creation Pattern:**
When adding a student with `parentEmail`:
1. Create Firebase Auth user with `password123`
2. Create `users` document with `role: 'parent'`
3. Link `students.userId` to new user
4. Admin can edit credentials anytime via `ModalEditParent`

### UI Design System

**Color Scheme: Green Theme**
- Primary: `#10B981` (Emerald 500)
- Secondary: `#3B82F6` (Blue 500)
- Background: `#F8FAFC` (Slate 50)

**Gradients:**
- Navbar: `linear-gradient(135deg, #047857 0%, #059669 25%, #10B981 75%, #34D399 100%)`
- Green Card: `linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)`
- Blue Card: `linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)`

**Icon System:**
- Library: Phosphor Icons (filled variant only)
- Consistency: All icons use `ph-fill` class
- Size: `text-xl` default, `text-2xl` for headers
- **Never use emoji in UI** - always use Phosphor icons

**Layout Standards:**
- Horizontal navbar (green gradient) with logo, menu, notifications, profile
- Card-based layout with consistent spacing
- Rounded corners: `rounded-2xl` for cards, `rounded-lg` for modals
- Button height: minimum `h-9` for action buttons (h-8 too small)
- Mobile: bottom navigation

**Component Patterns:**
- Use native `<button>` instead of shadcn `Button` when click issues occur
- Modals require `show` prop for visibility control
- Dynamic classes from Firestore: store "1", display "Kelas 1"
- Parse numeric inputs with `parseInt()` to prevent string concatenation bugs

### State Management Patterns

**No Global State Library:**
- React Context for auth (`AuthContext`)
- Local component state for UI
- Real-time Firestore listeners for data sync

**Firestore Initialization Pattern:**
Default data with auto-sync for instant display:
```javascript
// Check if collection exists, if not create default data
const snapshot = await getDocs(collection(db, 'classes'));
if (snapshot.empty) {
  // Create default data
  for (let i = 1; i <= 6; i++) {
    await addDoc(collection(db, 'classes'), {
      tingkat: i,
      status: 'active',
      createdAt: serverTimestamp()
    });
  }
}
```

**Avoid Reload Loops:**
- Use `sessionStorage` to track initialization state
- Don't auto-reload on user interactions (edit, delete)
- Only reload on mount or explicit refresh

### Key Features Implementation

**1. Monitoring Penagihan (Billing Monitoring)**
- Monthly grouping with deadline tracking (10th of each month)
- Status filters: All / Paid / Unpaid
- Visual hierarchy with gradient boxes and hover effects
- Real-time sync with Firestore

**2. Total Pemasukan (Income Tracking)**
- Income breakdown: Sumbangan Sukarela murni, biaya admin, total
- Collection rate calculation
- Bar + Line chart with year selector (Recharts)
- Statistics cards with gradients

**3. Data Master (4 Sub-tabs)**
- **Data Siswa**: CRUD students, bulk import Excel, filter by class, export Excel
- **Data Kelas**: CRUD classes (tingkat 1-6 only, no A/B/C), active/inactive toggle
- **Tarif Sumbangan**: Edit tarif + biaya admin with 2-step confirmation
- **Monitoring Pembayaran**: Check payment status per student

**4. Laporan (Reports)**
- Filters: Month, Year, Status
- Export Excel (ExcelJS) with full data
- Export PDF (jsPDF) with formatted layout
- Data includes: name, class, NISN, status, date, method, amount

**5. Bulk Import Siswa**
- Template download (Excel)
- Preview before import
- Validation and error handling
- Auto-create parent accounts

## Environment Variables

**Backend Only (Vercel):**
```env
DUITKU_MERCHANT_CODE=DS30269
DUITKU_API_KEY=d4dff63d806898d3f02315e894b0063c
DUITKU_ENV=sandbox

FIREBASE_PROJECT_ID=seduabuwitpayment
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seduabuwitpayment.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Frontend (Safe to Expose):**
```env
VITE_FIREBASE_API_KEY=AIzaSyCl_SmyFo8uoX9V00UFkVNrqSvjMAAhXOM
VITE_FIREBASE_AUTH_DOMAIN=seduabuwitpayment.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seduabuwitpayment
VITE_FIREBASE_STORAGE_BUCKET=seduabuwitpayment.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=525170063354
VITE_FIREBASE_APP_ID=1:525170063354:web:3e7424b2d5e20f98065643
VITE_FIREBASE_MEASUREMENT_ID=G-19CF1WW3VV
```

**Note:** Firebase config is hardcoded in `src/firebase/config.js` with fallbacks.

## Development Workflow

### Sequential TODO Workflow
User prefers one-by-one task completion with commit after each feature. Check `TODO.md` for current task list (49/52 complete as of 2026-05-15).

### Confirm Before Implementation
Always use `AskUserQuestion` when request is ambiguous, especially after reversals. User has changed mind on:
- Kategori kelas (removed A/B/C, only tingkat 1-6)
- Modal corners (changed from sharp to rounded)
- UI colors (rejected "alay" colors, wants minimalist palette)

### Clean Console Requirement
Remove all `console.log` statements to prevent spam. Handle errors with Toast notifications instead.

### Documentation Structure
- `FRONTEND-DESIGN.md`: UI/UX guidelines, color scheme, icon system
- `BACKEND-DOCS.md`: Deployment guide, environment variables, API docs
- `TODO.md`: Task tracking with completion status
- `CARA-GENERATE-TAGIHAN.md`: Guide for generating monthly bills

## Common Tasks

### Adding a New Feature
1. Read relevant existing code first
2. Check `TODO.md` for context
3. Follow UI design system in `FRONTEND-DESIGN.md`
4. Use Phosphor icons (filled variant only)
5. Test with both admin and parent roles
6. Remove console.log statements
7. Commit with descriptive message

### Modifying Firestore Schema
1. Update service functions in `src/services/firestoreService.js`
2. Update Firestore rules in Firebase Console
3. Test data flow with real-time listeners
4. Verify with both roles (admin/parent)
5. Update documentation if schema changes significantly

### Testing Payment Integration
```bash
# Test all API endpoints locally
./test-local-integration.sh

# Test Duitku sandbox API directly
node test-duitku-sandbox.js

# Debug payment issues
./debug-payment.sh

# Generate sample payment data
./generate-sample-payment.sh
```

### Deploying to Vercel
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys from main branch
3. Set environment variables in Vercel dashboard
4. Test callback URL: `https://your-domain.vercel.app/api/duitku/callback`
5. Update Duitku callback URL in merchant dashboard

### Cross-Device Testing
```bash
# Start Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5173

# Add tunnel host to vite.config.js allowedHosts
server: {
  allowedHosts: ['.trycloudflare.com']
}

# Restart dev server
npm run dev
```

## Important Constraints

1. **No Emoji in UI**: Always use Phosphor icons instead
2. **Icon Consistency**: All icons must use filled variant (`ph-fill`)
3. **Button Size**: Minimum `h-9` for action buttons
4. **Modal Visibility**: Modals with `if (!show) return null` must receive `show` prop
5. **Numeric Parsing**: Always use `parseInt()` for numeric form inputs
6. **Clean Console**: Remove all `console.log` statements
7. **Kelas Format**: Store "1", display "Kelas 1" (no A/B/C categories)
8. **Password Default**: All parent accounts use `password123`
9. **Verification Required**: Spawn verification agent after non-trivial implementation (3+ file edits)

## Repository Information

- **GitHub**: nokosite/seduabuwit
- **Latest Commit**: f5401ce (fixed reload loop) - 2026-05-15
- **Firebase Console**: https://console.firebase.google.com/project/seduabuwitpayment
- **Duitku Sandbox**: https://passport.duitku.com

## References

- Design system: `FRONTEND-DESIGN.md`
- Deployment guide: `BACKEND-DOCS.md`
- Task tracking: `TODO.md`
- Tagihan generation: `CARA-GENERATE-TAGIHAN.md`
- README: `README.md` (project overview + setup)
