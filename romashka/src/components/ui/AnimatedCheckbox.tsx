import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <motion.label
      className={`flex items-center gap-3 cursor-pointer group ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkbox Container */}
      <motion.div
        className={`
          relative w-5 h-5 rounded-md border-2 flex items-center justify-center
          transition-all duration-300
          ${checked 
            ? 'border-primary-pink bg-primary-pink' 
            : 'border-white/40 hover:border-primary-pink/60'
          }
        `}
        animate={{
          boxShadow: checked 
            ? '0 0 20px rgba(255, 107, 157, 0.4)' 
            : '0 0 0px rgba(255, 107, 157, 0)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Check Mark */}
        {checked && (
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}

        {/* Ripple Effect */}
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-md bg-primary-pink/20"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* Hidden Input */}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </motion.div>

      {/* Label */}
      {label && (
        <span className="text-sm text-white/80 group-hover:text-white transition-colors duration-200">
          {label}
        </span>
      )}
    </motion.label>
  );
}; 