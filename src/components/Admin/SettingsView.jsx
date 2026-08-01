import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useFirestore';
import { updateSchoolProfile } from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuditLogView from './AuditLogView';
import PaymentTypesView from './PaymentTypesView';
import AdminRolesView from './AdminRolesView';
import ModalPromoteClass from '../Modals/ModalPromoteClass';

function SettingsView({ showToast }) {
  const { settings, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('profil');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [form, setForm] = useState({
    schoolName: '',
    npsn: '',
    address: '',
    headmaster: '',
    treasurer: '',
    phone: '',
    academicYear: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName || 'SDN 2 Buwit',
        npsn: settings.npsn || '',
        address: settings.address || '',
        headmaster: settings.headmaster || '',
        treasurer: settings.treasurer || '',
        phone: settings.phone || '',
        academicYear: settings.academicYear || ''
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateSchoolProfile(settings?.id, form);
    setSaving(false);
    if (result.success) {
      showToast('Pengaturan sekolah berhasil disimpan', 'success');
    } else {
      showToast('Gagal menyimpan: ' + result.error, 'error');
    }
  };

  const tabs = [
    { id: 'profil', label: 'Profil Sekolah', icon: 'ph-buildings' },
    { id: 'akademik', label: 'Tahun Ajaran', icon: 'ph-calendar' },
    { id: 'pembayaran', label: 'Jenis Pembayaran', icon: 'ph-coins' },
    { id: 'akses', label: 'Akses Admin', icon: 'ph-shield-check' },
    { id: 'audit', label: 'Audit Log', icon: 'ph-clock-counter-clockwise' }
  ];

  return (
    <div className="admin-view">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <i className="ph-fill ph-gear text-emerald-600 text-2xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan</h2>
          <p className="text-gray-500 text-sm mt-1">Identitas sekolah, akses admin, & sistem pembayaran.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 font-semibold text-sm transition whitespace-nowrap rounded-t-xl flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className={`ph-fill ${t.icon} text-base`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFIL */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ph-fill ph-buildings text-emerald-600 text-xl"></i>
                Identitas Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Sekolah <span className="text-red-500">*</span></Label>
                  <Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>NPSN</Label>
                  <Input value={form.npsn} onChange={(e) => setForm({ ...form, npsn: e.target.value })} placeholder="10000000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Alamat Lengkap</Label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon Sekolah</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ph-fill ph-users-four text-emerald-600 text-xl"></i>
                Pejabat Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kepala Sekolah</Label>
                  <Input value={form.headmaster} onChange={(e) => setForm({ ...form, headmaster: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Bendahara</Label>
                  <Input value={form.treasurer} onChange={(e) => setForm({ ...form, treasurer: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Nama yang muncul di kuitansi & surat tunggakan.</p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || loading}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30"
            >
              {saving ? (
                <><i className="ph ph-spinner animate-spin mr-2"></i>Menyimpan...</>
              ) : (
                <><i className="ph-fill ph-check-circle mr-2"></i>Simpan Pengaturan</>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* AKADEMIK */}
      {activeTab === 'akademik' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ph-fill ph-calendar text-emerald-600 text-xl"></i>
                Tahun Ajaran Aktif
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Tahun Ajaran</Label>
                  <Input
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    placeholder="2025/2026"
                    className="mt-2 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: TahunAwal/TahunAkhir (mis. 2025/2026)</p>
                </div>
                <Button
                  onClick={async () => {
                    setSaving(true);
                    await updateSchoolProfile(settings?.id, { academicYear: form.academicYear });
                    setSaving(false);
                    showToast('Tahun ajaran diperbarui', 'success');
                  }}
                  disabled={saving}
                  className="mt-7 bg-emerald-600 hover:bg-emerald-700"
                >
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <i className="ph-fill ph-arrow-up text-amber-600 text-xl"></i>
                Kenaikan Kelas
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Jalankan kenaikan kelas masal di akhir tahun ajaran (biasanya Juni-Juli).
                Semua siswa kelas 1-5 akan naik 1 tingkat, kelas 6 ditandai <strong>Lulus</strong>.
              </p>
              <Button
                onClick={() => setShowPromoteModal(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                <i className="ph-fill ph-arrow-up mr-2"></i>
                Jalankan Kenaikan Kelas
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PEMBAYARAN (Jenis Pembayaran) */}
      {activeTab === 'pembayaran' && (
        <PaymentTypesView showToast={showToast} />
      )}

      {/* AKSES ADMIN */}
      {activeTab === 'akses' && (
        <AdminRolesView showToast={showToast} />
      )}

      {/* AUDIT LOG */}
      {activeTab === 'audit' && (
        <AuditLogView />
      )}

      <ModalPromoteClass
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />
    </div>
  );
}

export default SettingsView;
