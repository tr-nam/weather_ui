// src/components/WeatherEffect/sceneHelpers.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create the circle texture for particles once
let circleTextureCache = null;
export const createCircleTexture = () => {
  if (circleTextureCache) return circleTextureCache;
  
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
  circleTextureCache = texture;
  
  return texture;
};

// Get time of day based on current time or provided value
export const getTimeOfDay = (timeOfDay) => {
  if (timeOfDay) return timeOfDay;
  
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
};

// Initialize scene, camera, renderer and controls
export const initScene = (mountRef) => {
  // Scene
  const scene = new THREE.Scene();
  
  // Camera
  const aspect = mountRef.clientWidth / mountRef.clientHeight;
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
  
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(mountRef.clientWidth, mountRef.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mountRef.appendChild(renderer.domElement);
  
  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableRotate = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.5;
  controls.minZoom = 1;
  controls.maxZoom = 2;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minDistance = 20;
  controls.maxDistance = 20;
  controls.minAzimuthAngle = -Math.PI / 6; // -30 degrees
  controls.maxAzimuthAngle = Math.PI / 6;  // 30 degrees
  
  // Post-processing
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(mountRef.clientWidth, mountRef.clientHeight),
    0.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffcc, 1.2);
  dirLight.position.set(20, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);
  
  return { scene, camera, renderer, controls, composer };
};

// Create background gradient based on weather and time of day
export const createBackgroundGradient = (scene, weatherCondition, timeOfDay) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 128, 0, 0);
  const time = timeOfDay;
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
  
  // Create texture only as needed
  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
  
  return texture;
};

// Set fog based on weather condition and time of day
export const setupFog = (scene, weatherCondition, timeOfDay) => {
  // Clear existing fog
  scene.fog = null;
  
  const condition = (weatherCondition || '').toLowerCase();
  
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
    scene.fog = new THREE.FogExp2(0xffa366, 0.03);
  } else if (timeOfDay === 'night') {
    scene.fog = new THREE.FogExp2(0x001133, 0.035);
  } else if (condition.includes('fog') || condition.includes('mist')) {
    // Random fog density from 0.03 to 0.05
    const fogDensity = 0.03 + Math.random() * 0.02;
    scene.fog = new THREE.FogExp2(0xcccccc, fogDensity);
  }
};

// Resize handler for responsive rendering
export const handleResize = (mountRef, camera, renderer, composer) => {
  if (!mountRef) return;
  
  const aspect = mountRef.clientWidth / mountRef.clientHeight;
  const frustumSize = 45;
  
  camera.left = (frustumSize * aspect) / -2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / -2;
  camera.updateProjectionMatrix();
  
  renderer.setSize(mountRef.clientWidth, mountRef.clientHeight);
  composer.setSize(mountRef.clientWidth, mountRef.clientHeight);
};