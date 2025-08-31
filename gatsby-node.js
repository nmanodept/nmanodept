// gatsby-node.js - 完整修復版
const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  try {
    // 從 API 獲取所有作品（包含內測作品）
    const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev';
    const response = await fetch(`${apiUrl}/artworks`);
    const artworks = await response.json();
    
    console.log(`開始建立 ${artworks.length} 個作品頁面...`);
    
    // 為每個作品建立靜態頁面
    artworks.forEach(artwork => {
      createPage({
        path: `/art/${artwork.id}`,
        component: path.resolve('./src/templates/artwork.jsx'),
        context: {
          id: artwork.id.toString(),
          artwork: artwork // 傳遞完整的作品資料
        },
      });
    });
    
    // 獲取有作品的作者
    const authorsResponse = await fetch(`${apiUrl}/authors`);
    const allAuthors = await authorsResponse.json();
    
    // 只為有作品的作者建立頁面
    const authorsWithArtworks = allAuthors.filter(author => {
      // 檢查是否有作品包含此作者
      return artworks.some(artwork => {
        const authors = Array.isArray(artwork.authors) ? artwork.authors :
                       typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : [];
        return authors.includes(author.name);
      });
    });
    
    console.log(`建立 ${authorsWithArtworks.length} 個作者頁面...`);
    
    authorsWithArtworks.forEach(author => {
      createPage({
        path: `/author/${encodeURIComponent(author.name)}/`,
        component: path.resolve('./src/templates/author.jsx'),
        context: {
          author: author.name,
          authorId: author.id
        },
      });
    });
    
    console.log(`成功建立 ${artworks.length} 個作品頁面和 ${authorsWithArtworks.length} 個作者頁面`);
    
  } catch (error) {
    console.error('Error creating pages:', error);
  }
};

// 處理客戶端路由 - 修復 edit-artwork 路由
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage, deletePage } = actions;

  // 處理 my-artworks 頁面
  if (page.path.match(/^\/my-artworks/)) {
    deletePage(page);
    createPage({
      ...page,
      matchPath: "/my-artworks/*"
    });
  }
  
  // 處理 edit-artwork 頁面 - 關鍵修復
  if (page.path === '/edit-artwork/[id]/') {
    deletePage(page);
    createPage({
      ...page,
      path: '/edit-artwork/:id',
      matchPath: '/edit-artwork/:id'
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
};

// 配置 webpack
exports.onCreateWebpackConfig = ({ stage, actions, getConfig }) => {
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
  
  // 在開發環境中禁用某些優化以提高穩定性
  if (stage === 'develop') {
    const config = getConfig();
    config.devtool = 'cheap-module-source-map';
    config.cache = {
      type: 'filesystem',
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

// 處理 SSR 問題
exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
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
};