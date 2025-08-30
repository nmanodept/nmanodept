// /src/pages/search.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { navigate, Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card, { CardGrid } from '../components/common/Card'
import Button from '../components/common/Button'
import './search.css'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedProjectYears, setSelectedProjectYears] = useState([]) // 創作年份
  const [selectedProjectSemesters, setSelectedProjectSemesters] = useState([])
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(false)
  const [allArtworks, setAllArtworks] = useState([])
  const [filteredArtworks, setFilteredArtworks] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableProjectYears, setAvailableProjectYears] = useState([])
  const [availableProjectSemesters, setAvailableProjectSemesters] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showCategoryFilters, setShowCategoryFilters] = useState(false)
  const [showProjectFilters, setShowProjectFilters] = useState(false)
  
  // 分頁
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // 從 URL 讀取參數
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    const tags = params.get('tags') ? params.get('tags').split(',') : []
    const categories = params.get('categories') ? params.get('categories').split(',') : []
    const years = params.get('years') ? params.get('years').split(',') : []
    const semesters = params.get('semesters') ? params.get('semesters').split(',') : []
    const sort = params.get('sort') || 'newest'
    const page = parseInt(params.get('page') || '1')
    
    setSearchTerm(q)
    setSelectedTags(tags)
    setSelectedCategories(categories)
    setSelectedProjectYears(years)
    setSelectedProjectSemesters(semesters)
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
        const projectYears = new Set()
        const projectSemesters = new Set()
        
        data.forEach(artwork => {
          // 標籤
          const artworkTags = artwork.tags || []
          artworkTags.forEach(tag => {
            if (tag) tags.add(tag)
          })
          
          // 類別 - 現在可能是多個
          if (artwork.categories && Array.isArray(artwork.categories)) {
            artwork.categories.forEach(cat => {
              if (cat.id && cat.name) {
                categories.set(cat.id, cat.name)
              }
            })
          } else if (artwork.category_id && artwork.category_name) {
            categories.set(artwork.category_id, artwork.category_name)
          }
          
          // 創作年份（原學年度）
          if (artwork.project_years && Array.isArray(artwork.project_years)) {
            artwork.project_years.forEach(year => {
              if (year) projectYears.add(year)
            })
          } else if (artwork.project_year) {
            projectYears.add(artwork.project_year)
          }
          
          // 年級學期
          if (artwork.project_semesters && Array.isArray(artwork.project_semesters)) {
            artwork.project_semesters.forEach(semester => {
              if (semester) projectSemesters.add(semester)
            })
          } else if (artwork.project_semester) {
            projectSemesters.add(artwork.project_semester)
          }
        })
        
        setAvailableTags(Array.from(tags).sort())
        setAvailableCategories(Array.from(categories, ([id, name]) => ({ id, name })))
        setAvailableProjectYears(Array.from(projectYears).sort())
        setAvailableProjectSemesters(Array.from(projectSemesters).sort())
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
    
    // 類別篩選 - 現在支援多類別
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(artwork => {
        if (artwork.categories && Array.isArray(artwork.categories)) {
          return selectedCategories.some(selectedCatId => 
            artwork.categories.some(cat => String(cat.id) === String(selectedCatId))
          )
        } else if (artwork.category_id) {
          return selectedCategories.includes(String(artwork.category_id))
        }
        return false
      })
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
    
    // 創作年份篩選
    if (selectedProjectYears.length > 0) {
      filtered = filtered.filter(artwork => {
        if (artwork.project_years && Array.isArray(artwork.project_years)) {
          return selectedProjectYears.some(year => 
            artwork.project_years.includes(year)
          )
        } else if (artwork.project_year) {
          return selectedProjectYears.includes(artwork.project_year)
        }
        return false
      })
    }
    
    // 年級學期篩選
    if (selectedProjectSemesters.length > 0) {
      filtered = filtered.filter(artwork => {
        if (artwork.project_semesters && Array.isArray(artwork.project_semesters)) {
          return selectedProjectSemesters.some(semester => 
            artwork.project_semesters.includes(semester)
          )
        } else if (artwork.project_semester) {
          return selectedProjectSemesters.includes(artwork.project_semester)
        }
        return false
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
  }, [searchTerm, selectedTags, selectedCategories, selectedProjectYears, selectedProjectSemesters, sortBy, allArtworks])

  // 篩選條件改變時重置頁碼
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTags, selectedCategories, selectedProjectYears, selectedProjectSemesters, sortBy])
  
  // 應用篩選
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // 更新 URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','))
    if (selectedProjectYears.length > 0) params.set('years', selectedProjectYears.join(','))
    if (selectedProjectSemesters.length > 0) params.set('semesters', selectedProjectSemesters.join(','))
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search'
    
    // 只在 URL 真的需要改變時才更新
    const currentURL = window.location.pathname + window.location.search
    if (currentURL !== newURL) {
      window.history.pushState({}, '', newURL)
    }
  }, [searchTerm, selectedTags, selectedCategories, selectedProjectYears, selectedProjectSemesters, sortBy, currentPage])

  // 切換標籤
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }

  // 切換類別
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }

  // 切換創作年份
  const toggleProjectYear = (year) => {
    setSelectedProjectYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    )
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }

  // 切換年級學期
  const toggleProjectSemester = (semester) => {
    setSelectedProjectSemesters(prev => 
      prev.includes(semester) 
        ? prev.filter(s => s !== semester)
        : [...prev, semester]
    )
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }

  // 清除篩選
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedCategories([])
    setSelectedProjectYears([])
    setSelectedProjectSemesters([])
    setSortBy('newest')
    setCurrentPage(1)
    navigate('/search')
  }

  // 計算分頁
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentArtworks = filteredArtworks.slice(startIndex, endIndex)

  // 作品卡片渲染函數
  const renderArtwork = (artwork) => {
    const imageUrl = artwork.main_image_url || '/images/placeholder.jpg'
    const authorNames = artwork.authors?.join(', ') || artwork.author || '未知作者'
    
    return (
      <Link
        key={artwork.id}
        to={`/art/${artwork.id}`}
        className="artwork-card"
      >
        <div className="artwork-image">
          <img src={imageUrl} alt={artwork.title} loading="lazy" />
          {/* 在圖片上顯示標籤 */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="artwork-tags-overlay">
              {artwork.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag-badge">
                  {tag}
                </span>
              ))}
              {artwork.tags.length > 3 && (
                <span className="tag-badge more">+{artwork.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <div className="artwork-info">
          <h3 className="artwork-title">{artwork.title}</h3>
          <p className="artwork-author">{authorNames}</p>
          {artwork.project_year && (
            <p className="artwork-year">{artwork.project_year}年作品</p>
          )}
          {/* 類別顯示 */}
          {artwork.categories && artwork.categories.length > 0 && (
            <div className="artwork-categories">
              {artwork.categories.map((cat, index) => (
                <span key={index} className="category-tag">
                  {cat.name || cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    )
  }

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

          {/* 類別篩選 */}
          <button
            onClick={() => setShowCategoryFilters(!showCategoryFilters)}
            className="filter-toggle"
          >
            類別篩選
            {selectedCategories.length > 0 && (
              <span className="filter-count">{selectedCategories.length}</span>
            )}
          </button>

          {/* 標籤篩選 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            標籤篩選
            {selectedTags.length > 0 && (
              <span className="filter-count">{selectedTags.length}</span>
            )}
          </button>

          {/* 專題篩選 */}
          <button
            onClick={() => setShowProjectFilters(!showProjectFilters)}
            className="filter-toggle"
          >
            專題篩選
            {(selectedProjectYears.length + selectedProjectSemesters.length) > 0 && (
              <span className="filter-count">{selectedProjectYears.length + selectedProjectSemesters.length}</span>
            )}
          </button>

          {/* 清除篩選 */}
          {(searchTerm || selectedTags.length > 0 || selectedCategories.length > 0 || 
            selectedProjectYears.length > 0 || selectedProjectSemesters.length > 0) && (
            <button onClick={clearFilters} className="filter-clear">
              清除
            </button>
          )}
        </div>

        {/* 類別選擇器 */}
        {showCategoryFilters && (
          <div className="filter-selector categories-selector">
            <h3 className="filter-selector-title">選擇類別</h3>
            <div className="filter-buttons">
              {availableCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(String(category.id))}
                  className={`filter-button ${selectedCategories.includes(String(category.id)) ? 'active' : ''}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 標籤選擇器 */}
        {showFilters && (
          <div className="filter-selector tags-selector">
            <h3 className="filter-selector-title">選擇標籤</h3>
            <div className="filter-buttons">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`filter-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 專題區選擇器 */}
        {showProjectFilters && (
          <div className="filter-selector project-selector">
            <div className="project-filter-group">
              <h4 className="filter-group-title">創作年份</h4>
              <div className="filter-buttons">
                {availableProjectYears.map(year => (
                  <button
                    key={year}
                    onClick={() => toggleProjectYear(year)}
                    className={`filter-button ${selectedProjectYears.includes(year) ? 'active' : ''}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="project-filter-group">
              <h4 className="filter-group-title">年級學期</h4>
              <div className="filter-buttons">
                {availableProjectSemesters.map(semester => (
                  <button
                    key={semester}
                    onClick={() => toggleProjectSemester(semester)}
                    className={`filter-button ${selectedProjectSemesters.includes(semester) ? 'active' : ''}`}
                  >
                    {semester}
                  </button>
                ))}
              </div>
            </div>
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
                {currentArtworks.map(artwork => renderArtwork(artwork))}
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