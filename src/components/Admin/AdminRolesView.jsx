import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ROLES = {
  superadmin: { label: 'Super Admin', desc: 'Akses penuh ke semua fitur', color: 'bg-purple-100 text-purple-700' },
  tu:         { label: 'Tata Usaha (TU)', desc: 'Kelola siswa & kelas', color: 'bg-blue-100 text-blue-700' },
  bendahara:  { label: 'Bendahara', desc: 'Kelola tagihan & pembayaran', color: 'bg-emerald-100 text-emerald-700' },
  kepsek:     { label: 'Kepala Sekolah', desc: 'View laporan & audit log', color: 'bg-amber-100 text-amber-700' }
};

function AdminRolesView({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { adminRole: newRole });
      showToast('Role diperbarui', 'success');
    } catch (e) {
      showToast('Gagal: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <i className="ph-fill ph-shield-check text-emerald-600 text-xl"></i>
            Manajemen Role Admin
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Atur tingkat akses untuk setiap admin. Hanya Super Admin yang dapat mengubah role.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {Object.entries(ROLES).map(([k, r]) => (
              <div key={k} className={`p-3 rounded-lg ${r.color.replace('text-', 'border-').replace('bg-', 'bg-').replace('-700', '-200')} border-2 ${r.color.includes('purple') ? 'border-purple-200' : r.color.includes('blue') ? 'border-blue-200' : r.color.includes('emerald') ? 'border-emerald-200' : 'border-amber-200'} bg-opacity-30`}>
                <Badge className={`${r.color} border-0 text-xs mb-1`}>{r.label}</Badge>
                <p className="text-xs text-gray-700">{r.desc}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ph ph-spinner animate-spin text-2xl"></i>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">Belum ada admin terdaftar</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const currentRole = u.adminRole || 'superadmin';
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {u.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{u.name || u.email}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <select
                      value={currentRole}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {Object.entries(ROLES).map(([k, r]) => (
                        <option key={k} value={k}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <i className="ph-fill ph-info text-blue-600 text-xl flex-shrink-0"></i>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Cara menambah admin baru:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Buat akun baru di Firebase Console (Authentication, lalu Add user)</li>
                <li>Tambah dokumen di Firestore collection <code className="bg-blue-100 px-1 rounded">users</code> dengan UID yang sama</li>
                <li>Set field <code className="bg-blue-100 px-1 rounded">role: 'admin'</code> dan <code className="bg-blue-100 px-1 rounded">adminRole: 'tu'</code> (atau role lainnya)</li>
                <li>Admin baru langsung bisa login dengan role yang ditentukan</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRolesView;
