//Location: /gatsby-browser.js
import React from "react"
import "./src/styles/global.css"
import { AuthProvider } from "./src/components/auth/AuthContext"

// 包裝根元素以提供認證狀態
export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>
}

// 頁面切換時的處理
export const onRouteUpdate = ({ location, prevLocation }) => {
  console.log("Route changed from", prevLocation, "to", location)
}

// 客戶端渲染時的處理
export const onClientEntry = () => {
  console.log("Gallery app started!")
}

// Service Worker 更新時的處理
export const onServiceWorkerUpdateReady = () => {
  const answer = window.confirm(
    `網站有新版本可用，是否要重新載入以更新？`
  )
  if (answer === true) {
    window.location.reload()
  }
}