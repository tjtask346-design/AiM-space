// components/Auth/SignupForm.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import firebaseService from '../../services/firebaseService';

export default function SignupForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    referralCode: ''
  });
  const [transactionHash, setTransactionHash] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic info, 2: Payment verification

  const router = useRouter();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBasicInfoSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await firebaseService.registerUser(formData, transactionHash);
      
      // Show success message
      alert('Account created successfully! Please login with your credentials.');
      onSwitchToLogin();
      
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {step === 1 ? 'Create Account' : 'Payment Verification'}
      </h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
          <div>
            <label htmlFor="suEmail" className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              id="suEmail"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full input-field" 
              placeholder="Enter your email" 
              required
            />
          </div>
          
          <div>
            <label htmlFor="suPassword" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="suPassword"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full input-field pr-10" 
                placeholder="Create a password" 
                required 
                minLength="6"
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

          <div>
            <label htmlFor="suPhone" className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <input 
              type="tel" 
              id="suPhone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full input-field" 
              placeholder="Enter your phone number" 
              required
            />
          </div>
          
          <div>
            <label htmlFor="suReferral" className="block text-sm font-medium text-slate-300 mb-2">
              Referral Code (Optional)
            </label>
            <input 
              type="text" 
              id="suReferral"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleInputChange}
              className="w-full input-field uppercase" 
              placeholder="Enter referral code if any"
            />
          </div>
          
          <button type="submit" className="w-full btn-primary mt-2">
            Continue to Payment
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Payment Instructions */}
          <div className="border-t border-slate-700 pt-4 mt-4">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Payment Verification</h3>
            <p className="text-slate-400 text-sm mb-4 text-center">
              Send <strong>10 USDT</strong> to the BEP-20 address below and provide transaction hash for verification.
            </p>
            
            {/* Wallet Address Box */}
            <div className="bg-slate-800 p-4 rounded-lg mb-4 border border-cyan-500/20">
              <p className="text-xs text-slate-400 mb-1">BEP-20 Address:</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-white break-all mr-2">
                  0x742d35Cc6634C0532925a3b8D4B5e1a1C6B6a9c8
                </p>
                <button 
                  type="button"
                  onClick={() => navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b8D4B5e1a1C6B6a9c8')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
            
            {/* Network Info */}
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Network:</span>
                <span className="text-white font-medium">BEP-20 (BSC)</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Amount:</span>
                <span className="text-white font-medium">10 USDT</span>
              </div>
            </div>
            
            {/* Transaction Hash Input */}
            <div>
              <label htmlFor="transactionHash" className="block text-sm font-medium text-slate-300 mb-2">
                Transaction Hash
              </label>
              <input 
                type="text" 
                id="transactionHash"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="w-full input-field font-mono" 
                placeholder="Enter your transaction hash" 
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Find this in your wallet transaction history
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading || !transactionHash}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i> Verifying...
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-slate-400">
          {step === 1 ? 'Already have an account? ' : 'Back to '}
          <button 
            onClick={step === 1 ? onSwitchToLogin : () => setStep(1)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            {step === 1 ? 'Sign In' : 'Basic Info'}
          </button>
        </p>
      </div>
    </div>
  );
}
