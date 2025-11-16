// scripts/createAdminUser.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const adminEmail = 'admin@aimspace.com';
  const adminPassword = 'Admin123!'; // Change this in production

  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    // Create admin user document
    await setDoc(doc(db, "users", user.uid), {
      email: adminEmail,
      role: 'admin',
      isAdmin: true,
      balance: 0,
      walletCode: 'ADMIN001',
      referralCode: 'ADMINREF',
      approved: true,
      createdAt: new Date()
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('UID:', user.uid);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
