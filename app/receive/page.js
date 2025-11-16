// app/receive/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ReceiveMoney() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeMode, setActiveMode] = useState('inApp');
  const [selectedNetwork, setSelectedNetwork] = useState('BEP-20');
  const [showNetworkModal, setShowNetworkModal] = useState(false);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const getWalletAddress = () => {
    switch (selectedNetwork) {
      case 'BEP-20':
        return '0x889b1e2576f28783813995129f24d48dd0ac31cc';
      case 'TRC-20':
        return 'TWXxExCLyYrWx6G2p466qATaEAZuuPj9i1';
      default:
        return '0x889b1e2576f28783813995129f24d48dd0ac31cc';
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
              <h1 className="text-xl font-bold text-white">Receive Money</h1>
              <p className="text-xs text-slate-400">Get your wallet code and address</p>
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
            In App
          </button>
          <button
            onClick={() => setActiveMode('deposit')}
            className={`mode-btn ${activeMode === 'deposit' ? 'active' : ''}`}
          >
            Deposit
          </button>
        </div>

        {activeMode === 'inApp' ? (
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-qrcode text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Wallet Code</h3>
              <p className="text-slate-400 mb-4">Share this code with others to receive money</p>
              
              {userData?.walletCode ? (
                <>
                  <div className="bg-slate-800 p-4 rounded-lg mb-4 border border-cyan-500/20">
                    <p className="text-2xl font-bold text-white tracking-wider font-mono">
                      {userData.walletCode}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(userData.walletCode)}
                    className="w-full btn-primary"
                  >
                    Copy Code
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin text-cyan-400 text-xl mb-2"></i>
                  <p className="text-slate-400">Loading wallet code...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <div className="space-y-4">
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
                    onClick={() => setShowNetworkModal(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wallet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={getWalletAddress()}
                    className="w-full input-field pr-16 bg-slate-700 cursor-not-allowed font-mono text-sm"
                    readOnly
                  />
                  <button
                    onClick={() => copyToClipboard(getWalletAddress())}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">⚠️ Important:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Only send USDT on {selectedNetwork} network</li>
                  <li>• Sending other coins may result in permanent loss</li>
                  <li>• Minimum deposit: 10 USDT</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Network Selection Modal */}
        {showNetworkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 network-modal">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">Select Network</h3>
                <p className="text-slate-400">Choose your preferred network</p>
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
    </div>
  );
}
