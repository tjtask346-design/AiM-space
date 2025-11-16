// app/page.js (Main Login Page)
'use client';
import { useState, useEffect } from 'react';
import { auth } from '../services/firebaseService';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/Auth/LoginForm';
import SignupForm from '../components/Auth/SignupForm';

export default function Home() {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-8 pb-6">
      <div className="p-6 max-w-md mx-auto fade-in">
        {/* Logo Section - Exact like your design */}
        <div className="text-center mb-8">
          <img 
            src="/1000066307.jpg" 
            alt="AiM Space Logo" 
            className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover border-2 border-cyan-400/20"
          />
          <h1 className="text-4xl font-bold text-white mb-2">AiM Space</h1>
          <p className="text-slate-400">Your Secure P2P Wallet</p>
        </div>

        {/* Toggle between Login and Signup */}
        {activeTab === 'login' ? (
          <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
        )}
      </div>
    </div>
  );
}
