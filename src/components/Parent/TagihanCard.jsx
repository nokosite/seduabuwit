import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function TagihanCard({ payment, hasActiveTagihan, onBayar }) {
  const activeCardRef = useRef(null);
  const emptyStateRef = useRef(null);

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
    if (!hasActiveTagihan && activeCardRef.current && emptyStateRef.current) {
      gsap.to(activeCardRef.current, {
        height: 0,
        opacity: 0,
        margin: 0,
        padding: 0,
        duration: 0.5,
        onComplete: () => {
          gsap.fromTo(
            emptyStateRef.current,
            {
              scale: 0.9,
              opacity: 0
            },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out'
            }
          );
        }
      });
    }
  }, [hasActiveTagihan]);

  return (
    <>
      {hasActiveTagihan ? (
        <Card
          ref={activeCardRef}
          className="bg-gradient-to-br from-emerald-600 to-green-700 border-0 shadow-lg text-white mb-8 relative overflow-hidden parent-anim"
        >
          <i className="ph ph-wallet absolute right-[-10%] bottom-[-20%] text-9xl text-white opacity-10"></i>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-0 hover:bg-white/30">
                Bulan Ini
              </Badge>
              <span className="text-emerald-50 text-sm font-medium">
                Jatuh Tempo: {payment?.dueDate ? formatDate(payment.dueDate) : '-'}
              </span>
            </div>
            <h4 className="text-2xl font-bold mb-1">
              {payment?.month || 'Sumbangan Sukarela'}
            </h4>
            <p className="text-emerald-50 text-sm mb-6">
              Sumbangan untuk pengembangan fasilitas sekolah.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <p className="text-emerald-50 text-sm">Total Tagihan</p>
                <p className="text-3xl font-bold">
                  {payment?.totalAmount ? formatCurrency(payment.totalAmount) : 'Rp 0'}
                </p>
                {payment?.adminFee && (
                  <p className="text-emerald-50 text-xs mt-1">
                    Termasuk biaya admin {formatCurrency(payment.adminFee)}
                  </p>
                )}
              </div>
              <Button
                onClick={() => onBayar(payment)}
                className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-gray-50 font-bold shadow"
              >
                Bayar Sekarang <i className="ph ph-arrow-right font-bold ml-2"></i>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          ref={emptyStateRef}
          className="bg-green-50 border-green-200 mb-8"
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-check-circle"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              Hore! Tidak ada tagihan tertunggak.
            </h4>
            <p className="text-gray-600 text-sm">
              Terima kasih atas partisipasi Anda membangun sekolah.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default TagihanCard;
