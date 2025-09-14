import React, { useState, useCallback, useEffect } from 'react'
import { navigate, Link } from 'gatsby'
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
      return params.id.toString()
    }
    
    // 備用方案：從 pathname 解析
    const pathParts = location?.pathname?.split('/').filter(Boolean)
    if (pathParts && pathParts.length >= 2) {
      const lastPart = pathParts[pathParts.length - 1]
      // 確保是數字ID
      if (lastPart && !isNaN(lastPart)) {
        return lastPart.toString()
      }
    }
    
    return null
  }
  
  const artworkId = getArtworkId()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 表單資料
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    authors: [],
    categories: [], // 儲存類別ID
    tags: [],
    social_links: [''],
    gallery_video_urls: [''],
    project_year: '',
    project_semester: '',
    disclaimer_accepted: true
  })
  
  // 圖片相關
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [existingGalleryImages, setExistingGalleryImages] = useState([])
  const [deletedGalleryIds, setDeletedGalleryIds] = useState([])
  
  // 選項資料
  const [availableAuthors, setAvailableAuthors] = useState(['王小明', '李小華', '張大同', '陳美美'])
  const [availableCategories, setAvailableCategories] = useState([
    { id: '1', name: '數位藝術', description: '數位媒體創作' },
    { id: '2', name: '實驗影像', description: '影像實驗作品' },
    { id: '3', name: '互動裝置', description: '互動科技藝術' },
    { id: '4', name: '聲音藝術', description: '聲音創作' }
  ])
  const [availableTags, setAvailableTags] = useState(['數位藝術', '互動設計', '創意', '實驗', '影像', '聲音', '裝置藝術'])
  const [projectYears, setProjectYears] = useState(['2020', '2021', '2022', '2023', '2024', '2025'])
  const [projectSemesters, setProjectSemesters] = useState(['大一下', '大二上', '大二下', '大三上', '大三下', '大四上', '大四下', '碩士班'])
  
  // 輸入狀態
  const [authorInput, setAuthorInput] = useState('')
  const [tagInput, setTagInput] = useState('')

  // 載入作品資料和選項
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
        
        // 修復：正確處理 gallery_images 數據格式
        const processedData = {
          ...data,
          authors: Array.isArray(data.authors) ? 
            data.authors.map(a => typeof a === 'object' ? a.name : a) : 
            [data.author],
          categories: Array.isArray(data.categories) ? 
            data.categories.map(c => c.id) : 
            [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          social_links: Array.isArray(data.social_links) ? data.social_links : [],
          gallery_video_urls: Array.isArray(data.gallery_videos) ? 
            data.gallery_videos.map(v => v.url || v) : 
            [],
          // 修復：正確處理 gallery_images
          gallery_images: Array.isArray(data.gallery_images) ? 
            data.gallery_images.map(img => {
              // 處理不同格式的圖片數據
              if (typeof img === 'string') {
                return { url: img, id: null }
              } else if (typeof img === 'object') {
                return {
                  url: img.url || img.image_url,
                  id: img.id,
                  key: img.key || img.image_key
                }
              }
              return null
            }).filter(Boolean) : 
            []
        }
        
        // 設置表單數據
        setFormData({
          title: processedData.title,
          description: processedData.description,
          video_url: processedData.video_url || '',
          authors: processedData.authors,
          categories: processedData.categories,
          tags: processedData.tags,
          social_links: processedData.social_links.length > 0 ? 
            processedData.social_links : [''],
          gallery_video_urls: processedData.gallery_video_urls.length > 0 ? 
            processedData.gallery_video_urls : [''],
          project_year: processedData.project_year || '',
          project_semester: processedData.project_semester || '',
          disclaimer_accepted: true
        })
        
        // 設置主圖片
        setMainImagePreview(processedData.main_image_url)
        
        // 修復：設置 gallery 圖片
        if (processedData.gallery_images && processedData.gallery_images.length > 0) {
          setExistingGalleryImages(processedData.gallery_images)
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
      try {
        const authorsRes = await fetch(`${apiUrl}/authors`)
        if (authorsRes.ok) {
          const authors = await authorsRes.json()
          setAvailableAuthors(authors.map(a => a.name))
        }
      } catch (e) {
        console.log('Using default authors')
      }
      
      // 載入類別
      try {
        const categoriesRes = await fetch(`${apiUrl}/categories`)
        if (categoriesRes.ok) {
          const categories = await categoriesRes.json()
          setAvailableCategories(categories)
        }
      } catch (e) {
        console.log('Using default categories')
      }
      
      // 載入標籤
      try {
        const tagsRes = await fetch(`${apiUrl}/tags`)
        if (tagsRes.ok) {
          const tags = await tagsRes.json()
          setAvailableTags(tags.map(t => t.name))
        }
      } catch (e) {
        console.log('Using default tags')
      }
      
      // 載入專題資訊
      try {
        const projectRes = await fetch(`${apiUrl}/project-info`)
        if (projectRes.ok) {
          const projectInfo = await projectRes.json()
          setProjectYears(projectInfo.years || projectYears)
          setProjectSemesters(projectInfo.semesters || projectSemesters)
        }
      } catch (e) {
        console.log('Using default project info')
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
  
  const { getRootProps: getMainProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  })
  
  // Gallery 圖片上傳
  const onDropGallery = useCallback((acceptedFiles) => {
    setGalleryImages(prev => [...prev, ...acceptedFiles])
    
    acceptedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, { 
          url: e.target.result, 
          name: file.name,
          isNew: true 
        }])
      }
      reader.readAsDataURL(file)
    })
  }, [])
  
  const { getRootProps: getGalleryProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onDropGallery,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'] },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  })
  
  // 作者管理
  const addAuthor = () => {
    if (authorInput && !formData.authors.includes(authorInput)) {
      setFormData({ ...formData, authors: [...formData.authors, authorInput] })
      setAuthorInput('')
    }
  }
  
  const removeAuthor = (index) => {
    setFormData({
      ...formData,
      authors: formData.authors.filter((_, i) => i !== index)
    })
  }
  
  // 標籤管理
  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] })
      setTagInput('')
    }
  }
  
  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    })
  }
  
  // 類別管理
  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }
  
  // 社群連結管理
  const updateSocialLink = (index, value) => {
    const newLinks = [...formData.social_links]
    newLinks[index] = value
    setFormData({ ...formData, social_links: newLinks })
  }
  
  const addSocialLink = () => {
    setFormData({ ...formData, social_links: [...formData.social_links, ''] })
  }
  
  const removeSocialLink = (index) => {
    setFormData({
      ...formData,
      social_links: formData.social_links.filter((_, i) => i !== index)
    })
  }
  
  // Gallery 影片連結管理
  const updateVideoUrl = (index, value) => {
    const newUrls = [...formData.gallery_video_urls]
    newUrls[index] = value
    setFormData({ ...formData, gallery_video_urls: newUrls })
  }
  
  const addVideoUrl = () => {
    setFormData({ ...formData, gallery_video_urls: [...formData.gallery_video_urls, ''] })
  }
  
  const removeVideoUrl = (index) => {
    setFormData({
      ...formData,
      gallery_video_urls: formData.gallery_video_urls.filter((_, i) => i !== index)
    })
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
  
  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || formData.authors.length === 0 || formData.categories.length === 0) {
      setError('請填寫必填欄位')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setError('請先登入')
        navigate('/login')
        return
      }
      
      const formDataToSend = new FormData()
      
      // 基本資料
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description || '')
      formDataToSend.append('video_url', formData.video_url || '')
      formDataToSend.append('authors', JSON.stringify(formData.authors))
      formDataToSend.append('categories', JSON.stringify(formData.categories))
      formDataToSend.append('tags', JSON.stringify(formData.tags))
      formDataToSend.append('social_links', JSON.stringify(formData.social_links.filter(l => l)))
      formDataToSend.append('gallery_video_urls', JSON.stringify(formData.gallery_video_urls.filter(v => v)))
      formDataToSend.append('project_year', formData.project_year || '')
      formDataToSend.append('project_semester', formData.project_semester || '')
      
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
      formDataToSend.append('new_gallery_count', galleryImages.length.toString())
      
      // 使用正確的 API endpoint
      const response = await fetch(`${apiUrl}/artwork/${artworkId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('作品更新成功！')
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
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">編輯作品</h1>
            <p className="text-gray-500">修改您的作品資訊</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本資訊區塊 */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-medium mb-4">基本資訊</h2>
              
              {/* 作品標題 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  作品標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              {/* 作品說明 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  作品說明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.description.length}/2000
                </div>
              </div>
              
              {/* 影片連結 */}
              <div>
                <label className="block text-sm font-medium mb-2">影片連結</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="YouTube 或 Vimeo 連結"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* 創作者與分類區塊 */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-medium mb-4">創作者與分類</h2>
              
              {/* 作者 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  作者 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                    placeholder="輸入作者姓名"
                    list="authors-list"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="authors-list">
                    {availableAuthors.map(author => (
                      <option key={author} value={author} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={addAuthor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    新增
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.authors.map((author, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm">
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 作品類別 - 多選 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  作品類別 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`p-3 text-left border-2 rounded-lg transition-all relative ${
                        formData.categories.includes(category.id)
                          ? 'bg-gray-800 border-blue-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                      {formData.categories.includes(category.id) && (
                        <span className="absolute top-2 right-2 text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 標籤 */}
              <div>
                <label className="block text-sm font-medium mb-2">標籤</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="輸入標籤"
                    list="tags-list"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="tags-list">
                    {availableTags.map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    新增
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 圖片與媒體區塊 */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-medium mb-4">圖片與媒體</h2>
              
              {/* 主要圖片 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  主要圖片 <span className="text-red-500">*</span>
                </label>
                <div {...getMainProps()} className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600">
                  <input {...getMainInputProps()} />
                  {mainImagePreview ? (
                    <div>
                      <img src={mainImagePreview} alt="預覽" className="max-h-64 mx-auto rounded" />
                      <p className="text-sm text-gray-500 mt-2">點擊或拖曳以更換圖片</p>
                    </div>
                  ) : (
                    <div>
                      {isMainDragActive ? (
                        <p>放開以上傳圖片...</p>
                      ) : (
                        <p>點擊或拖曳圖片到此處</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">支援 JPG, PNG, GIF，最大 5MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Gallery 圖片區域 */}
              <div className="form-section">
                <h3>其他展示圖片</h3>
                
                {/* 顯示現有的 gallery 圖片 */}
                {existingGalleryImages && existingGalleryImages.length > 0 && (
                  <div className="existing-gallery">
                    <p className="section-hint">現有圖片（勾選要刪除的圖片）：</p>
                    <div className="gallery-grid">
                      {existingGalleryImages.map((image, index) => (
                        <div key={image.id || index} className="gallery-item">
                          <img 
                            src={image.url} 
                            alt={`Gallery ${index + 1}`}
                            onError={(e) => {
                              console.error('Image load error:', image.url)
                              e.target.src = '/placeholder-image.png' // 提供預設圖片
                            }}
                          />
                          <label className="delete-checkbox">
                            <input
                              type="checkbox"
                              checked={deletedGalleryIds.includes(image.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDeletedGalleryIds([...deletedGalleryIds, image.id])
                                } else {
                                  setDeletedGalleryIds(deletedGalleryIds.filter(id => id !== image.id))
                                }
                              }}
                            />
                            <span>刪除</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 新增圖片的 dropzone */}
                <div className="add-gallery">
                  <p className="section-hint">新增圖片（最多 10 張）：</p>
                  <div {...getGalleryProps()} className={`dropzone ${isGalleryDragActive ? 'active' : ''}`}>
                    <input {...getGalleryInputProps()} />
                    {galleryPreviews.length > 0 ? (
                      <div className="gallery-preview-grid">
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="preview-item">
                            <img src={preview.url || preview} alt={`New ${index + 1}`} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeGalleryImage(index)
                              }}
                              className="remove-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <p>拖放圖片到這裡，或點擊選擇</p>
                        <p className="hint">最多 10 張，每張最大 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Gallery 影片連結 */}
              <div>
                <label className="block text-sm font-medium mb-2">其他作品影片</label>
                {formData.gallery_video_urls.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateVideoUrl(index, e.target.value)}
                      placeholder="YouTube 或 Vimeo 連結"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    {formData.gallery_video_urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideoUrl(index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVideoUrl}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + 新增影片連結
                </button>
              </div>
            </div>
            
            {/* 專題區收錄 */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-medium mb-4">專題區收錄</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* 創作年份 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    創作年份 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project_year}
                    onChange={(e) => setFormData({ ...formData, project_year: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">請選擇</option>
                    {projectYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {/* 年級學期 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    年級學期 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project_semester}
                    onChange={(e) => setFormData({ ...formData, project_semester: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">請選擇</option>
                    {projectSemesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* 社群連結區塊 */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-medium mb-4">社群連結</h2>
              
              {formData.social_links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateSocialLink(index, e.target.value)}
                    placeholder="Instagram, Facebook, 個人網站等"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {formData.social_links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="px-3 py-2 text-red-400 hover:text-red-300"
                    >
                      刪除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSocialLink}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + 新增社群連結
              </button>
            </div>
            
            {/* 免責聲明 */}
            <div className="bg-gray-900 rounded-lg p-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.disclaimer_accepted}
                  onChange={(e) => setFormData({ ...formData, disclaimer_accepted: e.target.checked })}
                  className="mt-1"
                  required
                />
                <div>
                  <span className="font-medium">我已閱讀並同意免責聲明</span>
                  <ul className="text-sm text-gray-500 mt-2 space-y-1">
                    <li>• 我確認擁有此作品的著作權或已獲得合法授權</li>
                    <li>• 我同意將作品展示於新沒系館網站</li>
                    <li>• 我理解作品將公開展示，並可能被分享或評論</li>
                  </ul>
                </div>
              </label>
            </div>
            
            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            {/* 提交按鈕 */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate('/my-artworks')}
                className="px-6 py-2 border border-gray-700 rounded-lg hover:bg-gray-800"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.disclaimer_accepted}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '更新中...' : '更新作品'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default EditArtworkPage