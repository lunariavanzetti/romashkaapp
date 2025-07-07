import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header: React.FC<{ onSidebarToggle: () => void }> = ({ onSidebarToggle }) => {
  return (
    <header className="bg-white/80 dark:bg-glassDark/80 backdrop-blur-glass border-b border-gray-200/50 dark:border-white/20 flex items-center justify-between px-6 py-4 mb-6 shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button className="md:hidden" onClick={onSidebarToggle}>
          <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded mb-1" />
          <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded mb-1" />
          <span className="block w-8 h-1 bg-pink-400 dark:bg-primary-pink rounded" />
        </button>
        <div className="relative">
          <input className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 w-64 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-primary-pink" placeholder="Search..." />
          <Search className="absolute left-3 top-2.5 text-pink-500 dark:text-primary-pink" size={18} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative">
          <Bell size={22} className="text-pink-500 dark:text-primary-pink" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 dark:bg-primary-green rounded-full border-2 border-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-pink-500 dark:bg-primary-pink flex items-center justify-center text-white font-bold">
          <User size={22} />
        </div>
      </div>
    </header>
  );
};

export default Header; 