// /src/pages/edit-artwork.jsx - 使用客戶端路由處理動態ID
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

const EditArtworkPage = ({ location }) => {
  const { user } = useAuth()
  // 從 URL 獲取 artwork ID
  const artworkId = location?.pathname?.split('/').pop()
  
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
    if (!artworkId || artworkId === 'edit-artwork') {
      setError('無效的作品ID')
      setLoading(false)
      return
    }
    
    fetchArtworkData()
    fetchOptions()
  }, [artworkId])

  const fetchArtworkData = async () => {
    if (!artworkId || artworkId === 'edit-artwork') {
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
        const artwork = await response.json()
        
        // 檢查權限 - 只能編輯自己提交的作品
        if (artwork.submitted_by && artwork.submitted_by !== user?.id) {
          alert('您沒有權限編輯此作品')
          navigate('/my-artworks')
          return
        }
        
        // 如果是內測作品，檢查是否是作者之一
        if (artwork.is_beta_artwork) {
          const userResponse = await fetch(`${apiUrl}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (userResponse.ok) {
            const userData = await userResponse.json()
            if (!artwork.authors.includes(userData.authorName)) {
              alert('您沒有權限編輯此作品')
              navigate('/my-artworks')
              return
            }
          }
        }
        
        setFormData({
          title: artwork.title || '',
          description: artwork.description || '',
          video_url: artwork.video_url || '',
          authors: artwork.authors || [],
          categories: artwork.categories?.map(c => c.id || c) || [],
          tags: artwork.tags || [],
          social_links: artwork.social_links?.length ? artwork.social_links : [''],
          gallery_video_urls: artwork.gallery_videos?.map(v => v.url || v.video_url) || [''],
          project_year: artwork.project_year || '',
          project_semester: artwork.project_semester || ''
        })
        
        setMainImagePreview(artwork.main_image_url)
        
        // 設置 Gallery 圖片預覽
        if (artwork.gallery_images && artwork.gallery_images.length > 0) {
          setGalleryPreviews(artwork.gallery_images.map(img => ({
            id: img.id,
            url: img.url || img.image_url,
            isExisting: true
          })))
        }
      } else if (response.status === 404) {
        setError('找不到此作品')
      } else {
        setError('無法載入作品資料')
      }
    } catch (error) {
      console.error('Failed to fetch artwork:', error)
      setError('載入失敗：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
    
    try {
      const [authorsRes, categoriesRes, tagsRes, projectRes] = await Promise.all([
        fetch(`${apiUrl}/authors`),
        fetch(`${apiUrl}/categories`),
        fetch(`${apiUrl}/tags`),
        fetch(`${apiUrl}/project-info`)
      ])
      
      if (authorsRes.ok) setAvailableAuthors(await authorsRes.json())
      if (categoriesRes.ok) setAvailableCategories(await categoriesRes.json())
      if (tagsRes.ok) setAvailableTags(await tagsRes.json())
      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProjectYears(projectData.years || [])
        setProjectSemesters(projectData.semesters || [])
      }
    } catch (error) {
      console.error('Failed to fetch options:', error)
    }
  }

  // 主圖片上傳
  const onDropMain = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setMainImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setMainImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps } = useDropzone({
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
    const currentTotal = galleryPreviews.length - deletedGalleryIds.length
    const availableSlots = 10 - currentTotal
    const newImages = acceptedFiles.slice(0, availableSlots)
    
    setGalleryImages([...galleryImages, ...newImages])
    
    newImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, {
          url: e.target.result,
          isExisting: false,
          file: file
        }])
      }
      reader.readAsDataURL(file)
    })
  }, [galleryImages, galleryPreviews, deletedGalleryIds])

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps } = useDropzone({
    onDrop: onDropGallery,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  })

  // 刪除 Gallery 圖片
  const removeGalleryImage = (index) => {
    const preview = galleryPreviews[index]
    
    if (preview.isExisting && preview.id) {
      setDeletedGalleryIds([...deletedGalleryIds, preview.id])
    } else {
      const newGalleryImages = galleryImages.filter(img => img !== preview.file)
      setGalleryImages(newGalleryImages)
    }
    
    const newPreviews = [...galleryPreviews]
    newPreviews.splice(index, 1)
    setGalleryPreviews(newPreviews)
  }

  // 處理表單變更
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleArrayChange = (name, index, value) => {
    const newArray = [...formData[name]]
    newArray[index] = value
    setFormData(prev => ({
      ...prev,
      [name]: newArray
    }))
  }

  const addArrayItem = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: [...prev[name], '']
    }))
  }

  const removeArrayItem = (name, index) => {
    const newArray = [...formData[name]]
    newArray.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      [name]: newArray.length > 0 ? newArray : ['']
    }))
  }

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!artworkId || artworkId === 'edit-artwork') {
      setError('無效的作品ID')
      return
    }
    
    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('video_url', formData.video_url)
      submitData.append('authors', JSON.stringify(formData.authors))
      submitData.append('categories', JSON.stringify(formData.categories))
      submitData.append('tags', JSON.stringify(formData.tags))
      submitData.append('social_links', JSON.stringify(formData.social_links.filter(link => link)))
      submitData.append('gallery_video_urls', JSON.stringify(formData.gallery_video_urls.filter(url => url)))
      submitData.append('project_year', formData.project_year)
      submitData.append('project_semester', formData.project_semester)
      
      // 新主圖片
      if (mainImage) {
        submitData.append('image', mainImage)
      }
      
      // 被刪除的 gallery 圖片 ID
      submitData.append('deleted_gallery_ids', JSON.stringify(deletedGalleryIds))
      
      // 新的 gallery 圖片
      const newGalleryImages = galleryPreviews.filter(p => !p.isExisting)
      newGalleryImages.forEach(preview => {
        if (preview.file) {
          submitData.append('gallery_images[]', preview.file)
        }
      })
      
      const response = await fetch(`${apiUrl}/artwork/${artworkId}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      })
      
      if (response.ok) {
        alert('作品已更新')
        navigate('/my-artworks')
      } else {
        const errorData = await response.json()
        setError(errorData.error || '更新失敗')
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('更新失敗：' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PrivateRoute>
        <Layout>
          <Seo title="編輯作品" />
          <Loading />
        </Layout>
      </PrivateRoute>
    )
  }
  
  if (error && !formData.title) {
    return (
      <PrivateRoute>
        <Layout>
          <Seo title="編輯作品" />
          <div className="edit-artwork-container">
            <div className="alert alert-error">
              {error}
            </div>
            <Button onClick={() => navigate('/my-artworks')}>
              返回我的作品
            </Button>
          </div>
        </Layout>
      </PrivateRoute>
    )
  }

  // 渲染表單的其餘部分與之前相同...
  return (
    <PrivateRoute>
      <Layout>
        <Seo title="編輯作品" />
        <div className="edit-artwork-container">
          <div className="edit-artwork-header">
            <h1>編輯作品</h1>
          </div>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="edit-artwork-form">
            {/* 基本資訊 */}
            <div className="form-section">
              <h2>基本資訊</h2>
              
              <div className="form-group">
                <label htmlFor="title">作品標題 *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">作品描述 *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="project_year">創作年份</label>
                  <select
                    id="project_year"
                    name="project_year"
                    value={formData.project_year}
                    onChange={handleChange}
                  >
                    <option value="">選擇年份</option>
                    {projectYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="project_semester">學期</label>
                  <select
                    id="project_semester"
                    name="project_semester"
                    value={formData.project_semester}
                    onChange={handleChange}
                  >
                    <option value="">選擇學期</option>
                    {projectSemesters.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* 主圖片 */}
            <div className="form-section">
              <h2>主圖片</h2>
              <div {...getMainRootProps()} className="dropzone">
                <input {...getMainInputProps()} />
                {mainImagePreview ? (
                  <div className="preview-container">
                    <img src={mainImagePreview} alt="主圖片預覽" />
                    <p className="hint">點擊或拖曳新圖片來替換</p>
                  </div>
                ) : (
                  <p>點擊或拖曳圖片到此處上傳</p>
                )}
              </div>
            </div>
            
            {/* Gallery 圖片 */}
            <div className="form-section">
              <h2>Gallery 圖片（最多10張）</h2>
              <div {...getGalleryRootProps()} className="dropzone">
                <input {...getGalleryInputProps()} />
                <p>點擊或拖曳圖片到此處上傳（最多10張）</p>
              </div>
              
              {galleryPreviews.length > 0 && (
                <div className="gallery-previews">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="gallery-preview-item">
                      <img src={preview.url} alt={`Gallery ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 其餘表單欄位與之前相同... */}
            
            {/* 提交按鈕 */}
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-artworks')}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '更新作品'}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default EditArtworkPage