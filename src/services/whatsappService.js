// WhatsApp notification service via Fonnte / Wablas / Watzap
// Provider docs:
// - Fonnte: https://docs.fonnte.com
// - Wablas: https://wablas.com/dokumentasi
// - Watzap: https://watzap.id/dokumentasi-api

import { getSettings } from './firestoreService';

const formatPhone = (raw) => {
  if (!raw) return '';
  let phone = String(raw).replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  if (!phone.startsWith('62')) phone = '62' + phone;
  return phone;
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

async function sendViaFonnte(token, phone, message) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: phone, message: message })
  });
  return res.json();
}

async function sendViaWablas(token, phone, message) {
  const res = await fetch('https://api.wablas.com/api/send-message', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone, message: message })
  });
  return res.json();
}

async function sendViaWatzap(token, phone, message) {
  const res = await fetch('https://api.watzap.id/v1/send_message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: token, number_key: '', phone_no: phone, message: message })
  });
  return res.json();
}

export const sendWhatsApp = async (phone, message) => {
  try {
    const settingsResult = await getSettings();
    if (!settingsResult.success) return { success: false, error: 'Settings not found' };

    const s = settingsResult.data;
    if (!s.whatsappEnabled) return { success: false, error: 'WhatsApp disabled in settings' };
    if (!s.whatsappToken) return { success: false, error: 'WhatsApp token not configured' };

    const phoneFormatted = formatPhone(phone);
    if (!phoneFormatted) return { success: false, error: 'Invalid phone number' };

    let response;
    switch (s.whatsappProvider) {
      case 'wablas':
        response = await sendViaWablas(s.whatsappToken, phoneFormatted, message);
        break;
      case 'watzap':
        response = await sendViaWatzap(s.whatsappToken, phoneFormatted, message);
        break;
      case 'fonnte':
      default:
        response = await sendViaFonnte(s.whatsappToken, phoneFormatted, message);
    }

    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Template messages
export const templates = {
  newBill: (school, studentName, payment) => `
*${school.schoolName || 'Sekolah'}*
_Tagihan Sumbangan Sukarela Baru_

Yth. Orang tua/Wali siswa *${studentName}*,

Telah diterbitkan tagihan Sumbangan Sukarela baru:
- Periode: *${payment.month}*
- Nominal: *${formatCurrency(payment.totalAmount || payment.amount)}*
- Jatuh tempo: *${formatDate(payment.dueDate)}*

Silakan lakukan pembayaran melalui aplikasi atau langsung ke bendahara sekolah.

Terima kasih.
_Pesan otomatis. Mohon tidak membalas._
  `.trim(),

  reminder: (school, studentName, payment) => `
*${school.schoolName || 'Sekolah'}*
_Pengingat Pembayaran_

Yth. Orang tua/Wali siswa *${studentName}*,

Mengingatkan tagihan Sumbangan Sukarela yang akan jatuh tempo:
- Periode: *${payment.month}*
- Nominal: *${formatCurrency(payment.totalAmount || payment.amount)}*
- Jatuh tempo: *${formatDate(payment.dueDate)}*

Mohon segera lakukan pembayaran sebelum tanggal tersebut.

Terima kasih.
_Pesan otomatis. Mohon tidak membalas._
  `.trim(),

  paid: (school, studentName, payment) => `
*${school.schoolName || 'Sekolah'}*
_Konfirmasi Pembayaran_

Yth. Orang tua/Wali siswa *${studentName}*,

Pembayaran Sumbangan Sukarela telah kami terima:
- Periode: *${payment.month}*
- Jumlah: *${formatCurrency(payment.totalAmount || payment.amount)}*
- Metode: *${payment.paymentMethod || '-'}*
- Tanggal: *${formatDate(payment.paidAt)}*

Kuitansi dapat diunduh di aplikasi.

Terima kasih atas kerjasamanya.
_Pesan otomatis. Mohon tidak membalas._
  `.trim()
};

// Convenience helpers
export const notifyNewBill = async (school, student, payment) => {
  if (!student.parentPhone) return { success: false, error: 'No parent phone' };
  return sendWhatsApp(student.parentPhone, templates.newBill(school, student.name, payment));
};

export const notifyPaid = async (school, student, payment) => {
  if (!student.parentPhone) return { success: false, error: 'No parent phone' };
  return sendWhatsApp(student.parentPhone, templates.paid(school, student.name, payment));
};

export const notifyReminder = async (school, student, payment) => {
  if (!student.parentPhone) return { success: false, error: 'No parent phone' };
  return sendWhatsApp(student.parentPhone, templates.reminder(school, student.name, payment));
};
