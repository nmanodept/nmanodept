import React, { useState, useEffect } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Card, { CardGrid } from '../components/common/Card'
import Loading, { SkeletonGrid } from '../components/common/Loading'

const SearchPage = ({ location }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  
  // 可用標籤（暫時寫死，之後從 API 獲取）
  const availableTags = [
    '繪畫', '攝影', '雕塑', '數位藝術', '建築',
    '裝置藝術', '版畫', '水彩', '油畫', '素描',
    '當代', '抽象', '寫實', '極簡', '概念藝術'
  ]
  
  // 從 URL 參數讀取搜尋條件
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    const tags = params.get('tags')
    
    if (q) {
      setSearchTerm(q)
      handleSearch(q, tags ? tags.split(',') : [])
    }
  }, [location.search])
  
  // 執行搜尋
  const handleSearch = async (term = searchTerm, tags = selectedTags) => {
    setIsLoading(true)
    setHasSearched(true)
    
    // 更新 URL
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (tags.length > 0) params.set('tags', tags.join(','))
    navigate(`/search?${params.toString()}`, { replace: true })
    
    // 模擬 API 呼叫
    setTimeout(() => {
      // 模擬搜尋結果
      const mockResults = [
        {
          id: '1',
          title: '都市光影',
          author: '張藝術',
          year: 2024,
          image: 'https://via.placeholder.com/400x300',
          tags: ['攝影', '當代']
        },
        {
          id: '2',
          title: '抽象構成 No.7',
          author: '李創作',
          year: 2023,
          image: 'https://via.placeholder.com/400x300',
          tags: ['繪畫', '抽象']
        },
        {
          id: '3',
          title: '空間對話',
          author: '王設計',
          year: 2024,
          image: 'https://via.placeholder.com/400x300',
          tags: ['建築', '極簡']
        }
      ]
      
      // 簡單的過濾邏輯
      const filtered = mockResults.filter(item => {
        const matchTerm = !term || 
          item.title.toLowerCase().includes(term.toLowerCase()) ||
          item.author.toLowerCase().includes(term.toLowerCase())
        
        const matchTags = tags.length === 0 || 
          tags.some(tag => item.tags.includes(tag))
        
        return matchTerm && matchTags
      })
      
      setResults(filtered)
      setIsLoading(false)
    }, 1000)
  }
  
  // 標籤切換
  const toggleTag = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    
    setSelectedTags(newTags)
    if (hasSearched) {
      handleSearch(searchTerm, newTags)
    }
  }
  
  // 清除搜尋
  const clearSearch = () => {
    setSearchTerm('')
    setSelectedTags([])
    setResults([])
    setHasSearched(false)
    navigate('/search')
  }
  
  return (
    <Layout>
      <Seo 
        title="搜尋作品" 
        description="搜尋 nmanodept 平台上的藝術作品"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋表單區 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            搜尋作品
          </h1>
          
          {/* 搜尋輸入框 */}
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="flex gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋作品標題、作者..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button type="submit" size="lg">
                搜尋
              </Button>
            </div>
          </form>
          
          {/* 標籤選擇區 */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              標籤篩選：
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${selectedTags.includes(tag)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* 清除按鈕 */}
          {(searchTerm || selectedTags.length > 0) && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                清除所有條件
              </Button>
            </div>
          )}
        </div>
        
        {/* 搜尋結果區 */}
        <div>
          {/* 載入中 */}
          {isLoading && (
            <SkeletonGrid count={6} columns={3} />
          )}
          
          {/* 搜尋結果 */}
          {!isLoading && hasSearched && (
            <>
              {/* 結果統計 */}
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  {results.length > 0 ? (
                    <>找到 <span className="font-semibold">{results.length}</span> 件作品</>
                  ) : (
                    '沒有找到符合條件的作品'
                  )}
                </p>
              </div>
              
              {/* 結果列表 */}
              {results.length > 0 && (
                <CardGrid columns={3}>
                  {results.map((item) => (
                    <Card
                      key={item.id}
                      image={item.image}
                      title={item.title}
                      subtitle={`${item.author} · ${item.year}`}
                      tags={item.tags}
                      link={`/art/${item.id}`}
                    />
                  ))}
                </CardGrid>
              )}
              
              {/* 無結果提示 */}
              {results.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
                  </svg>
                  <p className="text-gray-500 mb-4">
                    找不到符合的作品，試試其他關鍵字？
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    重新搜尋
                  </Button>
                </div>
              )}
            </>
          )}
          
          {/* 初始狀態 */}
          {!isLoading && !hasSearched && (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 text-lg">
                輸入關鍵字或選擇標籤開始搜尋
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SearchPage