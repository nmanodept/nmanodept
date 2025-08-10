// /src/components/common/Seo/index.jsx
import React from 'react'
import { Helmet } from 'react-helmet'

const Seo = ({ title, description, image, pathname }) => {
  const siteUrl = process.env.GATSBY_SITE_URL || 'https://www.nmanodept.com'
  const defaultTitle = 'NMAnodept'
  const defaultDescription = '新沒系館是一個一個虛擬的「系館」——因為我們沒有真正的系館。'
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