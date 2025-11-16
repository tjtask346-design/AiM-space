// app/withdraw/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Withdraw() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('BEP-20');
  const [formData, setFormData] = useState({
    amount: '',
    walletAddress: '',
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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!user || !userData) return;

    setLoading(true);

    try {
      const { amount, walletAddress, walletPassword } = formData;
      const withdrawAmount = parseFloat(amount);

      // Validations
      if (withdrawAmount <= 0) {
        alert('Please enter a valid amount.');
        return;
      }

      if (withdrawAmount < 10) {
        alert('Minimum withdrawal amount is 10 USDT.');
        return;
      }

      if (!userData.transactionPassword) {
        alert('Please set your transaction password first.');
        return;
      }

      if (userData.transactionPassword !== walletPassword) {
        alert('Invalid transaction password.');
        return;
      }

      if (userData.balance < withdrawAmount) {
        alert('Insufficient balance.');
        return;
      }

      // Validate wallet address format based on network
      if (selectedNetwork === 'BEP-20' && !walletAddress.startsWith('0x')) {
        alert('Please enter a valid BEP-20 wallet address.');
        return;
      }

      if (selectedNetwork === 'TRC-20' && !walletAddress.startsWith('T')) {
        alert('Please enter a valid TRC-20 wallet address.');
        return;
      }

      // Create withdrawal request
      const withdrawalData = {
        userId: user.uid,
        userEmail: userData.email,
        type: 'withdrawal',
        amount: withdrawAmount,
        network: selectedNetwork,
        walletAddress: walletAddress,
        status: 'pending', // pending, approved, rejected
        timestamp: serverTimestamp(),
        adminNotes: ''
      };

      // Deduct balance immediately
      await updateDoc(doc(db, "users", user.uid), {
        balance: userData.balance - withdrawAmount
      });

      // Create withdrawal record
      await addDoc(collection(db, "withdrawals"), withdrawalData);

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: 'withdrawal',
        amount: withdrawAmount,
        network: selectedNetwork,
        walletAddress: walletAddress,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      alert('Withdrawal request submitted successfully! It will be processed within 24 hours.');

      // Reset form
      setFormData({
        amount: '',
        walletAddress: '',
        walletPassword: ''
      });

      // Refresh user data
      const updatedUserDoc = await getDoc(doc(db, "users", user.uid));
      if (updatedUserDoc.exists()) {
        setUserData(updatedUserDoc.data());
      }

    } catch (error) {
      console.error("Withdrawal error:", error);
      alert('Failed to process withdrawal. Please try again.');
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
              <h1 className="text-xl font-bold text-white">Withdraw Funds</h1>
              <p className="text-xs text-slate-400">Withdraw to external wallet</p>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 px-6 max-w-md mx-auto">
        <div className="glass-card p-6">
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Currency
              </label>
              <input
                type="text"
                value="USDT"
                className="w-full input-field bg-slate-700 cursor-not-allowed"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Choose Network
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedNetwork}
                  className="w-full input-field bg-slate-700 cursor-pointer"
                  readOnly
                  onClick={() => setShowNetworkModal(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowNetworkModal(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-slate-300 mb-2">
                Amount (USDT)
              </label>
              <input
                type="number"
                id="withdrawAmount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full input-field"
                placeholder="0.00"
                min="10"
                step="0.01"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Minimum: 10 USDT</p>
            </div>
            
            <div>
              <label htmlFor="withdrawAddress" className="block text-sm font-medium text-slate-300 mb-2">
                Your USDT Wallet Address ({selectedNetwork})
              </label>
              <input
                type="text"
                id="withdrawAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleInputChange}
                className="w-full input-field font-mono text-sm"
                placeholder={`Enter your ${selectedNetwork} wallet address`}
                required
              />
            </div>
            
            <div>
              <label htmlFor="withdrawPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Transaction Password (6-digit PIN)
              </label>
              <input
                type="password"
                id="withdrawPassword"
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

            {/* Balance and Fee Info */}
            {userData && (
              <div className="bg-slate-800/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="text-white font-medium">
                    ${userData.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Withdrawal Fee:</span>
                  <span className="text-white font-medium">1%</span>
                </div>
                {formData.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">You'll Receive:</span>
                    <span className="text-green-400 font-medium">
                      ${(parseFloat(formData.amount) * 0.99).toFixed(2)}
                    </span>
                  </div>
                )}
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
                'Submit Withdraw Request'
              )}
            </button>
          </form>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="text-yellow-400 font-medium mb-2 text-sm">⚠️ Important:</h4>
            <ul className="text-yellow-500/80 text-xs space-y-1">
              <li>• Withdrawals are processed within 24 hours</li>
              <li>• Ensure wallet address is correct for {selectedNetwork} network</li>
              <li>• 1% withdrawal fee applies</li>
              <li>• Minimum withdrawal: 10 USDT</li>
              <li>• Contact support for urgent withdrawals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Network Selection Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 network-modal">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">Select Network</h3>
              <p className="text-slate-400">Choose withdrawal network</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedNetwork('BEP-20');
                  setShowNetworkModal(false);
                }}
                className="network-option w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left border border-slate-700"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <i className="fab fa-btc text-white"></i>
                </div>
                <div>
                  <span className="text-white font-medium block">BEP-20</span>
                  <span className="text-slate-400 text-sm">BNB Smart Chain</span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedNetwork('TRC-20');
                  setShowNetworkModal(false);
                }}
                className="network-option w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left border border-slate-700"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bolt text-white"></i>
                </div>
                <div>
                  <span className="text-white font-medium block">TRC-20</span>
                  <span className="text-slate-400 text-sm">TRON Network</span>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowNetworkModal(false)}
              className="close-modal w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
