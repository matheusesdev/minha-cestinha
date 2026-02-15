import React from 'react';

export const Button = ({ children, onClick, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
    danger: "bg-red-50 text-red-500 hover:bg-red-100 active:scale-95",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700 active:scale-95"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`font-medium transition-all duration-200 rounded-xl flex items-center justify-center gap-2 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};