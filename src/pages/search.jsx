// /src/pages/search.jsx - 完整修復版
import React, { useState, useEffect, useCallback } from 'react'
import { navigate, Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import './search.css'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedProjectYears, setSelectedProjectYears] = useState([])
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

  // 載入作品 - 優化版本
  useEffect(() => {
    fetchAllArtworks()
  }, [])

  const fetchAllArtworks = async () => {
    setIsLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/artworks`, {
        headers: {
          'Cache-Control': 'max-age=300'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 處理資料格式
        const processedData = data.map(artwork => ({
          ...artwork,
          tags: Array.isArray(artwork.tags) ? artwork.tags : 
                typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : [],
          authors: Array.isArray(artwork.authors) ? artwork.authors :
                   typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : [],
          categories: Array.isArray(artwork.categories) ? artwork.categories :
                      typeof artwork.categories === 'string' ? JSON.parse(artwork.categories || '[]') : []
        }))
        
        setAllArtworks(processedData)
        
        // 提取篩選選項
        const tags = new Set()
        const categories = new Map()
        const projectYears = new Set()
        const projectSemesters = new Set()
        
        processedData.forEach(artwork => {
          // 標籤
          artwork.tags.forEach(tag => {
            if (tag) tags.add(tag)
          })
          
          // 類別
          if (artwork.categories && Array.isArray(artwork.categories)) {
            artwork.categories.forEach(cat => {
              if (typeof cat === 'object' && cat.id && cat.name) {
                categories.set(cat.id, cat.name)
              } else if (typeof cat === 'string') {
                categories.set(cat, cat)
              }
            })
          }
          
          // 創作年份
          if (artwork.project_year) {
            projectYears.add(artwork.project_year)
          }
          
          // 年級學期
          if (artwork.project_semester) {
            projectSemesters.add(artwork.project_semester)
          }
        })
        
        setAvailableTags(Array.from(tags).sort())
        setAvailableCategories(Array.from(categories.entries()).map(([id, name]) => ({ id, name })))
        setAvailableProjectYears(Array.from(projectYears).sort((a, b) => b - a))
        setAvailableProjectSemesters(Array.from(projectSemesters).sort())
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 應用篩選
  const applyFilters = useCallback(() => {
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
        const tagMatch = artwork.tags?.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )
        return titleMatch || descMatch || authorMatch || tagMatch
      })
    }
    
    // 類別篩選
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(artwork => {
        if (artwork.categories && Array.isArray(artwork.categories)) {
          return selectedCategories.some(selectedCatId => 
            artwork.categories.some(cat => {
              if (typeof cat === 'object') {
                return String(cat.id) === String(selectedCatId)
              }
              return String(cat) === String(selectedCatId)
            })
          )
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
      filtered = filtered.filter(artwork => 
        selectedProjectYears.includes(artwork.project_year)
      )
    }
    
    // 年級學期篩選
    if (selectedProjectSemesters.length > 0) {
      filtered = filtered.filter(artwork => 
        selectedProjectSemesters.includes(artwork.project_semester)
      )
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

  // 應用篩選
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // 篩選條件改變時重置頁碼
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTags, selectedCategories, selectedProjectYears, selectedProjectSemesters, sortBy])

  // 切換標籤
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 切換類別
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // 切換創作年份
  const toggleProjectYear = (year) => {
    setSelectedProjectYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    )
  }

  // 切換年級學期
  const toggleProjectSemester = (semester) => {
    setSelectedProjectSemesters(prev => 
      prev.includes(semester) 
        ? prev.filter(s => s !== semester)
        : [...prev, semester]
    )
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
  }

  // 計算分頁
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentArtworks = filteredArtworks.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <Layout>
        <Seo title="搜尋作品" />
        <Loading />
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo title="搜尋作品" description="探索平台上的藝術作品" />
      
      <div className="search-container">
        {/* 搜尋頭部 */}
        <div className="search-header">
          <h1 className="search-title">探索作品</h1>
          
          {/* 搜尋欄 */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜尋作品、作者或標籤..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM15 15l4 4" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 篩選控制列 */}
        <div className="search-filters">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">最新作品</option>
            <option value="oldest">最舊作品</option>
            <option value="popular">熱門作品</option>
            <option value="random">隨機排序</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            標籤篩選 {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
          
          <button
            onClick={() => setShowCategoryFilters(!showCategoryFilters)}
            className={`filter-toggle ${showCategoryFilters ? 'active' : ''}`}
          >
            類別篩選 {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </button>
          
          <button
            onClick={() => setShowProjectFilters(!showProjectFilters)}
            className={`filter-toggle ${showProjectFilters ? 'active' : ''}`}
          >
            年份篩選
          </button>
          
          {(selectedTags.length > 0 || selectedCategories.length > 0 || 
            selectedProjectYears.length > 0 || selectedProjectSemesters.length > 0) && (
            <button onClick={clearFilters} className="filter-clear">
              清除篩選
            </button>
          )}
        </div>

        {/* 標籤篩選面板 */}
        {showFilters && availableTags.length > 0 && (
          <div className="filter-panel">
            <h3>標籤篩選</h3>
            <div className="filter-tags">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`filter-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 類別篩選面板 */}
        {showCategoryFilters && availableCategories.length > 0 && (
          <div className="filter-panel">
            <h3>類別篩選</h3>
            <div className="filter-categories">
              {availableCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`filter-category ${selectedCategories.includes(category.id) ? 'active' : ''}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 年份篩選面板 */}
        {showProjectFilters && (
          <div className="filter-panel project-filters">
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
            {(searchTerm || selectedTags.length > 0 || selectedCategories.length > 0) && (
              <Button variant="ghost" onClick={clearFilters}>
                清除篩選條件
              </Button>
            )}
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
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
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
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              →
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage