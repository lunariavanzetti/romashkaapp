import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

const Header: React.FC<{ onSidebarToggle: () => void }> = ({ onSidebarToggle }) => {
  return (
    <header className="bg-gradient-header shadow-elevation-2 backdrop-blur-glass border-b border-white/20 flex items-center justify-between px-6 py-4 mb-0 sticky top-0 z-20">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={onSidebarToggle}
        >
          <Menu size={24} className="text-white" />
        </button>
        
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-white font-heading text-xl font-bold hidden sm:block">
            ROMASHKA
          </span>
        </div>
        
        {/* Global Search */}
        <div className="relative hidden md:block">
          <div className="relative">
            <input 
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-4 py-2.5 w-80 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200" 
              placeholder="Search conversations, contacts, knowledge..." 
            />
            <Search className="absolute left-3 top-3 text-white/60" size={18} />
          </div>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Search Toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Search size={20} className="text-white" />
        </button>
        
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Bell size={20} className="text-white" />
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-orange rounded-full flex items-center justify-center text-xs font-bold text-white">
            3
          </span>
        </button>
        
        {/* Quick Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
            Live Chat
          </button>
          <button className="px-3 py-1.5 text-sm bg-primary-orange text-white rounded-lg hover:bg-primary-orange-dark transition-colors">
            + New
          </button>
        </div>
        
        {/* User Profile */}
        <div className="relative">
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-orange to-primary-orange-light flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-white font-medium hidden sm:block">Admin</span>
          </button>
          
          {/* Dropdown Menu (hidden by default) */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-elevation-3 border border-gray-200 dark:border-gray-700 hidden">
            <div className="py-2">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Billing</a>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Sign out</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 