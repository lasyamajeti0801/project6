import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-forest hover:bg-forest-light text-white shadow-soft active:scale-[0.98]',
    secondary: 'bg-sage-100 hover:bg-sage-200 text-forest-dark border border-sage-200 active:scale-[0.98]',
    outline: 'border border-charcoal-200 hover:border-forest text-charcoal-800 hover:text-forest bg-white dark:bg-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-100 dark:hover:text-accent',
    danger: 'bg-alert hover:bg-red-700 text-white shadow-soft active:scale-[0.98]',
    amber: 'bg-amber hover:bg-amber-warm text-charcoal-900 shadow-soft active:scale-[0.98]',
    ghost: 'hover:bg-charcoal-100 text-charcoal-700 hover:text-forest dark:hover:bg-charcoal-800 dark:text-charcoal-200',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
