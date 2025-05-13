import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Đường dẫn đến mô hình 3D
const MODEL_PATHS = {
  SUN: '/models/sun/scene.gltf',
  CLOUD: '/models/cloud/scene.gltf',
  RAIN_DROP: '/models/rain/scene.gltf',
  SNOWFLAKE: '/models/snowflake/scene.gltf',
  MOUNTAIN: '/models/mountain/scene.gltf'
};
/**
 * Component hiệu ứng thời tiết 3D với background được cải thiện
 * @param {Object} props
 * @param {string} [props.weatherCondition] - Điều kiện thời tiết
 * @param {number} [props.precipitationProbability] - Xác suất mưa/tuyết (0-100)
 * @param {string} [props.timeOfDay] - Thời điểm trong ngày
 */
const WeatherEffect = ({
  weatherCondition = 'clear',
  precipitationProbability = 0,
  timeOfDay = 'auto'
}) => {



  const mountRef = useRef(null);
  const particlesRef = useRef({ lastUpdate: 0 });
  const modelsRef = useRef({ clouds: [] });
  const animationFrameRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const initCompletedRef = useRef(false);
  const mountainLoadedRef = useRef(false);
  const [loadError, setLoadError] = useState(null);

  // Tạo kết cấu hạt tròn
  const createCircleTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Trích xuất thời điểm trong ngày
  const getTimeOfDay = useMemo(() => {
    if (timeOfDay && timeOfDay !== 'auto') return timeOfDay;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'dawn';
    if (hour >= 10 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }, [timeOfDay]);

  // Tạo phương thức để chuyển đổi mô hình dự trữ
  const getModelFallback = useCallback(
    (type) => {
      const currentTimeOfDay = getTimeOfDay;
      switch (type) {
        case 'sun':
          return () => {
            const geometry = new THREE.SphereGeometry(1.5, 32, 32);
            const material = new THREE.MeshBasicMaterial({
              color: currentTimeOfDay === 'night' ? 0xccccff : 0xffff99,
              transparent: true,
              opacity: 0.9,
            });
            return new THREE.Mesh(geometry, material);
          };
        case 'cloud':
          return () => {
            const cloudGroup = new THREE.Group();
            const geometryMain = new THREE.SphereGeometry(0.8, 16, 16);
            const geometrySmall = new THREE.SphereGeometry(0.6, 16, 16);
            const material = new THREE.MeshStandardMaterial({
              color: currentTimeOfDay === 'night' ? 0x333344 : 0xdddddd,
              transparent: true,
              opacity: 0.9,
              roughness: 0.5,
            });
            const main = new THREE.Mesh(geometryMain, material);
            cloudGroup.add(main);
            for (let i = 0; i < 5; i++) {
              const sphere = new THREE.Mesh(geometrySmall, material);
              sphere.position.set(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 1.5
              );
              cloudGroup.add(sphere);
            }
            return cloudGroup;
          };
        case 'mountain':
          return () => {
            const mountainGroup = new THREE.Group();
            const mountainGeometry = new THREE.ConeGeometry(7, 10, 5);
            const mountainMaterial = new THREE.MeshStandardMaterial({
              color: 0x555566,
              roughness: 0.9,
              flatShading: true,
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            if (weatherCondition?.toLowerCase().includes('snow')) {
              const snowCapGeometry = new THREE.ConeGeometry(2.5, 2.5, 5);
              const snowMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.5,
              });
              const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
              snowCap.position.y = 5;
              mountainGroup.add(snowCap);
            }
            mountainGroup.add(mountain);
            return mountainGroup;
          };
        case 'raindrop':
          return () => {
            const geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
            geometry.rotateX(Math.PI / 2);
            const material = new THREE.MeshStandardMaterial({
              color: 0x5599ff,
              transparent: true,
              opacity: 0.7,
              emissive: 0x3377ff,
              emissiveIntensity: 0.3,
            });
            return new THREE.Mesh(geometry, material);
          };
        case 'snowflake':
          return () => {
            const snowflakeGroup = new THREE.Group();
            const material = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9,
            });
            for (let i = 0; i < 6; i++) {
              const armGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.3);
              const arm = new THREE.Mesh(armGeometry, material);
              arm.rotation.z = (Math.PI / 3) * i;
              snowflakeGroup.add(arm);
              const detailGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.15);
              const detail1 = new THREE.Mesh(detailGeometry, material);
              detail1.position.z = 0.15;
              detail1.rotation.y = Math.PI / 4;
              arm.add(detail1);
              const detail2 = new THREE.Mesh(detailGeometry, material);
              detail2.position.z = 0.15;
              detail2.rotation.y = -Math.PI / 4;
              arm.add(detail2);
            }
            return snowflakeGroup;
          };
        default:
          return () => new THREE.Group();
      }
    },
    [getTimeOfDay, weatherCondition]
  );

  const onModelLoadError = useCallback((modelType, error) => {
    console.error(`Error loading ${modelType} model:`, error);
    setLoadError(`Failed to load ${modelType} model`);
    const fallbackModel = getModelFallback(modelType)();
    return fallbackModel;
  }, [getModelFallback]);

  // Thiết lập ban đầu
  useEffect(() => {
    if (!mountRef.current || initCompletedRef.current) return;

    console.log('Initializing WeatherEffect...');

    // Check if mountRef.current exists before removing children
    if (mountRef.current) {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    } else {
      console.warn('mountRef.current is null, skipping child removal');
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const frustumSize = 45;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      2000
    );
    camera.position.set(0, 0, 20); // Nâng camera lên để bao quát bầu trời
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 20;
    controls.maxDistance = 20;
    controls.minAzimuthAngle = -Math.PI / 6; // -30 độ
    controls.maxAzimuthAngle = Math.PI / 6; // 30 độ
    controlsRef.current = controls;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const currentTimeOfDay = getTimeOfDay;
    const dirLight = new THREE.DirectionalLight(
      currentTimeOfDay === 'night' ? 0x2233aa : 0xffffcc,
      currentTimeOfDay === 'night' ? 0.3 : 1.2
    );
    dirLight.position.set(20, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const createGround = () => {
      // Không tạo mặt đất
    };

    createGround();

    if (currentTimeOfDay === 'dawn' || currentTimeOfDay === 'dusk') {
      scene.fog = new THREE.FogExp2(0xffa366, 0.03);
    } else if (currentTimeOfDay === 'night') {
      scene.fog = new THREE.FogExp2(0x001133, 0.035);
    }

    const setBackgroundColor = (scene) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 128, 0, 0);
      const time = getTimeOfDay;
      const condition = (weatherCondition || '').toLowerCase();
      let bottomColor, topColor;

      if (time === 'night') {
        bottomColor = '#001122';
        topColor = '#112244';
      } else if (condition.includes('rain') || condition.includes('shower')) {
        bottomColor = '#3a4b5c';
        topColor = '#5a6b7c';
      } else if (condition.includes('snow')) {
        bottomColor = '#90a4be';
        topColor = '#b0c4de';
      } else if (condition.includes('cloud') || condition.includes('overcast')) {
        bottomColor = '#576979';
        topColor = '#778899';
      } else {
        bottomColor = time === 'dawn' ? '#ffaa88' : time === 'dusk' ? '#ff7744' : '#67aeeb';
        topColor = time === 'dawn' ? '#ffccaa' : time === 'dusk' ? '#ff9966' : '#87ceeb';
      }

      gradient.addColorStop(0, bottomColor);
      gradient.addColorStop(1, topColor);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(canvas);
      scene.background = texture;
    };

    setBackgroundColor(scene);

    const loader = new GLTFLoader();

    const loadMountain = () => {
      if (mountainLoadedRef.current) return;
      try {
        loader.load(
          MODEL_PATHS.MOUNTAIN,
          (gltf) => {
            const mountain = gltf.scene;
            mountain.position.set(0, -40, -50); // Giữ z = -50
            mountain.scale.set(100, 100, 100);
            scene.add(mountain);
            mountain.castShadow = true;
            modelsRef.current.mountain = mountain;
            mountainLoadedRef.current = true;
          },
          undefined,
          (error) => {
            console.error('Error loading mountain model:', error);
            setLoadError('Failed to load mountain model');
            const mountain = getModelFallback('mountain')();
            mountain.position.set(0, -15, -50); // Giữ z = -50
            scene.add(mountain);
            mountain.castShadow = true;
            modelsRef.current.mountain = mountain;
            mountainLoadedRef.current = true;
          }
        );
      } catch (err) {
        console.error('Failed to load mountain model:', err);
        setLoadError('Failed to load mountain model');
        const mountain = getModelFallback('mountain')();
        mountain.position.set(0, -15, -50); // Giữ z = -50
        scene.add(mountain);
        mountain.castShadow = true;
        modelsRef.current.mountain = mountain;
        mountainLoadedRef.current = true;
      }
    };

    loadMountain();

    const animate = () => {
      if (sceneRef.current && cameraRef.current) {
        updateParticles();
        updateModels();
        updateSunPosition();
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        if (composerRef.current) {
          composerRef.current.render();
        } else if (rendererRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    const handleResize = debounce(() => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      const frustumSize = 45;
      cameraRef.current.left = (frustumSize * aspect) / -2;
      cameraRef.current.right = (frustumSize * aspect) / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = -frustumSize / 2;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      if (composerRef.current) {
        composerRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    }, 100);

    window.addEventListener('resize', handleResize);

    animate();

    initCompletedRef.current = true;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      Object.values(particlesRef.current).forEach(({ particles }) => {
        if (particles) {
          sceneRef.current.remove(particles);
          if (particles.geometry) particles.geometry.dispose();
          if (particles.material) {
            if (particles.material.map) particles.material.map.dispose();
            particles.material.dispose();
          }
        }
      });
      particlesRef.current = {};
      Object.values(modelsRef.current).forEach((model) => {
        if (Array.isArray(model)) {
          model.forEach((item) => sceneRef.current.remove(item));
        } else if (model) {
          sceneRef.current.remove(model);
        }
      });
      modelsRef.current = { clouds: [] };
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }
      if (composerRef.current) {
        composerRef.current.passes.forEach((pass) => {
          if (pass.dispose) pass.dispose();
        });
        composerRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        if (mountRef.current && rendererRef.current.domElement) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      cameraRef.current = null;
      controlsRef.current = null;
      initCompletedRef.current = false;
      mountainLoadedRef.current = false;
    };
  }, [getTimeOfDay, getModelFallback]);

  const updateSunPosition = useCallback(() => {
    if (!modelsRef.current.sun) return;
    const currentTime = getTimeOfDay;
    const sun = modelsRef.current.sun;
    const timeInSeconds = Date.now() * 0.0001;

    if (currentTime === 'dawn') {
      sun.position.set(20, 10, -50); // Giữ z = -50
      sun.position.x += Math.sin(timeInSeconds * 0.2) * 2;
      sun.position.y += Math.sin(timeInSeconds * 0.5) * 0.5;
    } else if (currentTime === 'day') {
      sun.position.set(0, 20, -50); // Giữ z = -50
      sun.position.x += Math.sin(timeInSeconds * 0.1) * 5;
      sun.position.y = 20 + Math.sin(timeInSeconds * 0.2) * 2;
    } else if (currentTime === 'dusk') {
      sun.position.set(-20, 10, -50); // Giữ z = -50
      sun.position.x += Math.sin(timeInSeconds * 0.2) * 2;
      sun.position.y += Math.sin(timeInSeconds * 0.5) * 0.5;
    } else {
      sun.visible = false;
      return;
    }
    sun.visible = true;
  }, [getTimeOfDay]);

  useEffect(() => {
    if (!initCompletedRef.current || !sceneRef.current) return;

    console.log('Updating weather effects:', {
      condition: weatherCondition,
      probability: precipitationProbability,
      timeOfDay: getTimeOfDay,
    });

    const scene = sceneRef.current;
    const currentTimeOfDay = getTimeOfDay;
    const condition = (weatherCondition || '').toLowerCase();

    Object.keys(particlesRef.current).forEach((key) => {
      if (key === 'lastUpdate') return;
      if (particlesRef.current[key]?.particles) {
        scene.remove(particlesRef.current[key]?.particles);
        if (particlesRef.current[key].particles.geometry) {
          particlesRef.current[key].particles.geometry.dispose();
        }
        if (particlesRef.current[key].particles.material) {
          if (particlesRef.current[key].particles.material.map) {
            particlesRef.current[key].particles.material.map.dispose();
          }
          particlesRef.current[key].particles.material.dispose();
        }
      }
    });
    particlesRef.current = { lastUpdate: 0 };

    if (modelsRef.current.clouds) {
      modelsRef.current.clouds.forEach((cloud) => {
        scene.remove(cloud);
      });
      modelsRef.current.clouds = [];
    }

    if (modelsRef.current.raindrops) {
      modelsRef.current.raindrops.forEach((raindrop) => {
        scene.remove(raindrop.model);
      });
      modelsRef.current.raindrops = [];
    }

    if (modelsRef.current.snowflakes) {
      modelsRef.current.snowflakes.forEach((snowflake) => {
        scene.remove(snowflake.model);
      });
      modelsRef.current.snowflakes = [];
    }

    if (modelsRef.current.sun) {
      scene.remove(modelsRef.current.sun);
      modelsRef.current.sun = null;
    }

    const setBackgroundColor = (scene) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 128, 0, 0);
      const time = getTimeOfDay;
      const condition = (weatherCondition || '').toLowerCase();
      let bottomColor, topColor;

      if (time === 'night') {
        bottomColor = '#001122';
        topColor = '#112244';
      } else if (condition.includes('rain') || condition.includes('shower')) {
        bottomColor = '#3a4b5c';
        topColor = '#5a6b7c';
      } else if (condition.includes('snow')) {
        bottomColor = '#90a4be';
        topColor = '#b0c4de';
      } else if (condition.includes('cloud') || condition.includes('overcast')) {
        bottomColor = '#576979';
        topColor = '#778899';
      } else {
        bottomColor = time === 'dawn' ? '#ffaa88' : time === 'dusk' ? '#ff7744' : '#67aeeb';
        topColor = time === 'dawn' ? '#ffccaa' : time === 'dusk' ? '#ff9966' : '#87ceeb';
      }

      gradient.addColorStop(0, bottomColor);
      gradient.addColorStop(1, topColor);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(canvas);
      scene.background = texture;
    };

    setBackgroundColor(scene);

    if (scene.fog) {
      scene.fog = null;
    }

    if (currentTimeOfDay === 'dawn' || currentTimeOfDay === 'dusk') {
      scene.fog = new THREE.FogExp2(0xffa366, 0.03);
    } else if (currentTimeOfDay === 'night') {
      scene.fog = new THREE.FogExp2(0x001133, 0.035);
    } else if (condition.includes('fog') || condition.includes('mist')) {
      // Random mật độ sương mù từ 0.03 đến 0.05
      const fogDensity = 0.03 + Math.random() * 0.02;
      scene.fog = new THREE.FogExp2(0xcccccc, fogDensity);
    }

    const dirLight = scene.children.find((child) => child instanceof THREE.DirectionalLight);
    if (dirLight) {
      dirLight.color.setHex(currentTimeOfDay === 'night' ? 0x2233aa : 0xffffcc);
      dirLight.intensity = currentTimeOfDay === 'night' ? 0.3 : 1.2;
    }

    const loader = new GLTFLoader();

    const loadSun = () => {
      if (currentTimeOfDay === 'day' || currentTimeOfDay === 'dawn' || currentTimeOfDay === 'dusk') {
        try {
          loader.load(
            MODEL_PATHS.SUN,
            (gltf) => {
              const sun = gltf.scene;
              sun.scale.set(0.3, 0.3, 0.3);
              const sunLight = new THREE.PointLight(0xffffcc, 1, 100);
              sun.add(sunLight);
              scene.add(sun);
              modelsRef.current.sun = sun;
            },
            undefined,
            (error) => {
              console.error('Error loading sun model:', error);
              setLoadError('Failed to load sun model');
              const sun = getModelFallback('sun')();
              scene.add(sun);
              modelsRef.current.sun = sun;
            }
          );
        } catch (err) {
          console.error('Failed to load sun model:', err);
          setLoadError('Failed to load sun model');
          const sun = getModelFallback('sun')();
          scene.add(sun);
          modelsRef.current.sun = sun;
        }
      }
    };

    const loadClouds = () => {
      if (
        condition.includes('cloud') ||
        condition.includes('overcast') ||
        condition.includes('rain') ||
        precipitationProbability > 30
      ) {
        const cloudCount = condition.includes('overcast') ? 15 : 8;
        modelsRef.current.clouds = [];
        for (let i = 0; i < cloudCount; i++) {
          try {
            loader.load(
              MODEL_PATHS.CLOUD,
              (gltf) => {
                const cloud = gltf.scene;
                cloud.position.set(
                  Math.random() * 200 - 100,
                  5 + Math.random() * 10,
                  -60 + Math.random() * 40 // Random z từ -60 đến -20
                );
                const scale = 12 + Math.random() * 12; // Tăng scale từ 8-16 thành 12-24
                cloud.scale.set(scale, scale, scale);
                scene.add(cloud);
                if (!Array.isArray(modelsRef.current.clouds)) {
                  modelsRef.current.clouds = [];
                }
                modelsRef.current.clouds.push(cloud);
              },
              undefined,
              (error) => {
                console.error('Error loading cloud model:', error);
                setLoadError('Failed to load cloud model');
                const cloud = getModelFallback('cloud')();
                cloud.position.set(
                  Math.random() * 100 - 50,
                  5 + Math.random() * 10,
                  -60 + Math.random() * 40 // Random z từ -60 đến -20
                );
                const scale = 1.5 + Math.random() * 2; // Tăng scale từ 1-2.5 thành 1.5-3.5
                cloud.scale.set(scale, scale, scale);
                scene.add(cloud);
                if (!Array.isArray(modelsRef.current.clouds)) {
                  modelsRef.current.clouds = [];
                }
                modelsRef.current.clouds.push(cloud);
              }
            );
          } catch (err) {
            console.error('Failed to load cloud model:', err);
            setLoadError('Failed to load cloud model');
            const cloud = getModelFallback('cloud')();
            cloud.position.set(
              Math.random() * 100 - 50,
              5 + Math.random() * 10,
              -60 + Math.random() * 40 // Random z từ -60 đến -20
            );
            const scale = 1.5 + Math.random() * 2; // Tăng scale từ 1-2.5 thành 1.5-3.5
            cloud.scale.set(scale, scale, scale);
            scene.add(cloud);
            if (!Array.isArray(modelsRef.current.clouds)) {
              modelsRef.current.clouds = [];
            }
            modelsRef.current.clouds.push(cloud);
          }
        }
      }
    };

    let cloudInterval;
    if (
      condition.includes('cloud') ||
      condition.includes('overcast') ||
      condition.includes('rain') ||
      precipitationProbability > 30
    ) {
      cloudInterval = setInterval(() => {
        if (sceneRef.current && modelsRef.current.clouds.length < 20) {
          try {
            loader.load(
              MODEL_PATHS.CLOUD,
              (gltf) => {
                const cloud = gltf.scene;
                cloud.position.set(
                  Math.random() * 200 - 100,
                  5 + Math.random() * 10,
                  -60 + Math.random() * 40 // Random z từ -60 đến -20
                );
                const scale = 12 + Math.random() * 12; // Tăng scale từ 8-16 thành 12-24
                cloud.scale.set(scale, scale, scale);
                sceneRef.current.add(cloud);
                modelsRef.current.clouds.push(cloud);
                if (modelsRef.current.clouds.length > 20) {
                  const oldCloud = modelsRef.current.clouds.shift();
                  sceneRef.current.remove(oldCloud);
                }
              },
              undefined,
              (error) => {
                console.error('Error loading random cloud:', error);
                const cloud = getModelFallback('cloud')();
                cloud.position.set(
                  Math.random() * 100 - 50,
                  5 + Math.random() * 10,
                  -60 + Math.random() * 40 // Random z từ -60 đến -20
                );
                const scale = 1.5 + Math.random() * 2; // Tăng scale từ 1-2.5 thành 1.5-3.5
                cloud.scale.set(scale, scale, scale);
                sceneRef.current.add(cloud);
                modelsRef.current.clouds.push(cloud);
                if (modelsRef.current.clouds.length > 20) {
                  const oldCloud = modelsRef.current.clouds.shift();
                  sceneRef.current.remove(oldCloud);
                }
              }
            );
          } catch (err) {
            console.error('Failed to load random cloud:', err);
            const cloud = getModelFallback('cloud')();
            cloud.position.set(
              Math.random() * 100 - 50,
              5 + Math.random() * 10,
              -60 + Math.random() * 40 // Random z từ -60 đến -20
            );
            const scale = 1.5 + Math.random() * 2; // Tăng scale từ 1-2.5 thành 1.5-3.5
            cloud.scale.set(scale, scale, scale);
            sceneRef.current.add(cloud);
            modelsRef.current.clouds.push(cloud);
            if (modelsRef.current.clouds.length > 20) {
              const oldCloud = modelsRef.current.clouds.shift();
              sceneRef.current.remove(oldCloud);
            }
          }
        }
      }, 5000 + Math.random() * 5000);
    }

    const createWeatherParticles = () => {
      if (currentTimeOfDay === 'night') {
        createParticles('star', 100, 0xffffff, 0.1, 0);
      }
      if (condition.includes('rain') || (condition.includes('cloud') && precipitationProbability > 60)) {
        const rainCount = condition.includes('shower') ? 1000 : 500;
        createParticles('rain', rainCount, 0x9999ff, 0.08, -0.2, -0.05);
        if (rainCount > 800) {
          createParticles('splash', 200, 0x77aaff, 0.05, 0, 0, 0);
          modelsRef.current.raindrops = [];
          for (let i = 0; i < 20; i++) {
            try {
              loader.load(
                MODEL_PATHS.RAIN_DROP,
                (gltf) => {
                  const raindrop = gltf.scene;
                  raindrop.position.set(
                    (Math.random() - 0.5) * 20,
                    Math.random() * 10,
                    -55 + Math.random() * 30 // Random z từ -55 đến -25
                  );
                  raindrop.scale.set(0.1, 0.1, 0.1);
                  scene.add(raindrop);
                  if (!Array.isArray(modelsRef.current.raindrops)) {
                    modelsRef.current.raindrops = [];
                  }
                  modelsRef.current.raindrops.push({
                    model: raindrop,
                    velocity: 0.1 + Math.random() * 0.2,
                    startY: raindrop.position.y,
                    startZ: raindrop.position.z // Lưu z ban đầu
                  });
                },
                undefined,
                (error) => {
                  console.error('Error loading raindrop model:', error);
                  setLoadError('Failed to load raindrop model');
                  const raindrop = getModelFallback('raindrop')();
                  raindrop.position.set(
                    (Math.random() - 0.5) * 20,
                    Math.random() * 10,
                    -55 + Math.random() * 30 // Random z từ -55 đến -25
                  );
                  scene.add(raindrop);
                  if (!Array.isArray(modelsRef.current.raindrops)) {
                    modelsRef.current.raindrops = [];
                  }
                  modelsRef.current.raindrops.push({
                    model: raindrop,
                    velocity: 0.1 + Math.random() * 0.2,
                    startY: raindrop.position.y,
                    startZ: raindrop.position.z // Lưu z ban đầu
                  });
                }
              );
            } catch (err) {
              console.error('Failed to load raindrop model:', err);
              setLoadError('Failed to load raindrop model');
              const raindrop = getModelFallback('raindrop')();
              raindrop.position.set(
                (Math.random() - 0.5) * 20,
                Math.random() * 10,
                -55 + Math.random() * 30 // Random z từ -55 đến -25
              );
              scene.add(raindrop);
              if (!Array.isArray(modelsRef.current.raindrops)) {
                modelsRef.current.raindrops = [];
              }
              modelsRef.current.raindrops.push({
                model: raindrop,
                velocity: 0.1 + Math.random() * 0.2,
                startY: raindrop.position.y,
                startZ: raindrop.position.z // Lưu z ban đầu
              });
            }
          }
        }
      }
      if (condition.includes('snow')) {
        createParticles('snow', 800, 0xffffff, 0.1, -0.03, 0.01);
        modelsRef.current.snowflakes = [];
        for (let i = 0; i < 20; i++) {
          try {
            loader.load(
              MODEL_PATHS.SNOWFLAKE,
              (gltf) => {
                const snowflake = gltf.scene;
                snowflake.position.set(
                  (Math.random() - 0.5) * 20,
                  Math.random() * 10,
                  -55 + Math.random() * 30 // Random z từ -55 đến -25
                );
                snowflake.scale.set(0.1, 0.1, 0.1);
                snowflake.rotation.x = Math.random() * Math.PI;
                snowflake.rotation.y = Math.random() * Math.PI;
                scene.add(snowflake);
                if (!Array.isArray(modelsRef.current.snowflakes)) {
                  modelsRef.current.snowflakes = [];
                }
                modelsRef.current.snowflakes.push({
                  model: snowflake,
                  velocity: 0.01 + Math.random() * 0.03,
                  rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01,
                  },
                  startY: snowflake.position.y,
                  startZ: snowflake.position.z // Lưu z ban đầu
                });
              },
              undefined,
              (error) => {
                console.error('Error loading snowflake model:', error);
                setLoadError('Failed to load snowflake model');
                const snowflake = getModelFallback('snowflake')();
                snowflake.position.set(
                  (Math.random() - 0.5) * 20,
                  Math.random() * 10,
                  -55 + Math.random() * 30 // Random z từ -55 đến -25
                );
                snowflake.rotation.x = Math.random() * Math.PI;
                snowflake.rotation.y = Math.random() * Math.PI;
                scene.add(snowflake);
                if (!Array.isArray(modelsRef.current.snowflakes)) {
                  modelsRef.current.snowflakes = [];
                }
                modelsRef.current.snowflakes.push({
                  model: snowflake,
                  velocity: 0.01 + Math.random() * 0.03,
                  rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01,
                  },
                  startY: snowflake.position.y,
                  startZ: snowflake.position.z // Lưu z ban đầu
                });
              }
            );
          } catch (err) {
            console.error('Failed to load snowflake model:', err);
            setLoadError('Failed to load snowflake model');
            const snowflake = getModelFallback('snowflake')();
            snowflake.position.set(
              (Math.random() - 0.5) * 20,
              Math.random() * 10,
              -55 + Math.random() * 30 // Random z từ -55 đến -25
            );
            snowflake.rotation.x = Math.random() * Math.PI;
            snowflake.rotation.y = Math.random() * Math.PI;
            scene.add(snowflake);
            if (!Array.isArray(modelsRef.current.snowflakes)) {
              modelsRef.current.snowflakes = [];
            }
            modelsRef.current.snowflakes.push({
              model: snowflake,
              velocity: 0.01 + Math.random() * 0.03,
              rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01,
              },
              startY: snowflake.position.y,
              startZ: snowflake.position.z // Lưu z ban đầu
            });
          }
        }
      }
    };

    const createParticles = (type, count, color, size, velocityY, velocityX = 0, velocityZ = 0) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const opacities = new Float32Array(count);

      const aspect = mountRef.current ? mountRef.current.clientWidth / mountRef.current.clientHeight : 1;
      const frustumSize = 45;
      const width = frustumSize * aspect * 4;
      const height = 30;
      const depth = 30; // Tăng depth để phù hợp với phạm vi z từ -55 đến -25

      for (let i = 0; i < count; i++) {
        positions[i * 3] = Math.random() * width - width / 2;
        positions[i * 3 + 1] = Math.random() * height - 10;
        positions[i * 3 + 2] = (type === 'star' || type === 'glow') ? -50 : -55 + Math.random() * 30; // Random z từ -55 đến -25, trừ stars/glow
        velocities[i * 3] = velocityX + (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = velocityY - Math.random() * 0.01;
        velocities[i * 3 + 2] = 0; // Không thay đổi z trong quá trình di chuyển
        opacities[i] = 0.3 + Math.random() * 0.7;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: type === 'cloud' ? 0.6 : 0.8,
        blending: THREE.AdditiveBlending,
      });

      if (type === 'star' || type === 'glow') {
        material.map = createCircleTexture();
        material.alphaTest = 0.2;
      }

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);
      particlesRef.current[type] = {
        particles,
        velocities,
        opacities,
        width,
        height,
        depth,
      };
    };

    loadSun();
    loadClouds();
    createWeatherParticles();

    return () => {
      if (cloudInterval) {
        clearInterval(cloudInterval);
      }
    };
  }, [weatherCondition, precipitationProbability, getTimeOfDay, getModelFallback, createCircleTexture]);

  const updateParticles = useCallback(() => {
    const now = performance.now();
    if (particlesRef.current.lastUpdate && now - particlesRef.current.lastUpdate < 16) return;
    particlesRef.current.lastUpdate = now;

    Object.keys(particlesRef.current).forEach((type) => {
      if (type === 'lastUpdate') return;
      const { particles, velocities, width, height, depth } = particlesRef.current[type];

      if (!particles || !particles.geometry || !particles.geometry.attributes.position) return;

      const positions = particles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        // Không cập nhật positions[i + 2] để giữ z cố định

        if (positions[i] < -width / 2) positions[i] = width / 2;
        if (positions[i] > width / 2) positions[i] = -width / 2;

        if (positions[i + 1] < -10) positions[i + 1] = height - 10;
        if (positions[i + 1] > height - 10) positions[i + 1] = -10;
      }

      particles.geometry.attributes.position.needsUpdate = true;
    });
  }, []);

  const updateModels = useCallback(() => {
    if (modelsRef.current.clouds) {
      modelsRef.current.clouds.forEach((cloud) => {
        cloud.position.x -= 0.02;
        if (cloud.position.x < -100) {
          cloud.position.x = 100;
          cloud.position.z = -60 + Math.random() * 40; // Random z khi tái sử dụng
        }
        cloud.position.y += Math.sin(Date.now() * 0.0005) * 0.005;
      });
    }
    if (modelsRef.current.raindrops) {
      modelsRef.current.raindrops.forEach((raindrop) => {
        raindrop.model.position.y -= raindrop.velocity;
        if (raindrop.model.position.y < -22.5) {
          raindrop.model.position.y = raindrop.startY;
          raindrop.model.position.x = (Math.random() - 0.5) * 20;
          raindrop.model.position.z = raindrop.startZ;
        }
      });
    }
    if (modelsRef.current.snowflakes) {
      modelsRef.current.snowflakes.forEach((snowflake) => {
        snowflake.model.position.y -= snowflake.velocity;
        snowflake.model.position.x += Math.sin(Date.now() * 0.001) * 0.01;
        snowflake.model.rotation.x += snowflake.rotationSpeed.x;
        snowflake.model.rotation.y += snowflake.rotationSpeed.y;
        snowflake.model.rotation.z += snowflake.rotationSpeed.z;
        if (snowflake.model.position.y < -22.5) {
          snowflake.model.position.y = snowflake.startY;
          snowflake.model.position.x = (Math.random() - 0.5) * 20;
          snowflake.model.position.z = snowflake.startZ; // Giữ z ban đầu
        }
      });
    }
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%', // Changed from fixed px to 100%
        height: '360px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {loadError && (
        <div style={{ position: 'absolute', color: 'red', padding: '10px', zIndex: 10 }}>
          Error: {loadError}. Using fallback models.
        </div>
      )}
    </div>
  );
};

export default WeatherEffect;