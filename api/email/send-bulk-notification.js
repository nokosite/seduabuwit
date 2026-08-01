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
          failedEmails.push({
            studentName: r.studentName,
            email: r.parentEmail,
            reason: result.error.message
          });
        } else {
          sentEmails.push({ studentName: r.studentName, email: r.parentEmail });
        }
      } catch (error) {
        failedEmails.push({
          studentName: r.studentName,
          email: r.parentEmail,
          reason: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      sent: sentEmails.length,
      failed: failedEmails.length,
      sentEmails,
      failedEmails
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
