import React, { useState } from 'react';
import { Button, AnimatedBackground, AnimatedInput, AnimatedCheckbox } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

// Icons for inputs
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  websiteUrl: string;
  termsAccepted: boolean;
}

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    websiteUrl: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<{ [K in keyof FormData]?: string }>({});
  const { signup, loading, error, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateStep = (step: number): boolean => {
    const newErrors: { [K in keyof FormData]?: string } = {};

    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!form.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!form.password) {
        newErrors.password = 'Password is required';
      } else if (form.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!form.websiteUrl.trim()) newErrors.websiteUrl = 'Website URL is required';
      if (!form.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    await signup(form.email, form.password, {
      fullName: form.fullName,
      companyName: form.companyName,
      websiteUrl: form.websiteUrl,
    });

    if (!error) {
      navigate('/email-verification');
    }
  };

  const handleSocial = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        const { error } = await import('../services/auth').then(m => m.signInWithGoogle());
        if (error) console.error('Google sign in error:', error);
      } else if (provider === 'github') {
        const { error } = await import('../services/auth').then(m => m.signInWithGitHub());
        if (error) console.error('GitHub sign in error:', error);
      }
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      
      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.h1
            className="font-heading text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join us and start building amazing things
          </motion.p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">Step {currentStep} of 2</span>
            <span className="text-xs text-white/60">{Math.round((currentStep / 2) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-purple to-primary-pink h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 2) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="glass-card bg-glassDark/80 rounded-2xl shadow-glass p-8 border border-white/20 backdrop-blur-glass"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Full Name"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                      error={errors.fullName}
                      icon={<UserIcon />}
                      required
                      autoFocus
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      error={errors.email}
                      icon={<EmailIcon />}
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      error={errors.password}
                      icon={<LockIcon />}
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Confirm Password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      error={errors.confirmPassword}
                      icon={<LockIcon />}
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNext}
                      className="w-full"
                    >
                      Next Step
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Company Name"
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                      error={errors.companyName}
                      icon={<BuildingIcon />}
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Website URL"
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                      error={errors.websiteUrl}
                      icon={<GlobeIcon />}
                      placeholder="https://yourcompany.com"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <AnimatedCheckbox
                      checked={form.termsAccepted}
                      onChange={(checked) => setForm(f => ({ ...f, termsAccepted: checked }))}
                      label="I agree to the Terms and Conditions and Privacy Policy"
                    />
                    {errors.termsAccepted && (
                      <div className="mt-2 text-red-400 text-xs">{errors.termsAccepted}</div>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      className="flex-1"
                    >
                      Create Account
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social Signup */}
            {currentStep === 1 && (
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-glassDark/80 px-2 text-white/60">Or sign up with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-glassDark/40 border border-white/20 rounded-xl text-white/80 hover:text-white hover:border-primary-pink/60 transition-all duration-300"
                    onClick={() => handleSocial('google')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-glassDark/40 border border-white/20 rounded-xl text-white/80 hover:text-white hover:border-primary-pink/60 transition-all duration-300"
                    onClick={() => handleSocial('github')}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Sign In Link */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <span className="text-white/60 text-sm">Already have an account? </span>
            <motion.button
              type="button"
              className="text-primary-pink hover:text-primary-magenta font-medium transition-colors duration-200"
              onClick={() => navigate('/signin')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 