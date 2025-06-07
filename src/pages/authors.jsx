// src/pages/authors.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import { UserCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/authors-with-counts`)
      
      if (response.ok) {
        const data = await response.json()
        setAuthors(data)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    } finally {
      setLoading(false)
    }
  }

  // 過濾作者
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 按作品數量分組
  const groupAuthors = (authors) => {
    const sorted = [...authors].sort((a, b) => b.artwork_count - a.artwork_count)
    const groups = {
      featured: sorted.filter(a => a.artwork_count >= 5),
      active: sorted.filter(a => a.artwork_count >= 2 && a.artwork_count < 5),
      emerging: sorted.filter(a => a.artwork_count === 1)
    }
    return groups
  }

  const groupedAuthors = groupAuthors(filteredAuthors)

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loading type="spinner" size="lg" text="載入作者資料中..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo 
        title="所有作者" 
        description="瀏覽 nmanodept 平台上所有創作者"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">創作者名錄</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            探索平台上的所有創作者，點擊作者名稱查看他們的作品集
          </p>
        </div>

        {/* 搜尋框 */}
        <div className="max-w-md mx-auto mb-12">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋作者..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {authors.length}
            </div>
            <p className="text-gray-600">位創作者</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {authors.reduce((sum, author) => sum + author.artwork_count, 0)}
            </div>
            <p className="text-gray-600">件作品</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {groupedAuthors.featured.length}
            </div>
            <p className="text-gray-600">位活躍創作者</p>
          </div>
        </div>

        {/* 作者列表 */}
        {filteredAuthors.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              沒有找到符合條件的作者
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 特色作者（5件作品以上） */}
            {groupedAuthors.featured.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-2 h-8 bg-orange-500 mr-3"></span>
                  特色創作者
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedAuthors.featured.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {author.has_profile ? (
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                              <UserCircleIcon className="w-10 h-10 text-orange-600" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserCircleIcon className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {author.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="w-4 h-4" />
                              {author.artwork_count} 件作品
                            </span>
                            {author.has_profile && (
                              <span className="text-green-600">已完善資料</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 活躍作者（2-4件作品） */}
            {groupedAuthors.active.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-2 h-8 bg-blue-500 mr-3"></span>
                  活躍創作者
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {groupedAuthors.active.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3">
                        {author.has_profile ? (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <UserCircleIcon className="w-8 h-8 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                            <UserCircleIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {author.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {author.artwork_count} 件作品
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 新進作者（1件作品） */}
            {groupedAuthors.emerging.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-2 h-8 bg-green-500 mr-3"></span>
                  新進創作者
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-wrap gap-3">
                    {groupedAuthors.emerging.map(author => (
                      <Link
                        key={author.id}
                        to={`/author/${encodeURIComponent(author.name)}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {author.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuthorsPage