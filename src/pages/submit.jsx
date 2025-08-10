// /src/pages/submit.jsx
import React from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import SubmitForm from '../components/forms/SubmitForm'
import PrivateRoute from '../components/auth/PrivateRoute'
import { useAuth } from '../components/auth/AuthContext'
import './submit.css'

const SubmitPage = () => {
  const { user } = useAuth()

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="投稿作品" />
        <div className="submit-container">
          {/* 頁面標題 */}
          <div className="submit-header">
            <h1 className="submit-title">投稿作品</h1>
            <p className="submit-subtitle">
              分享你的創作，讓更多人看見
            </p>
          </div>

          {/* 表單區域 */}
          <div className="submit-form-wrapper form-wrapper">
            <SubmitForm currentUser={user} />
          </div>

          {/* 注意事項 */}
          <div className="submit-notes">
            <h3 className="notes-title">投稿須知</h3>
            <ul className="notes-list">
              <li>作品預覽圖建議使用 16:9 比例，檔案大小請勿超過 5MB</li>
              <li>請確保上傳的內容為你的原創作品或已獲得授權</li>
              <li>投稿作品將在審核通過後公開展示</li>
              <li>如有任何問題，歡迎聯繫管理員</li>
            </ul>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default SubmitPage