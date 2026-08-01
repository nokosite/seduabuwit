import { useState, useEffect } from 'react';
import { getRecentAuditLogs } from '../../services/firestoreService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ACTION_META = {
  GENERATE_TAGIHAN: { label: 'Generate Tagihan', color: 'bg-blue-100 text-blue-700', icon: 'ph-paper-plane-tilt' },
  DELETE_PAYMENT: { label: 'Hapus Tagihan', color: 'bg-red-100 text-red-700', icon: 'ph-trash' },
  DELETE_PAYMENTS_BULK: { label: 'Hapus Bulk Tagihan', color: 'bg-red-100 text-red-700', icon: 'ph-trash' },
  EDIT_PAYMENT: { label: 'Edit Tagihan', color: 'bg-amber-100 text-amber-700', icon: 'ph-pencil-simple' },
  MANUAL_PAYMENT: { label: 'Bayar Manual', color: 'bg-emerald-100 text-emerald-700', icon: 'ph-money' },
  PROMOTE_CLASS: { label: 'Kenaikan Kelas', color: 'bg-purple-100 text-purple-700', icon: 'ph-arrow-up' },
  ADD_STUDENT: { label: 'Tambah Siswa', color: 'bg-blue-100 text-blue-700', icon: 'ph-user-plus' },
  DELETE_STUDENT: { label: 'Hapus Siswa', color: 'bg-red-100 text-red-700', icon: 'ph-user-minus' },
  UPDATE_TARIF: { label: 'Update Tarif', color: 'bg-amber-100 text-amber-700', icon: 'ph-currency-circle-dollar' },
  UPDATE_SETTINGS: { label: 'Update Pengaturan', color: 'bg-gray-100 text-gray-700', icon: 'ph-gear' }
};

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const res = await getRecentAuditLogs(200);
    if (res.success) setLogs(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.action === filter);
  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-clock-counter-clockwise text-emerald-600 text-xl"></i>
            <h3 className="font-bold text-gray-900">Audit Log</h3>
            <span className="text-xs text-gray-500">({filtered.length} aktivitas)</span>
          </div>
          <Button onClick={load} variant="outline" size="sm">
            <i className="ph ph-arrow-clockwise text-base mr-1"></i>
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              filter === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            Semua
          </button>
          {uniqueActions.map((a) => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                filter === a ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              {ACTION_META[a]?.label || a}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <i className="ph ph-spinner animate-spin text-3xl text-gray-400"></i>
            <p className="text-sm text-gray-500 mt-2">Memuat log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="ph-fill ph-file-x text-4xl mb-2 block"></i>
            <p>Belum ada aktivitas tercatat</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map((log) => {
              const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700', icon: 'ph-circle' };
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className={`w-9 h-9 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`ph-fill ${meta.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${meta.color} border-0 text-xs`}>{meta.label}</Badge>
                      <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {log.details?.month && <span>Periode: <strong>{log.details.month}</strong> · </span>}
                      {log.details?.count !== undefined && <span>Jumlah: <strong>{log.details.count}</strong> · </span>}
                      {log.details?.studentName && <span>Siswa: <strong>{log.details.studentName}</strong> · </span>}
                      {log.details?.amount && <span>Nominal: <strong>Rp {log.details.amount.toLocaleString('id-ID')}</strong></span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Admin: {log.adminEmail || log.adminUid?.slice(0, 8) || 'unknown'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditLogView;
