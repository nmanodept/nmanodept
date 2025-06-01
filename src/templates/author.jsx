// src/templates/author.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card, { CardGrid } from '../components/common/Card'
import Loading, { SkeletonGrid } from '../components/common/Loading'
import Button from '../components/common/Button'

const AuthorTemplate = ({ pageContext }) => {
  const { author } = pageContext
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAuthorArtworks()
  }, [author])

  const fetchAuthorArtworks = async () => {
    try {
      // 獲取所有作品
      const response = await fetch(`${process.env.GATSBY_API_URL}/artworks`)
      if (!response.ok) throw new Error('無法載入作品')
      
      const allArtworks = await response.json()
      
      // 篩選該作者的作品
      const authorArtworks = allArtworks.filter(
        artwork => artwork.author === decodeURIComponent(author)
      )
      
      // 按年份排序（舊到新）
      authorArtworks.sort((a, b) => a.year - b.year)
      
      setArtworks(authorArtworks)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 按年份分組作品
  const groupByYear = (artworks) => {
    const grouped = {}
    artworks.forEach(artwork => {
      const year = artwork.year
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(artwork)
    })
    return grouped
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SkeletonGrid count={6} columns={3} />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link to="/search" className="text-blue-600 hover:underline">
              瀏覽所有作品
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const groupedArtworks = groupByYear(artworks)
  const years = Object.keys(groupedArtworks).sort((a, b) => a - b)

  return (
    <Layout>
      <Seo 
        title={`${decodeURIComponent(author)} 的作品`}
        description={`瀏覽 ${decodeURIComponent(author)} 的所有創作`}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 作者資訊標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {decodeURIComponent(author)}
          </h1>
          <p className="text-gray-600">
            共 {artworks.length} 件作品
          </p>
        </div>
        
        {artworks.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg mb-4">
              目前沒有此作者的作品
            </p>
            <Link to="/search">
              <Button variant="outline">
                瀏覽其他作品
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {/* 時間線展示 */}
            {years.map((year, yearIndex) => (
              <div key={year} className="relative">
                {/* 年份標記 */}
                <div className="flex items-center mb-8">
                  {/* 時間線 */}
                  {yearIndex !== 0 && (
                    <div className="absolute left-8 -top-16 w-0.5 h-16 bg-gray-300" />
                  )}
                  {yearIndex !== years.length - 1 && (
                    <div className="absolute left-8 bottom-0 w-0.5 h-full bg-gray-300" />
                  )}
                  
                  {/* 年份圓點 */}
                  <div className="relative z-10 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {year}
                  </div>
                  
                  <div className="ml-6 flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {year} 年作品
                    </h2>
                  </div>
                </div>
                
                {/* 該年份的作品 */}
                <div className="pl-24">
                  <CardGrid columns={3}>
                    {groupedArtworks[year].map(artwork => {
                      const tags = typeof artwork.tags === 'string' 
                        ? JSON.parse(artwork.tags) 
                        : artwork.tags || []
                      
                      return (
                        <Card
                          key={artwork.id}
                          image={artwork.main_image_url}
                          title={artwork.title}
                          subtitle={`${artwork.project_year} 級 · ${artwork.project_semester}`}
                          description={artwork.description.substring(0, 50) + '...'}
                          tags={tags}
                          link={`/art/${artwork.id}`}
                        />
                      )
                    })}
                  </CardGrid>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 返回搜尋頁 */}
        <div className="text-center mt-16">
          <Link to="/search">
            <Button variant="outline">
              瀏覽更多作品
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

export default AuthorTemplate