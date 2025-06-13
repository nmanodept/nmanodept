import React, { useEffect, useRef } from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './about.css' // 沿用同樣的 about.css

const ContactPage = () => {
  const sectionRefs = useRef([])

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
        title="聯絡我們"
        description="歡迎透過 email 或 IG 聯繫新沒系館 NMANODEPT 團隊"
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
              <span className="title-line">聯絡我們</span>
              <span className="title-subtitle">Contact NMANODEPT</span>
            </h1>
            <p className="hero-description">
              有任何問題、合作邀約、意見建議，<br />
              都歡迎聯絡我們。
                <br />
            </p>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="vision-section" ref={addToRefs}>

          <div className="vision-grid" style={{maxWidth: 440, margin: '0 auto', gap: 36}}>
            <div className="vision-card" style={{alignItems:'flex-start'}}>
              <h3>Email</h3>
              <a
                href="mailto:contact@nmanodept.com"
                className="footer-email"
                style={{fontSize: '1.2em'}}
              >
                contact@nmanodept.com
              </a>
            </div>
            <div className="vision-card" style={{alignItems:'flex-start'}}>
              <h3>Instagram</h3>
              <a
                href="https://instagram.com/nma.no.dept"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-email"
                style={{fontSize: '1.2em'}}
              >
                IG: @nma.no.dept
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section" ref={addToRefs}>
          <div className="cta-background">
            <div className="cta-gradient" />
          </div>
          <div className="cta-content">
            <h2>你的回饋對我們很重要！</h2>
            <p>也歡迎投稿作品，讓我們一起累積這個系館。</p>
            <div className="cta-buttons">
              <a href="mailto:contact@nmanodept.com">
                <Button variant="primary" size="lg">
                  <span>寫信給我們</span>
                </Button>
              </a>
              <a href="https://instagram.com/nma.no.dept" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="lg">
                  <span>追蹤 IG</span>
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="about-footer" ref={addToRefs}>
          <div className="footer-emailcontent">
            <div className="footer-info">
              <br />
              <p>新沒系館 NMANODEPT</p>
              <a href="mailto:contact@nmanodept.com" className="footer-email">
                contact@nmanodept.com
              </a>
              <br />
              <a
                href="https://www.instagram.com/nma.no.dept/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-email"
                style={{marginTop:'0.5em'}}
              >
                IG: @nma.no.dept
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

export default ContactPage
