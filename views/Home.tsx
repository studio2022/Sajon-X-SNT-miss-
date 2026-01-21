import React, { useState } from 'react';
import { Upload, Sparkles, Music, Mic2, Disc, Play, Download, Layers, Type, Wand2, Coins, Moon, Zap, Wind, Move3d, Speaker, Radio, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { ProcessingType, Song, PlaybackConfig } from '../types';

interface HomeProps {
  onPlay: (song: Song) => void;
  onSaveToLibrary: (song: Song) => void;
  userCredits: number;
  onSpendCredit: () => void;
  onNavigateToWallet: () => void;
  currentUserEmail: string;
}

type StudioMode = 'remix' | 'mashup' | 'lyric' | 'dj';

export const Home: React.FC<HomeProps> = ({ onPlay, onSaveToLibrary, userCredits, onSpendCredit, onNavigateToWallet, currentUserEmail }) => {
  const [mode, setMode] = useState<StudioMode>('remix');
  
  // File States
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null); 
  
  const [targetLyric, setTargetLyric] = useState('');
  const [replacementLyric, setReplacementLyric] = useState('');

  const [processingType, setProcessingType] = useState<ProcessingType>('slowed_reverb');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
  
  // Local "Recent Mixes" state just for this session demo
  const [recentMixes, setRecentMixes] = useState<Song[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    if (e.target.files && e.target.files[0]) {
      if (slot === 1) setFile1(e.target.files[0]);
      if (slot === 2) setFile2(e.target.files[0]);
      setGeneratedSong(null);
    }
  };

  const handleDownload = () => {
      if (!generatedSong || !generatedSong.audioUrl) return;
      const link = document.createElement('a');
      link.href = generatedSong.audioUrl;
      link.download = `${generatedSong.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (userCredits <= 0) {
        onNavigateToWallet();
        return;
    }

    if (!file1) return;
    if (mode === 'mashup' && !file2) return;

    setIsProcessing(true);
    setGeneratedSong(null);
    
    // Spend Credit
    onSpendCredit(); 

    // Simulate Processing Time
    setTimeout(() => {
        // Use Browser Blob URLs instead of Firebase Storage
        const url1 = URL.createObjectURL(file1);
        let url2 = undefined;
        if (mode === 'mashup' && file2) {
            url2 = URL.createObjectURL(file2);
        }

        let finalType: ProcessingType = processingType;
        let title = file1.name.split('.')[0];
        let artist = currentUserEmail?.split('@')[0] || "Unknown Artist";

        if (mode === 'mashup' && file2) {
            finalType = 'mashup';
            title = `${title} x ${file2.name.split('.')[0]}`;
        } else if (mode === 'lyric') {
            finalType = 'lyric_swap';
            title = `${title} (Lyric Edit)`;
        } else if (mode === 'dj') {
            finalType = 'dj_mode';
            title = `DJ ${title} (Club Mix)`;
        }

        // --- Configuration Logic ---
        let config: Partial<PlaybackConfig> = {
          speed: 1.0, pitch: 0, bassBoost: 0, reverbMix: 0, is8D: false, mashupBalance: 0.5,
          isLofi: false, isHighQuality: true
        };

        if (finalType === 'slowed_reverb') {
            config = { ...config, speed: 0.85, bassBoost: 8, reverbMix: 0.4 };
            title += " (Slowed+Reverb)";
        }
        if (finalType === 'lofi') {
            config = { ...config, isLofi: true, speed: 0.95, bassBoost: 4 };
            title += " (Lofi Vibe)";
        }
        if (finalType === '8d_audio') {
            config = { ...config, is8D: true, reverbMix: 0.2 };
            title += " (8D Audio)";
        }
        if (finalType === 'nightcore') {
            config = { ...config, speed: 1.25, pitch: 2, bassBoost: 4 };
            title += " (Nightcore)";
        }
        if (finalType === 'mashup') {
            config = { ...config, speed: 1.05, mashupBalance: 0.5 }; 
        }
        if (finalType === 'dj_mode') {
            // Updated default to prevent distortion
            config = { ...config, speed: 1.15, bassBoost: 6, pitch: 1 };
        }

        const newSong: Song = {
            id: Date.now().toString(),
            title: title,
            artist: artist,
            duration: "3:42", 
            uploadDate: new Date().toISOString(),
            status: 'ready',
            type: finalType,
            audioUrl: url1,
            mashupUrl: url2, 
            config: config,
            originalLyrics: mode === 'lyric' ? targetLyric : undefined,
            newLyrics: mode === 'lyric' ? replacementLyric : undefined,
            // @ts-ignore
            createdBy: currentUserEmail
        };

        // Save locally
        onSaveToLibrary(newSong);
        setRecentMixes(prev => [newSong, ...prev]);

        // Update Local State for UI feedback
        setGeneratedSong(newSong);
        setIsProcessing(false);

    }, 3000); 
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 mb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-dark-card/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
            <h2 className="text-xl font-display font-bold rainbow-text">Magic Studio</h2>
            <p className="text-xs text-gray-400">Create & Remix</p>
        </div>
        <button onClick={onNavigateToWallet} className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2 rounded-xl text-black font-bold text-sm hover:scale-105 transition-transform">
            <Coins className="w-4 h-4 fill-black/20" />
            {userCredits} Credits
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="bg-dark-card/50 backdrop-blur-lg p-1.5 rounded-2xl border border-white/10 flex gap-2 shadow-2xl min-w-max">
            <button onClick={() => setMode('remix')} className={`px-4 lg:px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'remix' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Music className="w-4 h-4" /> Remix
            </button>
            <button onClick={() => setMode('dj')} className={`px-4 lg:px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'dj' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Speaker className="w-4 h-4" /> DJ Mode
            </button>
            <button onClick={() => setMode('mashup')} className={`px-4 lg:px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'mashup' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Layers className="w-4 h-4" /> Mashup
            </button>
            <button onClick={() => setMode('lyric')} className={`px-4 lg:px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'lyric' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Mic2 className="w-4 h-4" /> Lyric Lab
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-7 space-y-6">
             <div className="bg-dark-card/50 backdrop-blur border border-white/5 rounded-3xl p-6">
                <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-yellow-400" />
                    {mode === 'remix' && 'Upload Track'}
                    {mode === 'dj' && 'DJ Booth (Bass & Speed)'}
                    {mode === 'mashup' && 'Fusion Engine (Beat + Vocals)'}
                    {mode === 'lyric' && 'Voice Cloning & Text Edit'}
                </h2>

                <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 group ${file1 ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 hover:border-gray-500 bg-black/20'}`}>
                    <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 1)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center relative z-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                            {file1 ? <Music className="w-8 h-8 text-green-400" /> : <Upload className="w-8 h-8 text-gray-400" />}
                        </div>
                        <p className="font-bold text-white text-lg">{file1 ? file1.name : (mode === 'mashup' ? 'Track 1 (Beat/Instrumental)' : 'Drop Your Song')}</p>
                    </div>
                </div>

                {mode === 'mashup' && (
                    <div className="mt-4 relative animate-fade-in-up">
                         <div className="flex items-center justify-center py-2">
                             <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold relative z-10 shadow-lg shadow-pink-500/20">+</div>
                         </div>
                        <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 group ${file2 ? 'border-pink-500/50 bg-pink-500/5' : 'border-gray-700 hover:border-gray-500 bg-black/20'}`}>
                            <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 2)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center relative z-0">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                    {file2 ? <Music className="w-8 h-8 text-pink-400" /> : <Upload className="w-8 h-8 text-gray-400" />}
                                </div>
                                <p className="font-bold text-white text-lg">{file2 ? file2.name : 'Track 2 (Vocals/Acapella)'}</p>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
             {mode === 'remix' && (
                 <div className="bg-dark-card/50 backdrop-blur border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Select AI Preset</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setProcessingType('slowed_reverb')} className={`p-4 rounded-xl border text-left transition-all ${processingType === 'slowed_reverb' ? 'bg-purple-500/10 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-gray-800 text-gray-500 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2 mb-2"><Moon className="w-5 h-5 text-purple-400"/></div>
                            <div className="font-bold text-sm">Slowed + Reverb</div>
                        </button>
                        <button onClick={() => setProcessingType('lofi')} className={`p-4 rounded-xl border text-left transition-all ${processingType === 'lofi' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-gray-800 text-gray-500 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2 mb-2"><Wind className="w-5 h-5 text-indigo-400"/></div>
                            <div className="font-bold text-sm">Chill Lo-Fi</div>
                        </button>
                        <button onClick={() => setProcessingType('nightcore')} className={`p-4 rounded-xl border text-left transition-all ${processingType === 'nightcore' ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'border-gray-800 text-gray-500 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5 text-pink-400"/></div>
                            <div className="font-bold text-sm">Nightcore</div>
                        </button>
                        <button onClick={() => setProcessingType('8d_audio')} className={`p-4 rounded-xl border text-left transition-all ${processingType === '8d_audio' ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-gray-800 text-gray-500 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2 mb-2"><Move3d className="w-5 h-5 text-cyan-400"/></div>
                            <div className="font-bold text-sm">8D Audio</div>
                        </button>
                    </div>
                 </div>
             )}

             <div className="pt-4 space-y-2">
                <Button 
                    onClick={handleGenerate}
                    disabled={isProcessing || !file1 || (mode === 'mashup' && !file2) || (mode === 'lyric' && !targetLyric)}
                    isLoading={isProcessing}
                    fullWidth
                    className={`h-16 text-lg font-bold tracking-wide shadow-xl ${isProcessing ? 'opacity-70' : 'bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 border-none'}`}
                >
                    {isProcessing ? 'Processing (Uploading)...' : userCredits > 0 ? `Generate (1 Credit)` : 'Buy Credits to Generate'} <Sparkles className="w-5 h-5 ml-2 fill-white" />
                </Button>
             </div>

             {/* Result Card */}
             {generatedSong && (
                <div className="rainbow-border rounded-3xl p-1 animate-fade-in-up">
                    <div className="bg-dark-card rounded-[22px] p-6 relative overflow-hidden h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                {generatedSong.type === 'mashup' ? <Layers className="w-8 h-8 text-white" /> : <Disc className="w-8 h-8 text-white animate-spin-slow" />}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white truncate w-48 text-lg">{generatedSong.title}</h4>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-gray-300 mt-1">
                                    {generatedSong.type.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => onPlay(generatedSong)} className="flex-1 py-3 text-sm bg-white text-black hover:bg-gray-200 border-none">
                                <Play className="w-4 h-4 mr-2 fill-current" /> Play
                            </Button>
                            <Button onClick={handleDownload} variant="secondary" className="flex-1 py-3 text-sm hover:text-green-400 hover:border-green-400">
                                <Download className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </div>
                    </div>
                </div>
             )}
          </div>
      </div>

      {/* RECENT CREATIONS GRID (Ram Seke) */}
      {recentMixes.length > 0 && (
          <div className="mt-12 animate-fade-in-up">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-neon-pink" /> Recent Creations (Quick Access)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentMixes.map((song) => (
                      <div key={song.id} className="bg-dark-card border border-gray-800 hover:border-gray-600 rounded-xl p-3 flex items-center gap-3 group transition-all cursor-pointer" onClick={() => onPlay(song)}>
                           <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                               {song.type === 'mashup' ? <Layers className="w-6 h-6 text-neon-blue" /> : <Music className="w-6 h-6 text-neon-purple" />}
                           </div>
                           <div className="min-w-0 flex-1">
                               <h4 className="font-bold text-white truncate text-sm">{song.title}</h4>
                               <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span className="uppercase bg-white/5 px-1 rounded">{song.type}</span>
                                    <span><Clock className="w-3 h-3 inline"/> Just now</span>
                               </div>
                           </div>
                           <button className="p-2 bg-white/10 rounded-full group-hover:bg-neon-purple group-hover:text-white transition-colors">
                               <Play className="w-4 h-4 fill-current"/>
                           </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};