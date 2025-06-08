import React from 'react'

// 黑色主題的 Loading 元件
const Loading = ({
  type = 'spinner', // spinner, dots, pulse, skeleton
  size = 'md', // sm, md, lg
  fullScreen = false,
  text = '',
  className = ''
}) => {
  // 尺寸對應
  const sizes = {
    sm: { spinner: 'w-6 h-6', dots: 'w-2 h-2', pulse: 'h-20' },
    md: { spinner: 'w-10 h-10', dots: 'w-3 h-3', pulse: 'h-32' },
    lg: { spinner: 'w-16 h-16', dots: 'w-4 h-4', pulse: 'h-48' }
  }
  
  // Spinner 載入器
  const Spinner = () => (
    <svg
      className={`animate-spin ${sizes[size].spinner} text-white ${className}`}
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
  )
  
  // Dots 載入器
  const Dots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizes[size].dots} bg-gray-400 rounded-full animate-pulse ${className}`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
  
  // Pulse 載入器（適合內容載入）
  const Pulse = () => (
    <div className={`space-y-4 ${className}`}>
      <div className={`${sizes[size].pulse} bg-gray-800 rounded-lg animate-pulse`} />
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
  
  // Skeleton 載入器（適合卡片載入）- 黑色主題
  const Skeleton = () => (
    <div className={`bg-black rounded-lg shadow-sm border border-gray-800 p-5 ${className}`}>
      <div className="animate-pulse">
        <div className="h-48 bg-gray-900 rounded-lg mb-4" />
        <div className="h-4 bg-gray-900 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-900 rounded w-1/2 mb-4" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-900 rounded-full" />
          <div className="h-6 w-16 bg-gray-900 rounded-full" />
        </div>
      </div>
    </div>
  )
  
  // 選擇載入器類型
  const loaders = {
    spinner: <Spinner />,
    dots: <Dots />,
    pulse: <Pulse />,
    skeleton: <Skeleton />
  }
  
  const loader = loaders[type]
  
  // 全螢幕載入
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
        {loader}
        {text && (
          <p className="mt-4 text-gray-300 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    )
  }
  
  // 一般載入
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {loader}
      {text && (
        <p className="mt-4 text-gray-400 text-sm">
          {text}
        </p>
      )}
    </div>
  )
}

// 匯出 Skeleton 預設集合（用於列表載入）- 黑色主題
export const SkeletonGrid = ({ count = 6, columns = 3 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Loading key={i} type="skeleton" />
      ))}
    </div>
  )
}

export default Loading