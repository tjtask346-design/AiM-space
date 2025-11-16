// components/Dashboard/DashboardHeader.jsx
'use client';
import { useRouter } from 'next/navigation';

export default function DashboardHeader({ user, userData, onLogout }) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/1000066307.jpg" 
              alt="AiM Space Logo" 
              className="w-10 h-10 rounded-xl object-cover border border-cyan-400/20"
            />
            <div>
              <h1 className="text-xl font-bold text-white">AiM Space</h1>
              <p className="text-xs text-slate-400">P2P Wallet</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/menu')}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-bars text-cyan-400"></i>
              <span className="text-sm text-white hidden md:block">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
