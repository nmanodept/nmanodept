// src/components/forms/SubmitForm/index.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon, PlusIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { navigate } from 'gatsby';

const SubmitForm = () => {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      authors: [], 
      tags: [],
      gallery_images: [],
      gallery_video_urls: [''],
      social_links: ['']
    }
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // 新增狀態：可用的作者、標籤和類別
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const description = watch('description', '');

  // 載入可用的作者、標籤和類別
  useEffect(() => {
    fetchAuthors();
    fetchCategories();
    fetchTags();
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

    // 生成預覽
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

  // 標籤管理（更新版 - 支援自動完成）
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
      // 建立 FormData 物件
      const formData = new FormData();
      
      // 添加基本欄位
      formData.append('title', data.title);
      formData.append('authors', JSON.stringify(data.authors));
      formData.append('year', data.year.toString());
      formData.append('video_url', data.video_url);
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('description', data.description);
      formData.append('project_year', data.project_year);
      formData.append('project_semester', data.project_semester);
      formData.append('category_id', data.category_id || '');
      
      // 處理社群連結
      const validSocialLinks = data.social_links.filter(link => link && link.trim() !== '');
      if (validSocialLinks.length > 0) {
        formData.append('social_links', JSON.stringify(validSocialLinks));
      }

      // 添加主圖片
      if (data.image) {
        formData.append('image', data.image);
      }

      // 添加 Gallery 圖片
      if (data.gallery_images && data.gallery_images.length > 0) {
        data.gallery_images.forEach((file) => {
          formData.append('gallery_images[]', file);
        });
      }

      // 添加 Gallery 影片連結
      const validVideoUrls = data.gallery_video_urls.filter(url => url && url.trim() !== '');
      validVideoUrls.forEach(url => {
        formData.append('gallery_video_urls[]', url);
      });

      // 發送 API 請求
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/submit`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // 重置表單
        reset();
        setPreviewImage(null);
        setGalleryPreviews([]);
        setTagInput('');
        setAuthorInput('');
        setValue('social_links', ['']);
        
        // 3秒後跳轉到首頁
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

  // 過濾作者建議
  const filteredAuthors = availableAuthors.filter(author => 
    author.name.toLowerCase().includes(authorInput.toLowerCase()) &&
    !watch('authors').includes(author.name)
  );

  // 過濾標籤建議
  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !watch('tags').includes(tag.name)
  );

  // 滾動到底部以顯示提示訊息
  useEffect(() => {
    if (submitStatus) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [submitStatus]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-8">
        {/* 作品預覽圖 */}
        <div>
          <label htmlFor="main-image" className="block text-sm font-medium text-gray-700 mb-2">
            作品預覽圖 <span className="text-red-500">*</span>
          </label>
          <Controller
            name="image"
            control={control}
            rules={{ required: '請上傳作品預覽圖' }}
            render={({ field }) => (
              <div>
                <div
                  {...getMainRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isMainDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${errors.image ? 'border-red-300' : ''}`}
                >
                  <input {...getMainInputProps()} id="main-image" />
                  {previewImage ? (
                    <div className="relative">
                      <img src={previewImage} alt="預覽" className="max-h-64 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(null);
                          setValue('image', null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">拖放圖片或點擊選擇</p>
                      <p className="text-sm text-gray-500 mt-1">僅接受 JPG, PNG, GIF (最大 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
        </div>

        {/* 作品名稱 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            作品名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { required: '請輸入作品名稱' })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
              ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="輸入作品名稱"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* 作者名稱 - 多作者 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            作者名稱 <span className="text-red-500">*</span>
          </label>
          <Controller
            name="authors"
            control={control}
            rules={{ 
              validate: value => value.length > 0 || '請至少新增一位作者'
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-2">
                  {field.value.map((author, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {author}
                      <button
                        type="button"
                        onClick={() => removeAuthor(author)}
                        className="ml-2 hover:text-blue-900"
                      >
                        <XMarkIcon className="w-4 h-4" />
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
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                    ${errors.authors ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="輸入作者名稱後按 Enter 新增（可多位作者）"
                />
                
                {/* 作者建議下拉選單 */}
                {showAuthorSuggestions && filteredAuthors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredAuthors.map((author) => (
                      <button
                        key={author.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addAuthorFromSuggestion(author.name)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {author.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.authors && <p className="text-red-500 text-sm mt-1">{errors.authors.message}</p>}
        </div>

        {/* 作品類別 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            作品類別 <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            {...register('category_id', { required: '請選擇作品類別' })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
              ${errors.category_id ? 'border-red-300' : 'border-gray-300'}`}
          >
            <option value="">請選擇類別</option>
            {availableCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
        </div>

        {/* 創作年份 */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            創作年份 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="year"
            {...register('year', {
              required: '請輸入創作年份',
              min: { value: 1900, message: '年份不能小於 1900' },
              max: { value: new Date().getFullYear() + 1, message: '年份不能大於明年' }
            })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
              ${errors.year ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="例如：2025"
          />
          {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
        </div>

        {/* 作品紀錄連結 */}
        <div>
          <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-2">
            作品紀錄連結 <span className="text-red-500">*</span>
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
              ${errors.video_url ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="YouTube / Vimeo 等影片連結"
          />
          {errors.video_url && <p className="text-red-500 text-sm mt-1">{errors.video_url.message}</p>}
        </div>

        {/* 作品 Tag（更新版 - 支援自動完成） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            作品標籤 <span className="text-red-500">*</span>
          </label>
          <Controller
            name="tags"
            control={control}
            rules={{ 
              validate: value => value.length > 0 || '請至少新增一個標籤'
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-2">
                  {field.value.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-green-900"
                      >
                        <XMarkIcon className="w-4 h-4" />
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
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                    ${errors.tags ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="輸入標籤後按 Enter 或逗號新增"
                />
                
                {/* 標籤建議下拉選單 */}
                {showTagSuggestions && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTagFromSuggestion(tag.name)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>}
        </div>

        {/* 作品簡介 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            作品簡介 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            {...register('description', { required: '請輸入作品簡介' })}
            rows={5}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
              ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="請介紹你的作品..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            <p className="text-sm text-gray-500 ml-auto">字數：{description.length}</p>
          </div>
        </div>

        {/* 相關連結 - 支援多個 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            相關連結
          </label>
          <Controller
            name="social_links"
            control={control}
            defaultValue={['']}
            render={({ field }) => (
              <div className="space-y-2">
                {field.value.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => updateSocialLink(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instagram、GitHub、個人網站、Email 等"
                    />
                    {field.value.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  新增連結
                </button>
              </div>
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            可新增多個社群媒體、作品集或聯絡方式連結
          </p>
        </div>

        {/* Gallery 區域 */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">其他作品圖片／影片</h3>

          {/* Gallery 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              其他展示圖片
            </label>
            <div
              {...getGalleryRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isGalleryDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getGalleryInputProps()} />
              <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-1 text-sm">拖放圖片或點擊選擇（可多選）</p>
            </div>

            {/* Gallery 預覽 */}
            {galleryPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview.url} alt={preview.name} className="w-full h-32 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gallery 影片連結 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              額外影片連結
            </label>
            {watch('gallery_video_urls').map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateVideoUrl(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入影片連結"
                />
                {watch('gallery_video_urls').length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVideoUrl(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVideoUrl}
              className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              新增影片連結
            </button>
          </div>
        </div>

        {/* 專題區收錄 */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">專題區收錄 <span className="text-red-500">*</span></h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-year" className="block text-sm font-medium text-gray-700 mb-2">
                學年度
              </label>
              <input
                type="text"
                id="project-year"
                {...register('project_year', { required: '請輸入學年度' })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                  ${errors.project_year ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例如：112"
              />
              {errors.project_year && <p className="text-red-500 text-sm mt-1">{errors.project_year.message}</p>}
            </div>
            <div>
              <label htmlFor="project-semester" className="block text-sm font-medium text-gray-700 mb-2">
                年級學期
              </label>
              <input
                type="text"
                id="project-semester"
                {...register('project_semester', { required: '請輸入年級學期' })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                  ${errors.project_semester ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例如：大二下"
              />
              {errors.project_semester && <p className="text-red-500 text-sm mt-1">{errors.project_semester.message}</p>}
            </div>
          </div>
        </div>

        {/* 送出按鈕 */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium
              ${isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isSubmitting ? '提交中...' : '提交作品'}
          </button>
        </div>
      </form>

      {/* 成功/錯誤訊息（移到底部） */}
      {submitStatus && (
        <div className="mt-6">
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">作品提交成功！</p>
                <p className="text-green-600 text-sm">您的作品已送出審核，將在3秒後返回首頁...</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-red-800 font-medium">提交失敗</p>
                <p className="text-red-600 text-sm">請檢查您的網路連線並重試</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SubmitForm;