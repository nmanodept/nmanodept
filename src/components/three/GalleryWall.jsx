import React, { useEffect, useRef, useState } from 'react'
import { navigate } from 'gatsby'

const GalleryWall = ({ artworks = [], onArtworkClick }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || artworks.length === 0) return

    const loadThree = async () => {
      try {
        const THREE = await import('three')
        
        // 檢測移動設備
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
        
        // 場景設置
        const scene = new THREE.Scene()
        scene.fog = new THREE.Fog(0x050505, 30, 150)
        
        const camera = new THREE.PerspectiveCamera(
          isMobile ? 70 : 75, 
          window.innerWidth / window.innerHeight, 
          0.1, 
          1000
        )
        camera.position.set(0, 0, 40)
        
        const renderer = new THREE.WebGLRenderer({ 
          antialias: !isMobile,
          alpha: true,
          powerPreference: "high-performance"
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2))
        renderer.shadowMap.enabled = !isMobile
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        containerRef.current.appendChild(renderer.domElement)
        
        // 燈光設置
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
        scene.add(ambientLight)
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
        mainLight.position.set(20, 20, 10)
        if (!isMobile) {
          mainLight.castShadow = true
          mainLight.shadow.mapSize.width = 1024
          mainLight.shadow.mapSize.height = 1024
        }
        scene.add(mainLight)
        
        const fillLight = new THREE.PointLight(0x4080ff, 0.3, 50)
        fillLight.position.set(-15, 10, 20)
        scene.add(fillLight)
        
        // 創建畫廊牆面
        const createGalleryWall = () => {
          const group = new THREE.Group()
          const textureLoader = new THREE.TextureLoader()
          const artworkMeshes = []
          
          // 牆面配置
          const wallConfig = {
            rows: isMobile ? 3 : 4,
            cols: isMobile ? 4 : 6,
            spacing: 8,
            baseSize: isMobile ? 5 : 6
          }
          
          const totalArtworks = Math.min(artworks.length, wallConfig.rows * wallConfig.cols)
          
          artworks.slice(0, totalArtworks).forEach((artwork, index) => {
            const row = Math.floor(index / wallConfig.cols)
            const col = index % wallConfig.cols
            
            // 隨機大小變化
            const sizeVariation = 0.7 + Math.random() * 0.6
            const width = wallConfig.baseSize * sizeVariation
            const height = wallConfig.baseSize * sizeVariation * (0.8 + Math.random() * 0.4)
            
            // 創建幾何體和材質
            const geometry = new THREE.PlaneGeometry(width, height)
            const material = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide
            })
            
            const mesh = new THREE.Mesh(geometry, material)
            
            // 計算位置 - 創建不規則的牆面佈局
            const baseX = (col - (wallConfig.cols - 1) / 2) * wallConfig.spacing
            const baseY = ((wallConfig.rows - 1) / 2 - row) * wallConfig.spacing
            
            mesh.position.set(
              baseX + (Math.random() - 0.5) * 2,
              baseY + (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 2
            )
            
            // 輕微旋轉
            mesh.rotation.z = (Math.random() - 0.5) * 0.1
            
            // 載入藝術品圖片
            if (artwork.main_image_url) {
              textureLoader.load(
                artwork.main_image_url,
                (texture) => {
                  material.map = texture
                  material.needsUpdate = true
                },
                undefined,
                (error) => {
                  console.warn('無法載入圖片:', artwork.id, error)
                  // 創建預設紋理
                  const canvas = document.createElement('canvas')
                  canvas.width = canvas.height = 256
                  const ctx = canvas.getContext('2d')
                  
                  const gradient = ctx.createLinearGradient(0, 0, 256, 256)
                  gradient.addColorStop(0, `hsl(${Math.random() * 360}, 50%, 60%)`)
                  gradient.addColorStop(1, `hsl(${Math.random() * 360}, 30%, 40%)`)
                  
                  ctx.fillStyle = gradient
                  ctx.fillRect(0, 0, 256, 256)
                  
                  // 添加標題文字
                  ctx.fillStyle = 'rgba(255,255,255,0.8)'
                  ctx.font = '16px Arial'
                  ctx.textAlign = 'center'
                  ctx.fillText(artwork.title || `作品 #${artwork.id}`, 128, 128)
                  
                  const fallbackTexture = new THREE.CanvasTexture(canvas)
                  material.map = fallbackTexture
                  material.needsUpdate = true
                }
              )
            }
            
            // 邊框
            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(geometry),
              new THREE.LineBasicMaterial({ 
                color: 0xffffff, 
                opacity: 0.2, 
                transparent: true 
              })
            )
            mesh.add(edges)
            
            // 陰影
            if (!isMobile) {
              mesh.castShadow = true
              mesh.receiveShadow = true
            }
            
            // 存儲藝術品數據
            mesh.userData = {
              artwork,
              originalPosition: mesh.position.clone(),
              originalRotation: mesh.rotation.clone(),
              time: Math.random() * Math.PI * 2,
              hoverScale: 1,
              targetHoverScale: 1
            }
            
            artworkMeshes.push(mesh)
            group.add(mesh)
          })
          
          return { group, meshes: artworkMeshes }
        }
        
        const { group: wallGroup, meshes: artworkMeshes } = createGalleryWall()
        scene.add(wallGroup)
        
        // 互動系統
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let hoveredMesh = null
        
        const updateMouse = (clientX, clientY) => {
          mouse.x = (clientX / window.innerWidth) * 2 - 1
          mouse.y = -(clientY / window.innerHeight) * 2 + 1
        }
        
        const handleClick = (event) => {
          updateMouse(event.clientX, event.clientY)
          raycaster.setFromCamera(mouse, camera)
          
          const intersects = raycaster.intersectObjects(artworkMeshes)
          if (intersects.length > 0) {
            const clickedArtwork = intersects[0].object.userData.artwork
            
            if (onArtworkClick) {
              onArtworkClick(clickedArtwork)
            } else if (clickedArtwork.id) {
              navigate(`/art/${clickedArtwork.id}`)
            }
          }
        }
        
        const handleMouseMove = (event) => {
          updateMouse(event.clientX, event.clientY)
        }
        
        renderer.domElement.addEventListener('click', handleClick)
        renderer.domElement.addEventListener('mousemove', handleMouseMove)
        
        // 響應式處理
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', handleResize)
        
        // 動畫循環
        const clock = new THREE.Clock()
        
        const animate = () => {
          if (!containerRef.current) return
          
          requestAnimationFrame(animate)
          
          const deltaTime = clock.getDelta()
          const elapsedTime = clock.getElapsedTime()
          
          // 滑鼠懸停檢測
          raycaster.setFromCamera(mouse, camera)
          const intersects = raycaster.intersectObjects(artworkMeshes)
          
          // 重置所有 hover 狀態
          artworkMeshes.forEach(mesh => {
            mesh.userData.targetHoverScale = 1
          })
          
          // 設定懸停的網格
          if (intersects.length > 0) {
            const newHoveredMesh = intersects[0].object
            if (newHoveredMesh !== hoveredMesh) {
              hoveredMesh = newHoveredMesh
              renderer.domElement.style.cursor = 'pointer'
            }
            hoveredMesh.userData.targetHoverScale = 1.1
          } else {
            if (hoveredMesh) {
              hoveredMesh = null
              renderer.domElement.style.cursor = 'default'
            }
          }
          
          // 更新所有藝術品
          artworkMeshes.forEach((mesh, index) => {
            const userData = mesh.userData
            userData.time += deltaTime
            
            // 輕微漂浮動畫
            const float = Math.sin(userData.time * 0.5 + index * 0.5) * 0.1
            mesh.position.y = userData.originalPosition.y + float
            
            // 懸停縮放動畫
            userData.hoverScale += (userData.targetHoverScale - userData.hoverScale) * 0.1
            mesh.scale.setScalar(userData.hoverScale)
            
            // 輕微搖擺
            mesh.rotation.z = userData.originalRotation.z + Math.sin(userData.time * 0.3) * 0.005
          })
          
          // 相機輕微移動
          camera.position.x = Math.sin(elapsedTime * 0.1) * 2
          camera.position.y = Math.cos(elapsedTime * 0.08) * 1
          camera.lookAt(0, 0, 0)
          
          // 燈光動畫
          mainLight.position.x = 20 + Math.sin(elapsedTime * 0.2) * 5
          fillLight.position.x = -15 + Math.cos(elapsedTime * 0.15) * 3
          
          renderer.render(scene, camera)
        }
        
        animate()
        setIsLoaded(true)
        
        // 清理函數
        sceneRef.current = {
          dispose: () => {
            renderer.domElement.removeEventListener('click', handleClick)
            renderer.domElement.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)
            
            artworkMeshes.forEach(mesh => {
              if (mesh.material.map) mesh.material.map.dispose()
              mesh.material.dispose()
              mesh.geometry.dispose()
            })
            
            renderer.dispose()
            if (containerRef.current && renderer.domElement) {
              containerRef.current.removeChild(renderer.domElement)
            }
          }
        }
        
      } catch (error) {
        console.error('Three.js 載入失敗:', error)
      }
    }
    
    loadThree()
    
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }
    }
  }, [artworks, onArtworkClick])
  
  return (
    <div 
      ref={containerRef} 
      className="gallery-wall w-full h-full"
      style={{ position: 'relative' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>載入畫廊牆面中...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GalleryWall
