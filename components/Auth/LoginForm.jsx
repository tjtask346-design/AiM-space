// components/Auth/LoginForm.jsx
'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseService';
import { useRouter } from 'next/navigation';

export default function LoginForm({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <input 
            type="email" 
            id="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-field" 
            placeholder="Enter your email" 
            required
          />
        </div>
        
        <div>
          <label htmlFor="loginPassword" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              id="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field pr-10" 
              placeholder="Enter your password" 
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {showPassword ? (
                <ion-icon name="eye-off-outline"></ion-icon>
              ) : (
                <ion-icon name="eye-outline"></ion-icon>
              )}
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i> Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-slate-400">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToSignup}
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
