// gatsby-node.js
const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  try {
    // 從 API 獲取所有已審核的作品（包含需要免責聲明的）
    const response = await fetch('https://artwork-submit-api.nmanodept.workers.dev/artworks');
    const artworks = await response.json();
    
    // 為每個作品建立頁面
    artworks.forEach(artwork => {
      createPage({
        path: `/art/${artwork.id}`,
        component: path.resolve('./src/templates/artwork.jsx'),
        context: {
          id: artwork.id.toString(),
        },
      });
    });
    
    // 獲取有作品的作者
    const authorsResponse = await fetch('https://artwork-submit-api.nmanodept.workers.dev/authors-with-counts');
    const authorsWithCounts = await authorsResponse.json();
    
    // 只為有作品的作者建立頁面
    const authorsWithArtworks = authorsWithCounts.filter(author => author.artwork_count > 0);
    
    authorsWithArtworks.forEach(author => {
      createPage({
        path: `/author/${encodeURIComponent(author.name)}/`,
        component: path.resolve('./src/templates/author.jsx'),
        context: {
          author: author.name,
          authorId: author.id,
          artworkCount: author.artwork_count
        },
      });
    });
    
    console.log(`建立了 ${artworks.length} 個作品頁面和 ${authorsWithArtworks.length} 個作者頁面`);
    
  } catch (error) {
    console.error('Error creating pages:', error);
  }
};

// 處理客戶端路由
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  // 確保 my-artworks 頁面正確生成
  if (page.path.match(/^\/my-artworks/)) {
    page.matchPath = "/my-artworks/*"
    createPage(page)
  }
  
  // 確保 edit-artwork 頁面支援動態路由
  if (page.path.match(/^\/edit-artwork/)) {
    page.matchPath = "/edit-artwork/*"
    createPage(page)
  }
}

// 配置 webpack 以支援動態導入
exports.onCreateWebpackConfig = ({ stage, actions }) => {
  actions.setWebpackConfig({
    resolve: {
      fallback: {
        fs: false,
        path: false,
      },
    },
  })
}