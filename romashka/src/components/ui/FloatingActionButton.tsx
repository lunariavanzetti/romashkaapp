import React from 'react';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  className = '',
  size = 'md',
  variant = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-pink to-primary-purple',
    secondary: 'bg-gradient-to-r from-primary-blue to-primary-magenta',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500',
  };

  return (
    <motion.button
      className={`
        ${sizeClasses[size]} ${variantClasses[variant]}
        rounded-full shadow-glass backdrop-blur-glass
        flex items-center justify-center
        text-white font-bold
        border border-white/20
        ${className}
      `}
      onClick={onClick}
      whileHover={{
        scale: 1.1,
        boxShadow: '0 0 30px rgba(255, 107, 157, 0.4)',
      }}
      whileTap={{
        scale: 0.95,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
    >
      <motion.div
        className="text-xl"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        {icon}
      </motion.div>
      
      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
}; 