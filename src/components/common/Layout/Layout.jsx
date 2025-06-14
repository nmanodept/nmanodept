//Location: /src/components/common/Layout/Layout.jsx
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { useAuth } from '../../auth/AuthContext'
import './Layout.css'

const Layout = ({ children }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

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
    { path: '/search', label: '搜尋' },
    { path: '/submit', label: '投稿' },
  ]

  const userNavItems = user ? [
    { path: '/my-artworks', label: '我的作品' },
    { path: '/profile', label: '個人資料' },
  ] : [
    { path: '/login', label: '登入' },
    { path: '/register', label: '註冊' },
  ]

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className={`layout-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <Link to="/" className="logo">
            {/* NO LOGO QwQ*/}
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
            
            <div className="nav-divider" />
            
            {userNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="nav-link"
                activeClassName="nav-link-active"
              >
                {item.label}
              </Link>
            ))}
            
            {user && (
              <button
                onClick={logout}
                className="nav-link logout-btn"
              >
                登出
              </button>
            )}
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
        
        <div className="mobile-nav-divider" />
        
        {userNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        
        {user && (
          <button
            onClick={() => {
              logout()
              setMobileMenuOpen(false)
            }}
            className="mobile-nav-link logout-btn"
          >
            登出
          </button>
        )}
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
              <h4>新沒系館</h4>
              <div className="footer-links">
                <Link to="/">首頁</Link>
                <Link to="/search">瀏覽作品</Link>
                {user ? (
                  <Link to="/my-artworks">我的作品</Link>
                ) : (
                  <Link to="/login">登入投稿</Link>
                )}
              </div>
            </div>
            
            <div className="footer-section">
              <h4>關於</h4>
              <div className="footer-links">
                <Link to="/about">關於我們</Link>
                <Link to="/contact">聯絡我們</Link>
                <Link to="/submit">投稿指南</Link>
              </div>
            </div>

          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} NMANODEPT. All rights reserved.</p>
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