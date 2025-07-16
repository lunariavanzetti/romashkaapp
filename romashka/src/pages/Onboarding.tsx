import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground, AnimatedInput, Confetti, SuccessMessage } from '../components/ui';
import { StepIndicator, QuestionCard, OptionCard, NavigationButtons } from '../components/onboarding';
import { useOnboardingStore } from '../stores/onboardingStore';

const onboardingSteps = [
  {
    id: 'name',
    title: "What's your name?",
    subtitle: "Your answers will help us personalize your experience",
    type: 'text',
    field: 'fullName',
    required: true
  },
  {
    id: 'department', 
    title: "Which department do you work in?",
    type: 'single-select',
    field: 'department',
    options: [
      'Website development',
      "I'm a business owner",
      'Sales', 
      'Operations',
      'Marketing',
      'IT/Technical',
      'Customer Support',
      'Other'
    ]
  },
  {
    id: 'current-tools',
    title: "Which tools or channels do you currently use to connect with your customers?",
    subtitle: "Select all that apply",
    type: 'multi-select',
    field: 'currentTools',
    options: [
      'Mostly email',
      'Re:amaze',
      'Tawk.to', 
      'LiveChat',
      'Zoho desk',
      'Intercom',
      'Zendesk',
      'Gorgias',
      "I'm just getting started",
      'Other'
    ]
  },
  {
    id: 'business-model',
    title: "What is your primary business model?", 
    type: 'single-select',
    field: 'businessModel',
    options: [
      'I provide services (to businesses or consumers)',
      'E-commerce (online store)',
      'Other'
    ]
  },
  {
    id: 'industry',
    title: "What is your company's industry?",
    type: 'single-select',
    field: 'industry',
    options: [
      'Automotive and Aftermarket',
      'Technology',
      'Healthcare',
      'Retail/E-commerce',
      'Finance',
      'Education',
      'Real Estate',
      'Manufacturing', 
      'Consulting',
      'Other'
    ]
  },
  {
    id: 'conversations-volume',
    title: "How many customer conversations does your company handle per month?",
    type: 'single-select',
    field: 'conversationsVolume',
    options: [
      'Up to 200',
      '200-999',
      '1000-4999', 
      '5000-9999',
      '10,000 or more',
      "I don't know"
    ]
  },
  {
    id: 'website-visitors',
    title: "How many visitors does your website attract each month?",
    type: 'single-select', 
    field: 'websiteVisitors',
    options: [
      'Up to 1000',
      '1000-9999',
      '10,000-49,999',
      '50,000-99,999', 
      '100,000 or more',
      "I don't know"
    ]
  },
  {
    id: 'website-platform',
    title: "What platform powers your website?",
    type: 'single-select',
    field: 'websitePlatform', 
    options: [
      'Shopify',
      'Custom website',
      'BigCommerce',
      'WooCommerce',
      'Webflow',
      'PrestaShop',
      'WordPress',
      'Other'
    ]
  },
  {
    id: 'support-agents',
    title: "How many customer support agents do you have in your current setup?",
    type: 'single-select',
    field: 'supportAgents',
    options: [
      'Just me',
      '2-5',
      '6-19', 
      '20 or more'
    ]
  },
  {
    id: 'main-goal',
    title: "My main goal for using ROMASHKA is...",
    type: 'single-select',
    field: 'mainGoal',
    options: [
      {
        value: 'live-support',
        label: 'Offer live support',
        description: 'Drive customer satisfaction with live chat, video calls, and multichannel communication'
      },
      {
        value: 'ticketing',
        label: 'Configure Ticketing system', 
        description: 'Turn support emails into tickets and keep track of your customers\' requests. Optimize your support workflow'
      },
      {
        value: 'increase-sales',
        label: 'Increase sales',
        description: 'Boost your sales with Flows - automated conversion paths that trigger at specific moments'
      }
    ]
  },
  {
    id: 'interaction-channels',
    title: "How would you like to interact with your customers?",
    subtitle: "Select all that apply",
    type: 'multi-select',
    field: 'interactionChannels',
    options: [
      'Website (via live chat)',
      'Facebook Messenger', 
      'Instagram',
      'Email',
      'WhatsApp',
      'Other'
    ]
  }
];

export default function Onboarding() {
  const {
    currentStep,
    answers,
    isLoading,
    error,
    showConfetti,
    showSuccess,
    updateAnswer,
    nextStep,
    previousStep,
    submitOnboarding,
    skipOnboarding,
  } = useOnboardingStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = onboardingSteps[currentStep];

  const validateCurrentStep = (): boolean => {
    const field = currentQuestion.field as keyof typeof answers;
    const value = answers[field];

    if (currentQuestion.required) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setValidationError('This field is required');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      await submitOnboarding();
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  const canProceed = () => {
    const field = currentQuestion.field as keyof typeof answers;
    const value = answers[field];
    
    if (currentQuestion.required) {
      return value && (Array.isArray(value) ? value.length > 0 : true);
    }
    return true;
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <AnimatedInput
              label="Your Name"
              type="text"
              value={answers.fullName || ''}
              onChange={(e) => updateAnswer('fullName', e.target.value)}
              error={validationError || undefined}
              required={true}
              autoFocus
            />
          </div>
        );

      case 'single-select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const isObject = typeof option === 'object';
              const value = isObject ? option.value : option;
              const label = isObject ? option.label : option;
              const description = isObject ? option.description : undefined;
              
              return (
                <OptionCard
                  key={value}
                  value={value}
                  label={label}
                  description={description}
                  selected={answers[currentQuestion.field as keyof typeof answers] === value}
                  onClick={() => updateAnswer(currentQuestion.field as keyof typeof answers, value)}
                  index={index}
                />
              );
            })}
          </div>
        );

      case 'multi-select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              const description = typeof option === 'object' ? option.description : undefined;
              
              const currentValues = answers[currentQuestion.field as keyof typeof answers] as string[] || [];
              const isSelected = currentValues.includes(value);
              
              const handleToggle = () => {
                const newValues = isSelected
                  ? currentValues.filter(v => v !== value)
                  : [...currentValues, value];
                updateAnswer(currentQuestion.field as keyof typeof answers, newValues);
              };
              
              return (
                <OptionCard
                  key={value}
                  value={value}
                  label={label}
                  description={description}
                  selected={isSelected}
                  onClick={handleToggle}
                  multiSelect
                  index={index}
                />
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      {showConfetti && <Confetti />}
      {showSuccess && <SuccessMessage />}
      
      <motion.div
        className="relative z-10 w-full max-w-4xl px-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={onboardingSteps.length}
        />

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <QuestionCard
              title={currentQuestion.title}
              subtitle={currentQuestion.subtitle}
            >
              {renderQuestion()}
              
              {/* Validation Error */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {validationError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Store Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </QuestionCard>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={onboardingSteps.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          canProceed={canProceed()}
          isLoading={isLoading}
        />
      </motion.div>
    </div>
  );
} 