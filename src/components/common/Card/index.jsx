import React from 'react'
import { Link } from 'gatsby'

// 多用途 Card 元件，支援圖片、hover 效果等
const Card = ({
  image,
  title,
  subtitle,
  description,
  tags = [],
  link,
  onClick,
  className = '',
  imageHeight = 'h-48',
  hover = true,
  children
}) => {
  // Card 內容
  const cardContent = (
    <>
      {/* 圖片區塊 */}
      {image && (
        <div className={`relative overflow-hidden ${imageHeight} bg-gray-100`}>
          <img
            src={image}
            alt={title || 'Card image'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* 可選：圖片遮罩效果 */}
          {hover && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-300" />
          )}
        </div>
      )}
      
      {/* 內容區塊 */}
      <div className="p-5">
        {/* 標題 */}
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {title}
          </h3>
        )}
        
        {/* 副標題 */}
        {subtitle && (
          <p className="text-sm text-gray-600 mb-2">
            {subtitle}
          </p>
        )}
        
        {/* 描述 */}
        {description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* 自訂內容插槽 */}
        {children}
      </div>
    </>
  )
  
  // 基礎樣式
  const baseStyles = `
    bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
    ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim()
  
  // 如果有連結，使用 Gatsby Link
  if (link) {
    return (
      <Link to={link} className={baseStyles}>
        {cardContent}
      </Link>
    )
  }
  
  // 如果有 onClick，使用 div
  if (onClick) {
    return (
      <div onClick={onClick} className={baseStyles} role="button" tabIndex={0}>
        {cardContent}
      </div>
    )
  }
  
  // 否則只是靜態 Card
  return (
    <div className={baseStyles}>
      {cardContent}
    </div>
  )
}

// 匯出 Card 群組元件（用於 Grid 排版）
export const CardGrid = ({ children, columns = 3, gap = 6, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  }
  
  return (
    <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>
      {children}
    </div>
  )
}

export default Card