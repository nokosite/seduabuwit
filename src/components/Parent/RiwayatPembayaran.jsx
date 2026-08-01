import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { generateReceiptPDF } from '../../services/receiptService';

function RiwayatPembayaran({ history, loading }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownloadReceipt = async (item) => {
    setDownloading(item.id);
    await generateReceiptPDF(item);
    setDownloading(null);
  };

  const listRef = useRef(null);

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

  useEffect(() => {
    if (listRef.current && history.length > 0) {
      const newItem = listRef.current.firstElementChild;
      if (newItem && history[0].isNew) {
        gsap.fromTo(
          newItem,
          {
            y: -20,
            opacity: 0,
            backgroundColor: '#dcfce7'
          },
          {
            y: 0,
            opacity: 1,
            backgroundColor: 'transparent',
            duration: 0.5,
            clearProps: 'backgroundColor'
          }
        );
      }
    }
  }, [history]);

  return (
    <Card className="overflow-hidden">
      {loading ? (
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-3">Memuat riwayat...</p>
        </CardContent>
      ) : history.length === 0 ? (
        <CardContent className="empty-state">
          <i className="ph-fill ph-clock-counter-clockwise text-5xl text-gray-400 mb-3 block"></i>
          <h6 className="font-semibold text-gray-900 mb-1">Belum Ada Riwayat</h6>
          <p className="text-sm text-gray-500">Belum ada pembayaran yang tercatat</p>
        </CardContent>
      ) : (
        <div ref={listRef} className="divide-y divide-gray-100">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 bg-green-100 text-green-600">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    <i className="ph-fill ph-check font-bold"></i>
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-900">{item.month || 'Sumbangan'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dibayar: {formatDate(item.paidAt)} • {item.paymentMethod || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <p className="font-bold text-gray-900">
                  {formatCurrency(item.totalAmount || item.amount)}
                </p>
                <Button
                  onClick={() => handleDownloadReceipt(item)}
                  disabled={downloading === item.id}
                  variant="ghost"
                  size="icon"
                  className="text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  title="Unduh Kuitansi PDF"
                >
                  {downloading === item.id ? (
                    <i className="ph ph-spinner animate-spin text-xl"></i>
                  ) : (
                    <i className="ph-fill ph-download-simple text-xl"></i>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default RiwayatPembayaran;
