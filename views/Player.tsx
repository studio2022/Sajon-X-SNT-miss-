import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Download, Disc, Zap, Activity, Waves, Move3d, Layers, RotateCcw, Loader2, Wind, Sliders } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';
import { Song } from '../types';

interface PlayerProps {
  song: Song;
  onBack: () => void;
}

export const Player: React.FC<PlayerProps> = ({ song, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Audio Parameters ---
  const [speed, setSpeed] = useState(song.config?.speed || 1.0);
  const [bass, setBass] = useState(song.config?.bassBoost || 0);
  const [reverb, setReverb] = useState(song.config?.reverbMix || 0);
  const [is8D, setIs8D] = useState(song.config?.is8D || false);
  const [isLofi, setIsLofi] = useState(song.config?.isLofi || false);
  const [mashupMix, setMashupMix] = useState(0.5);
  
  // Vinyl Mode: ON = Speed changes Pitch. OFF (Digital) = Pitch stays same.
  const [vinylMode, setVinylMode] = useState(song.type === 'dj_mode'); 
  const [isExporting, setIsExporting] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const panAngleRef = useRef(0);
  const syncIntervalRef = useRef<number>();

  // --- 1. SETUP AUDIO ENGINE (DISTORTION FIX) ---
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if(audioRef.current) audioRef.current.currentTime = 0;
    if(audioRef2.current) audioRef2.current.currentTime = 0;

    const initAudio = () => {
        if (!audioRef.current) return;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Create Sources
        const source1 = ctx.createMediaElementSource(audioRef.current);
        let source2 = null;
        if (song.mashupUrl && audioRef2.current) {
            source2 = ctx.createMediaElementSource(audioRef2.current);
        }

        // --- FX Chain Construction (Optimized for Clear Sound) ---
        
        // 1. Headroom Gain (Prevents Clipping when Bass is boosted)
        // We lower the volume by 20% entering the chain so Bass Boost doesn't hit red lining.
        const headroomGain = ctx.createGain();
        headroomGain.gain.value = 0.8; 

        // 2. Bass Boost (LowShelf)
        const bassNode = ctx.createBiquadFilter(); 
        bassNode.type = 'lowshelf'; 
        bassNode.frequency.value = 65; // Slightly higher punch

        // 3. LoFi Filter (LowPass)
        const lofiFilter = ctx.createBiquadFilter();
        lofiFilter.type = 'lowpass';
        lofiFilter.frequency.value = 22000;
        lofiFilter.Q.value = 0.5;

        // 4. Mashup Vocal Filter
        const vocalFilter = ctx.createBiquadFilter();
        vocalFilter.type = 'highpass';
        vocalFilter.frequency.value = 350; 

        // 5. Reverb (Convolver)
        const convolver = ctx.createConvolver();
        const reverbGain = ctx.createGain();
        const dryGain = ctx.createGain();
        
        // Impulse Response
        const rate = ctx.sampleRate;
        const length = rate * 2.5; 
        const impulse = ctx.createBuffer(2, length, rate);
        for (let i = 0; i < length; i++) {
             const n = i / length;
             const val = (Math.random() * 2 - 1) * Math.pow(1 - n, 2); 
             impulse.getChannelData(0)[i] = val;
             impulse.getChannelData(1)[i] = val;
        }
        convolver.buffer = impulse;

        // 6. 8D Panner
        const panner = ctx.createStereoPanner();

        // 7. Master Limiter/Compressor (Soft Clipper to stop "Bitchiri Sound")
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -12; // Start compressing earlier
        compressor.knee.value = 30; // Soft knee
        compressor.ratio.value = 6; // Gentle compression
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        // --- Routing Connections ---
        
        // Mix inputs
        const gain1 = ctx.createGain();
        source1.connect(gain1);
        gain1.connect(headroomGain);

        let gain2 = null;
        if (source2) {
            gain2 = ctx.createGain();
            source2.connect(gain2);
            if (song.type === 'mashup') {
                gain2.connect(vocalFilter); 
                vocalFilter.connect(headroomGain);
            } else {
                gain2.connect(headroomGain);
            }
        }

        // Chain: Headroom -> Bass -> LoFi -> Reverb Split
        headroomGain.connect(bassNode);
        bassNode.connect(lofiFilter);
        
        lofiFilter.connect(dryGain);
        lofiFilter.connect(convolver);
        convolver.connect(reverbGain);

        // Rejoin at Panner (8D)
        dryGain.connect(panner);
        reverbGain.connect(panner);

        // Master Out
        panner.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(ctx.destination);

        nodesRef.current = { 
            bassNode, lofiFilter, panner, reverbGain, dryGain, analyser, 
            gain1, gain2, ctx 
        };
    };

    if(!audioContextRef.current) {
        initAudio();
    }

    return () => {
        if(syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [song]);

  // --- 2. LIVE PARAMETER UPDATES ---
  useEffect(() => {
    if (!audioRef.current || !nodesRef.current) return;
    const { bassNode, lofiFilter, reverbGain, dryGain, gain1, gain2, ctx } = nodesRef.current;
    const now = ctx.currentTime;
    const RAMPSPEED = 0.1;

    // Speed Logic
    audioRef.current.playbackRate = speed;
    audioRef.current.preservesPitch = !vinylMode; 

    if (audioRef2.current) {
        audioRef2.current.playbackRate = speed;
        audioRef2.current.preservesPitch = !vinylMode;
    }
    
    // Safe Bass Boost (0 to 15dB max)
    // Prevents extreme clipping
    bassNode.gain.setTargetAtTime(bass, now, RAMPSPEED);

    // LoFi
    if (isLofi) {
        lofiFilter.frequency.setTargetAtTime(1000, now, 0.5); 
    } else {
        lofiFilter.frequency.setTargetAtTime(22000, now, 0.5);
    }

    // Reverb
    reverbGain.gain.setTargetAtTime(reverb, now, RAMPSPEED);
    dryGain.gain.setTargetAtTime(1 - (reverb * 0.4), now, RAMPSPEED);

    // Mashup
    if (gain2) {
        gain1.gain.setTargetAtTime(Math.cos(mashupMix * 0.5 * Math.PI), now, RAMPSPEED);
        gain2.gain.setTargetAtTime(Math.cos((1 - mashupMix) * 0.5 * Math.PI), now, RAMPSPEED);
    }
  }, [speed, bass, reverb, isLofi, mashupMix, vinylMode]);

  // --- 3. MASHUP SYNC ---
  useEffect(() => {
      if(song.mashupUrl && isPlaying) {
          syncIntervalRef.current = window.setInterval(() => {
              if(audioRef.current && audioRef2.current) {
                  const diff = Math.abs(audioRef.current.currentTime - audioRef2.current.currentTime);
                  if(diff > 0.05) {
                      audioRef2.current.currentTime = audioRef.current.currentTime;
                  }
              }
          }, 1000); 
      } else {
          clearInterval(syncIntervalRef.current);
      }
      return () => clearInterval(syncIntervalRef.current);
  }, [isPlaying, song.mashupUrl]);

  // --- 4. 8D ANIMATION ---
  useEffect(() => {
    const animate = () => {
      if (is8D && nodesRef.current) {
        // Smooth rotation
        panAngleRef.current += 0.008 * speed; 
        nodesRef.current.panner.pan.value = Math.sin(panAngleRef.current);
      } else if (nodesRef.current) {
        nodesRef.current.panner.pan.value = 0;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [is8D, speed]);

  const togglePlay = async () => {
    if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    if (isPlaying) {
        audioRef.current?.pause();
        audioRef2.current?.pause();
    } else {
        audioRef.current?.play();
        audioRef2.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
      setSpeed(1.0);
      setBass(0);
      setReverb(0);
      setIs8D(false);
      setIsLofi(false);
      setVinylMode(false);
  };

  // --- 5. EXPORT ---
  const handleExport = async () => {
      if (!song.audioUrl) return;
      setIsExporting(true);
      setIsPlaying(false);
      audioRef.current?.pause();
      audioRef2.current?.pause();

      try {
        const response = await fetch(song.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const newDuration = audioBuffer.duration / speed;
        const offlineCtx = new OfflineAudioContext(2, newDuration * 44100, 44100);

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speed;

        if (!vinylMode && speed !== 1.0) {
            const pitchCorrectionCents = -1200 * Math.log2(speed);
            source.detune.value = pitchCorrectionCents;
        }

        const headroomGain = offlineCtx.createGain();
        headroomGain.gain.value = 0.8;

        const bassNode = offlineCtx.createBiquadFilter();
        bassNode.type = 'lowshelf';
        bassNode.frequency.value = 65;
        bassNode.gain.value = bass;

        const lofiFilter = offlineCtx.createBiquadFilter();
        lofiFilter.type = 'lowpass';
        lofiFilter.frequency.value = isLofi ? 1000 : 22000;

        const convolver = offlineCtx.createConvolver();
        const length = 44100 * 2.5;
        const impulse = offlineCtx.createBuffer(2, length, 44100);
        for (let i = 0; i < length; i++) {
             const n = i / length;
             const val = (Math.random() * 2 - 1) * Math.pow(1 - n, 2); 
             impulse.getChannelData(0)[i] = val;
             impulse.getChannelData(1)[i] = val;
        }
        convolver.buffer = impulse;

        const reverbGain = offlineCtx.createGain();
        reverbGain.gain.value = reverb;
        const dryGain = offlineCtx.createGain();
        dryGain.gain.value = 1 - (reverb * 0.4);

        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.ratio.value = 6;

        source.connect(headroomGain);
        headroomGain.connect(bassNode);
        bassNode.connect(lofiFilter);
        lofiFilter.connect(dryGain);
        lofiFilter.connect(convolver);
        convolver.connect(reverbGain);

        dryGain.connect(compressor);
        reverbGain.connect(compressor);
        compressor.connect(offlineCtx.destination);

        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
        const url = URL.createObjectURL(wavBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `Remixed_${song.title}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

      } catch (err) {
          console.error("Export failed", err);
          alert("Export failed.");
      } finally {
          setIsExporting(false);
      }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-black select-none">
      <audio 
        ref={audioRef} 
        src={song.audioUrl} 
        loop 
        crossOrigin="anonymous" 
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)} 
      />
      {song.mashupUrl && (
          <audio ref={audioRef2} src={song.mashupUrl} loop crossOrigin="anonymous" />
      )}

      {/* --- Top Bar --- */}
      <div className="flex justify-between items-center px-4 py-4 z-10">
        <button onClick={onBack} className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white active:scale-95 transition-transform">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
             <h5 className="text-[10px] text-neon-blue font-bold tracking-[0.2em] uppercase mb-1">
                 {song.type === 'dj_mode' ? 'DJ CLUB DECK' : 'PRO STUDIO'}
             </h5>
             <span className="text-xs text-gray-400">{song.type === 'mashup' ? 'Dual Deck Sync' : 'Engine V5.0 (No Distortion)'}</span>
        </div>
        <button 
            onClick={handleExport} 
            disabled={isExporting}
            className={`p-3 rounded-full transition-all ${isExporting ? 'bg-neon-purple text-white shadow-[0_0_20px_#b026ff]' : 'bg-white/10 hover:bg-green-500/20 hover:text-green-500 text-white'}`}
        >
            {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
        </button>
      </div>

      {/* --- Main Visual --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-0 mt-2 mb-6">
         <div className="absolute w-[120%] h-[50%] bg-gradient-to-t from-neon-purple/20 via-transparent to-transparent bottom-0 pointer-events-none blur-3xl" />
         
         <div className={`relative transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
             <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full blur-[50px] opacity-40 animate-pulse-fast" />
             
             <div className="w-72 h-72 rounded-full rainbow-border flex items-center justify-center shadow-2xl relative">
                <div className="w-[98%] h-[98%] bg-[#050507] rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-60">
                         <Visualizer analyser={nodesRef.current?.analyser} isPlaying={isPlaying} />
                    </div>
                    <div className="relative z-10 w-44 h-44 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                         <div className={`w-full h-full rounded-full overflow-hidden relative ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                             <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-black" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {song.type === 'mashup' ? <Layers className="w-12 h-12 text-white/80" /> : <Disc className="w-12 h-12 text-white/80" />}
                             </div>
                         </div>
                    </div>
                </div>
             </div>
         </div>

         <div className="text-center mt-6 space-y-1 z-10 max-w-sm px-6">
            <h2 className="text-2xl font-display font-bold text-white truncate rainbow-text">{song.title}</h2>
            <p className="text-gray-400 text-sm">{song.artist}</p>
         </div>
      </div>

      {/* --- Control UI --- */}
      <div className="bg-[#12121a] rounded-t-[2.5rem] border-t border-white/10 p-6 pb-8 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
         
         {/* Scrubber */}
         <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mb-6">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer group" onClick={(e) => {
                if(audioRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    audioRef.current.currentTime = pos * duration;
                }
            }}>
                <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple relative" style={{ width: `${(currentTime/duration)*100}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
            </div>
            <span>{formatTime(duration)}</span>
         </div>

         {/* Transport Controls */}
         <div className="flex items-center justify-center gap-10 mb-8">
             <button 
                onClick={handleReset}
                className="text-gray-500 hover:text-white transition-colors flex flex-col items-center gap-1"
                title="Reset Effects"
             >
                 <RotateCcw className="w-5 h-5"/>
             </button>

            <button className="text-gray-400 hover:text-white transition-colors active:scale-95" onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 5 }}><SkipBack className="w-8 h-8" /></button>
            <button onClick={togglePlay} className="w-20 h-20 bg-gradient-to-br from-white to-gray-300 text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)]">
                {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors active:scale-95" onClick={() => { if(audioRef.current) audioRef.current.currentTime += 5 }}><SkipForward className="w-8 h-8" /></button>
            
            <div className="w-5 h-5"/> 
         </div>

         <div className="space-y-6">
             {/* 1. Quick Presets Row */}
             <div className="grid grid-cols-3 gap-3">
                 <button 
                    onClick={() => setIsLofi(!isLofi)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${isLofi ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                 >
                     <Wind className="w-5 h-5 mb-1" />
                     <span className="text-[10px] font-bold uppercase">Auto LoFi</span>
                 </button>

                 <button 
                    onClick={() => setVinylMode(!vinylMode)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${vinylMode ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                 >
                     <Disc className="w-5 h-5 mb-1" />
                     <span className="text-[10px] font-bold uppercase">{vinylMode ? 'Vinyl Mode' : 'Digital Mode'}</span>
                 </button>

                 <button 
                    onClick={() => setIs8D(!is8D)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${is8D ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                 >
                     <Move3d className="w-5 h-5 mb-1" />
                     <span className="text-[10px] font-bold uppercase">8D Audio</span>
                 </button>
             </div>

             {/* 2. Fine Tune Sliders */}
             <div className="bg-white/5 rounded-2xl p-5 space-y-6 border border-white/5">
                 
                 {/* Speed */}
                 <div className="space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                         <span className="flex items-center gap-2"><Activity className="w-3 h-3" /> BPM / Speed</span>
                         <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{Math.round(speed * 100)}%</span>
                     </div>
                     <input 
                        type="range" min="0.5" max="1.5" step="0.01" 
                        value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                     />
                 </div>

                 {/* Bass */}
                 <div className="space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                         <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Clean Bass Boost</span>
                         <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{Math.round((bass/12)*100)}%</span>
                     </div>
                     <input 
                        type="range" min="0" max="12" step="1" 
                        value={bass} onChange={(e) => setBass(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-pink"
                     />
                 </div>

                 {/* Reverb */}
                 <div className="space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                         <span className="flex items-center gap-2"><Waves className="w-3 h-3" /> Atmosphere</span>
                         <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{Math.round(reverb * 100)}%</span>
                     </div>
                     <input 
                        type="range" min="0" max="0.8" step="0.05" 
                        value={reverb} onChange={(e) => setReverb(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                     />
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// --- WAV ENCODER HELPER ---
function bufferToWave(abuffer: AudioBuffer, len: number) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  setUint32(0x46464952);                         
  setUint32(length - 8);                         
  setUint32(0x45564157);                         

  setUint32(0x20746d66);                         
  setUint32(16);                                 
  setUint16(1);                                  
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); 
  setUint16(numOfChan * 2);                      
  setUint16(16);                                 

  setUint32(0x61746164);                         
  setUint32(length - pos - 4);                   

  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {             
      sample = Math.max(-1, Math.min(1, channels[i][pos])); 
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
      view.setInt16(offset, sample, true);       
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }
}