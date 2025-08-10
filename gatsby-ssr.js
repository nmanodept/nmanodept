// gatsby-ssr.js
import React from "react"
import { AuthProvider } from "./src/components/auth/AuthContext"

// 使用 wrapRootElement 包裹整個應用，確保 SSR 時也有 AuthProvider
// 這確保了服務端渲染和客戶端渲染的一致性
export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>
}
