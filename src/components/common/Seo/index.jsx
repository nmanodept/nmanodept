// /src/components/common/Seo/index.jsx
import React from 'react'
import { Helmet } from 'react-helmet'

const Seo = ({ title, description, image, pathname }) => {
  const siteUrl = process.env.GATSBY_SITE_URL || 'https://your-site.com'
  const defaultTitle = '藝術作品平台'
  const defaultDescription = '探索並分享精彩的藝術創作'
  const defaultImage = '/default-og-image.jpg'
  
  const seo = {
    title: title ? `${title} | ${defaultTitle}` : defaultTitle,
    description: description || defaultDescription,
    image: image || `${siteUrl}${defaultImage}`,
    url: `${siteUrl}${pathname || ''}`
  }
  
  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <link rel="icon" href="/favicon.ico" />
    </Helmet>
  )
}

export default Seo