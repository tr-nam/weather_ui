// src/components/WeatherEffect/modelLoaders.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Model paths - centralized for easy management
export const MODEL_PATHS = {
  SUN: '/models/sun/scene.gltf',
  CLOUD: '/models/cloud/scene.gltf',
  RAIN_DROP: '/models/rain/scene.gltf',
  SNOWFLAKE: '/models/snowflake/scene.gltf',
  MOUNTAIN: '/models/mountain/scene.gltf',
};

// Fallback model generators
export const createModelFallbacks = (getTimeOfDay, weatherCondition) => {
  return {
    sun: () => {
      const currentTimeOfDay = getTimeOfDay();
      const geometry = new THREE.SphereGeometry(1.5, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: currentTimeOfDay === 'night' ? 0xccccff : 0xffff99,
        transparent: true,
        opacity: 0.9,
      });
      return new THREE.Mesh(geometry, material);
    },
    
    cloud: () => {
      const currentTimeOfDay = getTimeOfDay();
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
    },
    
    mountain: () => {
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
    },
    
    raindrop: () => {
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
    },
    
    snowflake: () => {
      const snowflakeGroup = new THREE.Group();
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
      });
      
      // Create a simpler snowflake with fewer vertices
      for (let i = 0; i < 3; i++) {
        const armGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.3);
        const arm = new THREE.Mesh(armGeometry, material);
        arm.rotation.z = (Math.PI / 3) * i * 2;
        snowflakeGroup.add(arm);
        
        const detailGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.15);
        const detail1 = new THREE.Mesh(detailGeometry, material);
        detail1.position.z = 0.15;
        detail1.rotation.y = Math.PI / 4;
        arm.add(detail1);
      }
      
      return snowflakeGroup;
    }
  };
};

// Create a cached loader to avoid creating multiple loaders
const loaderCache = new WeakMap();
export const getLoader = (onError) => {
  if (!loaderCache.has(onError)) {
    const loader = new GLTFLoader();
    loaderCache.set(onError, loader);
  }
  return loaderCache.get(onError);
};

// Helper to load models with error handling
export const loadModel = async (modelPath, onError, fallbackCreator) => {
  const loader = getLoader(onError);
  
  try {
    return await new Promise((resolve, reject) => {
      loader.load(
        modelPath,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => {
          console.error(`Error loading model from ${modelPath}:`, error);
          if (onError) onError(`Failed to load model: ${modelPath}`);
          resolve(fallbackCreator());
        }
      );
    });
  } catch (err) {
    console.error(`Failed to load model from ${modelPath}:`, err);
    if (onError) onError(`Failed to load model: ${modelPath}`);
    return fallbackCreator();
  }
};