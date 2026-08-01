import { markEmailAsSent } from './emailTrackingService';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
};

const generateReminderHTML = ({ studentName, month, year, amount, dueDate, paymentLink }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 40px 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .header {
          background: linear-gradient(135deg, #047857 0%, #059669 25%, #10B981 75%, #34D399 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          height: 20px;
          background: white;
          border-radius: 20px 20px 0 0;
        }
        .logo-icon {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 32px;
        }
        .header h1 {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
          color: rgba(255,255,255,0.95);
          font-size: 15px;
          font-weight: 500;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .alert-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 24px 0;
          display: flex;
          align-items: start;
          gap: 12px;
        }
        .alert-icon {
          font-size: 24px;
          color: #f59e0b;
          flex-shrink: 0;
        }
        .alert-text {
          font-size: 14px;
          color: #92400e;
          line-height: 1.5;
        }
        .info-card {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px dashed #d1d5db;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .info-row:first-child {
          padding-top: 0;
        }
        .info-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        .info-icon {
          font-size: 20px;
          color: #10b981;
        }
        .info-value {
          font-weight: 700;
          color: #111827;
          font-size: 15px;
          text-align: right;
        }
        .amount-highlight {
          background: linear-gradient(135deg, #047857 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 24px;
          font-weight: 800;
        }
        .cta-button {
          display: block;
          background: linear-gradient(135deg, #047857 0%, #059669 25%, #10B981 75%, #34D399 100%);
          color: white;
          text-align: center;
          padding: 18px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          margin: 32px 0;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
        }
        .footer-note {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f3f4f6;
        }
        .footer {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-school {
          font-weight: 700;
          color: #047857;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .footer-address {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        }
        .footer-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #047857 0%, #10b981 100%);
          margin: 16px auto;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo-icon">🏫</div>
          <h1>SDN 2 Buwit</h1>
          <p>Sistem Pembayaran Sumbangan Sukarela Online</p>
        </div>
        
        <div class="content">
          <p class="greeting">
            Yth. Orang Tua/Wali dari<br>
            <strong style="color: #047857; font-size: 18px;">${studentName}</strong>
          </p>
          
          <div class="alert-box">
            <div class="alert-icon">⚠️</div>
            <div class="alert-text">
              <strong>Pengingat Pembayaran</strong><br>
              Tagihan Sumbangan Sukarela berikut masih belum lunas. Mohon segera melakukan pembayaran sebelum jatuh tempo.
            </div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">📅</span>
                <span>Periode</span>
              </div>
              <div class="info-value">${month} ${year}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">⏰</span>
                <span>Jatuh Tempo</span>
              </div>
              <div class="info-value">${formatDate(dueDate)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">💰</span>
                <span>Total Tagihan</span>
              </div>
              <div class="info-value amount-highlight">${formatCurrency(amount)}</div>
            </div>
          </div>
          
          <a href="${paymentLink}" class="cta-button">
            💳 Bayar Sekarang
          </a>
          
          <div class="footer-note">
            Jika Anda sudah melakukan pembayaran, mohon abaikan email ini.<br>
            Untuk bantuan, hubungi admin sekolah.
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-school">SDN 2 Buwit</div>
          <div class="footer-divider"></div>
          <div class="footer-address">
            Jl. Sukun No. 8, Kedampang<br>
            Kerobokan Kuta, Bali, Indonesia
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePaymentConfirmationHTML = ({ 
  studentName, 
  month, 
  year, 
  amount, 
  paymentDate, 
  referenceNumber,
  paymentMethod 
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 40px 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .header {
          background: linear-gradient(135deg, #047857 0%, #059669 25%, #10B981 75%, #34D399 100%);
          padding: 50px 30px;
          text-align: center;
          position: relative;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          height: 20px;
          background: white;
          border-radius: 20px 20px 0 0;
        }
        .success-badge {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 48px;
          animation: scaleIn 0.5s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .header h1 {
          color: white;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
          color: rgba(255,255,255,0.95);
          font-size: 15px;
          font-weight: 500;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .success-message {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-left: 4px solid #10b981;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 24px 0;
          display: flex;
          align-items: start;
          gap: 12px;
        }
        .success-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        .success-text {
          font-size: 14px;
          color: #065f46;
          line-height: 1.5;
          font-weight: 600;
        }
        .info-card {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          border: 2px solid #a7f3d0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px dashed #6ee7b7;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .info-row:first-child {
          padding-top: 0;
        }
        .info-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #065f46;
          font-size: 14px;
          font-weight: 600;
        }
        .info-icon {
          font-size: 20px;
        }
        .info-value {
          font-weight: 700;
          color: #064e3b;
          font-size: 15px;
          text-align: right;
        }
        .amount-highlight {
          background: linear-gradient(135deg, #047857 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 24px;
          font-weight: 800;
        }
        .reference-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          text-align: center;
          border: 2px solid #fbbf24;
        }
        .reference-label {
          font-size: 12px;
          color: #92400e;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .reference-code {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: 800;
          color: #78350f;
          letter-spacing: 2px;
          padding: 12px;
          background: rgba(255,255,255,0.5);
          border-radius: 8px;
          word-break: break-all;
        }
        .footer-note {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f3f4f6;
        }
        .footer {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-school {
          font-weight: 700;
          color: #047857;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .footer-address {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        }
        .footer-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #047857 0%, #10b981 100%);
          margin: 16px auto;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="success-badge">✅</div>
          <h1>Pembayaran Berhasil!</h1>
          <p>SDN 2 Buwit</p>
        </div>
        
        <div class="content">
          <p class="greeting">
            Yth. Orang Tua/Wali dari<br>
            <strong style="color: #047857; font-size: 18px;">${studentName}</strong>
          </p>
          
          <div class="success-message">
            <div class="success-icon">🎉</div>
            <div class="success-text">
              Terima kasih! Pembayaran Sumbangan Sukarela Anda telah berhasil kami terima dan diproses.
            </div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">📅</span>
                <span>Periode</span>
              </div>
              <div class="info-value">${month} ${year}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">📆</span>
                <span>Tanggal Bayar</span>
              </div>
              <div class="info-value">${formatDate(paymentDate)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">💳</span>
                <span>Metode</span>
              </div>
              <div class="info-value">${paymentMethod}</div>
            </div>
            <div class="info-row">
              <div class="info-label">
                <span class="info-icon">💰</span>
                <span>Jumlah Dibayar</span>
              </div>
              <div class="info-value amount-highlight">${formatCurrency(amount)}</div>
            </div>
          </div>
          
          <div class="reference-card">
            <div class="reference-label">📋 NOMOR REFERENSI</div>
            <div class="reference-code">${referenceNumber}</div>
          </div>
          
          <div class="footer-note">
            💾 Simpan email ini sebagai bukti pembayaran resmi.<br>
            Untuk pertanyaan, hubungi admin sekolah dengan menyertakan nomor referensi.
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-school">SDN 2 Buwit</div>
          <div class="footer-divider"></div>
          <div class="footer-address">
            Jl. Sukun No. 8, Kedampang<br>
            Kerobokan Kuta, Bali, Indonesia
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendPaymentReminder = async ({
  parentEmail,
  studentName,
  month,
  year,
  amount,
  dueDate,
  studentId,
  tagihanId
}) => {
  try {
    const isProduction = typeof window !== 'undefined' &&
                         window.location.hostname !== 'localhost' &&
                         window.location.hostname !== '127.0.0.1';
    const apiBase = isProduction ? '' : 'http://localhost:3001';
    const apiUrl = `${apiBase}/api/email/send-reminder`;

    console.log('📧 Sending reminder email to:', parentEmail, 'via', apiUrl);

    // Normalize dueDate: Firestore Timestamp punya .toDate(), Date punya .toISOString()
    let dueDateISO = null;
    if (dueDate) {
      const d = typeof dueDate.toDate === 'function' ? dueDate.toDate() : new Date(dueDate);
      if (!isNaN(d.getTime())) dueDateISO = d.toISOString();
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentEmail,
        studentName,
        month,
        year,
        amount,
        dueDate: dueDateISO,
        studentId,
        tagihanId
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Failed to send reminder email:', result.error);
      return { success: false, error: result.error };
    }

    // Hanya tandai kalau ada tagihanId valid (skip untuk testing curl atau call manual)
    if (tagihanId) {
      await markEmailAsSent(tagihanId, 'reminder');
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Error sending reminder email:', err);
    return { success: false, error: err.message };
  }
};

export const sendPaymentConfirmation = async ({
  parentEmail,
  studentName,
  month,
  year,
  amount,
  paymentDate,
  referenceNumber,
  paymentMethod,
  studentId
}) => {
  try {
    const isProduction = typeof window !== 'undefined' &&
                         window.location.hostname !== 'localhost' &&
                         window.location.hostname !== '127.0.0.1';
    const apiBase = isProduction ? '' : 'http://localhost:3001';

    // Normalize paymentDate: handle Firestore Timestamp atau Date object
    let paymentDateISO = null;
    if (paymentDate) {
      const d = typeof paymentDate.toDate === 'function' ? paymentDate.toDate() : new Date(paymentDate);
      if (!isNaN(d.getTime())) paymentDateISO = d.toISOString();
    }

    const response = await fetch(`${apiBase}/api/email/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentEmail,
        studentName,
        month,
        year,
        amount,
        paymentDate: paymentDateISO,
        referenceNumber,
        paymentMethod,
        studentId
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Failed to send confirmation email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    return { success: false, error: err.message };
  }
};

export const sendBatchReminders = async (reminders) => {
  const results = {
    success: [],
    failed: []
  };

  for (const reminder of reminders) {
    const result = await sendPaymentReminder(reminder);
    
    if (result.success) {
      results.success.push({
        email: reminder.parentEmail,
        studentName: reminder.studentName
      });
    } else {
      results.failed.push({
        email: reminder.parentEmail,
        studentName: reminder.studentName,
        error: result.error
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

export const schedulePaymentReminder = async ({
  parentEmail,
  studentName,
  month,
  year,
  amount,
  dueDate,
  studentId,
  tagihanId,
  scheduledAt
}) => {
  try {
    const paymentLink = `${window.location.origin}/parent`;
    
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'SDN 2 Buwit <onboarding@resend.dev>',
      to: [parentEmail],
      reply_to: import.meta.env.VITE_RESEND_REPLY_TO || 'seduabuwit@gmail.com',
      subject: `Reminder: Tagihan Sumbangan Sukarela ${month} ${year}`,
      html: generateReminderHTML({
        studentName,
        month,
        year,
        amount,
        dueDate,
        paymentLink
      }),
      scheduledAt,
      tags: [
        { name: 'type', value: 'scheduled-reminder' },
        { name: 'student_id', value: studentId },
        { name: 'tagihan_id', value: tagihanId },
        { name: 'month', value: `${month}-${year}` }
      ]
    });

    if (error) {
      console.error('Failed to schedule reminder email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error scheduling reminder email:', err);
    return { success: false, error: err.message };
  }
};
