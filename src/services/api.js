// /src/services/api.js - API 調用優化
const API_URL = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';

// 快取管理
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

// 重試機制
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 秒

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 基礎 fetch 封裝，包含重試機制
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // 如果是 503 錯誤，進行重試
    if (response.status === 503 && retries > 0) {
      console.log(`503 錯誤，${RETRY_DELAY}ms 後重試... (剩餘 ${retries} 次)`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`網路錯誤，重試中... (剩餘 ${retries} 次)`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// 快取的 GET 請求
async function getCached(endpoint, options = {}) {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
  
  // 檢查快取
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }
  
  // 發送請求
  const response = await fetchWithRetry(`${API_URL}${endpoint}`, options);
  
  if (response.ok) {
    const data = await response.json();
    
    // 儲存到快取
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  throw new Error(`API Error: ${response.status}`);
}

// API 服務物件
const apiService = {
  // 獲取所有作品（帶快取）
  async getArtworks() {
    return getCached('/artworks');
  },
  
  // 獲取單一作品（帶快取）
  async getArtwork(id) {
    return getCached(`/artwork/${id}`);
  },
  
  // 獲取作者列表（帶快取）
  async getAuthors() {
    try {
      // 優先嘗試帶統計的 endpoint
      return await getCached('/authors-with-counts');
    } catch (error) {
      // 備用方案
      console.log('使用備用 authors API');
      return getCached('/authors');
    }
  },
  
  // 獲取類別（帶快取）
  async getCategories() {
    return getCached('/categories');
  },
  
  // 獲取標籤（帶快取）
  async getTags() {
    return getCached('/tags');
  },
  
  // 獲取專題資訊（帶快取）
  async getProjectInfo() {
    return getCached('/project-info');
  },
  
  // 獲取用戶作品（需要認證，不快取）
  async getUserArtworks(token) {
    const response = await fetchWithRetry(`${API_URL}/user/artworks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return response.json();
    }
    
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    
    throw new Error(`API Error: ${response.status}`);
  },
  
  // 提交作品
  async submitArtwork(formData, token) {
    const response = await fetchWithRetry(`${API_URL}/artwork/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      // 清除相關快取
      this.clearCache('/artworks');
      return response.json();
    }
    
    const error = await response.json();
    throw new Error(error.error || '提交失敗');
  },
  
  // 更新作品
  async updateArtwork(id, formData, token) {
    const response = await fetchWithRetry(`${API_URL}/artwork/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      // 清除相關快取
      this.clearCache('/artworks');
      this.clearCache(`/artwork/${id}`);
      return response.json();
    }
    
    const error = await response.json();
    throw new Error(error.error || '更新失敗');
  },
  
  // 刪除作品
  async deleteArtwork(id, token) {
    const response = await fetchWithRetry(`${API_URL}/artwork/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // 清除相關快取
      this.clearCache('/artworks');
      this.clearCache(`/artwork/${id}`);
      return response.json();
    }
    
    throw new Error('刪除失敗');
  },
  
  // 清除特定快取
  clearCache(endpoint) {
    for (const [key] of cache) {
      if (key.startsWith(endpoint)) {
        cache.delete(key);
      }
    }
  },
  
  // 清除所有快取
  clearAllCache() {
    cache.clear();
  },
  
  // 預載入資料
  async preloadData() {
    const promises = [
      this.getArtworks(),
      this.getAuthors(),
      this.getCategories(),
      this.getTags(),
      this.getProjectInfo()
    ];
    
    try {
      await Promise.all(promises);
      console.log('資料預載入完成');
    } catch (error) {
      console.error('預載入失敗:', error);
    }
  }
};

// 在應用啟動時預載入資料
if (typeof window !== 'undefined') {
  // 延遲預載入，避免影響首次渲染
  setTimeout(() => {
    apiService.preloadData();
  }, 1000);
}

export default apiService;