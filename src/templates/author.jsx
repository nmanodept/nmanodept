// src/templates/author.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card, { CardGrid } from '../components/common/Card'
import { SkeletonGrid } from '../components/common/Loading'
import Button from '../components/common/Button'
import { 
  UserCircleIcon,
  LinkIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { 
  FaInstagram, 
  FaGithub, 
  FaBehance, 
  FaDribbble,
  FaLinkedin
} from 'react-icons/fa'

const AuthorTemplate = ({ pageContext }) => {
  const { author } = pageContext
  const [authorInfo, setAuthorInfo] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAuthorData = useCallback(async () => {
    try {
      // 獲取作者資訊（包含個人資料）
      const response = await fetch(`${process.env.GATSBY_API_URL}/author/${encodeURIComponent(author)}`)
      if (!response.ok) throw new Error('無法載入作者資料')
      
      const data = await response.json()
      setAuthorInfo(data)
      
      // 作品按年份分組
      const artworksWithDetails = await Promise.all(
        data.artworks.map(async (artwork) => {
          // 解析資料格式
          return {
            ...artwork,
            tags: typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : artwork.tags || [],
            authors: typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : artwork.authors || []
          }
        })
      )
      
      // 按年份排序（舊到新）
      artworksWithDetails.sort((a, b) => a.year - b.year)
      setArtworks(artworksWithDetails)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [author])

  useEffect(() => {
    fetchAuthorData()
  }, [fetchAuthorData])

  // 解析社群連結圖標
  const getSocialIcon = (url) => {
    if (!url) return <LinkIcon className="w-5 h-5" />
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram.com')) return <FaInstagram className="w-5 h-5" />
    if (urlLower.includes('github.com')) return <FaGithub className="w-5 h-5" />
    if (urlLower.includes('behance.net')) return <FaBehance className="w-5 h-5" />
    if (urlLower.includes('dribbble.com')) return <FaDribbble className="w-5 h-5" />
    if (urlLower.includes('linkedin.com')) return <FaLinkedin className="w-5 h-5" />
    if (urlLower.includes('@') && !urlLower.includes('http')) return <EnvelopeIcon className="w-5 h-5" />
    return <GlobeAltIcon className="w-5 h-5" />
  }

  // 取得社群平台名稱
  const getSocialPlatformName = (url) => {
    if (!url) return '連結'
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram.com')) return 'Instagram'
    if (urlLower.includes('github.com')) return 'GitHub'
    if (urlLower.includes('behance.net')) return 'Behance'
    if (urlLower.includes('dribbble.com')) return 'Dribbble'
    if (urlLower.includes('linkedin.com')) return 'LinkedIn'
    if (urlLower.includes('@') && !urlLower.includes('http')) return 'Email'
    return '網站'
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

  if (error || !authorInfo) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '找不到作者'}</p>
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
        description={authorInfo.bio || `瀏覽 ${decodeURIComponent(author)} 的所有創作`}
        image={authorInfo.avatar_url}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 作者資訊區 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* 頭像 */}
            <div className="flex-shrink-0">
              {authorInfo.avatar_url ? (
                <img 
                  src={authorInfo.avatar_url} 
                  alt={decodeURIComponent(author)}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* 作者資訊 */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {decodeURIComponent(author)}
              </h1>
              <p className="text-gray-600 mb-4">
                共 {artworks.length} 件作品
              </p>
              
              {/* 個人簡介 */}
              {authorInfo.bio ? (
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {authorInfo.bio}
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-500 italic">
                    尚未提供個人簡介
                  </p>
                </div>
              )}
              
              {/* 社交連結 */}
              {authorInfo.social_links && authorInfo.social_links.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {authorInfo.social_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.includes('@') && !link.includes('http') 
                        ? `mailto:${link}`
                        : link.includes('http') 
                        ? link 
                        : `https://${link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title={link}
                    >
                      {getSocialIcon(link)}
                      <span className="text-sm font-medium">
                        {getSocialPlatformName(link)}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 作品展示區 */}
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              作品時間線
            </h2>
            
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
                    <div className="relative z-10 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {year}
                    </div>
                    
                    <div className="ml-6 flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {year} 年作品（{groupedArtworks[year].length} 件）
                      </h3>
                    </div>
                  </div>
                  
                  {/* 該年份的作品 */}
                  <div className="pl-24">
                    <CardGrid columns={3}>
                      {groupedArtworks[year].map(artwork => {
                        const tags = artwork.tags || []
                        
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