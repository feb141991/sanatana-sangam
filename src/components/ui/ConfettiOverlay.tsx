'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  gravity: number;
  drag: number;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = '100vw';
      canvas.style.height = '100dvh';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    particlesRef.current = [];

    const addBurst = (originX: number, originY: number, count: number, spread: number, baseAngle: number, power: number) => {
      for (let i = 0; i < count; i += 1) {
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const speed = Math.random() * power + power * 0.35;
        const size = Math.floor(Math.random() * 10) + 5;
        const lifetime = 3.2 + Math.random() * 1.4;
        particlesRef.current.push({
          x: originX + (Math.random() - 0.5) * 24,
          y: originY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.24,
          size,
          color: SACRED_COLORS[Math.floor(Math.random() * SACRED_COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          alpha: 1,
          lifetime,
          age: 0,
          gravity: 0.12 + Math.random() * 0.08,
          drag: 0.992 + Math.random() * 0.004,
        });
      }
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    addBurst(vw * 0.50, vh * 0.18, 95, Math.PI * 1.45, Math.PI * 0.5, 7.4);
    addBurst(vw * 0.18, vh * 0.58, 52, Math.PI * 0.75, -Math.PI * 0.18, 6.2);
    addBurst(vw * 0.82, vh * 0.58, 52, Math.PI * 0.75, Math.PI * 1.18, 6.2);

    // A soft front-center sparkle so the celebration reads above the card stack.
    for (let i = 0; i < 40; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 0.8;
      particlesRef.current.push({
        x: vw / 2,
        y: vh * 0.42,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.18,
        size: Math.floor(Math.random() * 6) + 3,
        color: SACRED_COLORS[Math.floor(Math.random() * SACRED_COLORS.length)],
        shape: Math.random() > 0.35 ? 'circle' : 'diamond',
        alpha: 1,
        lifetime: 2.4 + Math.random() * 0.8,
        age: 0,
        gravity: 0.05,
        drag: 0.986,
      });
    }

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - (startTimeRef.current || currentTime)) / 1000;

      // Clear canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.age = elapsed;

        if (particle.age > particle.lifetime) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Update physics
        particle.vx *= particle.drag;
        particle.vy = particle.vy * particle.drag + particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.spin;

        particle.alpha = Math.max(0, 1 - Math.max(0, particle.age - (particle.lifetime - 0.9)) / 0.9);

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.shape === 'circle' ? 10 : 4;
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

      if (elapsed >= 4.4) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [show, onComplete]);

  if (!show || !mounted) {
    return null;
  }

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        width: '100vw',
        height: '100dvh',
      }}
    />,
    document.body
  );
};

export default ConfettiOverlay;
