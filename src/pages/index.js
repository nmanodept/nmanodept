// src/pages/index.js
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { navigate } from 'gatsby'
import Seo from '../components/common/Seo'

// 圖片預載入管理器
class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.priorities = new Map();
    this.maxConcurrent = 3;
    this.currentLoading = 0;
    this.queue = [];
  }

  preloadImage(url, priority = 1) {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url));
    }

    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    const loadPromise = new Promise((resolve) => {
      const request = { url, priority, resolve };
      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });

    this.loading.set(url, loadPromise);
    return loadPromise;
  }

  processQueue() {
    if (this.currentLoading >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    this.currentLoading++;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const handleComplete = (success = true) => {
      this.currentLoading--;
      this.loading.delete(request.url);
      
      if (success) {
        this.cache.set(request.url, img);
      }
      
      request.resolve(success ? img : null);
      this.processQueue();
    };

    img.onload = () => handleComplete(true);
    img.onerror = () => handleComplete(false);
    img.src = request.url;
  }

  getCachedImage(url) {
    return this.cache.get(url);
  }

  dispose() {
    this.cache.clear();
    this.loading.clear();
    this.queue = [];
  }
}

const imagePreloader = new ImagePreloader();

// Three.js 場景組件 - 延遲載入版本
const ThreeScene = ({ shouldLoad, onSceneReady }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [artworksData, setArtworksData] = useState([])
  const [sceneLoaded, setSceneLoaded] = useState(false)

  // 快速獲取作品數據（不等待圖片）
  useEffect(() => {
    if (!shouldLoad) return;
    
    const fetchArtworks = async () => {
      try {
        const response = await fetch('https://artwork-submit-api.nmanodept.workers.dev/artworks')
        if (response.ok) {
          const data = await response.json()
          const approvedArtworks = data.filter(artwork => artwork.status === 'approved')
          setArtworksData(approvedArtworks)
        }
      } catch (error) {
        console.error('Failed to fetch artworks:', error)
        setArtworksData([])
      }
    }
    
    fetchArtworks()
  }, [shouldLoad])
  
  useEffect(() => {
    if (typeof window === 'undefined' || !shouldLoad || artworksData.length === 0) return
    
    // 延遲載入 Three.js（讓 UI 先渲染）
    const loadThree = async () => {
      // 給UI時間渲染，改善LCP
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const THREE = await import('three')
      
      if (!containerRef.current) return
      
      // 設備檢測
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      // CONFIG - 優化效能並整合 thebuildingiwant.html 的參數
      const CONFIG = {
        building: {
          mainWall: {
            rows: isMobile ? 4 : 6,     // 恢復原版數量
            cols: isMobile ? 6 : 8,     // 恢復原版數量
            spacing: 10,
            sizeMin: 9,
            sizeMax: 11,
            centerHeightBonus: 8  // 中心高度加成
          },
          sideWing: {
            count: isMobile ? 25 : 50,  // 稍微減少，但接近原版
            baseRadius: 15,
            maxRadius: 70,
            sizeMin: 6,
            sizeMax: 8,
            xOffset: 40  // 側翼橫向偏移
          },
          foundation: {
            count: isMobile ? 10 : 15,  // 恢復原版數量
            radius: 28,
            sizeMin: 7,
            sizeMax: 9.5,
            yOffset: -32  // 地基高度偏移
          }
        },
        animation: {
          driftIntensity: {
            wall: 0.8,
            wing: 1.2,
            foundation: 0.6
          },
          speedMultiplier: 0.8,
          glitchChance: 0.0003,
          glitchIntensity: 1.0,
          entranceDelay: 0.4,
          entranceDuration: 1.8,
          entranceStagger: 0.012,
          cameraEntranceDuration: 4.5
        },
        camera: {
          startZ: 70,
          targetZ: 50,
          minZ: 30,
          maxZ: 120,
          breathIntensity: 1.2
        },
        visual: {
          fogNear: 50,
          fogFar: 300,
          baseOpacity: { min: .35, max: .5 },
          colorOpacity: { min: .5, max: .8 },
          hoverScale: 1.3,
          hoverOpacity: 0.9,
          imageDisplayRatio: .4,
          textureSize: 256,
          imageTextureSize: isMobile ? 512 : 1024
        },
        performance: {
          maxFPS: isMobile ? 30 : 45,      // 稍微降低目標FPS來確保穩定
          shadowsEnabled: !isMobile,       // 桌面恢復陰影
          antialias: false,
          pixelRatio: isMobile ? 1 : Math.min(1.5, window.devicePixelRatio),  // 動態調整像素比
          frustumCulling: true,
          lodLevels: {
            high: 60,    // 放寬高品質範圍
            medium: 120, // 放寬中等品質範圍
            low: 200     // 放寬可見範圍
          },
          updateIntervals: {
            lod: 0.2,           // 稍微降低頻率
            raycast: 0.1,       // 稍微降低頻率
            lighting: 0.05,     // 稍微降低頻率
            camera: 0.033       // 稍微降低頻率
          },
          // 新增優化參數
          batchSize: isMobile ? 5 : 8,       // 批次更新大小
          cullingDistance: isMobile ? 150 : 200,  // 裁剪距離
          textureQuality: isMobile ? 0.8 : 1.0,   // 紋理品質
          geometryInstancing: true,               // 啟用幾何實例化
          materialMerging: true                   // 啟用材質合併
        }
      };

      // 性能優化：幀率限制和自適應性能管理
      let lastFrameTime = 0;
      const frameInterval = 1000 / CONFIG.performance.maxFPS;
      
      // 增強性能監控器
      class PerformanceMonitor {
        constructor() {
          this.frameTimes = [];
          this.maxSamples = 30;  // 減少樣本數量提高響應速度
          this.averageFPS = 0;
          this.performanceLevel = 'high'; // high, medium, low
          this.lastCheck = 0;
          this.consecutiveLowFrames = 0;
          this.adaptiveSkipRate = 0;
          this.memoryUsage = 0;
        }
        
        update(currentTime) {
          // 記錄幀時間
          if (this.lastFrameTime) {
            const frameTime = currentTime - this.lastFrameTime;
            this.frameTimes.push(frameTime);
            if (this.frameTimes.length > this.maxSamples) {
              this.frameTimes.shift();
            }
            
            // 即時檢測卡頓
            if (frameTime > 50) { // 超過50ms就是卡頓
              this.consecutiveLowFrames++;
            } else {
              this.consecutiveLowFrames = Math.max(0, this.consecutiveLowFrames - 1);
            }
          }
          this.lastFrameTime = currentTime;
          
          // 更頻繁的性能檢查（每500ms）
          if (currentTime - this.lastCheck > 500) {
            this.checkPerformance();
            this.lastCheck = currentTime;
          }
        }
        
        checkPerformance() {
          if (this.frameTimes.length < 10) return;
          
          const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
          const recentFrameTime = this.frameTimes.slice(-5).reduce((a, b) => a + b) / 5;
          this.averageFPS = 1000 / avgFrameTime;
          const recentFPS = 1000 / recentFrameTime;
          
          // 更敏感的性能級別調整
          const targetFPS = CONFIG.performance.maxFPS;
          
          if (recentFPS < targetFPS * 0.6 || this.consecutiveLowFrames > 3) {
            this.performanceLevel = 'low';
            this.adaptiveSkipRate = 0.4;
          } else if (recentFPS < targetFPS * 0.8) {
            this.performanceLevel = 'medium';
            this.adaptiveSkipRate = 0.2;
          } else {
            this.performanceLevel = 'high';
            this.adaptiveSkipRate = 0;
          }
          
          // 檢測記憶體使用（如果支援）
          if (performance.memory) {
            this.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
            if (this.memoryUsage > 0.8) {
              this.performanceLevel = Math.min(this.performanceLevel, 'medium');
            }
          }
        }
        
        shouldSkipFrame() {
          return Math.random() < this.adaptiveSkipRate;
        }
        
        getUpdateMultiplier() {
          switch (this.performanceLevel) {
            case 'low': return 0.4;
            case 'medium': return 0.7;
            default: return 1.0;
          }
        }
        
        getBatchSize() {
          switch (this.performanceLevel) {
            case 'low': return CONFIG.performance.batchSize * 0.5;
            case 'medium': return CONFIG.performance.batchSize * 0.75;
            default: return CONFIG.performance.batchSize;
          }
        }
      }
      
      const performanceMonitor = new PerformanceMonitor();
      
      // 記憶體管理
      const textureCache = new Map();
      const loadingTextures = new Map();
      const imageDimensionsCache = new Map();
      const MAX_TEXTURE_CACHE = 50;
      
      // 紋理載入器
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';
      
      // ID分配函數
      const getRandomArtwork = (() => {
        let artworkPool = [];
        let currentIndex = 0;
        
        return () => {
          if (currentIndex >= artworkPool.length) {
            artworkPool = [...artworksData].sort(() => Math.random() - 0.5);
            currentIndex = 0;
          }
          return artworkPool[currentIndex++];
        };
      })();

      // 獲取圖片尺寸
      async function getImageDimensions(url) {
        if (imageDimensionsCache.has(url)) {
          return imageDimensionsCache.get(url);
        }
        
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = function() {
            const dimensions = {
              width: this.width,
              height: this.height,
              aspect: this.width / this.height
            };
            imageDimensionsCache.set(url, dimensions);
            resolve(dimensions);
          };
          
          img.onerror = function() {
            const defaultDimensions = {
              width: 1,
              height: 1,
              aspect: 1
            };
            imageDimensionsCache.set(url, defaultDimensions);
            resolve(defaultDimensions);
          };
          
          img.src = url;
        });
      }

      // THREE 基本設置
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x030303, CONFIG.visual.fogNear, CONFIG.visual.fogFar);

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 60 : 75, 
        window.innerWidth/window.innerHeight, .1, 1000
      );
      camera.position.set(0, 0, CONFIG.camera.startZ);

      const renderer = new THREE.WebGLRenderer({
        antialias: CONFIG.performance.antialias,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,  // 允許軟體渲染作為備選
        precision: "highp"  // 使用高精度，但會根據性能動態調整
      });
      
      // 動態調整渲染器設置
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.performance.pixelRatio));
      renderer.shadowMap.enabled = CONFIG.performance.shadowsEnabled;
      if (CONFIG.performance.shadowsEnabled) {
        renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;  // 手動控制陰影更新
      }
      renderer.outputEncoding = THREE.sRGBEncoding;
      
      // 進階 WebGL 優化
      const gl = renderer.getContext();
      if (gl) {
        // 啟用深度測試優化
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // 啟用背面裁剪
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        
        // 設置視口優化
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
      }
      
      // 設置渲染器優化參數
      renderer.sortObjects = true;  // 重新啟用，但會智能管理
      renderer.autoClear = false;   // 手動控制清除
      renderer.autoClearColor = true;
      renderer.autoClearDepth = true;
      renderer.autoClearStencil = false;
      
      containerRef.current.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = 'default';

      // 燈光設置 - 恢復原版設置但稍微優化
      const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
      scene.add(ambientLight);
      
      const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
      mainLight.position.set(30, 50, 20);
      if (CONFIG.performance.shadowsEnabled) {
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;  // 降低陰影解析度
        mainLight.shadow.mapSize.height = 1024;
      }
      scene.add(mainLight);
      
      const fillLight = new THREE.PointLight(0x4080ff, 0.2, 100);
      fillLight.position.set(-20, 20, 30);
      scene.add(fillLight);
      
      const accentLight = new THREE.PointLight(0xff8040, 0.12, 80);
      accentLight.position.set(15, -10, 40);
      scene.add(accentLight);

      // 背景網格
      class FloatingGrid {
        constructor() {
          this.group = new THREE.Group();
          this.lines = [];
          this.createGrid();
          scene.add(this.group);
        }
        
        createGrid() {
          const gridSize = 400;              // 恢復原版尺寸
          const divisions = isMobile ? 15 : 20; // 稍微減少但接近原版
          const step = gridSize / divisions;
          const halfSize = gridSize / 2;
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaaa,  // 恢復原版顏色
            transparent: true,
            opacity: 0.2,     // 恢復原版透明度
            fog: true
          });
          
          // 橫線
          for(let i = 0; i <= divisions; i++) {
            const y = -halfSize + i * step;
            const points = [];
            
            for(let j = 0; j <= divisions; j++) {
              const x = -halfSize + j * step;
              const z = Math.sin(j * 0.1) * 2;
              points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = {
              baseY: y,
              waveOffset: Math.random() * Math.PI * 2,
              waveSpeed: 0.01 + Math.random() * 0.02
            };
            this.lines.push(line);
            this.group.add(line);
          }
          
          // 縱線
          for(let i = 0; i <= divisions; i++) {
            const x = -halfSize + i * step;
            const points = [];
            
            for(let j = 0; j <= divisions; j++) {
              const y = -halfSize + j * step;
              const z = Math.cos(j * 0.1) * 2;
              points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = {
              baseX: x,
              waveOffset: Math.random() * Math.PI * 2,
              waveSpeed: 0.01 + Math.random() * 0.02
            };
            this.lines.push(line);
            this.group.add(line);
          }
          
          this.group.position.z = -120;
          this.group.rotation.x = Math.PI * 0.1;
        }
        
        update(time) {
          // 輕微的波動和旋轉
          this.group.rotation.y = Math.sin(time * 0.01) * 0.025;
          this.group.rotation.z = Math.cos(time * 0.008) * 0.015;
        }
        
        dispose() {
          this.lines.forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
          });
          scene.remove(this.group);
        }
      }
      
      const floatingGrid = new FloatingGrid();

      // 背景方塊 - 大幅簡化
      class BackgroundCubes {
        constructor() {
          this.group = new THREE.Group();
          this.cubes = [];
          this.createCubes();
          scene.add(this.group);
        }
        
        createCubes() {
          const count = isMobile ? 10 : 18; // 恢復接近原版數量
          
          for(let i = 0; i < count; i++) {
            const size = 2 + Math.random() * 6;
            const cube = new THREE.Mesh(
              new THREE.BoxGeometry(size, size, size),
              new THREE.MeshPhongMaterial({
                color: new THREE.Color(
                  0.1 + Math.random() * 0.15,
                  0.1 + Math.random() * 0.15,
                  0.1 + Math.random() * 0.15
                ),
                transparent: true,
                opacity: 0.1 + Math.random() * 0.08,
                wireframe: Math.random() > 0.8
              })
            );
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 70 + Math.random() * 50;
            cube.position.set(
              Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 60,
              -80 - Math.random() * 60
            );
            
            cube.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            );
            
            cube.userData = {
              rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
              )
            };
            
            cube.scale.set(0, 0, 0);
            this.cubes.push(cube);
            this.group.add(cube);
          }
        }
        
        animateEntrance() {
          this.cubes.forEach((cube, i) => {
            setTimeout(() => {
              const startTime = Date.now();
              const animate = () => {
                const progress = Math.min((Date.now() - startTime) / 1200, 1);
                const eased = 1 - Math.pow(1 - progress, 2);
                cube.scale.setScalar(eased);
                if (progress < 1) requestAnimationFrame(animate);
              };
              animate();
            }, i * 40);
          });
        }
        
        update() {
          this.cubes.forEach(cube => {
            cube.rotation.x += cube.userData.rotationSpeed.x;
            cube.rotation.y += cube.userData.rotationSpeed.y;
            cube.rotation.z += cube.userData.rotationSpeed.z;
          });
        }
        
        dispose() {
          this.cubes.forEach(cube => {
            cube.geometry.dispose();
            cube.material.dispose();
          });
          scene.remove(this.group);
        }
      }
      
      const backgroundCubes = new BackgroundCubes();

      // 全螢幕動畫管理
      class FullscreenAnimation {
        constructor() {
          this.isAnimating = false;
          this.targetPlane = null;
        }
        
        async animateToFullscreen(workPlane) {
          if (this.isAnimating) return;
          this.isAnimating = true;
          this.targetPlane = workPlane;
          
          const mesh = workPlane.mesh;
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          
          const currentScale = workPlane.currentScale;
          
          const flipGroup = new THREE.Group();
          flipGroup.position.copy(worldPos);
          flipGroup.rotation.copy(mesh.rotation);
          flipGroup.scale.setScalar(currentScale);
          scene.add(flipGroup);
          
          const frontGeo = mesh.geometry.clone();
          const frontMat = mesh.material.clone();
          frontMat.opacity = 1;
          const frontPlane = new THREE.Mesh(frontGeo, frontMat);
          flipGroup.add(frontPlane);
          
          const backMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, // 恢復白色效果
            side: THREE.BackSide,
            transparent: true,
            opacity: 1
          });
          const backPlane = new THREE.Mesh(frontGeo, backMat);
          backPlane.rotation.y = Math.PI;
          flipGroup.add(backPlane);
          
          mesh.visible = false;
          
          // 立即開始快速淡出文字
          const uiElements = {
            title: document.getElementById('ui-title'),
            subtitle: document.getElementById('ui-subtitle'),
            enter: document.getElementById('ui-enter')
          };
          
          Object.values(uiElements).forEach(el => {
            if (el) {
              el.style.transition = 'opacity 0.2s ease-out';
              el.style.opacity = '0';
            }
          });
          
          const flipDuration = 600;
          const scaleDuration = 1500;
          const startTime = Date.now();
          
          const aspect = window.innerWidth / window.innerHeight;
          const vFov = camera.fov * Math.PI / 180;
          const distance = worldPos.distanceTo(camera.position);
          const targetHeight = 2 * Math.tan(vFov / 2) * distance * 1.2;
          const targetWidth = targetHeight * aspect;
          const currentSize = mesh.geometry.parameters;
          const scaleX = targetWidth / currentSize.width;
          const scaleY = targetHeight / currentSize.height;
          const targetScale = Math.max(scaleX, scaleY);
          
          return new Promise(resolve => {
            const animate = () => {
              const elapsed = Date.now() - startTime;
              
              if (elapsed < flipDuration) {
                const flipProgress = elapsed / flipDuration;
                const flipEased = this.easeInOutCubic(flipProgress);
                
                flipGroup.rotation.y = mesh.rotation.y + Math.PI * flipEased;
                const initialScale = currentScale + flipEased * 0.2;
                flipGroup.scale.setScalar(initialScale);
                
                if (Math.random() < 0.03) {
                  flipGroup.position.x = worldPos.x + (Math.random() - 0.5) * 0.3;
                  flipGroup.position.y = worldPos.y + (Math.random() - 0.5) * 0.3;
                } else {
                  flipGroup.position.copy(worldPos);
                }
              }
              
              if (elapsed >= flipDuration && elapsed < flipDuration + scaleDuration) {
                const scaleProgress = (elapsed - flipDuration) / scaleDuration;
                const scaleEased = this.easeOutQuart(scaleProgress);
                
                const currentAnimScale = (currentScale * 1.2) + (targetScale - currentScale * 1.2) * scaleEased;
                flipGroup.scale.setScalar(currentAnimScale);
                
                const targetPos = new THREE.Vector3(0, 0, (worldPos.z + camera.position.z) / 2);
                flipGroup.position.lerpVectors(worldPos, targetPos, scaleEased);
                
                if (scaleProgress > 0.2) {
                  const bgOpacity = (scaleProgress - 0.2) / 0.8;
                  backMat.opacity = 1 - bgOpacity * 0.5;
                }
                
                if (scaleProgress > 0.4) {
                  const fadeOpacity = 1 - (scaleProgress - 0.4) / 0.6;
                  renderer.domElement.style.opacity = fadeOpacity;
                }
                
                if (Math.random() < 0.05) {
                  const glitchIntensity = scaleEased * 1.5;
                  flipGroup.position.x += (Math.random() - 0.5) * glitchIntensity;
                  flipGroup.position.y += (Math.random() - 0.5) * glitchIntensity;
                  // 恢復原本的白色閃爍效果
                  backMat.color.setHex(Math.random() > 0.5 ? 0xff0080 : 0x00ff80);
                  setTimeout(() => {
                    backMat.color.setHex(0xffffff); // 恢復為白色
                  }, 50);
                }
              }
              
              const totalDuration = flipDuration + scaleDuration;
              if (elapsed < totalDuration) {
                requestAnimationFrame(animate);
              } else {
                scene.remove(flipGroup);
                frontGeo.dispose();
                frontMat.dispose();
                backMat.dispose();
                this.isAnimating = false;
                resolve();
              }
            };
            animate();
          });
        }
        
        easeInOutCubic(t) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        
        easeOutQuart(t) {
          return 1 - Math.pow(1 - t, 4);
        }
      }
      
      const fullscreenAnimation = new FullscreenAnimation();

      // 黑白素材貼圖
      function createPlaceholderTexture(artwork) {
        const cacheKey = `placeholder_${artwork.id}`;
        if (textureCache.has(cacheKey)) {
          return textureCache.get(cacheKey);
        }
        
        const size = CONFIG.visual.textureSize;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        // 漸層背景
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        const baseColor = 80 + Math.random() * 40;
        gradient.addColorStop(0, `rgb(${baseColor + 10},${baseColor + 10},${baseColor + 10})`);
        gradient.addColorStop(1, `rgb(${baseColor - 10},${baseColor - 10},${baseColor - 10})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // 網格線 - 恢復白色
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for(let i = 0; i < size; i += 25) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(size, i);
          ctx.stroke();
        }
        
        // 雜訊 - 恢復白色噪點
        for(let i = 0; i < 150; i++) {
          const n = Math.random() > 0.5 ? 255 : 0; // 恢復原本白黑對比
          ctx.fillStyle = `rgba(${n},${n},${n},${Math.random() * 0.02})`;
          ctx.fillRect(
            Math.random() * size,
            Math.random() * size,
            Math.random() * 1.5,
            Math.random() * 1.5
          );
        }
        
        // 邊框 - 恢復白色
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, size - 24, size - 24);
        
        // ID文字 - 恢復白色
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `bold ${size/7}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`#${String(artwork.id).padStart(3, '0')}`, size/2, size/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        
        if (textureCache.size >= MAX_TEXTURE_CACHE) {
          const firstKey = textureCache.keys().next().value;
          const firstTexture = textureCache.get(firstKey);
          firstTexture.dispose();
          textureCache.delete(firstKey);
        }
        
        textureCache.set(cacheKey, texture);
        return texture;
      }

      // 載入作品圖片 - 使用預載入系統
      function loadArtworkTexture(artwork, priority = 1) {
        const cacheKey = `artwork_${artwork.id}`;
        
        if (textureCache.has(cacheKey)) {
          return Promise.resolve(textureCache.get(cacheKey));
        }
        
        if (loadingTextures.has(cacheKey)) {
          return loadingTextures.get(cacheKey);
        }
        
        const loadPromise = imagePreloader.preloadImage(artwork.main_image_url, priority)
          .then((img) => {
            if (img) {
              const texture = new THREE.Texture(img);
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.generateMipmaps = false;
              texture.encoding = THREE.sRGBEncoding;
              texture.needsUpdate = true;
              
              if (textureCache.size >= MAX_TEXTURE_CACHE) {
                const firstKey = textureCache.keys().next().value;
                const firstTexture = textureCache.get(firstKey);
                if (firstTexture && firstTexture.dispose) {
                firstTexture.dispose();
                }
                textureCache.delete(firstKey);
              }
              
              textureCache.set(cacheKey, texture);
              loadingTextures.delete(cacheKey);
              return texture;
            } else {
              loadingTextures.delete(cacheKey);
              return createFallbackTexture(artwork);
            }
          })
          .catch((error) => {
            console.error('Error loading texture:', error);
            loadingTextures.delete(cacheKey);
            return createFallbackTexture(artwork);
        });
        
        loadingTextures.set(cacheKey, loadPromise);
        return loadPromise;
      }

      // 創建備用紋理 - 恢復原版效果
      function createFallbackTexture(artwork) {
        const size = CONFIG.visual.imageTextureSize;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        const g = Math.floor(30 + Math.random() * 50); // 恢復原版亮度
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = 'rgba(255,255,255,.1)'; // 恢復白色邊框
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, size - 40, size - 40);
        
        ctx.fillStyle = 'rgba(255,255,255,.7)'; // 恢復白色文字
        ctx.font = `bold ${size/12}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(artwork.title || `#${artwork.id}`, size/2, size/2);
        
        if (artwork.author) {
          ctx.font = `${size/16}px monospace`;
          ctx.fillStyle = 'rgba(255,255,255,.5)'; // 恢復白色作者名稱
          ctx.fillText(artwork.author, size/2, size/2 + size/10);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        return texture;
      }

      // WorkPlane 類別 - 整合 thebuildingiwant.html 的效果 + LOD 系統
      class WorkPlane {
        constructor(position, size, driftIntensity, rotation, group, index) {
          this.artwork = getRandomArtwork();
          this.artworkId = this.artwork.id;
          this.id = index;
          this.basePos = position.clone();
          this.drift = {
            speed: new THREE.Vector3(
              0.04 + Math.random() * 0.08,
              0.06 + Math.random() * 0.06,
              0.08 + Math.random() * 0.04
            ),
            phase: new THREE.Vector3(
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2
            ),
            intensity: driftIntensity
          };
          this.group = group;
          
          // LOD 相關變量
          this.distanceToCamera = Infinity;
          this.lodLevel = 'low';
          this.isVisible = true;
          this.lastLodUpdate = 0;
          
          // 決定是否顯示彩色圖片
          this.showColorImage = Math.random() < CONFIG.visual.imageDisplayRatio;
          
          // 預設長寬比
          let aspect = 0.8 + Math.random() * 0.4;
          
          // 創建幾何體
          const geometry = new THREE.PlaneGeometry(size * aspect, size);
          
          // 創建材質 - 恢復原本亮度
          const material = new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            color: new THREE.Color(0.5 + Math.random() * 0.2, 0.5 + Math.random() * 0.2, 0.5 + Math.random() * 0.2), // 恢復原本亮度
            shininess: 15
          });
          
          // 如果是黑白版本，設置灰色
          if (!this.showColorImage) {
            const gray = 0.4 + Math.random() * 0.4;
            material.color.setRGB(gray, gray, gray);
            material.userData = { originalGray: gray };
          }
          
          this.mesh = new THREE.Mesh(geometry, material);
          this.mesh.position.set(0, 0, 0);
          this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
          this.mesh.scale.set(0, 0, 0);
          this.mesh.userData.workPlane = this;
          if (CONFIG.performance.shadowsEnabled) {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
          }

          // 邊框線條 - 恢復白色
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
              color: 0xffffff, // 恢復白色
              transparent: true,
              opacity: 0.05,   // 恢復原本透明度
              linewidth: 1
            })
          );
          this.mesh.add(edges);
          this.edges = edges;

          // 發光效果（hover用）- 恢復白色發光
          const glowGeometry = new THREE.PlaneGeometry(size * aspect * 1.08, size * 1.08);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff, // 恢復白色發光
            transparent: true,
            opacity: 0.1,    // 恢復原本透明度
            side: THREE.DoubleSide
          });
          this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
          this.glow.position.z = -0.1;
          this.mesh.add(this.glow);

          this.time = Math.random() * Math.PI * 2;
          this.targetScale = 1;
          this.currentScale = 1;
          const opacityConfig = this.showColorImage ? CONFIG.visual.colorOpacity : CONFIG.visual.baseOpacity;
          this.baseOpacity = THREE.MathUtils.lerp(opacityConfig.min, opacityConfig.max, Math.random());
          this.glitchUntil = 0;
          this.entranceComplete = false;
          this.textureLoaded = false;
          this.geometryUpdated = false;
          
          // 載入紋理
          this.loadTexture();
        }
        
        async loadTexture() {
          if (this.showColorImage) {
            try {
              const dimensions = await getImageDimensions(this.artwork.main_image_url);
              
              if (!this.geometryUpdated && dimensions.aspect !== 1) {
                this.updateGeometry(dimensions.aspect);
              }
              
              // 根据距离决定加载优先级
              const priority = this.distanceToCamera < CONFIG.performance.lodLevels.high ? 10 : 
                              this.distanceToCamera < CONFIG.performance.lodLevels.medium ? 5 : 1;
              
              const texture = await loadArtworkTexture(this.artwork, priority);
              if (this.mesh && this.mesh.material) {
                this.mesh.material.map = texture;
                this.mesh.material.needsUpdate = true;
                this.textureLoaded = true;
              }
            } catch (error) {
              console.error('Failed to load texture:', error);
            }
          } else {
            const texture = createPlaceholderTexture(this.artwork);
            if (this.mesh && this.mesh.material) {
              this.mesh.material.map = texture;
              this.mesh.material.needsUpdate = true;
              this.textureLoaded = true;
            }
          }
        }
        
        // LOD 系統更新 - 更少的更新頻率
        updateLOD(cameraPosition, time) {
          // 只在必要時更新 LOD（每0.2秒）
          if (time - this.lastLodUpdate < CONFIG.performance.updateIntervals.lod) return;
          this.lastLodUpdate = time;
          
          // 計算到相機的距離
          this.distanceToCamera = this.mesh.position.distanceTo(cameraPosition);
          
          // 視錐裁剪 - 隱藏過遠的物件
          const wasVisible = this.isVisible;
          this.isVisible = this.distanceToCamera < CONFIG.performance.lodLevels.low;
          
          if (this.isVisible !== wasVisible) {
            this.mesh.visible = this.isVisible;
          }
          
          if (!this.isVisible) return;
          
          // 決定 LOD 級別
          const newLodLevel = this.distanceToCamera < CONFIG.performance.lodLevels.high ? 'high' :
                              this.distanceToCamera < CONFIG.performance.lodLevels.medium ? 'medium' : 'low';
          
          if (newLodLevel !== this.lodLevel) {
            this.lodLevel = newLodLevel;
            this.applyLOD();
          }
        }
        
        // 應用 LOD 設置
        applyLOD() {
          if (!this.mesh || !this.mesh.material) return;
          
          switch (this.lodLevel) {
            case 'high':
              // 高品質：正常渲染
              this.mesh.material.transparent = true;
              if (this.edges) this.edges.visible = true;
              if (this.glow) this.glow.visible = true;
              break;
              
            case 'medium':
              // 中等品質：隱藏邊框和發光
              this.mesh.material.transparent = true;
              if (this.edges) this.edges.visible = false;
              if (this.glow) this.glow.visible = false;
              break;
              
            case 'low':
              // 低品質：簡化材質
              this.mesh.material.transparent = false;
              if (this.edges) this.edges.visible = false;
              if (this.glow) this.glow.visible = false;
              break;
          }
        }
        
        updateGeometry(imageAspect) {
          if (this.geometryUpdated) return;
          this.geometryUpdated = true;
          
          const baseSize = this.mesh.geometry.parameters.height;
          const newGeo = new THREE.PlaneGeometry(baseSize * imageAspect, baseSize);
          
          this.mesh.geometry.dispose();
          this.mesh.geometry = newGeo;
          
          if (this.edges) {
            const edgeGeo = new THREE.EdgesGeometry(newGeo);
            this.edges.geometry.dispose();
            this.edges.geometry = edgeGeo;
          }
          
          if (this.glow) {
            const glowGeo = new THREE.PlaneGeometry(baseSize * imageAspect * 1.08, baseSize * 1.08);
            this.glow.geometry.dispose();
            this.glow.geometry = glowGeo;
          }
        }
        
        animateEntrance(delay) {
          setTimeout(() => {
            const duration = CONFIG.animation.entranceDuration;
            const startTime = Date.now();
            
            const animate = () => {
              const progress = Math.min((Date.now() - startTime) / 1000 / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              
              this.mesh.scale.setScalar(eased);
              this.mesh.material.opacity = this.baseOpacity * eased;
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                this.entranceComplete = true;
              }
            };
            animate();
          }, delay * 1000);
        }
        
        update(deltaTime, time, cameraPosition) {
          // LOD 更新（包含視錐裁剪）
          if (CONFIG.performance.frustumCulling && cameraPosition) {
            this.updateLOD(cameraPosition, time);
          }
          
          if (!this.entranceComplete || !this.isVisible) return;
          
          this.time += deltaTime * 0.08 * CONFIG.animation.speedMultiplier;
          
          // 漂浮動畫 - 根據 LOD 調整複雜度
          const driftMultiplier = this.lodLevel === 'high' ? 1 : this.lodLevel === 'medium' ? 0.7 : 0.5;
          const drift = new THREE.Vector3(
            Math.sin(this.time * this.drift.speed.x + this.drift.phase.x) * this.drift.intensity * driftMultiplier,
            Math.cos(this.time * this.drift.speed.y + this.drift.phase.y) * this.drift.intensity * driftMultiplier,
            Math.sin(this.time * this.drift.speed.z + this.drift.phase.z) * this.drift.intensity * 0.3 * driftMultiplier
          );
          
          // 故障效果 - 只在高品質時啟用
          if (this.lodLevel === 'high' && Math.random() < CONFIG.animation.glitchChance) {
            this.glitchUntil = time + 0.08 + Math.random() * 0.15;
          }
          
          if (this.lodLevel === 'high' && time < this.glitchUntil) {
            drift.add(new THREE.Vector3(
              (Math.random() - 0.5) * CONFIG.animation.glitchIntensity,
              (Math.random() - 0.5) * CONFIG.animation.glitchIntensity,
              (Math.random() - 0.5) * 0.3
            ));
            this.mesh.material.opacity = this.baseOpacity * (0.8 + Math.random() * 0.3);
            
            // 故障時的顏色變化
            if (Math.random() < 0.2) {
              if (this.showColorImage && this.textureLoaded) {
                const hue = Math.random() * 0.05;
                this.mesh.material.color.setHSL(hue, 0.05, 0.5);
              } else if (!this.showColorImage) {
                const g = this.mesh.material.userData?.originalGray || 0.6;
                const variation = 0.1;
                const newG = g + (Math.random() - 0.5) * variation;
                this.mesh.material.color.setRGB(newG, newG, newG);
              }
            }
          } else {
            const targetOpacity = this.currentScale > 1 ? CONFIG.visual.hoverOpacity : this.baseOpacity;
            this.mesh.material.opacity += (targetOpacity - this.mesh.material.opacity) * 0.08;
            
            // 恢復原色 - 保持白色效果
            if (this.showColorImage) {
              this.mesh.material.color.setRGB(1, 1, 1); // 恢復完整白色
            } else {
              const g = this.mesh.material.userData?.originalGray || 0.6;
              this.mesh.material.color.setRGB(g, g, g);
            }
          }
          
          this.mesh.position.copy(this.basePos).add(drift);
          
          // 輕微旋轉 - 僅在高品質時
          if (this.lodLevel === 'high') {
          this.mesh.rotation.y += Math.cos(this.time * 0.2) * 0.001;
          }
          
          // 縮放動畫
          this.currentScale += (this.targetScale - this.currentScale) * 0.4;
          this.mesh.scale.setScalar(this.currentScale);
          
          // 發光效果 - 僅在高品質時
          if (this.lodLevel === 'high' && this.glow) {
          const glowIntensity = this.currentScale > 1 ? 0.12 : 0.03;
          this.glow.material.opacity += (glowIntensity - this.glow.material.opacity) * 0.08;
          }
        }
        
        setHover(isHovered) {
          this.targetScale = isHovered ? CONFIG.visual.hoverScale : 1;
        }
        
        onClick() {
          if (this.artworkId && artworksData.find(a => a.id === this.artworkId)) {
            fullscreenAnimation.animateToFullscreen(this).then(() => {
              navigate(`/art/${this.artworkId}`);
            });
          }
        }
        
        dispose() {
          if (this.mesh.material.map && !textureCache.has(`placeholder_${this.artworkId}`) && !textureCache.has(`artwork_${this.artworkId}`)) {
            this.mesh.material.map.dispose();
          }
          this.mesh.material.dispose();
          this.mesh.geometry.dispose();
          this.edges.geometry.dispose();
          this.edges.material.dispose();
          this.glow.geometry.dispose();
          this.glow.material.dispose();
        }
      }

      // 建築生成器 - 使用 thebuildingiwant.html 的立體佈局
      class Building {
        constructor() {
          this.planes = [];
          this.group = new THREE.Group();
          scene.add(this.group);
        }
        
        generate() {
          let index = 0;
          
          // 主牆（中央最高）
          const wall = CONFIG.building.mainWall;
          for(let r = 0; r < wall.rows; r++) {
            for(let c = 0; c < wall.cols; c++) {
              // 計算距離中心的距離來決定高度
              const centerDistance = Math.abs(c - (wall.cols - 1) / 2) / ((wall.cols - 1) / 2);
              const heightOffset = centerDistance * -CONFIG.building.mainWall.centerHeightBonus;
              
              const pos = new THREE.Vector3(
                (c - (wall.cols - 1) / 2) * wall.spacing + (Math.random() - 0.5) * 1.5,
                (r - (wall.rows - 1) / 2) * wall.spacing + (Math.random() - 0.5) * 0.8 + heightOffset,
                -15 + Math.sin(c * 0.15 + r * 0.1) * 5 + Math.random() * 2
              );
              
              const plane = new WorkPlane(
                pos,
                THREE.MathUtils.randFloat(wall.sizeMin, wall.sizeMax),
                CONFIG.animation.driftIntensity.wall,
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.04,
                  (Math.random() - 0.5) * 0.05,
                  (Math.random() - 0.5) * 0.02
                ),
                'wall',
                index++
              );
              
              this.planes.push(plane);
              this.group.add(plane.mesh);
            }
          }
          
          // 側翼（稍微比中間低，但更多更高）
          const wing = CONFIG.building.sideWing;
          for(let side of [-1, 1]) {
            for(let i = 0; i < wing.count; i++) {
              const t = i / wing.count;
              const angle = t * Math.PI * 0.8 - Math.PI * 0.4;
              const radius = wing.baseRadius + t * (wing.maxRadius - wing.baseRadius);
              
              const pos = new THREE.Vector3(
                wing.xOffset * side + Math.cos(angle) * radius * 0.6 * side,
                (Math.random() - 0.5) * 45 - t * 8 + 10,
                -10 + Math.sin(angle) * radius * 0.4 + Math.random() * 8
              );
              
              const plane = new WorkPlane(
                pos,
                THREE.MathUtils.randFloat(wing.sizeMin, wing.sizeMax),
                CONFIG.animation.driftIntensity.wing,
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.08,
                  angle + (Math.random() - 0.5) * 0.15,
                  (Math.random() - 0.5) * 0.05 * side
                ),
                'wing',
                index++
              );
              
              this.planes.push(plane);
              this.group.add(plane.mesh);
            }
          }
          
          // 地基（最低層）
          const foundation = CONFIG.building.foundation;
          for(let i = 0; i < foundation.count; i++) {
            const angle = i / foundation.count * Math.PI * 2;
            const radius = foundation.radius + (Math.random() - 0.5) * 8;
            
            const pos = new THREE.Vector3(
              Math.cos(angle) * radius,
              foundation.yOffset + Math.random() * 3,
              -12 + Math.sin(angle) * radius * 0.25
            );
            
            const plane = new WorkPlane(
              pos,
              THREE.MathUtils.randFloat(foundation.sizeMin, foundation.sizeMax),
              CONFIG.animation.driftIntensity.foundation,
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                angle + (Math.random() - 0.5) * 0.1,
                0
              ),
              'foundation',
              index++
            );
            
            this.planes.push(plane);
            this.group.add(plane.mesh);
          }
          
          this.group.position.y = -5;
          
          // 開始進場動畫
          setTimeout(() => {
            // 背景方塊動畫
            backgroundCubes.animateEntrance();
            
            // 建築物進場
            setTimeout(() => {
              this.planes.forEach((plane, i) => {
                plane.animateEntrance(i * CONFIG.animation.entranceStagger);
              });
            }, 600);
            
            // 相機進場
            this.animateCameraEntrance();
          }, CONFIG.animation.entranceDelay * 1000);
        }
        
        animateCameraEntrance() {
          const duration = CONFIG.animation.cameraEntranceDuration;
          const startZ = camera.position.z;
          const targetZ = CONFIG.camera.targetZ;
          const startTime = Date.now();
          
          const animate = () => {
            const progress = Math.min((Date.now() - startTime) / 1000 / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            camera.position.z = startZ + (targetZ - startZ) * eased;
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
        
        update(deltaTime, time, cameraPosition) {
          // 批次更新系統 - 每幀只更新部分物件
          const batchSize = Math.ceil(performanceMonitor.getBatchSize());
          const totalPlanes = this.planes.length;
          
          if (!this.updateIndex) this.updateIndex = 0;
          
          // 計算本幀要更新的物件範圍
          const startIndex = this.updateIndex;
          const endIndex = Math.min(startIndex + batchSize, totalPlanes);
          
          // 更新指定範圍的物件
          for (let i = startIndex; i < endIndex; i++) {
            const plane = this.planes[i];
            if (!CONFIG.performance.frustumCulling || plane.isVisible) {
              plane.update(deltaTime, time, cameraPosition);
            }
          }
          
          // 更新索引，下一幀從下個批次開始
          this.updateIndex = endIndex >= totalPlanes ? 0 : endIndex;
          
          // 如果性能差，增加額外的跳過邏輯
          if (performanceMonitor.performanceLevel === 'low') {
            // 每隔一幀才更新一次批次
            if (!this.skipFrame) this.skipFrame = false;
            this.skipFrame = !this.skipFrame;
            if (this.skipFrame) return;
          }
        }
        
        dispose() {
          this.planes.forEach(plane => plane.dispose());
          scene.remove(this.group);
        }
      }

      // 建立場景 - 漸進式載入
      const building = new Building();
      
      // 延遲場景生成以改善LCP
      requestIdleCallback(() => {
        building.generate();
        setSceneLoaded(true);
        if (onSceneReady) onSceneReady();
      }, { timeout: 200 });

      // 互動
      const raycaster = new THREE.Raycaster();
      raycaster.layers.set(0);
      const mouse = new THREE.Vector2();
      let hoveredPlane = null;
      
      function updatePointer(clientX, clientY) {
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      }
      
      const handleClick = (e) => {
        if (hoveredPlane && !fullscreenAnimation.isAnimating) {
          hoveredPlane.onClick();
        }
      };
      
      const handleMouseMove = (e) => {
        updatePointer(e.clientX, e.clientY);
      };
      
      const handleTouchMove = (e) => {
        if (e.touches.length > 0) {
          updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      };
      
      const handleTouchStart = handleTouchMove;
      
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('click', handleClick);
      
      if (isMobile) {
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
      }

      // Resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      
      if (!isMobile) {
        const handleWheel = (e) => {
          camera.position.z = Math.max(
            CONFIG.camera.minZ,
            Math.min(CONFIG.camera.maxZ, camera.position.z + e.deltaY * 0.06)
          );
        };
        window.addEventListener('wheel', handleWheel, { passive: true });
      }

      // 主迴圈 - 激進優化版本
      const clock = new THREE.Clock();
      let frame = 0;
      let lastLightingUpdate = 0;
      let lastCameraUpdate = 0;
      let lastRaycastUpdate = 0;
      
      // 陰影更新管理
      let lastShadowUpdate = 0;
      const shadowUpdateInterval = 100; // 每100ms更新一次陰影
      
      const animate = (currentTime) => {
        if (!containerRef.current) return;
        
        requestAnimationFrame(animate);
        
        // 性能監控
        performanceMonitor.update(currentTime);
        
        // 自適應跳幀
        if (performanceMonitor.shouldSkipFrame()) {
          return;
        }
        
        // 幀率限制
        if (currentTime - lastFrameTime < frameInterval) return;
        lastFrameTime = currentTime;
        
        const deltaTime = clock.getDelta();
        const time = clock.getElapsedTime();
        const updateMultiplier = performanceMonitor.getUpdateMultiplier();
        
        // 手動清除緩衝區（性能優化）
        renderer.clear(true, true, false);
        
        // 更新元素（傳遞相機位置）- 使用批次更新系統
        building.update(deltaTime * updateMultiplier, time, camera.position);
        
        // 背景元素更新 - 更智能的更新邏輯
        const backgroundSkipRate = performanceMonitor.performanceLevel === 'low' ? 4 : 
                                  performanceMonitor.performanceLevel === 'medium' ? 2 : 1;
        
        if (frame % backgroundSkipRate === 0) {
          floatingGrid.update(time);
        }
        if (frame % (backgroundSkipRate + 1) === 0) {
          backgroundCubes.update();
        }

        // 光源移動 - 恢復原版邏輯但根據性能調整
        if (time - lastLightingUpdate > CONFIG.performance.updateIntervals.lighting) {
          const intensity = performanceMonitor.getUpdateMultiplier();
          mainLight.position.x = Math.sin(time * 0.03) * 25 * intensity;
          mainLight.position.z = Math.cos(time * 0.03) * 25 * intensity;
          fillLight.position.x = -20 + Math.sin(time * 0.05) * 10 * intensity;
          fillLight.position.y = 20 + Math.cos(time * 0.04) * 8 * intensity;
          accentLight.position.x = 15 + Math.cos(time * 0.045) * 12 * intensity;
          accentLight.position.z = 40 + Math.sin(time * 0.055) * 10 * intensity;
          lastLightingUpdate = time;
          
          // 動態陰影更新
          if (CONFIG.performance.shadowsEnabled && 
              currentTime - lastShadowUpdate > shadowUpdateInterval) {
            renderer.shadowMap.needsUpdate = true;
            lastShadowUpdate = currentTime;
          }
        }
        
        // 相機呼吸 - 降低更新頻率
        if (time - lastCameraUpdate > CONFIG.performance.updateIntervals.camera) {
          camera.position.x = Math.sin(time * 0.012) * CONFIG.camera.breathIntensity;
          camera.position.y = Math.cos(time * 0.015) * CONFIG.camera.breathIntensity * 0.8;
          camera.lookAt(0, 10, -15);
          lastCameraUpdate = time;
        }

        // Hover 檢測 - 根據性能動態調整頻率
        const raycastInterval = CONFIG.performance.updateIntervals.raycast * 
                               (performanceMonitor.performanceLevel === 'low' ? 2 : 1);
        
        if (time - lastRaycastUpdate > raycastInterval) {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(building.group.children, false);
          const hit = intersects.length > 0 ? intersects[0].object.userData.workPlane : null;
          
          if (hit !== hoveredPlane) {
            if (hoveredPlane) hoveredPlane.setHover(false);
            hoveredPlane = hit;
            if (hoveredPlane) hoveredPlane.setHover(true);
            
            if (!isMobile) {
              renderer.domElement.style.cursor = hoveredPlane ? 'pointer' : 'default';
            }
          }
          lastRaycastUpdate = time;
        }
        
        // 根據性能調整渲染品質
        if (performanceMonitor.performanceLevel === 'low' && frame % 2 === 0) {
          // 低性能時降低像素比
          const lowPixelRatio = CONFIG.performance.pixelRatio * 0.7;
          if (renderer.getPixelRatio() > lowPixelRatio) {
            renderer.setPixelRatio(lowPixelRatio);
          }
        } else if (performanceMonitor.performanceLevel === 'high') {
          // 高性能時恢復像素比
          const targetPixelRatio = Math.min(window.devicePixelRatio, CONFIG.performance.pixelRatio);
          if (renderer.getPixelRatio() < targetPixelRatio) {
            renderer.setPixelRatio(targetPixelRatio);
          }
        }
        
        renderer.render(scene, camera);
        frame++;
      };
      animate();
      
      // 定期記憶體清理
      const memoryCleanupInterval = setInterval(() => {
        // 清理未使用的紋理
        if (textureCache.size > MAX_TEXTURE_CACHE * 1.5) {
          const keysToDelete = Array.from(textureCache.keys()).slice(0, MAX_TEXTURE_CACHE * 0.3);
          keysToDelete.forEach(key => {
            const texture = textureCache.get(key);
            if (texture && texture.dispose) texture.dispose();
            textureCache.delete(key);
          });
        }
        
        // 強制垃圾收集（如果支援）
        if (window.gc) {
          window.gc();
        }
      }, 30000); // 每30秒清理一次
      
      // 儲存清理函數
      sceneRef.current = {
        dispose: () => {
          // 清理定期任務
          clearInterval(memoryCleanupInterval);
          
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('click', handleClick);
          if (isMobile) {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
          }
          
          // 清理場景物件
          floatingGrid.dispose();
          backgroundCubes.dispose();
          building.dispose();
          
          // 清理紋理和快取
          textureCache.forEach(texture => {
            if (texture && texture.dispose) texture.dispose();
          });
          textureCache.clear();
          loadingTextures.clear();
          imageDimensionsCache.clear();
          imagePreloader.dispose();
          
          // 清理渲染器
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement = null;
          
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
          }
          
          // 清理 WebGL 上下文
          const gl = renderer.getContext();
          if (gl) {
            const loseContext = gl.getExtension('WEBGL_lose_context');
            if (loseContext) loseContext.loseContext();
          }
        }
      };
    };
    
    loadThree();
    
    // 清理
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
    };
  }, [shouldLoad, artworksData]);
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0"
      style={{ 
        opacity: sceneLoaded ? 1 : 0.3,
        transition: 'opacity 1s ease-in-out'
      }}
    />
  );
};

