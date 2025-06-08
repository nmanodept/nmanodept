import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './404.css'

const NotFoundPage = () => {
  return (
    <Layout>
      <Seo 
        title="頁面不存在" 
        description="找不到您要尋找的頁面"
      />
      
      <div className="not-found-container">
        <div className="not-found-content">
          {/* 404 數字 */}
          <h1 className="error-code">404</h1>
          
          {/* 錯誤訊息 */}
          <h2 className="error-title">頁面不存在</h2>
          <p className="error-message">
            您要尋找的頁面可能已經移動或刪除
          </p>
          
          {/* 行動按鈕 */}
          <div className="error-actions">
            <Link to="/">
              <Button>返回首頁</Button>
            </Link>
            <Link to="/search">
              <Button variant="ghost">搜尋作品</Button>
            </Link>
          </div>
          
          {/* 快速連結 */}
          <div className="quick-links">
            <p className="links-title">或許您在尋找</p>
            <div className="links-list">
              <Link to="/about">關於我們</Link>
              <span className="separator">·</span>
              <Link to="/submit">作品投稿</Link>
              <span className="separator">·</span>
              <Link to="/authors">作者列表</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default NotFoundPage