// components/Dashboard/BalanceCard.jsx
'use client';
import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseService';

export default function BalanceCard({ userData }) {
  const [balanceVisible, setBalanceVisible] = useState(userData?.balanceVisible !== false);

  const toggleBalanceVisibility = async () => {
    if (!userData) return;
    
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        balanceVisible: !balanceVisible
      });
      setBalanceVisible(!balanceVisible);
    } catch (error) {
      console.error("Error toggling balance:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-slate-400">Total Balance</span>
        <button 
          onClick={toggleBalanceVisibility}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <i className={`fas fa-${balanceVisible ? 'eye' : 'eye-slash'}`}></i>
        </button>
      </div>
      
      <div className="text-3xl font-bold text-white mb-4">
        {balanceVisible ? formatCurrency(userData?.balance || 0) : '****'}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Today's Earnings:</span>
          <div className="text-white font-medium">
            {formatCurrency(userData?.todaysEarning || 0)}
          </div>
        </div>
        <div>
          <span className="text-slate-400">Referrals:</span>
          <div className="text-white font-medium">
            {userData?.todaysReferral || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
