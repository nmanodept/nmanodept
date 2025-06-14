//Location: /src/components/forms/SubmitForm/index.jsx
import React, { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { navigate } from 'gatsby'
import { useAuth } from '../../auth/AuthContext'
import Button from '../../common/Button'
import DisclaimerCheckbox from '../DisclaimerCheckbox'
import './SubmitForm.css'

const SubmitForm = () => {
  const { user } = useAuth()
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      authors: user?.authorName ? [user.authorName] : [],
      tags: [],
      categories: [],
      gallery_images: [],
      gallery_video_urls: [''],
      social_links: [''],
      project_year: '',
      project_semester: '',
      disclaimer_accepted: false
    }
  })

  const [previewImage, setPreviewImage] = useState(null)
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  
  const [availableAuthors, setAvailableAuthors] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableProjectYears, setAvailableProjectYears] = useState([])
  const [availableProjectSemesters, setAvailableProjectSemesters] = useState([])
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)

  const description = watch('description', '')
  const disclaimerAccepted = watch('disclaimer_accepted')

  useEffect(() => {
    fetchAuthors()
    fetchCategories()
    fetchTags()
    fetchProjectInfo()
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

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/categories`)
      if (response.ok) {
        const data = await response.json()
        setAvailableCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/tags`)
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const fetchProjectInfo = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/project-info`)
      if (response.ok) {
        const data = await response.json()
        setAvailableProjectYears(data.years || [])
        setAvailableProjectSemesters(data.semesters || [])
      }
    } catch (error) {
      console.error('Failed to fetch project info:', error)
    }
  }

  // 主圖片上傳
  const onDropMain = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setValue('image', file, { shouldValidate: true })
      const reader = new FileReader()
      reader.onload = (e) => setPreviewImage(e.target.result)
      reader.readAsDataURL(file)
    }
  }, [setValue])

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  })

  // Gallery 圖片上傳
  const onDropGallery = useCallback((acceptedFiles) => {
    const currentGallery = watch('gallery_images') || []
    const newFiles = [...currentGallery, ...acceptedFiles]
    setValue('gallery_images', newFiles)

    acceptedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, { url: e.target.result, name: file.name }])
      }
      reader.readAsDataURL(file)
    })
  }, [setValue, watch])

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onDropGallery,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  })

  // 作者管理
  const handleAddAuthor = () => {
    if (authorInput.trim()) {
      const currentAuthors = watch('authors') || []
      if (!currentAuthors.includes(authorInput.trim())) {
        setValue('authors', [...currentAuthors, authorInput.trim()])
      }
      setAuthorInput('')
      setShowAuthorSuggestions(false)
    }
  }

  const handleRemoveAuthor = (authorToRemove) => {
    const currentAuthors = watch('authors') || []
    setValue('authors', currentAuthors.filter(a => a !== authorToRemove))
  }

  // 標籤管理
  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = watch('tags') || []
      if (!currentTags.includes(tagInput.trim())) {
        setValue('tags', [...currentTags, tagInput.trim()])
      }
      setTagInput('')
      setShowTagSuggestions(false)
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = watch('tags') || []
    setValue('tags', currentTags.filter(t => t !== tagToRemove))
  }

  // 動態欄位管理
  const handleAddField = (fieldName) => {
    const currentValues = watch(fieldName) || []
    setValue(fieldName, [...currentValues, ''])
  }

  const handleRemoveField = (fieldName, index) => {
    const currentValues = watch(fieldName) || []
    setValue(fieldName, currentValues.filter((_, i) => i !== index))
  }

  const handleFieldChange = (fieldName, index, value) => {
    const currentValues = watch(fieldName) || []
    const newValues = [...currentValues]
    newValues[index] = value
    setValue(fieldName, newValues)
  }

  // 表單提交
  const onSubmit = async (data) => {
    if (!data.disclaimer_accepted) {
      alert('請先同意免責聲明')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    const formData = new FormData()
    
    // 基本資料
    formData.append('title', data.title)
    formData.append('description', data.description || '')
    formData.append('year', data.year)
    
    // 主圖片
    if (data.image) {
      formData.append('image', data.image)
    }

    // 作者（JSON 字串）
    formData.append('authors', JSON.stringify(data.authors || []))
    
    // 標籤和類別（JSON 字串）
    formData.append('tags', JSON.stringify(data.tags || []))
    formData.append('categories', JSON.stringify(data.categories || []))
    
    // 影片連結
    if (data.video_url) {
      formData.append('video_url', data.video_url)
    }
    
    // Gallery 圖片
    if (data.gallery_images && data.gallery_images.length > 0) {
      data.gallery_images.forEach((file, index) => {
        formData.append(`gallery_images`, file)
      })
    }
    
    // Gallery 影片連結（過濾空值）
    const galleryVideos = (data.gallery_video_urls || []).filter(url => url.trim())
    if (galleryVideos.length > 0) {
      formData.append('gallery_video_urls', JSON.stringify(galleryVideos))
    }
    
    // 社交連結（過濾空值）
    const socialLinks = (data.social_links || []).filter(url => url.trim())
    if (socialLinks.length > 0) {
      formData.append('social_links', JSON.stringify(socialLinks))
    }
    
    // 專案資訊
    if (data.project_year) {
      formData.append('project_year', data.project_year)
    }
    if (data.project_semester) {
      formData.append('project_semester', data.project_semester)
    }

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitStatus({ type: 'success', message: '作品投稿成功！' })
        
        // 重設表單
        reset()
        setPreviewImage(null)
        setGalleryPreviews([])
        
        // 3秒後跳轉到作品頁面
        setTimeout(() => {
          navigate(`/art/${result.id}`)
        }, 3000)
      } else {
        const error = await response.json()
        setSubmitStatus({ 
          type: 'error', 
          message: error.error || '投稿失敗，請稍後再試' 
        })
      }
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitStatus({ 
        type: 'error', 
        message: '投稿失敗，請檢查網路連線' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="submit-form">
      {/* 基本資訊 */}
      <div className="form-section">
        <h3>基本資訊</h3>
        
        <div className="form-group">
          <label htmlFor="title">作品標題 *</label>
          <input
            id="title"
            type="text"
            {...register('title', { required: '請輸入作品標題' })}
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title.message}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year">創作年份 *</label>
            <input
              id="year"
              type="number"
              {...register('year', { 
                required: '請輸入創作年份',
                min: { value: 2000, message: '年份不能小於 2000' },
                max: { value: new Date().getFullYear(), message: '年份不能大於今年' }
              })}
              className={errors.year ? 'error' : ''}
              placeholder={new Date().getFullYear().toString()}
            />
            {errors.year && <span className="error-message">{errors.year.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="video_url">影片連結</label>
            <input
              id="video_url"
              type="url"
              {...register('video_url')}
              placeholder="YouTube 或 Vimeo 連結"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">作品說明</label>
          <textarea
            id="description"
            {...register('description')}
            rows={6}
            placeholder="介紹你的作品理念、創作過程..."
          />
          <span className="char-count">{description.length} 字</span>
        </div>
      </div>

      {/* 主要圖片 */}
      <div className="form-section">
        <h3>作品預覽圖 *</h3>
        <div {...getMainRootProps()} className={`dropzone ${isMainDragActive ? 'active' : ''} ${errors.image ? 'error' : ''}`}>
          <input {...getMainInputProps()} />
          {previewImage ? (
            <div className="preview-container">
              <img src={previewImage} alt="預覽" className="preview-image" />
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setValue('image', null)
                  setPreviewImage(null)
                }}
              >
                更換圖片
              </Button>
            </div>
          ) : (
            <div className="dropzone-content">
              <p>拖放圖片到此處，或點擊選擇檔案</p>
              <p className="hint">支援 JPG、PNG、GIF，最大 5MB</p>
            </div>
          )}
        </div>
        {errors.image && <span className="error-message">請上傳作品預覽圖</span>}
      </div>

      {/* 作者資訊 */}
      <div className="form-section">
        <h3>作者資訊</h3>
        
        <div className="form-group">
          <label>作者</label>
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={authorInput}
              onChange={(e) => {
                setAuthorInput(e.target.value)
                setShowAuthorSuggestions(true)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAuthor()
                }
              }}
              onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
              placeholder="輸入作者名稱"
            />
            <Button
              type="button"
              onClick={handleAddAuthor}
              variant="secondary"
              size="small"
            >
              新增
            </Button>
          </div>
          
          {showAuthorSuggestions && authorInput && (
            <div className="suggestions">
              {availableAuthors
                .filter(author => author.name.toLowerCase().includes(authorInput.toLowerCase()))
                .slice(0, 5)
                .map(author => (
                  <div
                    key={author.id}
                    className="suggestion-item"
                    onClick={() => {
                      setAuthorInput(author.name)
                      handleAddAuthor()
                    }}
                  >
                    {author.name}
                  </div>
                ))}
            </div>
          )}
          
          <div className="tags-container">
            {(watch('authors') || []).map((author, index) => (
              <span key={index} className="tag">
                {author}
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(author)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 社交連結 */}
        <div className="form-group">
          <label>社交媒體連結</label>
          {(watch('social_links') || ['']).map((link, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="url"
                value={link}
                onChange={(e) => handleFieldChange('social_links', index, e.target.value)}
                placeholder="Instagram、個人網站等"
              />
              <Button
                type="button"
                onClick={() => handleRemoveField('social_links', index)}
                variant="outline"
                size="small"
              >
                移除
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => handleAddField('social_links')}
            variant="outline"
            size="small"
          >
            新增連結
          </Button>
        </div>
      </div>

      {/* 分類與標籤 */}
      <div className="form-section">
        <h3>分類與標籤</h3>
        
        <div className="form-group">
          <label>作品類別</label>
          <div className="checkbox-group">
            {availableCategories.map(category => (
              <label key={category.id} className="checkbox-label">
                <input
                  type="checkbox"
                  value={category.name}
                  {...register('categories')}
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>標籤</label>
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value)
                setShowTagSuggestions(true)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder="輸入標籤"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              variant="secondary"
              size="small"
            >
              新增
            </Button>
          </div>
          
          {showTagSuggestions && tagInput && (
            <div className="suggestions">
              {availableTags
                .filter(tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()))
                .slice(0, 5)
                .map(tag => (
                  <div
                    key={tag.id}
                    className="suggestion-item"
                    onClick={() => {
                      setTagInput(tag.name)
                      handleAddTag()
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
            </div>
          )}
          
          <div className="tags-container">
            {(watch('tags') || []).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 課程資訊 */}
      <div className="form-section">
        <h3>課程資訊（選填）</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="project_year">學年度</label>
            <select {...register('project_year')} id="project_year">
              <option value="">-- 請選擇 --</option>
              {availableProjectYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="project_semester">年級學期</label>
            <select {...register('project_semester')} id="project_semester">
              <option value="">-- 請選擇 --</option>
              {availableProjectSemesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="form-section">
        <h3>作品集（選填）</h3>
        
        <div className="form-group">
          <label>更多圖片</label>
          <div {...getGalleryRootProps()} className={`dropzone ${isGalleryDragActive ? 'active' : ''}`}>
            <input {...getGalleryInputProps()} />
            <div className="dropzone-content">
              <p>拖放多張圖片到此處，或點擊選擇檔案</p>
              <p className="hint">可一次選擇多張圖片</p>
            </div>
          </div>
          
          {galleryPreviews.length > 0 && (
            <div className="gallery-preview">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="gallery-item">
                  <img src={preview.url} alt={`Gallery ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => {
                      const newPreviews = galleryPreviews.filter((_, i) => i !== index)
                      setGalleryPreviews(newPreviews)
                      const newFiles = (watch('gallery_images') || []).filter((_, i) => i !== index)
                      setValue('gallery_images', newFiles)
                    }}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>更多影片連結</label>
          {(watch('gallery_video_urls') || ['']).map((url, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="url"
                value={url}
                onChange={(e) => handleFieldChange('gallery_video_urls', index, e.target.value)}
                placeholder="YouTube 或 Vimeo 連結"
              />
              <Button
                type="button"
                onClick={() => handleRemoveField('gallery_video_urls', index)}
                variant="outline"
                size="small"
              >
                移除
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => handleAddField('gallery_video_urls')}
            variant="outline"
            size="small"
          >
            新增影片
          </Button>
        </div>
      </div>

      {/* 免責聲明 */}
      <div className="form-section">
        <DisclaimerCheckbox
          {...register('disclaimer_accepted', { required: true })}
          error={errors.disclaimer_accepted}
        />
      </div>

      {/* 提交狀態 */}
      {submitStatus && (
        <div className={`submit-status ${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      {/* 提交按鈕 */}
      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={isSubmitting || !disclaimerAccepted}
        >
          {isSubmitting ? '投稿中...' : '投稿作品'}
        </Button>
      </div>
    </form>
  )
}

export default SubmitForm