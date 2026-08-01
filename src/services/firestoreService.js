import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, secondaryAuth } from '../firebase/config';

// ==================== STUDENTS ====================

// Check if NISN already exists (returns existing student doc if found)
export const findStudentByNISN = async (nisn) => {
  if (!nisn) return null;
  try {
    const q = query(
      collection(db, 'students'), 
      where('nisn', '==', nisn),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (_error) {
    return null;
  }
};

export const addStudent = async (studentData) => {
  try {
    // Validate NISN uniqueness
    if (studentData.nisn) {
      const existing = await findStudentByNISN(studentData.nisn);
      if (existing) {
        return { success: false, error: `NISN ${studentData.nisn} sudah dipakai siswa: ${existing.name}` };
      }
    }

    let userId = null;

    // Create Firebase Auth user if parent email is provided
    if (studentData.parentEmail) {
      try {
        // Use secondary auth to avoid logging out current admin
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          studentData.parentEmail,
          'password123' // Default password
        );
        userId = userCredential.user.uid;

        // Sign out from secondary auth immediately
        await secondaryAuth.signOut();

        // Create user document in Firestore with the same UID
        await setDoc(doc(db, 'users', userId), {
          email: studentData.parentEmail,
          role: 'parent',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (authError) {
        // If user already exists, try to get existing user
        if (authError.code === 'auth/email-already-in-use') {
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', studentData.parentEmail)
          );
          const userSnapshot = await getDocs(usersQuery);
          if (!userSnapshot.empty) {
            userId = userSnapshot.docs[0].id;
          }
        } else {
          throw authError;
        }
      }
    }

    // Add student to students collection
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      userId: userId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateStudent = async (studentId, studentData) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      ...studentData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteStudent = async (studentId) => {
  try {
    // Soft delete - just update status
    await updateDoc(doc(db, 'students', studentId), {
      status: 'inactive',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update parent email (password is managed via Firebase Auth, never stored in Firestore)
export const updateParentCredentials = async (studentId, parentEmail) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      parentEmail: parentEmail,
      updatedAt: serverTimestamp()
    });

    // Sync email to linked user document via student.userId
    const studentSnap = await getDoc(doc(db, 'students', studentId));
    const userId = studentSnap.exists() ? studentSnap.data().userId : null;

    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        email: parentEmail,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send password reset email via Firebase Auth (no plaintext password handling)
export const sendParentPasswordReset = async (parentEmail) => {
  try {
    await sendPasswordResetEmail(auth, parentEmail);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Initialize classes (run once to create default classes)
export const initializeClasses = async () => {
  try {
    const classesRef = collection(db, 'classes');
    const snapshot = await getDocs(classesRef);

    // Only initialize if no classes exist
    if (snapshot.empty) {
      const classes = [1, 2, 3, 4, 5, 6];

      for (const grade of classes) {
        await addDoc(classesRef, {
          grade: grade,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      return { success: true, message: 'Classes initialized' };
    }

    return { success: true, message: 'Classes already exist' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new class
export const addClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete class
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all classes
export const getClasses = async () => {
  try {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, orderBy('grade', 'asc'));
    const snapshot = await getDocs(q);

    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: classes };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle class active status
export const toggleClassStatus = async (classId, currentStatus) => {
  try {
    await updateDoc(doc(db, 'classes', classId), {
      isActive: !currentStatus,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update class data (supports custom tariff override)
export const updateClass = async (classId, classData) => {
  try {
    await updateDoc(doc(db, 'classes', classId), {
      ...classData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get effective tariff for a class (class override → global default)
export const getEffectiveTariff = async (grade) => {
  try {
    const settingsResult = await getSettings();
    const defaultTarif = settingsResult.success ? (settingsResult.data.tarif ?? 100000) : 100000;

    const classesSnap = await getDocs(query(collection(db, 'classes'), where('grade', '==', parseInt(grade))));
    if (!classesSnap.empty) {
      const classData = classesSnap.docs[0].data();
      if (classData.customTarif && classData.customTarif > 0) {
        return classData.customTarif;
      }
    }
    return defaultTarif;
  } catch (_error) {
    return 100000;
  }
};

// ==================== BULK IMPORT ====================

// Bulk add students from array
export const bulkAddStudents = async (studentsData) => {
  try {
    const results = {
      success: [],
      failed: []
    };

    const seenNISN = new Set();

    for (const studentData of studentsData) {
      try {
        // Check duplicate NISN within the import batch itself
        if (studentData.nisn) {
          if (seenNISN.has(studentData.nisn)) {
            results.failed.push({ ...studentData, error: `NISN duplikat dalam file: ${studentData.nisn}` });
            continue;
          }
          seenNISN.add(studentData.nisn);

          // Check duplicate against existing DB
          const existing = await findStudentByNISN(studentData.nisn);
          if (existing) {
            results.failed.push({ ...studentData, error: `NISN ${studentData.nisn} sudah ada di database` });
            continue;
          }
        }

        let userId = null;

        // Create Firebase Auth user if parent email is provided
        if (studentData.parentEmail) {
          try {
            // Use secondary auth to avoid logging out current admin
            const userCredential = await createUserWithEmailAndPassword(
              secondaryAuth,
              studentData.parentEmail,
              'password123'
            );
            userId = userCredential.user.uid;

            // Sign out from secondary auth immediately
            await secondaryAuth.signOut();

            // Create user document
            await setDoc(doc(db, 'users', userId), {
              email: studentData.parentEmail,
              role: 'parent',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (authError) {
            // If user already exists, get existing user
            if (authError.code === 'auth/email-already-in-use') {
              const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', studentData.parentEmail)
              );
              const userSnapshot = await getDocs(usersQuery);
              if (!userSnapshot.empty) {
                userId = userSnapshot.docs[0].id;
              }
            } else {
              throw authError;
            }
          }
        }

        // Add student
        const docRef = await addDoc(collection(db, 'students'), {
          ...studentData,
          userId: userId,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        results.success.push({ ...studentData, id: docRef.id });
      } catch (error) {
        results.failed.push({ ...studentData, error: error.message });
      }
    }

    return {
      success: true,
      results,
      message: `Berhasil: ${results.success.length}, Gagal: ${results.failed.length}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Initialize settings (run once to create default settings)
export const initializeSettings = async () => {
  try {
    const settingsRef = collection(db, 'settings');
    const snapshot = await getDocs(settingsRef);

    // Only initialize if no settings exist
    if (snapshot.empty) {
      await addDoc(settingsRef, {
        tarif: 100000,
        biayaAdmin: 4500,
        schoolName: 'SDN 2 Buwit',
        npsn: '',
        address: '',
        headmaster: '',
        treasurer: '',
        phone: '',
        academicYear: getDefaultAcademicYear(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Settings initialized' };
    }

    return { success: true, message: 'Settings already exist' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get default academic year string (July-June). Mei 2026 → "2025/2026"
export function getDefaultAcademicYear(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  if (m >= 6) return `${y}/${y + 1}`; // Juli (6) ke atas
  return `${y - 1}/${y}`;
}

// Get settings
export const getSettings = async () => {
  try {
    const settingsRef = collection(db, 'settings');
    const snapshot = await getDocs(settingsRef);

    if (!snapshot.empty) {
      const settingsDoc = snapshot.docs[0];
      return {
        success: true,
        data: {
          id: settingsDoc.id,
          ...settingsDoc.data()
        }
      };
    }

    // Return default if no settings exist
    return {
      success: true,
      data: {
        tarif: 100000,
        biayaAdmin: 4500
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update school profile (name, NPSN, address, etc)
export const updateSchoolProfile = async (settingsId, profileData) => {
  try {
    if (!settingsId) {
      const settingsRef = collection(db, 'settings');
      await addDoc(settingsRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'settings', settingsId), {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update tarif
export const updateTarif = async (settingsId, newTarif, newBiayaAdmin) => {
  try {
    if (!settingsId) {
      // Create new settings if not exist
      const settingsRef = collection(db, 'settings');
      await addDoc(settingsRef, {
        tarif: newTarif,
        biayaAdmin: newBiayaAdmin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing settings
      await updateDoc(doc(db, 'settings', settingsId), {
        tarif: newTarif,
        biayaAdmin: newBiayaAdmin,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== PAYMENTS ====================

export const createPayment = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePaymentStatus = async (paymentId, status, paymentData = {}) => {
  try {
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...paymentData
    };

    if (status === 'paid') {
      updateData.paidAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'payments', paymentId), updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate tagihan masal untuk semua siswa
export const generateMonthlyPayments = async (month, year, amount, adminUid) => {
  try {
    // Get all active students
    const studentsQuery = query(
      collection(db, 'students'),
      where('status', '==', 'active')
    );
    const studentsSnapshot = await getDocs(studentsQuery);

    // Check if payments already exist for this month
    const monthString = `${month} ${year}`;
    const existingPaymentsQuery = query(
      collection(db, 'payments'),
      where('month', '==', monthString)
    );
    const existingPayments = await getDocs(existingPaymentsQuery);
    
    if (!existingPayments.empty) {
      return { 
        success: false, 
        error: `Tagihan untuk ${monthString} sudah dibuat sebelumnya` 
      };
    }

    // Get current admin fee from settings
    const settingsResult = await getSettings();
    const adminFee = settingsResult.success ? (settingsResult.data.biayaAdmin ?? 4500) : 4500;

    // Pre-fetch all class tariffs (for per-class override)
    const classesSnap = await getDocs(collection(db, 'classes'));
    const classTariffs = {};
    classesSnap.docs.forEach((d) => {
      const c = d.data();
      if (c.customTarif && c.customTarif > 0) classTariffs[String(c.grade)] = c.customTarif;
    });

    // Create payment for each student (apply class tariff + per-student discount)
    const promises = studentsSnapshot.docs.map(async (studentDoc) => {
      const student = studentDoc.data();
      const dueDate = new Date(year, getMonthNumber(month), 10);

      // Effective amount: per-class override → fallback to default amount
      let baseAmount = classTariffs[String(student.class)] || amount;

      // Apply per-student discount
      const finalAmount = applyDiscount(baseAmount, student);
      const discountApplied = baseAmount - finalAmount;

      return addDoc(collection(db, 'payments'), {
        studentId: studentDoc.id,
        studentName: student.name,
        studentClass: student.class,
        nisn: student.nisn || '',
        month: monthString,
        year: parseInt(year),
        amount: finalAmount,
        baseAmount: baseAmount,
        discountApplied: discountApplied,
        discountType: student.discountType || null,
        discountValue: student.discountValue || 0,
        adminFee: adminFee,
        totalAmount: finalAmount + adminFee,
        status: 'pending',
        dueDate: dueDate,
        paidAt: null,
        paymentMethod: null,
        transactionId: null,
        paymentType: 'spp',
        createdBy: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(promises);

    await logAudit('GENERATE_TAGIHAN', 'payment', {
      month: monthString,
      count: studentsSnapshot.size,
      amount,
      adminFee
    }, adminUid);

    // Hasil email akan dilampirkan ke return value supaya UI bisa kasih notifikasi
    let emailStatus = { sent: 0, failed: 0, skipped: 0, failedEmails: [], error: null };

    try {
      console.log(`Sending email notifications for ${monthString}...`);

      // Frontend kumpulin data student dari Firestore untuk dikirim ke endpoint relay
      const recipients = [];
      let skippedNoEmail = 0;
      for (const studentDoc of studentsSnapshot.docs) {
        const student = studentDoc.data();
        if (!student.parentEmail) {
          skippedNoEmail++;
          continue;
        }

        const baseAmount = classTariffs[String(student.class)] || amount;
        const finalAmount = applyDiscount(baseAmount, student);
        const dueDate = new Date(year, getMonthNumber(month), 10);

        recipients.push({
          studentName: student.name,
          parentEmail: student.parentEmail,
          amount: finalAmount + adminFee,
          dueDate: dueDate.toISOString()
        });
      }

      emailStatus.skipped = skippedNoEmail;

      if (recipients.length === 0) {
        console.log('Tidak ada siswa dengan parentEmail — email notification dilewati');
      } else {
        const isProduction = typeof window !== 'undefined' &&
                             window.location.hostname !== 'localhost' &&
                             window.location.hostname !== '127.0.0.1';
        const apiBase = isProduction ? '' : 'http://localhost:3001';
        const apiUrl = `${apiBase}/api/email/send-bulk-notification`;

        const emailResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month, year, recipients })
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            emailStatus.sent = emailResult.sent || 0;
            emailStatus.failed = emailResult.failed || 0;
            emailStatus.failedEmails = emailResult.failedEmails || [];
          } else {
            emailStatus.error = emailResult.error || 'Unknown email API error';
          }
        } else {
          const errorText = await emailResponse.text();
          emailStatus.error = `API ${emailResponse.status}: ${errorText.slice(0, 200)}`;
        }
      }
    } catch (emailError) {
      emailStatus.error = emailError.message;
      console.error('Failed to send email notifications:', emailError.message);
    }

    return {
      success: true,
      count: studentsSnapshot.size,
      emailStatus,
      message: `Berhasil membuat ${studentsSnapshot.size} tagihan untuk ${monthString}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sync payment status from Duitku check-status response (callback fallback)
// Dipakai saat user balik ke app dari Duitku — kalau callback belum/gagal masuk,
// client manggil ini untuk pull status terbaru dan update Firestore.
export const confirmPaymentFromDuitku = async (merchantOrderId) => {
  try {
    const q = query(collection(db, 'payments'), where('merchantOrderId', '==', merchantOrderId));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Tagihan tidak ditemukan' };

    const paymentDoc = snap.docs[0];
    const paymentData = paymentDoc.data();

    // Idempotency
    if (paymentData.status === 'paid') {
      return { success: true, alreadyPaid: true, payment: { id: paymentDoc.id, ...paymentData } };
    }

    // Ask backend Duitku for latest status
    const { checkTransactionStatus } = await import('./duitkuService');
    const statusRes = await checkTransactionStatus(merchantOrderId);
    if (!statusRes.success) {
      return { success: false, error: statusRes.error || 'Gagal cek status' };
    }

    // statusCode '00' = success
    if (statusRes.statusCode !== '00') {
      return { success: false, pending: true, message: 'Pembayaran masih pending atau gagal' };
    }

    // Validate amount
    const expectedAmount = paymentData.totalAmount ?? paymentData.amount;
    if (statusRes.amount && parseFloat(statusRes.amount) !== parseFloat(expectedAmount)) {
      return { success: false, error: 'Amount mismatch' };
    }

    // Mark as paid
    await updateDoc(doc(db, 'payments', paymentDoc.id), {
      status: 'paid',
      paidAt: serverTimestamp(),
      paymentMethod: paymentData.paymentMethod || 'DUITKU',
      reference: statusRes.reference || paymentData.reference || null,
      paymentChannel: 'duitku',
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'transactions'), {
      paymentId: paymentDoc.id,
      merchantOrderId,
      method: paymentData.paymentMethod || 'DUITKU',
      channel: 'duitku',
      reference: statusRes.reference || null,
      status: 'success',
      createdAt: serverTimestamp()
    });

    return { success: true, payment: { id: paymentDoc.id, ...paymentData, status: 'paid' } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Parent requests to pay via cash at school (admin will confirm later)
export const requestCashPayment = async (paymentId, details = {}) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      cashPending: true,
      cashRequest: {
        plannedDate: details.plannedDate ? new Date(details.plannedDate) : null,
        note: details.note || '',
        parentName: details.parentName || '',
        parentPhone: details.parentPhone || '',
        requestedAt: new Date()
      },
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Cancel cash payment request
export const cancelCashPayment = async (paymentId) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      cashPending: false,
      cashRequest: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Mark payment as paid manually (cash/transfer received by school)
export const markPaymentAsPaidManual = async (paymentId, details, adminUid) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'paid',
      paidAt: details.paidAt ? new Date(details.paidAt) : serverTimestamp(),
      paymentMethod: details.method || 'CASH',
      paymentChannel: 'manual',
      receivedBy: details.receivedBy || '',
      manualNote: details.note || '',
      manualReceiptNumber: details.receiptNumber || '',
      confirmedBy: adminUid || null,
      updatedAt: serverTimestamp()
    });

    // Create transaction record for consistency
    await addDoc(collection(db, 'transactions'), {
      paymentId: paymentId,
      method: details.method || 'CASH',
      channel: 'manual',
      receivedBy: details.receivedBy || '',
      note: details.note || '',
      status: 'success',
      createdAt: serverTimestamp()
    });

    try {
      const paymentSnap = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentSnap.data();
      if (paymentData?.studentId) {
        const studentSnap = await getDoc(doc(db, 'students', paymentData.studentId));
        const student = studentSnap.data();

        if (student?.parentEmail) {
          try {
            const isProduction = typeof window !== 'undefined' &&
                                 window.location.hostname !== 'localhost' &&
                                 window.location.hostname !== '127.0.0.1';
            const apiBase = isProduction ? '' : 'http://localhost:3001';

            // Parse month/year dari format "Mei 2026"
            const [monthName, yearStr] = (paymentData.month || '').split(' ');

            await fetch(`${apiBase}/api/email/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentName: paymentData.studentName || student.name,
                parentEmail: student.parentEmail,
                month: monthName || '',
                year: yearStr || '',
                amount: paymentData.totalAmount || paymentData.amount,
                paymentDate: details.paidAt || new Date().toISOString(),
                paymentMethod: details.method || 'CASH',
                referenceNumber: details.receiptNumber || paymentId
              })
            });
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update single payment (admin can fix wrong amount/dueDate)
export const updatePayment = async (paymentId, updates) => {
  try {
    const payload = { ...updates, updatedAt: serverTimestamp() };

    // If amount changes, recalculate totalAmount with current adminFee
    if (typeof updates.amount === 'number') {
      const adminFee = typeof updates.adminFee === 'number'
        ? updates.adminFee
        : (await (async () => {
            const res = await getSettings();
            return res.success ? (res.data.biayaAdmin ?? 4500) : 4500;
          })());
      payload.adminFee = adminFee;
      payload.totalAmount = updates.amount + adminFee;
    }

    await updateDoc(doc(db, 'payments', paymentId), payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== AUDIT LOG ====================

// Log admin action for audit trail (BOS / kepsek bisa review)
export const logAudit = async (action, entity, details = {}, adminUid = null) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,          // mis: 'GENERATE_TAGIHAN', 'DELETE_PAYMENT', 'PROMOTE_CLASS', 'EDIT_PAYMENT', 'MANUAL_PAYMENT'
      entity,          // mis: 'payment', 'student', 'settings'
      entityId: details.entityId || null,
      details: details,
      adminUid,
      adminEmail: details.adminEmail || null,
      ip: null,        // tidak available di client
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRecentAuditLogs = async (limit = 100) => {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return {
      success: true,
      data: snap.docs.slice(0, limit).map((d) => ({ id: d.id, ...d.data() }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== PAYMENT TYPES (Jenis Pembayaran) ====================

export const initializePaymentTypes = async () => {
  try {
    const ref = collection(db, 'paymentTypes');
    const snap = await getDocs(ref);
    if (snap.empty) {
      const defaults = [
        { code: 'spp', name: 'Sumbangan Sukarela Bulanan', recurring: 'monthly', defaultAmount: 100000, active: true },
        { code: 'pangkal', name: 'Uang Pangkal', recurring: 'once', defaultAmount: 500000, active: true },
        { code: 'ujian', name: 'Uang Ujian Semester', recurring: 'semester', defaultAmount: 75000, active: true },
        { code: 'buku', name: 'Uang Buku & LKS', recurring: 'yearly', defaultAmount: 250000, active: true },
        { code: 'seragam', name: 'Uang Seragam', recurring: 'once', defaultAmount: 350000, active: true }
      ];
      for (const t of defaults) {
        await addDoc(ref, { ...t, createdAt: serverTimestamp() });
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addPaymentType = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'paymentTypes'), {
      ...data,
      active: true,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePaymentType = async (id, data) => {
  try {
    await updateDoc(doc(db, 'paymentTypes', id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePaymentType = async (id) => {
  try {
    await deleteDoc(doc(db, 'paymentTypes', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== DISCOUNTS (per siswa) ====================

// Set or update a student discount (percent OR fixed amount)
export const setStudentDiscount = async (studentId, discount) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      discountType: discount.type || null,    // 'percent' | 'fixed' | null
      discountValue: discount.value || 0,
      discountReason: discount.reason || '',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Calculate effective amount for a student after applying discount
export const applyDiscount = (baseAmount, student) => {
  if (!student?.discountType || !student?.discountValue) return baseAmount;
  if (student.discountType === 'percent') {
    return Math.max(0, Math.round(baseAmount * (1 - student.discountValue / 100)));
  }
  if (student.discountType === 'fixed') {
    return Math.max(0, baseAmount - student.discountValue);
  }
  return baseAmount;
};

// Promote all active students to next grade (end of academic year)
// Kelas 6 → status "graduated" (lulus), kelas 1-5 → grade+1
export const promoteAllStudents = async (adminUid) => {
  try {
    const q = query(collection(db, 'students'), where('status', '==', 'active'));
    const snap = await getDocs(q);

    let promoted = 0;
    let graduated = 0;
    const errors = [];

    for (const studentDoc of snap.docs) {
      const data = studentDoc.data();
      const currentGrade = parseInt(data.class);
      if (isNaN(currentGrade)) {
        errors.push(`${data.name}: kelas tidak valid (${data.class})`);
        continue;
      }

      try {
        if (currentGrade >= 6) {
          await updateDoc(doc(db, 'students', studentDoc.id), {
            status: 'graduated',
            graduatedAt: serverTimestamp(),
            promotedBy: adminUid || null,
            updatedAt: serverTimestamp()
          });
          graduated++;
        } else {
          await updateDoc(doc(db, 'students', studentDoc.id), {
            class: String(currentGrade + 1),
            promotedFrom: String(currentGrade),
            promotedAt: serverTimestamp(),
            promotedBy: adminUid || null,
            updatedAt: serverTimestamp()
          });
          promoted++;
        }
      } catch (e) {
        errors.push(`${data.name}: ${e.message}`);
      }
    }

    return {
      success: true,
      promoted,
      graduated,
      errors,
      message: `${promoted} siswa naik kelas, ${graduated} siswa lulus`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a single payment document (admin cleanup)
export const deletePayment = async (paymentId) => {
  try {
    await deleteDoc(doc(db, 'payments', paymentId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Find payments matching given amount (cek totalAmount & amount). Returns list for preview.
export const findPaymentsByAmount = async (amount) => {
  try {
    const snap = await getDocs(collection(db, 'payments'));
    const target = parseInt(amount);
    const matches = [];
    snap.docs.forEach((d) => {
      const p = d.data();
      if (p.totalAmount === target || p.amount === target) {
        matches.push({ id: d.id, ...p });
      }
    });
    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete all payments matching given amount (admin cleanup utk data dummy/test)
export const deletePaymentsByAmount = async (amount) => {
  try {
    const found = await findPaymentsByAmount(amount);
    if (!found.success) return found;
    if (found.data.length === 0) return { success: true, count: 0 };

    const deletions = found.data.map((p) => deleteDoc(doc(db, 'payments', p.id)));
    await Promise.all(deletions);
    return { success: true, count: found.data.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete all payments for a given month/year (admin bulk cleanup)
export const deletePaymentsByMonth = async (month, year) => {
  try {
    const monthString = `${month} ${year}`;
    const q = query(collection(db, 'payments'), where('month', '==', monthString));
    const snapshot = await getDocs(q);

    const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, 'payments', d.id)));
    await Promise.all(deletions);

    return { success: true, count: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper function to convert month name to number
const getMonthNumber = (monthName) => {
  const months = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
    'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
    'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  };
  return months[monthName] || 0;
};

// ==================== TRANSACTIONS ====================

export const createTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      ...transactionData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== SETTINGS ====================

export const updateSettings = async (settingId, settingsData) => {
  try {
    await updateDoc(doc(db, 'settings', settingId), {
      ...settingsData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== NOTIFICATIONS ====================

export const createNotification = async (userId, notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      userId,
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
