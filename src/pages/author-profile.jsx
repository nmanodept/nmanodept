// /src/pages/author-profile.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './author-profile.css'

const AuthorProfilePage = () => {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      social_links: ['']
    }
  })

  const [availableAuthors, setAvailableAuthors] = useState([])
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  // 載入可用的作者
  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/authors`)
      if (response.ok) {
        const data = await response.json()
        setAvailableAuthors(data)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    }
  }

  // 頭像上傳
  const onDropAvatar = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setValue('avatar', file, { shouldValidate: true })
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }, [setValue])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAvatar,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false
  })

  // 社群連結管理
  const addSocialLink = () => {
    setValue('social_links', [...watch('social_links'), ''])
  }

  const removeSocialLink = (index) => {
    setValue('social_links', watch('social_links').filter((_, i) => i !== index))
  }

  const updateSocialLink = (index, value) => {
    const links = [...watch('social_links')]
    links[index] = value
    setValue('social_links', links)
  }

  // 表單送出
  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const formData = new FormData()
      
      formData.append('author_id', data.author_id)
      formData.append('bio', data.bio)
      
      const validSocialLinks = data.social_links.filter(link => link && link.trim() !== '')
      if (validSocialLinks.length > 0) {
        formData.append('social_links', JSON.stringify(validSocialLinks))
      }

      if (data.avatar) {
        formData.append('avatar', data.avatar)
      }

      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/author-profile/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        reset()
        setAvatarPreview(null)
        setValue('social_links', [''])
      } else {
        throw new Error(result.error || '提交失敗')
      }
    } catch (error) {
      console.error('提交錯誤：', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <Seo 
        title="補充作者資料" 
        description="為您的作者頁面新增個人介紹、頭像和社交連結"
      />
      
      <div className="profile-container">
        {/* 頁面標題 */}
        <div className="profile-header">
          <h1 className="profile-title">補充作者資料</h1>
          <p className="profile-subtitle">
            豐富您的作者頁面，讓更多人認識您
          </p>
        </div>

        {/* 表單區域 */}
        <div className="profile-form-wrapper">
          {/* 成功/錯誤訊息 */}
          {submitStatus === 'success' && (
            <div className="alert alert-success">
              <div className="alert-icon">✓</div>
              <div>
                <p className="alert-title">資料提交成功！</p>
                <p className="alert-message">您的作者資料已送出審核，審核通過後將更新您的作者頁面。</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="alert alert-error">
              <div className="alert-icon">!</div>
              <div>
                <p className="alert-title">提交失敗</p>
                <p className="alert-message">請檢查您的網路連線並重試</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            {/* 選擇作者 */}
            <div className="form-group">
              <label htmlFor="author-select" className="form-label">
                選擇您的作者名稱 <span className="required">*</span>
              </label>
              <select
                id="author-select"
                {...register('author_id', { required: '請選擇作者名稱' })}
                className={`form-select ${errors.author_id ? 'error' : ''}`}
              >
                <option value="">請選擇</option>
                {availableAuthors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              {errors.author_id && <p className="form-error">{errors.author_id.message}</p>}
              <p className="form-hint">
                找不到您的名字？請先投稿作品，系統會自動建立您的作者資料。
              </p>
            </div>

            {/* 頭像上傳 */}
            <div className="form-group">
              <label className="form-label">個人頭像</label>
              <Controller
                name="avatar"
                control={control}
                render={({ field }) => (
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {avatarPreview ? (
                      <div className="avatar-preview-wrapper">
                        <img 
                          src={avatarPreview} 
                          alt="頭像預覽" 
                          className="avatar-preview"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAvatarPreview(null)
                            setValue('avatar', null)
                          }}
                          className="avatar-remove"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <div className="dropzone-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M20 21C20 18.79 16.42 17 12 17C7.58 17 4 18.79 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <p className="dropzone-text">拖放圖片或點擊選擇</p>
                        <p className="dropzone-hint">建議使用正方形圖片 (最大 2MB)</p>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* 個人簡介 */}
            <div className="form-group">
              <label htmlFor="bio" className="form-label">
                個人簡介 <span className="required">*</span>
              </label>
              <textarea
                id="bio"
                {...register('bio', { 
                  required: '請輸入個人簡介',
                  minLength: { value: 50, message: '簡介至少需要 50 字' }
                })}
                rows={6}
                className={`form-textarea ${errors.bio ? 'error' : ''}`}
                placeholder="介紹您自己、您的創作理念、經歷等..."
              />
              <div className="form-footer">
                {errors.bio && <p className="form-error">{errors.bio.message}</p>}
                <p className="char-count">字數：{watch('bio')?.length || 0}</p>
              </div>
            </div>

            {/* 社交連結 */}
            <div className="form-group">
              <label className="form-label">社交媒體連結</label>
              <Controller
                name="social_links"
                control={control}
                render={({ field }) => (
                  <div className="social-links">
                    {field.value.map((link, index) => (
                      <div key={index} className="social-link-item">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateSocialLink(index, e.target.value)}
                          className="form-input"
                          placeholder="Instagram、GitHub、個人網站、Email 等"
                        />
                        {field.value.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="btn-remove"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSocialLink}
                      className="btn-add-link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      新增連結
                    </button>
                  </div>
                )}
              />
            </div>

            {/* 提交按鈕 */}
            <div className="form-actions">
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交資料'}
              </Button>
            </div>
          </form>
        </div>

        {/* 注意事項 */}
        <div className="profile-notes">
          <h3 className="notes-title">注意事項</h3>
          <ul className="notes-list">
            <li>提交的資料需要經過管理員審核</li>
            <li>審核通過後，您的作者頁面將顯示這些資訊</li>
            <li>每位作者只能有一份審核通過的資料</li>
            <li>如需更新資料，請重新提交，舊資料將被取代</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default AuthorProfilePage