import React from 'react';
import { Home, BarChart2, MessageCircle, Zap, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Dashboard', icon: <Home size={20} />, to: '/dashboard' },
  { label: 'Analytics', icon: <BarChart2 size={20} />, to: '/dashboard/analytics' },
  { label: 'Conversations', icon: <MessageCircle size={20} />, to: '/dashboard/conversations' },
  { label: 'Quick Actions', icon: <Zap size={20} />, to: '/dashboard/actions' },
];

const Sidebar: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const location = useLocation();
  return (
    <aside className={`transition-all duration-300 bg-white/80 dark:bg-glassDark/80 backdrop-blur-glass border-r border-gray-200/50 dark:border-white/20 h-screen sticky top-0 z-30 ${open ? 'w-64' : 'w-16'} flex flex-col items-center py-6`}> 
      <button onClick={onToggle} className="mb-8 focus:outline-none">
        <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded mb-1" />
        <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded mb-1" />
        <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded" />
      </button>
      <nav className="flex-1 flex flex-col gap-4 w-full">
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-heading text-lg ${location.pathname === link.to ? 'bg-pink-100 dark:bg-primary-pink text-pink-700 dark:text-white' : 'text-gray-600 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-primary-pink/20'}`}> 
            <span>{link.icon}</span>
            {open && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>
      <button className="mt-auto mb-2 flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-pink-500 dark:hover:text-primary-pink transition-colors">
        <LogOut size={20} />
        {open && <span>Logout</span>}
      </button>
    </aside>
  );
};

export default Sidebar; 