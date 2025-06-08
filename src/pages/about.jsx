import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './about.css'

const AboutPage = () => {
  return (
    <Layout>
      <Seo 
        title="關於" 
        description="了解 nmanodept 藝術平台的理念與願景"
      />
      
      <div className="about-container">
        {/* 主標題 */}
        <header className="about-header">
          <h1 className="about-title">關於</h1>
        </header>
        
        {/* 宣言區塊 */}
        <div className="manifesto-section">
          <div className="manifesto-number">01</div>
          <div className="manifesto-content">
            <h2>開放的創作平台</h2>
            <p>
              nmanodept 致力於打造一個開放、多元的藝術展示空間。
              我們相信每個創作者都有獨特的視角，透過這個平台，
              讓更多優秀的作品被看見，促進創作者之間的交流與對話。
            </p>
          </div>
        </div>

        <div className="manifesto-section">
          <div className="manifesto-number">02</div>
          <div className="manifesto-content">
            <h2>極簡的視覺呈現</h2>
            <p>
              運用 Three.js 技術，將作品以獨特的 3D 建築立面形式呈現。
              我們追求極簡主義美學，透過精準的留白與細緻的細節，
              創造出純粹且富有詩意的視覺體驗。
            </p>
          </div>
        </div>

        <div className="manifesto-section">
          <div className="manifesto-number">03</div>
          <div className="manifesto-content">
            <h2>創作者優先</h2>
            <p>
              每位創作者都有專屬頁面，完整展示所有作品集。
              我們提供開放投稿機制，任何創作者都可以提交作品，
              經過審核後即可在平台上展示，讓創意不受限制。
            </p>
          </div>
        </div>

        <div className="manifesto-section">
          <div className="manifesto-number">04</div>
          <div className="manifesto-content">
            <h2>智能化的探索</h2>
            <p>
              透過標籤系統和文字搜尋，輕鬆找到感興趣的作品。
              我們相信好的內容需要好的發現機制，
              讓每一件作品都能找到欣賞它的觀眾。
            </p>
          </div>
        </div>

        {/* 投稿指南 */}
        <section className="guidelines-section">
          <h2 className="section-title">投稿指南</h2>
          <div className="guidelines-grid">
            <div className="guideline-item">
              <div className="guideline-number">1</div>
              <p>作品必須為原創內容</p>
            </div>
            <div className="guideline-item">
              <div className="guideline-number">2</div>
              <p>圖片格式支援 JPG、PNG、GIF，單張不超過 5MB</p>
            </div>
            <div className="guideline-item">
              <div className="guideline-number">3</div>
              <p>請提供作品的基本資訊：標題、創作年份、簡短說明</p>
            </div>
            <div className="guideline-item">
              <div className="guideline-number">4</div>
              <p>可選擇適當的標籤，方便其他使用者搜尋</p>
            </div>
            <div className="guideline-item">
              <div className="guideline-number">5</div>
              <p>提交後將進入審核流程，通常在 2-3 個工作日內完成</p>
            </div>
          </div>
        </section>
        
        {/* CTA 區塊 */}
        <section className="cta-section">
          <h2>準備好分享你的創作了嗎？</h2>
          <p>加入我們的創作者社群，讓更多人欣賞你的作品</p>
          <div className="cta-buttons">
            <Link to="/submit">
              <Button variant="primary">立即投稿</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost">瀏覽作品</Button>
            </Link>
          </div>
        </section>
        
        {/* 聯絡資訊 */}
        <footer className="about-footer">
          <p>
            如有任何問題或建議，歡迎聯繫我們：
            <a href="mailto:contact@nmanodept.com">contact@nmanodept.com</a>
          </p>
        </footer>
      </div>
    </Layout>
  )
}

export default AboutPage