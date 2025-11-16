// components/Dashboard/QuickActions.jsx
'use client';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'send',
      title: 'Send Money',
      icon: 'fa-paper-plane',
      color: 'from-cyan-500 to-blue-600',
      page: '/send'
    },
    {
      id: 'receive',
      title: 'Receive Money',
      icon: 'fa-download',
      color: 'from-green-500 to-emerald-600',
      page: '/receive'
    },
    {
      id: 'deposit',
      title: 'Deposit',
      icon: 'fa-wallet',
      color: 'from-purple-500 to-pink-600',
      page: '/deposit'
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      icon: 'fa-money-bill-transfer',
      color: 'from-orange-500 to-red-600',
      page: '/withdraw'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => router.push(action.page)}
          className="glass-card p-4 flex flex-col items-center justify-center hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105 group"
        >
          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow`}>
            <i className={`fas ${action.icon} text-white text-lg`}></i>
          </div>
          <span className="text-white font-medium text-sm text-center">{action.title}</span>
        </button>
      ))}
    </div>
  );
}
