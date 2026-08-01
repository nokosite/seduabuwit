import { useNavigate } from 'react-router-dom';
import { useStatistics, useActiveMonths } from '../../hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MonitoringPenagihan from './MonitoringPenagihan';
import IncomeChart from './IncomeChart';

function DashboardView({ onGenerateTagihan }) {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useStatistics();
  const { months: activeMonths } = useActiveMonths(null);
  const hasAnyBills = activeMonths.length > 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);

  const Spinner = () => <i className="ph ph-spinner animate-spin text-2xl"></i>;

  return (
    <div id="view-dashboard" className="admin-view block space-y-6">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halo, Admin SDN 2 Buwit</h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats.currentMonth} • {activeMonths.length} bulan aktif • {stats.totalStudents} siswa
        </p>
      </div>

      {/* 3 KPI Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Pemasukan Sumbangan Sukarela */}
        <Card className="border-0 bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-600/20">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <i className="ph-fill ph-wallet text-2xl"></i>
              </div>
              <span className="text-xs font-medium text-emerald-50/80 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-xs text-emerald-50/90 mb-1">Total Pemasukan</p>
            <h2 className="text-3xl font-bold leading-tight">
              {statsLoading ? <Spinner /> : formatCurrency(stats.totalIncome)}
            </h2>
            <p className="text-xs text-emerald-50/80 mt-2">
              {statsLoading ? '—' : `dari ${stats.paidThisMonth} pembayaran bulan ini`}
            </p>
          </CardContent>
        </Card>

        {/* Tingkat Penagihan */}
        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <i className="ph-fill ph-chart-pie-slice text-2xl"></i>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Progress</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Tingkat Penagihan</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              {statsLoading ? <Spinner /> : `${stats.collectionRate}%`}
            </h2>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${stats.collectionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {statsLoading ? '—' : `${stats.paidThisMonth}/${stats.paidThisMonth + stats.pendingThisMonth} lunas`}
            </p>
          </CardContent>
        </Card>

        {/* Total Tunggakan */}
        <Card className={`border ${stats.totalArrears > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.totalArrears > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <i className={`ph-fill ${stats.totalArrears > 0 ? 'ph-warning-circle' : 'ph-check-circle'} text-2xl`}></i>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Semua Bulan</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Tunggakan</p>
            <h2 className={`text-3xl font-bold leading-tight ${stats.totalArrears > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {statsLoading ? <Spinner /> : formatCurrency(stats.totalArrears)}
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              {statsLoading ? '—' : stats.totalArrears > 0 ? 'Perlu perhatian' : 'Semua lunas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2 Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onGenerateTagihan}
          className="text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-emerald-300 rounded-2xl p-4 flex items-center gap-3 transition group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
            <i className="ph-fill ph-paper-plane-tilt text-xl"></i>
          </div>
          <div className="flex-1">
            <h6 className="font-semibold text-gray-900 text-sm">Generate Tagihan</h6>
            <p className="text-xs text-gray-500">Buat tagihan Sumbangan Sukarela untuk bulan baru</p>
          </div>
          <i className="ph ph-arrow-right text-gray-400 group-hover:text-emerald-600 transition"></i>
        </button>

        <button
          onClick={() => navigate('/admin/datamaster')}
          className="text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-2xl p-4 flex items-center gap-3 transition group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
            <i className="ph-fill ph-database text-xl"></i>
          </div>
          <div className="flex-1">
            <h6 className="font-semibold text-gray-900 text-sm">Data Master</h6>
            <p className="text-xs text-gray-500">Kelola data siswa, kelas, & tarif</p>
          </div>
          <i className="ph ph-arrow-right text-gray-400 group-hover:text-blue-600 transition"></i>
        </button>
      </div>

      {/* Empty state — belum ada tagihan sama sekali */}
      {!hasAnyBills && !statsLoading && (
        <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <i className="ph-fill ph-receipt text-emerald-600 text-3xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Tagihan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Buat tagihan pertama agar statistik dan grafik mulai muncul.
            </p>
            <Button
              onClick={onGenerateTagihan}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30"
            >
              <i className="ph-fill ph-plus-circle mr-2"></i>
              Generate Tagihan Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chart & Monitoring */}
      {hasAnyBills && (
        <>
          <IncomeChart />
          <MonitoringPenagihan />
        </>
      )}
    </div>
  );
}

export default DashboardView;
