//Location: /src/pages/submit.jsx
import React, { useEffect } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import SubmitForm from '../components/forms/SubmitForm'
import { useAuth } from '../components/auth/AuthContext'
import './submit.css'

const SubmitPage = ({ location }) => {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(`/login?from=${encodeURIComponent(location.pathname)}`)
    }
  }, [loading, isAuthenticated, location])

  if (loading || !isAuthenticated) {
    return <Layout><div className="loading">載入中...</div></Layout>
  }

  return (
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

        {/* 免責聲明 */}
        <div className="disclaimer-notice">
          <h3>投稿須知與免責聲明</h3>
          <p>投稿前請詳細閱讀以下條款：</p>
          <ul>
            <li>本平台僅提供新媒系作品紀錄性質用，不屬於公開發表</li>
            <li>平台不會拿個人資料商用、修改，並且沒有作品的使用權</li>
            <li>本平台不負責作品的保管與備份</li>
            <li>投稿者同意將個人資訊（姓名、作品資訊等）公開展示於平台</li>
            <li>投稿者須確保作品為原創或已獲得合法授權</li>
            <li>如作品涉及版權爭議，平台不承擔任何法律責任</li>
            <li>平台保留移除不當內容的權利</li>
          </ul>
        </div>

        {/* 表單區域 */}
        <div className="submit-form-wrapper form-wrapper">
          <SubmitForm />
        </div>

        {/* 注意事項 */}
        <div className="submit-notes">
          <h3 className="notes-title">技術提醒</h3>
          <ul className="notes-list">
            <li>作品預覽圖建議使用 16:9 比例，檔案大小請勿超過 5MB</li>
            <li>支援 JPG、PNG、GIF 格式圖片</li>
            <li>影片請提供 YouTube 或 Vimeo 連結</li>
            <li>投稿後作品將立即顯示，無需等待審核</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default SubmitPage