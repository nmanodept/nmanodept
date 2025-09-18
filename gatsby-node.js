// gatsby-node.js - 完整修復版
const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  try {
    // 從 API 獲取所有作品（包含內測作品）
    const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
    
    console.log(`正在從 ${apiUrl} 獲取作品資料...`);
    
    const response = await fetch(`${apiUrl}/artworks`, {
      timeout: 30000, // 30 秒超時
    });
    
    if (!response.ok) {
      throw new Error(`API 響應錯誤: ${response.status} ${response.statusText}`);
    }
    
    const artworks = await response.json();
    
    // 確保返回的是陣列
    const artworksArray = Array.isArray(artworks) ? artworks : [];
    
    if (!Array.isArray(artworks)) {
      console.warn('API 返回的作品資料不是陣列，使用空陣列');
    }
    
    console.log(`開始建立 ${artworksArray.length} 個作品頁面...`);
    
    // 為每個作品建立靜態頁面 - 確保正確傳遞 artwork context
    artworksArray.forEach(artwork => {
      try {
        // 驗證作品資料
        if (!artwork || !artwork.id) {
          console.warn('跳過無效的作品資料:', artwork);
          return;
        }
        
        // 處理資料格式，確保陣列格式正確
        const processedArtwork = {
          ...artwork,
          tags: Array.isArray(artwork.tags) ? artwork.tags : 
                typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : [],
          authors: Array.isArray(artwork.authors) ? artwork.authors :
                   typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : 
                   artwork.author ? [artwork.author] : [],
          categories: Array.isArray(artwork.categories) ? artwork.categories :
                      typeof artwork.categories === 'string' ? JSON.parse(artwork.categories || '[]') :
                      artwork.category_name && artwork.category_id ? 
                      [{ id: artwork.category_id, name: artwork.category_name }] : []
        };

        createPage({
          path: `/art/${artwork.id}`,
          component: path.resolve('./src/templates/artwork.jsx'),
          context: {
            id: artwork.id.toString(),
            artwork: processedArtwork // 傳遞處理過的完整作品資料
          },
        });
      } catch (pageError) {
        console.error(`創建作品頁面失敗: ${artwork.id}`, pageError);
      }
    });
    
    // 獲取有作品的作者
    console.log('正在獲取作者資料...');
    
    const authorsResponse = await fetch(`${apiUrl}/authors`, {
      timeout: 30000, // 30 秒超時
    });
    
    if (!authorsResponse.ok) {
      console.warn(`無法獲取作者資料: ${authorsResponse.status}`);
      return; // 跳過作者頁面創建，但不影響作品頁面
    }
    
    const allAuthors = await authorsResponse.json();
    const allAuthorsArray = Array.isArray(allAuthors) ? allAuthors : [];
    
    // 只為有作品的作者建立頁面
    const authorsWithArtworks = allAuthorsArray.filter(author => {
      // 檢查是否有作品包含此作者
      return artworksArray.some(artwork => {
        const authors = Array.isArray(artwork.authors) ? artwork.authors :
                       typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : [];
        return authors.includes(author.name);
      });
    });
    
    console.log(`建立 ${authorsWithArtworks.length} 個作者頁面...`);
    
    authorsWithArtworks.forEach(author => {
      try {
        createPage({
          path: `/author/${encodeURIComponent(author.name)}/`,
          component: path.resolve('./src/templates/author.jsx'),
          context: {
            author: author.name,
            authorId: author.id
          },
        });
      } catch (pageError) {
        console.error(`創建作者頁面失敗: ${author.name}`, pageError);
      }
    });
    
    console.log(`成功建立 ${artworksArray.length} 個作品頁面和 ${authorsWithArtworks.length} 個作者頁面`);
    
  } catch (error) {
    console.error('Error creating pages:', error);
    // 不要讓錯誤完全中止構建過程
    console.log('繼續構建過程...');
  }
};

// 處理客戶端路由 - 修復 edit-artwork 路由
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage, deletePage } = actions;

  try {
    // 處理 my-artworks 頁面
    if (page.path.match(/^\/my-artworks/)) {
      deletePage(page);
      createPage({
        ...page,
        matchPath: "/my-artworks/*"
      });
    }
    
    // 處理 edit-artwork 頁面 - 關鍵修復
    if (page.path === '/edit-artwork/') {
      deletePage(page);
      createPage({
        ...page,
        matchPath: '/edit-artwork/*'
      });
    }
    
    // 處理 author-profile 頁面
    if (page.path.match(/^\/author-profile/)) {
      deletePage(page);
      createPage({
        ...page,
        matchPath: "/author-profile/*"
      });
    }
    
    // 處理其他動態路由
    if (page.path.match(/^\/art\//)) {
      // 確保作品頁面路由正確
      createPage({
        ...page,
        matchPath: "/art/*"
      });
    }
    
    if (page.path.match(/^\/author\//)) {
      // 確保作者頁面路由正確  
      createPage({
        ...page,
        matchPath: "/author/*"
      });
    }
    
  } catch (error) {
    console.error('Error in onCreatePage:', error);
    // 繼續執行，不要讓錯誤阻止頁面創建
  }
};

// 配置 webpack
exports.onCreateWebpackConfig = ({ stage, actions, getConfig, loaders }) => {
  const config = getConfig();
  
  // 基礎配置
  actions.setWebpackConfig({
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
  });
  
  // 處理 SSR 問題
  if (stage === "build-html" || stage === "develop-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /bad-module/,
            use: loaders.null(),
          },
        ],
      },
    });
  }
  
  // 在生產環境中優化
  if (stage === 'build-javascript') {
    actions.setWebpackConfig({
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              chunks: 'all'
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      }
    });
  }
  
  // 在開發環境中優化快取配置
  if (stage === 'develop') {
    config.devtool = 'cheap-module-source-map';
    
    // 優化快取配置以減少大型字串序列化問題
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      // 限制快取大小和序列化
      maxMemoryGenerations: 1,
      memoryCacheUnaffected: true,
      // 使用更高效的序列化策略
      compression: 'gzip',
      // 分離大型資料的快取
      store: 'pack',
      version: '1.0.0'
    };
    
    // 優化快取策略
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      // 減少不必要的字串序列化
      concatenateModules: false,
    };
    
    actions.replaceWebpackConfig(config);
  }
};

// 自定義 Babel 配置
exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-optional-chaining',
  });
  
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-nullish-coalescing-operator',
  });
};

// 處理 SSR 問題 - 合併到主要的 webpack 配置中
// 這個函數已經被上面的 onCreateWebpackConfig 取代