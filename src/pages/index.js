// src/pages/index.js
import React, { useEffect, useRef, useState } from 'react'
import { navigate } from 'gatsby'
import Seo from '../components/common/Seo'

// Three.js 場景組件
const ThreeScene = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [availableArtworks, setAvailableArtworks] = useState([])
  
  // 獲取已審核的作品列表
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await fetch('https://artwork-submit-api.nmanodept.workers.dev/artworks')
        if (response.ok) {
          const data = await response.json()
          // 只獲取已審核的作品ID
          const approvedIds = data
            .filter(artwork => artwork.status === 'approved')
            .map(artwork => artwork.id)
          setAvailableArtworks(approvedIds)
        }
      } catch (error) {
        console.error('Failed to fetch artworks:', error)
        // 如果API失敗，使用預設ID避免錯誤
        setAvailableArtworks([1, 2, 3, 4, 5])
      }
    }
    
    fetchArtworks()
  }, [])
  
  useEffect(() => {
    if (typeof window === 'undefined' || availableArtworks.length === 0) return
    
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
            rows: isMobile ? 4 : 6,  // 恢復原本數量
            cols: isMobile ? 5 : 8,   // 恢復原本數量
            spacing:9,sizeMin:6,sizeMax:8,skipChance:.01,depthVariation:10
          },
          sideWing:{
            count: isMobile ? 20 : 40, // 恢復原本數量
            distance:35,spread:60,sizeMin:5,sizeMax:8
          },
          foundation:{
            count: isMobile ? 8 : 15,  // 恢復原本數量
            radius:25,sizeMin:6,sizeMax:10
          }
        },
        animation:{
          driftIntensity:{
            wall: isMobile ? 0.6 : 1.2,     // 恢復原本強度
            wing: isMobile ? 0.9 : 1.8,      // 恢復原本強度
            foundation: isMobile ? 0.4 : 0.8  // 恢復原本強度
          },
          speedMultiplier: isMobile ? 0.7 : 1,  // 恢復原本速度
          glitchChance: isMobile ? 0.0003 : 0.0005,
          glitchIntensity: 1.5,
          scanLineIntensity: 1.2,
          wanderStrength: 0,
          entranceDelay: 3,
          entranceDuration: isMobile ? 2.5 : 3.5,
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
          opacity:{min:.5,max:.85},
          hoverScale: isMobile ? 1.3 : 1.5,
          scanlineIntensity: isMobile ? 0.5 : 1,
          textureSize: 256, // 提高紋理品質
          scanGridDensity: 16
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
      const geometryCache = new Map();
      
      // ID分配函數
      const getRandomArtworkId = (() => {
        let idPool = [];
        let currentIndex = 0;
        
        return () => {
          // 如果池子空了，重新填充
          if (currentIndex >= idPool.length) {
            idPool = [...availableArtworks].sort(() => Math.random() - 0.5);
            currentIndex = 0;
          }
          return idPool[currentIndex++];
        };
      })();

      // THREE 基本設置
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, CONFIG.visual.fogNear, CONFIG.visual.fogFar);
      scene.fog.color = new THREE.Color(0x050505);

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 60 : 75, 
        window.innerWidth/window.innerHeight, .1, 1000
      );
      camera.position.set(0,0,CONFIG.camera.startZ);

      const renderer = new THREE.WebGLRenderer({
        antialias: CONFIG.performance.antialias,
        alpha:true,
        powerPreference: "high-performance",
        stencil: false,
        depth: false  // 關閉深度緩衝
      });
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.performance.pixelRatio));
      renderer.shadowMap.enabled = CONFIG.performance.shadowsEnabled;
      containerRef.current.appendChild(renderer.domElement);

      // 燈光
      scene.add(new THREE.AmbientLight(0xffffff,.25));
      const light1 = new THREE.PointLight(0xffffff,.25,100);
      light1.position.set(20,40,20);
      scene.add(light1);
      
      const light2 = new THREE.PointLight(0xffffff,.2,100);
      light2.position.set(-30,-30,-20);
      scene.add(light2);

      // 背景網格 - 恢復原版效果
      class FloatingGrid {
        constructor() {
          this.group = new THREE.Group();
          this.lines = [];
          this.createGrid();
          scene.add(this.group);
        }
        
        createGrid() {
          const gridSize = 300;
          const divisions = CONFIG.visual.scanGridDensity;
          const step = gridSize / divisions;
          const halfSize = gridSize / 2;
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.15,
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
          // 網格浮動動畫
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
            
            // 故障效果
            if (Math.random() < 0.0002) {
              line.material.opacity = 0.3;
              setTimeout(() => {
                line.material.opacity = 0.15;
              }, 50);
            }
          });
          
          // 整體旋轉
          this.group.rotation.y = Math.sin(time * 0.02) * 0.05;
          this.group.rotation.z = Math.cos(time * 0.015) * 0.03;
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
          
          const flipGroup = new THREE.Group();
          flipGroup.position.copy(worldPos);
          flipGroup.rotation.copy(mesh.rotation);
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
          
          const flipDuration = 800;    // 更慢的翻轉
          const scaleDuration = 1200;  // 更慢的縮放
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
                
                const initialScale = 1 + flipEased * 0.2;
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
                
                const currentScale = 1.2 + (targetScale - 1.2) * scaleEased;
                flipGroup.scale.setScalar(currentScale);
                
                const targetPos = new THREE.Vector3(0, 0, (worldPos.z + camera.position.z) / 2);
                flipGroup.position.lerpVectors(worldPos, targetPos, scaleEased);
                
                // 背景淡入
                if (scaleProgress > 0.3) {
                  const bgOpacity = (scaleProgress - 0.3) / 0.7;
                  backMat.opacity = 1 - bgOpacity * 0.5;
                }
                
                // 淡出效果
                if (scaleProgress > 0.6) {
                  const fadeOpacity = 1 - (scaleProgress - 0.6) / 0.4;
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

      // 素材貼圖 - 優化版
      function createPlaceholderTexture(artworkId){
        const cacheKey = `placeholder_${artworkId}`;
        if (textureCache.has(cacheKey)) {
          return textureCache.get(cacheKey);
        }
        
        const size = CONFIG.visual.textureSize;
        const c=document.createElement('canvas');
        c.width=c.height=size;
        const ctx=c.getContext('2d');
        
        const g=Math.floor(100+Math.random()*100);
        ctx.fillStyle=`rgb(${g},${g},${g})`;
        ctx.fillRect(0,0,size,size);
        
        // 更多變化的雜訊
        for(let i=0;i<300;i++){
          const n=Math.random()>.5?255:0;
          const s = Math.random()*3;
          ctx.fillStyle=`rgba(${n},${n},${n},${Math.random()*.1})`;
          ctx.fillRect(Math.random()*size,Math.random()*size,s,s);
        }
        
        // 輕微的掃描線
        ctx.strokeStyle='rgba(255,255,255,.05)';
        for(let y=0;y<size;y+=8){
          ctx.beginPath();
          ctx.moveTo(0,y);
          ctx.lineTo(size,y);
          ctx.stroke();
        }
        
        ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;
        ctx.strokeRect(20,20,size-40,size-40);
        ctx.fillStyle='rgba(0,0,0,.6)';ctx.font=`bold ${size/8}px monospace`;
        ctx.fillText(`#${String(artworkId).padStart(3,'0')}`,size/10,size/5);
        
        const texture = new THREE.CanvasTexture(c);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        textureCache.set(cacheKey, texture);
        return texture;
      }

      // WorkPlane 類別 - 優化版
      class WorkPlane{
        constructor(pos,size,drift,rot,group,index){
          this.artworkId = getRandomArtworkId(); // 分配實際存在的作品ID
          this.basePos=pos.clone();
          this.rot=rot;
          this.drift=drift;
          this.group = group;
          this.index = index;
          
          const aspect=.7+Math.random()*.6;
          const geoKey = `plane_${Math.round(size*10)}_${Math.round(aspect*10)}`;
          let geo;
          if (geometryCache.has(geoKey)) {
            geo = geometryCache.get(geoKey);
          } else {
            geo = new THREE.PlaneGeometry(size*aspect,size);
            geometryCache.set(geoKey, geo);
          }
          
          const tex=createPlaceholderTexture(this.artworkId);
          const mat=new THREE.MeshPhongMaterial({
            map:tex,transparent:true,opacity:0,
            side:THREE.DoubleSide,
            shininess: isMobile ? 5 : 10,
            emissive:new THREE.Color(.05,.05,.05),
            emissiveMap: isMobile ? null : tex
          });
          const gray = 0.3 + Math.random() * 0.5;
          mat.color.setRGB(gray, gray, gray);
          mat.userData = { originalGray: gray };
          
          this.mesh=new THREE.Mesh(geo,mat);
          this.mesh.position.set(0,0,0);
          this.mesh.rotation.set(rot.x,rot.y,rot.z);
          this.mesh.scale.set(0,0,0);
          this.mesh.userData.workPlane=this;

          // 邊框線條
          if (!isMobile || group === 'wall') {
            const edges=new THREE.LineSegments(
              new THREE.EdgesGeometry(geo),
              new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.06})
            );
            this.mesh.add(edges);
            this.edges = edges;
          }

          // 掃描框架（hover用）
          if (!isMobile) {
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
          this.baseOpacity=THREE.MathUtils.lerp(CONFIG.visual.opacity.min,CONFIG.visual.opacity.max,Math.random());
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
        }
        
        animateEntrance() {
          const delay = this.index * CONFIG.animation.entranceStagger + 
                       (this.group === 'wall' ? 0 : 
                        this.group === 'wing' ? 0.5 : 1);
          
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
          
          this.time+=dt*.15*CONFIG.animation.speedMultiplier;
          
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
            this.mesh.material.opacity=this.baseOpacity*(0.7+Math.random()*0.6);
            
            // 故障時的顏色變化
            if (Math.random() < 0.3) {
              const hue = Math.random() * 0.1;
              this.mesh.material.color.setHSL(hue, 0.1, 0.5);
            }
            
            if (!isMobile) {
              this.mesh.material.emissive.setRGB(
                0.05+Math.random()*0.05,
                0.05+Math.random()*0.05,
                0.05+Math.random()*0.05
              );
            }
          }else{
            p.set(
              this.basePos.x+ox+wanderX,
              this.basePos.y+oy+wanderY,
              this.basePos.z+oz+wanderZ
            );
            this.mesh.material.opacity+=
              ((this.hoverScale>1?1:this.baseOpacity)
              -this.mesh.material.opacity)*.05;
            // 恢復原色
            const g = this.mesh.material.userData?.originalGray || 0.5;
            this.mesh.material.color.setRGB(g,g,g);
            if (!isMobile) {
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
              this.edges.material.opacity = 0.06 + this.scanIntensity * 0.3;
            }
            
            if (!isMobile) {
              const glow = this.scanIntensity * 0.2;
              this.mesh.material.emissive.setRGB(0.05+glow,0.05+glow,0.05+glow);
            }
          }
          
          // scale 動畫
          this.hoverScale+=(this.targetScale-this.hoverScale)*.08;
          this.mesh.scale.setScalar(this.hoverScale);
        }
        
        onHover(yes){
          this.targetScale=yes?CONFIG.visual.hoverScale:1;
          if(yes && this.entranceComplete && this.scanFrame) {
            this.scanIntensity = 1;
          }
        }
        
        onClick() {
          // 確保作品ID存在
          if (this.artworkId && availableArtworks.includes(this.artworkId)) {
            fullscreenAnimation.animateToFullscreen(this).then(() => {
              navigate(`/art/${this.artworkId}`);
            });
          }
        }
        
        dispose(){
          if(this.mesh.material.map && !textureCache.has(`placeholder_${this.artworkId}`)){
            this.mesh.material.map.dispose();
          }
          this.mesh.material.dispose();
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
            this.planes.forEach(plane => plane.animateEntrance());
            this.animateCameraEntrance();
            
            setTimeout(() => {
              this.startWandering();
            }, CONFIG.animation.entranceDelay * 1000);
          }, 100);
        }
        
        animateCameraEntrance() {
          const duration = 4;
          const startZ = camera.position.z;
          const targetZ = CONFIG.camera.targetZ;
          const startTime = Date.now();
          
          // 初始輕微的側移
          camera.position.x = 5;
          camera.position.y = -3;
          
          const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用更平滑的緩動
            const eased = 1 - Math.pow(1 - progress, 4);
            
            camera.position.z = startZ + (targetZ - startZ) * eased;
            
            // 相機側移歸位
            camera.position.x = 5 * (1 - eased);
            camera.position.y = -3 * (1 - eased);
            
            // 輕微的視角變化
            camera.lookAt(0, -10 * (1 - eased), -20);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
        
        startWandering() {
          const duration = 3;
          const startTime = Date.now();
          
          const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            CONFIG.animation.wanderStrength = progress * (isMobile ? 0.8 : 1.2);
            CONFIG.camera.breathIntensity = progress * (isMobile ? 0.8 : 1.2);
            
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
            s1:.08+Math.random()*.15,s2:.12+Math.random()*.12,s3:.15+Math.random()*.1,
            i1:i*(.8+Math.random()*.4),
            i2:i*(.6+Math.random()*.4),
            i3:i*(.4+Math.random()*.3)
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

      // 互動 - 簡化版
      const raycaster=new THREE.Raycaster();
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
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);

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

        // 光源緩慢移動
        light1.position.x=Math.sin(t*.08)*30;
        light1.position.z=Math.cos(t*.08)*30;
        light1.position.y=40+Math.sin(t*.1)*10;
        
        if (!isMobile) {
          light2.position.x=Math.cos(t*.06)*40;
          light2.position.y=-30+Math.sin(t*.08)*15;
        }
        
        // 相機呼吸與搖擺
        const bx=Math.sin(t*.02)*3*CONFIG.camera.breathIntensity;
        const by=Math.cos(t*.025)*2*CONFIG.camera.breathIntensity;
        camera.position.x=bx;
        camera.position.y=by;
        
        // 全域故障效果
        if (Math.random() < 0.0005) {
          glitchTime = t + 0.08;
        }
        
        if (t < glitchTime) {
          // 相機震動
          camera.position.x += (Math.random() - 0.5) * 0.3;
          camera.position.y += (Math.random() - 0.5) * 0.3;
          camera.lookAt(
            (Math.random() - 0.5) * 0.5,
            by * 0.2,
            -20
          );
          
          // 顏色偏移
          renderer.domElement.style.filter = `hue-rotate(${Math.random() * 60}deg) saturate(1.2)`;
        } else {
          camera.lookAt(0,by*0.2,-20);
          renderer.domElement.style.filter = 'none';
        }

        // Hover 檢測 - 每3幀一次
        const checkInterval = isMobile ? 4 : 3;
        if(!(frame++%checkInterval)){
          raycaster.setFromCamera(mouse,camera);
          const hits=raycaster.intersectObjects(building.group.children);
          const hit=hits[0]?.object.userData.workPlane||null;
          if(hit!==hovered){
            hovered?.onHover(false);
            hovered=hit;
            hovered?.onHover(true);
            if (!isMobile) {
              renderer.domElement.style.cursor=hovered?'pointer':'crosshair';
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
          floatingGrid.dispose();
          building.dispose();
          textureCache.forEach(texture => texture.dispose());
          textureCache.clear();
          geometryCache.clear();
          renderer.dispose();
          if (containerRef.current) {
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
  }, [availableArtworks]);
  
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
          <ThreeScene />
          
          {/* UI 層 - 調整位置到更上方 */}
          <div className="absolute inset-0 flex flex-col items-center" style={{ top: '12vh' }}>
            <h1 
              className="text-white font-thin tracking-[1rem] sm:tracking-[1.2rem] md:tracking-[1.5rem] opacity-0 animate-titleFadeIn"
              style={{
                fontSize: 'clamp(3rem, 12vw, 6rem)',
                textShadow: '0 0 60px rgba(255,255,255,.15)',
                mixBlendMode: 'difference',
                animation: 'titleFadeIn 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
            >
              NMANODEPT
            </h1>
            
            <p 
              className="text-center text-white/45 font-light tracking-[0.12rem] leading-[1.8] px-8 max-w-[600px] mt-12 sm:mt-16 md:mt-20 opacity-0"
              style={{
                fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
                animation: 'subtitleFadeIn 2.5s 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
            >
              新沒系館是一個虛擬的「系館」<br/>
              作品在這裡遊蕩、交疊，留下痕跡。
            </p>
            
            <button 
              onClick={handleEnter}
              className="mt-12 sm:mt-16 md:mt-20 text-white/70 font-light tracking-[0.5rem] transition-all duration-[600ms] opacity-0 hover:text-white hover:tracking-[0.6rem] hover:-translate-y-0.5 active:translate-y-0 relative group"
              style={{
                fontSize: 'clamp(0.8rem, 1.6vw, 1rem)',
                animation: 'enterFadeIn 2.5s 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
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
                rgba(255,255,255,0.005) 1px,
                rgba(0,0,0,0) 2px,
                rgba(0,0,0,0) 3px
              )`,
              opacity: 0.5,
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