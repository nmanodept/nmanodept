// src/pages/author-profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/common/Layout';
import Seo from '../components/common/Seo';
import Button from '../components/common/Button';
import { 
  UserCircleIcon, 
  PhotoIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const AuthorProfilePage = () => {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      social_links: ['']
    }
  });

  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // 載入可用的作者
  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch(`${process.env.GATSBY_API_URL}/authors`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAuthors(data);
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  };

  // 頭像上傳
  const onDropAvatar = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setValue('avatar', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAvatar,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false
  });

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
      
      // 基本資料
      formData.append('author_id', data.author_id);
      formData.append('bio', data.bio);
      
      // 社群連結
      const validSocialLinks = data.social_links.filter(link => link && link.trim() !== '');
      if (validSocialLinks.length > 0) {
        formData.append('social_links', JSON.stringify(validSocialLinks));
      }

      // 頭像
      if (data.avatar) {
        formData.append('avatar', data.avatar);
      }

      // 發送 API 請求
      const response = await fetch(`${process.env.GATSBY_API_URL}/author-profile/submit`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // 重置表單
        reset();
        setAvatarPreview(null);
        setValue('social_links', ['']);
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

  return (
    <Layout>
      <Seo 
        title="補充作者資料" 
        description="為您的作者頁面新增個人介紹、頭像和社交連結"
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* 頁面標題 */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">補充作者資料</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              豐富您的作者頁面，讓更多人認識您！請選擇您的作者名稱並填寫個人資料。
            </p>
          </div>

          {/* 表單區域 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
            {/* 成功/錯誤訊息 */}
            {submitStatus === 'success' && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">資料提交成功！</p>
                  <p className="text-green-600 text-sm">您的作者資料已送出審核，審核通過後將更新您的作者頁面。</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-red-800 font-medium">提交失敗</p>
                  <p className="text-red-600 text-sm">請檢查您的網路連線並重試</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 選擇作者 */}
              <div>
                <label htmlFor="author-select" className="block text-sm font-medium text-gray-700 mb-2">
                  選擇您的作者名稱 <span className="text-red-500">*</span>
                </label>
                <select
                  id="author-select"
                  {...register('author_id', { required: '請選擇作者名稱' })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                    ${errors.author_id ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">請選擇</option>
                  {availableAuthors.map(author => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
                {errors.author_id && <p className="text-red-500 text-sm mt-1">{errors.author_id.message}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  找不到您的名字？請先投稿作品，系統會自動建立您的作者資料。
                </p>
              </div>

              {/* 頭像上傳 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  個人頭像
                </label>
                <Controller
                  name="avatar"
                  control={control}
                  render={({ field }) => (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <input {...getInputProps()} />
                      {avatarPreview ? (
                        <div className="relative inline-block">
                          <img 
                            src={avatarPreview} 
                            alt="頭像預覽" 
                            className="w-32 h-32 rounded-full object-cover mx-auto"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAvatarPreview(null);
                              setValue('avatar', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
                          <p className="mt-2 text-sm">拖放圖片或點擊選擇</p>
                          <p className="text-xs text-gray-500 mt-1">建議使用正方形圖片 (最大 2MB)</p>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* 個人簡介 */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  個人簡介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  {...register('bio', { 
                    required: '請輸入個人簡介',
                    minLength: { value: 50, message: '簡介至少需要 50 字' }
                  })}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500
                    ${errors.bio ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="介紹您自己、您的創作理念、經歷等..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && <p className="text-red-500 text-sm">{errors.bio.message}</p>}
                  <p className="text-sm text-gray-500 ml-auto">字數：{watch('bio')?.length || 0}</p>
                </div>
              </div>

              {/* 社交連結 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  社交媒體連結
                </label>
                <Controller
                  name="social_links"
                  control={control}
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
              </div>

              {/* 提交按鈕 */}
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
                  {isSubmitting ? '提交中...' : '提交資料'}
                </button>
              </div>
            </form>
          </div>

          {/* 注意事項 */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">注意事項</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>提交的資料需要經過管理員審核</li>
                <li>審核通過後，您的作者頁面將顯示這些資訊</li>
                <li>每位作者只能有一份審核通過的資料</li>
                <li>如需更新資料，請重新提交，舊資料將被取代</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthorProfilePage;