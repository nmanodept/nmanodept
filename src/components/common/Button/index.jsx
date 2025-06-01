import React from 'react'

// 現代化的 Button 元件，支援多種變體和狀態
const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  // 基礎樣式
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  // 變體樣式
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-900',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-900',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500'
  }
  
  // 尺寸樣式
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg'
  }
  
  // 組合樣式
  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim()
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClassName}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button