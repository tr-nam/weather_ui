import { useEffect, useRef, useMemo } from 'react';

const WeatherOverlay = ({
  weatherCondition = 'clear',
  precipitationProbability = 0,
  rainSize = 0.5,
  snowSize = 0.15,
  rainAngle = 30,
  snowAngle = 15,
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const fogRef = useRef({ opacity: 0, noiseOffset: 0 });

  // Memoize props to stabilize useEffect
  const props = useMemo(
    () => ({
      weatherCondition: weatherCondition.toLowerCase(),
      precipitationProbability,
      rainSize,
      snowSize,
      rainAngle,
      snowAngle,
    }),
    [weatherCondition, precipitationProbability, rainSize, snowSize, rainAngle, snowAngle]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

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

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { weatherCondition } = props;

      // Draw fog
      if (fogRef.current.opacity > 0) {
        fogRef.current.noiseOffset += 0.02; // Slow animation
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let x = 0; x < canvas.width; x++) {
          for (let y = 0; y < canvas.height; y++) {
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
    animate();

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