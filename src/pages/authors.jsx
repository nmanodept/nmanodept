// /src/pages/authors.jsx - 完整修復版
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './authors.css'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [filteredAuthors, setFilteredAuthors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, artworks
  const [viewMode, setViewMode] = useState('grid') // grid, list
  
  useEffect(() => {
    fetchAuthors()
  }, [])
  
  useEffect(() => {
    filterAndSortAuthors()
  }, [searchTerm, sortBy, authors])
  
  const fetchAuthors = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 嘗試獲取包含作品數量的作者資料
      let response = await fetch(`${apiUrl}/authors-with-counts`)
      let useWithCounts = true
      
      if (!response.ok) {
        // 備用方案：使用普通的 authors endpoint
        console.log('使用備用 API')
        response = await fetch(`${apiUrl}/authors`)
        useWithCounts = false
      }
      
      if (response.ok) {
        const data = await response.json()
        
        // 如果沒有 artwork_count，手動獲取作品數量
        let authorsWithCounts = data
        
        if (!useWithCounts) {
          // 獲取所有作品來計算每個作者的作品數
          const artworksRes = await fetch(`${apiUrl}/artworks`)
          if (artworksRes.ok) {
            const artworks = await artworksRes.json()
            
            // 計算每個作者的作品數
            const authorCounts = {}
            artworks.forEach(artwork => {
              const workAuthors = Array.isArray(artwork.authors) ? artwork.authors :
                                 typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : []
              
              workAuthors.forEach(authorName => {
                authorCounts[authorName] = (authorCounts[authorName] || 0) + 1
              })
            })
            
            // 更新作者資料
            authorsWithCounts = data.map(author => ({
              ...author,
              artwork_count: authorCounts[author.name] || 0
            }))
          }
        }
        
        // 只顯示有作品的作者
        const activeAuthors = authorsWithCounts.filter(author => author.artwork_count > 0)
        setAuthors(activeAuthors)
      } else {
        setError('無法載入作者列表')
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }
  
  const filterAndSortAuthors = () => {
    let filtered = [...authors]
    
    // 搜尋篩選
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(author => 
        author.name.toLowerCase().includes(searchLower) ||
        author.bio?.toLowerCase().includes(searchLower)
      )
    }
    
    // 排序
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-TW')
      } else if (sortBy === 'artworks') {
        return (b.artwork_count || 0) - (a.artwork_count || 0)
      }
      return 0
    })
    
    setFilteredAuthors(filtered)
  }
  
  if (loading) {
    return (
      <Layout>
        <Seo title="創作者" />
        <Loading />
      </Layout>
    )
  }
  
  return (
    <Layout>
      <Seo title="創作者" description="瀏覽所有創作者" />
      
      <div className="authors-container">
        <div className="authors-header">
          <h1>創作者</h1>
          <p className="authors-subtitle">
            探索 {authors.length} 位創作者的作品集
          </p>
        </div>
        
        {/* 搜尋和篩選列 */}
        <div className="authors-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜尋創作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM15 15l4 4" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <div className="control-buttons">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">按姓名排序</option>
              <option value="artworks">按作品數排序</option>
            </select>
            
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="網格檢視"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="2" width="7" height="7"/>
                  <rect x="11" y="2" width="7" height="7"/>
                  <rect x="2" y="11" width="7" height="7"/>
                  <rect x="11" y="11" width="7" height="7"/>
                </svg>
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="列表檢視"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="3" width="16" height="2"/>
                  <rect x="2" y="9" width="16" height="2"/>
                  <rect x="2" y="15" width="16" height="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAuthors} className="btn btn-outline">
              重新載入
            </button>
          </div>
        )}
        
        {/* 作者列表 */}
        {filteredAuthors.length > 0 ? (
          <div className={`authors-${viewMode}`}>
            {filteredAuthors.map(author => (
              <Link
                key={author.id || author.name}
                to={`/author/${encodeURIComponent(author.name)}`}
                className="author-card"
              >
                {/* 頭像 */}
                <div className="author-avatar">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt={author.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>{author.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                {/* 資訊 */}
                <div className="author-info">
                  <h3 className="author-name">{author.name}</h3>
                  
                  {author.bio && (
                    <p className="author-bio">
                      {author.bio.length > 100 
                        ? `${author.bio.substring(0, 100)}...` 
                        : author.bio}
                    </p>
                  )}
                  
                  <div className="author-stats">
                    <span className="artwork-count">
                      {author.artwork_count || 0} 件作品
                    </span>
                    
                    {author.social_links && author.social_links.length > 0 && (
                      <span className="social-indicator">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.5 5.5h-2c-.2-.8-.5-1.5-.9-2.1 1.2.3 2.2 1 2.9 2.1zM8 2c.5.7.9 1.5 1.1 2.5H6.9C7.1 3.5 7.5 2.7 8 2zm-3.5 6c0-.3 0-.7.1-1h3.8c0 .3.1.7.1 1s0 .7-.1 1H4.6c-.1-.3-.1-.7-.1-1zm.9 3.5c-.2-.8-.3-1.5-.4-2.5h2.9c.1 1 .3 1.8.6 2.5H5.4zm1.1-7c.4-.6.8-1.3 1.3-2.1-.7.3-1.3 1-1.7 2.1h.4zm3.1 7c-.4.6-.8 1.3-1.3 2.1.7-.3 1.3-1 1.7-2.1h-.4zm1.9-2.5c.1-.3.1-.7.1-1s0-.7-.1-1h2c.1.3.1.7.1 1s0 .7-.1 1h-2z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>沒有找到符合條件的創作者</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn btn-outline">
                清除搜尋
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuthorsPage