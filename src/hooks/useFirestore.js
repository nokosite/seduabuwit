import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Hook untuk fetch data siswa
export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simplified query - no composite index needed
    const q = query(
      collection(db, 'students'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort in memory instead of Firestore
        studentsData.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(studentsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { students, loading, error };
};

// Hook untuk fetch payments (tagihan)
export const usePayments = (filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = query(collection(db, 'payments'));

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.studentId) {
      q = query(q, where('studentId', '==', filters.studentId));
    }
    if (filters.month) {
      q = query(q, where('month', '==', filters.month));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPayments(paymentsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters.status, filters.studentId, filters.month]);

  return { payments, loading, error };
};

// Hook untuk fetch payment history by student
export const usePaymentHistory = (studentId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    // Simplified query - no orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'payments'),
      where('studentId', '==', studentId),
      where('status', '==', 'paid')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Sort in memory by paidAt
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        historyData.sort((a, b) => {
          const dateA = a.paidAt?.toDate?.() || new Date(a.paidAt || 0);
          const dateB = b.paidAt?.toDate?.() || new Date(b.paidAt || 0);
          return dateB - dateA; // desc order
        });

        setHistory(historyData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  return { history, loading, error };
};

// Hook untuk fetch SEMUA anak milik 1 user (parent multi-anak)
export const useChildrenOfParent = (userId) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setChildren([]);
      return;
    }

    const q = query(
      collection(db, 'students'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setChildren(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { children, loading, error };
};

// Hook untuk fetch active payment (tagihan aktif - single oldest)
export const useActivePayment = (studentId) => {
  const { pendingPayments, loading, error } = usePendingPayments(studentId);
  const activePayment = pendingPayments[0] || null;
  return { activePayment, loading, error };
};

// Hook untuk fetch ALL pending payments (semua tunggakan, urut dari paling lama)
export const usePendingPayments = (studentId) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setPendingPayments([]);
      return;
    }

    const q = query(
      collection(db, 'payments'),
      where('studentId', '==', studentId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        payments.sort((a, b) => {
          const dateA = a.dueDate?.toDate?.() || new Date(a.dueDate || 0);
          const dateB = b.dueDate?.toDate?.() || new Date(b.dueDate || 0);
          return dateA - dateB;
        });

        setPendingPayments(payments);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  return { pendingPayments, loading, error };
};

// Hook untuk fetch statistics (dashboard admin) - real-time
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const useStatistics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidThisMonth: 0,
    pendingThisMonth: 0,
    totalIncome: 0,            // total pemasukan SEMUA bulan yang lunas
    totalArrears: 0,           // total tunggakan semua bulan
    collectionRate: 0,         // % tagihan lunas bulan ini
    currentMonth: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let studentsCount = 0;
    let thisMonthBucket = { paid: 0, income: 0, pending: 0, total: 0 };
    let totalIncomeAllMonths = 0;
    let arrearsTotal = 0;

    const now = new Date();
    const currentMonth = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    const update = () => {
      const rate = thisMonthBucket.total > 0
        ? Math.round((thisMonthBucket.paid / thisMonthBucket.total) * 100)
        : 0;
      setStats({
        totalStudents: studentsCount,
        paidThisMonth: thisMonthBucket.paid,
        pendingThisMonth: thisMonthBucket.pending,
        totalIncome: totalIncomeAllMonths,
        totalArrears: arrearsTotal,
        collectionRate: rate,
        currentMonth
      });
    };

    const studentsUnsub = onSnapshot(
      query(collection(db, 'students'), where('status', '==', 'active')),
      (snap) => {
        studentsCount = snap.size;
        update();
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Status bulan ini (untuk collection rate)
    const thisMonthUnsub = onSnapshot(
      query(collection(db, 'payments'), where('month', '==', currentMonth)),
      (snap) => {
        const bucket = { paid: 0, income: 0, pending: 0, total: 0 };
        snap.forEach((d) => {
          const p = d.data();
          bucket.total++;
          if (p.status === 'paid') {
            bucket.paid++;
          } else if (p.status === 'pending' || p.status === 'unpaid') {
            bucket.pending++;
          }
        });
        thisMonthBucket = bucket;
        update();
      }
    );

    // Total pemasukan SEMUA bulan yang lunas
    const allPaidUnsub = onSnapshot(
      query(collection(db, 'payments'), where('status', '==', 'paid')),
      (snap) => {
        let total = 0;
        snap.forEach((d) => {
          const p = d.data();
          total += p.totalAmount || p.amount || 0;
        });
        totalIncomeAllMonths = total;
        update();
      }
    );

    // Tunggakan semua bulan (status pending)
    const arrearsUnsub = onSnapshot(
      query(collection(db, 'payments'), where('status', '==', 'pending')),
      (snap) => {
        let total = 0;
        snap.forEach((d) => {
          const p = d.data();
          total += p.totalAmount || p.amount || 0;
        });
        arrearsTotal = total;
        update();
      }
    );

    return () => {
      studentsUnsub();
      thisMonthUnsub();
      allPaidUnsub();
      arrearsUnsub();
    };
  }, []);

  return { stats, loading, error };
};

// Hook untuk fetch classes
export const useClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'classes'),
      orderBy('grade', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClasses(classesData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { classes, loading, error };
};

// Hook untuk fetch DISTINCT months yang punya tagihan (real-time)
// Returns: [{ key: "Mei 2026", month: "Mei", year: 2026, count: 30 }]
const MONTH_ORDER = {
  Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
  Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11
};

export const useActiveMonths = (yearFilter = null) => {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        const map = new Map();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (!data.month) return;
          const [monthName, yearStr] = data.month.split(' ');
          const year = parseInt(yearStr);
          if (yearFilter !== null && year !== yearFilter) return;
          const key = data.month;
          if (!map.has(key)) {
            map.set(key, { key, month: monthName, year, count: 0 });
          }
          map.get(key).count += 1;
        });

        const list = Array.from(map.values());
        list.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return (MONTH_ORDER[b.month] ?? 0) - (MONTH_ORDER[a.month] ?? 0);
        });

        setMonths(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [yearFilter]);

  return { months, loading };
};

// Hook untuk fetch DISTINCT years yang punya tagihan
export const useActiveYears = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        const set = new Set();
        snap.docs.forEach((d) => {
          const y = d.data().year;
          if (y) set.add(y);
        });
        const arr = Array.from(set).sort((a, b) => b - a);
        setYears(arr);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  return { years, loading };
};

// Hook untuk fetch settings
export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'settings'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const settingsDoc = snapshot.docs[0];
          setSettings({
            id: settingsDoc.id,
            ...settingsDoc.data()
          });
        } else {
          // Default settings
          setSettings({
            tarif: 100000,
            biayaAdmin: 4500
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { settings, loading, error };
};
