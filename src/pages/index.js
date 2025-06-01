import React, { useState, useEffect } from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card, { CardGrid } from '../components/common/Card'
import Loading, { SkeletonGrid } from '../components/common/Loading'

const IndexPage = () => {
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtworks()
  }, [])

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`${process.env.GATSBY_API_URL}/artworks`)
      if (response.ok) {
        const data = await response.json()
        setArtworks(data)
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Seo title="首頁" description="探索藝術作品的數位展示空間" />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Gallery NmanoDept
        </h1>
        
        {/* 作品展示區 */}
        {loading ? (
          <SkeletonGrid count={6} columns={3} />
        ) : artworks.length > 0 ? (
          <CardGrid columns={3}>
            {artworks.map((artwork) => (
              <Card
                key={artwork.id}
                image={artwork.main_image_url}
                title={artwork.title}
                subtitle={`${artwork.author} · ${artwork.year}`}
                description={artwork.description}
                tags={JSON.parse(artwork.tags || '[]')}
                link={`/art/${artwork.id}`}
              />
            ))}
          </CardGrid>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">
              尚無作品展示
            </p>
            <p className="text-sm text-gray-500">
              請先到 D1 console 將某個作品的 status 改為 'approved'
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default IndexPage