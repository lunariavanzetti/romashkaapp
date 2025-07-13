import React from 'react';
import clsx from 'clsx';
import { AnimatedSpinner } from './AnimatedSpinner';

const base =
  'inline-flex items-center justify-center font-heading rounded-lg px-6 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none text-base font-semibold shadow-elevation-2 backdrop-blur-glass border-0 relative overflow-hidden';

const variants = {
  primary: 'bg-gradient-button text-white hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] focus:ring-primary-teal',
  secondary: 'bg-gradient-accent text-white hover:shadow-glow-orange hover:scale-[1.02] active:scale-[0.98] focus:ring-primary-orange',
  outline: 'border-2 border-primary-teal text-primary-teal bg-transparent hover:bg-primary-teal hover:text-white hover:shadow-glow-teal focus:ring-primary-teal',
  ghost: 'bg-transparent text-primary-teal hover:bg-primary-teal/10 hover:text-primary-teal-dark focus:ring-primary-teal',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-glow-red hover:scale-[1.02] active:scale-[0.98] focus:ring-red-500',
  success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-glow-green hover:scale-[1.02] active:scale-[0.98] focus:ring-green-500',
  glass: 'bg-white/10 dark:bg-gray-800/10 text-gray-700 dark:text-gray-100 border border-white/20 dark:border-gray-700/20 backdrop-blur-glass hover:bg-white/20 dark:hover:bg-gray-800/20 focus:ring-primary-teal',
  lyro: 'bg-gradient-lyro text-white hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] focus:ring-primary-teal animate-gradient-shift',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const buttonClasses = clsx(
    base,
    variants[variant],
    sizes[size],
    {
      'w-full': fullWidth,
      'rounded-full': rounded,
      'cursor-not-allowed': loading || disabled,
      'opacity-50': loading || disabled,
    },
    className
  );

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <AnimatedSpinner size="sm" className="mr-2" />
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          <span className="mr-2">{icon}</span>
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          <span className="ml-2">{icon}</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      className={buttonClasses}
      disabled={loading || disabled}
      {...props}
    >
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-200 bg-white pointer-events-none" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center">
        {renderContent()}
      </span>
    </button>
  );
};

export default Button; 