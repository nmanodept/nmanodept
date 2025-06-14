//Location: /src/pages/register.jsx
import React, { useState } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import RegisterForm from '../components/forms/RegisterForm'
import { useAuth } from '../components/auth/AuthContext'
import './auth.css'

const RegisterPage = () => {
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (formData) => {
    setError('')
    const result = await register(formData)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error)
    }
  }

  if (success) {
    return (
      <Layout>
        <Seo title="註冊成功" />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-success">
              <h2>註冊成功！</h2>
              <p>您的帳號已建立，正在等待管理員審核。</p>
              <p>審核通過後，您將收到通知郵件。</p>
              <Link to="/" className="btn btn-primary">
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo title="註冊帳號" />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">註冊帳號</h1>
          <p className="auth-subtitle">加入新沒系館，分享您的創作</p>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <RegisterForm onSubmit={handleRegister} />

          <div className="auth-footer">
            <p>已經有帳號了？<Link to="/login">立即登入</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default RegisterPage