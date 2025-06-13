import React, { useEffect, useRef } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './about.css'

const AboutPage = () => {
  const sectionRefs = useRef([])
  
  // 滾動動畫
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in')
        }
      })
    }, observerOptions)
    
    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })
    
    return () => {
      sectionRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [])
  
  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el)
    }
  }
  
  return (
    <Layout>
      <Seo 
        title="關於" 
        description="了解 NMANODEPT 藝術平台的理念與願景"
      />
      
      <div className="about-container">
        {/* Hero Section */}
        <section className="hero-section" ref={addToRefs}>
          <div className="hero-background">
            <div className="hero-gradient" />
            <div className="hero-pattern" />
          </div>
          
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-line">新沒系館</span>
              <span className="title-subtitle">NMANODEPT</span>
            </h1>
            <p className="hero-description">
              一個虛擬的「系館」——<br />
              因為我們沒有真正的系館。
            </p>

            <div className="hero-meta">
              <span>由學生發起</span>
              <span className="separator">·</span>
              <span>為新媒系學生的創作而生</span>
            </div>
          </div>
          <br /><br /><br />
          <div className="scroll-indicator">
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
              <rect x="1" y="1" width="22" height="38" rx="11" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="12" cy="12" r="4" fill="currentColor" className="scroll-dot"/>
            </svg>
          </div>
        </section>
        
        {/* Vision Section */}
        <section className="vision-section" ref={addToRefs}>
          <div className="section-header">
            <span className="section-number"></span>
            <h2 className="section-title">為什麼想做這個？</h2>
          </div>
          
          <div className="vision-grid">
            <div className="vision-card">

              <h3>社交短效</h3>
              <p>
                現在的社交短效沒辦法直接用「創作」認識別人，
                有了這個網站，就算錯過評圖也可以先看作品、
                再決定要不要認識。(?)
              </p>
            </div>
            
            <div className="vision-card">

              <h3>交流短效</h3>
              <p>
                系上有直屬活動、迎新派對，但偏重社交。
                沒有長期的、可累積的空間去了解彼此的作品與脈絡。
              </p>
            </div>
            
            <div className="vision-card">

              <h3>保存形式難維持</h3>
              <p>
                系刊難度高、需長期編輯人力；
                表單紀錄雖快，但不易瀏覽。
              </p>
            </div>
          </div>
        </section>
        
        {/* Purpose Section */}
        <section className="purpose-section" ref={addToRefs}>
          <div className="purpose-content">
            <div className="section-header">
              <span className="section-number"></span>
              <h2 className="section-title">這個網站的目的是？</h2>
            </div>
            
            <div className="purpose-statement">
              <p className="lead">
                讓作品、作者被看到、被記錄，分享與對話。
              </p>
            </div>
            
            <div className="purpose-list">
              <div className="purpose-item">
                <span className="item-number">01</span>
                <p>讓學弟妹能夠參考歷屆作品與媒材應用</p>
              </div>
              <div className="purpose-item">
                <span className="item-number">02</span>
                <p>讓其他系的朋友能知道我們在做什麼</p>
              </div>
              <div className="purpose-item">
                <span className="item-number">03</span>
                <p>讓跨領域合作有機會發芽</p>
              </div>
              <div className="purpose-item">
                <span className="item-number">04</span>
                <p>讓你在深夜失眠時，還能看看同學曾經的作品找一下靈感</p>
              </div>
                <div className="purpose-item">
                <span className="item-number">05</span>
                <p>當你離開新媒的時候，可以懷念你的曾經</p>
              </div>

            </div>
          </div>
          
          <div className="purpose-visual">
            <div className="visual-element">
              <div className="rotating-square" />
              <div className="rotating-square delay-1" />
              <div className="rotating-square delay-2" />
            </div>
          </div>
        </section>
        
        {/* Name Section */}
        <section className="name-section" ref={addToRefs}>
          <div className="name-reveal">
            <h2 className="name-question">「新沒系館」是什麼？</h2>
            <div className="name-answer">
              <span className="answer-text">是諧音梗。</span>
              <span className="answer-emoji">✨</span>
            </div>
          </div>
        </section>
        
        {/* Guidelines Section */}
        <section className="guidelines-section" ref={addToRefs}>
          <div className="section-header center">
            <span className="section-number"></span>
            <h2 className="section-title">投稿指南</h2>
          </div>
          
          <div className="guidelines-container">
            <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">1</span>
                <h3>原創內容</h3>
              </div>
              <p>作品必須為原創內容</p>
            </div>
            
            <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">2</span>
                <h3>圖片格式</h3>
              </div>
              <p>支援 JPG、PNG、GIF，單張不超過 5MB</p>
            </div>
            
            <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">3</span>
                <h3>作品資訊</h3>
              </div>
              <p>請提供標題、創作年份、簡短說明</p>
            </div>
            
            <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">4</span>
                <h3>標籤系統</h3>
              </div>
              <p>可選擇適當的標籤，方便搜尋</p>
            </div>
            
            <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">5</span>
                <h3>審核流程</h3>
              </div>
              <p>提交後將進入審核，通常 2-3 工作日內完成</p>
            </div>

                        <div className="guideline-card">
              <div className="guideline-header">
                <span className="guideline-number">6</span>
                <h3>我想不到了</h3>
              </div>
              <p>快來加入新沒系館，有你、新媒將更壯大（搞不好就真的有系館了）</p>
            </div>

          </div>



        </section>
        
        {/* CTA Section */}
        <section className="cta-section" ref={addToRefs}>
          <div className="cta-background">
            <div className="cta-gradient" />
          </div>
          
          <div className="cta-content">
            <h2>我們都期待你的創作被分享</h2>
            <p>加入我們 ~ 讓更多人欣賞你的作品</p>
            
            <div className="cta-buttons">
              <Link to="/submit">
                <Button variant="primary" size="lg">
                  <span>立即投稿</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 10H14M14 10L10 6M14 10L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="lg">
                  瀏覽作品
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="about-footer" ref={addToRefs}>
          <div className="footer-emailcontent">
            <div className="footer-info">
              <br />
              <p>如有任何問題或建議，歡迎聯繫我們</p>
              <a href="mailto:contact@nmanodept.com" className="footer-email">
                contact@nmanodept.com
              </a>
            </div>
            
            <div className="footer-decoration">
              <div className="decoration-line" />
              <div className="decoration-dot" />
              <div className="decoration-line" />
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  )
}

export default AboutPage