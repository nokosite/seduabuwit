import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { addPaymentType, updatePaymentType, deletePaymentType, initializePaymentTypes } from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ModalConfirmDelete from '../Modals/ModalConfirmDelete';

const RECURRING_LABELS = {
  once: 'Sekali',
  monthly: 'Bulanan',
  semester: 'Per Semester',
  yearly: 'Tahunan'
};

function PaymentTypesView({ showToast }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', recurring: 'monthly', defaultAmount: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'paymentTypes'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTypes(data);
      setLoading(false);

      if (data.length === 0) {
        initializePaymentTypes();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!form.code || !form.name) {
      showToast('Kode dan Nama wajib diisi', 'error');
      return;
    }
    const result = editing
      ? await updatePaymentType(editing, form)
      : await addPaymentType(form);
    if (result.success) {
      showToast(editing ? 'Jenis pembayaran diperbarui' : 'Jenis pembayaran ditambahkan', 'success');
      setForm({ code: '', name: '', recurring: 'monthly', defaultAmount: 0 });
      setEditing(null);
    } else {
      showToast('Gagal: ' + result.error, 'error');
    }
  };

  const handleEdit = (t) => {
    setEditing(t.id);
    setForm({ code: t.code, name: t.name, recurring: t.recurring, defaultAmount: t.defaultAmount });
  };

  const handleDelete = async (t) => {
    setDeleteModal({ isOpen: true, data: t });
  };

  const confirmDelete = async () => {
    const result = await deletePaymentType(deleteModal.data.id);
    if (result.success) showToast('Berhasil dihapus', 'success');
    else showToast('Gagal: ' + result.error, 'error');
    
    setDeleteModal({ isOpen: false, data: null });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ph-fill ph-coins text-emerald-600 text-xl"></i>
            {editing ? 'Edit Jenis Pembayaran' : 'Tambah Jenis Pembayaran'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kode</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="sumbangan sukarela" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sumbangan Sukarela Bulanan" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Periode</Label>
              <select
                value={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-9"
              >
                {Object.entries(RECURRING_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label className="text-xs">Nominal Default (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.defaultAmount ? form.defaultAmount.toLocaleString('id-ID') : ''}
                onChange={(e) => setForm({ ...form, defaultAmount: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                placeholder="100.000"
              />
            </div>
            <div className="flex items-end gap-2">
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm({ code: '', name: '', recurring: 'monthly', defaultAmount: 0 });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              )}
              <Button
                onClick={handleSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <i className={`ph-fill ${editing ? 'ph-check' : 'ph-plus'} mr-1`}></i>
                {editing ? 'Update' : 'Tambah'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daftar Jenis Pembayaran</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ph ph-spinner animate-spin text-2xl"></i>
            </div>
          ) : types.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">Belum ada jenis pembayaran</p>
          ) : (
            <div className="space-y-2">
              {types.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <i className="ph-fill ph-coins text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <Badge variant="secondary" className="text-xs">{t.code}</Badge>
                      <Badge variant="outline" className="text-xs">{RECURRING_LABELS[t.recurring] || t.recurring}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Default: Rp {(t.defaultAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Button onClick={() => handleEdit(t)} variant="ghost" size="icon" className="text-emerald-600">
                    <i className="ph-fill ph-pencil-simple text-base"></i>
                  </Button>
                  <Button onClick={() => handleDelete(t)} variant="ghost" size="icon" className="text-red-600">
                    <i className="ph-fill ph-trash text-base"></i>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModalConfirmDelete
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, data: null })}
        onConfirm={confirmDelete}
        title="Hapus Jenis Pembayaran"
        message="Apakah Anda yakin ingin menghapus jenis pembayaran ini?"
        itemName={deleteModal.data?.name}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}

export default PaymentTypesView;
