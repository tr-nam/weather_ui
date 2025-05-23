
import React, { useEffect, useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import WeatherOverlay from '@/components/WeatherOverlay';

const MODEL_PATHS = {
  MOUNTAIN: '/models/mountain/scene.gltf',
};

const CloudGroup = React.memo(({ count, precipitationProbability }) => {
  const cloudPositions = useMemo(() => {
    const baseOpacity = 0.6 + (precipitationProbability / 100) * 0.5; // 0.6 to 0.9
    const baseWidth = 8 + (precipitationProbability / 100) * 12; // 8 to 20
    const xRange = 50; // Total x-range: [-15, 15]
    const step = count > 1 ? xRange / (count - 1) : 0; // Step size between clouds

    return Array.from({ length: count }).map((_, i) => ({
      x: count > 1 ? -20 + i * step + (Math.random() - 0.5) * (step * 0.2) : (Math.random() - 0.5) * xRange,
      y: 5 + Math.random() * 5, // Range [10, 15]
      z: (-1 + Math.random() - 0.5) * 10, // Range [-21, -1]
      width: Math.random() * baseWidth + 50,
      opacity: Math.min(baseOpacity + Math.random() * 0.1, 0.9),
    }));
  }, [count, precipitationProbability]);

  return (
    <group>
      {cloudPositions.map((pos, i) => (
        <Cloud
          key={i}
          position={[pos.x, pos.y, pos.z]}
          speed={0.1}
          opacity={pos.opacity}
          args={[pos.width, 1.2]}
        />
      ))}
    </group>
  );
});

const StarEffect = React.memo(() => {
  const starCount = 100;
  const positions = useRef(new Float32Array(starCount * 3));

  useEffect(() => {
    const width = 45;
    const height = 20;
    for (let i = 0; i < starCount; i++) {
      positions.current[i * 3] = Math.random() * width - width / 2;
      positions.current[i * 3 + 1] = Math.random() * height - 10;
      positions.current[i * 3 + 2] = -50;
    }
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});
StarEffect.displayName = 'StarEffect';

const Sun = ({ timeOfDay }) => {
  const sunRef = useRef();

  useFrame(({ clock }) => {
    if (!sunRef.current) return;
    const time = clock.getElapsedTime() * 0.05;
    if (timeOfDay === 'dawn') {
      sunRef.current.position.set(
        -20 + Math.sin(time + Math.PI / 2) * 20,
        7 + Math.sin(time) * 5,
        -20
      );
    } else if (timeOfDay === 'day') {
      sunRef.current.position.set(
        Math.sin(time) * 5,
        15 + Math.sin(time * 0.5) * 2,
        -20
      );
    } else if (timeOfDay === 'dusk') {
      sunRef.current.position.set(
        20 + Math.sin(time - Math.PI / 2) * 20,
        7 + Math.sin(time) * 5,
        -20
      );
    } else {
      sunRef.current.visible = false;
    }
  });

  if (timeOfDay === 'night') return null;

  return (
    <mesh ref={sunRef} position={[0, 10, -20]} scale={[1.5, 1.5, 1.5]}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial color={0xffff99} transparent opacity={0.9} />
      <pointLight color={0xffffcc} intensity={1} distance={100} />
    </mesh>
  );
};

const Moon = ({ timeOfDay }) => {
  const moonRef = useRef();

  useFrame(({ clock }) => {
    if (!moonRef.current) return;
    const time = clock.getElapsedTime() * 0.05;
    if (timeOfDay === 'night') {
      moonRef.current.position.set(
        Math.sin(time) * 20,
        10 + Math.sin(time * 0.5) * 5,
        -20
      );
    } else {
      moonRef.current.visible = false;
    }
  });

  if (timeOfDay !== 'night') return null;

  return (
    <mesh ref={moonRef} position={[0, 15, -20]} scale={[1, 1, 1]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={0xccccff} transparent opacity={0.8} />
      <pointLight color={0xaaaaee} intensity={0.5} distance={80} />
    </mesh>
  );
};

const MountainModel = ({ timeOfDay, weatherType }) => {
  const { scene } = useThree();
  const [loadError, setLoadError] = useState(null);

  const gltf = useLoader(GLTFLoader, MODEL_PATHS.MOUNTAIN, undefined, (error) => {
    console.error('Detailed error loading mountain model:', {
      message: error.message || 'Unknown error',
      type: error.type,
      target: error.target ? error.target.responseURL : 'N/A',
      status: error.target ? error.target.status : 'N/A',
    });
    setLoadError(error.message || 'Failed to load mountain model');
  });

  useEffect(() => {
    console.log('MountainModel: Adding to scene', { timeOfDay, weatherType, loadError });

    let mountainGroup = new THREE.Group();
    if (gltf && !loadError) {
      mountainGroup = gltf.scene;
      mountainGroup.position.set(0, -20, -20);
      mountainGroup.scale.set(55, 55, 55);
      mountainGroup.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      const geometry = new THREE.ConeGeometry(10, 15, 5);
      const material = new THREE.MeshStandardMaterial({
        color: 0x555566,
        roughness: 0.9,
        flatShading: true,
      });
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(0, -15, -20);
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      mountainGroup.add(mountain);

      if (weatherType?.includes('snow')) {
        const snowCapGeometry = new THREE.ConeGeometry(4, 4, 5);
        const snowMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.5,
        });
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.set(0, 5, 0);
        mountainGroup.add(snowCap);
      }
    }

    scene.add(mountainGroup);
    console.log('MountainModel: Added to scene', mountainGroup);

    if (timeOfDay === 'night') {
      const mountainLight = new THREE.PointLight(0xaaaaaa, 0.5, 50);
      mountainLight.position.set(0, -10, -10);
      scene.add(mountainLight);
      return () => {
        scene.remove(mountainLight);
        mountainLight.dispose();
      };
    }

    return () => {
      console.log('MountainModel: Removing from scene');
      scene.remove(mountainGroup);
      mountainGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    };
  }, [scene, gltf, loadError, timeOfDay, weatherType]);

  return null;
};

const WeatherScene = React.memo(({ weatherType, timeOfDay, precipitationProbability }) => {
  const { scene } = useThree();
  const dirLightRef = useRef();

  useEffect(() => {
    console.log('WeatherScene rendered', { weatherType, timeOfDay, precipitationProbability });
  }, [weatherType, timeOfDay, precipitationProbability]);

  const cloudCount = useMemo(() => {
    if (weatherType.includes('overcast')) return 10;
    if (precipitationProbability > 60) return 8;
    if (precipitationProbability > 30) return 5;
    return 2;
  }, [weatherType, precipitationProbability]);

  const backgroundTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 128, 0, 0);
    let bottomColor, topColor;

    if (timeOfDay === 'night') {
      bottomColor = '#001122';
      topColor = '#112244';
    } else if (weatherType.includes('cloud') || weatherType.includes('overcast')) {
      bottomColor = '#576979';
      topColor = '#778899';
    } else {
      bottomColor = timeOfDay === 'dawn' ? '#ffaa88' : timeOfDay === 'dusk' ? '#ff7744' : '#67aeeb';
      topColor = timeOfDay === 'dawn' ? '#ffccaa' : timeOfDay === 'dusk' ? '#ff9966' : '#87ceeb';
    }

    gradient.addColorStop(0, bottomColor);
    gradient.addColorStop(1, topColor);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [weatherType, timeOfDay]);

  useEffect(() => {
    scene.background = backgroundTexture;

    scene.fog = null;
    if (timeOfDay === 'dawn' || timeOfDay === 'dusk') {
      scene.fog = new THREE.FogExp2(0xffa366, 0.03);
    } else if (timeOfDay === 'night') {
      scene.fog = new THREE.FogExp2(0x001133, 0.035);
    } else if (weatherType.includes('fog') || weatherType.includes('mist')) {
      const fogDensity = 0.03 + Math.random() * 0.02;
      scene.fog = new THREE.FogExp2(0xcccccc, fogDensity);
    }

    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, backgroundTexture, weatherType, timeOfDay]);

  return (
    <>
      <ambientLight intensity={0.8} color={0x404040} />
      <directionalLight
        ref={dirLightRef}
        position={[20, 20, 10]}
        color={timeOfDay === 'night' ? 0x2233aa : 0xffffcc}
        intensity={timeOfDay === 'night' ? 0.3 : 1.2}
        castShadow
      />
      {timeOfDay === 'day' ? (
        <Sky sunPosition={[100, 10, 100]} turbidity={10} rayleigh={0.5} />
      ) : timeOfDay === 'night' ? (
        <Stars radius={100} depth={50} count={5000} factor={4} />
      ) : null}
      {weatherType.includes('cloud') || weatherType.includes('overcast') || weatherType.includes('rain') || precipitationProbability > 30 ? (
        <CloudGroup count={cloudCount} precipitationProbability={precipitationProbability} />
      ) : null}
      {timeOfDay === 'night' && <StarEffect />}
      <Suspense fallback={<MountainModel timeOfDay={timeOfDay} weatherType={weatherType} />}>
        <Sun timeOfDay={timeOfDay} />
        <Moon timeOfDay={timeOfDay} />
        <MountainModel timeOfDay={timeOfDay} weatherType={weatherType} />
      </Suspense>
      <OrbitControls
        target={[0, 0, 0]}
        enableRotate={true}
        enablePan={false}
        enableZoom={false}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
});

const WeatherBanner = ({
  weatherCondition = 'clear',
  precipitationProbability = 0,
  timeOfDay = 'auto',
  rainSize = 0.5,
  snowSize = 0.15,
  rainAngle = 30,
  snowAngle = 15,
}) => {
  const props = useMemo(() => ({
    weatherType: weatherCondition.toLowerCase(),
    timeOfDay: timeOfDay === 'auto' ? (
      (() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 8) return 'dawn';
        if (hour >= 8 && hour < 17) return 'day';
        if (hour >= 17 && hour < 19) return 'dusk';
        return 'night';
      })()
    ) : timeOfDay,
    precipitationProbability,
  }), [weatherCondition, precipitationProbability, timeOfDay]);

  const overlayProps = useMemo(() => ({
    weatherCondition,
    precipitationProbability,
    rainSize,
    snowSize,
    rainAngle,
    snowAngle,
  }), [weatherCondition, precipitationProbability, rainSize, snowSize, rainAngle, snowAngle]);

  useEffect(() => {
    console.log('WeatherBanner rendered', props);
  }, [props]);

  return (
    <div className="relative w-full h-[360px]">
      <Canvas camera={{ position: [0, -5, 10], fov: 50 }} shadows={false}>
        <WeatherScene
          weatherType={props.weatherType}
          timeOfDay={props.timeOfDay}
          precipitationProbability={props.precipitationProbability}
        />
      </Canvas>
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
        <WeatherOverlay {...overlayProps} />
      </div>
    </div>
  );
};

export default WeatherBanner;
