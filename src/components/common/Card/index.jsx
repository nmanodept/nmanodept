import React from 'react'
import { Link } from 'gatsby'
import './Card.css'

const Card = ({ 
  id, 
  title = '未命名作品', 
  imageUrl, 
  author = '未知作者', 
  tags = [], 
  year, 
  viewCount = 0 
}) => {
  // 確保 author 是字串
  const authorName = typeof author === 'string' ? author : 
                     (author?.name || author?.toString() || '未知作者')
  
  // 確保 tags 是陣列
  const tagsList = Array.isArray(tags) ? tags : []
  
  return (
    <Link to={`/art/${id}`} className="card-link">
      <article className="card">
        <div className="card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={title} loading="lazy" />
          ) : (
            <div className="card-placeholder">
              <span>無圖片</span>
            </div>
          )}
        </div>
        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          <p className="card-author">by {authorName}</p>
          {tagsList.length > 0 && (
            <div className="card-tags">
              {tagsList.slice(0, 3).map((tag, index) => (
                <span key={index} className="card-tag">
                  {typeof tag === 'string' ? tag : tag.name}
                </span>
              ))}
              {tagsList.length > 3 && (
                <span className="card-tag">+{tagsList.length - 3}</span>
              )}
            </div>
          )}
          <div className="card-meta">
            {year && <span className="card-year">{year}</span>}
            <span className="card-views">{viewCount} 次觀看</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// 新增 CardGrid 元件
export const CardGrid = ({ children }) => (
  <div className="card-grid">
    {children}
  </div>
)

export default Card