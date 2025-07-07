import React from 'react';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <motion.div
      className={`
        glass-card bg-glassDark/80 rounded-2xl shadow-glass p-8 
        border border-white/20 backdrop-blur-glass max-w-2xl mx-auto
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2
          className="font-heading text-3xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h2>
        
        {subtitle && (
          <motion.p
            className="text-white/60 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}; 