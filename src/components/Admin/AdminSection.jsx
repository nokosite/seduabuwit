import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HorizontalNavbar from '../Shared/HorizontalNavbar';
import DashboardView from './DashboardView';
import DataMasterView from './DataMasterView';
import LaporanView from './LaporanView';
import SettingsView from './SettingsView';
import ModalTambahData from '../Modals/ModalTambahData';
import ModalGenerateTagihan from '../Modals/ModalGenerateTagihan';

function AdminSection({ onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModalTambahData, setShowModalTambahData] = useState(false);
  const [showModalGenerateTagihan, setShowModalGenerateTagihan] = useState(false);

  const generateTagihanMasal = () => {
    setShowModalGenerateTagihan(true);
  };

  const handleGenerateSuccess = (message) => {
    setShowModalGenerateTagihan(false);
    setTimeout(() => {
      showToast(message);
    }, 400);
  };

  const handleSaveData = () => {
    setShowModalTambahData(false);
    setTimeout(() => {
      showToast('Data Siswa berhasil disimpan ke Firestore!');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavbar
        userRole="admin"
        userName="Administrator"
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Admin</span>
              <i className="ph ph-caret-right text-gray-400"></i>
              <span className="text-gray-900 font-medium">
                {location.pathname.includes('/datamaster')
                  ? 'Data Master'
                  : location.pathname.includes('/laporan')
                  ? 'Laporan'
                  : location.pathname.includes('/pengaturan')
                  ? 'Pengaturan'
                  : 'Dashboard'}
              </span>
            </nav>
          </div>

          {/* Routes */}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView onGenerateTagihan={generateTagihanMasal} />
              }
            />
            <Route
              path="/datamaster"
              element={
                <DataMasterView onOpenModal={() => setShowModalTambahData(true)} showToast={showToast} />
              }
            />
            <Route
              path="/laporan"
              element={<LaporanView />}
            />
            <Route
              path="/pengaturan"
              element={<SettingsView showToast={showToast} />}
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>

      {/* Modals */}
      <ModalTambahData
        show={showModalTambahData}
        onClose={() => setShowModalTambahData(false)}
        onSave={handleSaveData}
      />

      <ModalGenerateTagihan
        show={showModalGenerateTagihan}
        onClose={() => setShowModalGenerateTagihan(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  );
}

export default AdminSection;
