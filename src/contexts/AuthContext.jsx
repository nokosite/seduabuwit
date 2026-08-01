import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [adminRole, setAdminRole] = useState(null); // 'superadmin' | 'tu' | 'bendahara' | 'kepsek'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        setUserRole(role);
        return { success: true, role };
      } else {
        throw new Error('Data pengguna tidak ditemukan. Hubungi admin untuk verifikasi akun.');
      }
    } catch (err) {
      // Better error messages with icons
      let errorMessage = 'Login gagal! Silakan coba lagi.';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar. Silakan hubungi admin untuk membuat akun.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Password yang Anda masukkan salah! Silakan coba lagi.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid! Contoh: nama@email.com';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah! Periksa kembali data Anda.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan login gagal. Coba lagi dalam beberapa menit.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
      } else if (err.message.includes('EMAIL_NOT_FOUND')) {
        errorMessage = 'Email tidak terdaftar di sistem. Silakan hubungi admin.';
      } else if (err.message.includes('INVALID_PASSWORD')) {
        errorMessage = 'Password yang Anda masukkan salah! Silakan coba lagi.';
      } else if (err.message.includes('User data not found')) {
        errorMessage = 'Data pengguna tidak ditemukan. Hubungi admin untuk verifikasi akun.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setAdminRole(data.adminRole || (data.role === 'admin' ? 'superadmin' : null));
          } else {
            // Auto-create user document with default role inferred from email
            const defaultRole = user.email.includes('admin') ? 'admin' : 'parent';
            const defaultData = {
              email: user.email,
              role: defaultRole,
              name: defaultRole === 'admin' ? 'Admin SDN 2 Buwit' : 'Orang Tua',
              createdAt: new Date()
            };

            try {
              await setDoc(doc(db, 'users', user.uid), defaultData);
              setUserRole(defaultRole);
            } catch (_createError) {
              setError('Failed to create user data. Please contact admin.');
            }
          }
        } catch (err) {
          if (err.code === 'permission-denied') {
            setError('Permission denied. Please check Firestore rules.');
          } else {
            setError('Failed to fetch user data: ' + err.message);
          }
        }
      } else {
        setUserRole(null);
        setAdminRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Permission helpers based on adminRole
  const can = (action) => {
    if (userRole !== 'admin') return false;
    if (!adminRole || adminRole === 'superadmin') return true;
    const matrix = {
      tu:        ['view', 'manage_students', 'manage_classes', 'bulk_import'],
      bendahara: ['view', 'generate_tagihan', 'manage_payments', 'manual_payment', 'edit_tarif', 'export_report'],
      kepsek:    ['view', 'export_report', 'view_audit']
    };
    return matrix[adminRole]?.includes(action) ?? false;
  };

  const value = {
    currentUser,
    userRole,
    adminRole,
    can,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
