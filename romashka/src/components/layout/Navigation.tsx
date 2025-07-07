import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ColorModeToggle } from '../ui/ColorModeToggle';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Knowledge', path: '/knowledge' },
  { name: 'URL Scanner', path: '/knowledge/scanner' },
  { name: 'Automation', path: '/automation' },
  // Add more links as needed
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-3xl rounded-2xl bg-white/30 dark:bg-dark/60 backdrop-blur-lg shadow-lg flex items-center justify-between px-6 py-3 border border-white/40 dark:border-dark/40">
      <div className="flex gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`font-heading text-lg px-3 py-1 rounded transition-colors ${location.pathname === link.path ? 'bg-primary-pink text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary-pink/20'}`}
          >
            {link.name}
          </Link>
        ))}
      </div>
      <ColorModeToggle />
    </nav>
  );
}; 