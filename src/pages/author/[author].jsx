// src/pages/author/[author].jsx
import React from 'react'
import AuthorTemplate from '../../templates/author'

export default function AuthorPage({ params }) {
  return <AuthorTemplate pageContext={{ author: decodeURIComponent(params.author) }} />
}