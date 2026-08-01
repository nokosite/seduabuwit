import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency helper
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

// Format date helper
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return '-';
  }
};

// ==================== EXCEL EXPORT ====================

export const generateExcelReport = async (payments, filters) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Pembayaran');

    // Set column widths
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Nama Siswa', key: 'name', width: 25 },
      { header: 'Kelas', key: 'class', width: 10 },
      { header: 'Bulan', key: 'month', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Bayar', key: 'paidDate', width: 18 },
      { header: 'Metode Pembayaran', key: 'method', width: 20 },
      { header: 'Jumlah Bayar', key: 'amount', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A34A' } // Green
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    payments.forEach((payment, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        nisn: payment.nisn || '-',
        name: payment.studentName || '-',
        class: payment.studentClass || '-',
        month: payment.month || '-',
        status: payment.status === 'paid' ? 'Lunas' : 'Belum Lunas',
        paidDate: payment.paidAt ? formatDate(payment.paidAt) : '-',
        method: payment.paymentMethod || '-',
        amount: payment.totalAmount || 0
      });

      // Style status cell
      const statusCell = row.getCell('status');
      if (payment.status === 'paid') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' } // Light green
        };
        statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // Light red
        };
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Format amount as currency
      const amountCell = row.getCell('amount');
      amountCell.numFmt = 'Rp #,##0';
      amountCell.alignment = { horizontal: 'right' };
    });

    // Add summary row
    const totalPaid = payments.filter(p => p.status === 'paid').length;
    const totalUnpaid = payments.filter(p => p.status === 'pending').length;
    const totalAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      '', '', '', '', 'TOTAL',
      `${totalPaid} Lunas, ${totalUnpaid} Belum`,
      '', '',
      totalAmount
    ]);
    summaryRow.font = { bold: true };
    summaryRow.getCell('amount').numFmt = 'Rp #,##0';
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate filename
    const filename = `Laporan_Pembayaran_${filters.month || 'Semua'}_${filters.year || new Date().getFullYear()}.xlsx`;

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== PDF EXPORT ====================

export const generatePDFReport = async (payments, filters) => {
  try {
    if (!payments || payments.length === 0) {
      throw new Error('Tidak ada data untuk digenerate');
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PEMBAYARAN SUMBANGAN SUKARELA', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SDN 2 Buwit', 105, 28, { align: 'center' });

    // Add filter info
    doc.setFontSize(10);
    let yPos = 38;
    if (filters.month) {
      doc.text(`Bulan: ${filters.month}`, 14, yPos);
      yPos += 6;
    }
    if (filters.year) {
      doc.text(`Tahun: ${filters.year}`, 14, yPos);
      yPos += 6;
    }
    if (filters.status) {
      doc.text(`Status: ${filters.status}`, 14, yPos);
      yPos += 6;
    }

    // Prepare table data
    const tableData = payments.map((payment, index) => {
      const totalAmount = payment.totalAmount || payment.amount || 0;
      return [
        index + 1,
        payment.nisn || '-',
        payment.studentName || '-',
        payment.studentClass || '-',
        payment.month || '-',
        payment.status === 'paid' ? 'Lunas' : 'Belum',
        payment.paidAt ? formatDate(payment.paidAt) : '-',
        payment.paymentMethod || '-',
        formatCurrency(totalAmount)
      ];
    });

    // Add table
    autoTable(doc, {
      startY: yPos + 5,
      head: [['No', 'NISN', 'Nama', 'Kelas', 'Bulan', 'Status', 'Tgl Bayar', 'Metode', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 15 },
        4: { cellWidth: 25 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'center', cellWidth: 22 },
        7: { cellWidth: 25 },
        8: { halign: 'right', cellWidth: 25 }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      didParseCell: function(data) {
        if (data.column.index === 5 && data.section === 'body') {
          const status = data.cell.raw;
          if (status === 'Lunas') {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Add summary
    const finalY = doc.previousAutoTable.finalY + 10;
    const totalPaid = payments.filter(p => p.status === 'paid').length;
    const totalUnpaid = payments.filter(p => p.status === 'pending' || p.status === 'unpaid').length;
    const totalAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Lunas: ${totalPaid} siswa`, 14, finalY + 6);
    doc.text(`Total Belum Lunas: ${totalUnpaid} siswa`, 14, finalY + 12);
    doc.text(`Total Pemasukan: ${formatCurrency(totalAmount)}`, 14, finalY + 18);

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Generate filename
    const filename = `Laporan_Pembayaran_${filters.month || 'Semua'}_${filters.year || new Date().getFullYear()}.pdf`;

    // Download file
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return { 
      success: false, 
      error: error.message || 'Gagal membuat PDF. Silakan coba lagi.' 
    };
  }
};
