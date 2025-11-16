// app/send/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import firebaseService from '../../services/firebaseService';

export default function SendMoney() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('inApp');
  const [formData, setFormData] = useState({
    recipientCode: '',
    amount: '',
    walletPassword: ''
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();
    if (!user || !userData) return;

    setLoading(true);

    try {
      const { recipientCode, amount, walletPassword } = formData;
      const sendAmount = parseFloat(amount);

      // Validate amount
      if (sendAmount <= 0) {
        alert('Please enter a valid amount.');
        return;
      }

      // Check if user has transaction password set
      if (!userData.transactionPassword) {
        alert('Please set your transaction password first in the menu.');
        return;
      }

      // Verify transaction password
      if (userData.transactionPassword !== walletPassword) {
        alert('Invalid transaction password.');
        return;
      }

      // Check balance
      if (userData.balance < sendAmount) {
        alert('Insufficient balance.');
        return;
      }

      // Find recipient by wallet code
      const q = query(collection(db, "users"), where("walletCode", "==", recipientCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('No user found with this wallet code.');
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientData = recipientDoc.data();

      if (recipientDoc.id === user.uid) {
        alert('You cannot send money to yourself.');
        return;
      }

      // Perform the transaction
      const batch = [];

      // Deduct from sender
      batch.push(updateDoc(doc(db, "users", user.uid), {
        balance: userData.balance - sendAmount
      }));

      // Add to recipient
      batch.push(updateDoc(doc(db, "users", recipientDoc.id), {
        balance: (recipientData.balance || 0) + sendAmount
      }));

      // Create transaction records
      const transactionData = {
        amount: sendAmount,
        timestamp: serverTimestamp(),
        status: 'completed'
      };

      // Sender's transaction record
      batch.push(addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: 'send',
        recipientCode: recipientCode,
        recipientEmail: recipientData.email,
        ...transactionData
      }));

      // Recipient's transaction record
      batch.push(addDoc(collection(db, "transactions"), {
        userId: recipientDoc.id,
        type: 'receive',
        senderCode: userData.walletCode,
        senderEmail: userData.email,
        ...transactionData
      }));

      // Apply lifetime commission
      await firebaseService.applyLifetimeCommission(recipientDoc.id, sendAmount);

      // Execute all operations
      await Promise.all(batch);

      alert(`Successfully sent $${sendAmount} to ${recipientCode}`);
      
      // Reset form
      setFormData({
        recipientCode: '',
        amount: '',
        walletPassword: ''
      });

      // Refresh user data
      const updatedUserDoc = await getDoc(doc(db, "users", user.uid));
      if (updatedUserDoc.exists()) {
        setUserData(updatedUserDoc.data());
      }

    } catch (error) {
      console.error("Send money error:", error);
      alert('Failed to send money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-6">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left text-white"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Send Money</h1>
              <p className="text-xs text-slate-400">Transfer funds to other users</p>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 px-6 max-w-md mx-auto">
        {/* Mode Switcher */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg">
          <button
            onClick={() => setActiveMode('inApp')}
            className={`mode-btn ${activeMode === 'inApp' ? 'active' : ''}`}
          >
            In App Transfer
          </button>
          <button
            onClick={() => setActiveMode('withdraw')}
            className={`mode-btn ${activeMode === 'withdraw' ? 'active' : ''}`}
          >
            Withdraw
          </button>
        </div>

        {activeMode === 'inApp' ? (
          <div className="glass-card p-6">
            <form onSubmit={handleSendMoney} className="space-y-4">
              <div>
                <label htmlFor="recipientCode" className="block text-sm font-medium text-slate-300 mb-2">
                  Recipient Wallet Code
                </label>
                <input
                  type="text"
                  id="recipientCode"
                  name="recipientCode"
                  value={formData.recipientCode}
                  onChange={handleInputChange}
                  className="w-full input-field uppercase font-mono"
                  placeholder="Enter 9-digit wallet code"
                  maxLength="9"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full input-field"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="walletPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Password (6-digit PIN)
                </label>
                <input
                  type="password"
                  id="walletPassword"
                  name="walletPassword"
                  value={formData.walletPassword}
                  onChange={handleInputChange}
                  className="w-full input-field font-mono"
                  placeholder="Enter your 6-digit PIN"
                  maxLength="6"
                  pattern="\d{6}"
                  required
                />
              </div>

              {userData && (
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Your Balance:</span>
                    <span className="text-white font-medium">
                      ${userData.balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i> Processing...
                  </div>
                ) : (
                  'Send Money'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-money-bill-transfer text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Withdraw Funds</h3>
              <p className="text-slate-400 mb-4">
                Withdraw your funds to external wallet
              </p>
              <button
                onClick={() => router.push('/withdraw')}
                className="w-full btn-primary"
              >
                Go to Withdraw Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
