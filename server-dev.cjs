/**
 * Development Proxy Server for Duitku API & Email Notifications
 * Run: npm run dev:api
 *
 * This server proxies requests to Duitku API and handles email notifications
 * to avoid CORS issues and keeps API keys secure during development.
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'SDN 2 Buwit <onboarding@resend.dev>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'seduabuwit@gmail.com';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

function buildBillEmailHTML({ studentName, month, year, amount, dueDate }) {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:500px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <div style="background:#10B981;color:white;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Tagihan Sumbangan Sukarela Baru</h1>
          <p style="margin:8px 0 0 0;opacity:0.9;font-size:14px;">SDN 2 Buwit</p>
        </div>
        <div style="padding:24px;">
          <p>Yth. Orang Tua/Wali dari <strong>${studentName}</strong>,</p>
          <p>Tagihan Sumbangan Sukarela untuk bulan <strong>${month} ${year}</strong> telah dibuat.</p>
          <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Periode:</strong> ${month} ${year}</p>
            <p style="margin:4px 0;"><strong>Jatuh Tempo:</strong> ${formatDate(dueDate)}</p>
            <p style="margin:4px 0;"><strong>Jumlah:</strong> <span style="color:#10B981;font-size:18px;font-weight:bold;">${formatCurrency(amount)}</span></p>
          </div>
          <p style="font-size:13px;color:#6b7280;">Silakan login ke portal pembayaran untuk melakukan pembayaran.</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
          <strong>SDN 2 Buwit</strong><br>Email: ${REPLY_TO}
        </div>
      </div>
    </body></html>
  `;
}

// Duitku Configuration
const DUITKU_CONFIG = {
  merchantCode: 'DS30269',
  apiKey: 'd4dff63d806898d3f02315e894b0063c',
  sandboxUrl: 'https://sandbox.duitku.com'
};

// Helper: Get current datetime in Duitku format
function getCurrentDatetime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 1. Get Payment Methods
app.post('/api/duitku/get-payment-methods', async (req, res) => {
  try {
    const { amount } = req.body;
    const datetime = getCurrentDatetime();

    // Generate signature: SHA256(merchantCode + amount + datetime + apiKey)
    const signature = crypto
      .createHash('sha256')
      .update(`${DUITKU_CONFIG.merchantCode}${amount}${datetime}${DUITKU_CONFIG.apiKey}`)
      .digest('hex');

    const response = await fetch(
      `${DUITKU_CONFIG.sandboxUrl}/webapi/api/merchant/paymentmethod/getpaymentmethod`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantcode: DUITKU_CONFIG.merchantCode,
          amount: amount,
          datetime: datetime,
          signature: signature
        })
      }
    );

    const result = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        data: result.paymentFee || []
      });
    } else {
      res.json({
        success: false,
        message: result.Message || 'Failed to get payment methods'
      });
    }
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 2. Create Transaction
app.post('/api/duitku/create-transaction', async (req, res) => {
  try {
    const {
      paymentMethod,
      paymentAmount,
      merchantOrderId,
      productDetails,
      customerVaName,
      email,
      phoneNumber = '08123456789',
      expiryPeriod = 1440
    } = req.body;

    // Generate signature: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
    const signature = crypto
      .createHash('md5')
      .update(`${DUITKU_CONFIG.merchantCode}${merchantOrderId}${paymentAmount}${DUITKU_CONFIG.apiKey}`)
      .digest('hex');

    // Callback and return URLs (use Cloudflare Tunnel URL if available)
    const baseUrl = process.env.CALLBACK_BASE_URL || 'http://localhost:3001';

    const response = await fetch(
      `${DUITKU_CONFIG.sandboxUrl}/webapi/api/merchant/v2/inquiry`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCode: DUITKU_CONFIG.merchantCode,
          paymentAmount: paymentAmount,
          paymentMethod: paymentMethod,
          merchantOrderId: merchantOrderId,
          productDetails: productDetails,
          customerVaName: customerVaName.toUpperCase().substring(0, 20),
          email: email,
          phoneNumber: phoneNumber,
          callbackUrl: `${baseUrl}/api/duitku/callback`,
          returnUrl: `${baseUrl}/api/duitku/return`,
          signature: signature,
          expiryPeriod: expiryPeriod
        })
      }
    );

    const result = await response.json();

    if (response.ok && result.statusCode === '00') {
      res.json({
        success: true,
        data: {
          reference: result.reference,
          vaNumber: result.vaNumber,
          qrString: result.qrString,
          amount: result.amount,
          paymentUrl: result.paymentUrl,
          merchantOrderId: merchantOrderId
        }
      });
    } else {
      res.json({
        success: false,
        message: result.statusMessage || 'Failed to create transaction',
        code: result.statusCode
      });
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 3. Check Transaction Status
app.post('/api/duitku/check-status', async (req, res) => {
  try {
    const { merchantOrderId } = req.body;

    // Generate signature: MD5(merchantCode + merchantOrderId + apiKey)
    const signature = crypto
      .createHash('md5')
      .update(`${DUITKU_CONFIG.merchantCode}${merchantOrderId}${DUITKU_CONFIG.apiKey}`)
      .digest('hex');

    const response = await fetch(
      `${DUITKU_CONFIG.sandboxUrl}/webapi/api/merchant/transactionStatus`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCode: DUITKU_CONFIG.merchantCode,
          merchantOrderId: merchantOrderId,
          signature: signature
        })
      }
    );

    const result = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        status: result.statusMessage,
        statusCode: result.statusCode,
        amount: result.amount,
        reference: result.reference
      });
    } else {
      res.json({
        success: false,
        message: result.statusMessage || 'Failed to check status'
      });
    }
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 4. Callback Handler (receives notification from Duitku)
app.post('/api/duitku/callback', async (req, res) => {
  try {
    console.log('📥 Callback received from Duitku:', req.body);

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
      signature
    } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${merchantOrderId}${DUITKU_CONFIG.apiKey}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature!');
      return res.status(200).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Check result code
    if (resultCode === '00') {
      console.log('✅ Payment SUCCESS:', merchantOrderId);

      // TODO: Update Firestore payment status here
      // You'll need to add Firebase Admin SDK to this server

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully'
      });
    } else {
      console.log('⚠️ Payment not successful, resultCode:', resultCode);
      res.status(200).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Error processing callback:', error);
    // Always return 200 to prevent Duitku retry
    res.status(200).json({
      success: false,
      message: 'Error logged for manual processing'
    });
  }
});

// 5. Return Handler (user redirected here after payment)
app.get('/api/duitku/return', (req, res) => {
  const { merchantOrderId, resultCode } = req.query;
  console.log('🔙 Return from Duitku:', { merchantOrderId, resultCode });

  // Redirect to frontend
  res.redirect(`http://localhost:5173/payment/success?orderId=${merchantOrderId}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev Proxy Server is running' });
});

// 6. Email Bulk Notification — terima recipients langsung dari frontend (tanpa Firebase Admin)
app.post('/api/email/send-bulk-notification', async (req, res) => {
  try {
    const { month, year, recipients } = req.body;

    if (!month || !year || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'month, year, and recipients[] are required'
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'recipients[] kosong' });
    }

    console.log(`[Email] Processing ${recipients.length} recipients for ${month} ${year}`);

    const sentEmails = [];
    const failedEmails = [];

    for (const r of recipients) {
      if (!r.parentEmail || !r.studentName) {
        failedEmails.push({ studentName: r.studentName || '?', reason: 'Missing fields' });
        continue;
      }

      try {
        const dueDate = r.dueDate ? new Date(r.dueDate) : new Date();
        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [r.parentEmail],
          reply_to: REPLY_TO,
          subject: `Tagihan Sumbangan Sukarela ${month} ${year} - ${r.studentName}`,
          html: buildBillEmailHTML({
            studentName: r.studentName,
            month,
            year,
            amount: r.amount,
            dueDate
          })
        });

        if (result?.error) {
          console.error(`[Email] ✗ Resend error for ${r.parentEmail}:`, result.error.message);
          failedEmails.push({
            studentName: r.studentName,
            email: r.parentEmail,
            reason: result.error.message
          });
        } else {
          console.log(`[Email] ✓ Sent to ${r.parentEmail}`);
          sentEmails.push({ studentName: r.studentName, email: r.parentEmail });
        }
      } catch (error) {
        console.error(`[Email] ✗ Failed:`, error.message);
        failedEmails.push({
          studentName: r.studentName,
          email: r.parentEmail,
          reason: error.message
        });
      }
    }

    console.log(`[Email] Summary: ${sentEmails.length} sent, ${failedEmails.length} failed`);

    res.status(200).json({
      success: true,
      sent: sentEmails.length,
      failed: failedEmails.length,
      sentEmails,
      failedEmails
    });
  } catch (error) {
    console.error('[Email] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6b. Email Reminder — single reminder ke 1 ortu (dari tombol Kirim Reminder per row)
app.post('/api/email/send-reminder', async (req, res) => {
  try {
    const { parentEmail, studentName, month, year, amount, dueDate } = req.body;

    if (!parentEmail || !studentName) {
      return res.status(400).json({
        success: false,
        error: 'parentEmail and studentName are required'
      });
    }

    const dueDateObj = dueDate ? new Date(dueDate) : new Date();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [parentEmail],
      reply_to: REPLY_TO,
      subject: `Reminder: Tagihan Sumbangan Sukarela ${month} ${year} - ${studentName}`,
      html: buildBillEmailHTML({
        studentName,
        month,
        year,
        amount,
        dueDate: dueDateObj
      })
    });

    if (result?.error) {
      console.error(`[Email Reminder] ✗ ${parentEmail}:`, result.error.message);
      return res.status(500).json({ success: false, error: result.error.message });
    }

    console.log(`[Email Reminder] ✓ Sent to ${parentEmail}`);
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error('[Email Reminder] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Email Confirmation — terima data payment langsung dari frontend (untuk manual payment & callback)
app.post('/api/email/send-confirmation', async (req, res) => {
  try {
    const {
      studentName,
      parentEmail,
      month,
      year,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber
    } = req.body;

    if (!parentEmail || !studentName) {
      return res.status(400).json({
        success: false,
        error: 'parentEmail and studentName are required'
      });
    }

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;padding:20px;">
        <div style="max-width:500px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="background:#10b981;color:white;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:20px;">✓ Pembayaran Berhasil</h1>
            <p style="margin:8px 0 0 0;opacity:0.9;font-size:14px;">Terima kasih atas pembayaran Sumbangan Sukarela Anda</p>
          </div>
          <div style="padding:24px;">
            <p>Yth. Orang Tua/Wali <strong>${studentName}</strong>,</p>
            <p>Pembayaran Sumbangan Sukarela telah berhasil kami terima:</p>
            <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Periode:</strong> ${month} ${year}</p>
              <p style="margin:4px 0;"><strong>Tanggal:</strong> ${formatDate(paymentDate || new Date())}</p>
              <p style="margin:4px 0;"><strong>Metode:</strong> ${paymentMethod || 'Manual'}</p>
              <p style="margin:4px 0;"><strong>Jumlah:</strong> <span style="color:#10b981;font-size:18px;font-weight:bold;">${formatCurrency(amount)}</span></p>
            </div>
            ${referenceNumber ? `<div style="background:#fef3c7;padding:12px;border-radius:8px;text-align:center;"><strong style="color:#92400e;font-size:12px;">REF:</strong> <code>${referenceNumber}</code></div>` : ''}
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
            <strong>SDN 2 Buwit</strong><br>Email: ${REPLY_TO}
          </div>
        </div>
      </body></html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [parentEmail],
      reply_to: REPLY_TO,
      subject: `Konfirmasi Pembayaran Sumbangan Sukarela ${month || ''} ${year || ''}`,
      html
    });

    if (result?.error) {
      console.error(`[Email Confirmation] ✗ for ${parentEmail}:`, result.error.message);
      return res.status(500).json({ success: false, error: result.error.message });
    }

    console.log(`[Email Confirmation] ✓ Sent to ${parentEmail}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Email Confirmation] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Development Proxy Server                               ║
║                                                            ║
║  Server running on: http://localhost:${PORT}                 ║
║  Environment: Development                                  ║
║                                                            ║
║  Endpoints:                                                ║
║  - POST /api/duitku/get-payment-methods                    ║
║  - POST /api/duitku/create-transaction                     ║
║  - POST /api/duitku/check-status                           ║
║  - POST /api/duitku/callback                               ║
║  - GET  /api/duitku/return                                 ║
║  - POST /api/email/send-bulk-notification                  ║
║  - POST /api/email/send-reminder                           ║
║  - POST /api/email/send-confirmation                       ║
║  - GET  /health                                            ║
║                                                            ║
║  💡 Tip: Run 'npm run dev:full' to start both servers     ║
╚════════════════════════════════════════════════════════════╝
  `);
});
