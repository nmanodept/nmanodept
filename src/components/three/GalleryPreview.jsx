import React, { useEffect, useRef, useState } from 'react'

const GalleryPreview = ({ artworks = [], width = 400, height = 300 }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const loadThree = async () => {
      try {
        const THREE = await import('three')
        
        // 基本場景設置
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0a)
        
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
        camera.position.set(0, 0, 20)
        
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)
        
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
        scene.add(ambientLight)
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
        mainLight.position.set(10, 10, 5)
        scene.add(mainLight)
        
        // 創建預覽網格
        const createPreviewGrid = () => {
          const group = new THREE.Group()
          const textureLoader = new THREE.TextureLoader()
          
          const gridSize = Math.min(artworks.length, 9) // 最多顯示9個
          const cols = Math.ceil(Math.sqrt(gridSize))
          const rows = Math.ceil(gridSize / cols)
          const spacing = 4
          
          artworks.slice(0, gridSize).forEach((artwork, index) => {
            const col = index % cols
            const row = Math.floor(index / cols)
            
            // 創建平面幾何體
            const geometry = new THREE.PlaneGeometry(3, 3)
            const material = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9
            })
            
            const mesh = new THREE.Mesh(geometry, material)
            
            // 位置計算
            const x = (col - (cols - 1) / 2) * spacing
            const y = ((rows - 1) / 2 - row) * spacing
            mesh.position.set(x, y, 0)
            
            // 載入圖片紋理
            if (artwork.main_image_url) {
              textureLoader.load(
                artwork.main_image_url,
                (texture) => {
                  material.map = texture
                  material.needsUpdate = true
                },
                undefined,
                (error) => {
                  console.warn('無法載入圖片:', error)
                  // 使用預設顏色
                  material.color.setHSL(Math.random(), 0.5, 0.7)
                }
              )
            } else {
              material.color.setHSL(Math.random(), 0.5, 0.7)
            }
            
            // 邊框
            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(geometry),
              new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
            )
            mesh.add(edges)
            
            // 漂浮動畫數據
            mesh.userData = {
              baseY: y,
              time: Math.random() * Math.PI * 2,
              speed: 0.5 + Math.random() * 0.5
            }
            
            group.add(mesh)
          })
          
          return group
        }
        
        const previewGroup = createPreviewGrid()
        scene.add(previewGroup)
        
        // 動畫循環
        const clock = new THREE.Clock()
        
        const animate = () => {
          if (!containerRef.current) return
          
          requestAnimationFrame(animate)
          
          const deltaTime = clock.getDelta()
          const elapsedTime = clock.getElapsedTime()
          
          // 更新每個預覽的動畫
          previewGroup.children.forEach((mesh) => {
            mesh.userData.time += deltaTime * mesh.userData.speed
            mesh.position.y = mesh.userData.baseY + Math.sin(mesh.userData.time) * 0.3
            mesh.rotation.y = Math.sin(elapsedTime * 0.5 + mesh.userData.time) * 0.1
          })
          
          // 整體群組旋轉
          previewGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.1
          
          renderer.render(scene, camera)
        }
        
        animate()
        setIsLoaded(true)
        
        // 清理函數
        sceneRef.current = {
          dispose: () => {
            previewGroup.children.forEach(mesh => {
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
  }, [artworks, width, height])
  
  return (
    <div 
      ref={containerRef} 
      className="gallery-preview"
      style={{ width, height, position: 'relative' }}
    >
      {!isLoaded && (
        <div 
          className="flex items-center justify-center bg-gray-900 text-white"
          style={{ width, height }}
        >
          載入中...
        </div>
      )}
    </div>
  )
}

export default GalleryPreview
