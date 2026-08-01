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

function buildReminderHTML({ studentName, month, year, amount, dueDate }) {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;padding:20px;">
      <div style="max-width:500px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <div style="background:#f59e0b;color:white;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:20px;">⚠️ Pengingat Pembayaran</h1>
          <p style="margin:8px 0 0 0;opacity:0.9;font-size:14px;">Tagihan Sumbangan Sukarela belum lunas</p>
        </div>
        <div style="padding:24px;">
          <p>Yth. Orang Tua/Wali dari <strong>${studentName}</strong>,</p>
          <p>Tagihan Sumbangan Sukarela berikut masih belum lunas. Mohon segera melakukan pembayaran sebelum jatuh tempo.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Periode:</strong> ${month} ${year}</p>
            <p style="margin:4px 0;"><strong>Jatuh Tempo:</strong> ${formatDate(dueDate)}</p>
            <p style="margin:4px 0;"><strong>Jumlah:</strong> <span style="color:#f59e0b;font-size:18px;font-weight:bold;">${formatCurrency(amount)}</span></p>
          </div>
          <p style="font-size:13px;color:#6b7280;">Silakan login ke portal pembayaran untuk melakukan pembayaran. Jika sudah membayar, mohon abaikan pesan ini.</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
          <strong>SDN 2 Buwit</strong><br>Email: ${REPLY_TO}
        </div>
      </div>
    </body></html>
  `;
}

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
      html: buildReminderHTML({
        studentName,
        month,
        year,
        amount,
        dueDate: dueDateObj
      })
    });

    if (result?.error) {
      return res.status(500).json({ success: false, error: result.error.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
