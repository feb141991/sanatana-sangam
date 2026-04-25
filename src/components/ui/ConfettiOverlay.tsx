'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiOverlayProps {
  show: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'flower' | 'diamond';
  alpha: number;
  lifetime: number;
  age: number;
}

const SACRED_COLORS = [
  '#E88C35', // saffron
  '#C8924A', // gold
  '#F0A830', // amber
  '#D4784A', // terracotta
  '#F2EAD6', // cream
  '#D4926A', // rose-gold
  '#FABE5A', // light amber
];

const SHAPES: Array<'circle' | 'square' | 'flower' | 'diamond'> = [
  'circle',
  'square',
  'flower',
  'diamond',
];

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({ show, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!show) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles
    const particleCount = Math.floor(Math.random() * 30) + 100; // 100-130 particles
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2); // Full circle spread
      const speed = Math.random() * 4 + 1.5; // 1.5-5.5 velocity

      particlesRef.current.push({
        x: canvas.width / 2,
        y: -20, // Start from top-center
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.5, // Bias downward
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        size: Math.floor(Math.random() * 9) + 4, // 4-12px
        color: SACRED_COLORS[Math.floor(Math.random() * SACRED_COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        alpha: 1,
        lifetime: 3.5,
        age: 0,
      });
    }

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - (startTimeRef.current || currentTime)) / 1000;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.age = elapsed;

        if (particle.age > particle.lifetime) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Update physics
        particle.vy += 0.2; // Gravity
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.spin;

        // Fade out in last 1 second
        if (particle.age > particle.lifetime - 1) {
          particle.alpha = Math.max(0, 1 - (particle.age - (particle.lifetime - 1)));
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1.5;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        switch (particle.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'square':
            const half = particle.size / 2;
            ctx.fillRect(-half, -half, particle.size, particle.size);
            break;

          case 'flower': {
            // 5-petal flower
            ctx.beginPath();
            const petalSize = particle.size / 2;
            for (let j = 0; j < 5; j++) {
              const angle = (j / 5) * Math.PI * 2;
              const px = Math.cos(angle) * petalSize;
              const py = Math.sin(angle) * petalSize;
              if (j === 0) {
                ctx.moveTo(px, py);
              } else {
                ctx.lineTo(px, py);
              }
            }
            ctx.closePath();
            ctx.fill();
            break;
          }

          case 'diamond': {
            // Diamond shape
            const half = particle.size / 2;
            ctx.beginPath();
            ctx.moveTo(0, -half);
            ctx.lineTo(half, 0);
            ctx.lineTo(0, half);
            ctx.lineTo(-half, 0);
            ctx.closePath();
            ctx.fill();
            break;
          }
        }

        ctx.restore();
      }

      if (elapsed >= 3.5) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [show, onComplete]);

  if (!show) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default ConfettiOverlay;
