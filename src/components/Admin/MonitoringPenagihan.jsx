import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { deletePayment, deletePaymentsByMonth, deletePaymentsByAmount, findPaymentsByAmount, updatePayment, markPaymentAsPaidManual, confirmPaymentFromDuitku } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveMonths, useActiveYears } from '../../hooks/useFirestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ModalEditTagihan from '../Modals/ModalEditTagihan';
import ModalManualPayment from '../Modals/ModalManualPayment';
import ModalConfirmDelete from '../Modals/ModalConfirmDelete';
import { sendBatchReminders } from '../../services/emailService';

function MonitoringPenagihan() {
  const { currentUser } = useAuth();
  const { years: activeYears, loading: yearsLoading } = useActiveYears();
  const [selectedYear, setSelectedYear] = useState(null);
  const { months: activeMonths, loading: monthsLoading } = useActiveMonths(selectedYear);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-pick newest year & month available
  useEffect(() => {
    if (!yearsLoading && activeYears.length > 0 && selectedYear === null) {
      setSelectedYear(activeYears[0]);
    }
  }, [activeYears, yearsLoading, selectedYear]);

  useEffect(() => {
    if (!monthsLoading) {
      if (activeMonths.length > 0) {
        // Pertahankan pilihan kalau masih valid; kalau tidak, pilih bulan terbaru
        const stillValid = activeMonths.some((m) => m.month === selectedMonth);
        if (!stillValid) setSelectedMonth(activeMonths[0].month);
      } else {
        setSelectedMonth(null);
      }
    }
  }, [activeMonths, monthsLoading, selectedMonth]);
  const [activeTab, setActiveTab] = useState('all'); // all, paid, unpaid
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });
  const [reminderModal, setReminderModal] = useState({ isOpen: false, count: 0 });

  const handleSyncDuitku = async (payment) => {
    if (!payment.merchantOrderId) return;
    setSyncingId(payment.id);
    const result = await confirmPaymentFromDuitku(payment.merchantOrderId);
    setSyncingId(null);
    if (result.success) {
      alert(`Status pembayaran ${payment.studentName} berhasil disinkronkan ke Lunas.`);
    } else if (result.pending) {
      alert(`Pembayaran ${payment.studentName} masih pending di Duitku.`);
    } else {
      alert(`Gagal sync: ${result.error || 'unknown'}`);
    }
  };

  const handleEditPayment = (payment) => {
    setEditPayment(payment);
  };

  const handleManualPayment = (payment) => {
    setManualPayment(payment);
  };

  const handleConfirmManual = async (paymentId, details) => {
    const result = await markPaymentAsPaidManual(paymentId, details, currentUser?.uid);
    if (result.success) {
      setManualPayment(null);
    }
    return result;
  };

  const handleSaveEdit = async (paymentId, updates) => {
    const result = await updatePayment(paymentId, updates);
    if (result.success) {
      setEditPayment(null);
    }
    return result;
  };

  const handleDeletePayment = async (payment) => {
    setDeleteModal({ 
      isOpen: true, 
      type: 'single', 
      data: payment 
    });
  };

  const handleBulkDelete = async () => {
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      data: { month: selectedMonth, year: selectedYear, count: monthlyData.length }
    });
  };

  const handleDeleteByAmount = async () => {
    const TARGET = 100000;
    const found = await findPaymentsByAmount(TARGET);
    if (!found.success) {
      alert('Gagal cek data: ' + found.error);
      return;
    }
    if (found.data.length === 0) {
      alert(`Tidak ada payment dengan nominal Rp ${TARGET.toLocaleString('id-ID')} di database.`);
      return;
    }
    setDeleteModal({
      isOpen: true,
      type: 'byAmount',
      data: { amount: TARGET, count: found.data.length }
    });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'single') {
      setDeletingId(deleteModal.data.id);
      await deletePayment(deleteModal.data.id);
      setDeletingId(null);
    } else if (deleteModal.type === 'bulk') {
      setBulkDeleting(true);
      await deletePaymentsByMonth(deleteModal.data.month, deleteModal.data.year);
      setBulkDeleting(false);
    } else if (deleteModal.type === 'byAmount') {
      setBulkDeleting(true);
      const result = await deletePaymentsByAmount(deleteModal.data.amount);
      setBulkDeleting(false);
      if (result.success) {
        alert(`Berhasil menghapus ${result.count} payment senilai Rp ${deleteModal.data.amount.toLocaleString('id-ID')}.`);
      } else {
        alert('Gagal menghapus: ' + result.error);
      }
    }

    setDeleteModal({ isOpen: false, type: null, data: null });
  };

  const handleSendReminders = async () => {
    const unpaidPayments = monthlyData.filter((p) => p.status === 'pending');
    
    if (unpaidPayments.length === 0) {
      alert('Tidak ada tagihan yang belum lunas.');
      return;
    }

    const reminders = [];
    for (const payment of unpaidPayments) {
      const studentDoc = await getDoc(doc(db, 'students', payment.studentId));
      if (studentDoc.exists()) {
        const student = studentDoc.data();
        if (student.parentEmail) {
          reminders.push({
            parentEmail: student.parentEmail,
            studentName: payment.studentName,
            month: selectedMonth,
            year: selectedYear,
            amount: payment.totalAmount,
            dueDate: payment.dueDate
          });
        }
      }
    }

    if (reminders.length === 0) {
      alert('Tidak ada email orang tua yang terdaftar.');
      return;
    }

    setReminderModal({ isOpen: true, count: reminders.length });
  };

  const handleConfirmSendReminders = async () => {
    setReminderModal({ isOpen: false, count: 0 });
    setSendingReminders(true);

    const unpaidPayments = monthlyData.filter((p) => p.status === 'pending');
    const reminders = [];
    
    for (const payment of unpaidPayments) {
      const studentDoc = await getDoc(doc(db, 'students', payment.studentId));
      if (studentDoc.exists()) {
        const student = studentDoc.data();
        if (student.parentEmail) {
          reminders.push({
            parentEmail: student.parentEmail,
            studentName: payment.studentName,
            month: selectedMonth,
            year: selectedYear,
            amount: payment.totalAmount,
            dueDate: payment.dueDate,
            tagihanId: payment.id,
            studentId: payment.studentId
          });
        }
      }
    }

    const results = await sendBatchReminders(reminders);
    setSendingReminders(false);

    const successCount = results.success.length;
    const failedCount = results.failed.length;

    if (failedCount === 0) {
      alert(`✅ Berhasil mengirim ${successCount} email reminder!`);
    } else {
      const detail = results.failed
        .slice(0, 5)
        .map((f) => `• ${f.studentName} (${f.email || '-'}): ${f.error}`)
        .join('\n');
      const more = results.failed.length > 5 ? `\n...dan ${results.failed.length - 5} lainnya` : '';
      const tip = results.failed.some((f) => f.error?.includes('verify a domain'))
        ? '\n\n💡 Tip: Tanpa domain terverifikasi di Resend, email hanya bisa dikirim ke alamat akun Resend Anda. Verify domain di resend.com/domains untuk kirim ke email manapun.'
        : '';

      alert(
        `Email reminder:\n` +
        `✅ Terkirim: ${successCount}\n` +
        `❌ Gagal: ${failedCount}\n\n` +
        `Detail gagal:\n${detail}${more}${tip}`
      );
    }
  };

  // Real-time listener for selected month/year
  useEffect(() => {
    if (!selectedMonth || !selectedYear) {
      setMonthlyData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const monthYear = `${selectedMonth} ${selectedYear}`;
    const q = query(
      collection(db, 'payments'),
      where('month', '==', monthYear)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        payments.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
        setMonthlyData(payments);
        setLoading(false);
      },
      () => {
        setMonthlyData([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedMonth, selectedYear]);

  // Filter data based on active tab
  const filteredData = monthlyData.filter(payment => {
    if (activeTab === 'paid') return payment.status === 'paid';
    if (activeTab === 'unpaid') return payment.status === 'pending' && !payment.cashPending;
    if (activeTab === 'cash') return payment.status === 'pending' && payment.cashPending;
    return true;
  });

  const cashPendingCount = monthlyData.filter((p) => p.status === 'pending' && p.cashPending).length;

  // Calculate statistics
  const totalStudents = monthlyData.length;
  const paidCount = monthlyData.filter(p => p.status === 'paid').length;
  const unpaidCount = monthlyData.filter(p => p.status === 'pending').length;

  // Calculate income breakdown
  const paidPayments = monthlyData.filter(p => p.status === 'paid');
  const totalIncome = paidPayments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);
  const totalSPP = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAdminFee = paidPayments.reduce((sum, p) => sum + (p.adminFee || 0), 0);

  // Calculate potential income (unpaid)
  const unpaidPayments = monthlyData.filter(p => p.status === 'pending');
  const potentialIncome = unpaidPayments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);

  // Calculate collection rate
  const collectionRate = totalStudents > 0 ? ((paidCount / totalStudents) * 100).toFixed(1) : 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if payment is overdue
  const isOverdue = (payment) => {
    if (payment.status === 'paid') return false;
    if (!payment.dueDate) return false;

    const due = payment.dueDate.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
    return due < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header — compact selector only (judul/subtitle dipindah ke dashboard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <i className="ph-fill ph-calendar-check text-emerald-600 text-xl"></i>
          <h3 className="font-bold text-gray-900">Detail Tagihan per Bulan</h3>
        </div>

        <div className="flex gap-2 items-center">
          {activeYears.length === 0 ? (
            <span className="text-sm text-gray-500 italic">Belum ada tagihan</span>
          ) : (
            <>
              {/* Year Selector */}
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm hover:border-gray-400 transition"
              >
                {activeYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Month Selector — hanya bulan yang sudah punya tagihan */}
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm hover:border-gray-400 transition"
                disabled={activeMonths.length === 0}
              >
                {activeMonths.length === 0 ? (
                  <option value="">— Tidak ada tagihan {selectedYear}</option>
                ) : (
                  activeMonths.map((m) => (
                    <option key={m.key} value={m.month}>
                      {m.month} ({m.count} tagihan)
                    </option>
                  ))
                )}
              </select>
            </>
          )}

          {/* Bulk Delete */}
          {monthlyData.length > 0 && unpaidCount > 0 && (
            <>
              <Button
                onClick={handleSendReminders}
                disabled={sendingReminders}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 gap-2"
              >
                <i className={`ph-fill ${sendingReminders ? 'ph-spinner animate-spin' : 'ph-envelope-simple'}`}></i>
                {sendingReminders ? 'Mengirim...' : 'Kirim Reminder'}
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                variant="outline"
                className="px-4 py-2.5 h-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                title="Hapus semua tagihan belum lunas bulan ini"
              >
                {bulkDeleting ? (
                  <i className="ph ph-spinner animate-spin text-lg mr-2"></i>
                ) : (
                  <i className="ph-fill ph-trash text-lg mr-2"></i>
                )}
                Hapus Bulan Ini
              </Button>
            </>
          )}

          {/* Hapus Payment Rp 100rb (cleanup data dummy/test) — selalu tampil */}
          <Button
            onClick={handleDeleteByAmount}
            disabled={bulkDeleting}
            variant="outline"
            className="px-4 py-2.5 h-auto border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
            title="Hapus semua payment di database yang nominalnya Rp 100.000 (cleanup data lama)"
          >
            {bulkDeleting ? (
              <i className="ph ph-spinner animate-spin text-lg mr-2"></i>
            ) : (
              <i className="ph-fill ph-broom text-lg mr-2"></i>
            )}
            Hapus Payment Rp 100rb
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-4 text-sm font-bold transition-all rounded-t-xl ${
            activeTab === 'all'
              ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <i className="ph-fill ph-list text-lg mr-2"></i>
          Semua ({totalStudents})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-6 py-4 text-sm font-bold transition-all rounded-t-xl ${
            activeTab === 'paid'
              ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <i className="ph-fill ph-check-circle text-lg mr-2"></i>
          Sudah Lunas ({paidCount})
        </button>
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`px-6 py-4 text-sm font-bold transition-all rounded-t-xl ${
            activeTab === 'unpaid'
              ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <i className="ph-fill ph-clock text-lg mr-2"></i>
          Belum Lunas ({unpaidCount - cashPendingCount})
        </button>
        {cashPendingCount > 0 && (
          <button
            onClick={() => setActiveTab('cash')}
            className={`px-6 py-4 text-sm font-bold transition-all rounded-t-xl ${
              activeTab === 'cash'
                ? 'text-amber-600 bg-amber-50 border-b-4 border-amber-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ph-fill ph-money text-lg mr-2"></i>
            Tunggu Tunai ({cashPendingCount})
          </button>
        )}
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden shadow-xl border-2 border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">No</th>
                <th className="p-4 font-semibold">Nama Siswa</th>
                <th className="p-4 font-semibold">Kelas</th>
                <th className="p-4 font-semibold">NISN</th>
                <th className="p-4 font-semibold">Jumlah</th>
                <th className="p-4 font-semibold">Deadline</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Tanggal Bayar</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-3">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <i className="ph-fill ph-file-x text-5xl text-gray-400 mb-3 block"></i>
                    <h6 className="font-semibold text-gray-900 mb-1">Belum Ada Data</h6>
                    <p className="text-sm text-gray-500">
                      Belum ada tagihan untuk {selectedMonth} {selectedYear}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-gray-50 transition ${
                      isOverdue(payment) ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="p-4 text-gray-600">{index + 1}</td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{payment.studentName}</p>
                      {payment.cashPending && payment.cashRequest && (
                        <div className="text-xs text-amber-700 mt-1 space-y-0.5">
                          {payment.cashRequest.parentName && (
                            <p><i className="ph ph-user mr-1"></i>{payment.cashRequest.parentName}</p>
                          )}
                          {payment.cashRequest.parentPhone && (
                            <p><i className="ph ph-phone mr-1"></i>{payment.cashRequest.parentPhone}</p>
                          )}
                          {payment.cashRequest.plannedDate && (
                            <p><i className="ph ph-calendar mr-1"></i>{new Date(payment.cashRequest.plannedDate?.toDate?.() || payment.cashRequest.plannedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          )}
                          {payment.cashRequest.note && (
                            <p className="italic">"{payment.cashRequest.note}"</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{payment.studentClass}</td>
                    <td className="p-4 text-gray-600">{payment.nisn || '-'}</td>
                    <td className="p-4 text-gray-900 font-medium">
                      {formatCurrency(payment.totalAmount || payment.amount)}
                    </td>
                    <td className="p-4">
                      {payment.dueDate ? (
                        <div className="flex items-center gap-1">
                          <span className={isOverdue(payment) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(payment.dueDate)}
                          </span>
                          {isOverdue(payment) && (
                            <i className="ph-fill ph-warning text-red-600 text-base"></i>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {payment.status === 'paid' ? (
                        <Badge variant="success">Lunas</Badge>
                      ) : payment.cashPending ? (
                        <Badge className="bg-amber-100 text-amber-700 border-0" title={`Rencana bayar: ${payment.cashRequest?.plannedDate ? new Date(payment.cashRequest.plannedDate?.toDate?.() || payment.cashRequest.plannedDate).toLocaleDateString('id-ID') : '-'}\n${payment.cashRequest?.parentName ? `Oleh: ${payment.cashRequest.parentName}` : ''}${payment.cashRequest?.note ? `\nCatatan: ${payment.cashRequest.note}` : ''}`}>
                          <i className="ph-fill ph-money mr-1"></i>
                          Tunggu Tunai
                        </Badge>
                      ) : isOverdue(payment) ? (
                        <Badge variant="destructive">Terlambat</Badge>
                      ) : (
                        <Badge variant="warning">Belum Bayar</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {payment.status === 'paid' && payment.paidAt ? (
                        <div>
                          <p className="text-gray-900">{formatDate(payment.paidAt)}</p>
                          <p className="text-xs text-gray-500">{payment.paymentMethod || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        {payment.status !== 'paid' && payment.merchantOrderId && (
                          <Button
                            onClick={() => handleSyncDuitku(payment)}
                            disabled={syncingId === payment.id}
                            variant="ghost"
                            size="icon"
                            className="text-amber-600 hover:bg-amber-50"
                            title="Sync status pembayaran dari Duitku"
                          >
                            {syncingId === payment.id ? (
                              <i className="ph ph-spinner animate-spin text-lg"></i>
                            ) : (
                              <i className="ph-fill ph-arrow-clockwise text-lg"></i>
                            )}
                          </Button>
                        )}
                        {payment.status !== 'paid' && (
                          <Button
                            onClick={() => handleManualPayment(payment)}
                            variant="ghost"
                            size="icon"
                            className="text-green-700 hover:bg-green-50"
                            title="Tandai lunas manual (tunai/transfer)"
                          >
                            <i className="ph-fill ph-money text-lg"></i>
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEditPayment(payment)}
                          variant="ghost"
                          size="icon"
                          className="text-emerald-600 hover:bg-emerald-50"
                          title="Edit nominal & jatuh tempo"
                        >
                          <i className="ph-fill ph-pencil-simple text-lg"></i>
                        </Button>
                        <Button
                          onClick={() => handleDeletePayment(payment)}
                          disabled={deletingId === payment.id || payment.status === 'paid'}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50 disabled:opacity-40"
                          title={payment.status === 'paid' ? 'Tagihan lunas tidak bisa dihapus' : 'Hapus tagihan'}
                        >
                          {deletingId === payment.id ? (
                            <i className="ph ph-spinner animate-spin text-lg"></i>
                          ) : (
                            <i className="ph-fill ph-trash text-lg"></i>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Footer */}
      {!loading && filteredData.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-6">
                <div>
                  <span className="text-gray-500">Total Data: </span>
                  <span className="font-semibold text-gray-900">{filteredData.length} siswa</span>
                </div>
                {activeTab === 'all' && (
                  <>
                    <div>
                      <span className="text-gray-500">Lunas: </span>
                      <span className="font-semibold text-green-600">{paidCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Belum Lunas: </span>
                      <span className="font-semibold text-orange-600">{unpaidCount}</span>
                    </div>
                  </>
                )}
              </div>
              {activeTab === 'paid' && (
                <div>
                  <span className="text-gray-500">Total Pemasukan: </span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(totalIncome)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Tagihan Modal */}
      <ModalEditTagihan
        isOpen={!!editPayment}
        payment={editPayment}
        onClose={() => setEditPayment(null)}
        onSave={handleSaveEdit}
      />

      {/* Manual Payment Modal */}
      <ModalManualPayment
        isOpen={!!manualPayment}
        payment={manualPayment}
        onClose={() => setManualPayment(null)}
        onConfirm={handleConfirmManual}
      />

      <ModalConfirmDelete
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, data: null })}
        onConfirm={confirmDelete}
        title={
          deleteModal.type === 'single'
            ? 'Hapus Tagihan'
            : deleteModal.type === 'byAmount'
              ? 'Hapus Payment by Nominal'
              : 'Hapus Semua Tagihan'
        }
        message={
          deleteModal.type === 'single'
            ? `Apakah Anda yakin ingin menghapus tagihan ini?`
            : deleteModal.type === 'byAmount'
              ? `Akan menghapus ${deleteModal.data?.count} payment di database yang nominalnya Rp ${deleteModal.data?.amount?.toLocaleString('id-ID')}. Aksi tidak dapat di-undo.`
              : `Apakah Anda yakin ingin menghapus SEMUA ${deleteModal.data?.count} tagihan untuk ${deleteModal.data?.month} ${deleteModal.data?.year}?`
        }
        itemName={
          deleteModal.type === 'single'
            ? `${deleteModal.data?.studentName} (${deleteModal.data?.month})`
            : ''
        }
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
      />

      {/* Send Reminder Modal */}
      <ModalConfirmDelete
        isOpen={reminderModal.isOpen}
        onClose={() => setReminderModal({ isOpen: false, count: 0 })}
        onConfirm={handleConfirmSendReminders}
        title="Kirim Email Reminder"
        message={`Apakah Anda yakin ingin mengirim email reminder ke ${reminderModal.count} orang tua dengan tagihan belum lunas?`}
        itemName={`${selectedMonth} ${selectedYear}`}
        type="warning"
        confirmText="Kirim Email"
        cancelText="Batal"
      />
    </div>
  );
}

export default MonitoringPenagihan;
