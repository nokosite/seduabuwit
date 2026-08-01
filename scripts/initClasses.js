import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqVJN_Ry3Yz8xGxGxGxGxGxGxGxGxGxGx",
  authDomain: "spp-sdn2buwit.firebaseapp.com",
  projectId: "spp-sdn2buwit",
  storageBucket: "spp-sdn2buwit.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndInitializeClasses() {
  try {
    console.log('Checking classes collection...');

    const classesRef = collection(db, 'classes');
    const snapshot = await getDocs(classesRef);

    console.log(`Found ${snapshot.size} classes in Firestore`);

    if (snapshot.empty) {
      console.log('No classes found. Initializing...');

      const classes = [1, 2, 3, 4, 5, 6];

      for (const grade of classes) {
        const docRef = await addDoc(classesRef, {
          grade: grade,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`Created class ${grade} with ID: ${docRef.id}`);
      }

      console.log('✅ Classes initialized successfully!');
    } else {
      console.log('Classes already exist:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Kelas ${data.grade}: ${data.isActive ? 'Aktif' : 'Tidak Aktif'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndInitializeClasses();
