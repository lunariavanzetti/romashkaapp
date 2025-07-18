import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, Menu, Plus, MessageCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC<{ onSidebarToggle: () => void }> = ({ onSidebarToggle }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Bell size={20} className="text-white" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-orange rounded-full flex items-center justify-center text-xs font-bold text-white">
              3
            </span>
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-elevation-3 border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">New message from Customer #1234</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 minutes ago</div>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">AI Training completed</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">15 minutes ago</div>
                </div>
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">Integration sync successful</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 hour ago</div>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all notifications</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <button 
            onClick={() => navigate('/dashboard/conversations')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <MessageCircle size={16} />
            Live Chat
          </button>
          <button 
            onClick={() => navigate('/dashboard/conversations')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-orange text-white rounded-lg hover:bg-primary-orange-dark transition-colors"
          >
            <Plus size={16} />
            New
          </button>
        </div>
        
        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-orange to-primary-orange-light flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-white font-medium hidden sm:block">Admin</span>
            <ChevronDown size={16} className="text-white hidden sm:block" />
          </button>
          
          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-elevation-3 border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-2">
                <button 
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Profile
                </button>
                <button 
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </button>
                <button 
                  onClick={() => { navigate('/billing'); setShowUserMenu(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Billing
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button 
                  onClick={() => { 
                    // Add logout functionality here
                    setShowUserMenu(false); 
                    navigate('/signin');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 