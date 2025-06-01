import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'

const NotFoundPage = () => {
  return (
    <Layout>
      <Seo 
        title="頁面不存在" 
        description="找不到您要尋找的頁面"
      />
      
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          {/* 404 插圖 */}
          <div className="mb-8">
            <svg
              className="mx-auto h-32 w-32 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          {/* 錯誤訊息 */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            糟糕！找不到頁面
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            您要尋找的頁面可能已經移動、刪除，或從未存在過。
            不過別擔心，您可以：
          </p>
          
          {/* 行動按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button>
                返回首頁
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline">
                搜尋作品
              </Button>
            </Link>
          </div>
          
          {/* 快速連結 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              或許您在尋找：
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link 
                to="/about" 
                className="text-blue-600 hover:underline"
              >
                關於我們
              </Link>
              <span className="text-gray-400">·</span>
              <Link 
                to="/submit" 
                className="text-blue-600 hover:underline"
              >
                作品投稿
              </Link>
              <span className="text-gray-400">·</span>
              <Link 
                to="/search" 
                className="text-blue-600 hover:underline"
              >
                搜尋作品
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default NotFoundPage