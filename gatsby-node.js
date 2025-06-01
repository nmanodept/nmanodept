// gatsby-node.js
const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  // 暫時使用靜態資料測試
  // 之後應該從 API 獲取所有作品並動態生成
  
  // 作品頁面
  const artworkIds = [1, 2, 3]; // 測試用 ID
  artworkIds.forEach(id => {
    createPage({
      path: `/art/${id}`,
      component: path.resolve('./src/templates/artwork.jsx'),
      context: {
        id: id.toString(),
      },
    });
  });
  
  // 作者頁面
  const authors = ['Rav', '張藝術', '李創作']; // 測試用作者名稱
  authors.forEach(author => {
    createPage({
      path: `/author/${encodeURIComponent(author)}/`,
      component: path.resolve('./src/templates/author.jsx'),
      context: {
        author: author,
      },
    });
  });
};

// 在 build 時獲取資料的更好方式（未來實作）
exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions;
  
  // 未來可以在這裡從 API 獲取所有作品資料
  // 並建立 GraphQL 節點供靜態生成使用
};