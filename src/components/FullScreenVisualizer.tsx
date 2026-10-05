import React, { useEffect, useRef } from 'react';
import { AgentStatus } from '../types/agent';
import { Mic, Volume2, Sparkles, Brain, Maximize2, Minimize2 } from 'lucide-react';

interface FullScreenVisualizerProps {
  status: AgentStatus;
  analyserNode: AnalyserNode | null;
  audioActive: boolean;
  userSpeaking: boolean;
  agentName?: string;
  currentSpeechText?: string;
  language?: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const FullScreenVisualizer: React.FC<FullScreenVisualizerProps> = ({
  status,
  analyserNode,
  audioActive,
  userSpeaking,
  agentName = 'AURA AI',
  currentSpeechText,
  language,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Particle systems
  const particles = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      angle: number;
      dist: number;
      speed: number;
    }>
  >([]);

  useEffect(() => {
    // Generate initial orbital particles
    const pList: typeof particles.current = [];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 260;
      pList.push({
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 1 + Math.random() * 3,
        color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#818cf8' : '#34d399',
        alpha: 0.3 + Math.random() * 0.6,
        angle,
        dist,
        speed: (0.005 + Math.random() * 0.015) * (Math.random() > 0.5 ? 1 : -1),
      });
    }
    particles.current = pList;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const frequencyData = new Uint8Array(64);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth * dpr : window.innerWidth * dpr;
      canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight * dpr : window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      time += 0.03;
      const width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      const height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      const cx = width / 2;
      const cy = height / 2;

      // Extract frequency data if audio is active
      let audioLevel = 0;
      if (analyserNode && audioActive) {
        analyserNode.getByteFrequencyData(frequencyData);
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          sum += frequencyData[i];
        }
        audioLevel = sum / (frequencyData.length * 255);
      } else if (status === 'speaking') {
        // Simulated voice rhythm if WebSpeech or buffer fallback
        audioLevel = 0.35 + Math.sin(time * 6) * 0.25 + Math.sin(time * 14) * 0.15;
      } else if (status === 'listening' && userSpeaking) {
        audioLevel = 0.25 + Math.sin(time * 8) * 0.15;
      }

      // 1. Cosmic Deep Gradient Clear
      ctx.fillStyle = '#050713';
      ctx.fillRect(0, 0, width, height);

      // Ambient radial glow behind orb
      const ambientGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.7);
      if (status === 'speaking') {
        ambientGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        ambientGlow.addColorStop(0.3, 'rgba(129, 140, 248, 0.12)');
        ambientGlow.addColorStop(1, 'rgba(5, 7, 19, 0)');
      } else if (status === 'thinking') {
        ambientGlow.addColorStop(0, 'rgba(168, 85, 247, 0.28)');
        ambientGlow.addColorStop(0.3, 'rgba(99, 102, 241, 0.14)');
        ambientGlow.addColorStop(1, 'rgba(5, 7, 19, 0)');
      } else if (status === 'listening') {
        ambientGlow.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        ambientGlow.addColorStop(0.3, 'rgba(6, 182, 212, 0.12)');
        ambientGlow.addColorStop(1, 'rgba(5, 7, 19, 0)');
      } else {
        ambientGlow.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
        ambientGlow.addColorStop(0.4, 'rgba(99, 102, 241, 0.05)');
        ambientGlow.addColorStop(1, 'rgba(5, 7, 19, 0)');
      }
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Orbital particles & constellation lines
      pListRender(ctx, cx, cy, time, status, audioLevel);

      // 3. Central Reactive Harmonic Sphere
      drawReactiveCore(ctx, cx, cy, time, status, audioLevel, frequencyData);

      // 4. Equalizer / Sonar Waveform Rings
      drawWaveformRings(ctx, cx, cy, time, status, audioLevel, frequencyData);

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [status, analyserNode, audioActive, userSpeaking]);

  const pListRender = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number,
    agentStatus: AgentStatus,
    audioLevel: number
  ) => {
    const list = particles.current;
    const speedMult = agentStatus === 'thinking' ? 2.5 : agentStatus === 'speaking' ? 1.8 : 0.8;

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.angle += p.speed * speedMult;
      const dynamicDist = p.dist + (agentStatus === 'speaking' ? audioLevel * 70 : Math.sin(time + i) * 10);
      p.x = cx + Math.cos(p.angle) * dynamicDist;
      p.y = cy + Math.sin(p.angle) * dynamicDist;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (1 + audioLevel * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (0.6 + audioLevel * 0.4);
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();

      // Connect neighbor particles with glowing synaptic threads
      if (agentStatus === 'thinking' || (agentStatus === 'speaking' && i % 4 === 0)) {
        for (let j = i + 1; j < list.length; j += 6) {
          const p2 = list[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = agentStatus === 'thinking' ? 'rgba(192, 132, 252, 0.25)' : 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }
  };

  const drawReactiveCore = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number,
    agentStatus: AgentStatus,
    audioLevel: number,
    freqs: Uint8Array
  ) => {
    const baseRadius = 78;
    const reactiveBoost = audioLevel * 55;
    const currentRadius = baseRadius + reactiveBoost + Math.sin(time * 2) * 4;

    ctx.save();

    // Multilayer luminous glow
    const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, currentRadius * 1.5);

    if (agentStatus === 'speaking') {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#38bdf8');
      coreGrad.addColorStop(0.65, '#6366f1');
      coreGrad.addColorStop(0.9, '#a855f7');
      coreGrad.addColorStop(1, 'transparent');
    } else if (agentStatus === 'thinking') {
      coreGrad.addColorStop(0, '#fdf4ff');
      coreGrad.addColorStop(0.3, '#c084fc');
      coreGrad.addColorStop(0.7, '#7c3aed');
      coreGrad.addColorStop(1, 'transparent');
    } else if (agentStatus === 'listening') {
      coreGrad.addColorStop(0, '#ecfdf5');
      coreGrad.addColorStop(0.3, '#34d399');
      coreGrad.addColorStop(0.7, '#059669');
      coreGrad.addColorStop(1, 'transparent');
    } else {
      coreGrad.addColorStop(0, '#f8fafc');
      coreGrad.addColorStop(0.35, '#38bdf8');
      coreGrad.addColorStop(0.75, '#1e3a8a');
      coreGrad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = coreGrad;
    ctx.shadowBlur = 40 + audioLevel * 40;
    ctx.shadowColor =
      agentStatus === 'speaking' ? '#38bdf8' : agentStatus === 'thinking' ? '#c084fc' : '#34d399';

    // Morphing fluid vertex contour
    ctx.beginPath();
    const points = 32;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const freqIdx = i % freqs.length;
      const freqVal = (freqs[freqIdx] || 0) / 255;

      const wave1 = Math.sin(angle * 4 + time * 3) * (6 + audioLevel * 14);
      const wave2 = Math.cos(angle * 6 - time * 2) * (4 + audioLevel * 10);
      const r = currentRadius + wave1 + wave2 + freqVal * (audioLevel > 0 ? 18 : 2);

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner bright neural nucleus
    const nucleusGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    nucleusGrad.addColorStop(0, '#ffffff');
    nucleusGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.85)');
    nucleusGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = nucleusGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 26 + audioLevel * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawWaveformRings = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number,
    agentStatus: AgentStatus,
    audioLevel: number,
    freqs: Uint8Array
  ) => {
    ctx.save();

    // 1. Radar / Sonar concentric pulses
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const ringTime = (time * 0.8 + (r * Math.PI) / 3) % (Math.PI * 2);
      const ringExpansion = (ringTime / (Math.PI * 2)) * 160 + 95;
      const ringAlpha = Math.max(0, 1 - ringExpansion / 255) * (0.35 + audioLevel * 0.4);

      ctx.beginPath();
      ctx.arc(cx, cy, ringExpansion + audioLevel * 20, 0, Math.PI * 2);
      ctx.strokeStyle =
        agentStatus === 'speaking'
          ? `rgba(56, 189, 248, ${ringAlpha})`
          : agentStatus === 'thinking'
          ? `rgba(192, 132, 252, ${ringAlpha})`
          : agentStatus === 'listening'
          ? `rgba(52, 211, 153, ${ringAlpha})`
          : `rgba(96, 165, 250, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Circular Reactive Frequency Equalizer Bars (only when speaking or receiving)
    const barCount = 48;
    const barBaseRadius = 145 + audioLevel * 25;
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const freqIdx = Math.floor((i / barCount) * freqs.length);
      const val = (freqs[freqIdx] || 0) / 255;
      const barHeight = 8 + (val > 0 ? val * 45 : Math.sin(angle * 5 + time * 4) * 8 + audioLevel * 28);

      const x1 = cx + Math.cos(angle) * barBaseRadius;
      const y1 = cy + Math.sin(angle) * barBaseRadius;
      const x2 = cx + Math.cos(angle) * (barBaseRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (barBaseRadius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle =
        agentStatus === 'speaking'
          ? `hsl(${190 + (i / barCount) * 80}, 90%, 65%)`
          : agentStatus === 'thinking'
          ? `hsl(${270 + (i / barCount) * 50}, 85%, 70%)`
          : `hsl(${150 + (i / barCount) * 60}, 80%, 60%)`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'listening':
        return {
          label: 'Listening to your voice...',
          labelBn: 'আপনার কথা শুনছি...',
          labelHi: 'आपकी आवाज़ सुन रहा हूँ...',
          icon: <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />,
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
        };
      case 'thinking':
        return {
          label: 'Reasoning & Solving...',
          labelBn: 'বিশ্লেষণ ও চিন্তা করছি...',
          labelHi: 'सोच और विश्लेषण कर रहा हूँ...',
          icon: <Brain className="w-4 h-4 text-purple-400 animate-spin" />,
          color: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
        };
      case 'speaking':
        return {
          label: 'Voice Speaking (Gemini HD Audio)...',
          labelBn: 'ভয়েস উত্তর দিচ্ছি...',
          labelHi: 'आवाज़ में जवाब दे रहा हूँ...',
          icon: <Volume2 className="w-4 h-4 text-sky-400 animate-bounce" />,
          color: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
        };
      default:
        return {
          label: 'Standby - Ready for instruction',
          labelBn: 'প্রস্তুত - নির্দেশ দিন',
          labelHi: 'तैयार - निर्देश दें',
          icon: <Sparkles className="w-4 h-4 text-slate-400" />,
          color: 'text-slate-300 border-slate-700/50 bg-slate-900/60',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative w-full h-full min-h-[380px] overflow-hidden rounded-2xl border border-cyan-500/20 shadow-2xl bg-[#050713]">
      {/* 60FPS Reactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-pointer" />

      {/* Top HUD Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-2 border backdrop-blur-md transition-all duration-300 shadow-lg ${badge.color}">
            {badge.icon}
            <span>{badge.label}</span>
            <span className="text-slate-400 text-[10px]">· {badge.labelBn}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all cursor-pointer shadow-md"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Subtitles / Active Voice Response Text */}
      {currentSpeechText && (
        <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
          <div className="max-w-2xl px-5 py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl text-center">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> {agentName} · Live Speech
            </p>
            <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed">
              "{currentSpeechText}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
