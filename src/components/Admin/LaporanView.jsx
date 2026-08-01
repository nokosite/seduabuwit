import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useActiveMonths, useActiveYears } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { generateExcelReport, generatePDFReport } from '@/services/reportService';
import Toast from '@/components/Modals/Toast';

function LaporanView() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Dynamic months & years (only those with data)
  const { years: activeYears } = useActiveYears();
  const yearFilterNum = selectedYear ? parseInt(selectedYear) : null;
  const { months: activeMonths } = useActiveMonths(yearFilterNum);

  // Fetch all payments on mount
  useEffect(() => {
    fetchPayments();
  }, []);

  // Apply filters whenever filter states or payments change
  useEffect(() => {
    applyFilters();
  }, [selectedMonth, selectedYear, selectedStatus, payments]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPayments(paymentsData);
    } catch (error) {
      setToast({
        show: true,
        message: 'Gagal memuat data pembayaran',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(payment => {
        const paymentMonth = payment.month?.split(' ')[0]; // Extract month from "Januari 2026"
        return paymentMonth === selectedMonth;
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(payment => {
        const paymentYear = payment.month?.split(' ')[1]; // Extract year from "Januari 2026"
        return paymentYear === selectedYear;
      });
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    setFilteredPayments(filtered);
  };

  const handleDownloadExcel = async () => {
    if (filteredPayments.length === 0) {
      setToast({
        show: true,
        message: 'Tidak ada data untuk diunduh',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    const filters = {
      month: selectedMonth,
      year: selectedYear,
      status: selectedStatus === 'all' ? 'Semua' : (selectedStatus === 'paid' ? 'Lunas' : 'Belum Lunas')
    };

    const result = await generateExcelReport(filteredPayments, filters);

    if (result.success) {
      setToast({
        show: true,
        message: `Berhasil mengunduh ${result.filename}`,
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Gagal mengunduh laporan Excel',
        type: 'error'
      });
    }
    setIsLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (filteredPayments.length === 0) {
      setToast({
        show: true,
        message: 'Tidak ada data untuk diunduh',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    const filters = {
      month: selectedMonth,
      year: selectedYear,
      status: selectedStatus === 'all' ? 'Semua' : (selectedStatus === 'paid' ? 'Lunas' : 'Belum Lunas')
    };

    const result = await generatePDFReport(filteredPayments, filters);

    if (result.success) {
      setToast({
        show: true,
        message: `Berhasil mengunduh ${result.filename}`,
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: result.error || 'Gagal mengunduh laporan PDF',
        type: 'error'
      });
    }
    setIsLoading(false);
  };

  const handleResetFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedStatus('all');
  };

  return (
    <div id="view-laporan" className="admin-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <i className="ph-fill ph-file-text text-2xl"></i>
            Laporan Keuangan
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Rekapitulasi pembayaran untuk pembukuan sekolah.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <i className="ph-fill ph-funnel text-lg"></i>
              Filter Laporan
            </h3>
            {(selectedMonth || selectedYear || selectedStatus !== 'all') && (
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="text-gray-600"
              >
                <i className="ph-fill ph-x text-lg mr-1"></i>
                Reset Filter
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label className="block mb-2 text-gray-700 font-medium">Tahun</Label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(''); // reset bulan jika ganti tahun
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="">Semua Tahun</option>
                {activeYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="block mb-2 text-gray-700 font-medium">
                Pilih Bulan {selectedYear ? `(${activeMonths.length} aktif)` : ''}
              </Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!selectedYear || activeMonths.length === 0}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{selectedYear ? 'Semua Bulan Aktif' : 'Pilih tahun dulu'}</option>
                {activeMonths.map((m) => (
                  <option key={m.key} value={m.month}>
                    {m.month} ({m.count} tagihan)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="block mb-2 text-gray-700 font-medium">Status Pembayaran</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="all">Semua Status</option>
                <option value="paid">Hanya Lunas</option>
                <option value="pending">Hanya Belum Lunas</option>
              </select>
            </div>
          </div>

          {/* Preview Statistics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Total Data</p>
                <p className="text-3xl font-bold text-gray-900">{filteredPayments.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Lunas</p>
                <p className="text-3xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.status === 'paid').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Belum Lunas</p>
                <p className="text-3xl font-bold text-red-600">
                  {filteredPayments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Total Pemasukan</p>
                <p className="text-xl font-bold text-green-700">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(
                    filteredPayments
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + (p.totalAmount || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 transition"
              disabled={isLoading || filteredPayments.length === 0}
            >
              {isLoading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-xl mr-2"></i>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="ph-fill ph-file-pdf text-xl mr-2"></i>
                  Unduh Format PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadExcel}
              variant="outline"
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 transition"
              disabled={isLoading || filteredPayments.length === 0}
            >
              {isLoading ? (
                <>
                  <i className="ph ph-spinner animate-spin text-xl mr-2"></i>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="ph-fill ph-file-xls text-xl mr-2"></i>
                  Unduh Format Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

export default LaporanView;
