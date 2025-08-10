/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `新沒系館 NMANODEPT`,
    description: `新沒系館（NMANODEPT）是專為新媒體藝術系學生打造的虛擬系館，收錄、展示並保存各類創作，促進交流與合作。`,
    author: `@nmanodept`,
    siteUrl: `https://nmanodept.com`,
  },  flags: {
    DEV_SSR: true // 開發時啟用 SSR
  },
  plugins: [
    // 圖片處理
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    
    // React Helmet for SEO
    `gatsby-plugin-react-helmet`,
    
    // 處理 src/images 資料夾
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    
    // Manifest 設定
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `NMAnodept`,
        short_name: `Gallery`,
        start_url: `/`,
        background_color: `#000000`,
        theme_color: `#ffffff`,
        display: `minimal-ui`,
        icon: `src/images/logo.png`,
      },
    },
    
    // Sitemap
    `gatsby-plugin-sitemap`,
    
    // Tailwind CSS
    `gatsby-plugin-postcss`,
    
    // 環境變數
    {
      resolve: `gatsby-plugin-env-variables`,
      options: {
        allowList: [
          "GATSBY_API_URL",
          "GATSBY_R2_URL",
          "GATSBY_ADMIN_SECRET"
        ]
      },
    },
  ],
}