import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  onSkip?: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  onSkip,
  canProceed,
  isLoading = false,
}) => {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <motion.div
      className="flex flex-col items-center mt-8 max-w-2xl mx-auto space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Skip Button */}
      {onSkip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2"
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </motion.div>
      )}
      
      {/* Main Navigation */}
      <div className="flex justify-between items-center w-full">
        {/* Previous Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isFirstStep ? 0 : 1, x: isFirstStep ? -20 : 0 }}
          transition={{ delay: 0.6 }}
        >
          {!isFirstStep && (
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="px-8 py-3"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
          )}
        </motion.div>

        {/* Next/Submit Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          {isLastStep ? (
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isLoading}
              disabled={!canProceed || isLoading}
              className="px-8 py-3"
            >
              {isLoading ? 'Setting up your account...' : 'Complete Setup'}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!canProceed}
              className="px-8 py-3"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};