import React from 'react';
import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  onStepClick,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-purple via-primary-magenta to-primary-pink rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        {/* Progress Text */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-white/60 text-sm">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-white/60 text-sm">
            {Math.round(progress)}% Complete
          </span>
        </div>
      </div>

      {/* Step Dots */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: totalSteps }, (_, index) => (
          <motion.button
            key={index}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${index <= currentStep 
                ? 'bg-gradient-to-r from-primary-purple to-primary-pink shadow-glow-pink' 
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
            onClick={() => onStepClick?.(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {index < currentStep && (
              <motion.div
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}; 