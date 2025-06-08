// /src/components/common/Button/index.jsx
import React from 'react'
import './Button.css'

const Button = ({
  children,
  variant = 'primary', // primary, secondary, ghost, outline
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const buttonClass = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full' : ''}
    ${loading ? 'btn-loading' : ''}
    ${icon && !children ? 'btn-icon-only' : ''}
    ${className}
  `.trim()
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={buttonClass}
      {...props}
    >
      {loading && (
        <span className="btn-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle
              className="spinner-circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="2"
            />
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon btn-icon-left">{icon}</span>
      )}
      
      {children && <span className="btn-text">{children}</span>}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}
    </button>
  )
}

// 按鈕組組件
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`btn-group ${className}`}>
      {children}
    </div>
  )
}

export default Button