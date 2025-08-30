// gatsby-node.js - 完整的路由配置
const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  try {
    // 從 API 獲取所有作品（包含內測作品）
    const response = await fetch('https://artwork-submit-api.nmanodept.workers.dev/artworks');
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
    const authorsResponse = await fetch('https://artwork-submit-api.nmanodept.workers.dev/authors');
    const allAuthors = await authorsResponse.json();
    
    // 只為有作品的作者建立頁面
    const authorsWithArtworks = allAuthors.filter(author => {
      // 檢查是否有作品包含此作者
      return artworks.some(artwork => 
        artwork.authors && artwork.authors.includes(author.name)
      );
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

// 處理客戶端路由
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage, deletePage } = actions

  // 處理 my-artworks 頁面
  if (page.path.match(/^\/my-artworks/)) {
    deletePage(page);
    createPage({
      ...page,
      matchPath: "/my-artworks/*"
    });
  }
  
  // 處理 edit-artwork 頁面 - 使用客戶端路由
  if (page.path.match(/^\/edit-artwork/)) {
    deletePage(page);
    createPage({
      ...page,
      matchPath: "/edit-artwork/*"
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
      },
    },
  });
  
  // 在開發環境中禁用某些優化以提高穩定性
  if (stage === 'develop') {
    const config = getConfig();
    config.devtool = 'cheap-module-source-map';
    actions.replaceWebpackConfig(config);
  }
};

// 自定義 Babel 配置
exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-optional-chaining',
  });
};