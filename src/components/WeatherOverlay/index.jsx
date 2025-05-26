

import { useEffect, useRef, useMemo } from 'react';

const WeatherOverlay = ({
  weatherCondition = 'clear',
  precipitationProbability = 100,
  rainSize = 0.75,
  snowSize = 0.15,
  rainAngle = 30,
  snowAngle = 15,
  thunderFrequency = 3, // Average number of seconds between lightning flashes
  lightningIntensity = 1, // Scale for lightning effects (0.5 to 2 recommended)
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const fogRef = useRef({ opacity: 0, noiseOffset: 0 });
  const lightningRef = useRef({ 
    active: false, 
    opacity: 0, 
    nextFlash: 0,
    bolts: [],
    ambientLight: 0
  });

  // Memoize props to stabilize useEffect
  const props = useMemo(
    () => ({
      weatherCondition: weatherCondition.toLowerCase(),
      precipitationProbability,
      rainSize,
      snowSize,
      rainAngle,
      snowAngle,
      thunderFrequency,
      lightningIntensity,
    }),
    [weatherCondition, precipitationProbability, rainSize, snowSize, rainAngle, snowAngle, thunderFrequency, lightningIntensity]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTimestamp = 0;

    // Resize canvas
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simple Perlin-like noise for fog
    const generateNoise = (x, y, offset) => {
      const scale = 0.01;
      return Math.sin(x * scale + offset) * Math.sin(y * scale + offset) * 0.5 + 0.5;
    };

    // Create particles for rain/snow
    const createParticles = () => {
      particlesRef.current = [];
      const { weatherCondition, precipitationProbability } = props;
      if (!weatherCondition.includes('rain') && !weatherCondition.includes('snow')) return;

      const maxCount = weatherCondition.includes('rain') ? 150 : 100; // Reduced for performance
      const count = Math.floor(maxCount * (precipitationProbability / 100));
      const angle = weatherCondition.includes('rain') ? props.rainAngle : props.snowAngle;
      const size = weatherCondition.includes('rain') ? props.rainSize : props.snowSize;

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.sin((angle * Math.PI) / 180) * (weatherCondition.includes('rain') ? 2 : 1) + (Math.random() - 0.5) * 0.5,
          vy: (weatherCondition.includes('rain') ? 4 : 1.5) + (Math.random() - 0.5) * 0.3,
          size: size * (Math.random() * 1 + 0.5),
          opacity: Math.random() * 0.5 + 0.5,
        });
      }
    };

    // Update fog opacity
    const updateFog = () => {
      const { weatherCondition, precipitationProbability } = props;
      fogRef.current.opacity =
        (weatherCondition.includes('fog') || weatherCondition.includes('mist'))
          ? 0.1 + (precipitationProbability / 100) * 0.2 // 0.1 to 0.3
          : 0;
    };

    // Create lightning effect
    const createLightning = () => {
      if (props.weatherCondition.includes('thunder') || props.weatherCondition.includes('storm')) {
        lightningRef.current.active = true;
        
        // Schedule next flash with random timing
        const randomFactor = 0.5 + Math.random(); // Between 0.5 and 1.5
        lightningRef.current.nextFlash = performance.now() + props.thunderFrequency * 1000 * randomFactor;
      } else {
        lightningRef.current.active = false;
      }
    };

    // Generate realistic lightning bolt using iteration instead of recursion
  const generateLightningBolt = (startX, startY, angle, branchFactor, length, width) => {
    const segments = [];
    
    // Start with a single point and direction
    const points = [
      {
        x: startX,
        y: startY,
        angle: angle,
        remainingLength: length,
        currentWidth: width,
        isBranch: false
      }
    ];
    
    // Process points iteratively instead of recursively
    while (points.length > 0 && segments.length < 100) { // Limit total segments for performance
      const point = points.shift(); // Get and remove the first point
      
      // Skip if we've reached the end conditions
      if (point.remainingLength <= 0 || point.currentWidth <= 0) continue;
      
      // Calculate new segment with randomness
      const segmentLength = Math.min(
        point.remainingLength * (0.1 + Math.random() * 0.2),
        point.remainingLength * 0.5
      );
      
      const angleVariation = (Math.random() - 0.5) * (point.isBranch ? 40 : 60);
      const newAngle = point.angle + angleVariation;
      
      // Calculate end point
      const endX = point.x + Math.sin(newAngle * Math.PI / 180) * segmentLength;
      const endY = point.y + Math.cos(newAngle * Math.PI / 180) * segmentLength;
      
      // Add segment
      segments.push({
        x1: point.x,
        y1: point.y,
        x2: endX,
        y2: endY,
        width: point.currentWidth
      });
      
      // Continue the main path
      points.push({
        x: endX,
        y: endY,
        angle: newAngle,
        remainingLength: point.remainingLength - segmentLength,
        currentWidth: point.currentWidth * 0.9,
        isBranch: point.isBranch
      });
      
      // Add random branches (but not for points that are already branches)
      if (!point.isBranch && branchFactor > 0 && Math.random() < 0.3 * branchFactor) {
        const branchAngle = newAngle + (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40);
        
        points.push({
          x: endX,
          y: endY,
          angle: branchAngle,
          remainingLength: point.remainingLength * 0.6,
          currentWidth: point.currentWidth * 0.6,
          isBranch: true
        });
      }
    }
    
    return segments;
  };

  // Draw lightning flash
  const drawLightning = (deltaTime) => {
    const { active, opacity, nextFlash } = lightningRef.current;
    
    if (!active) return;
    
    const now = performance.now();
    
    // Check if it's time for a new flash
    if (now >= nextFlash && opacity <= 0.05) {
      // Start a new lightning flash
      lightningRef.current.opacity = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
      
      // Generate new lightning bolt data
      lightningRef.current.bolts = [];
      
      // Generate 1-3 main lightning bolts
      const boltCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < boltCount; i++) {
        // Start from a random position at the top of the screen
        const startX = Math.random() * canvas.width;
        const startY = -20; // Start slightly above screen
        const angle = 80 + (Math.random() * 20); // Mostly downward
        const branchCount = Math.floor(Math.random() * 3) + 1;
        const length = canvas.height * (0.5 + Math.random() * 0.7);
        const width = 2 + Math.random() * 4;
        
        lightningRef.current.bolts.push(
          generateLightningBolt(startX, startY, angle, branchCount, length, width)
        );
      }
      
      // Add ambient light effect for the whole screen with reduced opacity
      lightningRef.current.ambientLight = lightningRef.current.opacity * 0.3 * props.lightningIntensity;
      
      // Schedule the next flash with random timing
      const randomFactor = 0.5 + Math.random(); // Between 0.5 and 1.5
      lightningRef.current.nextFlash = now + props.thunderFrequency * 1000 * randomFactor;
    } else {
      // Fade out existing lightning flash quickly
      lightningRef.current.opacity = Math.max(0, lightningRef.current.opacity - deltaTime * 4);
      lightningRef.current.ambientLight = Math.max(0, lightningRef.current.ambientLight - deltaTime * 4);
    }
    
    // Draw the lightning effect
    if (lightningRef.current.opacity > 0) {
      // Draw ambient light for the entire sky
      if (lightningRef.current.ambientLight > 0) {
        ctx.fillStyle = `rgba(200, 215, 255, ${lightningRef.current.ambientLight})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw lightning bolts
      if (lightningRef.current.bolts) {
        lightningRef.current.bolts.forEach(bolt => {
          bolt.forEach(segment => {
            // Draw glow effect
            const gradient = ctx.createLinearGradient(
              segment.x1, segment.y1, segment.x2, segment.y2
            );
            gradient.addColorStop(0, `rgba(200, 230, 255, 0)`);
            gradient.addColorStop(0.1, `rgba(200, 230, 255, ${0.2 * lightningRef.current.opacity})`);
            gradient.addColorStop(0.5, `rgba(220, 240, 255, ${0.3 * lightningRef.current.opacity})`);
            gradient.addColorStop(0.9, `rgba(200, 230, 255, ${0.2 * lightningRef.current.opacity})`);
            gradient.addColorStop(1, `rgba(200, 230, 255, 0)`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = segment.width * 5;
            ctx.lineCap = 'round';
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
            ctx.stroke();
            
            // Draw core
            ctx.beginPath();
            ctx.strokeStyle = `rgba(250, 250, 255, ${lightningRef.current.opacity})`;
            ctx.lineWidth = segment.width;
            ctx.lineCap = 'round';
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
            ctx.stroke();
          });
        });
      }
    }
  };

    // Animation loop
    const animate = (timestamp) => {
      // Calculate delta time in seconds
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { weatherCondition } = props;

      // Draw lightning (before other elements to create flash effect)
      drawLightning(deltaTime);

      // Draw fog
      if (fogRef.current.opacity > 0) {
        fogRef.current.noiseOffset += 0.02; // Slow animation
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let x = 0; x < canvas.width; x += 4) { // Skip pixels for performance
          for (let y = 0; y < canvas.height; y += 4) {
            const i = (y * canvas.width + x) * 4;
            const noise = generateNoise(x, y, fogRef.current.noiseOffset);
            const alpha = fogRef.current.opacity * noise;
            imageData.data[i] = 200; // R: Grayish
            imageData.data[i + 1] = 200; // G
            imageData.data[i + 2] = 200; // B
            imageData.data[i + 3] = alpha * 255; // A
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Draw rain/snow particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Fade near edges
        const edgeMargin = 50;
        let edgeOpacity = 1;
        if (particle.x < edgeMargin) edgeOpacity = particle.x / edgeMargin;
        if (particle.x > canvas.width - edgeMargin) edgeOpacity = (canvas.width - particle.x) / edgeMargin;
        if (particle.y < edgeMargin) edgeOpacity = Math.min(edgeOpacity, particle.y / edgeMargin);
        if (particle.y > canvas.height - edgeMargin) edgeOpacity = Math.min(edgeOpacity, (canvas.height - particle.y) / edgeMargin);

        // Reset particles
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width || particle.x < 0) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }

        // Draw particle
        ctx.beginPath();
        if (weatherCondition.includes('rain')) {
          // Draw rain as short lines
          const length = particle.size * 3;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * length, particle.y - particle.vy * length);
          ctx.strokeStyle = `rgba(153, 204, 255, ${particle.opacity * edgeOpacity})`;
          ctx.lineWidth = particle.size;
          ctx.stroke();
        } else {
          // Draw snow as circles
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * edgeOpacity})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    createParticles();
    updateFog();
    createLightning();
    animate(performance.now());

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [props]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    />
  );
};

export default WeatherOverlay;