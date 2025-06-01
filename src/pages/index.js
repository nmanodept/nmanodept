// src/pages/index.js
import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'

const IndexPage = () => {
  return (
    <Layout>
      <Seo title="首頁" description="探索藝術作品的數位展示空間" />
      
      <div className="min-h-screen">
        {/* Three.js 預留區域 */}
        <div className="relative w-full h-[80vh] bg-gray-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-4">nmanodept</h1>
              <p className="text-xl mb-8 text-gray-300">
                數位藝術作品展示平台
              </p>
              <p className="text-sm text-gray-400 mb-8">
                [ Three.js 3D 作品牆開發中 ]
              </p>
              
              {/* 快速導航 */}
              <div className="flex gap-4 justify-center">
                <Link to="/search">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                    瀏覽作品
                  </Button>
                </Link>
                <Link to="/submit">
                  <Button className="bg-white text-gray-900 hover:bg-gray-100">
                    投稿作品
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* 未來 Three.js 將渲染在這裡 */}
          <div id="three-container" className="absolute inset-0" />
        </div>
        
        {/* 簡介區塊 */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">開放投稿</h3>
              <p className="text-gray-600">
                分享你的創作，讓更多人看見你的作品
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3D 展示</h3>
              <p className="text-gray-600">
                獨特的三維建築立面展示你的作品
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">智能搜尋</h3>
              <p className="text-gray-600">
                透過標籤和關鍵字快速找到感興趣的作品
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage