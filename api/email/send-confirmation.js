import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'SDN 2 Buwit <onboarding@resend.dev>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'seduabuwit@gmail.com';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);

const formatDate = (date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
      return res.status(500).json({ success: false, error: result.error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
