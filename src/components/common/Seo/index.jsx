// src/components/common/Seo/Seo.jsx
import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

const Seo = ({ title, description, image, article }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            defaultTitle: title
            defaultDescription: description
            siteUrl
            author
          }
        }
      }
    `
  )

  const {
    defaultTitle,
    defaultDescription,
    siteUrl,
    author,
  } = site.siteMetadata

  const Seo = {
    title: title ? `${title} | ${defaultTitle}` : defaultTitle,
    description: description || defaultDescription,
    image: image ? `${siteUrl}${image}` : null,
    url: siteUrl,
  }

  return (
    <Helmet>
      <title>{Seo.title}</title>
      <meta name="description" content={Seo.description} />
      <meta name="image" content={Seo.image} />

      {/* Open Graph */}
      <meta property="og:url" content={Seo.url} />
      {article && <meta property="og:type" content="article" />}
      <meta property="og:title" content={Seo.title} />
      <meta property="og:description" content={Seo.description} />
      {Seo.image && <meta property="og:image" content={Seo.image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={author} />
      <meta name="twitter:title" content={Seo.title} />
      <meta name="twitter:description" content={Seo.description} />
      {Seo.image && <meta name="twitter:image" content={Seo.image} />}
    </Helmet>
  )
}

export default Seo