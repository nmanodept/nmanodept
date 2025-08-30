// /src/components/common/Card/index.jsx - 完整修復版
import React, { useState } from 'react'
import { Link } from 'gatsby'
import './Card.css'

const Card = ({ artwork, link }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // 處理作者顯示
  const getAuthors = () => {
    if (Array.isArray(artwork.authors)) {
      return artwork.authors
    } else if (artwork.author) {
      return [artwork.author]
    }
    return []
  }
  
  const authors = getAuthors()
  const authorDisplay = authors.join(' 、 ')
  
  // 處理標籤
  const getTags = () => {
    if (Array.isArray(artwork.tags)) {
      return artwork.tags
    } else if (typeof artwork.tags === 'string') {
      try {
        return JSON.parse(artwork.tags || '[]')
      } catch {
        return []
      }
    }
    return []
  }
  
  const tags = getTags()
  const displayTags = tags.slice(0, 3) // 最多顯示3個標籤
  
  // 處理類別
  const getCategories = () => {
    if (Array.isArray(artwork.categories)) {
      return artwork.categories
    } else if (typeof artwork.categories === 'string') {
      try {
        return JSON.parse(artwork.categories || '[]')
      } catch {
        return []
      }
    } else if (artwork.category_name) {
      return [{ name: artwork.category_name }]
    }
    return []
  }
  
  const categories = getCategories()
  
  // 處理圖片URL
  const imageUrl = artwork.main_image_url || artwork.image_url || '/images/placeholder.jpg'
  
  return (
    <Link to={link} className="card">
      <div className="card-image">
        {!imageLoaded && !imageError && <div className="card-image-skeleton" />}
        <img
          src={imageError ? '/images/placeholder.jpg' : imageUrl}
          alt={artwork.title}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true)
            setImageLoaded(true)
          }}
          style={{ opacity: imageLoaded ? 1 : 0 }}
          loading="lazy"
        />
        
        {/* 在圖片上顯示標籤 */}
        {displayTags.length > 0 && (
          <div className="card-tags-overlay">
            {displayTags.map((tag, index) => (
              <span key={index} className="tag-badge">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="tag-badge more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{artwork.title}</h3>
        
        <div className="card-meta">
          {authorDisplay && (
            <>
              <span className="card-author">{authorDisplay}</span>
              {artwork.project_year && <span className="card-divider">·</span>}
            </>
          )}
          {artwork.project_year && (
            <span className="card-year">{artwork.project_year}</span>
          )}
        </div>
        
        {/* 類別顯示 */}
        {categories.length > 0 && (
          <div className="card-categories">
            {categories.map((category, index) => (
              <span key={index} className="card-category">
                {typeof category === 'object' ? category.name : category}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

// 卡片網格元件
export const CardGrid = ({ children }) => {
  return <div className="card-grid">{children}</div>
}

export default Card