// src/components/WeatherEffect/particleSystem.js
import * as THREE from 'three';
import { createCircleTexture } from './sceneHelpers';

// Create particle system
export const createParticles = (scene, type, count, color, size, velocityY, velocityX = 0, containerDimensions) => {
  const { width, height } = containerDimensions;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const depth = 30; // Depth for particles

  // Initialize particle positions and velocities
  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.random() * width - width / 2;
    positions[i * 3 + 1] = Math.random() * height - 10;
    positions[i * 3 + 2] = (type === 'star' || type === 'glow') ? -50 : -55 + Math.random() * 30;
    velocities[i * 3] = velocityX + (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = velocityY - Math.random() * 0.01;
    velocities[i * 3 + 2] = 0; // No movement in z-axis
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

  // Add texture only for stars/glow to reduce GPU load for other particles
  if (type === 'star' || type === 'glow') {
    material.map = createCircleTexture();
    material.alphaTest = 0.2;
  }

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  return {
    particles,
    velocities,
    opacities,
    width,
    height,
    depth,
  };
};

// Update particle positions
export const updateParticles = (particlesRef) => {
  const now = performance.now();
  // Skip update if less than 16ms (target 60fps) has passed
  if (particlesRef.lastUpdate && now - particlesRef.lastUpdate < 16) return;
  particlesRef.lastUpdate = now;
  
  // Process all particle systems
  Object.keys(particlesRef).forEach((type) => {
    if (type === 'lastUpdate') return;
    const { particles, velocities, width, height } = particlesRef[type];
    
    if (!particles?.geometry?.attributes?.position) return;
    
    const positions = particles.geometry.attributes.position.array;
    
    // Update in batches of 100 particles to avoid long frames
    const batchSize = Math.min(positions.length / 3, 100);
    const updateIndex = (particlesRef[type].updateIndex || 0);
    const endIndex = updateIndex + batchSize < positions.length / 3 ? updateIndex + batchSize : positions.length / 3;
    
    for (let i = updateIndex; i < endIndex; i++) {
      const idx = i * 3;
      positions[idx] += velocities[idx];
      positions[idx + 1] += velocities[idx + 1];
      // z position stays fixed
      
      // Wrap particles when they go outside bounds
      if (positions[idx] < -width / 2) positions[idx] = width / 2;
      if (positions[idx] > width / 2) positions[idx] = -width / 2;
      
      if (positions[idx + 1] < -10) positions[idx + 1] = height - 10;
      if (positions[idx + 1] > height - 10) positions[idx + 1] = -10;
    }
    
    // Store the next update index
    particlesRef[type].updateIndex = endIndex >= positions.length / 3 ? 0 : endIndex;
    
    // Mark positions for update
    particles.geometry.attributes.position.needsUpdate = true;
  });
};

// Create weather-specific particle systems
export const createWeatherParticles = (scene, timeOfDay, weatherCondition, precipitationProbability, containerDimensions, particlesRef) => {
  const condition = (weatherCondition || '').toLowerCase();
  
  // Stars at night
  if (timeOfDay === 'night') {
    particlesRef.star = createParticles(scene, 'star', 100, 0xffffff, 0.1, 0, 0, containerDimensions);
  }
  
  // Rain particles
  if (condition.includes('rain') || (condition.includes('cloud') && precipitationProbability > 60)) {
    const rainCount = condition.includes('shower') ? 1000 : 500;
    particlesRef.rain = createParticles(scene, 'rain', rainCount, 0x9999ff, 0.08, -0.2, -0.05, containerDimensions);
    
    // Extra splash particles for heavy rain
    if (rainCount > 800) {
      particlesRef.splash = createParticles(scene, 'splash', 200, 0x77aaff, 0.05, 0, 0, containerDimensions);
    }
  }
  
  // Snow particles
  if (condition.includes('snow')) {
    particlesRef.snow = createParticles(scene, 'snow', 800, 0xffffff, 0.1, -0.03, 0.01, containerDimensions);
  }
  
  return particlesRef;
};