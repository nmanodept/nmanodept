// /src/components/common/Layout/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import './Layout.css'

const Layout = ({ children }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const navItems = [
    { path: '/', label: '首頁' },
    { path: '/about', label: '關於' },
    { path: '/authors', label: '作者' },
    { path: '/search', label: '搜尋' },
    { path: '/submit', label: '投稿' },
    { path: '/author-profile', label: '資料' }
  ]
  
  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className={`layout-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Logo" className="logo-img" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="nav-link"
                activeClassName="nav-link-active"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <nav className={`nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Main Content */}
      <main className="layout-main">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="layout-footer">
        <div className="footer-inner">
          <div className="footer-content">
            <div className="footer-section">
              <h4>關於</h4>
              <p>極簡主義藝術平台</p>
            </div>
            
            <div className="footer-section">
              <h4>連結</h4>
              <div className="footer-links">
                <Link to="/about">關於我們</Link>
                <Link to="/submit">作品投稿</Link>
                <Link to="/contact">聯絡我們</Link>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>社群</h4>
              <div className="social-links">
                <a href="#" aria-label="Instagram">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout