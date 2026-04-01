
// Singleton AudioContext and AnalyserNode
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512; 
      analyser.smoothingTimeConstant = 0.7; // Smoother visuals for complex sounds
      
      // Important: Connect analyser to destination so sound is heard
      analyser.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return { audioCtx, analyser };
};

export const getAnalyser = () => analyser;

// --- Helper: Create White Noise Buffer (Lazy loaded) ---
const getNoiseBuffer = (ctx: AudioContext) => {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
};

// --- Sound Effects ---

export const playCountdownBeep = () => {
    try {
        const { audioCtx, analyser } = initAudio();
        if (!audioCtx || !analyser) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // 600Hz subtle beep - "Electronic" feel
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); // Increased gain
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(analyser); 
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) { /* ignore */ }
};

export const playTick = () => {
  try {
    const { audioCtx, analyser } = initAudio();
    if (!audioCtx || !analyser) return;

    // A mechanical "woodblock" type click
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Increased gain
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(analyser);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) { /* ignore */ }
};

export const playSparkle = () => {
  try {
    const { audioCtx, analyser } = initAudio();
    if (!audioCtx || !analyser) return;

    const now = audioCtx.currentTime;
    // Play a quick flurry of high pitched notes
    for(let i=0; i<5; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        // Random high frequency between 1500 and 3000
        const freq = 1500 + Math.random() * 1500;
        osc.frequency.setValueAtTime(freq, now + (i*0.05));
        
        gain.gain.setValueAtTime(0, now + (i*0.05));
        gain.gain.linearRampToValueAtTime(0.1, now + (i*0.05) + 0.02); // Increased gain
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i*0.05) + 0.2);

        osc.connect(gain);
        gain.connect(analyser);
        
        osc.start(now + (i*0.05));
        osc.stop(now + (i*0.05) + 0.2);
    }
  } catch (e) { /* ignore */ }
};

export const playWhoosh = () => {
  try {
    const { audioCtx, analyser } = initAudio();
    if (!audioCtx || !analyser) return;
    
    const buffer = getNoiseBuffer(audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;
    
    const gain = audioCtx.createGain();
    
    const now = audioCtx.currentTime;
    // Sweep up
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 1.5);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.5); // Increased gain
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    
    source.start(now);
    source.stop(now + 1.6);
  } catch (e) { /* ignore */ }
};

export const playPop = () => {
  try {
    const { audioCtx, analyser } = initAudio();
    if (!audioCtx || !analyser) return;

    const buffer = getNoiseBuffer(audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    
    const gain = audioCtx.createGain();
    
    const now = audioCtx.currentTime;
    
    // Quick frequency drop for a "thud/pop" sound
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    gain.gain.setValueAtTime(0.7, now); // Increased gain significantly
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    
    source.start(now);
    source.stop(now + 0.1);
  } catch (e) { /* ignore */ }
};

export const playCelebrationSound = () => {
  try {
    const { audioCtx, analyser } = initAudio();
    if (!audioCtx || !analyser) return;

    const now = audioCtx.currentTime;

    // 1. Major Chord (C Major: C, E, G, C)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; // Richer sound than sine
      osc.frequency.setValueAtTime(freq, now + (i * 0.05));
      
      gain.gain.setValueAtTime(0, now + (i * 0.05));
      gain.gain.linearRampToValueAtTime(0.2, now + (i * 0.05) + 0.1); // Increased gain
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.05) + 4); // Long sustain
      
      osc.connect(gain);
      if (analyser) {
        gain.connect(analyser); 
      }
      
      osc.start(now + (i * 0.05));
      osc.stop(now + (i * 0.05) + 4);
    });

    // 2. Initial Burst
    playPop();
    setTimeout(() => { playPop(); playSparkle(); }, 200); // More varied burst
    setTimeout(playSparkle, 500);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playRandomEffect = () => {
    // Weighted random: Pops are common, Sparkles common, Whooshes rare
    const r = Math.random();
    if (r < 0.4) playPop();
    else if (r < 0.8) playSparkle();
    else playWhoosh();
};
