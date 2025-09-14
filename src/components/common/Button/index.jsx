// src/components/common/Button/index.jsx
import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  type = 'button', 
  size = 'md', 
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const classNames = [
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    disabled && 'btn-disabled'
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;