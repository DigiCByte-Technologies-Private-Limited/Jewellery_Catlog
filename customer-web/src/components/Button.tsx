import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition focus:outline-none';
  const variantStyles =
    variant === 'primary'
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};
