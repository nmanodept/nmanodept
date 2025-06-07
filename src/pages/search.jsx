// src/pages/search.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Card, { CardGrid } from '../components/common/Card'
import { SkeletonGrid } from '../components/common/Loading'
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  FunnelIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  TagIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(false)
  const [allArtworks, setAllArtworks] = useState([])
  const [filteredArtworks, setFilteredArtworks] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  const [availableSemesters, setAvailableSemesters] = useState([])
  
  // 分頁設定
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 // 3x4 網格

  // 從 URL 參數讀取搜尋條件
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    const tags = params.get('tags') ? params.get('tags').split(',') : []
    const category = params.get('category') || ''
    const year = params.get('year') || ''
    const semester = params.get('semester') || ''
    const sort = params.get('sort') || 'newest'
    const page = parseInt(params.get('page') || '1')
    
    setSearchTerm(q)
    setSelectedTags(tags)
    setSelectedCategory(category)
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSortBy(sort)
    setCurrentPage(page)
    
    // 如果有任何搜尋參數，展開篩選器
    if (tags.length > 0 || category || year || semester) {
      setShowFilters(true)
    }
  }, [location.search])

  // 初始載入所有作品
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
        console.log('Fetched artworks:', data)
        
        setAllArtworks(data)
        
        // 提取所有可用的篩選選項
        const tags = new Set()
        const categories = new Map()
        const years = new Set()
        const semesters = new Set()
        
        data.forEach(artwork => {
          // 處理 tags
          const artworkTags = artwork.tags || []
          artworkTags.forEach(tag => {
            if (tag) tags.add(tag)
          })
          
          // 處理類別
          if (artwork.category_id && artwork.category_name) {
            categories.set(artwork.category_id, artwork.category_name)
          }
          
          // 處理年度和學期
          if (artwork.project_year) years.add(artwork.project_year)
          if (artwork.project_semester) semesters.add(artwork.project_semester)
        })
        
        setAvailableTags(Array.from(tags).sort())
        setAvailableCategories(Array.from(categories, ([id, name]) => ({ id, name })))
        setAvailableYears(Array.from(years).sort((a, b) => b - a))
        setAvailableSemesters(Array.from(semesters))
        
        console.log('Available filters:', { 
          tags: Array.from(tags), 
          categories: Array.from(categories)
        })
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // applyFilters 函數使用 useCallback
  const applyFilters = useCallback(() => {
    if (allArtworks.length === 0) return
    
    let filtered = [...allArtworks]
    
    // 文字搜尋（模糊搜尋標題、作者、描述）
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(artwork => {
        const titleMatch = artwork.title && artwork.title.toLowerCase().includes(searchLower)
        const descMatch = artwork.description && artwork.description.toLowerCase().includes(searchLower)
        // 搜尋多個作者
        const authorMatch = artwork.authors && artwork.authors.some(author => 
          author.toLowerCase().includes(searchLower)
        )
        return titleMatch || descMatch || authorMatch
      })
    }
    
    // 類別篩選（修正比對邏輯）
    if (selectedCategory) {
      filtered = filtered.filter(artwork => 
        String(artwork.category_id) === String(selectedCategory)
      )
    }
    
    // Tag 篩選（不區分大小寫）
    if (selectedTags.length > 0) {
      filtered = filtered.filter(artwork => {
        const artworkTags = artwork.tags || []
        const lowerArtworkTags = artworkTags.map(t => t ? t.toLowerCase() : '')
        return selectedTags.some(selectedTag => 
          lowerArtworkTags.includes(selectedTag.toLowerCase())
        )
      })
    }
    
    // 學年度篩選
    if (selectedYear) {
      filtered = filtered.filter(artwork => artwork.project_year === selectedYear)
    }
    
    // 年級學期篩選
    if (selectedSemester) {
      filtered = filtered.filter(artwork => artwork.project_semester === selectedSemester)
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
  }, [searchTerm, selectedTags, selectedCategory, selectedYear, selectedSemester, sortBy, allArtworks])

  // 當篩選條件改變時，更新結果並重置頁數
  useEffect(() => {
    setCurrentPage(1)
    applyFilters()
  }, [searchTerm, selectedTags, selectedCategory, selectedYear, selectedSemester, sortBy, applyFilters])

  // 更新 URL 函數
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedYear) params.set('year', selectedYear)
    if (selectedSemester) params.set('semester', selectedSemester)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search'
    // 使用 replace: false 以確保頁面狀態正確更新
    navigate(newURL, { replace: false })
  }, [searchTerm, selectedTags, selectedCategory, selectedYear, selectedSemester, sortBy, currentPage])

  // 單獨處理頁碼變化
  useEffect(() => {
    updateURL()
  }, [currentPage, updateURL])

  // 切換標籤
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 清除所有篩選
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedCategory('')
    setSelectedYear('')
    setSelectedSemester('')
    setSortBy('newest')
    setCurrentPage(1)
    navigate('/search')
  }

  // 截斷文字
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text
  }

  // 計算分頁
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentArtworks = filteredArtworks.slice(startIndex, endIndex)

  // 換頁
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 生成頁碼按鈕
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 上一頁
    pages.push(
      <button
        key="prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
    )

    // 第一頁
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="dots1" className="px-2">...</span>)
      }
    }

    // 頁碼
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-4 py-2 rounded-lg border ${
            i === currentPage
              ? 'bg-orange-500 text-white border-orange-500'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      )
    }

    // 最後一頁
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="px-2">...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          {totalPages}
        </button>
      )
    }

    // 下一頁
    pages.push(
      <button
        key="next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    )

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        {pages}
      </div>
    )
  }

  return (
    <Layout>
      <Seo 
        title="搜尋作品" 
        description="搜尋 nmanodept 平台上的藝術作品"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋區 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">搜尋作品</h1>
          
          {/* 搜尋輸入框 */}
          <div className="max-w-2xl mx-auto mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋作品標題、作者或描述..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          {/* 篩選器開關 */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>篩選器</span>
              {showFilters ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
              {(selectedTags.length > 0 || selectedCategory || selectedYear || selectedSemester) && (
                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  {selectedTags.length + (selectedCategory ? 1 : 0) + (selectedYear ? 1 : 0) + (selectedSemester ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          
          {/* 篩選器內容 */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 類別 */}
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    作品類別
                  </label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">全部類別</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* 學年度 */}
                <div>
                  <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    學年度
                  </label>
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">全部</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {/* 年級學期 */}
                <div>
                  <label htmlFor="semester-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    年級學期
                  </label>
                  <select
                    id="semester-filter"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">全部</option>
                    {availableSemesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                
                {/* 排序方式 */}
                <div>
                  <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    排序方式
                  </label>
                  <select
                    id="sort-filter"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">最新</option>
                    <option value="oldest">最舊</option>
                    <option value="popular">熱門</option>
                    <option value="random">隨機</option>
                  </select>
                </div>
              </div>
              
              {/* Tag 選擇 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="inline w-4 h-4 mr-1" />
                  標籤篩選（可多選）
                </label>
                {availableTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`
                          px-3 py-1 rounded-full text-sm font-medium transition-colors
                          ${selectedTags.includes(tag)
                            ? 'bg-green-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">載入標籤中...</p>
                )}
              </div>
              
              {/* 清除按鈕 */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  清除所有篩選
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 搜尋結果 */}
        <div>
          {/* 結果統計 */}
          <div className="mb-4 text-gray-600">
            找到 <span className="font-semibold text-gray-900">{filteredArtworks.length}</span> 件作品
            {filteredArtworks.length > itemsPerPage && (
              <span className="ml-2">
                （第 {startIndex + 1} - {Math.min(endIndex, filteredArtworks.length)} 件）
              </span>
            )}
          </div>
          
          {/* 載入中 */}
          {isLoading && <SkeletonGrid count={12} columns={3} />}
          
          {/* 作品卡片 */}
          {!isLoading && currentArtworks.length > 0 && (
            <>
              <CardGrid columns={3}>
                {currentArtworks.map(artwork => {
                  const tags = artwork.tags || []
                  const authors = artwork.authors || []
                  
                  return (
                    <Card
                      key={artwork.id}
                      image={artwork.main_image_url}
                      title={artwork.title}
                      subtitle={
                        <div className="space-y-1">
                          <div className="text-sm">
                            {authors.join(', ') || artwork.author}
                          </div>
                          {artwork.category_name && (
                            <div className="flex items-center gap-1 text-sm">
                              <FolderIcon className="w-3 h-3" />
                              <span>{artwork.category_name}</span>
                            </div>
                          )}
                          <div className="text-sm">{artwork.year}</div>
                          {artwork.view_count > 0 && (
                            <div className="text-xs text-gray-500">
                              瀏覽次數：{artwork.view_count}
                            </div>
                          )}
                        </div>
                      }
                      description={truncateText(artwork.description, 50)}
                      tags={tags}
                      link={`/art/${artwork.id}`}
                    />
                  )
                })}
              </CardGrid>
              
              {/* 分頁 */}
              {renderPagination()}
            </>
          )}
          
          {/* 無結果 */}
          {!isLoading && filteredArtworks.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg mb-4">
                沒有找到符合條件的作品
              </p>
              <Button variant="outline" onClick={clearFilters}>
                清除篩選條件
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SearchPage