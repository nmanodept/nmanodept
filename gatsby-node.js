// gatsby-node.js
const path = require('path');
const fetch = require('node-fetch');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  try {
    // 從 API 獲取所有已審核的作品
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
    
    // 建立作者頁面
    const authors = [...new Set(artworks.map(a => a.author))];
    authors.forEach(author => {
      createPage({
        path: `/author/${encodeURIComponent(author)}/`,
        component: path.resolve('./src/templates/author.jsx'),
        context: {
          author: author,
        },
      });
    });
  } catch (error) {
    console.error('Error creating pages:', error);
  }
};

// 加入 onCreatePage 來處理 my-artworks 頁面
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  // 確保 my-artworks 頁面正確生成
  if (page.path.match(/^\/my-artworks/)) {
    page.matchPath = "/my-artworks/*"
    createPage(page)
  }
}