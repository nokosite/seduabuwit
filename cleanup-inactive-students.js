import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCl_SmyFo8uoX9V00UFkVNrqSvjMAAhXOM",
  authDomain: "seduabuwitpayment.firebaseapp.com",
  projectId: "seduabuwitpayment",
  storageBucket: "seduabuwitpayment.firebasestorage.app",
  messagingSenderId: "525170063354",
  appId: "1:525170063354:web:3e7424b2d5e20f98065643",
  measurementId: "G-19CF1WW3VV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupInactiveStudents() {
  try {
    console.log('🔍 Mencari siswa dengan status inactive...');
    
    const q = query(
      collection(db, 'students'),
      where('status', '==', 'inactive')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('✅ Tidak ada siswa inactive yang perlu dihapus.');
      return;
    }
    
    console.log(`📋 Ditemukan ${snapshot.size} siswa inactive:`);
    
    const students = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      students.push({ id: doc.id, ...data });
      console.log(`   - ${data.name} (NISN: ${data.nisn})`);
    });
    
    console.log('\n⚠️  Apakah Anda yakin ingin menghapus PERMANEN siswa-siswa ini?');
    console.log('   Ketik "yes" untuk konfirmasi, atau Ctrl+C untuk batal.\n');
    
    process.stdin.once('data', async (data) => {
      const input = data.toString().trim().toLowerCase();
      
      if (input === 'yes') {
        console.log('\n🗑️  Menghapus siswa inactive...');
        
        let deleted = 0;
        for (const student of students) {
          try {
            await deleteDoc(doc(db, 'students', student.id));
            console.log(`   ✓ Dihapus: ${student.name}`);
            deleted++;
          } catch (error) {
            console.error(`   ✗ Gagal hapus ${student.name}: ${error.message}`);
          }
        }
        
        console.log(`\n✅ Selesai! ${deleted} dari ${students.length} siswa berhasil dihapus.`);
      } else {
        console.log('\n❌ Dibatalkan. Tidak ada data yang dihapus.');
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupInactiveStudents();
