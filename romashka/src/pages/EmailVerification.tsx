import React, { useState, useEffect } from 'react';
import { Button, AnimatedBackground } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EmailVerification() {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || 'your email';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      // @ts-ignore
      const { error } = await window.supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (!error) {
        setResendSuccess(true);
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error resending email:', error);
    }
    setResending(false);
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
            Verify Your Email
          </motion.h1>
          <motion.p
            className="text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            We've sent a verification link to your email
          </motion.p>
        </motion.div>

        {/* Verification Card */}
        <motion.div
          className="glass-card bg-glassDark/80 rounded-2xl shadow-glass p-8 border border-white/20 backdrop-blur-glass"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Email Icon */}
          <motion.div
            className="mx-auto w-20 h-20 bg-primary-purple/20 rounded-full flex items-center justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.svg
              className="w-10 h-10 text-primary-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </motion.svg>
          </motion.div>

          {/* Email Display */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <p className="text-white/80 text-sm mb-2">Check your email at:</p>
            <p className="text-primary-pink font-medium text-lg break-all">{email}</p>
          </motion.div>

          {/* Instructions */}
          <motion.div variants={itemVariants} className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <motion.div
                className="w-6 h-6 bg-primary-pink/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <span className="text-primary-pink text-xs font-bold">1</span>
              </motion.div>
              <p className="text-white/60 text-sm">Open the email we sent to your inbox</p>
            </div>
            
            <div className="flex items-start gap-3">
              <motion.div
                className="w-6 h-6 bg-primary-magenta/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <span className="text-primary-magenta text-xs font-bold">2</span>
              </motion.div>
              <p className="text-white/60 text-sm">Click the verification link in the email</p>
            </div>
            
            <div className="flex items-start gap-3">
              <motion.div
                className="w-6 h-6 bg-primary-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <span className="text-primary-blue text-xs font-bold">3</span>
              </motion.div>
              <p className="text-white/60 text-sm">Return here to access your account</p>
            </div>
          </motion.div>

          {/* Resend Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">Didn't receive the email?</p>
              {canResend ? (
                <Button
                  variant="primary"
                  loading={resending}
                  onClick={handleResend}
                  className="w-full"
                >
                  Resend Email
                </Button>
              ) : (
                <div className="text-white/40 text-sm">
                  Resend available in {countdown}s
                </div>
              )}
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {resendSuccess && (
                <motion.div
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  Verification email sent successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to Sign In */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Additional Help */}
        <motion.div variants={itemVariants} className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            Having trouble? Check your spam folder or{' '}
            <motion.button
              type="button"
              className="text-primary-pink hover:text-primary-magenta underline"
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              try a different email
            </motion.button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
} 