/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `NMAnodept`,
    description: `NMAnodept`,
    author: `@nmanodept`,
    siteUrl: `https://gallery.nmanodept.com`,
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