// components/Dashboard/TransactionHistory.jsx
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseService';

export default function TransactionHistory({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadTransactions = async () => {
      try {
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const transactionsData = [];
        
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [userId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'send':
        return { icon: 'fa-arrow-up', color: 'text-red-400', bg: 'bg-red-500/20' };
      case 'receive':
        return { icon: 'fa-arrow-down', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'referral':
        return { icon: 'fa-users', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      case 'commission':
        return { icon: 'fa-chart-line', color: 'text-blue-400', bg: 'bg-blue-500/20' };
      default:
        return { icon: 'fa-exchange-alt', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  const getTransactionText = (type) => {
    switch (type) {
      case 'send':
        return 'Sent';
      case 'receive':
        return 'Received';
      case 'referral':
        return 'Referral Bonus';
      case 'commission':
        return 'Commission';
      default:
        return 'Transaction';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-32"></div>
              </div>
              <div className="h-4 bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Transaction History</h3>
        <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-exchange-alt text-slate-600 text-3xl mb-2"></i>
            <p className="text-slate-400">No transactions yet</p>
            <p className="text-slate-500 text-sm mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const { icon, color, bg } = getTransactionIcon(transaction.type);
            const isPositive = ['receive', 'referral', 'commission'].includes(transaction.type);
            
            return (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                    <i className={`fas ${icon} ${color}`}></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">{getTransactionText(transaction.type)}</p>
                    <p className="text-slate-400 text-sm">{formatDate(transaction.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-slate-400 text-sm capitalize">
                    {transaction.status || 'completed'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
