// src/utils/api/artworks.js - API utilities for artwork operations

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8787' 
  : 'https://upload.nmanodept.workers.dev';

/**
 * Submit artwork form data
 * @param {FormData} formData - Form data including images and artwork info
 * @returns {Promise<Object>} Response data
 */
export const submitArtwork = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/submit`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '提交失敗');
  }

  return response.json();
};

/**
 * Get all approved artworks
 * @returns {Promise<Object>} List of approved artworks
 */
export const getArtworks = async () => {
  const response = await fetch(`${API_BASE_URL}/artworks`);

  if (!response.ok) {
    throw new Error('無法取得作品資料');
  }

  return response.json();
};

/**
 * Get single artwork by ID
 * @param {string} id - Artwork ID
 * @returns {Promise<Object>} Artwork data
 */
export const getArtworkById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/artwork/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('找不到該作品');
    }
    throw new Error('無法取得作品資料');
  }

  return response.json();
};

/**
 * Transform artwork data for display
 * @param {Object} artwork - Raw artwork data
 * @returns {Object} Transformed artwork data
 */
export const transformArtwork = (artwork) => {
  return {
    ...artwork,
    tags: typeof artwork.tags === 'string' ? JSON.parse(artwork.tags) : artwork.tags,
    galleryImages: typeof artwork.gallery_images === 'string' 
      ? JSON.parse(artwork.gallery_images) 
      : artwork.gallery_images || [],
    galleryVideoUrls: typeof artwork.gallery_video_urls === 'string'
      ? JSON.parse(artwork.gallery_video_urls)
      : artwork.gallery_video_urls || [],
  };
};

/**
 * Get image URL from filename
 * @param {string} filename - Image filename
 * @returns {string} Full image URL
 */
export const getImageUrl = (filename) => {
  if (!filename) return null;
  return `https://gallery.nmanodept.com/${filename}`;
};

/**
 * Parse YouTube/Vimeo URL to get embed URL
 * @param {string} url - Video URL
 * @returns {string|null} Embed URL or null if not supported
 */
export const getVideoEmbedUrl = (url) => {
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

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};