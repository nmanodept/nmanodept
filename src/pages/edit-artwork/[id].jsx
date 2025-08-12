// /src/pages/edit-artwork/[id].jsx
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

const EditArtworkPage = ({ params }) => {
  const { user } = useAuth()
  const artworkId = params.id
  
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 載入作品資料
  useEffect(() => {
    fetchArtworkData()
    fetchOptions()
  }, [artworkId])

  const fetchArtworkData = async () => {
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
        
        // 檢查權限
        if (artwork.submitted_by !== user?.id) {
          alert('您沒有權限編輯此作品')
          navigate('/my-artworks')
          return
        }
        
        setFormData({
          title: artwork.title || '',
          description: artwork.description || '',
          video_url: artwork.video_url || '',
          authors: artwork.authors || [],
          categories: artwork.categories?.map(c => c.id) || [],
          tags: artwork.tags || [],
          social_links: artwork.social_links?.length ? artwork.social_links : [''],
          gallery_video_urls: artwork.gallery_videos?.map(v => v.url) || [''],
          project_year: artwork.project_year || '',
          project_semester: artwork.project_semester || ''
        })
        
        setMainImagePreview(artwork.main_image_url)
        setGalleryPreviews(artwork.gallery_images?.map(img => ({
          id: img.id,
          url: img.url,
          isExisting: true
        })) || [])
      } else {
        alert('無法載入作品資料')
        navigate('/my-artworks')
      }
    } catch (error) {
      console.error('Failed to fetch artwork:', error)
      alert('載入失敗')
      navigate('/my-artworks')
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
    
    try {
      const [authorsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`${apiUrl}/authors`),
        fetch(`${apiUrl}/categories`),
        fetch(`${apiUrl}/tags`)
      ])
      
      if (authorsRes.ok) setAvailableAuthors(await authorsRes.json())
      if (categoriesRes.ok) setAvailableCategories(await categoriesRes.json())
      if (tagsRes.ok) setAvailableTags(await tagsRes.json())
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
    const newImages = acceptedFiles.slice(0, 10 - galleryImages.length)
    setGalleryImages([...galleryImages, ...newImages])
    
    newImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, {
          url: e.target.result,
          isExisting: false
        }])
      }
      reader.readAsDataURL(file)
    })
  }, [galleryImages])

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
      const newGalleryImages = [...galleryImages]
      newGalleryImages.splice(index - galleryPreviews.filter(p => p.isExisting).length, 1)
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
      
      // 現有 gallery 圖片數量
      const existingCount = galleryPreviews.filter(p => p.isExisting).length - deletedGalleryIds.length
      submitData.append('existing_gallery_count', existingCount)
      
      // 新 gallery 圖片
      submitData.append('new_gallery_count', galleryImages.length)
      galleryImages.forEach((image, index) => {
        submitData.append(`new_gallery_${index}`, image)
      })

      const response = await fetch(`${apiUrl}/artwork/${artworkId}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      })

      if (response.ok) {
        alert('作品已更新成功！')
        navigate('/my-artworks')
      } else {
        const error = await response.json()
        setError(error.error || '更新失敗')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('提交失敗，請稍後再試')
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

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="編輯作品" />
        <div className="edit-artwork-container">
          <div className="edit-artwork-header">
            <h1>編輯作品</h1>
            <Button variant="outline" onClick={() => navigate('/my-artworks')}>
              返回我的作品
            </Button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-artwork-form">
            {/* 基本資訊 */}
            <section className="form-section">
              <h2>基本資訊</h2>
              
              <div className="form-group">
                <label htmlFor="title">作品名稱 *</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">作品描述</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="video_url">影片連結</label>
                <input
                  id="video_url"
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="YouTube 或 Vimeo 連結"
                />
              </div>
            </section>

            {/* 主圖片 */}
            <section className="form-section">
              <h2>主圖片</h2>
              <div {...getMainRootProps()} className="dropzone">
                <input {...getMainInputProps()} />
                {mainImagePreview ? (
                  <div className="preview-container">
                    <img src={mainImagePreview} alt="主圖片預覽" />
                    <p className="hint">點擊或拖曳新圖片以替換</p>
                  </div>
                ) : (
                  <p>點擊或拖曳圖片至此處上傳</p>
                )}
              </div>
            </section>

            {/* Gallery */}
            <section className="form-section">
              <h2>Gallery 圖片（最多10張）</h2>
              <div {...getGalleryRootProps()} className="dropzone">
                <input {...getGalleryInputProps()} />
                <p>點擊或拖曳圖片至此處上傳</p>
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
            </section>

            {/* 作者 */}
            <section className="form-section">
              <h2>作者</h2>
              {formData.authors.map((author, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => handleArrayChange('authors', index, e.target.value)}
                    placeholder="作者名稱"
                  />
                  {formData.authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('authors', index)}
                      className="remove-btn"
                    >
                      移除
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('authors')}
              >
                新增作者
              </Button>
            </section>

            {/* 分類和標籤 */}
            <section className="form-section">
              <h2>分類和標籤</h2>
              
              <div className="form-group">
                <label>分類</label>
                <div className="checkbox-group">
                  {availableCategories.map(category => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={category.id}
                        checked={formData.categories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              categories: [...prev.categories, category.id]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.filter(id => id !== category.id)
                            }))
                          }
                        }}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>標籤</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    setFormData(prev => ({
                      ...prev,
                      tags
                    }))
                  }}
                  placeholder="輸入標籤，以逗號分隔"
                />
              </div>
            </section>

            {/* 專題資訊 */}
            <section className="form-section">
              <h2>專題資訊</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="project_year">創作年份</label>
                  <input
                    id="project_year"
                    type="number"
                    name="project_year"
                    value={formData.project_year}
                    onChange={handleChange}
                    min="2000"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project_semester">年級學期</label>
                  <select
                    id="project_semester"
                    name="project_semester"
                    value={formData.project_semester}
                    onChange={handleChange}
                  >
                    <option value="">選擇學期</option>
                    <option value="大一上">大一上</option>
                    <option value="大一下">大一下</option>
                    <option value="大二上">大二上</option>
                    <option value="大二下">大二下</option>
                    <option value="大三上">大三上</option>
                    <option value="大三下">大三下</option>
                    <option value="大四上">大四上</option>
                    <option value="大四下">大四下</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 社交連結 */}
            <section className="form-section">
              <h2>社交連結</h2>
              {formData.social_links.map((link, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleArrayChange('social_links', index, e.target.value)}
                    placeholder="https://..."
                  />
                  {formData.social_links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('social_links', index)}
                      className="remove-btn"
                    >
                      移除
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('social_links')}
              >
                新增連結
              </Button>
            </section>

            {/* 提交按鈕 */}
            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '更新作品'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-artworks')}
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