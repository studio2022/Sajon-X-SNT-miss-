import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, ArrowLeft, Sliders, Zap, Activity, Waves, Move3d, Layers } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';
import { Song } from '../types';

interface PlayerProps {
  song: Song;
  onBack: () => void;
}

export const Player: React.FC<PlayerProps> = ({ song, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [showFx, setShowFx] = useState(false);

  // Live Controls
  const [liveSpeed, setLiveSpeed] = useState(song.config?.speed || 1.0);
  const [liveBass, setLiveBass] = useState(song.config?.bassBoost || 0);
  const [liveReverb, setLiveReverb] = useState(song.config?.reverbMix || 0);
  const [isSurroundEnabled, setIsSurroundEnabled] = useState(song.config?.isSurround || false);
  
  // Reverb Settings
  const [reverbType, setReverbType] = useState<'hall' | 'room' | 'plate'>('hall');
  const [reverbDecay, setReverbDecay] = useState(3.0); 

  // Refs for Audio API
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null); // For Mashup (2nd Track)
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    source: MediaElementAudioSourceNode;
    bass: BiquadFilterNode;
    filter: BiquadFilterNode;
    convolver: ConvolverNode;
    reverbGain: GainNode;
    dryGain: GainNode;
    compressor: DynamicsCompressorNode;
    analyser: AnalyserNode;
    panner: StereoPannerNode;
  } | null>(null);

  // 12D/Surround Animation Ref
  const panRef = useRef<number>(0);
  const panAngleRef = useRef<number>(0); 
  const animationFrameRef = useRef<number>();

  // Helper: Create Impulse Response for Reverb
  const createImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        const val = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        left[i] = val;
        right[i] = val;
    }
    return impulse;
  };

  // Helper: TTS for Lyrics
  const speakLyrics = () => {
      if (song.newLyrics && window.speechSynthesis) {
          // Cancel previous speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(song.newLyrics);
          // Try to find a singing-like voice or just a good English voice
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
          if (femaleVoice) utterance.voice = femaleVoice;
          
          utterance.pitch = 1.2; // Slightly higher for "singing" effect
          utterance.rate = 0.9; // Slower
          utterance.volume = 1.0;
          
          window.speechSynthesis.speak(utterance);
      }
  };

  // Initialize Audio Context
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      
      const bass = ctx.createBiquadFilter(); 
      bass.type = 'lowshelf';
      
      const filter = ctx.createBiquadFilter(); 
      
      const compressor = ctx.createDynamicsCompressor(); 
      compressor.threshold.value = -24;
      compressor.ratio.value = 12;

      const panner = ctx.createStereoPanner(); 

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const convolver = ctx.createConvolver();
      convolver.buffer = createImpulseResponse(ctx, reverbDecay, 2.0); 

      const reverbGain = ctx.createGain(); 
      const dryGain = ctx.createGain(); 

      // Graph
      source.connect(bass);
      bass.connect(filter);
      filter.connect(compressor);

      compressor.connect(dryGain);
      compressor.connect(convolver);
      convolver.connect(reverbGain);

      dryGain.connect(panner);
      reverbGain.connect(panner);
      
      panner.connect(analyser);
      analyser.connect(ctx.destination);

      nodesRef.current = { source, bass, filter, convolver, reverbGain, dryGain, compressor, analyser, panner };
      setAnalyserNode(analyser);
    }
  }, []);

  // Update Reverb
  useEffect(() => {
    if (!nodesRef.current || !audioContextRef.current) return;
    let curve = 2.0;
    switch(reverbType) {
        case 'room': curve = 5.0; break;
        case 'plate': curve = 3.0; break;
        case 'hall': curve = 1.5; break;
    }
    const buffer = createImpulseResponse(audioContextRef.current, reverbDecay, curve);
    nodesRef.current.convolver.buffer = buffer;
  }, [reverbType, reverbDecay]);

  // 12D Animation
  useEffect(() => {
    const animatePan = () => {
        if (isSurroundEnabled && nodesRef.current) {
            panAngleRef.current += 0.01; 
            const x = Math.sin(panAngleRef.current);
            nodesRef.current.panner.pan.value = x;
            animationFrameRef.current = requestAnimationFrame(animatePan);
        } else if (nodesRef.current) {
            nodesRef.current.panner.pan.setTargetAtTime(0, audioContextRef.current!.currentTime, 0.1);
        }
    };
    if (isSurroundEnabled) animationFrameRef.current = requestAnimationFrame(animatePan);
    else if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isSurroundEnabled]);

  // Update Params
  useEffect(() => {
    if (!audioRef.current || !nodesRef.current || !audioContextRef.current) return;
    const { bass, reverbGain, dryGain, filter } = nodesRef.current;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    audioRef.current.playbackRate = liveSpeed;
    if (audioRef2.current) audioRef2.current.playbackRate = liveSpeed;

    bass.frequency.setValueAtTime(120, now); 
    bass.gain.setTargetAtTime(liveBass, now, 0.1);

    const wet = liveReverb;
    const dry = 1 - (wet * 0.5); 
    reverbGain.gain.setTargetAtTime(wet, now, 0.1);
    dryGain.gain.setTargetAtTime(dry, now, 0.1);

    if (song.config?.filterType && song.config.filterType !== 'none') {
        filter.type = song.config.filterType;
        filter.frequency.setTargetAtTime(song.config.filterFreq || 20000, now, 0.1);
    } else {
        filter.type = 'allpass';
    }

  }, [liveSpeed, liveBass, liveReverb, song]);

  // Autoplay
  useEffect(() => {
    if(audioRef.current) {
      audioRef.current.volume = 0.8;
      // If mashup, set volume for 2nd track
      if (audioRef2.current) audioRef2.current.volume = 0.6; // Mix it slightly lower
      
      if (audioContextRef.current?.state === 'suspended') {
         audioContextRef.current.resume();
      }
      const playPromise = audioRef.current.play();
      if(playPromise) {
          playPromise.then(() => {
              setIsPlaying(true);
              if (song.type === 'mashup' && audioRef2.current) audioRef2.current.play();
              if (song.type === 'lyric_swap') speakLyrics();
          }).catch(e => console.log(e));
      }
    }
  }, [song]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      
      if (isPlaying) {
          audioRef.current.pause();
          if (audioRef2.current) audioRef2.current.pause();
          if (window.speechSynthesis) window.speechSynthesis.pause();
      } else {
          audioRef.current.play();
          if (audioRef2.current) audioRef2.current.play();
          if (window.speechSynthesis) window.speechSynthesis.resume();
          // If speech finished, restart it roughly? No, simple resume for now.
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const time = percentage * audioRef.current.duration;
      
      audioRef.current.currentTime = time;
      // Sync second track
      if (audioRef2.current) audioRef2.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto py-4 relative">
      <audio 
        ref={audioRef} 
        src={song.audioUrl} 
        crossOrigin="anonymous"
        onTimeUpdate={() => {
            if(audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
                setDuration(audioRef.current.duration || 0);
                setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            }
        }}
        onEnded={() => setIsPlaying(false)}
        loop
      />
      {/* Second Audio Element for Mashups */}
      {song.mashupUrl && (
          <audio ref={audioRef2} src={song.mashupUrl} crossOrigin="anonymous" loop />
      )}

      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h5 className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue font-bold tracking-widest uppercase">Now Playing</h5>
        </div>
        <button onClick={() => setShowFx(!showFx)} className={`p-2 rounded-full transition-colors ${showFx ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}>
            <Sliders className="w-6 h-6" />
        </button>
      </div>

      {/* Main Visuals & Title */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
         {/* Rainbow Glow */}
         <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
         
         <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full rainbow-border flex items-center justify-center shadow-2xl transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
            <div className={`absolute inset-0 rounded-full border border-white/10 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
            
            {/* Surround Visual Indicator */}
            {isSurroundEnabled && (
                 <>
                    <div className="absolute w-[120%] h-[120%] border border-cyan-400/30 rounded-full animate-pulse" />
                    <div className="absolute w-[140%] h-[140%] border border-cyan-400/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s'}} />
                 </>
            )}

            <div className="w-56 h-56 bg-black rounded-full flex items-center justify-center overflow-hidden relative z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-purple-900/50 mix-blend-overlay" />
                <Visualizer analyser={analyserNode} isPlaying={isPlaying} />
            </div>
         </div>

         <div className="text-center mt-8 space-y-2 z-10">
            <h2 className="text-3xl font-display font-bold text-white rainbow-text">{song.title}</h2>
            <div className="flex items-center justify-center gap-2">
                <p className="text-gray-400">{song.artist}</p>
                {song.type === 'mashup' && <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">MASHUP</span>}
            </div>
         </div>
      </div>

      {/* Live FX Sliders Panel */}
      {showFx && (
        <div className="my-6 bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in-up backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4 text-white">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold uppercase tracking-wider">Fine Tune</span>
            </div>
            <div className="space-y-6">
                {/* Speed */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Speed</span>
                        <span>{Math.round(liveSpeed * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="1.5" step="0.01" 
                        value={liveSpeed} onChange={(e) => setLiveSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
                
                {/* Bass */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Bass Level</span>
                        <span>{liveBass} dB</span>
                    </div>
                    <input 
                        type="range" min="0" max="25" step="1" 
                        value={liveBass} onChange={(e) => setLiveBass(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Reverb Section */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-pink-500">
                        <Waves className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase tracking-wider">Reverb Engine</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {(['hall', 'room', 'plate'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setReverbType(type)}
                                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${reverbType === type ? 'bg-pink-500 text-white border-pink-500' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between text-xs text-gray-400">
                            <span>Mix</span>
                            <span>{Math.round(liveReverb * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={liveReverb} onChange={(e) => setLiveReverb(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Progress & Main Controls */}
      <div className="mt-auto pt-6 space-y-6">
        <div className="w-full space-y-2 px-2">
            <div className="h-1.5 bg-gray-800 rounded-full cursor-pointer group relative overflow-hidden" onClick={handleSeek}>
                <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 absolute top-0 left-0" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>

        <div className="flex items-center justify-center gap-10">
            <button className="text-gray-400 hover:text-white transition-colors" onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }}>
                <SkipBack className="w-8 h-8" />
            </button>
            <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors" onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }}>
                <SkipForward className="w-8 h-8" />
            </button>
        </div>

        {/* Bottom Decision Buttons (Quick Actions - Beat, 12D, Bed) */}
        <div className="grid grid-cols-3 gap-3 px-2 pb-2">
            <button 
                onClick={() => setLiveBass(liveBass >= 12 ? 0 : 15)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${liveBass >= 12 ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
            >
                <Activity className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Max Beat</span>
            </button>
            
            <button 
                onClick={() => setIsSurroundEnabled(!isSurroundEnabled)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isSurroundEnabled ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
            >
                <Move3d className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">12D Audio</span>
            </button>

            <button 
                onClick={() => {
                   if (liveSpeed < 1) {
                       setLiveSpeed(1.0);
                       setLiveReverb(0);
                   } else {
                       setLiveSpeed(0.75); // Slow
                       setLiveReverb(0.6); // Wet
                   }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${liveSpeed < 0.8 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
            >
                <Waves className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Bed Mode</span>
            </button>
        </div>
      </div>
    </div>
  );
};