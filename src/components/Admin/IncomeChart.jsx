import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useActiveMonths, useActiveYears } from '../../hooks/useFirestore';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const MONTH_ORDER = {
  Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
  Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11
};

function IncomeChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');
  const { years: activeYears } = useActiveYears();
  const [selectedYear, setSelectedYear] = useState(null);
  const { months: activeMonths } = useActiveMonths(selectedYear);

  // Auto-pick newest year saat data tersedia
  useEffect(() => {
    if (activeYears.length > 0 && selectedYear === null) {
      setSelectedYear(activeYears[0]);
    }
  }, [activeYears, selectedYear]);

  // Real-time listener: hanya bulan yang punya tagihan
  useEffect(() => {
    if (!selectedYear || activeMonths.length === 0) {
      setChartData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'payments'),
      where('year', '==', selectedYear),
      where('status', '==', 'paid')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const buckets = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (!data.month) return;
          const [monthName] = data.month.split(' ');
          if (!buckets[monthName]) {
            buckets[monthName] = { month: monthName.substring(0, 3), fullMonth: monthName, total: 0, spp: 0, admin: 0, count: 0 };
          }
          buckets[monthName].total += data.totalAmount || data.amount || 0;
          buckets[monthName].spp += data.amount || 0;
          buckets[monthName].admin += data.adminFee || 0;
          buckets[monthName].count += 1;
        });

        // Hanya tampilkan bulan yang aktif (punya tagihan), urut kronologis
        const data = activeMonths
          .map((m) => buckets[m.month] || { month: m.month.substring(0, 3), fullMonth: m.month, total: 0, spp: 0, admin: 0, count: 0 })
          .sort((a, b) => (MONTH_ORDER[a.fullMonth] ?? 0) - (MONTH_ORDER[b.fullMonth] ?? 0));

        setChartData(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [selectedYear, activeMonths]);

  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{data.fullMonth} {selectedYear}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              <span className="font-medium">Total:</span> {formatCurrency(data.total)}
            </p>
            <p className="text-blue-600">
              <span className="font-medium">Sumbangan Sukarela:</span> {formatCurrency(data.spp)}
            </p>
            <p className="text-purple-600">
              <span className="font-medium">Admin:</span> {formatCurrency(data.admin)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Pembayaran:</span> {data.count} transaksi
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate total for active months only
  const yearlyTotal = chartData.reduce((sum, item) => sum + item.total, 0);
  const yearlyCount = chartData.reduce((sum, item) => sum + item.count, 0);
  const activeMonthsCount = chartData.length || 1;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="ph-fill ph-chart-bar text-xl"></i>
              Grafik Pemasukan Bulanan
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedYear
                ? `Visualisasi pemasukan ${activeMonthsCount} bulan aktif di tahun ${selectedYear}`
                : 'Belum ada data tagihan'}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Year Selector — hanya tahun yang punya tagihan */}
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={activeYears.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {activeYears.length === 0 ? (
                <option value="">— Belum ada data</option>
              ) : (
                activeYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))
              )}
            </select>

            {/* Chart Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  chartType === 'bar'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="ph-fill ph-chart-bar"></i>
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  chartType === 'line'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="ph-fill ph-chart-line"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Memuat data grafik...</p>
            </div>
          </div>
        ) : chartData.every(item => item.total === 0) ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <i className="ph-fill ph-chart-line-down text-5xl text-gray-400 mb-3 block"></i>
              <h6 className="font-semibold text-gray-900 mb-1">Belum Ada Data</h6>
              <p className="text-sm text-gray-500">
                Belum ada pemasukan untuk tahun {selectedYear}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="spp"
                  name="Sumbangan Sukarela Murni"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="admin"
                  name="Biaya Admin"
                  fill="#a855f7"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Pemasukan"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="spp"
                  name="Sumbangan Sukarela Murni"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}

        {/* Summary singkat — hanya total + transaksi tahunan (kontekstual untuk chart) */}
        {!loading && chartData.some(item => item.total > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <i className="ph-fill ph-calendar-check text-emerald-600"></i>
              <span className="text-gray-500">Total {selectedYear}:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(yearlyTotal)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>{yearlyCount} transaksi</span>
              <span>·</span>
              <span>{activeMonthsCount} bulan aktif</span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default IncomeChart;
