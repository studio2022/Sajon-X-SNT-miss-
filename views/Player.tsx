import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Sliders, Zap, Activity, Waves, Move3d, Download, Share2, Timer, Mic2, Scissors, Repeat, RotateCcw, CloudRain, Disc, Speaker, Smartphone, Edit3, Settings2, X, Check } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';
import { Song, PlaybackConfig } from '../types';
import { Button } from '../components/Button';

interface PlayerProps {
  song: Song;
  onBack: () => void;
}

export const Player: React.FC<PlayerProps> = ({ song, onBack }) => {
  // -- State for 25+ Features --
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'circle' | 'bars'>('circle');
  
  // Audio Params
  const [speed, setSpeed] = useState(song.config?.speed || 1.0);
  const [pitch, setPitch] = useState(0); // Detune
  const [volume, setVolume] = useState(1.0);
  const [gainBoost, setGainBoost] = useState(0); // Extra loudness
  
  // EQ
  const [bass, setBass] = useState(song.config?.eqBass || 0);
  const [mid, setMid] = useState(song.config?.eqMid || 0);
  const [treble, setTreble] = useState(song.config?.eqTreble || 0);
  
  // Spatial
  const [is8D, setIs8D] = useState(song.config?.isSurround || false);
  const [panSpeed, setPanSpeed] = useState(0.01);
  const [width, setWidth] = useState(0); // Stereo width
  
  // Ambience & FX
  const [reverb, setReverb] = useState(song.config?.reverbMix || 0);
  const [vinyl, setVinyl] = useState(0);
  const [rain, setRain] = useState(0);
  const [isLofi, setIsLofi] = useState(false);
  
  // Editing Triggers (Visual only for prototype)
  const [trimStart, setTrimStart] = useState(0);
  const [isReverse, setIsReverse] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const panAngleRef = useRef(0);

  // --- Audio Engine Setup ---
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      
      // Node Chain: Source -> Gain (Vol) -> Bass -> Mid -> Treble -> Panner (8D) -> Gain (Boost) -> Dest
      const gainNode = ctx.createGain();
      const bassNode = ctx.createBiquadFilter(); bassNode.type = 'lowshelf'; bassNode.frequency.value = 200;
      const midNode = ctx.createBiquadFilter(); midNode.type = 'peaking'; midNode.frequency.value = 1000;
      const trebleNode = ctx.createBiquadFilter(); trebleNode.type = 'highshelf'; trebleNode.frequency.value = 3000;
      const pannerNode = ctx.createStereoPanner();
      const boostNode = ctx.createGain(); // For gain boost
      const analyser = ctx.createAnalyser(); analyser.fftSize = 256;

      source.connect(gainNode);
      gainNode.connect(bassNode);
      bassNode.connect(midNode);
      midNode.connect(trebleNode);
      trebleNode.connect(pannerNode);
      pannerNode.connect(boostNode);
      boostNode.connect(analyser);
      analyser.connect(ctx.destination);

      nodesRef.current = { source, gainNode, bassNode, midNode, trebleNode, pannerNode, boostNode, analyser };
    }
  }, []);

  // --- Real-time Parameter Updates ---
  useEffect(() => {
    if (!audioRef.current || !nodesRef.current) return;
    const { gainNode, bassNode, midNode, trebleNode, boostNode } = nodesRef.current;
    
    // Playback Rate (Speed)
    audioRef.current.playbackRate = speed;
    
    // EQ
    bassNode.gain.value = bass;
    midNode.gain.value = mid;
    trebleNode.gain.value = treble;
    
    // Volume & Boost
    gainNode.gain.value = volume;
    boostNode.gain.value = 1 + (gainBoost / 50); // Boost up to 2x (rough calc)

  }, [speed, bass, mid, treble, volume, gainBoost]);

  // --- 8D Animation Loop ---
  useEffect(() => {
    const animate = () => {
      if (is8D && nodesRef.current) {
        panAngleRef.current += panSpeed;
        nodesRef.current.pannerNode.pan.value = Math.sin(panAngleRef.current);
      } else if (nodesRef.current) {
        nodesRef.current.pannerNode.pan.value = 0;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [is8D, panSpeed]);

  // --- Helpers ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (!song.audioUrl) return;
    const link = document.createElement('a');
    link.href = song.audioUrl;
    link.download = `MelodyMix_${song.title}_Remix.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-black">
      <audio ref={audioRef} src={song.audioUrl} loop crossOrigin="anonymous" onEnded={() => setIsPlaying(false)} />

      {/* --- 1. Top Bar --- */}
      <div className="flex justify-between items-center px-4 py-4 z-10">
        <button onClick={onBack} className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h5 className="text-[10px] text-neon-blue font-bold tracking-[0.2em] uppercase mb-1">Now Playing From Studio</h5>
            <span className="text-xs text-gray-400 font-mono">AI REMIX ENGINE V2.0</span>
        </div>
        <button onClick={() => setShowTools(!showTools)} className={`p-3 rounded-full transition-all ${showTools ? 'bg-neon-purple text-white shadow-[0_0_15px_#b026ff]' : 'bg-white/10 text-white'}`}>
            <Sliders className="w-6 h-6" />
        </button>
      </div>

      {/* --- 2. Main Visual Area --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-0 mt-4 mb-8">
         {/* Background Glow */}
         <div className="absolute w-[120%] h-[50%] bg-gradient-to-t from-neon-purple/20 via-transparent to-transparent bottom-0 pointer-events-none blur-3xl" />
         
         {/* Visualizer Container */}
         <div className={`relative transition-all duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
             <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full blur-[60px] opacity-40 animate-pulse-fast" />
             
             {visualizerMode === 'circle' ? (
                <div className="w-72 h-72 rounded-full border-4 border-white/10 bg-[#0a0a12] flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className={`absolute inset-0 border-2 border-neon-blue/30 rounded-full ${is8D ? 'animate-spin' : ''}`} style={{ animationDuration: `${3/panSpeed}s` }} />
                    <Visualizer analyser={nodesRef.current?.analyser} isPlaying={isPlaying} />
                    {/* Inner Art */}
                    <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10">
                        <Disc className={`w-16 h-16 text-gray-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                    </div>
                </div>
             ) : (
                <div className="w-80 h-48 bg-black/50 rounded-xl border border-white/10 p-4 backdrop-blur-md">
                   <Visualizer analyser={nodesRef.current?.analyser} isPlaying={isPlaying} />
                </div>
             )}
         </div>

         {/* Song Info */}
         <div className="text-center mt-10 space-y-1 z-10 max-w-sm px-6">
            <h2 className="text-2xl font-display font-bold text-white truncate">{song.title}</h2>
            <p className="text-gray-400 text-sm">{song.artist} • <span className="text-neon-pink">{song.type.replace('_', ' ').toUpperCase()}</span></p>
         </div>
      </div>

      {/* --- 3. Bottom Controls --- */}
      <div className="pb-10 pt-4 px-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 space-y-6">
         {/* Progress Bar (Visual) */}
         <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple w-1/3 animate-pulse" />
         </div>

         {/* Main Transport */}
         <div className="flex items-center justify-between">
            {/* 25. Requested Download Button (Left Side) */}
            <button 
                onClick={handleDownload}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-green-400 transition-colors group"
            >
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-green-400/50 transition-all">
                    <Download className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase">Download</span>
            </button>

            {/* Play Controls */}
            <div className="flex items-center gap-6">
                <button className="text-gray-400 hover:text-white"><SkipBack className="w-8 h-8" /></button>
                <button 
                    onClick={togglePlay} 
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button className="text-gray-400 hover:text-white"><SkipForward className="w-8 h-8" /></button>
            </div>

            {/* Share/Action (Right Side) */}
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-neon-blue transition-colors group">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-neon-blue/50 transition-all">
                    <Share2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase">Share</span>
            </button>
         </div>
      </div>

      {/* --- 4. "Pro Studio" Drawer (The 25 Features) --- */}
      <div className={`fixed inset-x-0 bottom-0 bg-[#12121a] rounded-t-[2.5rem] transition-transform duration-500 z-50 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[75vh] overflow-y-auto ${showTools ? 'translate-y-0' : 'translate-y-full'}`}>
         
         <div className="sticky top-0 bg-[#12121a]/95 backdrop-blur-xl p-6 border-b border-white/5 flex justify-between items-center z-10">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-neon-purple" /> Pro Studio Tools
            </h3>
            <button onClick={() => setShowTools(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-5 h-5"/></button>
         </div>

         <div className="p-6 space-y-8 pb-32">
            
            {/* Section A: Dynamics & EQ */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dynamics & EQ</h4>
                <div className="grid grid-cols-4 gap-2">
                    <Knob label="Bass" value={bass} min={-20} max={20} onChange={setBass} color="text-blue-500" />
                    <Knob label="Mid" value={mid} min={-20} max={20} onChange={setMid} color="text-green-500" />
                    <Knob label="Treble" value={treble} min={-20} max={20} onChange={setTreble} color="text-yellow-500" />
                    <Knob label="Boost" value={gainBoost} min={0} max={100} onChange={setGainBoost} color="text-red-500" icon={<Zap className="w-4 h-4" />} />
                </div>
            </section>

            {/* Section B: Spatial & 8D */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Spatial Audio</h4>
                    <Toggle label="8D Mode" active={is8D} onToggle={() => setIs8D(!is8D)} />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl space-y-4">
                     <RangeSlider label="8D Rotation Speed" value={panSpeed} min={0.001} max={0.1} step={0.001} onChange={setPanSpeed} />
                     <RangeSlider label="Stereo Width" value={width} min={0} max={100} onChange={setWidth} />
                </div>
            </section>

            {/* Section C: Tempo & Pitch */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Time Engine</h4>
                <div className="bg-white/5 p-4 rounded-2xl space-y-6">
                    <RangeSlider label="Speed / Tempo" value={speed} min={0.5} max={2.0} step={0.05} onChange={setSpeed} />
                    <RangeSlider label="Pitch / Detune" value={pitch} min={-1200} max={1200} step={100} onChange={setPitch} />
                    <div className="flex gap-2">
                        <ActionButton icon={<RotateCcw className="w-4 h-4" />} label="Reverse" active={isReverse} onClick={() => setIsReverse(!isReverse)} />
                        <ActionButton icon={<Activity className="w-4 h-4" />} label="Slow+Reverb" onClick={() => { setSpeed(0.8); setReverb(0.6); setBass(5); }} />
                        <ActionButton icon={<Zap className="w-4 h-4" />} label="Nightcore" onClick={() => { setSpeed(1.25); setPitch(200); }} />
                    </div>
                </div>
            </section>

            {/* Section D: Ambience & FX */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Atmosphere</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                         <div className="flex items-center gap-2 text-gray-300 mb-2"><Disc className="w-4 h-4" /> Vinyl Crackle</div>
                         <input type="range" className="w-full accent-orange-500" min="0" max="1" step="0.1" value={vinyl} onChange={(e) => setVinyl(parseFloat(e.target.value))} />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                         <div className="flex items-center gap-2 text-gray-300 mb-2"><CloudRain className="w-4 h-4" /> Rain</div>
                         <input type="range" className="w-full accent-blue-500" min="0" max="1" step="0.1" value={rain} onChange={(e) => setRain(parseFloat(e.target.value))} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Toggle label="Lo-Fi Bitcrusher" active={isLofi} onToggle={() => setIsLofi(!isLofi)} />
                    <Toggle label="Fade In" active={fadeIn} onToggle={() => setFadeIn(!fadeIn)} />
                    <Toggle label="Fade Out" active={fadeIn} onToggle={() => setFadeIn(!fadeIn)} />
                </div>
            </section>

            {/* Section E: Tools */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Output & Tools</h4>
                <div className="grid grid-cols-3 gap-2">
                    <ToolButton icon={<Mic2 />} label="Voice Isolator" />
                    <ToolButton icon={<Scissors />} label="Trim Audio" />
                    <ToolButton icon={<Smartphone />} label="Save Ringtone" />
                    <ToolButton icon={<Repeat />} label="Loop A-B" />
                    <ToolButton icon={<Edit3 />} label="Edit Lyrics" />
                    <ToolButton icon={<Timer />} label="Sleep Timer" />
                </div>
            </section>
         </div>
      </div>
    </div>
  );
};

// --- Sub-components for controls ---

const Knob = ({ label, value, min, max, onChange, color, icon }: any) => (
    <div className="flex flex-col items-center gap-2 bg-white/5 p-3 rounded-xl">
        <div className={`text-xs font-bold ${color} flex items-center gap-1`}>{icon} {label}</div>
        <input 
            type="range" 
            min={min} max={max} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-[10px] text-gray-400">{Math.round(value)}</div>
    </div>
);

const RangeSlider = ({ label, value, min, max, step = 1, onChange }: any) => (
    <div>
        <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-300">{label}</span>
            <span className="text-neon-blue font-mono">{Math.round(value * 100) / 100}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step}
            value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
        />
    </div>
);

const Toggle = ({ label, active, onToggle }: any) => (
    <button 
        onClick={onToggle}
        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${active ? 'bg-neon-blue/20 border-neon-blue text-white' : 'bg-white/5 border-transparent text-gray-400'}`}
    >
        <span className="text-xs font-bold">{label}</span>
        {active ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-gray-500" />}
    </button>
);

const ActionButton = ({ icon, label, onClick, active }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold border transition-all ${active ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
    >
        {icon} {label}
    </button>
);

const ToolButton = ({ icon, label }: any) => (
    <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
        <div className="text-gray-300">{icon}</div>
        <span className="text-[10px] text-gray-400 font-bold">{label}</span>
    </button>
);