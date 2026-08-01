import jsPDF from 'jspdf';
import { getSettings } from './firestoreService';

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val || 0);

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Number to Indonesian words (for kuitansi text)
const numberToWords = (n) => {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas'];

  const toWords = (num) => {
    if (num < 12) return satuan[num];
    if (num < 20) return toWords(num - 10) + ' belas';
    if (num < 100) return toWords(Math.floor(num / 10)) + ' puluh' + (num % 10 ? ' ' + toWords(num % 10) : '');
    if (num < 200) return 'seratus' + (num - 100 ? ' ' + toWords(num - 100) : '');
    if (num < 1000) return toWords(Math.floor(num / 100)) + ' ratus' + (num % 100 ? ' ' + toWords(num % 100) : '');
    if (num < 2000) return 'seribu' + (num - 1000 ? ' ' + toWords(num - 1000) : '');
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' ribu' + (num % 1000 ? ' ' + toWords(num % 1000) : '');
    if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 ? ' ' + toWords(num % 1000000) : '');
    return num.toString();
  };

  return toWords(Math.floor(n)).replace(/\s+/g, ' ').trim();
};

// Generate dunning letter (surat tunggakan) for a student
export const generateDunningLetter = async (student, pendingPayments) => {
  try {
    const settingsResult = await getSettings();
    const school = settingsResult.success ? settingsResult.data : {};

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // KOP SURAT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(4, 120, 87);
    doc.text((school.schoolName || 'SDN 2 Buwit').toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    if (school.address) doc.text(school.address, pageWidth / 2, 26, { align: 'center', maxWidth: pageWidth - 40 });
    if (school.npsn || school.phone) {
      doc.text(
        [school.npsn ? `NPSN: ${school.npsn}` : null, school.phone ? `Telp. ${school.phone}` : null].filter(Boolean).join(' • '),
        pageWidth / 2, 31, { align: 'center' }
      );
    }
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.8);
    doc.line(margin, 34, pageWidth - margin, 34);
    doc.setLineWidth(0.2);
    doc.line(margin, 35.5, pageWidth - margin, 35.5);

    // Tanggal & nomor surat
    const today = new Date();
    const tglStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let y = 45;
    doc.text(`Nomor : ___/SS/${today.getFullYear()}`, margin, y);
    doc.text(`${school.address ? school.address.split(',').slice(-1)[0].trim() : 'Buwit'}, ${tglStr}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
    doc.text('Perihal : Pemberitahuan Tunggakan Sumbangan Sukarela', margin, y);
    y += 12;

    // Penerima
    doc.text('Kepada Yth.', margin, y); y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Orang Tua / Wali dari ${student.name}`, margin, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('di Tempat', margin, y); y += 10;

    // Isi
    doc.text('Dengan hormat,', margin, y); y += 7;
    const intro = `Bersama surat ini kami sampaikan bahwa berdasarkan catatan administrasi sekolah, putra/putri Bapak/Ibu masih memiliki tunggakan pembayaran Sumbangan Sukarela sebagai berikut:`;
    const wrapped = doc.splitTextToSize(intro, pageWidth - 2 * margin);
    doc.text(wrapped, margin, y); y += wrapped.length * 5 + 4;

    // Data siswa
    doc.setFont('helvetica', 'bold');
    doc.text('Data Siswa:', margin, y); y += 6;
    doc.setFont('helvetica', 'normal');
    const row = (label, value) => {
      doc.text(label, margin + 4, y);
      doc.text(':', margin + 35, y);
      doc.text(String(value || '-'), margin + 38, y);
      y += 5;
    };
    row('Nama', student.name);
    row('NISN', student.nisn);
    row('Kelas', `Kelas ${student.class}`);
    y += 4;

    // Tabel tunggakan
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Tunggakan:', margin, y); y += 6;

    // Header tabel
    doc.setFillColor(4, 120, 87);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 7, 'F');
    doc.text('No', margin + 2, y);
    doc.text('Periode', margin + 12, y);
    doc.text('Jatuh Tempo', margin + 60, y);
    doc.text('Nominal', pageWidth - margin - 2, y, { align: 'right' });
    y += 4;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    let total = 0;
    pendingPayments.forEach((p, i) => {
      y += 5;
      const due = p.dueDate?.toDate ? p.dueDate.toDate() : (p.dueDate ? new Date(p.dueDate) : null);
      const dueStr = due ? due.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
      const amt = p.totalAmount || p.amount || 0;
      total += amt;
      doc.text(String(i + 1), margin + 2, y);
      doc.text(String(p.month || '-'), margin + 12, y);
      doc.text(dueStr, margin + 60, y);
      doc.text(`Rp ${amt.toLocaleString('id-ID')}`, pageWidth - margin - 2, y, { align: 'right' });
    });
    y += 4;
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL TUNGGAKAN', margin + 2, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Rp ${total.toLocaleString('id-ID')}`, pageWidth - margin - 2, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Penutup
    doc.setFont('helvetica', 'normal');
    const outro = `Sehubungan dengan hal tersebut, kami mohon dengan hormat agar Bapak/Ibu dapat segera menyelesaikan pembayaran tunggakan di atas paling lambat 14 (empat belas) hari setelah surat ini diterima. Demikian pemberitahuan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.`;
    const wrappedOutro = doc.splitTextToSize(outro, pageWidth - 2 * margin);
    doc.text(wrappedOutro, margin, y);
    y += wrappedOutro.length * 5 + 12;

    // Tanda tangan
    const sigX = pageWidth - margin - 60;
    doc.text('Hormat kami,', sigX, y); y += 5;
    doc.text('Bendahara Sekolah', sigX, y); y += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(school.treasurer || '(__________________)', sigX, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Mengetahui, ${school.headmaster || 'Kepala Sekolah'}`, margin, y - 5);

    const filename = `Surat_Tunggakan_${(student.name || 'siswa').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    return { success: true, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const generateReceiptPDF = async (payment) => {
  try {
    const settingsResult = await getSettings();
    const school = settingsResult.success ? settingsResult.data : {};

    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;

    // Border
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.8);
    doc.rect(5, 5, pageWidth - 10, doc.internal.pageSize.getHeight() - 10);

    // Header — school name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(4, 120, 87);
    doc.text((school.schoolName || 'SDN 2 Buwit').toUpperCase(), pageWidth / 2, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    if (school.address) doc.text(school.address, pageWidth / 2, 20, { align: 'center', maxWidth: pageWidth - 30 });
    if (school.npsn) doc.text(`NPSN: ${school.npsn}` + (school.phone ? ` • Telp. ${school.phone}` : ''), pageWidth / 2, 24, { align: 'center' });

    // Line separator
    doc.setLineWidth(0.4);
    doc.line(margin, 28, pageWidth - margin, 28);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('KUITANSI PEMBAYARAN', pageWidth / 2, 35, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const receiptNo = payment.manualReceiptNumber || payment.reference || payment.id?.slice(-8).toUpperCase() || '-';
    doc.text(`No. ${receiptNo}`, pageWidth / 2, 40, { align: 'center' });

    // Body
    let y = 50;
    const lineHeight = 6;

    doc.setFontSize(10);
    const drawRow = (label, value) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.text(':', margin + 35, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value || '-'), margin + 38, y, { maxWidth: pageWidth - margin - 38 - margin });
      y += lineHeight;
    };

    drawRow('Telah Diterima Dari', `Orang tua / Wali ${payment.studentName || '-'}`);
    drawRow('NISN', payment.nisn || '-');
    drawRow('Kelas', `Kelas ${payment.studentClass || '-'}`);
    drawRow('Untuk Pembayaran', `${payment.paymentType || 'Sumbangan Sukarela'} - ${payment.month || '-'}`);
    drawRow('Tanggal Bayar', formatDate(payment.paidAt));
    drawRow('Metode', payment.paymentMethod || '-');

    y += 2;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Total
    const amount = payment.totalAmount || payment.amount || 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Jumlah Dibayar:', margin, y);
    doc.setTextColor(4, 120, 87);
    doc.text(formatCurrency(amount), pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Terbilang: ${numberToWords(amount)} rupiah`, margin, y, { maxWidth: pageWidth - 2 * margin });
    y += 12;

    // Signature
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const sigX = pageWidth - margin - 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${school.address ? school.address.split(',').slice(-1)[0].trim() : 'Buwit'}, ${today}`, sigX, y);
    y += 5;
    doc.text(payment.paymentChannel === 'manual' ? 'Bendahara,' : 'Sistem,', sigX, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    const signerName = payment.receivedBy || school.treasurer || '(Bendahara Sekolah)';
    doc.text(signerName, sigX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Footer note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Kuitansi ini sah dan diterbitkan otomatis oleh Sistem Pembayaran Sumbangan Sukarela Digital.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 9,
      { align: 'center' }
    );

    const filename = `Kuitansi_${(payment.studentName || 'siswa').replace(/\s+/g, '_')}_${(payment.month || '').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
