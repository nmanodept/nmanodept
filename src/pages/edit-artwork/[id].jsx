// /src/pages/edit-artwork/[id].jsx - 完整修復版
import React, { useState, useCallback, useEffect } from 'react'
import { navigate } from 'gatsby'
import { useDropzone } from 'react-dropzone'
import Layout from '../../components/common/Layout'
import Seo from '../../components/common/Seo'
import PrivateRoute from '../../components/auth/PrivateRoute'
import Button from '../../components/common/Button'
import Loading from '../../components/common/Loading'
import { useAuth } from '../../components/auth/AuthContext'
import './edit-artwork.css'

const EditArtworkPage = ({ params, location }) => {
  const { user } = useAuth()
  
  // 從 URL 獲取 artwork ID - 修復路由問題
  const getArtworkId = () => {
    // 優先使用 params.id (Gatsby 動態路由)
    if (params && params.id) {
      return params.id
    }
    
    // 備用方案：從 pathname 解析
    const pathParts = location?.pathname?.split('/').filter(Boolean)
    if (pathParts && pathParts.length >= 2) {
      const lastPart = pathParts[pathParts.length - 1]
      // 確保是數字ID
      if (lastPart && !isNaN(lastPart)) {
        return lastPart
      }
    }
    
    return null
  }
  
  const artworkId = getArtworkId()
  
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    authors: [],
    categories: [],
    tags: [],
    social_links: [''],
    gallery_video_urls: [''],
    project_year: '',
    project_semester: ''
  })
  
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [deletedGalleryIds, setDeletedGalleryIds] = useState([])
  
  const [availableAuthors, setAvailableAuthors] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [projectYears, setProjectYears] = useState([])
  const [projectSemesters, setProjectSemesters] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 載入作品資料
  useEffect(() => {
    if (!artworkId) {
      setError('無效的作品ID')
      setLoading(false)
      return
    }
    
    fetchArtworkData()
    fetchOptions()
  }, [artworkId])

  const fetchArtworkData = async () => {
    if (!artworkId) {
      setError('無效的作品ID')
      setLoading(false)
      return
    }
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/artwork/${artworkId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 處理資料格式
        const processedData = {
          title: data.title || '',
          description: data.description || '',
          video_url: data.video_url || '',
          authors: Array.isArray(data.authors) ? data.authors : 
                   typeof data.authors === 'string' ? JSON.parse(data.authors || '[]') : [],
          categories: Array.isArray(data.categories) ? 
                      data.categories.map(cat => typeof cat === 'object' ? cat.id : cat) :
                      typeof data.categories === 'string' ? JSON.parse(data.categories || '[]') : [],
          tags: Array.isArray(data.tags) ? data.tags : 
                typeof data.tags === 'string' ? JSON.parse(data.tags || '[]') : [],
          social_links: data.social_links?.length > 0 ? data.social_links : [''],
          gallery_video_urls: data.gallery_videos?.map(v => v.video_url || v.url) || [''],
          project_year: data.project_year || '',
          project_semester: data.project_semester || ''
        }
        
        setFormData(processedData)
        setMainImagePreview(data.main_image_url)
        
        // 設定 gallery 圖片預覽
        if (data.gallery_images && data.gallery_images.length > 0) {
          setGalleryPreviews(data.gallery_images.map(img => ({
            id: img.id,
            url: img.image_url || img.url
          })))
        }
      } else if (response.status === 403) {
        setError('您沒有權限編輯此作品')
      } else if (response.status === 404) {
        setError('找不到此作品')
      } else {
        setError('載入作品失敗')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('載入作品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 載入作者
      const authorsRes = await fetch(`${apiUrl}/authors`)
      if (authorsRes.ok) {
        const authors = await authorsRes.json()
        setAvailableAuthors(authors.map(a => a.name))
      }
      
      // 載入類別
      const categoriesRes = await fetch(`${apiUrl}/categories`)
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        setAvailableCategories(categories)
      }
      
      // 載入標籤
      const tagsRes = await fetch(`${apiUrl}/tags`)
      if (tagsRes.ok) {
        const tags = await tagsRes.json()
        setAvailableTags(tags.map(t => t.name))
      }
      
      // 載入專題資訊
      const projectRes = await fetch(`${apiUrl}/project-info`)
      if (projectRes.ok) {
        const projectInfo = await projectRes.json()
        setProjectYears(projectInfo.years || [])
        setProjectSemesters(projectInfo.semesters || [])
      }
    } catch (error) {
      console.error('Failed to fetch options:', error)
    }
  }

  // 主圖片上傳
  const onDropMainImage = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setMainImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setMainImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getMainProps, getInputProps: getMainInputProps } = useDropzone({
    onDrop: onDropMainImage,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  })

  // Gallery 圖片上傳
  const onDropGalleryImages = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.slice(0, 10 - galleryImages.length)
    setGalleryImages(prev => [...prev, ...newImages])
    
    newImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, { url: e.target.result, isNew: true }])
      }
      reader.readAsDataURL(file)
    })
  }, [galleryImages])

  const { getRootProps: getGalleryProps, getInputProps: getGalleryInputProps } = useDropzone({
    onDrop: onDropGalleryImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10
  })

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!artworkId) {
      setError('無效的作品ID')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('video_url', formData.video_url)
      formDataToSend.append('authors', JSON.stringify(formData.authors))
      formDataToSend.append('categories', JSON.stringify(formData.categories))
      formDataToSend.append('tags', JSON.stringify(formData.tags))
      formDataToSend.append('social_links', JSON.stringify(formData.social_links.filter(l => l)))
      formDataToSend.append('gallery_video_urls', JSON.stringify(formData.gallery_video_urls.filter(v => v)))
      formDataToSend.append('project_year', formData.project_year)
      formDataToSend.append('project_semester', formData.project_semester)
      
      // 新的主圖片
      if (mainImage) {
        formDataToSend.append('image', mainImage)
      }
      
      // 刪除的 gallery 圖片
      formDataToSend.append('deleted_gallery_ids', JSON.stringify(deletedGalleryIds))
      
      // 新的 gallery 圖片
      galleryImages.forEach((img, index) => {
        formDataToSend.append(`new_gallery_${index}`, img)
      })
      formDataToSend.append('new_gallery_count', galleryImages.length)
      
      const response = await fetch(`${apiUrl}/artwork/${artworkId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })
      
      if (response.ok) {
        navigate('/my-artworks')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '更新失敗')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('提交時發生錯誤，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 刪除 gallery 圖片
  const removeGalleryImage = (index) => {
    const preview = galleryPreviews[index]
    if (preview.id) {
      setDeletedGalleryIds(prev => [...prev, preview.id])
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
    
    // 如果是新上傳的圖片，也從 galleryImages 中移除
    if (preview.isNew) {
      const newImageIndex = galleryPreviews.slice(0, index).filter(p => p.isNew).length
      setGalleryImages(prev => prev.filter((_, i) => i !== newImageIndex))
    }
  }

  if (!user) {
    return (
      <Layout>
        <Seo title="編輯作品" />
        <div className="auth-required">
          <h2>請先登入</h2>
          <Link to="/login" className="btn btn-primary">
            前往登入
          </Link>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <Seo title="編輯作品" />
        <Loading />
      </Layout>
    )
  }

  if (error && !formData.title) {
    return (
      <Layout>
        <Seo title="錯誤" />
        <div className="error-container">
          <h1>無法編輯作品</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/my-artworks')} className="btn btn-primary">
            返回我的作品
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <PrivateRoute>
      <Layout>
        <Seo title={`編輯 - ${formData.title || '作品'}`} />
        
        <div className="edit-artwork-container">
          <div className="edit-artwork-header">
            <h1>編輯作品</h1>
            <button 
              onClick={() => navigate('/my-artworks')}
              className="btn-back"
            >
              ← 返回
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-artwork-form">
            {/* 作品標題 */}
            <div className="form-group">
              <label htmlFor="title">作品標題 *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="輸入作品標題"
              />
            </div>

            {/* 作品描述 */}
            <div className="form-group">
              <label htmlFor="description">作品說明</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="6"
                placeholder="描述您的創作理念、技術或故事..."
              />
            </div>

            {/* 主圖片上傳 */}
            <div className="form-group">
              <label>主要圖片</label>
              <div {...getMainProps()} className="dropzone">
                <input {...getMainInputProps()} />
                {mainImagePreview ? (
                  <div className="image-preview-container">
                    <img src={mainImagePreview} alt="預覽" className="image-preview-full" />
                    <p className="upload-hint">點擊或拖放新圖片來替換</p>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 16v16m-8-8h16" stroke="currentColor" strokeWidth="2"/>
                      <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <p>點擊或拖放圖片到此處</p>
                    <span>支援 JPG, PNG, GIF, WebP</span>
                  </div>
                )}
              </div>
            </div>

            {/* 影片連結 */}
            <div className="form-group">
              <label htmlFor="video_url">主要影片連結</label>
              <input
                type="url"
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="YouTube 或 Vimeo 連結"
              />
            </div>

            {/* 作者 */}
            <div className="form-group">
              <label>創作者</label>
              <div className="tags-input">
                {formData.authors.map((author, index) => (
                  <span key={index} className="tag">
                    {author}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          authors: formData.authors.filter((_, i) => i !== index)
                        })
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="輸入作者名稱後按 Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      e.preventDefault()
                      setFormData({
                        ...formData,
                        authors: [...formData.authors, e.target.value]
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !formData.title}
                loading={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '儲存變更'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-artworks')}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default EditArtworkPage