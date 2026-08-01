import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useActivePayment, usePaymentHistory, usePendingPayments, useChildrenOfParent } from '../../hooks/useFirestore';
import { confirmPaymentFromDuitku, requestCashPayment, cancelCashPayment } from '../../services/firestoreService';
import HorizontalNavbar from '../Shared/HorizontalNavbar';
import TagihanCard from './TagihanCard';
import RiwayatPembayaran from './RiwayatPembayaran';
import ModalDuitku from '../Modals/ModalDuitku';
import ModalCashPayment from '../Modals/ModalCashPayment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function ParentSection({ onLogout, showToast }) {
  const { currentUser } = useAuth();
  const [showDuitkuModal, setShowDuitkuModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const { children, loading: loadingChildren } = useChildrenOfParent(currentUser?.uid);

  // Auto-select first child
  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
    if (selectedChildId && !children.find((c) => c.id === selectedChildId) && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const studentId = selectedChildId;
  const studentInfo = useMemo(() => {
    const found = children.find((c) => c.id === selectedChildId);
    return found
      ? { name: found.name || 'Siswa', class: found.class || '-', nisn: found.nisn || '-' }
      : null;
  }, [children, selectedChildId]);

  const { activePayment, loading: loadingActive } = useActivePayment(studentId);
  const { pendingPayments } = usePendingPayments(studentId);
  const { history, loading: loadingHistory } = usePaymentHistory(studentId);

  const totalArrears = pendingPayments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);
  const arrearsCount = pendingPayments.length;
  const isOverdue = (p) => {
    if (!p.dueDate) return false;
    const d = p.dueDate?.toDate?.() || new Date(p.dueDate);
    return d < new Date();
  };
  const overdueCount = pendingPayments.filter(isOverdue).length;

  useEffect(() => {
    if (!loadingChildren && children.length === 0 && currentUser) {
      showToast('Belum ada data siswa terhubung dengan akun ini', 'error');
    }
  }, [loadingChildren, children.length, currentUser, showToast]);

  const [checkingStatus, setCheckingStatus] = useState(null);
  const [cashPaymentTarget, setCashPaymentTarget] = useState(null);

  const handleCashPayment = (payment) => {
    setCashPaymentTarget(payment);
  };

  const handleConfirmCash = async (paymentId, details) => {
    const result = await requestCashPayment(paymentId, details);
    if (result.success) {
      showToast('Permintaan bayar tunai dicatat. Silakan datang ke sekolah sesuai tanggal yang Anda pilih.', 'success');
      setCashPaymentTarget(null);
    }
    return result;
  };

  const handleCancelCash = async (payment) => {
    if (!confirm('Batalkan permintaan bayar tunai untuk tagihan ini?')) return;
    const result = await cancelCashPayment(payment.id);
    if (result.success) {
      showToast('Permintaan bayar tunai dibatalkan', 'success');
    } else {
      showToast('Gagal: ' + result.error, 'error');
    }
  };

  const handleCheckStatus = async (payment) => {
    if (!payment.merchantOrderId) {
      showToast('Tagihan ini belum pernah di-proses via Duitku', 'info');
      return;
    }
    setCheckingStatus(payment.id);
    const result = await confirmPaymentFromDuitku(payment.merchantOrderId);
    setCheckingStatus(null);
    if (result.success) {
      showToast('Pembayaran terkonfirmasi! Status tagihan diperbarui ke Lunas.', 'success');
    } else if (result.pending) {
      showToast('Pembayaran masih diproses Duitku. Coba lagi beberapa menit lagi.', 'info');
    } else {
      showToast(result.error || 'Gagal cek status', 'error');
    }
  };

  const handleBayar = (payment) => {
    setSelectedPayment(payment);
    setShowDuitkuModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowDuitkuModal(false);
    setSelectedPayment(null);
    showToast('Pembayaran berhasil diproses!');
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavbar
        userRole="parent"
        userName={studentInfo?.name || currentUser?.email}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
            <nav className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Orang Tua</span>
              <i className="ph ph-caret-right text-gray-400"></i>
              <span className="text-gray-900 font-medium">
                Dashboard {studentInfo ? `• ${studentInfo.name}` : ''}
              </span>
            </nav>

            {/* Child Switcher — tampil jika punya >1 anak */}
            {children.length > 1 && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                <i className="ph-fill ph-users text-emerald-600 text-lg ml-2"></i>
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none pr-2 py-1.5"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Kelas {c.class})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Card 1 - Info Sekolah */}
            <Card className="gradient-card-green border-0 overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full icon-backdrop flex items-center justify-center flex-shrink-0">
                  <i className="ph-fill ph-graduation-cap text-white text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-white font-semibold text-sm mb-1">SDN 2 Buwit</h6>
                  <p className="text-white/85 text-xs truncate">Sistem Pembayaran Sumbangan Sukarela Online</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-shrink-0 text-xs"
                >
                  <i className="ph-fill ph-info text-base"></i>
                </Button>
              </CardContent>
            </Card>

            {/* Card 2 - Bantuan */}
            <Card className="gradient-card-blue border-0 overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full icon-backdrop flex items-center justify-center flex-shrink-0">
                  <i className="ph-fill ph-question text-white text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-white font-semibold text-sm mb-1">Butuh Bantuan?</h6>
                  <p className="text-white/85 text-xs truncate">Hubungi admin sekolah</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-shrink-0 text-xs"
                >
                  <i className="ph-fill ph-phone text-base"></i>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Tagihan & Riwayat */}
            <div className="xl:col-span-2 space-y-6">
              {/* Arrears Banner */}
              {overdueCount > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <i className="ph-fill ph-warning text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-red-900 mb-0.5">
                      Anda memiliki {overdueCount} tagihan menunggak
                    </p>
                    <p className="text-sm text-red-700">
                      Mohon segera selesaikan pembayaran untuk menghindari sanksi sekolah.
                    </p>
                  </div>
                </div>
              )}

              {/* Tagihan Aktif */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h6 className="font-bold text-gray-900 flex items-center gap-2">
                    <i className="ph-fill ph-receipt text-xl"></i>
                    Tagihan Belum Lunas
                    {arrearsCount > 0 && (
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {arrearsCount}
                      </span>
                    )}
                  </h6>
                </div>
                {loadingActive ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Memuat tagihan...</p>
                    </CardContent>
                  </Card>
                ) : pendingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {/* Tagihan paling urgent (paling lama) - tampil besar */}
                    <TagihanCard
                      payment={pendingPayments[0]}
                      hasActiveTagihan={true}
                      onBayar={handleBayar}
                    />
                    {/* Tagihan lainnya - list ringkas */}
                    {pendingPayments.slice(1).map((p) => (
                      <Card key={p.id} className={
                        p.cashPending ? 'border-amber-200 bg-amber-50/30'
                        : isOverdue(p) ? 'border-red-200 bg-red-50/30'
                        : ''
                      }>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            p.cashPending ? 'bg-amber-100 text-amber-600'
                            : isOverdue(p) ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            <i className={`ph-fill ${p.cashPending ? 'ph-money' : 'ph-calendar-x'} text-xl`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{p.month}</p>
                            <p className="text-xs text-gray-500">
                              Jatuh tempo: {p.dueDate ? new Date(p.dueDate?.toDate?.() || p.dueDate).toLocaleDateString('id-ID') : '-'}
                              {isOverdue(p) && !p.cashPending && <span className="text-red-600 font-medium ml-1">• Terlambat</span>}
                              {p.cashPending && <span className="text-amber-600 font-medium ml-1">• Menunggu bayar tunai</span>}
                              {p.merchantOrderId && !p.cashPending && <span className="text-amber-600 font-medium ml-1">• Menunggu konfirmasi Duitku</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(p.totalAmount || p.amount)}</p>
                            <div className="flex gap-1 mt-1 justify-end">
                              {p.cashPending ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelCash(p)}
                                  className="h-7 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Batal
                                </Button>
                              ) : (
                                <>
                                  {p.merchantOrderId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCheckStatus(p)}
                                      disabled={checkingStatus === p.id}
                                      className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                                      title="Cek status pembayaran ke Duitku"
                                    >
                                      {checkingStatus === p.id ? (
                                        <i className="ph ph-spinner animate-spin"></i>
                                      ) : (
                                        <><i className="ph ph-arrow-clockwise mr-1"></i>Cek</>
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCashPayment(p)}
                                    className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                                    title="Bayar tunai di sekolah"
                                  >
                                    <i className="ph-fill ph-money mr-1"></i>Tunai
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBayar(p)}
                                    className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  >
                                    Online
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="empty-state">
                      <i className="ph-fill ph-check-circle text-5xl text-green-500 mb-3 block"></i>
                      <h6 className="font-semibold text-gray-900 mb-1">Tidak Ada Tagihan</h6>
                      <p className="text-sm text-gray-500">Semua tagihan sudah lunas</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Riwayat Pembayaran */}
              <div>
                <h6 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-clock-counter-clockwise text-xl"></i>
                  Riwayat Pembayaran
                </h6>
                <RiwayatPembayaran
                  history={history}
                  loading={loadingHistory}
                />
              </div>
            </div>

            {/* Right Column - Profile & Info */}
            <div className="space-y-6">
              {/* Profile Card */}
              <Card className="border-t-4 border-t-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 avatar-gradient">
                      <AvatarFallback className="text-white font-bold text-2xl">
                        {getInitials(studentInfo?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h6 className="font-bold text-gray-900 mb-1">
                        Hai, {studentInfo?.name || 'Siswa'}
                      </h6>
                      <p className="text-sm text-gray-500">
                        Kelas {studentInfo?.class || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">NISN</span>
                      <span className="font-medium">{studentInfo?.nisn || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Tunggakan Summary */}
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">Total Tunggakan</p>
                  <h3 className={`text-3xl font-bold mb-3 ${overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(totalArrears)}
                  </h3>
                  {activePayment && !activePayment.cashPending && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleBayar(activePayment)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30"
                      >
                        <i className="ph-fill ph-credit-card mr-2"></i>
                        Bayar Online (Duitku)
                      </Button>
                      <Button
                        onClick={() => handleCashPayment(activePayment)}
                        variant="outline"
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <i className="ph-fill ph-money mr-2"></i>
                        Bayar Tunai di Sekolah
                      </Button>
                      {activePayment.merchantOrderId && (
                        <Button
                          onClick={() => handleCheckStatus(activePayment)}
                          disabled={checkingStatus === activePayment.id}
                          variant="ghost"
                          className="w-full text-amber-700 hover:bg-amber-50 text-sm"
                          title="Sudah bayar tapi belum lunas? Klik untuk konfirmasi ke Duitku"
                        >
                          {checkingStatus === activePayment.id ? (
                            <><i className="ph ph-spinner animate-spin mr-2"></i>Memeriksa...</>
                          ) : (
                            <><i className="ph ph-arrow-clockwise mr-2"></i>Sudah Bayar Online? Cek Status</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Cash payment pending state */}
                  {activePayment && activePayment.cashPending && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <i className="ph-fill ph-money text-amber-600 text-xl flex-shrink-0"></i>
                        <div className="text-xs text-amber-800 flex-1">
                          <p className="font-semibold mb-1">Menunggu Pembayaran Tunai</p>
                          {activePayment.cashRequest?.plannedDate && (
                            <p>
                              Rencana bayar:{' '}
                              <strong>
                                {new Date(activePayment.cashRequest.plannedDate?.toDate?.() || activePayment.cashRequest.plannedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </strong>
                            </p>
                          )}
                          <p className="mt-1">Datang ke sekolah & temui bendahara.</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCancelCash(activePayment)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:bg-red-50 text-xs h-7"
                      >
                        <i className="ph ph-x mr-1"></i>
                        Batalkan & Bayar Online
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    {arrearsCount > 0
                      ? `${arrearsCount} tagihan belum lunas${overdueCount > 0 ? ` (${overdueCount} menunggak)` : ''}`
                      : 'Semua tagihan lunas'}
                  </p>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <i className="ph-fill ph-info text-blue-600 text-2xl flex-shrink-0"></i>
                    <div>
                      <h6 className="font-semibold text-blue-900 text-sm mb-1">Informasi</h6>
                      <p className="text-xs text-blue-700">
                        Pembayaran dapat dilakukan melalui berbagai metode: Transfer Bank, E-Wallet, dan Virtual Account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Duitku */}
      <ModalDuitku
        show={showDuitkuModal && !!selectedPayment}
        payment={selectedPayment}
        onClose={() => {
          setShowDuitkuModal(false);
          setSelectedPayment(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
        showToast={showToast}
      />

      {/* Modal Cash Payment */}
      <ModalCashPayment
        isOpen={!!cashPaymentTarget}
        payment={cashPaymentTarget}
        studentInfo={studentInfo}
        onClose={() => setCashPaymentTarget(null)}
        onConfirm={handleConfirmCash}
      />
    </div>
  );
}

export default ParentSection;
