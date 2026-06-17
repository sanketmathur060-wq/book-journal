"use client";

import React, { useEffect, useRef } from "react";

interface GlitterEffectProps {
  colors?: string[];
  intensity?: number; // 0 to 1
  mixBlendMode?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number; // For depth/parallax
  size: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  shimmerOffset: number;
  shimmerSpeed: number;
  type: "star" | "circle";
}

export function GlitterEffect({ colors = ["#ffd166", "#ffffff", "#fff3b0"], intensity = 0.4, mixBlendMode = "screen" }: GlitterEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stringify colors array for the dependency array to prevent unnecessary re-runs
  const colorsJson = JSON.stringify(colors);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Spawn mouse-trail particles
      if (Math.random() < intensity * 1.5) {
        createParticle(mouse.x, mouse.y, true);
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const parsedColors = JSON.parse(colorsJson);

    const createParticle = (x: number, y: number, isTrail = false) => {
      const z = Math.random() * 1.5 + 0.5; // Depth factor
      const speedMultiplier = isTrail ? 2.0 : 0.6;
      const size = (Math.random() * 5 + 1.5) * (isTrail ? 1.1 : 0.8);
      
      particles.push({
        x,
        y,
        z,
        size,
        color: parsedColors[Math.floor(Math.random() * parsedColors.length)],
        vx: (Math.random() - 0.5) * speedMultiplier,
        vy: (Math.random() - 0.5) * speedMultiplier - (isTrail ? 0.3 : 0.1), // Rising naturally
        alpha: 1,
        decay: Math.random() * 0.012 + 0.006,
        shimmerOffset: Math.random() * Math.PI * 2,
        shimmerSpeed: Math.random() * 0.08 + 0.03,
        type: Math.random() > 0.4 ? "star" : "circle",
      });
    };

    // Ambient sparkles
    const ambientInterval = setInterval(() => {
      const numToCreate = Math.ceil(intensity * 2.5);
      for (let i = 0; i < numToCreate; i++) {
        createParticle(Math.random() * width, Math.random() * height, false);
      }
    }, 250);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Apply mouse gravity/displacement if close
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            const force = (100 - dist) / 1000;
            p.vx += (dx / dist) * force * p.z;
            p.vy += (dy / dist) * force * p.z;
          }
        }

        // Shimmer effect (oscillation of alpha)
        const currentShimmer = Math.sin(Date.now() * p.shimmerSpeed + p.shimmerOffset);
        const currentAlpha = Math.max(0, Math.min(1, p.alpha * (0.6 + currentShimmer * 0.4)));

        // Draw glow
        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        if (p.type === "star") {
          // Draw a 4-point magic sparkle star
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.quadraticCurveTo(p.x, p.y, p.x + p.size, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + p.size);
          ctx.quadraticCurveTo(p.x, p.y, p.x - p.size, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - p.size);
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw standard circular soft particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // Remove dead particles
      particles = particles.filter((p) => p.alpha > 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearInterval(ambientInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colorsJson, intensity, mixBlendMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: 0.85, mixBlendMode: mixBlendMode as any }}
    />
  );
}
