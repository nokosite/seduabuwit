import { useState, useEffect } from 'react';
import { getPaymentMethods, createTransaction } from '../../services/duitkuService';
import { db } from '../../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function ModalDuitku({ show = false, onClose, onPaymentSuccess, payment }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'instructions'
  const [transactionData, setTransactionData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      // Load payment methods
      loadPaymentMethods();
    }
  }, [show]);

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setStep('select');
      setTransactionData(null);
      setError('');
    }
  }, [show]);

  // Effective payment amount — selalu dari Firestore, tanpa fallback hardcoded
  const paymentAmount = payment?.totalAmount ?? payment?.amount ?? 0;

  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    setError('');

    if (paymentAmount <= 0) {
      setError('Nominal tagihan tidak valid. Hubungi admin.');
      setIsLoadingMethods(false);
      return;
    }

    const result = await getPaymentMethods(paymentAmount);

    if (result.success) {
      // Filter hanya metode yang populer
      const popularMethods = result.data.filter(method =>
        ['VA', 'BT', 'BC', 'BN', 'BR', 'SP', 'OV', 'LF', 'DA', 'I1', 'A1', 'M2', 'NQ'].includes(method.paymentMethod)
      );
      setPaymentMethods(popularMethods);

      // Set default ke VA BCA jika ada
      const bcaVA = popularMethods.find(m => m.paymentMethod === 'BC');
      if (bcaVA) {
        setSelectedMethod(bcaVA);
      } else if (popularMethods.length > 0) {
        setSelectedMethod(popularMethods[0]);
      }
    } else {
      setError('Gagal memuat metode pembayaran: ' + result.error);
    }

    setIsLoadingMethods(false);
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    setError('');

    if (paymentAmount <= 0) {
      setError('Nominal tagihan tidak valid. Hubungi admin.');
      setIsProcessing(false);
      return;
    }

    const paymentData = {
      paymentMethod: selectedMethod.paymentMethod,
      paymentAmount: paymentAmount,
      merchantOrderId: `SUMBANGAN-SUKARELA-${Date.now()}`,
      productDetails: payment?.month || 'Sumbangan Sukarela',
      customerVaName: payment?.studentName || 'Siswa SDN 2 Buwit',
      email: 'parent@sdn2buwit.sch.id',
      phoneNumber: '081234567890',
      expiryPeriod: 1440 // 24 jam
    };

    const result = await createTransaction(paymentData);

    if (result.success) {
      // Update existing payment document with transaction details
      try {
        const paymentRef = doc(db, 'payments', payment.id);
        await setDoc(paymentRef, {
          merchantOrderId: paymentData.merchantOrderId,
          paymentMethod: paymentData.paymentMethod,
          reference: result.data.reference || null,
          vaNumber: result.data.vaNumber || null,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (_error) {
        // Non-fatal: payment will still be tracked via callback
      }

      // Redirect to Duitku payment page
      if (result.data.paymentUrl) {
        toast({
          title: "Redirecting...",
          description: "Mengarahkan ke halaman pembayaran Duitku",
        });

        window.location.href = result.data.paymentUrl;
      } else {
        // Fallback: Show instructions in modal (for development/mock mode)
        toast({
          title: "Development Mode",
          description: "Mock data - showing instructions instead of redirect",
        });

        setTransactionData({
          ...result.data,
          paymentMethodName: selectedMethod.paymentName,
          paymentMethodCode: selectedMethod.paymentMethod
        });
        setStep('instructions');
        setIsProcessing(false);
      }
    } else {
      setError('Gagal membuat transaksi: ' + result.error);
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = () => {
    // Simulasi: user sudah bayar, kita mark as success
    onPaymentSuccess({
      reference: transactionData.reference,
      vaNumber: transactionData.vaNumber,
      paymentUrl: transactionData.paymentUrl
    });
  };

  const getMethodIcon = (code) => {
    const icons = {
      'VA': 'ph-bank',
      'BC': 'ph-bank',
      'BT': 'ph-bank',
      'BN': 'ph-bank',
      'BR': 'ph-bank',
      'M2': 'ph-bank',
      'I1': 'ph-bank',
      'SP': 'ph-wallet',
      'OV': 'ph-wallet',
      'LF': 'ph-wallet',
      'DA': 'ph-wallet',
      'A1': 'ph-storefront',
      'FT': 'ph-qr-code',
      'NQ': 'ph-qr-code'
    };
    return icons[code] || 'ph-credit-card';
  };

  const getMethodCategory = (code) => {
    if (['BC', 'BT', 'BN', 'BR', 'M2', 'I1', 'VA'].includes(code)) return 'va';
    if (['SP', 'OV', 'LF', 'DA'].includes(code)) return 'ewallet';
    if (['NQ', 'QR'].includes(code)) return 'qris';
    if (['A1', 'FT'].includes(code)) return 'retail';
    return 'other';
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'va':
        return { label: 'Virtual Account', icon: 'ph-bank', tone: 'bg-emerald-100 text-emerald-700' };
      case 'ewallet':
        return { label: 'E-Wallet', icon: 'ph-wallet', tone: 'bg-amber-100 text-amber-700' };
      case 'qris':
        return { label: 'QRIS', icon: 'ph-qr-code', tone: 'bg-sky-100 text-sky-700' };
      case 'retail':
        return { label: 'Retail', icon: 'ph-storefront', tone: 'bg-violet-100 text-violet-700' };
      default:
        return { label: 'Lainnya', icon: 'ph-credit-card', tone: 'bg-gray-100 text-gray-700' };
    }
  };

  const groupedMethods = paymentMethods.reduce((acc, m) => {
    const cat = getMethodCategory(m.paymentMethod);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const categoryOrder = ['va', 'ewallet', 'qris', 'retail', 'other'];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Berhasil!",
      description: "Nomor VA berhasil disalin ke clipboard",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden p-0 rounded-2xl border-0 bg-white shadow-2xl">
        {/* Header - Green gradient with subtle pattern */}
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
          <div className="absolute -right-20 -bottom-16 w-48 h-48 rounded-full bg-white/5"></div>
          <DialogHeader className="relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-credit-card text-2xl text-white"></i>
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-white">
                  {step === 'select' ? 'Pilih Metode Pembayaran' : 'Instruksi Pembayaran'}
                </DialogTitle>
                <DialogDescription className="text-emerald-50/90 text-sm">
                  {step === 'select'
                    ? `${payment?.month || 'Tagihan Sumbangan Sukarela'} • ${payment?.studentName || 'Siswa'}`
                    : 'Selesaikan pembayaran Anda'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative mt-5 flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${step === 'select' ? 'text-white' : 'text-emerald-100/80'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'select' ? 'bg-white text-emerald-700' : 'bg-white/30 text-white'}`}>1</span>
                <span className="font-medium">Pilih Metode</span>
              </div>
              <div className="flex-1 h-px bg-white/30"></div>
              <div className={`flex items-center gap-1.5 ${step === 'instructions' ? 'text-white' : 'text-emerald-100/70'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'instructions' ? 'bg-white text-emerald-700' : 'bg-white/20 text-white/80'}`}>2</span>
                <span className="font-medium">Bayar</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
              <i className="ph-fill ph-warning-circle text-xl flex-shrink-0 text-red-500"></i>
              <span>{error}</span>
            </div>
          )}

          {step === 'select' ? (
            // Step 1: Select Payment Method
            <>
              {isLoadingMethods ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Memuat metode pembayaran...</p>
                </div>
              ) : (
                <>
                  {/* Grouped Payment Methods */}
                  <div className="space-y-5 mb-6">
                    {categoryOrder
                      .filter((cat) => groupedMethods[cat]?.length)
                      .map((cat) => {
                        const meta = getCategoryMeta(cat);
                        return (
                          <div key={cat}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.tone}`}>
                                <i className={`ph-fill ${meta.icon} text-sm`}></i>
                                {meta.label}
                              </span>
                              <span className="text-xs text-gray-400">{groupedMethods[cat].length} pilihan</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {groupedMethods[cat].map((method) => {
                                const active = selectedMethod?.paymentMethod === method.paymentMethod;
                                return (
                                  <label
                                    key={method.paymentMethod}
                                    className={`group relative flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                                      active
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 shadow-sm'
                                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="payment_method"
                                      className="sr-only"
                                      checked={active}
                                      onChange={() => setSelectedMethod(method)}
                                    />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                      active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                                    }`}>
                                      <i className={`ph-fill ${getMethodIcon(method.paymentMethod)} text-xl`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold text-sm truncate ${active ? 'text-emerald-900' : 'text-gray-900'}`}>
                                        {method.paymentName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {method.totalFee > 0
                                          ? `Biaya admin Rp ${method.totalFee.toLocaleString('id-ID')}`
                                          : 'Tanpa biaya admin'}
                                      </p>
                                    </div>
                                    {active && (
                                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                        <i className="ph-fill ph-check text-xs"></i>
                                      </div>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Total - Premium Card */}
                  <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5 overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-200/40"></div>
                    <div className="relative">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Pembayaran</span>
                        {selectedMethod && (
                          <span className="text-xs text-gray-600">
                            via <span className="font-semibold text-gray-900">{selectedMethod.paymentName}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-3xl font-bold text-gray-900">
                            {formatCurrency(paymentAmount)}
                          </p>
                          {payment?.adminFee && (
                            <p className="text-xs text-gray-500 mt-1">
                              Termasuk biaya admin {formatCurrency(payment.adminFee)}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-600 text-white items-center justify-center shadow-lg shadow-emerald-600/30">
                          <i className="ph-fill ph-receipt text-2xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Footer */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <i className="ph-fill ph-shield-check text-emerald-600"></i>
                    Transaksi diamankan oleh Duitku Payment Gateway
                  </div>
                </>
              )}
            </>
          ) : (
            // Step 2: Payment Instructions
            <div className="space-y-6">
              {/* Development Mode Warning */}
              {transactionData?._mockMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <i className="ph-fill ph-warning text-amber-600 text-xl flex-shrink-0"></i>
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Development Mode</p>
                      <p>Ini adalah mock data untuk testing UI. VA number tidak valid untuk pembayaran real.</p>
                      <p className="mt-2 text-xs">
                        <strong>Production:</strong> User akan di-redirect ke halaman Duitku untuk pembayaran.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ph-fill ph-info text-emerald-600 text-xl"></i>
                  <h4 className="font-bold text-emerald-900">Informasi Transaksi</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-semibold text-gray-900">{transactionData?.paymentMethodName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nomor Referensi:</span>
                    <span className="font-mono font-semibold text-gray-900">{transactionData?.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bayar:</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(transactionData?.amount || payment?.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* VA Number (for VA methods) */}
              {transactionData?.vaNumber && (
                <div className="bg-gradient-to-br from-emerald-700 to-green-800 p-6 text-white rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ph-fill ph-bank text-2xl"></i>
                    <h4 className="font-bold text-lg">Nomor Virtual Account</h4>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 mb-3 rounded-lg">
                    <p className="text-xs text-emerald-50 mb-1">Nomor VA:</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-2xl font-mono font-bold tracking-wider break-all">
                        {transactionData.vaNumber}
                      </p>
                      <Button
                        onClick={() => copyToClipboard(transactionData.vaNumber)}
                        variant="ghost"
                        size="icon"
                        className="bg-white/20 hover:bg-white/30 text-white flex-shrink-0"
                      >
                        <i className="ph-fill ph-copy text-xl"></i>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-50">
                    <i className="ph-fill ph-clock mr-1"></i>
                    Berlaku hingga 24 jam dari sekarang
                  </p>
                </div>
              )}

              {/* QR Code (for QRIS/E-Wallet) */}
              {transactionData?.qrString && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <i className="ph ph-qr-code text-2xl text-gray-700"></i>
                    <h4 className="font-bold text-gray-900">Scan QR Code</h4>
                  </div>
                  <div className="bg-white p-4 inline-block mb-4">
                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                      <i className="ph ph-qr-code text-6xl text-gray-400"></i>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan QR code di atas menggunakan aplikasi {transactionData.paymentMethodName}
                  </p>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-gray-50 p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ph ph-list-numbers text-xl"></i>
                  Cara Pembayaran
                </h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  {transactionData?.vaNumber ? (
                    <>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">1.</span>
                        <span>Buka aplikasi mobile banking atau ATM</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">2.</span>
                        <span>Pilih menu Transfer / Bayar</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">3.</span>
                        <span>Pilih Virtual Account</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">4.</span>
                        <span>Masukkan nomor VA: <span className="font-mono font-bold">{transactionData.vaNumber}</span></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">5.</span>
                        <span>Masukkan nominal: <span className="font-bold">{formatCurrency(transactionData.amount)}</span></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">6.</span>
                        <span>Konfirmasi dan selesaikan pembayaran</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">1.</span>
                        <span>Buka aplikasi {transactionData?.paymentMethodName}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">2.</span>
                        <span>Scan QR code di atas</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">3.</span>
                        <span>Konfirmasi pembayaran sebesar {formatCurrency(transactionData?.amount)}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-emerald-600">4.</span>
                        <span>Selesaikan transaksi</span>
                      </li>
                    </>
                  )}
                </ol>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ph-fill ph-warning text-amber-600 text-xl flex-shrink-0"></i>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Penting!</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Pastikan nominal yang dibayarkan sesuai</li>
                      <li>Simpan bukti pembayaran Anda</li>
                      <li>Status pembayaran akan otomatis terupdate</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          {step === 'select' ? (
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-11 border-gray-300"
              >
                Batal
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing || isLoadingMethods || !selectedMethod}
                className="flex-[2] h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-60 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <i className="ph-fill ph-lock-key mr-2 text-lg"></i>
                    Bayar Sekarang
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <Button
                onClick={handleConfirmPayment}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30"
              >
                <i className="ph-fill ph-check-circle mr-2 text-lg"></i>
                Saya Sudah Bayar
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-11 border-gray-300"
              >
                Kembali
              </Button>
            </div>
          )}

          <p className="text-center text-[11px] text-gray-400 mt-3">
            Powered by <span className="font-semibold text-gray-600">Duitku</span> • Transaksi terenkripsi
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ModalDuitku;
