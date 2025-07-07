import React from 'react';
import { motion } from 'framer-motion';

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
  index?: number;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  value,
  label,
  description,
  selected,
  onClick,
  multiSelect = false,
  index = 0,
}) => {
  return (
    <motion.button
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-300
        text-left relative overflow-hidden
        ${selected
          ? 'border-primary-pink bg-primary-pink/10 shadow-glow-pink'
          : 'border-white/20 bg-glassDark/40 hover:border-primary-pink/40 hover:bg-primary-pink/5'
        }
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Selection Indicator */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {multiSelect ? (
            <motion.div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                ${selected
                  ? 'border-primary-pink bg-primary-pink'
                  : 'border-white/40'
                }
              `}
              animate={{
                scale: selected ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {selected && (
                <motion.svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </motion.svg>
              )}
            </motion.div>
          ) : (
            <motion.div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selected
                  ? 'border-primary-pink bg-primary-pink'
                  : 'border-white/40'
                }
              `}
              animate={{
                scale: selected ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {selected && (
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${selected ? 'text-white' : 'text-white/90'}`}>
            {label}
          </h3>
          {description && (
            <p className={`mt-1 ${selected ? 'text-white/80' : 'text-white/60'}`}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Glow Effect */}
      {selected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-pink/10 to-primary-magenta/10 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}; 