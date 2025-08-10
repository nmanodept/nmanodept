// /src/components/common/Layout/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import { useAuth } from '../../auth/AuthContext'
import './Layout.css'

const Layout = ({ children }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  
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
    { path: '/search', label: '搜尋' }
  ]

  const authItems = isAuthenticated ? [
    { path: '/profile', label: '個人資料' },
    { path: '/my-artworks', label: '我的作品' },
    { path: '/submit', label: '投稿' },
    { label: '登出', onClick: logout, isButton: true }
  ] : [
    { path: '/login', label: '登入' },
    { path: '/register', label: '註冊' }
  ]
  
  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className={`layout-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="logo">
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
            {/* Auth Navigation */}
            <div className="auth-nav">
              {authItems.map((item, index) => (
                item.isButton ? (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="nav-link auth-button"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.path}
                    className="nav-link"
                    activeClassName="nav-link-active"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
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
        {/* Mobile Auth Navigation */}
        {authItems.map((item, index) => (
          item.isButton ? (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                setMobileMenuOpen(false)
              }}
              className="mobile-nav-link auth-button"
            >
              {item.label}
            </button>
          ) : (
            <Link
              key={index}
              to={item.path}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          )
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
               <h4>主頁</h4>
              <div className="footer-links">
              <Link to="/">新沒系館</Link>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>連結</h4>
              <div className="footer-links">
                <Link to="/about">關於我們</Link>
                <Link to="/submit">作品投稿</Link>
                <Link to="/contact">聯絡我們</Link>
              </div>
            </div>

            <br />
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