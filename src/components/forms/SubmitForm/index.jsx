// src/components/forms/SubmitForm/index.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { navigate } from 'gatsby'
import { useAuth } from '../../auth/AuthContext'
import Button from '../../common/Button'
import './SubmitForm.css'

const SubmitForm = () => {
  const { user } = useAuth();
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      authors: user?.authorName ? [user.authorName] : [], // 預設為當前用戶的 authorName
      tags: [],
      categories: [], // 多選
      gallery_images: [],
      gallery_video_urls: [''],
      social_links: [''],
      project_year: '', // 單一創作年份
      project_semester: '', // 單一年級學期
      disclaimer_accepted: false // 新增免責聲明勾選
    }
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProjectYears, setAvailableProjectYears] = useState([]);
  const [availableProjectSemesters, setAvailableProjectSemesters] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const description = watch('description', '');
  
  // 監聽所有表單數據變化以便自動保存
  const formData = watch();

  useEffect(() => {
    fetchAuthors();
    fetchCategories();
    fetchTags();
    fetchProjectInfo();
  }, []);

  // 從 localStorage 讀取草稿
  useEffect(() => {
    const draft = localStorage.getItem('artwork_draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        // 詢問是否要恢復草稿
        if (window.confirm('發現未完成的草稿，是否要恢復？')) {
          // 恢復可序列化的表單數據
          Object.keys(draftData).forEach(key => {
            if (key !== 'image' && key !== 'gallery_images') {
              setValue(key, draftData[key]);
            }
          });
        }
      } catch (error) {
        console.error('讀取草稿失敗:', error);
        localStorage.removeItem('artwork_draft');
      }
    }
  }, [setValue]);

  // 自動保存草稿（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      // 創建可序列化的數據副本（排除文件對象）
      const draftData = {
        title: formData.title,
        authors: formData.authors,
        video_url: formData.video_url,
        tags: formData.tags,
        categories: formData.categories,
        description: formData.description,
        project_year: formData.project_year,
        project_semester: formData.project_semester,
        social_links: formData.social_links,
        gallery_video_urls: formData.gallery_video_urls,
        disclaimer_accepted: formData.disclaimer_accepted
      };
      
      // 只有當表單有內容時才保存草稿
      if (draftData.title || draftData.description || (draftData.authors && draftData.authors.length > 0)) {
        localStorage.setItem('artwork_draft', JSON.stringify(draftData));
      }
    }, 30000); // 30秒
    
    return () => clearInterval(interval);
  }, [formData]);

  // 當用戶登入後，自動設定作者為當前用戶的 authorName
  useEffect(() => {
    if (user?.authorName && watch('authors').length === 0) {
      setValue('authors', [user.authorName]);
    }
  }, [user, setValue, watch]);

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/authors`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAuthors(data);
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/categories`);
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/tags`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchProjectInfo = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/project-info`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProjectYears(data.years || []);
        setAvailableProjectSemesters(data.semesters || []);
      }
    } catch (error) {
      console.error('Failed to fetch project info:', error);
    }
  };

  // 主圖片上傳
  const onDropMain = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setValue('image', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [setValue]);

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  });

  // Gallery 圖片上傳
  const onDropGallery = useCallback((acceptedFiles) => {
    const currentGallery = watch('gallery_images') || [];
    const newFiles = [...currentGallery, ...acceptedFiles];
    setValue('gallery_images', newFiles);

    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, { url: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  }, [setValue, watch]);

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onDropGallery,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  });

  // 作者管理
  const handleAddAuthor = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const author = authorInput.trim();
      if (author && !watch('authors').includes(author)) {
        setValue('authors', [...watch('authors'), author]);
        setAuthorInput('');
        setShowAuthorSuggestions(false);
      }
    }
  };

  const addAuthorFromSuggestion = (authorName) => {
    if (!watch('authors').includes(authorName)) {
      setValue('authors', [...watch('authors'), authorName]);
    }
    setAuthorInput('');
    setShowAuthorSuggestions(false);
  };

  const removeAuthor = (authorToRemove) => {
    setValue('authors', watch('authors').filter(author => author !== authorToRemove));
  };

  // 標籤管理
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !watch('tags').includes(tag)) {
        setValue('tags', [...watch('tags'), tag]);
        setTagInput('');
        setShowTagSuggestions(false);
      }
    }
  };

  const addTagFromSuggestion = (tagName) => {
    if (!watch('tags').includes(tagName)) {
      setValue('tags', [...watch('tags'), tagName]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setValue('tags', watch('tags').filter(tag => tag !== tagToRemove));
  };

  // 類別管理 - 多選功能
  const addCategoryFromSuggestion = (category) => {
    if (!watch('categories').some(c => c.id === category.id)) {
      setValue('categories', [...watch('categories'), category]);
    }
  };

  const removeCategory = (categoryToRemove) => {
    setValue('categories', watch('categories').filter(cat => cat.id !== categoryToRemove.id));
  };

  // Gallery 影片連結管理
  const addVideoUrl = () => {
    const urls = watch('gallery_video_urls');
    setValue('gallery_video_urls', [...urls, '']);
  };

  const removeVideoUrl = (index) => {
    const urls = watch('gallery_video_urls');
    setValue('gallery_video_urls', urls.filter((_, i) => i !== index));
  };

  const updateVideoUrl = (index, value) => {
    const urls = watch('gallery_video_urls');
    urls[index] = value;
    setValue('gallery_video_urls', [...urls]);
  };

  // 移除 Gallery 圖片
  const removeGalleryImage = (index) => {
    const images = watch('gallery_images');
    setValue('gallery_images', images.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 社群連結管理
  const addSocialLink = () => {
    setValue('social_links', [...watch('social_links'), '']);
  };

  const removeSocialLink = (index) => {
    setValue('social_links', watch('social_links').filter((_, i) => i !== index));
  };

  const updateSocialLink = (index, value) => {
    const links = [...watch('social_links')];
    links[index] = value;
    setValue('social_links', links);
  };

  // 表單送出
  const onSubmit = async (data) => {
    // 檢查免責聲明
    if (!data.disclaimer_accepted) {
      alert('請先閱讀並接受免責聲明');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formData = new FormData();
      
      formData.append('title', data.title);
      formData.append('authors', JSON.stringify(data.authors));
      formData.append('video_url', data.video_url);
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('categories', JSON.stringify(data.categories.map(c => c.id))); // 多類別
      formData.append('description', data.description);
      formData.append('project_year', data.project_year); // 單一值
      formData.append('project_semester', data.project_semester); // 單一值
      formData.append('disclaimer_accepted', data.disclaimer_accepted); // 新增免責聲明欄位
      
      const validSocialLinks = data.social_links.filter(link => link && link.trim() !== '');
      if (validSocialLinks.length > 0) {
        formData.append('social_links', JSON.stringify(validSocialLinks));
      }

      if (data.image) {
        formData.append('image', data.image);
      }

      if (data.gallery_images && data.gallery_images.length > 0) {
        data.gallery_images.forEach((file) => {
          formData.append('gallery_images[]', file);
        });
      }

      const validVideoUrls = data.gallery_video_urls.filter(url => url && url.trim() !== '');
      validVideoUrls.forEach(url => {
        formData.append('gallery_video_urls[]', url);
      });

      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}/artwork/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        localStorage.removeItem('artwork_draft');
        reset();
        setPreviewImage(null);
        setGalleryPreviews([]);
        
        setTimeout(() => {
          navigate('/my-artworks');
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || '提交失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      setErrorMessage('提交失敗，請檢查網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 過濾建議
  const filteredAuthors = availableAuthors.filter(author => 
    author.name.toLowerCase().includes(authorInput.toLowerCase()) &&
    !watch('authors').includes(author.name)
  );

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !watch('tags').includes(tag.name)
  );

  // 滾動到頂部以顯示提示訊息
  useEffect(() => {
    if (submitStatus) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitStatus]);

  return (
    <div className="submit-form-container">
      {/* 成功/錯誤訊息 - 移到表單容器內的頂部 */}
      {submitStatus === 'success' && (
        <div className="alert alert-success">
          作品已成功提交並發布！正在跳轉...
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="alert alert-error">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="submit-form">
        {/* 作品預覽圖 */}
        <div className="form-group">
          <label htmlFor="main-image" className="form-label">
            作品預覽圖 <span className="required">*</span>
          </label>
          <Controller
            name="image"
            control={control}
            rules={{ required: '請上傳作品預覽圖' }}
            render={({ field }) => (
              <div>
                <div
                  {...getMainRootProps()}
                  className={`dropzone ${isMainDragActive ? 'active' : ''} ${errors.image ? 'error' : ''}`}
                >
                  <input {...getMainInputProps()} id="main-image" />
                  {previewImage ? (
                    <div className="image-preview-wrapper">
                      <img src={previewImage} alt="預覽" className="image-preview-full" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(null);
                          setValue('image', null);
                        }}
                        className="image-remove"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-content">
                      <svg className="dropzone-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9C3 7.89543 3.89543 7 5 7H6.17157C6.70201 7 7.21071 6.78929 7.58579 6.41421L8.41421 5.58579C8.78929 5.21071 9.29799 5 9.82843 5H14.1716C14.702 5 15.2107 5.21071 15.5858 5.58579L16.4142 6.41421C16.7893 6.78929 17.298 7 17.8284 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V9Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      <p className="dropzone-text">拖放圖片或點擊選擇</p>
                      <p className="dropzone-hint">僅接受 JPG, PNG, GIF (最大 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
          {errors.image && <p className="form-error">{errors.image.message}</p>}
        </div>

        {/* 作品名稱 */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            作品名稱 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { required: '請輸入作品名稱' })}
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="輸入作品名稱"
          />
          {errors.title && <p className="form-error">{errors.title.message}</p>}
        </div>

        {/* 作者名稱 - 多作者 */}
        <div className="form-group">
          <label className="form-label">
            作者名稱 <span className="required">*</span>
          </label>
          <Controller
            name="authors"
            control={control}
            rules={{ 
              validate: value => value.length > 0 || '請至少新增一位作者'
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="author-tags">
                  {field.value.map((author, index) => (
                    <span key={index} className="author-tag">
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(author)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => {
                    setAuthorInput(e.target.value);
                    setShowAuthorSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleAddAuthor}
                  onFocus={() => setShowAuthorSuggestions(authorInput.length > 0)}
                  onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
                  className={`form-input ${errors.authors ? 'error' : ''}`}
                  placeholder="輸入作者名稱後按 Enter 新增（可多位作者）"
                />
                
                {/* 作者建議下拉選單 */}
                {showAuthorSuggestions && filteredAuthors.length > 0 && (
                  <div className="suggestions-dropdown">
                    {filteredAuthors.map((author) => (
                      <button
                        key={author.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addAuthorFromSuggestion(author.name)}
                        className="suggestion-item"
                      >
                        {author.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.authors && <p className="form-error">{errors.authors.message}</p>}
        </div>

        {/* 作品類別 - 多選列表 */}
        <div className="form-group">
          <label className="form-label">
            作品類別 <span className="required">*</span>
          </label>
          <Controller
            name="categories"
            control={control}
            rules={{ 
              validate: value => value.length > 0 || '請至少選擇一個類別'
            }}
            render={({ field }) => (
              <div>
                {/* 已選類別 */}
                {field.value.length > 0 && (
                  <div className="selected-categories">
                    <div className="selected-label">已選擇：</div>
                    <div className="category-tags">
                      {field.value.map((category) => (
                        <span key={category.id} className="category-tag selected">
                          {category.name}
                          <button
                            type="button"
                            onClick={() => removeCategory(category)}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 可選類別列表 */}
                <div className="category-selector">
                  <div className="category-list">
                    {availableCategories.map((category) => {
                      const isSelected = field.value.some(c => c.id === category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              removeCategory(category);
                            } else {
                              addCategoryFromSuggestion(category);
                            }
                          }}
                          className={`category-option ${isSelected ? 'selected' : ''}`}
                        >
                          <span className="category-name">{category.name}</span>
                          {category.description && (
                            <span className="category-desc">{category.description}</span>
                          )}
                          {isSelected && (
                            <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          />
          {errors.categories && <p className="form-error">{errors.categories.message}</p>}
        </div>

        {/* 作品紀錄連結 */}
        <div className="form-group">
          <label htmlFor="video-url" className="form-label">
            作品紀錄連結 <span className="required">*</span>
          </label>
          <input
            type="url"
            id="video-url"
            {...register('video_url', {
              required: '請輸入作品紀錄連結',
              pattern: {
                value: /^https?:\/\/.+/,
                message: '請輸入有效的網址'
              }
            })}
            className={`form-input ${errors.video_url ? 'error' : ''}`}
            placeholder="YouTube / Vimeo 等影片連結"
          />
          {errors.video_url && <p className="form-error">{errors.video_url.message}</p>}
        </div>

        {/* 作品 Tag */}
        <div className="form-group">
          <label className="form-label">
            作品標籤 <span className="required">*</span>
          </label>
          <Controller
            name="tags"
            control={control}
            rules={{ 
              validate: value => value.length > 0 || '請至少新增一個標籤'
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="tag-list">
                  {field.value.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleAddTag}
                  onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  className={`form-input ${errors.tags ? 'error' : ''}`}
                  placeholder="輸入標籤後按 Enter 或逗號新增"
                />
                
                {/* 標籤建議下拉選單 */}
                {showTagSuggestions && filteredTags.length > 0 && (
                  <div className="suggestions-dropdown">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTagFromSuggestion(tag.name)}
                        className="suggestion-item"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.tags && <p className="form-error">{errors.tags.message}</p>}
        </div>

        {/* 作品簡介 */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            作品簡介 <span className="required">*</span>
          </label>
          <textarea
            id="description"
            {...register('description', { required: '請輸入作品簡介' })}
            rows={5}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="請介紹你的作品..."
          />
          <div className="form-footer">
            {errors.description && <p className="form-error">{errors.description.message}</p>}
            <p className="char-count">字數：{description.length}</p>
          </div>
        </div>

        {/* 相關連結 - 支援多個 */}
        <div className="form-group">
          <label className="form-label">相關連結</label>
          <Controller
            name="social_links"
            control={control}
            defaultValue={['']}
            render={({ field }) => (
              <div className="multi-input-list">
                {field.value.map((link, index) => (
                  <div key={index} className="multi-input-item">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => updateSocialLink(index, e.target.value)}
                      className="form-input"
                      placeholder="下載鏈接、相關資料、Instagram、GitHub、個人網站、Email等"
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
                  className="btn-add"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  新增連結
                </button>
              </div>
            )}
          />
          <p className="form-hint">可新增多個社群媒體、作品集或聯絡方式連結</p>
        </div>

        {/* Gallery 區域 */}
        <div className="form-section">
          <h3 className="section-title">其他作品圖片／影片</h3>

          {/* Gallery 圖片上傳 */}
          <div className="form-group">
            <label className="form-label">其他展示圖片</label>
            <div
              {...getGalleryRootProps()}
              className={`dropzone ${isGalleryDragActive ? 'active' : ''}`}
            >
              <input {...getGalleryInputProps()} />
              <div className="dropzone-content">
                <svg className="dropzone-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9C3 7.89543 3.89543 7 5 7H6.17157C6.70201 7 7.21071 6.78929 7.58579 6.41421L8.41421 5.58579C8.78929 5.21071 9.29799 5 9.82843 5H14.1716C14.702 5 15.2107 5.21071 15.5858 5.58579L16.4142 6.41421C16.7893 6.78929 17.298 7 17.8284 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V9Z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <p className="dropzone-text">拖放圖片或點擊選擇（可多選）</p>
              </div>
            </div>

            {/* Gallery 預覽 */}
            {galleryPreviews.length > 0 && (
              <div className="gallery-previews">
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className="gallery-preview-item">
                    <img src={preview.url} alt={preview.name} />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="image-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gallery 影片連結 */}
          <div className="form-group">
            <label className="form-label">額外影片連結</label>
            <div className="multi-input-list">
              {watch('gallery_video_urls').map((url, index) => (
                <div key={index} className="multi-input-item">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateVideoUrl(index, e.target.value)}
                    className="form-input"
                    placeholder="輸入影片連結"
                  />
                  {watch('gallery_video_urls').length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideoUrl(index)}
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
                onClick={addVideoUrl}
                className="btn-add"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                新增影片連結
              </button>
            </div>
          </div>
        </div>

        {/* 專題區收錄 */}
        <div className="form-section">
          <h3 className="section-title">專題區收錄 <span className="required">*</span></h3>
          
          <div className="form-grid">
            {/* 創作年份（單選） */}
            <div className="form-group">
              <label htmlFor="project-year" className="form-label">
                創作年份 <span className="required">*</span>
              </label>
              <select
                id="project-year"
                {...register('project_year', { required: '請選擇創作年份' })}
                className={`form-select ${errors.project_year ? 'error' : ''}`}
              >
                <option value="">請選擇創作年份</option>
                {/* 預設選項 */}
                {['2020', '2021', '2022', '2023', '2024', '2025'].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
                {/* 從資料庫來的選項 */}
                {availableProjectYears
                  .filter(year => !['2020', '2021', '2022', '2023', '2024', '2025'].includes(year))
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
              {errors.project_year && <p className="form-error">{errors.project_year.message}</p>}
            </div>

            {/* 年級學期（單選） */}
            <div className="form-group">
              <label htmlFor="project-semester" className="form-label">
                年級學期 <span className="required">*</span>
              </label>
              <select
                id="project-semester"
                {...register('project_semester', { required: '請選擇年級學期' })}
                className={`form-select ${errors.project_semester ? 'error' : ''}`}
              >
                <option value="">請選擇年級學期</option>
                {/* 預設選項 */}
                {['大一下', '大二上', '大二下', '大三上', '大三下', '大四上', '大四下', '碩士班', '未分類'].map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
                {/* 從資料庫來的選項 */}
                {availableProjectSemesters
                  .filter(semester => !['大一下', '大二上', '大二下', '大三上', '大三下', '大四上', '大四下', '碩士班', '未分類'].includes(semester))
                  .map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
              </select>
              {errors.project_semester && <p className="form-error">{errors.project_semester.message}</p>}
            </div>
          </div>
        </div>

        {/* 免責聲明區塊 */}
        <div className="form-section">
          <h2>免責聲明</h2>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="disclaimer"
              {...register('disclaimer_accepted', { 
                required: '請接受免責聲明' 
              })}
              className={errors.disclaimer_accepted ? 'error' : ''}
            />
            <label htmlFor="disclaimer" className="checkbox-label">
              我已閱讀並同意以下條款：
              <ul className="disclaimer-list">
                <li>我確認擁有此作品的著作權或已獲得合法授權</li>
                <li>我同意將作品展示於新沒系館網站</li>
                <li>我理解作品將公開展示，並可能被分享或評論</li>
                <li>我保證作品內容不違反法律規定及道德規範</li>
                <li>我同意網站管理者有權移除不當內容而不另行通知</li>
              </ul>
            </label>
          </div>
          {errors.disclaimer_accepted && (
            <span className="error-message">{errors.disclaimer_accepted.message}</span>
          )}
        </div>

        {/* 提交按鈕 */}
        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // 儲存草稿功能
              const draftData = {
                title: formData.title,
                authors: formData.authors,
                video_url: formData.video_url,
                tags: formData.tags,
                categories: formData.categories,
                description: formData.description,
                project_year: formData.project_year,
                project_semester: formData.project_semester,
                social_links: formData.social_links,
                gallery_video_urls: formData.gallery_video_urls,
                disclaimer_accepted: formData.disclaimer_accepted
              };
              localStorage.setItem('artwork_draft', JSON.stringify(draftData));
              alert('草稿已儲存');
            }}
          >
            儲存草稿
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !watch('disclaimer_accepted')}
          >
            {isSubmitting ? '提交中...' : '提交作品'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubmitForm;