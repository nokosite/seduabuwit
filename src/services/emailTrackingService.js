import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const markEmailAsSent = async (paymentId, emailType = 'reminder') => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      [`${emailType}EmailSent`]: true,
      [`${emailType}EmailSentAt`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking email as sent:', error);
    return { success: false, error: error.message };
  }
};

export const getEmailHistory = async (paymentId) => {
  try {
    const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
    if (!paymentDoc.exists()) {
      return { success: false, error: 'Payment not found' };
    }
    
    const data = paymentDoc.data();
    return {
      success: true,
      data: {
        reminderEmailSent: data.reminderEmailSent || false,
        reminderEmailSentAt: data.reminderEmailSentAt || null,
        confirmationEmailSent: data.confirmationEmailSent || false,
        confirmationEmailSentAt: data.confirmationEmailSentAt || null
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
