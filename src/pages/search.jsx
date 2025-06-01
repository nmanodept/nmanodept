// src/pages/search.jsx
import React, { useState, useEffect } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Card, { CardGrid } from '../components/common/Card'
import Loading, { SkeletonGrid } from '../components/common/Loading'
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(false)
  const [allArtworks, setAllArtworks] = useState([])
  const [filteredArtworks, setFilteredArtworks] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  const [availableSemesters, setAvailableSemesters] = useState([])

  // 從 URL 參數讀取搜尋條件
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    const tags = params.get('tags') ? params.get('tags').split(',') : []
    const year = params.get('year') || ''
    const semester = params.get('semester') || ''
    const sort = params.get('sort') || 'newest'
    
    setSearchTerm(q)
    setSelectedTags(tags)
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSortBy(sort)
    
    // 如果有任何搜尋參數，展開篩選器
    if (tags.length > 0 || year || semester) {
      setShowFilters(true)
    }
  }, [location.search])

  // 初始載入所有作品
  useEffect(() => {
    fetchAllArtworks()
  }, [])

  // 當篩選條件改變時，更新結果
  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedTags, selectedYear, selectedSemester, sortBy, allArtworks])

  const fetchAllArtworks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.GATSBY_API_URL}/artworks`)
      if (response.ok) {
        const data = await response.json()
        setAllArtworks(data)
        
        // 提取所有可用的篩選選項
        const tags = new Set()
        const years = new Set()
        const semesters = new Set()
        
        data.forEach(artwork => {
          // 處理 tags
          const artworkTags = typeof artwork.tags === 'string' 
            ? JSON.parse(artwork.tags) 
            : artwork.tags || []
          artworkTags.forEach(tag => tags.add(tag))
          
          // 處理年度和學期
          if (artwork.project_year) years.add(artwork.project_year)
          if (artwork.project_semester) semesters.add(artwork.project_semester)
        })
        
        setAvailableTags(Array.from(tags).sort())
        setAvailableYears(Array.from(years).sort((a, b) => b - a))
        setAvailableSemesters(Array.from(semesters))
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allArtworks]
    
    // 文字搜尋（模糊搜尋標題、作者、描述）
    if (searchTerm) {
      filtered = filtered.filter(artwork => {
        const searchLower = searchTerm.toLowerCase()
        return (
          artwork.title.toLowerCase().includes(searchLower) ||
          artwork.author.toLowerCase().includes(searchLower) ||
          artwork.description.toLowerCase().includes(searchLower)
        )
      })
    }
    
    // Tag 篩選
    if (selectedTags.length > 0) {
      filtered = filtered.filter(artwork => {
        const artworkTags = typeof artwork.tags === 'string' 
          ? JSON.parse(artwork.tags) 
          : artwork.tags || []
        return selectedTags.some(tag => artworkTags.includes(tag))
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
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'random':
          return Math.random() - 0.5
        // 'popular' 需要有瀏覽次數等資料
        default:
          return 0
      }
    })
    
    setFilteredArtworks(filtered)
    
    // 更新 URL
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (selectedYear) params.set('year', selectedYear)
    if (selectedSemester) params.set('semester', selectedSemester)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search'
    navigate(newURL, { replace: true })
  }

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
    setSelectedYear('')
    setSelectedSemester('')
    setSortBy('newest')
    navigate('/search')
  }

  // 截斷文字
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text
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
            </button>
          </div>
          
          {/* 篩選器內容 */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 學年度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    學年度
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年級學期
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序方式
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">最新</option>
                    <option value="oldest">最舊</option>
                    <option value="random">隨機</option>
                    <option value="popular" disabled>熱門（即將推出）</option>
                  </select>
                </div>
                
                {/* 清除按鈕 */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    清除所有篩選
                  </Button>
                </div>
              </div>
              
              {/* Tag 選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  標籤篩選（可多選）
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-colors
                        ${selectedTags.includes(tag)
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 搜尋結果 */}
        <div>
          {/* 結果統計 */}
          <div className="mb-4 text-gray-600">
            找到 <span className="font-semibold text-gray-900">{filteredArtworks.length}</span> 件作品
          </div>
          
          {/* 載入中 */}
          {isLoading && <SkeletonGrid count={6} columns={3} />}
          
          {/* 作品卡片 */}
          {!isLoading && filteredArtworks.length > 0 && (
            <CardGrid columns={3}>
              {filteredArtworks.map(artwork => {
                const tags = typeof artwork.tags === 'string' 
                  ? JSON.parse(artwork.tags) 
                  : artwork.tags || []
                
                return (
                  <Card
                    key={artwork.id}
                    image={artwork.main_image_url}
                    title={artwork.title}
                    subtitle={`${artwork.author} · ${artwork.year}`}
                    description={truncateText(artwork.description, 50)}
                    tags={tags}
                    link={`/art/${artwork.id}`}
                  />
                )
              })}
            </CardGrid>
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