// src/components/forms/SubmitForm/index.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { navigate } from 'gatsby';
import Button from '../../common/Button';
import './SubmitForm.css';

const SubmitForm = () => {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      authors: [], 
      tags: [],
      categories: [], // 改為多選
      gallery_images: [],
      gallery_video_urls: [''],
      social_links: [''],
      project_years: [], // 新增學年度多選
      project_semesters: [] // 新增年級學期多選
    }
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [projectYearInput, setProjectYearInput] = useState('');
  const [projectSemesterInput, setProjectSemesterInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProjectYears, setAvailableProjectYears] = useState([]);
  const [availableProjectSemesters, setAvailableProjectSemesters] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showProjectYearSuggestions, setShowProjectYearSuggestions] = useState(false);
  const [showProjectSemesterSuggestions, setShowProjectSemesterSuggestions] = useState(false);

  const description = watch('description', '');

  useEffect(() => {
    fetchAuthors();
    fetchCategories();
    fetchTags();
    fetchProjectInfo();
  }, []);

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

  // 類別管理 - 新增多選功能
  const handleAddCategory = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const category = categoryInput.trim();
      if (category) {
        const existingCategory = availableCategories.find(c => c.name === category);
        if (existingCategory && !watch('categories').some(c => c.id === existingCategory.id)) {
          setValue('categories', [...watch('categories'), existingCategory]);
          setCategoryInput('');
          setShowCategorySuggestions(false);
        }
      }
    }
  };

  const addCategoryFromSuggestion = (category) => {
    if (!watch('categories').some(c => c.id === category.id)) {
      setValue('categories', [...watch('categories'), category]);
    }
    setCategoryInput('');
    setShowCategorySuggestions(false);
  };

  const removeCategory = (categoryToRemove) => {
    setValue('categories', watch('categories').filter(cat => cat.id !== categoryToRemove.id));
  };

  // 學年度管理
  const handleAddProjectYear = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const year = projectYearInput.trim();
      if (year && !watch('project_years').includes(year)) {
        setValue('project_years', [...watch('project_years'), year]);
        setProjectYearInput('');
        setShowProjectYearSuggestions(false);
      }
    }
  };

  const addProjectYearFromSuggestion = (year) => {
    if (!watch('project_years').includes(year)) {
      setValue('project_years', [...watch('project_years'), year]);
    }
    setProjectYearInput('');
    setShowProjectYearSuggestions(false);
  };

  const removeProjectYear = (yearToRemove) => {
    setValue('project_years', watch('project_years').filter(year => year !== yearToRemove));
  };

  // 年級學期管理
  const handleAddProjectSemester = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const semester = projectSemesterInput.trim();
      if (semester && !watch('project_semesters').includes(semester)) {
        setValue('project_semesters', [...watch('project_semesters'), semester]);
        setProjectSemesterInput('');
        setShowProjectSemesterSuggestions(false);
      }
    }
  };

  const addProjectSemesterFromSuggestion = (semester) => {
    if (!watch('project_semesters').includes(semester)) {
      setValue('project_semesters', [...watch('project_semesters'), semester]);
    }
    setProjectSemesterInput('');
    setShowProjectSemesterSuggestions(false);
  };

  const removeProjectSemester = (semesterToRemove) => {
    setValue('project_semesters', watch('project_semesters').filter(semester => semester !== semesterToRemove));
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
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formData = new FormData();
      
      formData.append('title', data.title);
      formData.append('authors', JSON.stringify(data.authors));
      formData.append('year', data.year.toString());
      formData.append('video_url', data.video_url);
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('categories', JSON.stringify(data.categories.map(c => c.id))); // 多類別
      formData.append('description', data.description);
      formData.append('project_years', JSON.stringify(data.project_years));
      formData.append('project_semesters', JSON.stringify(data.project_semesters));
      
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
      const response = await fetch(`${apiUrl}/submit`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        reset();
        setPreviewImage(null);
        setGalleryPreviews([]);
        setTagInput('');
        setAuthorInput('');
        setCategoryInput('');
        setProjectYearInput('');
        setProjectSemesterInput('');
        setValue('social_links', ['']);
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        throw new Error(result.error || '提交失敗');
      }
    } catch (error) {
      console.error('提交錯誤：', error);
      setSubmitStatus('error');
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

  const filteredCategories = availableCategories.filter(category => 
    category.name.toLowerCase().includes(categoryInput.toLowerCase()) &&
    !watch('categories').some(c => c.id === category.id)
  );

  const filteredProjectYears = availableProjectYears.filter(year => 
    year.toLowerCase().includes(projectYearInput.toLowerCase()) &&
    !watch('project_years').includes(year)
  );

  const filteredProjectSemesters = availableProjectSemesters.filter(semester => 
    semester.toLowerCase().includes(projectSemesterInput.toLowerCase()) &&
    !watch('project_semesters').includes(semester)
  );

  // 滾動到底部以顯示提示訊息
  useEffect(() => {
    if (submitStatus) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [submitStatus]);

  return (
    <>
      {/* 成功/錯誤訊息 */}
      {submitStatus === 'success' && (
        <div className="alert alert-success">
          <div className="alert-icon">✓</div>
          <div>
            <p className="alert-title">作品提交成功！</p>
            <p className="alert-message">您的作品已送出審核，將在3秒後返回首頁...</p>
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

        {/* 作品類別 - 改為多選 */}
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
              <div className="relative">
                <div className="category-tags">
                  {field.value.map((category) => (
                    <span key={category.id} className="category-tag">
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
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setShowCategorySuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleAddCategory}
                  onFocus={() => setShowCategorySuggestions(categoryInput.length > 0)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                  className={`form-input ${errors.categories ? 'error' : ''}`}
                  placeholder="選擇類別（可多選）"
                />
                
                {/* 類別建議下拉選單 */}
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className="suggestions-dropdown">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCategoryFromSuggestion(category)}
                        className="suggestion-item"
                      >
                        {category.name}
                        {category.description && (
                          <span className="suggestion-desc"> - {category.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.categories && <p className="form-error">{errors.categories.message}</p>}
        </div>

        {/* 創作年份 */}
        <div className="form-group">
          <label htmlFor="year" className="form-label">
            創作年份 <span className="required">*</span>
          </label>
          <input
            type="number"
            id="year"
            {...register('year', {
              required: '請輸入創作年份',
              min: { value: 1900, message: '年份不能小於 1900' },
              max: { value: new Date().getFullYear() + 1, message: '年份不能大於明年' }
            })}
            className={`form-input ${errors.year ? 'error' : ''}`}
            placeholder="例如：2025"
          />
          {errors.year && <p className="form-error">{errors.year.message}</p>}
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

        {/* 專題區收錄 - 改為多選輸入 */}
        <div className="form-section">
          <h3 className="section-title">專題區收錄 <span className="required">*</span></h3>
          
          {/* 學年度 - 多選 */}
          <div className="form-group">
            <label className="form-label">學年度</label>
            <Controller
              name="project_years"
              control={control}
              rules={{ 
                validate: value => value.length > 0 || '請至少新增一個學年度'
              }}
              render={({ field }) => (
                <div className="relative">
                  <div className="tag-list">
                    {field.value.map((year, index) => (
                      <span key={index} className="tag-item">
                        {year}
                        <button
                          type="button"
                          onClick={() => removeProjectYear(year)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={projectYearInput}
                    onChange={(e) => {
                      setProjectYearInput(e.target.value);
                      setShowProjectYearSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={handleAddProjectYear}
                    onFocus={() => setShowProjectYearSuggestions(projectYearInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowProjectYearSuggestions(false), 200)}
                    className={`form-input ${errors.project_years ? 'error' : ''}`}
                    placeholder="例如：112，按 Enter 新增"
                  />
                  
                  {/* 學年度建議下拉選單 */}
                  {showProjectYearSuggestions && filteredProjectYears.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredProjectYears.map((year, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addProjectYearFromSuggestion(year)}
                          className="suggestion-item"
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
            {errors.project_years && <p className="form-error">{errors.project_years.message}</p>}
          </div>

          {/* 年級學期 - 多選 */}
          <div className="form-group">
            <label className="form-label">年級學期</label>
            <Controller
              name="project_semesters"
              control={control}
              rules={{ 
                validate: value => value.length > 0 || '請至少新增一個年級學期'
              }}
              render={({ field }) => (
                <div className="relative">
                  <div className="tag-list">
                    {field.value.map((semester, index) => (
                      <span key={index} className="tag-item">
                        {semester}
                        <button
                          type="button"
                          onClick={() => removeProjectSemester(semester)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={projectSemesterInput}
                    onChange={(e) => {
                      setProjectSemesterInput(e.target.value);
                      setShowProjectSemesterSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={handleAddProjectSemester}
                    onFocus={() => setShowProjectSemesterSuggestions(projectSemesterInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowProjectSemesterSuggestions(false), 200)}
                    className={`form-input ${errors.project_semesters ? 'error' : ''}`}
                    placeholder="例如：大二下，按 Enter 新增"
                  />
                  
                  {/* 年級學期建議下拉選單 */}
                  {showProjectSemesterSuggestions && filteredProjectSemesters.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredProjectSemesters.map((semester, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addProjectSemesterFromSuggestion(semester)}
                          className="suggestion-item"
                        >
                          {semester}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
            {errors.project_semesters && <p className="form-error">{errors.project_semesters.message}</p>}
          </div>
        </div>

        {/* 送出按鈕 */}
        <div className="form-actions">
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交作品'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default SubmitForm;