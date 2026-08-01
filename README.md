# 💰 Sumbangan Sukarela SDN 2 Buwit - Sistem Pembayaran Digital

Aplikasi web untuk manajemen pembayaran sumbangan sekolah dengan Firebase & Duitku Payment Gateway.

[![GitHub](https://img.shields.io/badge/GitHub-nokosite%2Fseduabuwit-blue?logo=github)](https://github.com/nokosite/seduabuwit)
[![License](https://img.shields.io/badge/License-ENOWX-green)](https://github.com/nokosite/seduabuwit)
[![Status](https://img.shields.io/badge/Status-70%25%20Complete-yellow)](https://github.com/nokosite/seduabuwit)

## 🚀 Quick Start

### Clone Repository

```bash
git clone https://github.com/nokosite/seduabuwit.git
cd seduabuwit
```

### Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

**Development URL:** http://localhost:5173

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Login Credentials

**Admin:**
- Email: `admin@sdn2buwit.com`
- Password: `password123`

**Parent:**
- Email: `parent@sdn2buwit.com`
- Password: `password123`

## 🔥 Firebase Setup

**Firebase Console:** https://console.firebase.google.com/project/seduabuwitpayment

### 1. Enable Services

1. **Authentication:**
   - Go to: [Firebase Console → Authentication](https://console.firebase.google.com/project/seduabuwitpayment/authentication)
   - Enable: Email/Password

2. **Firestore Database:**
   - Go to: [Firestore Database](https://console.firebase.google.com/project/seduabuwitpayment/firestore)
   - Create database (test mode)

### 2. Update Firestore Rules

**Go to:** [Firestore Rules](https://console.firebase.google.com/project/seduabuwitpayment/firestore/rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Create Users

**Via:** [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/seduabuwitpayment/authentication/users)

1. Add admin user:
   - Email: `admin@sdn2buwit.com`
   - Password: `password123`
   - Copy UID

2. Add parent user:
   - Email: `parent@sdn2buwit.com`
   - Password: `password123`
   - Copy UID

### 4. Add User Data to Firestore

**Go to:** [Firestore Data](https://console.firebase.google.com/project/seduabuwitpayment/firestore/data)

**Collection: `users`**

**Admin Document:**
```
Document ID: [UID dari admin]
Fields:
- email: "admin@sdn2buwit.com"
- role: "admin"
- name: "Admin SDN 2 Buwit"
```

**Parent Document:**
```
Document ID: [UID dari parent]
Fields:
- email: "parent@sdn2buwit.com"
- role: "parent"
- name: "Orang Tua Dika Darma"
- studentName: "Dika Darma"
- studentClass: "6C"
```

## 📊 Features

### Admin Dashboard
- ✅ Real-time statistics (siswa, pembayaran, pemasukan)
- ✅ Transaction monitoring
- ✅ Data Master (CRUD siswa)
- ✅ Data Kelas (view per kelas)
- ✅ Tarif Sumbangan (view & edit)
- ⏳ Generate tagihan masal
- ⏳ Laporan keuangan

### Parent Dashboard
- ✅ View tagihan aktif
- ✅ Riwayat pembayaran
- ✅ Payment via Duitku Gateway

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite 8
- **Styling:** Tailwind CSS 4
- **Animation:** GSAP 3.15
- **Backend:** Firebase (Auth + Firestore)
- **Payment:** Duitku Gateway
- **Icons:** Phosphor Icons

## 📁 Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin dashboard components
│   ├── Parent/         # Parent dashboard components
│   ├── Login/          # Login page
│   └── Modals/         # Modal components
├── contexts/
│   └── AuthContext.jsx # Authentication context
├── hooks/
│   └── useFirestore.js # Custom Firestore hooks
├── services/
│   └── firestoreService.js # Firestore CRUD operations
└── firebase/
    └── config.js       # Firebase configuration
```

## 🔧 Development

### Maintenance Scripts

#### Cleanup Inactive Students
Menghapus permanen siswa yang sudah di-soft delete (status: inactive):

```bash
node cleanup-inactive-students.js
```

**Catatan:** 
- Sistem menggunakan soft delete untuk siswa (status: 'inactive')
- NISN dari siswa inactive tidak bisa dipakai lagi sampai dihapus permanen
- Script ini akan menampilkan daftar siswa inactive sebelum menghapus
- Konfirmasi diperlukan sebelum penghapusan permanen

### Add New Student (Manual via Firestore)

**Collection: `students`**

```javascript
{
  nisn: "0012345678",
  name: "Nama Siswa",
  class: "6C",
  parentName: "Nama Orang Tua",
  parentPhone: "081234567890",
  parentEmail: "email@example.com",
  status: "active"
}
```

### Add Payment (Manual via Firestore)

**Collection: `payments`**

```javascript
{
  studentId: "student001",
  studentName: "Nama Siswa",
  studentClass: "6C",
  month: "Oktober 2024",
  year: 2024,
  amount: 100000,
  adminFee: 4500,
  totalAmount: 104500,
  status: "pending", // or "paid"
  dueDate: Timestamp,
  createdAt: Timestamp
}
```

## 📝 License

ENOWX-0706M-NV5CO-7XWJ8-HF6JR

## 🔗 Important Links

### Development URLs
- **Login:** http://localhost:5173/login
- **Admin Dashboard:** http://localhost:5173/admin
- **Admin Data Master:** http://localhost:5173/admin/datamaster
- **Admin Laporan:** http://localhost:5173/admin/laporan
- **Parent Dashboard:** http://localhost:5173/parent

### Config Files
- **Vite Config:** `vite.config.js`
- **Tailwind Config:** `tailwind.config.js`
- **Firebase Config:** `src/firebase/config.js`

### Firebase Console
- **Project:** https://console.firebase.google.com/project/seduabuwitpayment
- **Authentication:** https://console.firebase.google.com/project/seduabuwitpayment/authentication
- **Firestore:** https://console.firebase.google.com/project/seduabuwitpayment/firestore
- **Rules:** https://console.firebase.google.com/project/seduabuwitpayment/firestore/rules
- **Indexes:** https://console.firebase.google.com/project/seduabuwitpayment/firestore/indexes

### Documentation
- **`TODO.md`** - Task list & revision tracking
- **`FRONTEND-DESIGN.md`** - UI design system, colors, layout
- **`BACKEND-DOCS.md`** - Deployment, troubleshooting, security
- **`CLAUDE.md`** - Development guidelines (RTK Query)
- **`SECURITY.md`** - Security best practices
- **Firebase Docs:** https://firebase.google.com/docs
- **React Docs:** https://react.dev
- **Tailwind Docs:** https://tailwindcss.com/docs
- **GSAP Docs:** https://gsap.com/docs
- **Phosphor Icons:** https://phosphoricons.com

## 👨‍💻 Developer

Built with ❤️ by enowX Labs AI

---

**Status:** In Development (70% Complete)  
**Last Updated:** 2026-05-03

## 🛣️ Routes

### Public Routes
- `/` - Redirect to login or dashboard (based on auth)
- `/login` - Login page

### Protected Routes (Admin)
- `/admin` - Admin dashboard (monitoring & penagihan)
- `/admin/datamaster` - Data master (siswa, kelas, tarif)
- `/admin/laporan` - Laporan keuangan

### Protected Routes (Parent)
- `/parent` - Parent dashboard (tagihan & riwayat)

### Route Protection
- ✅ Unauthenticated users → Redirect to `/login`
- ✅ Authenticated users → Redirect based on role
- ✅ Admin can only access `/admin/*`
- ✅ Parent can only access `/parent/*`
- ✅ URL changes when navigating between pages
- ✅ Browser back/forward buttons work
- ✅ Direct URL access works (with auth check)

