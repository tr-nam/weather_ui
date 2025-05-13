
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle setup
    const createParticles = () => {
      particlesRef.current = [];
      const condition = weatherCondition.toLowerCase();
      const count = Math.floor(
        (condition.includes('rain') ? 200 : condition.includes('snow') ? 150 : 0) *
          (precipitationProbability / 100)
      );
      const angle = condition.includes('rain') ? rainAngle : snowAngle;
      const size = condition.includes('rain') ? rainSize : snowSize;

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.sin((angle * Math.PI) / 180) * (condition.includes('rain') ? 2 : 1),
          vy: condition.includes('rain') ? 4 : 1.5,
          size: size * (Math.random() * 0.5 + 0.5),
          opacity: Math.random() * 0.5 + 0.5,
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const condition = weatherCondition.toLowerCase();

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Reset particles when they move off-screen
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width) {
          particle.x = 0;
          particle.y = Math.random() * canvas.height;
        }
        if (particle.x < 0) {
          particle.x = canvas.width;
          particle.y = Math.random() * canvas.height;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = condition.includes('rain')
          ? `rgba(153, 204, 255, ${particle.opacity})`
          : `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    if (weatherCondition.toLowerCase().includes('rain') || weatherCondition.toLowerCase().includes('snow')) {
      createParticles();
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherCondition, precipitationProbability, rainSize, snowSize, rainAngle, snowAngle]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none', // Ensure events pass through
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent event capture
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    />
  );
};

export default WeatherOverlay;
