import React, { useState, useEffect } from 'react';
import { Link } from 'gatsby';
import Layout from '../components/common/Layout';
import Seo from '../components/common/Seo';
import Loading from '../components/common/Loading';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlayIcon,
  LinkIcon,
  EnvelopeIcon, // 修正：從 MailIcon 改為 EnvelopeIcon
  FolderIcon
} from '@heroicons/react/24/outline';

// 先檢查 react-icons 是否已安裝
const FaInstagram = () => <span>IG</span>;
const FaGithub = () => <span>GH</span>;
const FaBehance = () => <span>BE</span>;
const FaDribbble = () => <span>DR</span>;
const FaLinkedin = () => <span>LI</span>;
const FaGlobe = () => <span>Web</span>;

const ArtworkTemplate = ({ pageContext }) => {
  const { id } = pageContext;
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaList, setMediaList] = useState([]);
  const [views, setViews] = useState(null);

  // 獲取作品資料
  useEffect(() => {
    fetchArtwork();
    
  }, [id]);


  const fetchArtwork = async () => {
    try {
      // 使用正確的環境變數
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
      const response = await fetch(`${apiUrl}/artwork/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched artwork data:', data); // 除錯用
      
      setArtwork(data);
      
      // 建立媒體列表（主圖 + 影片 + gallery）
      const media = [];
      
      // 主圖
      if (data.main_image_url) {
        media.push({
          type: 'image',
          url: data.main_image_url,
          title: '作品主圖'
        });
      }
      
      // 主影片
      if (data.video_url) {
        media.push({
          type: 'video',
          url: data.video_url,
          title: '作品紀錄影片',
          embedUrl: getEmbedUrl(data.video_url)
        });
      }
      
      // Gallery 圖片
      if (data.gallery_images && Array.isArray(data.gallery_images)) {
        data.gallery_images.forEach((url, index) => {
          media.push({
            type: 'image',
            url: url,
            title: `展示圖片 ${index + 1}`
          });
        });
      }
      
      // Gallery 影片
      if (data.gallery_videos && Array.isArray(data.gallery_videos)) {
        data.gallery_videos.forEach((url, index) => {
          media.push({
            type: 'video',
            url: url,
            title: `展示影片 ${index + 1}`,
            embedUrl: getEmbedUrl(url)
          });
        });
      }
      
      setMediaList(media);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  };


    useEffect(() => {
  if (artwork && artwork.id) {
    // 增加瀏覽次數
    incrementViewCount();
  }
}, [artwork]);

  const incrementViewCount = async () => {
  try {
    const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
    await fetch(`${apiUrl}/artwork/${id}/view`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
};
 

  // 解析影片嵌入網址
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
  };

  // 解析社群連結類型
  const getSocialIcon = (url) => {
    if (!url) return <LinkIcon className="w-5 h-5" />;
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes('instagram.com')) return <FaInstagram />;
    if (urlLower.includes('github.com')) return <FaGithub />;
    if (urlLower.includes('behance.net')) return <FaBehance />;
    if (urlLower.includes('dribbble.com')) return <FaDribbble />;
    if (urlLower.includes('linkedin.com')) return <FaLinkedin />;
    if (urlLower.includes('@') && !urlLower.includes('http')) return <EnvelopeIcon className="w-5 h-5" />;
    return <FaGlobe />;
  };

  // 媒體導航
  const navigateMedia = (direction) => {
    if (direction === 'prev') {
      setCurrentMediaIndex((prev) => 
        prev === 0 ? mediaList.length - 1 : prev - 1
      );
    } else {
      setCurrentMediaIndex((prev) => 
        prev === mediaList.length - 1 ? 0 : prev + 1
      );
    }
  };

  // 載入中
  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <Loading type="spinner" size="lg" text="載入作品中..." />
      </div>
    </Layout>
  );

  // 錯誤狀態
  if (error || !artwork) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '找不到作品'}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            返回首頁
          </Link>
        </div>
      </div>
    </Layout>
  );

  const currentMedia = mediaList[currentMediaIndex] || {};

  return (
    <Layout>
      <Seo 
        title={artwork.title}
        description={artwork.description}
        image={artwork.main_image_url}
      />
      
      {/* 橘色橫幅 */}
      <div className="bg-orange-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm font-medium">
            {artwork.project_year} 級 — {artwork.project_semester} 專題 — 期末 —
          </p>
        </div>
      </div>
      
      {/* 主要內容區 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左側：媒體展示區 */}
          <div className="lg:col-span-2">
            {/* 主圖/影片區 */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
              {mediaList.length > 0 && (
                <>
                  {currentMedia.type === 'image' ? (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.title}
                      className="w-full h-full object-contain"
                    />
                  ) : currentMedia.embedUrl ? (
                    <iframe
                      src={currentMedia.embedUrl}
                      title={currentMedia.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <p>無法載入影片</p>
                    </div>
                  )}
                  
                  {/* 導航按鈕 */}
                  {mediaList.length > 1 && (
                    <>
                      <button
                        onClick={() => navigateMedia('prev')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                        aria-label="上一個"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => navigateMedia('next')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                        aria-label="下一個"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* 縮圖預覽列 */}
            {mediaList.length > 1 && (
              <div className="mt-4 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {mediaList.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`
                        relative flex-shrink-0 w-24 h-18 rounded overflow-hidden
                        ${index === currentMediaIndex ? 'ring-2 ring-orange-500' : 'opacity-70 hover:opacity-100'}
                        transition-opacity
                      `}
                    >
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={media.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <PlayIcon className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 右側：作品資訊 */}
          <div className="space-y-6">
            {/* 標題 */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {artwork.title}
              </h1>
              
              {/* 作者 - 支援多作者 */}
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <span>作者：</span>
                {artwork.authors && artwork.authors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {artwork.authors.map((author, index) => (
                      <span key={index}>
                        <Link 
                          to={`/author/${encodeURIComponent(author)}`}
                          className="hover:underline text-blue-600"
                        >
                          {author}
                        </Link>
                        {index < artwork.authors.length - 1 && <span>、</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Link 
                    to={`/author/${encodeURIComponent(artwork.author)}`}
                    className="hover:underline text-blue-600"
                  >
                    {artwork.author}
                  </Link>
                )}
              </div>
              
              {/* 類別 */}
              {artwork.category_name && (
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <FolderIcon className="w-4 h-4" />
                  類別：{artwork.category_name}
                </p>
              )}
              
              {/* 年份 */}
              <p className="text-gray-600">
                年代：{artwork.year}
              </p>
            </div>
            
            {/* 標籤 */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">類別：</h3>
                <div className="flex flex-wrap gap-2">
                  {artwork.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/search?tags=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* 作品簡介 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">作品簡介：</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {artwork.description}
              </p>
            </div>
            
            {/* 社群連結 - 支援多個 */}
            {(artwork.social_links && artwork.social_links.length > 0) || artwork.social_link ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🔗 links
                </h3>
                <div className="space-y-2">
                  {/* 優先顯示新的多連結格式 */}
                  {artwork.social_links && artwork.social_links.length > 0 ? (
                    artwork.social_links.map((link, index) => (
                      <a
                        key={index}
                        href={link.includes('@') && !link.includes('http') 
                          ? `mailto:${link}`
                          : link.includes('http') 
                          ? link 
                          : `https://${link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mr-2 mb-2"
                      >
                        {getSocialIcon(link)}
                        <span className="text-sm">
                          {link.includes('instagram.com') ? 'Instagram' :
                           link.includes('github.com') ? 'GitHub' :
                           link.includes('behance.net') ? 'Behance' :
                           link.includes('@') ? 'Email' : '查看連結'}
                        </span>
                      </a>
                    ))
                  ) : artwork.social_link ? (
                    // 向後相容：顯示單一連結
                    <a
                      href={artwork.social_link.includes('@') && !artwork.social_link.includes('http') 
                        ? `mailto:${artwork.social_link}`
                        : artwork.social_link.includes('http') 
                        ? artwork.social_link 
                        : `https://${artwork.social_link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {getSocialIcon(artwork.social_link)}
                      <span className="text-sm">查看更多</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArtworkTemplate;