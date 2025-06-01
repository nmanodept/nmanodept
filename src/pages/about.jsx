import React from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import { Link } from 'gatsby'

const AboutPage = () => {
  return (
    <Layout>
      <Seo 
        title="關於我們" 
        description="了解 nmanodept 藝術平台的理念與願景"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 主標題區 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            關於 nmanodept
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            一個專注於當代藝術與建築視覺的創作平台
          </p>
        </header>
        
        {/* 內容區塊 */}
        <div className="prose prose-lg max-w-none space-y-8">
          {/* 平台介紹 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              平台理念
            </h2>
            <p className="text-gray-700 leading-relaxed">
              nmanodept 致力於打造一個開放、多元的藝術展示空間。我們相信每個創作者都有獨特的視角，
              透過這個平台，讓更多優秀的作品被看見，促進創作者之間的交流與對話。
            </p>
          </section>
          
          {/* 功能特色 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              平台特色
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🎨 開放投稿</h3>
                <p className="text-gray-700">
                  任何創作者都可以提交作品，經過審核後即可在平台上展示。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🏗️ 3D 視覺化</h3>
                <p className="text-gray-700">
                  運用 Three.js 技術，將作品以獨特的 3D 建築立面形式呈現。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🔍 智能搜尋</h3>
                <p className="text-gray-700">
                  透過標籤系統和文字搜尋，輕鬆找到感興趣的作品。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">👥 作者專頁</h3>
                <p className="text-gray-700">
                  每位創作者都有專屬頁面，完整展示所有作品集。
                </p>
              </div>
            </div>
          </section>
          
          {/* 投稿指南 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              投稿指南
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>作品必須為原創內容</li>
              <li>圖片格式支援 JPG、PNG、GIF，單張不超過 5MB</li>
              <li>請提供作品的基本資訊：標題、創作年份、簡短說明</li>
              <li>可選擇適當的標籤，方便其他使用者搜尋</li>
              <li>提交後將進入審核流程，通常在 2-3 個工作日內完成</li>
            </ol>
          </section>
          
          {/* CTA 區塊 */}
          <section className="bg-gray-900 text-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold mb-4">
              準備好分享你的創作了嗎？
            </h2>
            <p className="mb-6 text-gray-300">
              加入我們的創作者社群，讓更多人欣賞你的作品
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/submit">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  立即投稿
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-gray-800">
                  瀏覽作品
                </Button>
              </Link>
            </div>
          </section>
          
          {/* 聯絡資訊 */}
          <section className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              如有任何問題或建議，歡迎聯繫我們：
              <a href="mailto:contact@nmanodept.com" className="text-blue-600 hover:underline ml-2">
                contact@nmanodept.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  )
}

export default AboutPage