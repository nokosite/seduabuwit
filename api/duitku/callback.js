/**
 * Duitku Callback Handler
 *
 * This endpoint receives payment notifications from Duitku
 * when a payment is successful.
 *
 * Endpoint: POST /api/duitku/callback
 */

import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

/**
 * Generate signature for verification
 */
function generateSignature(merchantCode, amount, merchantOrderId, apiKey) {
  const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Main callback handler
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get callback data from Duitku
    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature,
      publisherOrderId,
      spUserHash,
      settlementDate,
      issuerCode
    } = req.body;

    // Verify signature
    const apiKey = process.env.DUITKU_API_KEY;
    const expectedSignature = generateSignature(
      merchantCode,
      amount,
      merchantOrderId,
      apiKey
    );

    if (signature !== expectedSignature) {
      return res.status(200).json({
        success: false,
        message: 'Invalid signature - logged for review'
      });
    }

    // resultCode: 00 = Success, 01 = Pending, 02 = Failed
    if (resultCode !== '00') {
      return res.status(200).json({
        success: true,
        message: 'Callback received but payment not successful'
      });
    }

    // Update payment status in Firestore
    // Find payment document by merchantOrderId field
    const paymentsRef = db.collection('payments');
    const querySnapshot = await paymentsRef
      .where('merchantOrderId', '==', merchantOrderId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return res.status(200).json({
        success: false,
        message: 'Payment not found - logged for review'
      });
    }

    const paymentDoc = querySnapshot.docs[0];
    const paymentRef = paymentDoc.ref;
    const paymentData = paymentDoc.data();

    // Idempotency: already processed
    if (paymentData.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already processed'
      });
    }

    // Validate amount matches (compare against totalAmount = Sumbangan Sukarela + admin fee)
    const expectedAmount = paymentData.totalAmount ?? paymentData.amount;
    if (parseFloat(amount) !== parseFloat(expectedAmount)) {
      return res.status(200).json({
        success: false,
        message: 'Amount mismatch - logged for review'
      });
    }

    // Update payment document
    await paymentRef.update({
      status: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: paymentCode,
      reference: reference,
      publisherOrderId: publisherOrderId || null,
      settlementDate: settlementDate || null,
      issuerCode: issuerCode || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const transactionData = {
      paymentId: merchantOrderId,
      studentId: paymentData.studentId,
      studentName: paymentData.studentName,
      amount: parseInt(amount),
      paymentMethod: paymentCode,
      reference: reference,
      status: 'success',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').add(transactionData);

    try {
      // Ambil parentEmail dari student doc
      const studentSnap = await db.collection('students').doc(paymentData.studentId).get();
      const studentData = studentSnap.exists ? studentSnap.data() : null;

      if (studentData?.parentEmail) {
        const [monthName, yearStr] = (paymentData.month || '').split(' ');
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';

        await fetch(`${baseUrl}/api/email/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: paymentData.studentName || studentData.name,
            parentEmail: studentData.parentEmail,
            month: monthName || '',
            year: yearStr || '',
            amount: parseInt(amount),
            paymentDate: new Date().toISOString(),
            paymentMethod: paymentCode,
            referenceNumber: reference || merchantOrderId
          })
        });
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      message: 'Error logged for manual processing',
      error: error.message
    });
  }
}
