//Location: /gatsby-ssr.js
import React from "react"
import { AuthProvider } from "./src/components/auth/AuthContext"

export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>
}