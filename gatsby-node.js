const path = require('path');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  
  // 暫時使用靜態資料測試，之後會從 API 獲取
  // 您可以先在 D1 console 將某個作品的 status 改為 'approved'
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
};