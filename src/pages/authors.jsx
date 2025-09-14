import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './authors.css'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    setLoading(true)
    setError('')
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 嘗試多個端點
      const endpoints = [
        '/authors',
        '/authors-with-counts',
        '/api/authors',
        '/api/authors-with-counts'
      ]
      
      let authorsData = []
      let lastError = null
      
      for (const endpoint of endpoints) {
        try {
          console.log(`嘗試端點: ${apiUrl}${endpoint}`)
          const response = await fetch(`${apiUrl}${endpoint}`)
          console.log(`端點 ${endpoint} 響應狀態:`, response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`端點 ${endpoint} 數據:`, data)
            
            // 確保數據是數組
            const authorsArray = Array.isArray(data) ? data : []
            console.log(`端點 ${endpoint} 作者數量:`, authorsArray.length)
            
            if (authorsArray.length > 0) {
              authorsData = authorsArray
              console.log(`成功從端點 ${endpoint} 獲取 ${authorsArray.length} 位作者`)
              break
            }
          } else {
            console.log(`端點 ${endpoint} 失敗:`, response.status, response.statusText)
            lastError = `端點 ${endpoint}: ${response.status} ${response.statusText}`
          }
        } catch (endpointError) {
          console.log(`端點 ${endpoint} 錯誤:`, endpointError.message)
          lastError = `端點 ${endpoint}: ${endpointError.message}`
        }
      }
      
      if (authorsData.length > 0) {
        // 如果作者數據沒有 artwork_count，嘗試從作品數據計算
        if (!authorsData[0].artwork_count) {
          console.log('作者數據沒有 artwork_count，嘗試從作品數據計算...')
          try {
            const artworksResponse = await fetch(`${apiUrl}/artworks`)
            if (artworksResponse.ok) {
              const artworks = await artworksResponse.json()
              console.log(`獲取到 ${artworks.length} 件作品`)
              
              // 為每個作者計算作品數量
              const authorsWithCounts = authorsData.map(author => {
                const count = artworks.filter(artwork => {
                  const authors = Array.isArray(artwork.authors) ? artwork.authors :
                                 typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : []
                  return authors.includes(author.name)
                }).length
                
                return {
                  ...author,
                  artwork_count: count
                }
              })
              
              console.log('計算後的作品數量:', authorsWithCounts.map(a => `${a.name}: ${a.artwork_count}`))
              setAuthors(authorsWithCounts)
            } else {
              console.log('無法獲取作品數據，使用原始作者數據')
              setAuthors(authorsData)
            }
          } catch (artworkError) {
            console.log('獲取作品數據失敗，使用原始作者數據:', artworkError.message)
            setAuthors(authorsData)
          }
        } else {
          setAuthors(authorsData)
        }
      } else {
        setError(`所有端點都失敗了。最後錯誤: ${lastError}`)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      setError(`載入失敗: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 依作品數量分類
  const featuredAuthors = filteredAuthors.filter(a => a.artwork_count >= 5)
  const activeAuthors = filteredAuthors.filter(a => a.artwork_count >= 2 && a.artwork_count < 5)
  const allAuthors = filteredAuthors

  if (loading) return <Layout><Loading /></Layout>

  if (error) {
    return (
      <Layout>
        <Seo title="作者" description="瀏覽所有創作者" />
        <div className="authors-container">
          <div className="error-container">
            <h2>載入失敗</h2>
            <p>{error}</p>
            <button onClick={fetchAuthors} className="btn btn-primary">
              重試
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo title="作者" description="瀏覽所有創作者" />
      <div className="authors-container">
        <div className="authors-header">
          <h1>作者</h1>
          <p className="stats">共 {authors.length} 位創作者，{authors.reduce((sum, a) => sum + (a.artwork_count || 0), 0)} 件作品</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="搜尋作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {searchTerm === '' && featuredAuthors.length > 0 && (
          <section className="authors-section">
            <h2>特色創作者</h2>
            <div className="authors-grid featured">
              {featuredAuthors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/author/${encodeURIComponent(author.name)}/`}
                  className="author-card featured"
                >
                  <div className="author-avatar">
                    {author.name.charAt(0)}
                  </div>
                  <h3>{author.name}</h3>
                  <p className="artwork-count">共 {author.artwork_count} 件作品</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {searchTerm === '' && activeAuthors.length > 0 && (
          <section className="authors-section">
            <h2>活躍創作者</h2>
            <div className="authors-grid">
              {activeAuthors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/author/${encodeURIComponent(author.name)}/`}
                  className="author-card"
                >
                  <div className="author-avatar">
                    {author.name.charAt(0)}
                  </div>
                  <h3>{author.name}</h3>
                  <p className="artwork-count">共 {author.artwork_count} 件作品</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="authors-section">
          <h2>{searchTerm ? '搜尋結果' : '所有創作者'}</h2>
          {allAuthors.length === 0 ? (
            <div className="empty-state">
              <p>沒有找到作者</p>
              <p>調試信息: authors.length = {authors.length}, filteredAuthors.length = {filteredAuthors.length}</p>
            </div>
          ) : (
            <div className="authors-grid all">
              {allAuthors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/author/${encodeURIComponent(author.name)}/`}
                  className="author-card compact"
                >
                  <span className="author-name">{author.name}</span>
                  <span className="artwork-count">共 {author.artwork_count || 0} 件作品</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default AuthorsPage