// /src/pages/search.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card, { CardGrid } from '../components/common/Card'
import Button from '../components/common/Button'
import './search.css'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(false)
  const [allArtworks, setAllArtworks] = useState([])
  const [filteredArtworks, setFilteredArtworks] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // 分頁
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // 從 URL 讀取參數
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    const tags = params.get('tags') ? params.get('tags').split(',') : []
    const category = params.get('category') || ''
    const sort = params.get('sort') || 'newest'
    const page = parseInt(params.get('page') || '1')
    
    setSearchTerm(q)
    setSelectedTags(tags)
    setSelectedCategory(category)
    setSortBy(sort)
    setCurrentPage(page)
  }, [location.search])

  // 載入作品
  useEffect(() => {
    fetchAllArtworks()
  }, [])

  const fetchAllArtworks = async () => {
    setIsLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/artworks`)
      
      if (response.ok) {
        const data = await response.json()
        setAllArtworks(data)
        
        // 提取篩選選項
        const tags = new Set()
        const categories = new Map()
        
        data.forEach(artwork => {
          const artworkTags = artwork.tags || []
          artworkTags.forEach(tag => {
            if (tag) tags.add(tag)
          })
          
          if (artwork.category_id && artwork.category_name) {
            categories.set(artwork.category_id, artwork.category_name)
          }
        })
        
        setAvailableTags(Array.from(tags).sort())
        setAvailableCategories(Array.from(categories, ([id, name]) => ({ id, name })))
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 套用篩選
  const applyFilters = useCallback(() => {
    if (allArtworks.length === 0) return
    
    let filtered = [...allArtworks]
    
    // 文字搜尋
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(artwork => {
        const titleMatch = artwork.title?.toLowerCase().includes(searchLower)
        const descMatch = artwork.description?.toLowerCase().includes(searchLower)
        const authorMatch = artwork.authors?.some(author => 
          author.toLowerCase().includes(searchLower)
        )
        return titleMatch || descMatch || authorMatch
      })
    }
    
    // 類別篩選
    if (selectedCategory) {
      filtered = filtered.filter(artwork => 
        String(artwork.category_id) === String(selectedCategory)
      )
    }
    
    // 標籤篩選
    if (selectedTags.length > 0) {
      filtered = filtered.filter(artwork => {
        const artworkTags = artwork.tags || []
        return selectedTags.some(tag => 
          artworkTags.some(t => t?.toLowerCase() === tag.toLowerCase())
        )
      })
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        case 'popular':
          return (b.view_count || 0) - (a.view_count || 0)
        case 'random':
          return Math.random() - 0.5
        default:
          return 0
      }
    })
    
    setFilteredArtworks(filtered)
  }, [searchTerm, selectedTags, selectedCategory, sortBy, allArtworks])

  // 篩選條件改變時更新
  useEffect(() => {
    setCurrentPage(1)
    applyFilters()
  }, [searchTerm, selectedTags, selectedCategory, sortBy, applyFilters])

  // 更新 URL - 分離 currentPage 的處理
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (selectedCategory) params.set('category', selectedCategory)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search'
    
    // 使用 replace: false 來保持歷史記錄
    if (window.location.pathname + window.location.search !== newURL) {
      navigate(newURL, { replace: false })
    }
  }, [searchTerm, selectedTags, selectedCategory, sortBy, currentPage])

  // 切換標籤
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    // 防止頁面跳轉到頂部
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }

  // 清除篩選
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedCategory('')
    setSortBy('newest')
    setCurrentPage(1)
    navigate('/search')
  }

  // 計算分頁
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentArtworks = filteredArtworks.slice(startIndex, endIndex)

  // 載入骨架
  const renderSkeleton = () => (
    <div className="search-grid">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="card-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
            <div className="skeleton-tags">
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Layout>
      <Seo title="搜尋作品" description="探索平台上的藝術作品" />
      
      <div className="search-container">
        {/* 搜尋頭部 */}
        <div className="search-header">
          <h1 className="search-title">探索作品</h1>
          
          {/* 搜尋框 */}
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋作品、作者..."
              className="search-input"
            />
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 109 1a8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15 15l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="search-filters">
          {/* 類別選擇 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">所有類別</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">最新</option>
            <option value="oldest">最舊</option>
            <option value="random">隨機</option>
            <option value="popular">熱門</option>
          </select>

          {/* 標籤顯示 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            標籤篩選
            {selectedTags.length > 0 && (
              <span className="filter-count">{selectedTags.length}</span>
            )}
          </button>

          {/* 清除篩選 */}
          {(searchTerm || selectedTags.length > 0 || selectedCategory) && (
            <button onClick={clearFilters} className="filter-clear">
              清除
            </button>
          )}
        </div>

        {/* 標籤選擇器 */}
        {showFilters && (
          <div className="tags-selector">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* 結果統計 */}
        <div className="search-stats">
          <span>{filteredArtworks.length}</span> 件作品
        </div>

        {/* 搜尋結果 */}
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            {currentArtworks.length > 0 ? (
              <div className="search-grid">
                {currentArtworks.map(artwork => (
                  <Card
                    key={artwork.id}
                    artwork={artwork}
                    link={`/art/${artwork.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>沒有找到符合條件的作品</p>
                <Button variant="ghost" onClick={clearFilters}>
                  清除篩選條件
                </Button>
              </div>
            )}

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ←
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination-num ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                {totalPages > 5 && <span className="pagination-dots">...</span>}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage