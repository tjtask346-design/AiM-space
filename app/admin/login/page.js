// app/admin/login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../services/firebaseService';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          await auth.signOut();
          return;
        }

        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        setError('User not found.');
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="/1000066307.jpg" 
            alt="AiM Space Logo" 
            className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover border-2 border-cyan-400/20"
          />
          <h1 className="text-4xl font-bold text-white mb-2">AiM Space</h1>
          <p className="text-slate-400">Admin Panel</p>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-field" 
                placeholder="Enter admin email" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-field" 
                placeholder="Enter password" 
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
                  <i className="fas fa-spinner fa-spin mr-2"></i> Signing In...
                </div>
              ) : (
                'Admin Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
