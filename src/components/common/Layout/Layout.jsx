import React, { useState } from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navLinks = [
    { path: '/', label: '首頁' },
    { path: '/about', label: '關於' },
    { path: '/search', label: '搜尋' },
    { path: '/submit', label: '投稿' },
  ]
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  nmanodept
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                  activeClassName="text-gray-900 border-b-2 border-gray-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900"
              >
                <span className="sr-only">開啟選單</span>
                {/* Hamburger icon */}
                <svg
                  className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Close icon */}
                <svg
                  className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden pb-3`}>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  activeClassName="bg-gray-100 text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4">關於 nmanodept</h3>
              <p className="text-gray-400 text-sm">
                一個專注於當代藝術與建築視覺的創作平台，
                致力於打造開放、多元的藝術展示空間。
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">快速連結</h3>
              <ul className="space-y-2 text-sm">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">聯絡我們</h3>
              <p className="text-gray-400 text-sm mb-2">
                有任何問題或建議？
              </p>
              <a
                href="mailto:contact@nmanodept.com"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                contact@nmanodept.com
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} nmanodept. All rights reserved.
            </p>
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