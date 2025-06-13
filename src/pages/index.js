// src/pages/index.js
import React, { useEffect, useRef, useState } from 'react'
import { navigate } from 'gatsby'
import Seo from '../components/common/Seo'

// Three.js 場景組件
const ThreeScene = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [artworksData, setArtworksData] = useState([])
  
  // 獲取已審核的作品列表
  useEffect(() => {
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
  }, [])
  
  useEffect(() => {
    if (typeof window === 'undefined' || artworksData.length === 0) return
    
    // 動態載入 Three.js
    const loadThree = async () => {
      const THREE = await import('three')
      
      if (!containerRef.current) return
      
      // 設備檢測
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      // CONFIG - 優化效能並整合 thebuildingiwant.html 的參數
      const CONFIG = {
        building: {
          mainWall: {
            rows: isMobile ? 4 : 6,
            cols: isMobile ? 6 : 8,
            spacing: 10,
            sizeMin: 9,
            sizeMax: 11,
            centerHeightBonus: 8  // 中心高度加成
          },
          sideWing: {
            count: isMobile ? 30 : 60,  // 增加數量
            baseRadius: 15,
            maxRadius: 70,
            sizeMin: 6,
            sizeMax: 8,
            xOffset: 40  // 側翼橫向偏移
          },
          foundation: {
            count: isMobile ? 10 : 15,
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
          maxFPS: isMobile ? 30 : 60,
          shadowsEnabled: !isMobile,
          antialias: false,
          pixelRatio: isMobile ? 1 : 1.5
        }
      };

      // 性能優化：幀率限制
      let lastFrameTime = 0;
      const frameInterval = 1000 / CONFIG.performance.maxFPS;
      
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
        preserveDrawingBuffer: false
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.performance.pixelRatio));
      renderer.shadowMap.enabled = CONFIG.performance.shadowsEnabled;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      containerRef.current.appendChild(renderer.domElement);
      
      renderer.domElement.style.cursor = 'default';

      // 燈光設置 - 參考 thebuildingiwant.html 的較暗設置
      const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
      scene.add(ambientLight);
      
      const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
      mainLight.position.set(30, 50, 20);
      if (CONFIG.performance.shadowsEnabled) {
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
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
          const gridSize = 400;
          const divisions = 20;
          const step = gridSize / divisions;
          const halfSize = gridSize / 2;
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.2,
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

      // 背景方塊
      class BackgroundCubes {
        constructor() {
          this.group = new THREE.Group();
          this.cubes = [];
          this.createCubes();
          scene.add(this.group);
        }
        
        createCubes() {
          const count = isMobile ? 10 : 20;
          
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
            color: 0xffffff,
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
                  backMat.color.setHex(Math.random() > 0.5 ? 0xff0080 : 0x00ff80);
                  setTimeout(() => {
                    backMat.color.setHex(0xffffff);
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
        
        // 網格線
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
        
        // 雜訊
        for(let i = 0; i < 150; i++) {
          const n = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgba(${n},${n},${n},${Math.random() * 0.02})`;
          ctx.fillRect(
            Math.random() * size,
            Math.random() * size,
            Math.random() * 1.5,
            Math.random() * 1.5
          );
        }
        
        // 邊框
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, size - 24, size - 24);
        
        // ID文字
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

      // 載入作品圖片
      function loadArtworkTexture(artwork) {
        const cacheKey = `artwork_${artwork.id}`;
        
        if (textureCache.has(cacheKey)) {
          return textureCache.get(cacheKey);
        }
        
        if (loadingTextures.has(cacheKey)) {
          return loadingTextures.get(cacheKey);
        }
        
        const loadPromise = new Promise((resolve) => {
          const texture = textureLoader.load(
            artwork.main_image_url,
            (loadedTexture) => {
              loadedTexture.minFilter = THREE.LinearFilter;
              loadedTexture.magFilter = THREE.LinearFilter;
              loadedTexture.generateMipmaps = false;
              loadedTexture.encoding = THREE.sRGBEncoding;
              
              if (textureCache.size >= MAX_TEXTURE_CACHE) {
                const firstKey = textureCache.keys().next().value;
                const firstTexture = textureCache.get(firstKey);
                firstTexture.dispose();
                textureCache.delete(firstKey);
              }
              
              textureCache.set(cacheKey, loadedTexture);
              loadingTextures.delete(cacheKey);
              resolve(loadedTexture);
            },
            undefined,
            (error) => {
              console.error('Error loading texture:', error);
              loadingTextures.delete(cacheKey);
              resolve(createFallbackTexture(artwork));
            }
          );
        });
        
        loadingTextures.set(cacheKey, loadPromise);
        return loadPromise;
      }

      // 創建備用紋理
      function createFallbackTexture(artwork) {
        const size = CONFIG.visual.imageTextureSize;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        const g = Math.floor(30 + Math.random() * 50);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = 'rgba(255,255,255,.1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, size - 40, size - 40);
        
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.font = `bold ${size/12}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(artwork.title || `#${artwork.id}`, size/2, size/2);
        
        if (artwork.author) {
          ctx.font = `${size/16}px monospace`;
          ctx.fillStyle = 'rgba(255,255,255,.5)';
          ctx.fillText(artwork.author, size/2, size/2 + size/10);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        return texture;
      }

      // WorkPlane 類別 - 整合 thebuildingiwant.html 的效果
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
          
          // 決定是否顯示彩色圖片
          this.showColorImage = Math.random() < CONFIG.visual.imageDisplayRatio;
          
          // 預設長寬比
          let aspect = 0.8 + Math.random() * 0.4;
          
          // 創建幾何體
          const geometry = new THREE.PlaneGeometry(size * aspect, size);
          
          // 創建材質
          const material = new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            color: new THREE.Color(0.5 + Math.random() * 0.2, 0.5 + Math.random() * 0.2, 0.5 + Math.random() * 0.2),
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

          // 邊框線條
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.05,
              linewidth: 1
            })
          );
          this.mesh.add(edges);
          this.edges = edges;

          // 發光效果（hover用）
          const glowGeometry = new THREE.PlaneGeometry(size * aspect * 1.08, size * 1.08);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
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
              
              const texture = await loadArtworkTexture(this.artwork);
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
        
        update(deltaTime, time) {
          if (!this.entranceComplete) return;
          
          this.time += deltaTime * 0.08 * CONFIG.animation.speedMultiplier;
          
          // 漂浮動畫
          const drift = new THREE.Vector3(
            Math.sin(this.time * this.drift.speed.x + this.drift.phase.x) * this.drift.intensity,
            Math.cos(this.time * this.drift.speed.y + this.drift.phase.y) * this.drift.intensity,
            Math.sin(this.time * this.drift.speed.z + this.drift.phase.z) * this.drift.intensity * 0.3
          );
          
          // 故障效果
          if (Math.random() < CONFIG.animation.glitchChance) {
            this.glitchUntil = time + 0.08 + Math.random() * 0.15;
          }
          
          if (time < this.glitchUntil) {
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
            
            // 恢復原色
            if (this.showColorImage) {
              this.mesh.material.color.setRGB(1, 1, 1);
            } else {
              const g = this.mesh.material.userData?.originalGray || 0.6;
              this.mesh.material.color.setRGB(g, g, g);
            }
          }
          
          this.mesh.position.copy(this.basePos).add(drift);
          
          // 輕微旋轉
          this.mesh.rotation.y += Math.cos(this.time * 0.2) * 0.001;
          
          // 縮放動畫
          this.currentScale += (this.targetScale - this.currentScale) * 0.4;
          this.mesh.scale.setScalar(this.currentScale);
          
          // 發光效果
          const glowIntensity = this.currentScale > 1 ? 0.12 : 0.03;
          this.glow.material.opacity += (glowIntensity - this.glow.material.opacity) * 0.08;
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
        
        update(deltaTime, time) {
          this.planes.forEach(plane => plane.update(deltaTime, time));
        }
        
        dispose() {
          this.planes.forEach(plane => plane.dispose());
          scene.remove(this.group);
        }
      }

      // 建立場景
      const building = new Building();
      building.generate();

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

      // 主迴圈
      const clock = new THREE.Clock();
      let frame = 0;
      
      const animate = (currentTime) => {
        if (!containerRef.current) return;
        
        requestAnimationFrame(animate);
        
        // 幀率限制
        if (currentTime - lastFrameTime < frameInterval) return;
        lastFrameTime = currentTime;
        
        const deltaTime = clock.getDelta();
        const time = clock.getElapsedTime();
        
        // 更新元素
        building.update(deltaTime, time);
        floatingGrid.update(time);
        backgroundCubes.update();

        // 光源移動
        mainLight.position.x = Math.sin(time * 0.03) * 25;
        mainLight.position.z = Math.cos(time * 0.03) * 25;
        fillLight.position.x = -20 + Math.sin(time * 0.05) * 10;
        fillLight.position.y = 20 + Math.cos(time * 0.04) * 8;
        accentLight.position.x = 15 + Math.cos(time * 0.045) * 12;
        accentLight.position.z = 40 + Math.sin(time * 0.055) * 10;
        
        // 相機呼吸
        camera.position.x = Math.sin(time * 0.012) * CONFIG.camera.breathIntensity;
        camera.position.y = Math.cos(time * 0.015) * CONFIG.camera.breathIntensity * 0.8;
        camera.lookAt(0, 10, -15);

        // Hover 檢測
        if (!(frame++ % 3)) {
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
        }
        
        renderer.render(scene, camera);
      };
      animate();
      
      // 儲存清理函數
      sceneRef.current = {
        dispose: () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('click', handleClick);
          if (isMobile) {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
          }
          floatingGrid.dispose();
          backgroundCubes.dispose();
          building.dispose();
          textureCache.forEach(texture => texture.dispose());
          textureCache.clear();
          loadingTextures.clear();
          imageDimensionsCache.clear();
          renderer.dispose();
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
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
  }, [artworksData]);
  
  return <div ref={containerRef} className="absolute inset-0" />;
};

const IndexPage = () => {
  const handleEnter = (e) => {
    e.preventDefault();
    navigate('/search');
  };
  
  return (
    <>
      <Seo title="首頁" description="探索藝術作品的數位展示空間" />
      
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
          
          {/* Three.js 渲染區域 */}
          <div className="relative z-0">
            <ThreeScene />
          </div>
          
          {/* UI 層 - 保留原本的位置 */}
          <div className="absolute inset-0 flex flex-col items-center pointer-events-none z-50" style={{ top: '2vh' }}>
            <h1 
              id="ui-title"
              className="text-white font-thin tracking-[1rem] sm:tracking-[1.2rem] md:tracking-[1.5rem] opacity-0 pointer-events-auto cursor-default select-none"
              style={{
                fontSize: 'clamp(3rem, 12vw, 6rem)',
                textShadow: '0 0 60px rgba(255,255,255,.15)',
                mixBlendMode: 'difference',
                animation: 'titleFadeIn 2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                willChange: 'transform, opacity'
              }}
            >
              NMANODEPT
            </h1>
            
            <p 
              id="ui-subtitle"
              className="text-center text-white/45 font-light tracking-[0.12rem] leading-[1.8] px-8 max-w-[600px] mt-6 sm:mt-8 md:mt-2 opacity-0 pointer-events-auto cursor-default select-none"
              style={{
                fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
                animation: 'subtitleFadeIn 2s 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                willChange: 'transform, opacity'
              }}
            >
              新沒系館是一個虛擬的「系館」<br/>
              因為我們沒有真正的系館。
            </p>
            
            <button 
              id="ui-enter"
              onClick={handleEnter}
              className="mt-6 sm:mt-8 md:mt-6 text-white/70 font-light tracking-[0.5rem] transition-all duration-[600ms] opacity-0 hover:text-white hover:tracking-[0.6rem] hover:-translate-y-0.5 active:translate-y-0 relative group pointer-events-auto cursor-pointer"
              style={{
                fontSize: 'clamp(0.8rem, 1.6vw, 1rem)',
                animation: 'enterFadeIn 2s 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
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
