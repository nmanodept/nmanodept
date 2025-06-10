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
          // 過濾已審核的作品並保存完整資料
          const approvedArtworks = data.filter(artwork => artwork.status === 'approved')
          setArtworksData(approvedArtworks)
        }
      } catch (error) {
        console.error('Failed to fetch artworks:', error)
        // 如果API失敗，使用預設資料避免錯誤
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
      
      // CONFIG - 優化效能
      const CONFIG = {
        building:{
          mainWall:{
            rows: isMobile ? 4 : 6,
            cols: isMobile ? 5 : 8,
            spacing:9,sizeMin:6,sizeMax:8,skipChance:.01,depthVariation:10
          },
          sideWing:{
            count: isMobile ? 20 : 40,
            distance:35,spread:60,sizeMin:5,sizeMax:8
          },
          foundation:{
            count: isMobile ? 8 : 15,
            radius:25,sizeMin:6,sizeMax:10
          }
        },
        animation:{
          driftIntensity:{
            wall: isMobile ? 0.6 : 1.2,
            wing: isMobile ? 0.9 : 1.8,
            foundation: isMobile ? 0.4 : 0.8
          },
          speedMultiplier: isMobile ? 0.7 : 1,
          glitchChance: isMobile ? 0.0003 : 0.0005,
          glitchIntensity: 1.5,
          scanLineIntensity: 1.2,
          wanderStrength: 0,
          entranceDelay: 0.5,
          entranceDuration: isMobile ? 1 : 2,
          entranceStagger: 0.03
        },
        camera:{
          startZ: isMobile ? 90 : 70,
          targetZ: isMobile ? 50 : 40,
          minZ:30,maxZ:120,breathIntensity:0
        },
        visual:{
          fogNear:20,
          fogFar: isMobile ? 200 : 250,
          opacity:{min:.45,max:.75},  // 黑白版本的透明度
          colorOpacity:{min:.6,max:.9},  // 彩色版本的透明度
          hoverScale: isMobile ? 1.25 : 1.45,
          hoverOpacity: 0.95,
          scanlineIntensity: isMobile ? 0.3 : 0.6,
          textureSize: isMobile ? 128 : 256,  // 黑白版本的紋理大小
          imageTextureSize: isMobile ? 512 : 1024,  // 彩色版本的紋理大小
          scanGridDensity: isMobile ? 12 : 16,
          imageDisplayRatio: .4  // 顯示彩色圖片的比例 (0-1)
        },
        performance:{
          maxFPS: isMobile ? 30 : 60,
          shadowsEnabled: false,
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
      const geometryCache = new Map();
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
          // 如果池子空了，重新填充
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
            // 如果載入失敗，返回預設比例
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
      scene.fog = new THREE.Fog(0x000000, CONFIG.visual.fogNear, CONFIG.visual.fogFar);
      scene.fog.color = new THREE.Color(0x030303);

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 60 : 75, 
        window.innerWidth/window.innerHeight, .1, 1000
      );
      camera.position.set(0,0,CONFIG.camera.startZ);

      const renderer = new THREE.WebGLRenderer({
        antialias: CONFIG.performance.antialias,
        alpha:false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false
      });
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.performance.pixelRatio));
      renderer.shadowMap.enabled = CONFIG.performance.shadowsEnabled;
      renderer.outputEncoding = THREE.sRGBEncoding;
      containerRef.current.appendChild(renderer.domElement);
      
      // 設置初始游標
      renderer.domElement.style.cursor = 'default';

      // 燈光 - 優化設置
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
      scene.add(ambientLight);
      
      const light1 = new THREE.PointLight(0xffffff, 0.22, 90);
      light1.position.set(20, 40, 20);
      scene.add(light1);
      
      let light2;
      if (!isMobile) {
        light2 = new THREE.PointLight(0xffffff, 0.18, 90);
        light2.position.set(-30, -30, -20);
        scene.add(light2);
      }

      // 背景網格 - 恢復原版效果
      class FloatingGrid {
        constructor() {
          this.group = new THREE.Group();
          this.lines = [];
          this.frameCount = 0;
          this.createGrid();
          scene.add(this.group);
        }
        
        createGrid() {
          const gridSize = 300;
          const divisions = CONFIG.visual.scanGridDensity;
          const step = gridSize / divisions;
          const halfSize = gridSize / 2;
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.12,
            fog: true
          });
          
          // 橫線
          for (let i = 0; i <= divisions; i++) {
            const geometry = new THREE.BufferGeometry();
            const y = -halfSize + i * step;
            const points = [];
            
            for (let j = 0; j <= divisions; j++) {
              const x = -halfSize + j * step;
              const z = Math.sin(j * 0.5) * 2;
              points.push(new THREE.Vector3(x, y, z));
            }
            
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = {
              baseY: y,
              waveOffset: Math.random() * Math.PI * 2,
              waveSpeed: 0.2 + Math.random() * 0.3
            };
            this.lines.push(line);
            this.group.add(line);
          }
          
          // 縱線
          for (let i = 0; i <= divisions; i++) {
            const geometry = new THREE.BufferGeometry();
            const x = -halfSize + i * step;
            const points = [];
            
            for (let j = 0; j <= divisions; j++) {
              const y = -halfSize + j * step;
              const z = Math.cos(j * 0.5) * 2;
              points.push(new THREE.Vector3(x, y, z));
            }
            
            geometry.setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.userData = {
              baseX: x,
              waveOffset: Math.random() * Math.PI * 2,
              waveSpeed: 0.2 + Math.random() * 0.3
            };
            this.lines.push(line);
            this.group.add(line);
          }
          
          this.group.position.set(0, 0, -80);
          this.group.rotation.x = Math.PI * 0.1;
        }
        
        update(time) {
          this.frameCount++;
          
          // 網格浮動動畫 - 每4幀更新一次以優化性能
          if (this.frameCount % 4 === 0) {
            this.lines.forEach((line, index) => {
              const positions = line.geometry.attributes.position.array;
              const userData = line.userData;
              
              if (userData.baseY !== undefined) {
                for (let i = 0; i < positions.length; i += 3) {
                  positions[i + 2] = Math.sin(time * userData.waveSpeed + i * 0.1 + userData.waveOffset) * 3;
                }
              } else if (userData.baseX !== undefined) {
                for (let i = 0; i < positions.length; i += 3) {
                  positions[i + 2] = Math.cos(time * userData.waveSpeed + i * 0.1 + userData.waveOffset) * 3;
                }
              }
              
              line.geometry.attributes.position.needsUpdate = true;
            });
          }
          
          // 故障效果 - 降低頻率
          if (this.frameCount % 40 === 0 && Math.random() < 0.015) {
            const randomLine = this.lines[Math.floor(Math.random() * this.lines.length)];
            if (randomLine && randomLine.material) {
              randomLine.material.opacity = 0.25;
              setTimeout(() => {
                if (randomLine && randomLine.material) {
                  randomLine.material.opacity = 0.12;
                }
              }, 50);
            }
          }
          
          // 整體旋轉
          this.group.rotation.y = Math.sin(time * 0.015) * 0.04;
          this.group.rotation.z = Math.cos(time * 0.012) * 0.025;
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

      // 全螢幕動畫管理 - 更平滑的版本
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
          
          // 保持 hover 狀態的縮放
          const currentScale = workPlane.hoverScale;
          
          const flipGroup = new THREE.Group();
          flipGroup.position.copy(worldPos);
          flipGroup.rotation.copy(mesh.rotation);
          flipGroup.scale.setScalar(currentScale); // 使用當前的 hover 縮放
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
          
          const flipDuration = 600;    // 翻轉時間
          const scaleDuration = 1500;  // 更長的縮放時間
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
                
                // 從當前縮放開始，而不是從 1 開始
                const initialScale = currentScale + flipEased * 0.2;
                flipGroup.scale.setScalar(initialScale);
                
                // 輕微故障效果
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
                
                // 從當前縮放過渡到目標縮放
                const currentAnimScale = (currentScale * 1.2) + (targetScale - currentScale * 1.2) * scaleEased;
                flipGroup.scale.setScalar(currentAnimScale);
                
                const targetPos = new THREE.Vector3(0, 0, (worldPos.z + camera.position.z) / 2);
                flipGroup.position.lerpVectors(worldPos, targetPos, scaleEased);
                
                // 背景淡入
                if (scaleProgress > 0.2) {
                  const bgOpacity = (scaleProgress - 0.2) / 0.8;
                  backMat.opacity = 1 - bgOpacity * 0.5;
                }
                
                // 淡出效果 - 更早開始
                if (scaleProgress > 0.4) {
                  const fadeOpacity = 1 - (scaleProgress - 0.4) / 0.6;
                  renderer.domElement.style.opacity = fadeOpacity;
                }
                
                // 增強故障效果
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
      function createPlaceholderTexture(artwork){
        const cacheKey = `placeholder_${artwork.id}`;
        if (textureCache.has(cacheKey)) {
          return textureCache.get(cacheKey);
        }
        
        const size = CONFIG.visual.textureSize;
        const c=document.createElement('canvas');
        c.width=c.height=size;
        const ctx=c.getContext('2d', { alpha: false });
        
        const g=Math.floor(100+Math.random()*100);
        ctx.fillStyle=`rgb(${g},${g},${g})`;
        ctx.fillRect(0,0,size,size);
        
        // 減少雜訊數量以優化性能
        for(let i=0;i<200;i++){
          const n=Math.random()>.5?255:0;
          const s = Math.random()*3;
          ctx.fillStyle=`rgba(${n},${n},${n},${Math.random()*.08})`;
          ctx.fillRect(Math.random()*size,Math.random()*size,s,s);
        }
        
        // 輕微的掃描線
        ctx.strokeStyle='rgba(255,255,255,.04)';
        for(let y=0;y<size;y+=12){
          ctx.beginPath();
          ctx.moveTo(0,y);
          ctx.lineTo(size,y);
          ctx.stroke();
        }
        
        ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;
        ctx.strokeRect(20,20,size-40,size-40);
        ctx.fillStyle='rgba(0,0,0,.5)';ctx.font=`bold ${size/8}px monospace`;
        ctx.fillText(`#${String(artwork.id).padStart(3,'0')}`,size/10,size/5);
        
        const texture = new THREE.CanvasTexture(c);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        
        // 限制紋理快取大小
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
      function loadArtworkTexture(artwork){
        const cacheKey = `artwork_${artwork.id}`;
        
        // 檢查快取
        if (textureCache.has(cacheKey)) {
          return textureCache.get(cacheKey);
        }
        
        // 檢查是否正在載入
        if (loadingTextures.has(cacheKey)) {
          return loadingTextures.get(cacheKey);
        }
        
        // 創建載入承諾
        const loadPromise = new Promise((resolve) => {
          const texture = textureLoader.load(
            artwork.main_image_url,
            // 載入成功
            (loadedTexture) => {
              loadedTexture.minFilter = THREE.LinearFilter;
              loadedTexture.magFilter = THREE.LinearFilter;
              loadedTexture.generateMipmaps = false;
              loadedTexture.encoding = THREE.sRGBEncoding;
              
              // 限制快取大小
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
            // 載入進度
            undefined,
            // 載入錯誤
            (error) => {
              console.error('Error loading texture:', error);
              loadingTextures.delete(cacheKey);
              // 返回預設紋理
              resolve(createFallbackTexture(artwork));
            }
          );
        });
        
        loadingTextures.set(cacheKey, loadPromise);
        return loadPromise;
      }

      // 創建備用紋理（載入失敗時使用）
      function createFallbackTexture(artwork){
        const size = CONFIG.visual.imageTextureSize;
        const c=document.createElement('canvas');
        c.width=c.height=size;
        const ctx=c.getContext('2d', { alpha: false });
        
        // 深色背景
        const g=Math.floor(30+Math.random()*50);
        ctx.fillStyle=`rgb(${g},${g},${g})`;
        ctx.fillRect(0,0,size,size);
        
        // 邊框
        ctx.strokeStyle='rgba(255,255,255,.1)';
        ctx.lineWidth=4;
        ctx.strokeRect(20,20,size-40,size-40);
        
        // 標題文字
        ctx.fillStyle='rgba(255,255,255,.7)';
        ctx.font=`bold ${size/12}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(artwork.title || `#${artwork.id}`, size/2, size/2);
        
        // 作者文字
        if (artwork.author) {
          ctx.font=`${size/16}px monospace`;
          ctx.fillStyle='rgba(255,255,255,.5)';
          ctx.fillText(artwork.author, size/2, size/2 + size/10);
        }
        
        const texture = new THREE.CanvasTexture(c);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        return texture;
      }

      // WorkPlane 類別 - 優化版
      class WorkPlane{
        constructor(pos,size,drift,rot,group,index){
          this.artwork = getRandomArtwork();
          this.artworkId = this.artwork.id;
          this.basePos=pos.clone();
          this.rot=rot;
          this.drift=drift;
          this.group = group;
          this.index = index;
          this.baseSize = size;
          
          // 決定是否顯示彩色圖片
          this.showColorImage = Math.random() < CONFIG.visual.imageDisplayRatio;
          
          // 預設長寬比
          let aspect = .7+Math.random()*.6;
          
          // 創建初始幾何體
          const geoKey = `plane_${Math.round(size*10)}_${Math.round(aspect*10)}`;
          let geo;
          if (geometryCache.has(geoKey)) {
            geo = geometryCache.get(geoKey);
          } else {
            geo = new THREE.PlaneGeometry(size*aspect,size);
            geometryCache.set(geoKey, geo);
          }
          
          // 創建材質
          const mat = isMobile ? 
            new THREE.MeshLambertMaterial({
              transparent:true,
              opacity:0,
              side:THREE.DoubleSide,
              emissive: new THREE.Color(0x050505),
              emissiveIntensity: this.showColorImage ? 0.2 : 0.3
            }) :
            new THREE.MeshPhongMaterial({
              transparent:true,
              opacity:0,
              side:THREE.DoubleSide,
              shininess: this.showColorImage ? 2 : 3,
              specular: new THREE.Color(this.showColorImage ? 0x202020 : 0x101010),
              emissive: new THREE.Color(0x050505),
              emissiveIntensity: this.showColorImage ? 0.3 : 0.4
            });
          
          // 如果是黑白版本，設置灰色
          if (!this.showColorImage) {
            const gray = 0.4 + Math.random() * 0.4;
            mat.color.setRGB(gray, gray, gray);
            mat.userData = { originalGray: gray };
          }
          
          mat.needsUpdate = false;
          
          this.mesh=new THREE.Mesh(geo,mat);
          this.mesh.position.set(0,0,0);
          this.mesh.rotation.set(rot.x,rot.y,rot.z);
          this.mesh.scale.set(0,0,0);
          this.mesh.userData.workPlane=this;

          // 邊框線條
          if (!isMobile || group === 'wall') {
            const edgeOpacity = this.showColorImage ? .08 : .06;
            const edges=new THREE.LineSegments(
              new THREE.EdgesGeometry(geo),
              new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:edgeOpacity})
            );
            this.mesh.add(edges);
            this.edges = edges;
          }

          // 掃描框架（hover用）- 只在主牆創建
          if (!isMobile && group === 'wall') {
            const scanGeo = new THREE.PlaneGeometry(size*aspect*1.1,size*1.1);
            const scanMat = new THREE.LineBasicMaterial({
              color:0xffffff,
              transparent:true,
              opacity:0,
              linewidth: 2
            });
            this.scanFrame = new THREE.LineSegments(
              new THREE.EdgesGeometry(scanGeo),
              scanMat
            );
            this.mesh.add(this.scanFrame);
          }

          this.time=Math.random()*Math.PI*2;
          this.hoverScale=this.targetScale=1;
          
          // 根據是否顯示彩色圖片設置不同的透明度
          const opacityConfig = this.showColorImage ? CONFIG.visual.colorOpacity : CONFIG.visual.opacity;
          this.baseOpacity=THREE.MathUtils.lerp(opacityConfig.min,opacityConfig.max,Math.random());
          
          this.glitchUntil=0;
          
          this.wanderOffset = new THREE.Vector3(
            Math.random()*10-5,
            Math.random()*10-5,
            Math.random()*5-2.5
          );
          this.wanderSpeed = {
            x: 0.1 + Math.random()*0.2,
            y: 0.1 + Math.random()*0.2,
            z: 0.05 + Math.random()*0.1
          };
          this.wanderPhase = {
            x: Math.random()*Math.PI*2,
            y: Math.random()*Math.PI*2,
            z: Math.random()*Math.PI*2
          };
          
          this.entranceComplete = false;
          this.scanIntensity = 0;
          this.textureLoaded = false;
          this.geometryUpdated = false;
          
          // 載入紋理
          this.loadTexture();
        }
        
        async loadTexture() {
          if (this.showColorImage) {
            // 載入彩色圖片
            try {
              // 先獲取圖片尺寸
              const dimensions = await getImageDimensions(this.artwork.main_image_url);
              
              // 根據圖片比例更新幾何體
              if (!this.geometryUpdated && dimensions.aspect !== 1) {
                this.updateGeometry(dimensions.aspect);
              }
              
              // 載入紋理
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
            // 載入黑白紋理
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
          
          // 根據圖片比例創建新的幾何體
          const newGeo = new THREE.PlaneGeometry(this.baseSize * imageAspect, this.baseSize);
          
          // 更新網格的幾何體
          this.mesh.geometry.dispose();
          this.mesh.geometry = newGeo;
          
          // 更新邊框
          if (this.edges) {
            const edgeGeo = new THREE.EdgesGeometry(newGeo);
            this.edges.geometry.dispose();
            this.edges.geometry = edgeGeo;
          }
          
          // 更新掃描框架
          if (this.scanFrame) {
            const scanGeo = new THREE.PlaneGeometry(this.baseSize * imageAspect * 1.1, this.baseSize * 1.1);
            const scanEdgeGeo = new THREE.EdgesGeometry(scanGeo);
            this.scanFrame.geometry.dispose();
            this.scanFrame.geometry = scanEdgeGeo;
            scanGeo.dispose();
          }
        }
        
        animateEntrance() {
          const delay = this.index * CONFIG.animation.entranceStagger + 
                       (this.group === 'wall' ? 0 : 
                        this.group === 'wing' ? 0.4 : 0.8);
          
          // 初始位置偏移
          const offsetDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            -5 - Math.random() * 10
          );
          this.mesh.position.copy(this.basePos).add(offsetDirection.multiplyScalar(5));
          
          setTimeout(() => {
            const duration = CONFIG.animation.entranceDuration;
            const startTime = Date.now();
            const startScale = 0;
            const startRotation = {
              x: this.rot.x + (Math.random() - 0.5) * 0.5,
              y: this.rot.y + (Math.random() - 0.5) * 0.5,
              z: this.rot.z + (Math.random() - 0.5) * 0.5
            };
            
            const animate = () => {
              const elapsed = (Date.now() - startTime) / 1000;
              const progress = Math.min(elapsed / duration, 1);
              
              // 使用更複雜的緩動函數
              const easeProgress = this.easeOutExpo(progress);
              const scaleProgress = this.easeOutElastic(progress);
              const opacityProgress = this.easeOutQuad(progress);
              
              // Scale 動畫 - 彈性效果
              this.mesh.scale.setScalar(startScale + (1 - startScale) * scaleProgress);
              
              // Position 動畫 - 平滑移動
              this.mesh.position.lerpVectors(
                this.basePos.clone().add(offsetDirection.multiplyScalar(5)),
                this.basePos,
                easeProgress
              );
              
              // Rotation 動畫 - 回歸原位
              this.mesh.rotation.x = startRotation.x + (this.rot.x - startRotation.x) * easeProgress;
              this.mesh.rotation.y = startRotation.y + (this.rot.y - startRotation.y) * easeProgress;
              this.mesh.rotation.z = startRotation.z + (this.rot.z - startRotation.z) * easeProgress;
              
              // Opacity 動畫
              this.mesh.material.opacity = this.baseOpacity * opacityProgress;
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                this.entranceComplete = true;
              }
            };
            animate();
          }, delay * 1000);
        }
        
        easeOutExpo(t) {
          return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }
        
        easeOutElastic(t) {
          if (t === 0 || t === 1) return t;
          const p = 0.3;
          return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        }
        
        easeOutQuad(t) {
          return t * (2 - t);
        }
        
        update(dt,camPos,globalTime){
          if (!this.entranceComplete) return;
          
          this.time+=dt*.12*CONFIG.animation.speedMultiplier;
          
          // 基礎漂浮
          const ox=Math.sin(this.time*this.drift.s1+this.drift.p1)*this.drift.i1;
          const oy=Math.cos(this.time*this.drift.s2+this.drift.p2)*this.drift.i2;
          const oz=Math.sin(this.time*this.drift.s3+this.drift.p3)*this.drift.i3;
          
          // 遊蕩運動
          const wanderX = Math.sin(globalTime*this.wanderSpeed.x+this.wanderPhase.x)*this.wanderOffset.x*CONFIG.animation.wanderStrength;
          const wanderY = Math.cos(globalTime*this.wanderSpeed.y+this.wanderPhase.y)*this.wanderOffset.y*CONFIG.animation.wanderStrength;
          const wanderZ = Math.sin(globalTime*this.wanderSpeed.z+this.wanderPhase.z)*this.wanderOffset.z*CONFIG.animation.wanderStrength;

          // 偶發故障
          if(Math.random()<CONFIG.animation.glitchChance){
            this.glitchUntil=globalTime+.1+Math.random()*.2;
          }
          
          const p=this.mesh.position;
          if(globalTime<this.glitchUntil){
            p.set(
              this.basePos.x+ox+wanderX+(Math.random()-.5)*CONFIG.animation.glitchIntensity,
              this.basePos.y+oy+wanderY+(Math.random()-.5)*CONFIG.animation.glitchIntensity,
              this.basePos.z+oz+wanderZ+(Math.random()-.5)
            );
            this.mesh.material.opacity=this.baseOpacity*(0.7+Math.random()*0.4);
            
            // 故障時的顏色變化 - 簡化
            if (!isMobile && Math.random() < 0.2) {
              if (this.showColorImage && this.textureLoaded) {
                const hue = Math.random() * 0.05;
                this.mesh.material.color.setHSL(hue, 0.05, 0.5);
              } else if (!this.showColorImage) {
                const g = this.mesh.material.userData?.originalGray || 0.6;
                const variation = 0.1;
                const newG = g + (Math.random() - 0.5) * variation;
                this.mesh.material.color.setRGB(newG, newG, newG);
              }
              
              if (this.mesh.material.emissive) {
                this.mesh.material.emissive.setRGB(
                  0.05+Math.random()*0.02,
                  0.05+Math.random()*0.02,
                  0.05+Math.random()*0.02
                );
              }
            }
          }else{
            p.set(
              this.basePos.x+ox+wanderX,
              this.basePos.y+oy+wanderY,
              this.basePos.z+oz+wanderZ
            );
            this.mesh.material.opacity+=
              ((this.hoverScale>1?CONFIG.visual.hoverOpacity:this.baseOpacity)
              -this.mesh.material.opacity)*.1;
            
            // 恢復原色
            if (this.showColorImage) {
              this.mesh.material.color.setRGB(1,1,1);
            } else {
              const g = this.mesh.material.userData?.originalGray || 0.6;
              this.mesh.material.color.setRGB(g,g,g);
            }
            
            if (!isMobile && this.mesh.material.emissive) {
              this.mesh.material.emissive.setRGB(0.05,0.05,0.05);
            }
          }
          
          // 旋轉運動
          if (!isMobile || this.group === 'wall') {
            this.mesh.rotation.x = this.rot.x + Math.sin(this.time*0.3)*0.05;
            this.mesh.rotation.y = this.rot.y + Math.cos(this.time*0.4)*0.05;
            this.mesh.rotation.z = this.rot.z + Math.sin(this.time*0.5)*0.03;
          }
          
          // 掃描效果更新
          if(this.scanFrame && this.scanIntensity > 0) {
            this.scanIntensity -= dt * 3;
            this.scanFrame.material.opacity = this.scanIntensity * CONFIG.visual.scanlineIntensity;
            if (this.edges) {
              const baseEdgeOpacity = this.showColorImage ? 0.08 : 0.06;
              this.edges.material.opacity = baseEdgeOpacity + this.scanIntensity * 0.3;
            }
            
            if (!isMobile) {
              const glow = this.scanIntensity * 0.2;
              this.mesh.material.emissive.setRGB(0.05+glow,0.05+glow,0.05+glow);
            }
          }
          
          // scale 動畫 - 更平滑
          const scaleDiff = this.targetScale - this.hoverScale;
          if (Math.abs(scaleDiff) > 0.001) {
            this.hoverScale += scaleDiff * 0.15;
            this.mesh.scale.setScalar(this.hoverScale);
          }
        }
        
        onHover(yes){
          // 立即設置目標縮放
          this.targetScale=yes?CONFIG.visual.hoverScale:1;
          
          // 掃描效果
          if(yes && this.entranceComplete) {
            if(this.scanFrame) {
              this.scanIntensity = 1;
              this.scanFrame.material.opacity = CONFIG.visual.scanlineIntensity;
            }
            // 立即增加透明度以獲得即時反饋
            if (this.mesh.material) {
              this.mesh.material.opacity = Math.min(CONFIG.visual.hoverOpacity, this.baseOpacity * 1.15);
            }
          } else {
            // 恢復狀態
            if(this.scanFrame) {
              this.scanIntensity = 0;
              this.scanFrame.material.opacity = 0;
            }
          }
        }
        
        onClick() {
          // 確保作品ID存在
          if (this.artworkId && artworksData.find(a => a.id === this.artworkId)) {
            // 保持當前的 hover 狀態
            this.targetScale = this.hoverScale;
            fullscreenAnimation.animateToFullscreen(this).then(() => {
              navigate(`/art/${this.artworkId}`);
            });
          }
        }
        
        dispose(){
          if(this.mesh.material.map && !textureCache.has(`placeholder_${this.artworkId}`) && !textureCache.has(`artwork_${this.artworkId}`)){
            this.mesh.material.map.dispose();
          }
          this.mesh.material.dispose();
          this.mesh.geometry.dispose();
        }
      }

      // 建築生成器 - 簡化版
      class Building{
        constructor(){
          this.planes=[];
          this.group=new THREE.Group();
          scene.add(this.group);
        }
        
        generate(){
          this.createWall(0,0,-20);
          this.createWings(-CONFIG.building.sideWing.distance,0,-15,'left');
          this.createWings( CONFIG.building.sideWing.distance,0,-15,'right');
          this.createFoundation(0,-35,-20);
          this.group.position.y=-10;
          
          setTimeout(() => {
            // 分組進場以優化性能
            this.planes.forEach((plane, idx) => {
              plane.animateEntrance();
            });
            this.animateCameraEntrance();
            
            setTimeout(() => {
              this.startWandering();
            }, CONFIG.animation.entranceDelay * 1000);
          }, 300);
        }
        
        animateCameraEntrance() {
          const duration = 3.5;  // 稍微快一點
          const startZ = camera.position.z;
          const targetZ = CONFIG.camera.targetZ;
          const startTime = Date.now();
          
          // 初始輕微的側移
          camera.position.x = 3;
          camera.position.y = -2;
          
          const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用更平滑的緩動
            const eased = 1 - Math.pow(1 - progress, 3);
            
            camera.position.z = startZ + (targetZ - startZ) * eased;
            
            // 相機側移歸位
            camera.position.x = 3 * (1 - eased);
            camera.position.y = -2 * (1 - eased);
            
            // 輕微的視角變化
            camera.lookAt(0, -5 * (1 - eased), -20);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
        
        startWandering() {
          const duration = 2.5;
          const startTime = Date.now();
          
          const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            CONFIG.animation.wanderStrength = progress * (isMobile ? 0.7 : 1);
            CONFIG.camera.breathIntensity = progress * (isMobile ? 0.7 : 1);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
        
        createWall(cx,cy,cz){
          const b=CONFIG.building.mainWall;
          let index = 0;
          for(let r=0;r<b.rows;r++)for(let c=0;c<b.cols;c++){
            if(Math.random()<b.skipChance)continue;
            const pos=new THREE.Vector3(
              cx+(c-b.cols/2)*b.spacing+(Math.random()-.5)*3,
              cy+(r-b.rows/2)*b.spacing+(Math.random()-.5)*2,
              cz+Math.sin(c*.3+r*.2)*b.depthVariation+Math.random()*4
            );
            this.addPlane(pos,THREE.MathUtils.randFloat(b.sizeMin,b.sizeMax),
              this.drift('wall'),
              new THREE.Vector3(
                (Math.random()-.5)*.1,
                (Math.random()-.5)*.15,
                (Math.random()-.5)*.05
              ),
              'wall',
              index++
            );
          }
        }
        
        createWings(cx,cy,cz,side){
          const w=CONFIG.building.sideWing;
          let index = 0;
          for(let i=0;i<w.count;i++){
            const t=i/w.count,ang=t*Math.PI*.7-Math.PI*.35;
            const rad=10+t*w.spread;
            const pos=new THREE.Vector3(
              cx+Math.cos(ang)*rad*.5*(side==='left'?-1:1),
              cy+(Math.random()-.5)*50-t*10,
              cz+Math.sin(ang)*rad*.3+Math.random()*10
            );
            this.addPlane(pos,THREE.MathUtils.randFloat(w.sizeMin,w.sizeMax),
              this.drift('wing'),
              new THREE.Vector3(
                (Math.random()-.5)*.2,
                ang+(Math.random()-.5)*.5,
                (Math.random()-.5)*.15*(side==='left'?-1:1)
              ),
              'wing',
              index++
            );
          }
        }
        
        createFoundation(cx,cy,cz){
          const f=CONFIG.building.foundation;
          let index = 0;
          for(let i=0;i<f.count;i++){
            const ang=i/f.count*Math.PI*2;
            const r=f.radius+(Math.random()-.5)*15;
            const pos=new THREE.Vector3(
              cx+Math.cos(ang)*r,
              cy+Math.random()*5,
              cz+Math.sin(ang)*r*.4
            );
            this.addPlane(pos,THREE.MathUtils.randFloat(f.sizeMin,f.sizeMax),
              this.drift('foundation'),
              new THREE.Vector3((Math.random()-.5)*.05,ang+(Math.random()-.5)*.3,0),
              'foundation',
              index++
            );
          }
        }
        
        drift(type){
          const i=CONFIG.animation.driftIntensity[type]||1;
          return {
            p1:Math.random()*Math.PI*2,p2:Math.random()*Math.PI*2,p3:Math.random()*Math.PI*2,
            s1:.06+Math.random()*.12,s2:.1+Math.random()*.1,s3:.12+Math.random()*.08,
            i1:i*(.7+Math.random()*.3),
            i2:i*(.5+Math.random()*.3),
            i3:i*(.3+Math.random()*.2)
          };
        }
        
        addPlane(pos,size,drift,rot,group,index){
          const wp=new WorkPlane(pos,size,drift,rot,group,index);
          this.planes.push(wp);this.group.add(wp.mesh);
        }
        
        update(dt,camPos,time){this.planes.forEach(p=>p.update(dt,camPos,time));}
        
        dispose(){
          this.planes.forEach(p=>p.dispose());
          scene.remove(this.group);
        }
      }

      // 建立場景
      const building=new Building();
      building.generate();

      // 互動 - 優化版
      const raycaster=new THREE.Raycaster();
      raycaster.layers.set(0);  // 只檢測默認層
      raycaster.near = 0.1;
      raycaster.far = 200;  // 限制檢測距離
      const mouse=new THREE.Vector2();
      let hovered=null;
      
      function updatePointer(clientX, clientY) {
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      }
      
      const handleClick = (e) => {
        if(hovered && !fullscreenAnimation.isAnimating){
          hovered.onClick();
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
      
      const handleTouchStart = handleTouchMove;  // 同樣處理
      
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('click', handleClick);
      
      if (isMobile) {
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
      }

      // Resize
      const handleResize = () => {
        camera.aspect=window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      
      if (!isMobile) {
        const handleWheel = (e) => {
          camera.position.z=Math.max(
            CONFIG.camera.minZ,
            Math.min(CONFIG.camera.maxZ,camera.position.z+e.deltaY*.05)
          );
        };
        window.addEventListener('wheel', handleWheel);
      }

      // 主迴圈 - 優化版
      const clock=new THREE.Clock();
      let frame=0;
      let glitchTime = 0;
      
      const animate = (currentTime) => {
        if (!containerRef.current) return;
        
        requestAnimationFrame(animate);
        
        // 幀率限制
        if (currentTime - lastFrameTime < frameInterval) return;
        lastFrameTime = currentTime;
        
        const dt=clock.getDelta(),t=clock.getElapsedTime();
        
        building.update(dt,camera.position,t);
        floatingGrid.update(t);

        // 光源緩慢移動 - 優化
        light1.position.x=Math.sin(t*.06)*30;
        light1.position.z=Math.cos(t*.06)*30;
        light1.position.y=40+Math.sin(t*.08)*10;
        
        if (light2) {
          light2.position.x=Math.cos(t*.05)*40;
          light2.position.y=-30+Math.sin(t*.06)*15;
        }
        
        // 相機呼吸與搖擺
        const bx=Math.sin(t*.018)*3*CONFIG.camera.breathIntensity;
        const by=Math.cos(t*.022)*2*CONFIG.camera.breathIntensity;
        camera.position.x=bx;
        camera.position.y=by;
        
        // 全域故障效果
        if (Math.random() < 0.0004) {
          glitchTime = t + 0.06;
        }
        
        if (t < glitchTime) {
          // 相機震動 - 減少幅度
          camera.position.x += (Math.random() - 0.5) * 0.2;
          camera.position.y += (Math.random() - 0.5) * 0.2;
          camera.lookAt(
            (Math.random() - 0.5) * 0.3,
            by * 0.2,
            -20
          );
          
          // 顏色偏移
          renderer.domElement.style.filter = `hue-rotate(${Math.random() * 40}deg) saturate(1.1)`;
        } else {
          camera.lookAt(0,by*0.2,-20);
          renderer.domElement.style.filter = 'none';
        }

        // Hover 檢測 - 優化版本
        if(!(frame++%2)){  // 每2幀檢測一次，更流暢
          raycaster.setFromCamera(mouse,camera);
          const hits=raycaster.intersectObjects(building.group.children, false);  // 不遞歸檢測子物體
          const hit=hits.length > 0 && hits[0].object.userData.workPlane ? hits[0].object.userData.workPlane : null;
          
          if(hit!==hovered){
            if(hovered) {
              hovered.onHover(false);
            }
            hovered=hit;
            if(hovered) {
              hovered.onHover(true);
            }
            
            if (!isMobile) {
              renderer.domElement.style.cursor=hovered?'crosshair':'default';
            }
          }
        }
        
        renderer.render(scene,camera);
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
          building.dispose();
          textureCache.forEach(texture => texture.dispose());
          textureCache.clear();
          loadingTextures.clear();
          geometryCache.clear();
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
          
          {/* UI 層 - 調整位置到最上方 */}
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