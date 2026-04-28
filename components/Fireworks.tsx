
import React, { useEffect, useRef } from 'react';

const Fireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Configuration
    const colors = [
      '#10b981', // Emerald-500
      '#3b82f6', // Blue-500
      '#f59e0b', // Amber-500
      '#ffffff', // White
      '#8b5cf6', // Violet-500
      '#ec4899', // Pink-500
    ];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      decay: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        // Random speed for explosion spread
        const speed = Math.random() * 5 + 2; 
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.color = color;
        this.decay = Math.random() * 0.015 + 0.015;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravity
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
        this.alpha -= this.decay;
      }

      draw() {
        ctx!.save();
        ctx!.globalAlpha = this.alpha;
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    class Rocket {
      x: number;
      y: number;
      vy: number;
      color: string;
      exploded: boolean;

      constructor() {
        this.x = Math.random() * width;
        this.y = height;
        // Launch speed depending on screen height
        this.vy = -(Math.random() * (height * 0.015) + (height * 0.02)); 
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.exploded = false;
      }

      update() {
        this.y += this.vy;
        this.vy += 0.2; // Gravity applied to rocket
      }

      draw() {
        ctx!.save();
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        // Rocket tail/body
        ctx!.fillRect(this.x - 1, this.y, 3, 10);
        ctx!.restore();
      }
    }

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const loop = () => {
      // Create trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Adjust for trail length
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      // Spawn rockets randomly
      if (Math.random() < 0.05) { // Slightly increased spawn rate
        rockets.push(new Rocket());
      }

      // Update and draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw();

        // Explode condition (when velocity slows down near peak)
        if (r.vy >= -1) {
          for (let j = 0; j < 80; j++) {
            particles.push(new Particle(r.x, r.y, r.color));
          }
          rockets.splice(i, 1);
        } else if (r.y < -50) {
           // Cleanup if it goes off screen without exploding (rare)
          rockets.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 text-center animate-pop">
             <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-500 drop-shadow-[0_0_35px_rgba(251,191,36,0.8)] tracking-tighter leading-none">
                HAPPY<br/>NEW YEAR
            </h1>
             <p className="text-4xl md:text-6xl font-black text-white mt-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] tracking-[0.2em]">2027</p>
        </div>
    </div>
  );
};

export default Fireworks;
