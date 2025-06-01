// src/pages/index.jsx
import React from "react"
import Layout from "../components/common/Layout/Layout"

const IndexPage = () => {
  return (
    <Layout title="首頁" description="探索藝術作品的數位展示空間">
      <div className="py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Gallery NmanoDept
        </h1>
        
        {/* 暫時的佔位內容，之後會替換成 Three.js 3D 牆面 */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            這裡將會是 Three.js 3D 建築立面展示
          </p>
          <p className="text-sm text-gray-500">
            由多張縮圖拼成的互動式三維展示牆
          </p>
        </div>
        
        {/* 快速連結 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2">探索作品</h3>
            <p className="text-gray-600 text-sm">
              瀏覽所有藝術作品，使用標籤和關鍵字搜尋
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2">投稿作品</h3>
            <p className="text-gray-600 text-sm">
              分享你的創作，加入我們的藝術社群
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2">關於我們</h3>
            <p className="text-gray-600 text-sm">
              了解更多關於這個平台的故事和理念
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage