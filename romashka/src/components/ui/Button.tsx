import React from 'react';
import clsx from 'clsx';
import { AnimatedSpinner } from './AnimatedSpinner';

const base =
  'inline-flex items-center justify-center font-heading rounded-pill px-6 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none text-lg font-semibold shadow-glass backdrop-blur-glass';

const variants = {
  primary: 'bg-gradient-to-r from-primary-pink via-primary-purple to-primary-magenta text-white hover:shadow-neon hover:scale-105 focus:ring-primary-pink',
  secondary: 'bg-gradient-to-r from-primary-green to-primary-lavender text-dark hover:shadow-neon hover:scale-105 focus:ring-primary-green',
  outline: 'border-2 border-primary-pink text-primary-pink bg-transparent hover:bg-primary-pink/10 hover:shadow-neon focus:ring-primary-pink',
  ghost: 'bg-transparent text-primary-pink hover:bg-primary-pink/10 focus:ring-primary-pink',
  neon: 'bg-primary-neon text-dark shadow-neon hover:shadow-neon hover:scale-105',
  glass: 'bg-glassDark/60 text-white border border-white/20 backdrop-blur-glass hover:shadow-glass',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  loading?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  className,
  children,
  ...props
}) => (
  <button
    className={clsx(base, variants[variant], className)}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? (
      <AnimatedSpinner size="sm" className="mr-2 text-white" />
    ) : null}
    {children}
  </button>
); 