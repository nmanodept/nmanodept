// src/pages/art/[id].jsx
import React from 'react'
import ArtworkTemplate from '../../templates/artwork'

export default function ArtworkPage({ params }) {
  return <ArtworkTemplate pageContext={{ id: params.id }} />
}