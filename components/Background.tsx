
import React, { useEffect, useRef } from 'react';
import { getAnalyser } from '../services/audioService';

interface BackgroundProps {
  theme: 'dark' | 'light';
}

const Background: React.FC<BackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const isDark = theme === 'dark';

    // --- Particle Systems ---

    // 1. Stars (High Frequencies)
    class Star {
      x: number;
      y: number;
      size: number;
      baseSize: number;
      baseAlpha: number;
      currentAlpha: number;
      velocity: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.size = this.baseSize;
        this.baseAlpha = Math.random() * 0.3 + 0.1;
        this.currentAlpha = this.baseAlpha;
        this.velocity = Math.random() * 0.05 + 0.02;
        this.color = isDark ? '255, 255, 255' : '100, 116, 139'; // White vs Slate-500
      }

      update(energy: number) {
        // High frequency reaction: Sparkle (Alpha) and slight Size increase
        this.y -= this.velocity;
        if (this.y < 0) this.y = height;

        const normalizedEnergy = Math.max(0, (energy - 20) / 255); // Threshold noise
        
        if (normalizedEnergy > 0) {
            this.currentAlpha = Math.min(1, this.baseAlpha + (normalizedEnergy * 1.5));
            this.size = this.baseSize + (normalizedEnergy * 1.5);
        } else {
            // Decay
            this.currentAlpha += (this.baseAlpha - this.currentAlpha) * 0.1;
            this.size += (this.baseSize - this.size) * 0.1;
        }
      }

      draw() {
        ctx!.fillStyle = `rgba(${this.color}, ${this.currentAlpha})`;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // 2. Confetti (Mid Frequencies)
    class Confetti {
      x: number;
      y: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      driftX: number;
      driftY: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 4 + 2;
        const darkColors = ['#fcd34d', '#e879f9', '#818cf8']; // Gold, Pink, Indigo
        const lightColors = ['#f59e0b', '#d946ef', '#6366f1']; // Darker variants for light mode
        const colors = isDark ? darkColors : lightColors;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.driftX = (Math.random() - 0.5) * 0.5;
        this.driftY = Math.random() * 0.5 + 0.2;
      }

      update(energy: number) {
        // Mid frequency reaction: Movement speed and Rotation
        const normalizedEnergy = Math.max(0, (energy - 30) / 255);
        
        const speedMultiplier = 1 + (normalizedEnergy * 3);
        
        this.y += this.driftY * speedMultiplier;
        this.x += this.driftX * speedMultiplier;
        this.rotation += this.rotationSpeed * speedMultiplier;

        if (this.y > height) this.y = -10;
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
      }

      draw(energy: number) {
        // Opacity reacts slightly
        const normalizedEnergy = Math.max(0, energy / 255);
        const alpha = isDark ? 0.4 + (normalizedEnergy * 0.4) : 0.6 + (normalizedEnergy * 0.3);

        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rotation);
        ctx!.fillStyle = this.color;
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx!.restore();
      }
    }

    const stars: Star[] = Array.from({ length: 150 }, () => new Star());
    const confetti: Confetti[] = Array.from({ length: 50 }, () => new Confetti());
    
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      let bassEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;

      const analyser = getAnalyser();
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Simple frequency banding
        const bassEnd = Math.floor(bufferLength * 0.1); // ~0-10% (Low Bass)
        const midEnd = Math.floor(bufferLength * 0.5);  // ~10-50% (Mids)

        let bSum = 0, mSum = 0, hSum = 0;
        let bCount = 0, mCount = 0, hCount = 0;

        for (let i = 0; i < bufferLength; i++) {
            const val = dataArray[i];
            if (i < bassEnd) { bSum += val; bCount++; }
            else if (i < midEnd) { mSum += val; mCount++; }
            else { hSum += val; hCount++; }
        }

        bassEnergy = bCount > 0 ? bSum / bCount : 0;
        midEnergy = mCount > 0 ? mSum / mCount : 0;
        highEnergy = hCount > 0 ? hSum / hCount : 0;
      }

      // --- Draw Bass Pulse (Background Layer) ---
      if (bassEnergy > 0) {
        const normalizedBass = bassEnergy / 255;
        // Draw a large soft glow in the bottom center
        const gradient = ctx.createRadialGradient(
            width / 2, height, 0,
            width / 2, height, width * 0.8
        );
        // Golden/Warm bass glow
        const alpha = normalizedBass * 0.3; 
        if (isDark) {
            gradient.addColorStop(0, `rgba(217, 119, 6, ${alpha})`); // Amber-600
            gradient.addColorStop(0.5, `rgba(88, 28, 135, ${alpha * 0.5})`); // Purple-900
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
             // Blue/Teal pulse for light mode
            gradient.addColorStop(0, `rgba(14, 165, 233, ${alpha})`); // Sky-500
            gradient.addColorStop(0.5, `rgba(99, 102, 241, ${alpha * 0.5})`); // Indigo-500
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // --- Draw Confetti (Mids) ---
      confetti.forEach(c => {
        c.update(midEnergy);
        c.draw(midEnergy);
      });

      // --- Draw Stars (Highs) ---
      stars.forEach(s => {
        s.update(highEnergy);
        s.draw();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]); // Re-run when theme changes

  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 ${isDark ? 'bg-[#050505]' : 'bg-slate-50'}`}>
      {/* Base: Deep Gradient (Static) - Dark Mode */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1a103c] via-[#050505] to-black transition-opacity duration-1000 ${isDark ? 'opacity-80' : 'opacity-0'}`}></div>

      {/* Base: Light Gradient (Static) - Light Mode */}
       <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}></div>
      
      {/* Canvas Layer for Audio-Reactive Elements */}
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply opacity-50'}`} />
      
      {/* Static Atmospheric Elements (CSS) */}
      <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse-slow transition-colors duration-1000 ${isDark ? 'bg-fuchsia-900/10' : 'bg-blue-300/20'}`}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse-slow transition-colors duration-1000 ${isDark ? 'bg-indigo-900/10' : 'bg-indigo-300/20'}`} style={{ animationDelay: '2s' }}></div>
      
      {/* Vignette - Only visible in dark mode generally, or very subtle in light */}
      <div className={`absolute inset-0 bg-[radial-gradient(transparent_0%,_#000000_100%)] transition-opacity duration-1000 ${isDark ? 'opacity-60' : 'opacity-5'}`}></div>
    </div>
  );
};

export default Background;
