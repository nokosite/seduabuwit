import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ExcelJS from 'exceljs';

function ModalBulkImport({ isOpen, onClose, onImport, showToast }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      showToast('File harus berformat Excel (.xlsx atau .xls)!', 'error');
      return;
    }

    setFile(selectedFile);

    // Parse Excel file for preview
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await selectedFile.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      const data = [];

      const invalidRows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        // Normalize kelas: strip non-digit ("1A" -> "1", "Kelas 3" -> "3")
        const rawClass = row.getCell(3).value?.toString().trim() || '';
        const normalizedClass = rawClass.replace(/\D/g, '');

        const rowData = {
          nisn: row.getCell(1).value?.toString().trim() || '',
          name: row.getCell(2).value?.toString().trim() || '',
          class: normalizedClass,
          parentName: row.getCell(4).value?.toString().trim() || '',
          parentEmail: row.getCell(5).value?.toString().trim() || '',
          parentPhone: row.getCell(6).value?.toString().trim() || ''
        };

        // Skip empty rows entirely
        if (!rowData.nisn && !rowData.name && !rawClass) return;

        // Validate required fields
        if (!rowData.nisn || !rowData.name || !rowData.class) {
          invalidRows.push(`Baris ${rowNumber}: NISN/Nama/Kelas wajib diisi`);
          return;
        }

        // Validate kelas range 1-6
        const gradeNum = parseInt(rowData.class);
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
          invalidRows.push(`Baris ${rowNumber}: Kelas "${rawClass}" tidak valid (harus 1-6)`);
          return;
        }

        data.push(rowData);
      });

      if (invalidRows.length > 0) {
        showToast(`${invalidRows.length} baris invalid. Contoh: ${invalidRows[0]}`, 'error');
      }

      if (data.length === 0) {
        showToast('Tidak ada data valid untuk di-import. Cek format file Anda.', 'error');
        setFile(null);
        return;
      }

      setPreview(data);
    } catch (error) {
      showToast('Gagal membaca file Excel!', 'error');
      setFile(null);
    }
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Data Siswa');

    // Set column widths
    worksheet.columns = [
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Nama Siswa', key: 'name', width: 25 },
      { header: 'Kelas (1-6)', key: 'class', width: 12 },
      { header: 'Nama Orang Tua', key: 'parentName', width: 25 },
      { header: 'Email Orang Tua', key: 'parentEmail', width: 30 },
      { header: 'No. HP Orang Tua', key: 'parentPhone', width: 15 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add sample data (kelas: angka 1-6 saja, tanpa huruf A/B/C)
    worksheet.addRow({
      nisn: '1234567890',
      name: 'Contoh Nama Siswa',
      class: '1',
      parentName: 'Contoh Nama Orang Tua',
      parentEmail: 'email@example.com',
      parentPhone: '081234567890'
    });

    worksheet.addRow({
      nisn: '0987654321',
      name: 'Siswa Kedua',
      class: '2',
      parentName: 'Orang Tua Kedua',
      parentEmail: 'parent2@example.com',
      parentPhone: '081234567891'
    });

    // Add borders
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

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_Import_Siswa.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Template berhasil diunduh!', 'success');
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) {
      showToast('Pilih file Excel terlebih dahulu!', 'error');
      return;
    }

    setIsLoading(true);
    await onImport(preview);
    setIsLoading(false);

    // Reset
    setFile(null);
    setPreview([]);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="ph-fill ph-file-xls text-2xl"></i>
                Import Data Siswa (Excel)
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Upload file Excel untuk menambahkan banyak siswa sekaligus
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 transition p-2 hover:bg-gray-100"
            >
              <i className="ph-fill ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="ph-fill ph-info text-gray-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Cara Import Data Siswa:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Download template Excel dengan klik tombol "Download Template"</li>
                  <li>Isi data siswa sesuai format di template</li>
                  <li><strong>Kolom Kelas wajib angka 1-6 saja</strong> (bukan 1A, 2B, dll)</li>
                  <li>NISN harus unik, tidak boleh duplikat</li>
                  <li>Upload file Excel yang sudah diisi, cek preview data</li>
                  <li>Klik "Import Data" untuk menyimpan ke database</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Download Template Button */}
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
          >
            <i className="ph-fill ph-download text-xl mr-2"></i>
            Download Template Excel
          </Button>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload File Excel <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
            />
            {file && (
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <i className="ph-fill ph-check-circle"></i>
                File terpilih: {file.name}
              </p>
            )}
          </div>

          {/* Preview Data */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900">Preview Data ({preview.length} siswa)</h4>
                <span className="text-xs text-gray-500">Scroll untuk melihat semua data</span>
              </div>

              <div className="border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">No</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">NISN</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Nama</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Kelas</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Orang Tua</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((student, index) => (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2 font-mono">{student.nisn}</td>
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2 font-semibold">{student.class}</td>
                          <td className="px-4 py-2">{student.parentName}</td>
                          <td className="px-4 py-2 text-xs">{student.parentEmail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <i className="ph-fill ph-info text-gray-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Informasi Login Orang Tua:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Password otomatis dibuat: <span className="font-semibold">password123</span></li>
                  <li>• Semua orang tua menggunakan password default yang sama</li>
                  <li>• Admin bisa edit password via menu "Edit Parent" di Data Master</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <i className="ph-fill ph-x-circle text-xl mr-2"></i>
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || preview.length === 0}
            >
              {isLoading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-xl mr-2"></i>
                  Mengimport...
                </>
              ) : (
                <>
                  <i className="ph-fill ph-upload text-xl mr-2"></i>
                  Import {preview.length} Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalBulkImport;
