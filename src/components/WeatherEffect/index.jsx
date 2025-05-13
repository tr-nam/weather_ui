
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WeatherOverlay from '@/components/WeatherOverlay';

// Đường dẫn đến mô hình 3D
const MODEL_PATHS = {
  SUN: '/models/sun/scene.gltf',
  CLOUD: '/models/cloud/scene.gltf',
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
  const cloudPoolRef = useRef([]);
  const [loadError, setLoadError] = useState(null);

  const getCloudFromPool = useCallback(() => {
    if (cloudPoolRef.current.length > 0) {
      const cloud = cloudPoolRef.current.pop();
      cloud.visible = true;
      return cloud;
    }
    return null;
  }, []);

  const returnCloudToPool = useCallback((cloud) => {
    if (cloud) {
      cloud.visible = false;
      cloudPoolRef.current.push(cloud);
    }
  }, []);

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

  const getTimeOfDay = useMemo(() => {
    if (timeOfDay && timeOfDay !== 'auto') return timeOfDay;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'dawn';
    if (hour >= 10 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }, [timeOfDay]);

  const cachedGeometries = useMemo(() => ({
    main: new THREE.SphereGeometry(1.2, 8, 8),
    small: new THREE.SphereGeometry(0.9, 6, 6)
  }), []);

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
            const material = new THREE.MeshStandardMaterial({
              color: currentTimeOfDay === 'night' ? 0x333344 : 0xdddddd,
              transparent: true,
              opacity: 0.9,
              roughness: 0.5,
            });
            const main = new THREE.Mesh(cachedGeometries.main, material);
            cloudGroup.add(main);
            for (let i = 0; i < 3; i++) {
              const sphere = new THREE.Mesh(cachedGeometries.small, material);
              sphere.position.set(
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 0.7,
                (Math.random() - 0.5) * 2.2
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

  useEffect(() => {
    if (!mountRef.current || initCompletedRef.current) return;

    console.log('Initializing WeatherEffect...');
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
    camera.position.set(0, 0, 20);
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

    // Ensure the renderer canvas is interactive
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.addEventListener('mousedown', () => console.log('Three.js canvas mousedown'));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.dampingFactor = 0.01;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 20;
    controls.maxDistance = 20;
    controls.minAzimuthAngle = -Math.PI / 6;
    controls.maxAzimuthAngle = Math.PI / 6;
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

    const createGround = () => {};

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
      const addMountainLight = (mountain) => {
        if (getTimeOfDay === 'night') {
          const mountainLight = new THREE.PointLight(0xaaaaaa, 0.5, 50);
          mountainLight.position.set(0, -10, -30);
          scene.add(mountainLight);
          modelsRef.current.mountainLight = mountainLight;
        }
      };
      try {
        loader.load(
          MODEL_PATHS.MOUNTAIN,
          (gltf) => {
            const mountain = gltf.scene;
            mountain.position.set(0, -40, -50);
            mountain.scale.set(100, 100, 100);
            scene.add(mountain);
            mountain.castShadow = true;
            modelsRef.current.mountain = mountain;
            addMountainLight(mountain);
            mountainLoadedRef.current = true;
          },
          undefined,
          (error) => {
            console.error('Error loading mountain model:', error);
            setLoadError('Failed to load mountain model');
            const mountain = getModelFallback('mountain')();
            mountain.position.set(0, -15, -50);
            scene.add(mountain);
            mountain.castShadow = true;
            modelsRef.current.mountain = mountain;
            addMountainLight(mountain);
            mountainLoadedRef.current = true;
          }
        );
      } catch (err) {
        console.error('Failed to load mountain model:', err);
        setLoadError('Failed to load mountain model');
        const mountain = getModelFallback('mountain')();
        mountain.position.set(0, -15, -50);
        scene.add(mountain);
        mountain.castShadow = true;
        modelsRef.current.mountain = mountain;
        addMountainLight(mountain);
        mountainLoadedRef.current = true;
      }
    };

    loadMountain();

    const animate = () => {
      if (sceneRef.current && cameraRef.current) {
        const timestamp = performance.now();
        updateParticles(timestamp);
        if (!modelsRef.current.lastModelUpdate || timestamp - modelsRef.current.lastModelUpdate > 50) {
          modelsRef.current.lastModelUpdate = timestamp;
          updateModels();
          updateSunPosition();
        }
        if (controlsRef.current && controlsRef.current.update) {
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
      sun.position.set(20, 10, -50);
      sun.position.x += Math.sin(timeInSeconds * 0.2) * 2;
      sun.position.y += Math.sin(timeInSeconds * 0.5) * 0.5;
    } else if (currentTime === 'day') {
      sun.position.set(0, 20, -50);
      sun.position.x += Math.sin(timeInSeconds * 0.1) * 5;
      sun.position.y = 20 + Math.sin(timeInSeconds * 0.2) * 2;
    } else if (currentTime === 'dusk') {
      sun.position.set(-20, 10, -50);
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
        scene.remove(particlesRef.current[key].particles);
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
        returnCloudToPool(cloud);
      });
      modelsRef.current.clouds = [];
    }
    if (modelsRef.current.sun) {
      scene.remove(modelsRef.current.sun);
      modelsRef.current.sun = null;
    }
    if (modelsRef.current.mountainLight) {
      scene.remove(modelsRef.current.mountainLight);
      modelsRef.current.mountainLight = null;
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
      const fogDensity = 0.03 + Math.random() * 0.02;
      scene.fog = new THREE.FogExp2(0xcccccc, fogDensity);
    }

    const dirLight = scene.children.find((child) => child instanceof THREE.DirectionalLight);
    if (dirLight) {
      dirLight.color.setHex(currentTimeOfDay === 'night' ? 0x2233aa : 0xffffcc);
      dirLight.intensity = currentTimeOfDay === 'night' ? 0.3 : 1.2;
    }

    if (currentTimeOfDay === 'night' && modelsRef.current.mountain) {
      const mountainLight = new THREE.PointLight(0xaaaaaa, 0.5, 50);
      mountainLight.position.set(0, -10, -30);
      scene.add(mountainLight);
      modelsRef.current.mountainLight = mountainLight;
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
        condition.includes('clouds') ||
        condition.includes('overcast') ||
        condition.includes('rain') ||
        precipitationProbability > 30
      ) {
        const cloudCount = condition.includes('overcast') ? 5 : 3;
        modelsRef.current.clouds = [];

        for (let i = 0; i < 3; i++) {
          const poolCloud = getModelFallback('cloud')();
          poolCloud.visible = false;
          scene.add(poolCloud);
          cloudPoolRef.current.push(poolCloud);
        }

        for (let i = 0; i < cloudCount; i++) {
          try {
            loader.load(
              MODEL_PATHS.CLOUD,
              (gltf) => {
                const cloud = gltf.scene;
                cloud.position.set(
                  Math.random() * 200 - 100,
                  3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
                  -60 + Math.random() * 40
                );
                const scale = 20 + Math.random() * 30;
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
                const cloud = getModelFallback('clouds')();
                cloud.position.set(
                  Math.random() * 100 - 50,
                  3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
                  -60 + Math.random() * 40
                );
                const scale = 3 + Math.random() * 3.5;
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
              3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
              -60 + Math.random() * 40
            );
            const scale = 3 + Math.random() * 3.5;
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
        if (sceneRef.current && modelsRef.current.clouds.length < 12) {
          let cloud = getCloudFromPool();
          if (cloud) {
            cloud.position.set(
              100,
              3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
              -60 + Math.random() * 40
            );
            modelsRef.current.clouds.push(cloud);
          } else {
            try {
              loader.load(
                MODEL_PATHS.CLOUD,
                (gltf) => {
                  cloud = gltf.scene;
                  cloud.position.set(
                    100,
                    3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
                    -60 + Math.random() * 40
                  );
                  const scale = 20 + Math.random() * 30;
                  cloud.scale.set(scale, scale, scale);
                  sceneRef.current.add(cloud);
                  modelsRef.current.clouds.push(cloud);
                },
                undefined,
                (error) => {
                  console.error('Error loading random cloud:', error);
                  cloud = getModelFallback('cloud')();
                  cloud.position.set(
                    100,
                    3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
                    -60 + Math.random() * 40
                  );
                  const scale = 3 + Math.random() * 3.5;
                  cloud.scale.set(scale, scale, scale);
                  sceneRef.current.add(cloud);
                  modelsRef.current.clouds.push(cloud);
                }
              );
            } catch (err) {
              console.error('Failed to load random cloud:', err);
              cloud = getModelFallback('cloud')();
              cloud.position.set(
                100,
                3.5 + Math.random() * 7, // Giảm 30%: y từ 3.5 đến 10.5
                -60 + Math.random() * 40
              );
              const scale = 3 + Math.random() * 3.5;
              cloud.scale.set(scale, scale, scale);
              sceneRef.current.add(cloud);
              modelsRef.current.clouds.push(cloud);
            }
          }
          if (modelsRef.current.clouds.length > 12) {
            const oldCloud = modelsRef.current.clouds.shift();
            returnCloudToPool(oldCloud);
          }
        }
      }, 10000 + Math.random() * 10000);
    }

    const createWeatherParticles = () => {
      if (currentTimeOfDay === 'night') {
        createParticles('star', 100, 0xffffff, 0.1, 0);
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
      const depth = 30;

      for (let i = 0; i < count; i++) {
        positions[i * 3] = Math.random() * width - width / 2;
        positions[i * 3 + 1] = Math.random() * height - 10;
        positions[i * 3 + 2] = (type === 'star' || type === 'glow') ? -50 : -55 + Math.random() * 30;
        velocities[i * 3] = velocityX + (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = velocityY - Math.random() * 0.01;
        velocities[i * 3 + 2] = 0;
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
      cloudPoolRef.current = [];
    };
  }, [weatherCondition, precipitationProbability, getTimeOfDay, getModelFallback, createCircleTexture]);

  const updateParticles = useCallback((timestamp) => {
    if (particlesRef.current.lastUpdate && timestamp - particlesRef.current.lastUpdate < 16) return;
    particlesRef.current.lastUpdate = timestamp;

    Object.keys(particlesRef.current).forEach((type) => {
      if (type === 'lastUpdate') return;
      const { particles, velocities, width, height } = particlesRef.current[type];

      if (!particles || !particles.geometry || !particles.geometry.attributes.position) return;

      const positions = particles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];

        if (positions[i] < -width / 2) positions[i] = width / 2;
        if (positions[i] > width / 2) positions[i] = -width / 2;
        if (positions[i + 1] < -10) positions[i + 1] = height - 10;
        if (positions[i + 1] > height - 10) positions[i + 1] = -10;
      }

      particles.geometry.attributes.position.needsUpdate = true;
    });
  }, []);

  const updateModels = useCallback(() => {
    if (modelsRef.current.clouds && modelsRef.current.lastCloudUpdate) {
      const now = Date.now();
      if (now - modelsRef.current.lastCloudUpdate > 50) {
        modelsRef.current.lastCloudUpdate = now;
        const sinValue = Math.sin(now * 0.0003);

        modelsRef.current.clouds.forEach((cloud) => {
          cloud.position.x -= 0.05;
          if (cloud.position.x < -100) {
            cloud.position.x = 100;
            cloud.position.z = -60 + Math.random() * 40;
          }
          cloud.position.y += sinValue * 0.005;
        });
      }
    } else {
      modelsRef.current.lastCloudUpdate = Date.now();
    }
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '360px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        {loadError && (
          <div style={{ position: 'absolute', color: 'red', padding: '10px', zIndex: 10 }}>
            Error: {loadError}. Using fallback models.
          </div>
        )}
      </div>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <WeatherOverlay
          weatherCondition={weatherCondition}
          precipitationProbability={precipitationProbability}
          rainSize={0.5}
          snowSize={0.15}
          rainAngle={30}
          snowAngle={15}
        />
      </div>
    </div>
  );
};

export default WeatherEffect;
