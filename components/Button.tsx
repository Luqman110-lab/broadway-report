import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 shadow-sm active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent shadow-primary-200",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400 border border-gray-200",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-red-500 border border-transparent shadow-red-200",
    success: "bg-success text-white hover:bg-emerald-600 focus:ring-emerald-500 border border-transparent shadow-emerald-200",
    outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`}
      {...props}
    >
      {children}
    </button>
  );
};