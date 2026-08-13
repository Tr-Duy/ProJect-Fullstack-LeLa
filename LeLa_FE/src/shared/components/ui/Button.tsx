import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let variantStyles = '';
    switch (variant) {
      case 'default':
        variantStyles = 'bg-geist-gray-1000 text-geist-bg-100 hover:bg-geist-gray-900 border border-transparent';
        break;
      case 'secondary':
        variantStyles = 'bg-geist-gray-200 text-geist-gray-1000 hover:bg-geist-gray-300 border border-transparent';
        break;
      case 'outline':
        variantStyles = 'bg-transparent text-geist-gray-1000 border border-geist-gray-400 hover:border-geist-gray-600 hover:bg-geist-gray-100';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent text-geist-gray-1000 hover:bg-geist-gray-200 border border-transparent';
        break;
      case 'destructive':
        variantStyles = 'bg-geist-red-800 text-white hover:bg-geist-red-900 border border-transparent';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'default':
        sizeStyles = 'h-10 px-4 py-2 text-sm';
        break;
      case 'sm':
        sizeStyles = 'h-8 px-3 text-xs';
        break;
      case 'lg':
        sizeStyles = 'h-12 px-8 text-base';
        break;
      case 'icon':
        sizeStyles = 'h-10 w-10 justify-center p-0';
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-geist-blue-700 disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
