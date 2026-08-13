import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 placeholder:text-geist-gray-600 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-geist-gray-600 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
