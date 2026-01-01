
import React, { useEffect, useRef } from 'react';
import { getAnalyser } from '../services/audioService';

interface BackgroundProps {
  theme: 'dark' | 'light';
}

const Background: React.FC<BackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);

  // Sync theme ref for the animation loop without triggering re-render of effect
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.size = this.baseSize;
        this.baseAlpha = Math.random() * 0.3 + 0.1;
        this.currentAlpha = this.baseAlpha;
        this.velocity = Math.random() * 0.05 + 0.02;
      }

      update(energy: number) {
        this.y -= this.velocity;
        if (this.y < 0) this.y = height;

        const normalizedEnergy = Math.max(0, (energy - 20) / 255); 
        
        if (normalizedEnergy > 0) {
            this.currentAlpha = Math.min(1, this.baseAlpha + (normalizedEnergy * 1.5));
            this.size = this.baseSize + (normalizedEnergy * 1.5);
        } else {
            this.currentAlpha += (this.baseAlpha - this.currentAlpha) * 0.1;
            this.size += (this.baseSize - this.size) * 0.1;
        }
      }

      draw() {
        const isDark = themeRef.current === 'dark';
        const color = isDark ? '255, 255, 255' : '71, 85, 105'; 
        
        ctx!.fillStyle = `rgba(${color}, ${this.currentAlpha})`;
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
      colorIndex: number;
      rotation: number;
      rotationSpeed: number;
      driftX: number;
      driftY: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 4 + 2;
        this.colorIndex = Math.floor(Math.random() * 4);
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.driftX = (Math.random() - 0.5) * 0.5;
        this.driftY = Math.random() * 0.5 + 0.2;
      }

      update(energy: number) {
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
        const isDark = themeRef.current === 'dark';
        const darkColors = ['#fcd34d', '#e879f9', '#818cf8', '#34d399']; 
        const lightColors = ['#d97706', '#be185d', '#4338ca', '#0369a1']; 
        const colors = isDark ? darkColors : lightColors;
        const color = colors[this.colorIndex % colors.length];

        const normalizedEnergy = Math.max(0, energy / 255);
        const alpha = isDark ? 0.4 + (normalizedEnergy * 0.4) : 0.7 + (normalizedEnergy * 0.2);

        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rotation);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx!.restore();
      }
    }

    const stars: Star[] = Array.from({ length: 200 }, () => new Star());
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

        const bassEnd = Math.floor(bufferLength * 0.1); 
        const midEnd = Math.floor(bufferLength * 0.5); 

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
        const isDark = themeRef.current === 'dark';
        const normalizedBass = bassEnergy / 255;
        const gradient = ctx.createRadialGradient(
            width / 2, height, 0,
            width / 2, height, width * 0.8
        );
        const alpha = normalizedBass * 0.3; 
        if (isDark) {
            gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`); // Indigo 500
            gradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.5})`); // Purple 500
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
            gradient.addColorStop(0, `rgba(96, 165, 250, ${alpha * 0.2})`); 
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      confetti.forEach(c => {
        c.update(midEnergy);
        c.draw(midEnergy);
      });

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
  }, []); // Empty dependency array allows animation loop to persist through theme changes

  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-1000 ${isDark ? 'bg-[#000000]' : 'bg-white'}`}>
      {/* Dark Mode Gradient Base - Cosmic Deep Space */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2e1065] via-[#020617] to-black transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Light Mode Pure White Base */}
       <div className={`absolute inset-0 bg-white transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}></div>
      
      {/* LIQUID BLOBS - Optimized with will-change */}
      <div className={`absolute top-[10%] left-[20%] w-[40rem] h-[40rem] rounded-full mix-blend-screen filter blur-[90px] animate-drift will-change-transform transition-opacity duration-1000 ${isDark ? 'bg-indigo-900/40 opacity-50' : 'opacity-0'}`}></div>
      <div className={`absolute top-[20%] right-[10%] w-[35rem] h-[35rem] rounded-full mix-blend-screen filter blur-[90px] animate-drift-delayed will-change-transform transition-opacity duration-1000 ${isDark ? 'bg-purple-900/40 opacity-50' : 'opacity-0'}`}></div>
      <div className={`absolute bottom-[10%] left-[30%] w-[45rem] h-[45rem] rounded-full mix-blend-screen filter blur-[90px] animate-drift will-change-transform transition-opacity duration-1000 ${isDark ? 'bg-blue-900/30 opacity-40' : 'opacity-0'}`} style={{ animationDelay: '5s' }}></div>

      {/* Canvas Layer */}
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${isDark ? 'mix-blend-screen' : 'opacity-60'}`} />
      
      {/* Vignette - Only in Dark Mode */}
      <div className={`absolute inset-0 bg-[radial-gradient(transparent_0%,_#000000_100%)] transition-opacity duration-1000 pointer-events-none ${isDark ? 'opacity-70' : 'opacity-0'}`}></div>
    </div>
  );
};

export default Background;
