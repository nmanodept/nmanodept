// /src/components/common/Card/index.jsx
import React, { useState } from 'react'
import { Link } from 'gatsby'
import './Card.css'

const Card = ({ artwork, link }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // 處理作者顯示
  const authors = artwork.authors || (artwork.author ? [artwork.author] : [])
  const authorDisplay = authors.join(' 、 ')
  
  // 處理標籤
  const tags = artwork.tags || []
  const displayTags = tags.slice(0, 3) // 最多顯示3個標籤
  
  return (
    <Link to={link} className="card">
      <div className="card-image">
        {!imageLoaded && <div className="card-image-skeleton" />}
        <img
          src={artwork.main_image_url || artwork.image_url}
          alt={artwork.title}
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{artwork.title}</h3>
        
        <div className="card-meta">
          <span className="card-author">{authorDisplay}</span>
          <span>·</span>
          <span className="card-year">{artwork.project_year}</span>
        </div>
        
                {/* 類別 - 支援多類別 */}
        {((artwork.categories && artwork.categories.length > 0) || artwork.category_name) && (
          <div className="card-categories">
            {artwork.categories && artwork.categories.length > 0 ? (
              artwork.categories.map((category, index) => (
                <span key={index} className="card-category">
                  {category.name}
                  {index < artwork.categories.length - 1 && ''}
                </span>
              ))
            ) : (
              <span className="card-category">
                {artwork.category_name}
              </span>
            )}
          </div>
        )}

        {displayTags.length > 0 && (
          <div className="card-tags">
            {displayTags.map((tag, index) => (
              <span key={index} className="card-tag">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="card-tag">+{tags.length - 3}</span>
            )}
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