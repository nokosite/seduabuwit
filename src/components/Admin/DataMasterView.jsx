import { useState, useEffect } from 'react';
import { useStudents, useClasses, useSettings } from '../../hooks/useFirestore';
import {
  deleteStudent,
  updateStudent,
  updateParentCredentials,
  initializeClasses,
  addClass,
  updateClass,
  deleteClass,
  toggleClassStatus,
  initializeSettings,
  updateTarif,
  bulkAddStudents
} from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ModalEditStudent from '../Modals/ModalEditStudent';
import ModalEditParent from '../Modals/ModalEditParent';
import ModalEditTarif from '../Modals/ModalEditTarif';
import ModalBulkImport from '../Modals/ModalBulkImport';
import ModalTambahKelas from '../Modals/ModalTambahKelas';
import ModalEditKelas from '../Modals/ModalEditKelas';
import ModalDiscount from '../Modals/ModalDiscount';
import ModalConfirmDelete from '../Modals/ModalConfirmDelete';
import MonitoringPenagihan from './MonitoringPenagihan';
import ExcelJS from 'exceljs';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { generateDunningLetter } from '../../services/receiptService';

function DataMasterView({ onOpenModal, showToast }) {
  const { students, loading, error } = useStudents();
  const { classes, loading: classesLoading } = useClasses();
  const { settings, loading: settingsLoading } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('siswa');
  const [editStudentModal, setEditStudentModal] = useState({ isOpen: false, student: null });
  const [editParentModal, setEditParentModal] = useState({ isOpen: false, student: null });
  const [editTarifModal, setEditTarifModal] = useState(false);
  const [togglingClass, setTogglingClass] = useState(null);
  const [bulkImportModal, setBulkImportModal] = useState(false);
  const [tambahKelasModal, setTambahKelasModal] = useState(false);
  const [editKelasModal, setEditKelasModal] = useState({ isOpen: false, kelas: null });
  const [discountModal, setDiscountModal] = useState({ isOpen: false, student: null });
  const [generatingLetter, setGeneratingLetter] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });

  const handleGenerateDunningLetter = async (student) => {
    setGeneratingLetter(student.id);
    try {
      const q = query(
        collection(db, 'payments'),
        where('studentId', '==', student.id),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const pending = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      pending.sort((a, b) => {
        const da = a.dueDate?.toDate?.() || new Date(a.dueDate || 0);
        const db_ = b.dueDate?.toDate?.() || new Date(b.dueDate || 0);
        return da - db_;
      });
      if (pending.length === 0) {
        showToast('Siswa ini tidak memiliki tunggakan', 'info');
      } else {
        const result = await generateDunningLetter(student, pending);
        if (result.success) {
          showToast(`Surat tunggakan diunduh: ${result.filename}`, 'success');
        } else {
          showToast('Gagal generate surat: ' + result.error, 'error');
        }
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
    setGeneratingLetter(null);
  };

  // Default classes if Firestore is empty
  const defaultClasses = [
    { id: 'default-1', grade: 1, isActive: true },
    { id: 'default-2', grade: 2, isActive: true },
    { id: 'default-3', grade: 3, isActive: true },
    { id: 'default-4', grade: 4, isActive: true },
    { id: 'default-5', grade: 5, isActive: true },
    { id: 'default-6', grade: 6, isActive: true }
  ];

  // Use Firestore classes if available, otherwise use defaults
  const displayClasses = classes.length > 0 ? classes : defaultClasses;

  // Initialize classes on mount if empty (run once per session)
  useEffect(() => {
    if (!classesLoading && classes.length === 0) {
      const hasInitialized = sessionStorage.getItem('classesInitialized');
      if (!hasInitialized) {
        sessionStorage.setItem('classesInitialized', 'true');
        initializeClasses();
      }
    }
  }, [classesLoading, classes]);

  // Initialize settings on mount if empty
  useEffect(() => {
    if (!settingsLoading && !settings?.id) {
      initializeSettings();
    }
  }, [settingsLoading, settings]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelas, pageSize]);

  // Filter students based on search and class filter
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      student.nisn?.toLowerCase().includes(query) ||
      student.name?.toLowerCase().includes(query) ||
      student.class?.toLowerCase().includes(query)
    );
    const matchesKelas = filterKelas === '' || student.class === filterKelas;
    return matchesSearch && matchesKelas;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedStudents = filteredStudents.slice(startIdx, endIdx);

  // Calculate statistics
  const totalStudents = students.length;
  const studentsByClass = displayClasses.map(cls => ({
    grade: cls.grade,
    count: students.filter(s => s.class === String(cls.grade)).length
  }));

  const handleDelete = async (studentId, studentName) => {
    setDeleteModal({ 
      isOpen: true, 
      type: 'student', 
      data: { studentId, studentName } 
    });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'student') {
      setDeleting(deleteModal.data.studentId);
      const result = await deleteStudent(deleteModal.data.studentId);

      if (result.success) {
        showToast('Siswa berhasil dihapus!', 'success');
      } else {
        showToast('Gagal menghapus siswa: ' + result.error, 'error');
      }
      setDeleting(null);
    } else if (deleteModal.type === 'kelas') {
      const result = await deleteClass(deleteModal.data.classId);

      if (result.success) {
        showToast(`Kelas ${deleteModal.data.grade} berhasil dihapus!`, 'success');
      } else {
        showToast('Gagal menghapus kelas: ' + result.error, 'error');
      }
    }
    
    setDeleteModal({ isOpen: false, type: null, data: null });
  };

  const handleEditStudent = (student) => {
    setEditStudentModal({ isOpen: true, student });
  };

  const handleSaveStudent = async (studentData) => {
    const result = await updateStudent(editStudentModal.student.id, studentData);

    if (result.success) {
      showToast('Data siswa berhasil diperbarui!', 'success');
      setEditStudentModal({ isOpen: false, student: null });
    } else {
      showToast('Gagal memperbarui data siswa: ' + result.error, 'error');
    }
  };

  const handleEditParent = (student) => {
    setEditParentModal({ isOpen: true, student });
  };

  const handleSaveParentCredentials = async (studentId, credentials) => {
    const result = await updateParentCredentials(studentId, credentials.parentEmail);

    if (result.success) {
      showToast('Email orang tua berhasil diperbarui!', 'success');
      setEditParentModal({ isOpen: false, student: null });
    } else {
      showToast('Gagal memperbarui data: ' + result.error, 'error');
    }
  };

  const handleToggleClassStatus = async (classId, currentStatus, grade) => {
    // If it's a default class, save to Firestore first
    if (classId.startsWith('default-')) {
      setTogglingClass(classId);
      const result = await addClass({ grade: grade, isActive: !currentStatus });
      setTogglingClass(null);

      if (result.success) {
        showToast('Kelas berhasil disimpan ke database!', 'success');
      } else {
        showToast('Gagal menyimpan kelas: ' + result.error, 'error');
      }
      return;
    }

    setTogglingClass(classId);
    const result = await toggleClassStatus(classId, currentStatus);

    if (result.success) {
      const statusText = currentStatus ? 'dinonaktifkan' : 'diaktifkan';
      showToast(`Kelas ${grade} berhasil ${statusText}!`, 'success');
    } else {
      showToast('Gagal mengubah status kelas: ' + result.error, 'error');
    }
    setTogglingClass(null);
  };

  const handleTambahKelas = () => {
    setTambahKelasModal(true);
  };

  const handleSaveTambahKelas = async (kelasData) => {
    const result = await addClass(kelasData);

    if (result.success) {
      showToast('Kelas berhasil ditambahkan!', 'success');
      setTambahKelasModal(false);
    } else {
      showToast('Gagal menambahkan kelas: ' + result.error, 'error');
    }
  };

  const handleEditKelas = (kelas) => {
    // If it's a default class, save to Firestore first then open edit modal
    if (kelas.id.startsWith('default-')) {
      showToast('Menyimpan kelas ke database...', 'info');
      addClass({ grade: kelas.grade, isActive: kelas.isActive }).then(result => {
        if (result.success) {
          showToast('Kelas berhasil disimpan! Silakan refresh halaman untuk edit.', 'success');
        } else {
          showToast('Gagal menyimpan kelas: ' + result.error, 'error');
        }
      });
      return;
    }
    setEditKelasModal({ isOpen: true, kelas });
  };

  const handleSaveKelas = async (kelasData) => {
    const result = await updateClass(editKelasModal.kelas.id, kelasData);

    if (result.success) {
      showToast('Data kelas berhasil diperbarui!', 'success');
      setEditKelasModal({ isOpen: false, kelas: null });
    } else {
      showToast('Gagal memperbarui data kelas: ' + result.error, 'error');
    }
  };

  const handleDeleteKelas = async (classId, grade) => {
    if (classId.startsWith('default-')) {
      showToast('Kelas default tidak bisa dihapus. Gunakan toggle status untuk menonaktifkan.', 'warning');
      return;
    }

    const studentsInClass = students.filter(s => s.class === String(grade));

    if (studentsInClass.length > 0) {
      showToast(`Tidak bisa menghapus Kelas ${grade} karena masih ada ${studentsInClass.length} siswa!`, 'error');
      return;
    }

    setDeleteModal({ 
      isOpen: true, 
      type: 'kelas', 
      data: { classId, grade } 
    });
  };

  const handleSaveTarif = async (newTarif, newBiayaAdmin) => {
    const result = await updateTarif(settings?.id, newTarif, newBiayaAdmin);

    if (result.success) {
      showToast('Tarif sumbangan berhasil diperbarui!', 'success');
      setEditTarifModal(false);
    } else {
      showToast('Gagal memperbarui tarif: ' + result.error, 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handler for bulk import
  const handleBulkImport = async (studentsData) => {
    const result = await bulkAddStudents(studentsData);

    if (result.success) {
      showToast(result.message, 'success');
      setBulkImportModal(false);

      // Show detailed results if there are failures
      if (result.results.failed.length > 0) {
        setTimeout(() => {
          showToast(
            `${result.results.failed.length} data gagal diimport. Periksa kembali email/NISN duplikat.`,
            'error'
          );
        }, 2000);
      }
    } else {
      showToast('Gagal mengimport data: ' + result.error, 'error');
    }
  };

  // Handler for export Excel
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Siswa');

      // Set column headers
      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'NISN', key: 'nisn', width: 15 },
        { header: 'Nama Siswa', key: 'name', width: 25 },
        { header: 'Kelas', key: 'class', width: 10 },
        { header: 'Nama Orang Tua', key: 'parentName', width: 25 },
        { header: 'Email Orang Tua', key: 'parentEmail', width: 30 },
        { header: 'No. HP Orang Tua', key: 'parentPhone', width: 15 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A34A' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 25;

      // Add data rows
      filteredStudents.forEach((student, index) => {
        worksheet.addRow({
          no: index + 1,
          nisn: student.nisn || '-',
          name: student.name || '-',
          class: student.class || '-',
          parentName: student.parentName || '-',
          parentEmail: student.parentEmail || '-',
          parentPhone: student.parentPhone || '-'
        });
      });

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Data_Siswa_${timestamp}.xlsx`;

      // Download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast(`Berhasil mengunduh ${filename}`, 'success');
    } catch (error) {
      showToast('Gagal mengunduh Excel: ' + error.message, 'error');
    }
  };

  return (
    <>
    <div id="view-datamaster" className="admin-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <i className="ph-fill ph-database text-emerald-600 text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manajemen Data Master
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Kelola data dasar sistem: Siswa, Kelas, dan Nominal Tarif.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 relative z-10">
          <Button
            onClick={() => setBulkImportModal(true)}
            variant="outline"
            className="h-9 rounded-md px-4 text-sm font-semibold"
          >
            <i className="ph-fill ph-file-xls text-lg mr-2"></i>
            Import Excel
          </Button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenModal();
            }}
            className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow transition-colors"
          >
            <i className="ph-fill ph-plus text-lg"></i>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Sub-tabs Data Master */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('siswa')}
          className={`px-6 py-4 font-semibold text-sm transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'siswa'
              ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Data Siswa
        </button>
        <button
          onClick={() => setActiveSubTab('kelas')}
          className={`px-6 py-4 font-semibold text-sm transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'kelas'
              ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Data Kelas
        </button>
        <button
          onClick={() => setActiveSubTab('tarif')}
          className={`px-6 py-4 font-semibold text-sm transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'tarif'
              ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tarif Sumbangan
        </button>
        <button
          onClick={() => setActiveSubTab('monitoring')}
          className={`px-6 py-4 font-semibold text-sm transition whitespace-nowrap rounded-t-xl ${
            activeSubTab === 'monitoring'
              ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Monitoring Pembayaran
        </button>
      </div>

      {/* Content based on active sub-tab */}
      {activeSubTab === 'siswa' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <i className="ph-fill ph-student text-xl text-emerald-600"></i>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Data Siswa</h3>
                  <p className="text-xs text-gray-500">{totalStudents} siswa terdaftar</p>
                </div>
              </div>
              <Button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <i className="ph-fill ph-file-xls text-lg mr-2"></i>
                Export Excel
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <i className="ph-fill ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border"
                    placeholder="Cari NISN atau Nama..."
                  />
                </div>
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg h-10 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {displayClasses.map((cls) => (
                    <option key={cls.grade} value={String(cls.grade)}>
                      Kelas {cls.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">NISN</th>
                  <th className="p-4 font-medium">Nama Siswa</th>
                  <th className="p-4 font-medium">Kelas</th>
                  <th className="p-4 font-medium">Email Orang Tua</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      <i className="ph ph-spinner animate-spin text-2xl"></i>
                      <p className="mt-2">Loading data siswa...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-red-500">
                      <i className="ph ph-warning text-4xl mb-2"></i>
                      <p>Error: {error}</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      <i className="ph ph-user-x text-4xl mb-2"></i>
                      <p>{searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa'}</p>
                      {!searchQuery && (
                        <Button
                          onClick={onOpenModal}
                          variant="link"
                          className="mt-4"
                        >
                          + Tambah Siswa Pertama
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500">{student.nisn}</td>
                      <td className="p-4 font-bold text-gray-900">{student.name}</td>
                      <td className="p-4">
                        <Badge variant="secondary">Kelas {student.class}</Badge>
                      </td>
                      <td className="p-4">
                        {student.parentEmail ? (
                          <div className="flex items-center gap-2">
                            <i className="ph-fill ph-envelope text-green-600 text-base"></i>
                            <span className="text-gray-700">{student.parentEmail}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <i className="ph-fill ph-warning text-orange-500 text-base"></i>
                            <span className="text-gray-400 italic">Belum diatur</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 flex justify-end gap-1">
                        {student.discountType && student.discountValue > 0 && (
                          <span className="self-center mr-1" title={`Diskon: ${student.discountValue}${student.discountType === 'percent' ? '%' : ''} - ${student.discountReason || ''}`}>
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                              <i className="ph-fill ph-percent mr-0.5"></i>
                              {student.discountValue}{student.discountType === 'percent' ? '%' : ''}
                            </Badge>
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDiscountModal({ isOpen: true, student })}
                          className="text-amber-600 hover:bg-amber-50"
                          title="Atur Keringanan"
                        >
                          <i className="ph-fill ph-percent text-xl"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGenerateDunningLetter(student)}
                          disabled={generatingLetter === student.id}
                          className="text-purple-600 hover:bg-purple-50"
                          title="Cetak Surat Tunggakan"
                        >
                          {generatingLetter === student.id ? (
                            <i className="ph ph-spinner animate-spin text-xl"></i>
                          ) : (
                            <i className="ph-fill ph-envelope text-xl"></i>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStudent(student)}
                          className="text-emerald-600 hover:bg-emerald-50"
                          title="Edit Data Siswa"
                        >
                          <i className="ph-fill ph-pencil-simple text-xl"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditParent(student)}
                          className="text-blue-600 hover:bg-blue-50"
                          title="Edit Email & Password Orang Tua"
                        >
                          <i className="ph-fill ph-user-circle-gear text-xl"></i>
                        </Button>
                        <Button
                          onClick={() => handleDelete(student.id, student.name)}
                          disabled={deleting === student.id}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          {deleting === student.id ? (
                            <i className="ph ph-spinner animate-spin text-xl"></i>
                          ) : (
                            <i className="ph-fill ph-trash text-xl"></i>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination Footer */}
            {filteredStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>
                    Menampilkan <span className="font-semibold text-gray-900">{startIdx + 1}</span>
                    {' - '}
                    <span className="font-semibold text-gray-900">{Math.min(endIdx, filteredStudents.length)}</span>
                    {' dari '}
                    <span className="font-semibold text-gray-900">{filteredStudents.length}</span> siswa
                  </span>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-gray-400">·</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value={10}>10/halaman</option>
                      <option value={25}>25/halaman</option>
                      <option value={50}>50/halaman</option>
                      <option value={100}>100/halaman</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={safePage === 1}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Halaman pertama"
                    >
                      <i className="ph ph-caret-double-left text-base"></i>
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Sebelumnya"
                    >
                      <i className="ph ph-caret-left text-base"></i>
                    </Button>

                    {/* Page numbers (windowed) */}
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, safePage - 2);
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
                      for (let p = start; p <= end; p++) {
                        pages.push(
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded-md transition ${
                              p === safePage
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Berikutnya"
                    >
                      <i className="ph ph-caret-right text-base"></i>
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safePage === totalPages}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Halaman terakhir"
                    >
                      <i className="ph ph-caret-double-right text-base"></i>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Kelas Tab */}
      {activeSubTab === 'kelas' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <i className="ph-fill ph-chalkboard-teacher text-xl text-emerald-600"></i>
                <h3 className="text-lg font-bold text-gray-900">Data Kelas</h3>
              </div>
              <Button
                onClick={handleTambahKelas}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <i className="ph-fill ph-plus text-lg mr-2"></i>
                Tambah Kelas
              </Button>
            </div>

            {classesLoading ? (
              <div className="text-center py-12">
                <i className="ph ph-spinner animate-spin text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-500">Memuat data kelas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayClasses.map((kelas) => {
                  const jumlahSiswa = students.filter(s => s.class === String(kelas.grade)).length;
                  const isActive = kelas.isActive;

                  return (
                    <Card
                      key={kelas.id}
                      className="border hover:shadow-md transition"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">Kelas {kelas.grade}</h4>
                            <p className="text-sm text-gray-500">{jumlahSiswa} siswa</p>
                          </div>
                          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                            {isActive ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditKelas(kelas)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleToggleClassStatus(kelas.id, isActive, kelas.grade)}
                            disabled={togglingClass === kelas.id}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {togglingClass === kelas.id ? (
                              <i className="ph ph-spinner animate-spin text-sm"></i>
                            ) : isActive ? (
                              "Nonaktifkan"
                            ) : (
                              "Aktifkan"
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeleteKelas(kelas.id, kelas.grade)}
                            size="sm"
                            variant="ghost"
                          >
                            <i className="ph-fill ph-trash text-red-600"></i>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Info Card */}
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex gap-3">
                <i className="ph-fill ph-info text-emerald-600 text-xl flex-shrink-0"></i>
                <div className="text-sm text-emerald-800">
                  <p className="font-medium mb-2">Keterangan Status Kelas:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white border-0 text-xs">
                        <i className="ph-fill ph-check-circle text-xs mr-1"></i>
                        Aktif
                      </Badge>
                      <span>Kelas sedang berjalan tahun ajaran ini</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white border-0 text-xs">
                        <i className="ph-fill ph-x-circle text-xs mr-1"></i>
                        Tidak Aktif
                      </Badge>
                      <span>Kelas tidak digunakan (libur/tidak ada siswa)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarif Sumbangan Tab */}
      {activeSubTab === 'tarif' && (
        <Card>
          <CardContent className="p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <i className="ph-fill ph-currency-circle-dollar text-xl text-green-600"></i>
                <h3 className="text-lg font-bold text-gray-900">Pengaturan Tarif Sumbangan</h3>
              </div>

              {settingsLoading ? (
                <div className="text-center py-12">
                  <i className="ph ph-spinner animate-spin text-3xl text-gray-400 mb-2"></i>
                  <p className="text-gray-500 text-sm">Memuat data tarif...</p>
                </div>
              ) : (
              <div className="space-y-3">
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Sumbangan Bulanan</p>
                        <h4 className="text-2xl font-bold text-gray-900">
                          {formatCurrency(settings?.tarif || 100000)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Per siswa per bulan</p>
                      </div>
                      <Button
                        onClick={() => setEditTarifModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <i className="ph-fill ph-pencil-simple text-base mr-2"></i>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Biaya Admin (Duitku)</p>
                        <h4 className="text-xl font-bold text-gray-900">
                          {formatCurrency(settings?.biayaAdmin || 4500)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Biaya payment gateway</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Editable</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total yang Dibayar Orang Tua</p>
                        <h4 className="text-2xl font-bold text-gray-900">
                          {formatCurrency((settings?.tarif || 100000) + (settings?.biayaAdmin || 4500))}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Sumbangan + Biaya Admin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex gap-3">
                    <i className="ph-fill ph-info text-gray-400 text-lg flex-shrink-0"></i>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Catatan:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Perubahan tarif hanya berlaku untuk tagihan baru</li>
                        <li>Biaya admin disesuaikan dengan ketentuan Duitku</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monitoring Pembayaran Tab */}
      {activeSubTab === 'monitoring' && (
        <MonitoringPenagihan />
      )}
    </div>

    {/* Modal Edit Student */}
    <ModalEditStudent
      isOpen={editStudentModal.isOpen}
      onClose={() => setEditStudentModal({ isOpen: false, student: null })}
      student={editStudentModal.student}
      availableClasses={displayClasses.map(c => c.grade)}
      onSave={handleSaveStudent}
    />

    {/* Modal Edit Parent */}
    <ModalEditParent
      isOpen={editParentModal.isOpen}
      onClose={() => setEditParentModal({ isOpen: false, student: null })}
      student={editParentModal.student}
      onSave={handleSaveParentCredentials}
    />

    {/* Modal Edit Tarif */}
    <ModalEditTarif
      isOpen={editTarifModal}
      onClose={() => setEditTarifModal(false)}
      currentTarif={settings?.tarif || 100000}
      currentBiayaAdmin={settings?.biayaAdmin || 4500}
      onSave={handleSaveTarif}
    />

    {/* Modal Bulk Import */}
    <ModalBulkImport
      isOpen={bulkImportModal}
      onClose={() => setBulkImportModal(false)}
      onImport={handleBulkImport}
      showToast={showToast}
    />

    {/* Modal Tambah Kelas */}
    <ModalTambahKelas
      isOpen={tambahKelasModal}
      onClose={() => setTambahKelasModal(false)}
      existingGrades={displayClasses.map(c => c.grade)}
      onSave={handleSaveTambahKelas}
    />

    {/* Modal Edit Kelas */}
    <ModalEditKelas
      isOpen={editKelasModal.isOpen}
      onClose={() => setEditKelasModal({ isOpen: false, kelas: null })}
      kelas={editKelasModal.kelas}
      onSave={handleSaveKelas}
    />

    {/* Modal Diskon */}
    <ModalDiscount
      isOpen={discountModal.isOpen}
      student={discountModal.student}
      onClose={() => setDiscountModal({ isOpen: false, student: null })}
      onSaved={() => showToast('Keringanan disimpan', 'success')}
    />

    {/* Modal Confirm Delete */}
    <ModalConfirmDelete
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ isOpen: false, type: null, data: null })}
      onConfirm={confirmDelete}
      title={deleteModal.type === 'student' ? 'Hapus Siswa' : 'Hapus Kelas'}
      message={
        deleteModal.type === 'student' 
          ? `Apakah Anda yakin ingin menghapus siswa ini? Semua data pembayaran terkait juga akan terhapus.`
          : `Apakah Anda yakin ingin menghapus kelas ini?`
      }
      itemName={
        deleteModal.type === 'student' 
          ? deleteModal.data?.studentName 
          : `Kelas ${deleteModal.data?.grade}`
      }
      type="danger"
      confirmText="Hapus"
      cancelText="Batal"
    />
    </>
  );
}

export default DataMasterView;
