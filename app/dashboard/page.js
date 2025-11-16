// app/dashboard/page.js
'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../services/firebaseService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import BalanceCard from '../../components/Dashboard/BalanceCard';
import QuickActions from '../../components/Dashboard/QuickActions';
import TransactionHistory from '../../components/Dashboard/TransactionHistory';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);
      
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Real-time listener for user data updates
        const unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });

        setLoading(false);

        return () => unsubscribeUser();
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-6">
      <DashboardHeader user={user} userData={userData} onLogout={handleLogout} />
      
      <div className="pt-20 px-6 max-w-md mx-auto space-y-6">
        <BalanceCard userData={userData} />
        <QuickActions />
        <TransactionHistory userId={user?.uid} />
      </div>
    </div>
  );
}
