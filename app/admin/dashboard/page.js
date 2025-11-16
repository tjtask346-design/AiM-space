// app/admin/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../services/firebaseService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  limit,
  onSnapshot 
} from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    pendingWithdrawals: 0,
    totalBalance: 0
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser(user);
          loadDashboardData();
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error("Admin auth error:", error);
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadDashboardData = async () => {
    await loadStats();
    await loadPendingUsers();
    await loadPendingWithdrawals();
    await loadRecentTransactions();
  };

  const loadStats = async () => {
    try {
      // Total users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Pending approvals
      const pendingQuery = query(collection(db, "users"), where("approved", "==", false));
      const pendingSnapshot = await getDocs(pendingQuery);
      
      // Pending withdrawals
      const withdrawalsQuery = query(
        collection(db, "withdrawals"), 
        where("status", "==", "pending")
      );
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      
      // Total balance
      let totalBalance = 0;
      usersSnapshot.forEach(doc => {
        totalBalance += doc.data().balance || 0;
      });

      setStats({
        totalUsers: usersSnapshot.size,
        pendingApprovals: pendingSnapshot.size,
        pendingWithdrawals: withdrawalsSnapshot.size,
        totalBalance: totalBalance
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPendingUsers = async () => {
    try {
      const q = query(
        collection(db, "users"), 
        where("approved", "==", false),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingUsers(users);
    } catch (error) {
      console.error("Error loading pending users:", error);
    }
  };

  const loadPendingWithdrawals = async () => {
    try {
      const q = query(
        collection(db, "withdrawals"), 
        where("status", "==", "pending"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const withdrawals = [];
      
      querySnapshot.forEach((doc) => {
        withdrawals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingWithdrawals(withdrawals);
    } catch (error) {
      console.error("Error loading pending withdrawals:", error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const q = query(
        collection(db, "transactions"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });
      
      setRecentTransactions(transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const approveUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        approved: true,
        approvedAt: new Date()
      });
      
      alert('User approved successfully!');
      loadPendingUsers();
      loadStats();
    } catch (error) {
      console.error("Error approving user:", error);
      alert('Failed to approve user.');
    }
  };

  const rejectUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        approved: false,
        rejectionReason: "Manual rejection by admin"
      });
      
      alert('User rejected successfully!');
      loadPendingUsers();
      loadStats();
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert('Failed to reject user.');
    }
  };

  const processWithdrawal = async (withdrawalId, status, notes = '') => {
    try {
      await updateDoc(doc(db, "withdrawals", withdrawalId), {
        status: status,
        processedAt: new Date(),
        adminNotes: notes
      });

      alert(`Withdrawal ${status} successfully!`);
      loadPendingWithdrawals();
      loadStats();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert('Failed to process withdrawal.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Admin Header */}
      <header className="bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/1000066307.jpg" 
                alt="AiM Space Logo" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">AiM Space Admin</h1>
                <p className="text-xs text-slate-400">Administration Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700/50">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'fa-chart-bar' },
              { id: 'approvals', label: 'User Approvals', icon: 'fa-user-check' },
              { id: 'withdrawals', label: 'Withdrawals', icon: 'fa-money-bill-transfer' },
              { id: 'transactions', label: 'Transactions', icon: 'fa-exchange-alt' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <i className={`fas ${tab.icon} text-sm`}></i>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-blue-400"></i>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending Approvals</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingApprovals}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-clock text-yellow-400"></i>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingWithdrawals}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-money-bill-wave text-orange-400"></i>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-green-400"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Approvals */}
        {activeTab === 'approvals' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Pending User Approvals</h2>
            
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                <p className="text-slate-400">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{user.email}</h3>
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
                          Pending
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Phone:</span>
                          <p className="text-white">{user.phone}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Wallet Code:</span>
                          <p className="text-white font-mono">{user.walletCode}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Referral:</span>
                          <p className="text-white">{user.referralCode || 'None'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Registered:</span>
                          <p className="text-white">{formatDate(user.createdAt?.toDate())}</p>
                        </div>
                      </div>
                      {user.registrationHash && (
                        <div className="mt-2">
                          <span className="text-slate-400 text-sm">Transaction Hash:</span>
                          <p className="text-white text-sm font-mono break-all">{user.registrationHash}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(user.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawal Management */}
        {activeTab === 'withdrawals' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Pending Withdrawals</h2>
            
            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-green-400 text-3xl mb-2"></i>
                <p className="text-slate-400">No pending withdrawals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium">{withdrawal.userEmail}</h3>
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">
                          Pending
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="text-slate-400 text-sm">{withdrawal.network}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Wallet Address:</span>
                        <p className="text-white font-mono break-all">{withdrawal.walletAddress}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Requested:</span>
                        <p className="text-white">{formatDate(withdrawal.timestamp?.toDate())}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'approved', 'Payment processed successfully')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Approve & Pay
                      </button>
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'rejected', 'Insufficient funds')}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter rejection notes:');
                          if (notes) processWithdrawal(withdrawal.id, 'rejected', notes);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Reject with Note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions */}
        {activeTab === 'transactions' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-slate-400 font-medium">User</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Type</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-800/50">
                      <td className="py-3 text-white text-sm">
                        {transaction.userEmail || 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === 'send' 
                            ? 'bg-red-500/20 text-red-400'
                            : transaction.type === 'receive'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          <i className={`fas ${
                            transaction.type === 'send' ? 'fa-arrow-up' :
                            transaction.type === 'receive' ? 'fa-arrow-down' :
                            'fa-exchange-alt'
                          }`}></i>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 text-white font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 text-slate-400 text-sm">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
