// app/menu/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../services/firebaseService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Menu() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { oldPassword, newPassword, confirmPassword } = passwordForm;

      // Validate new password
      if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
        alert('Password must be exactly 6 digits.');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
      }

      // Get current user data
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const currentUserData = userDoc.data();

      // If changing password, verify old password
      if (currentUserData.transactionPassword) {
        if (oldPassword !== currentUserData.transactionPassword) {
          alert('Old password is incorrect.');
          return;
        }
      }

      // Update password
      await updateDoc(doc(db, "users", user.uid), {
        transactionPassword: newPassword
      });

      alert('Transaction password set successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });

      // Refresh user data
      const updatedDoc = await getDoc(doc(db, "users", user.uid));
      if (updatedDoc.exists()) {
        setUserData(updatedDoc.data());
      }

    } catch (error) {
      console.error("Set password error:", error);
      alert('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Back to main screen',
      icon: 'fa-home',
      color: 'from-cyan-500 to-blue-600',
      action: () => router.push('/dashboard')
    },
    {
      id: 'send',
      title: 'Send Money',
      subtitle: 'Transfer to other users',
      icon: 'fa-paper-plane',
      color: 'from-cyan-500 to-blue-600',
      action: () => router.push('/send')
    },
    {
      id: 'receive',
      title: 'Receive Money',
      subtitle: 'Get your wallet code',
      icon: 'fa-download',
      color: 'from-green-500 to-emerald-600',
      action: () => router.push('/receive')
    },
    {
      id: 'password',
      title: 'Transaction Password',
      subtitle: 'Set/Change your 6-digit PIN',
      icon: 'fa-lock',
      color: 'from-yellow-500 to-orange-600',
      action: () => setShowPasswordModal(true)
    },
    {
      id: 'referral',
      title: 'Referral Program',
      subtitle: 'Earn with friends',
      icon: 'fa-users',
      color: 'from-purple-500 to-pink-600',
      action: () => setShowReferralModal(true)
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Get help and support',
      icon: 'fa-headset',
      color: 'from-blue-500 to-indigo-600',
      action: () => setShowSupportModal(true)
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'fa-sign-out-alt',
      color: 'from-red-500 to-pink-600',
      action: handleLogout
    }
  ];

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
              <h1 className="text-xl font-bold text-white">Menu</h1>
              <p className="text-xs text-slate-400">Manage your account and settings</p>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 px-6 max-w-md mx-auto">
        <div className="glass-card p-5">
          <div className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${item.icon} text-white`}></i>
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium block">{item.title}</span>
                  <span className="text-slate-400 text-sm">{item.subtitle}</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400 group-hover:text-cyan-400 transition-colors"></i>
              </button>
            ))}
          </div>
        </div>

        {/* User Info Card */}
        {userData && (
          <div className="glass-card p-5 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="text-white text-sm">{userData.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Phone:</span>
                <span className="text-white text-sm">{userData.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wallet Code:</span>
                <span className="text-white text-sm font-mono">{userData.walletCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Member Since:</span>
                <span className="text-white text-sm">
                  {userData.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 glass-card">
            <div className="text-center">
              <div className="fas fa-lock text-yellow-400 text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">
                {userData?.transactionPassword ? 'Change Transaction Password' : 'Set Transaction Password'}
              </h3>
              <p className="text-slate-400 mb-4">
                {userData?.transactionPassword ? 'Change your 6-digit PIN for transactions' : 'Set your 6-digit PIN for transactions'}
              </p>
              
              <form onSubmit={handleSetPassword} className="space-y-4">
                {userData?.transactionPassword && (
                  <div>
                    <label htmlFor="oldWalletPassword" className="block text-sm font-medium text-slate-300 mb-2">
                      Old Password
                    </label>
                    <input
                      type="password"
                      id="oldWalletPassword"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      className="w-full input-field font-mono"
                      placeholder="Enter old 6-digit PIN"
                      maxLength="6"
                      pattern="\d{6}"
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="newWalletPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newWalletPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full input-field font-mono"
                    placeholder="Enter new 6-digit PIN"
                    maxLength="6"
                    pattern="\d{6}"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmWalletPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmWalletPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full input-field font-mono"
                    placeholder="Confirm 6-digit PIN"
                    maxLength="6"
                    pattern="\d{6}"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i> Setting...
                    </div>
                  ) : (
                    'Set Password'
                  )}
                </button>
              </form>
              
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors mt-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 glass-card">
            <div className="text-center">
              <div className="fas fa-users text-purple-400 text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Referral Program</h3>
              <p className="text-slate-400 mb-4">Share your code and earn $6 for each friend!</p>
              
              <div className="bg-slate-700 p-4 rounded-lg mb-4 border border-purple-500/20">
                <p className="text-sm text-slate-400 mb-1">Your Referral Code</p>
                {userData?.referralCode ? (
                  <p className="text-xl font-bold text-white tracking-wider font-mono">
                    {userData.referralCode}
                  </p>
                ) : (
                  <p className="text-slate-400">Loading...</p>
                )}
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg mb-4 text-left">
                <h4 className="text-white font-medium mb-2">💰 Referral Benefits:</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• <strong>Instant $6</strong> when friend signs up</li>
                  <li>• <strong>Lifetime 2.5% commission</strong> on their transactions</li>
                  <li>• No limit on referrals</li>
                </ul>
              </div>
              
              <button
                onClick={() => userData?.referralCode && copyToClipboard(userData.referralCode)}
                className="w-full btn-primary mb-3"
              >
                Copy Referral Code
              </button>
              <button
                onClick={() => setShowReferralModal(false)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 glass-card">
            <div className="text-center">
              <div className="fas fa-headset text-blue-400 text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Support</h3>
              <p className="text-slate-400 mb-4">Contact our support team for assistance</p>
              
              <div className="space-y-3 text-left">
                <div className="bg-slate-700 p-3 rounded-lg">
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white">support@aimspace.com</p>
                </div>
                
                <div className="bg-slate-700 p-3 rounded-lg">
                  <p className="text-sm text-slate-400">Telegram</p>
                  <p className="text-white">@AiMSpaceSupport</p>
                </div>
                
                <div className="bg-slate-700 p-3 rounded-lg">
                  <p className="text-sm text-slate-400">Response Time</p>
                  <p className="text-white">24-48 hours</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full btn-primary mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