const IndexPage = () => {
  const [uiReady, setUiReady] = useState(false);
  const [shouldLoad3D, setShouldLoad3D] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  
  const handleEnter = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  // 立即顯示UI，延遲載入3D場景
  useEffect(() => {
    // UI立即準備好
    setUiReady(true);
    
    // 延遲啟動3D場景載入以改善LCP
    const timer = setTimeout(() => {
      setShouldLoad3D(true);
    }, 500); // 給UI 500ms 時間完全渲染
    
    return () => clearTimeout(timer);
  }, []);

  // 背景預載入（不阻塞渲染）
  useEffect(() => {
    if (!uiReady) return;
    
    const backgroundPreload = async () => {
      // 預載入字體
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = 'https://fonts.googleapis.com';
      document.head.appendChild(link);
      
      const link2 = document.createElement('link');
      link2.rel = 'preconnect';
      link2.href = 'https://fonts.gstatic.com';
      link2.crossOrigin = 'anonymous';
      document.head.appendChild(link2);
      
      // 預載入 API（不等待結果）
      if ('fetch' in window) {
        fetch('https://artwork-submit-api.nmanodept.workers.dev/artworks', {
          method: 'HEAD'
        }).catch(() => {});
      }
    };
    
    // 延遲背景預載入
    setTimeout(backgroundPreload, 100);
  }, [uiReady]);
  
  return (
    <>
      <Seo 
        title="NMANODEPT - 新沒系館" 
        description="探索藝術作品的虛擬數位空間，新沒系館是一個創新的藝術展示平台，展現當代藝術創作的多元面貌。"
        keywords="藝術,數位展覽,虛擬空間,當代藝術,創作展示"
        url={typeof window !== 'undefined' ? window.location.href : ''}
        image="/preview-image.jpg"
        type="website"
      />
      
      <div className="min-h-screen bg-black">
        {/* Three.js 場景容器 */}
        <div className="relative w-full h-screen">
          {/* 背景漸層 */}
          <div 
            className="absolute inset-0 pointer-events-none z-[1]" 
            style={{
              background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.02) 0%, transparent 50%)'
            }}
          />
          <div 
            className="absolute inset-0" 
            style={{
              background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%)'
            }}
          />
          
          {/* Three.js 渲染區域 - 條件載入 */}
          <div className="relative z-0">
            {shouldLoad3D && (
              <ThreeScene 
                shouldLoad={shouldLoad3D}
                onSceneReady={() => setSceneReady(true)}
              />
            )}
            {/* 快速載入的佔位背景 */}
            {!sceneReady && (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%)',
                  opacity: shouldLoad3D ? 0.7 : 1,
                  transition: 'opacity 0.5s ease-out'
                }}
              />
            )}
          </div>
          
          {/* UI 層 - 保留原本的位置 */}
          <div className="absolute inset-0 flex flex-col items-center pointer-events-none z-50" style={{ top: '2vh' }}>
            <h1 
              id="ui-title"
              className="text-white font-thin tracking-[1rem] sm:tracking-[1.2rem] md:tracking-[1.5rem] pointer-events-auto cursor-default select-none"
              style={{
                fontSize: 'clamp(3rem, 12vw, 6rem)',
                textShadow: '0 0 60px rgba(255,255,255,.15)',
                mixBlendMode: 'difference',
                opacity: uiReady ? 1 : 0,
                transform: uiReady ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                filter: uiReady ? 'blur(0px)' : 'blur(10px)',
                transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform, opacity'
              }}
            >
              NMANODEPT
            </h1>
            
            <p 
              id="ui-subtitle"
              className="text-center text-white/45 font-light tracking-[0.12rem] leading-[1.8] px-8 max-w-[600px] mt-6 sm:mt-8 md:mt-2 pointer-events-auto cursor-default select-none"
              style={{
                fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
                opacity: uiReady ? 1 : 0,
                transform: uiReady ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 1s 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform, opacity'
              }}
            >
              新沒系館是一個虛擬的「系館」<br/>
              因為我們沒有真正的系館。
            </p>
            
            <button 
              id="ui-enter"
              onClick={handleEnter}
              className="mt-6 sm:mt-8 md:mt-6 text-white/70 font-light tracking-[0.5rem] duration-[600ms] hover:text-white hover:tracking-[0.6rem] hover:-translate-y-0.5 active:translate-y-0 relative group pointer-events-auto cursor-pointer"
              style={{
                fontSize: 'clamp(0.8rem, 1.6vw, 1rem)',
                opacity: uiReady ? 1 : 0,
                transform: uiReady ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                transition: 'opacity 1s 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 1s 0.5s cubic-bezier(0.22, 1, 0.36, 1), color 600ms, letter-spacing 600ms, transform 300ms',
                background: 'none',
                border: 'none',
                willChange: 'transform, opacity'
              }}
            >
              ENTER
              <span 
                className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/80 transition-all duration-[400ms] group-hover:w-full"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </button>
          </div>
          
          {/* CRT 效果 */}
          <div 
            className="hidden md:block fixed inset-0 pointer-events-none z-[1000]"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0) 0,
                rgba(255,255,255,0.003) 1px,
                rgba(0,0,0,0) 2px,
                rgba(0,0,0,0) 3px
              )`,
              opacity: 0.4,
              animation: 'scanlines 12s linear infinite'
            }}
          />
        </div>
        
        {/* 結構化數據 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "NMANODEPT 新沒系館",
              "description": "探索藝術作品的虛擬數位空間，新沒系館是一個創新的藝術展示平台",
              "url": typeof window !== 'undefined' ? window.location.origin : '',
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${typeof window !== 'undefined' ? window.location.origin : ''}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              },
              "mainEntity": {
                "@type": "Organization",
                "name": "NMANODEPT",
                "description": "虛擬藝術展示空間",
                "sameAs": []
              }
            })
          }}
        />
        
        {/* 預載入連結 */}
        <link rel="preconnect" href="https://artwork-submit-api.nmanodept.workers.dev" crossOrigin="anonymous" />
        <link rel="prefetch" href="/search" />
      </div>
      
      <style jsx global>{`
        @keyframes titleFadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95);
            filter: blur(10px);
          }
          50% {
            filter: blur(0px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes subtitleFadeIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes enterFadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
      `}</style>
    </>
  );
};

export default IndexPage;
