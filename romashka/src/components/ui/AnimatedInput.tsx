import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className={`relative ${className}`}>
        <motion.div
          className="relative"
          initial={false}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Input Container */}
          <div
            className={`
              relative flex items-center
              bg-glassDark/40 backdrop-blur-glass
              border border-white/20 rounded-xl
              px-4 py-3 transition-all duration-300
              ${isFocused ? 'border-primary-pink/60 shadow-glow-pink' : 'hover:border-white/40'}
              ${error ? 'border-red-500/60 shadow-glow-red' : ''}
            `}
          >
            {/* Icon */}
            {icon && (
              <motion.div
                className="mr-3 text-white/60"
                animate={{
                  color: isFocused ? '#FF6B9D' : 'rgba(255, 255, 255, 0.6)',
                }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}

            {/* Input */}
            <input
              ref={ref}
              className="
                flex-1 bg-transparent text-white placeholder-transparent
                outline-none text-sm font-medium relative z-10
                peer
              "
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />

            {/* Floating Label */}
            <motion.label
              className={`
                absolute left-4 text-sm font-medium pointer-events-none
                transition-all duration-300
                ${icon ? 'left-12' : ''}
              `}
              animate={{
                y: isFocused || hasValue ? -20 : 0,
                x: isFocused || hasValue ? (icon ? -8 : 0) : 0,
                scale: isFocused || hasValue ? 0.85 : 1,
                color: isFocused ? '#FF6B9D' : hasValue ? '#A855F7' : 'rgba(255, 255, 255, 0.6)',
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.label>

            {/* Focus Indicator */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-transparent"
              animate={{
                borderColor: isFocused ? 'rgba(255, 107, 157, 0.3)' : 'transparent',
              }}
              transition={{ duration: 0.2 }}
            />

            {/* Glow Effect */}
            {isFocused && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-pink/10 to-primary-magenta/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mt-2 text-red-400 text-xs font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.div>
          )}

          {/* Success Indicator */}
          {hasValue && !error && (
            <motion.div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full" />
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput'; 