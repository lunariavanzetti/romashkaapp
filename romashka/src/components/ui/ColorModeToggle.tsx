import React from 'react';
import { useTheme } from '../layout/useTheme';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useThemeStore } from '../../stores/themeStore';

export const ColorModeToggle: React.FC = () => {
  const { toggleTheme } = useTheme();
  const theme = useThemeStore((state) => state.theme);

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full p-2 bg-gray-100 dark:bg-dark shadow-md transition-colors"
      aria-label="Toggle color mode"
    >
      <motion.span
        key={theme}
        initial={{ rotate: 0, scale: 0.8 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center w-6 h-6"
      >
        {theme === 'dark' ? (
          <MoonIcon className="w-6 h-6 text-primary-pink" />
        ) : (
          <SunIcon className="w-6 h-6 text-primary-green" />
        )}
      </motion.span>
    </button>
  );
}; 