import React, { useState } from 'react';
import { Upload, Sparkles, Music, Mic2, Disc, Play, Download, Zap, Headphones, Moon, Speaker, Layers, Repeat, Type, Wand2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ProcessingType, Song, PlaybackConfig } from '../types';

interface HomeProps {
  onPlay: (song: Song) => void;
  onSaveToLibrary: (song: Song) => void;
}

type StudioMode = 'remix' | 'mashup' | 'lyric';

export const Home: React.FC<HomeProps> = ({ onPlay, onSaveToLibrary }) => {
  const [mode, setMode] = useState<StudioMode>('remix');
  
  // File States
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null); // For Mashup
  
  // Lyric States
  const [targetLyric, setTargetLyric] = useState('');
  const [replacementLyric, setReplacementLyric] = useState('');

  // Processing States
  const [processingType, setProcessingType] = useState<ProcessingType>('slowed_reverb');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);

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

  const handleGenerate = () => {
    if (!file1) return;
    if (mode === 'mashup' && !file2) return;
    if (mode === 'lyric' && (!targetLyric || !replacementLyric)) return;

    setIsProcessing(true);
    setGeneratedSong(null);
    
    // Create Object URLs for playback
    const objectUrl1 = URL.createObjectURL(file1);
    let objectUrl2 = undefined;

    if (mode === 'mashup' && file2) {
        objectUrl2 = URL.createObjectURL(file2);
    }

    let finalType: ProcessingType = processingType;
    let title = file1.name.split('.')[0];
    let artist = "MelodyMix AI";

    if (mode === 'mashup' && file2) {
        finalType = 'mashup';
        title = `${title} x ${file2.name.split('.')[0]}`;
    } else if (mode === 'lyric') {
        finalType = 'lyric_swap';
        title = `${title} (AI Lyric Edit)`;
    }

    // Default configs
    let config: PlaybackConfig = {
      speed: 1.0, preservesPitch: true, bassBoost: 0, reverbMix: 0, filterType: 'none', isSurround: false
    };

    // Apply specific configs based on type
    if (finalType === 'slowed_reverb') config = { ...config, speed: 0.85, bassBoost: 8, reverbMix: 0.4, filterType: 'lowpass' };
    if (finalType === 'bed_slow') config = { ...config, speed: 0.75, bassBoost: 12, reverbMix: 0.7, filterType: 'lowpass' };
    if (finalType === '12d_audio') config = { ...config, bassBoost: 4, reverbMix: 0.2, isSurround: true };
    if (finalType === 'nightcore') config = { ...config, speed: 1.3, preservesPitch: false, bassBoost: 2 };
    if (finalType === 'mashup') config = { ...config, bassBoost: 6, speed: 1.05 }; 

    setTimeout(() => {
      setIsProcessing(false);
      
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: title,
        artist: artist,
        duration: "3:42",
        uploadDate: new Date().toISOString(),
        status: 'ready',
        type: finalType,
        audioUrl: objectUrl1,
        mashupUrl: objectUrl2, // PASS SECOND URL
        config: config,
        originalLyrics: mode === 'lyric' ? targetLyric : undefined,
        newLyrics: mode === 'lyric' ? replacementLyric : undefined
      };

      setGeneratedSong(newSong);
      onSaveToLibrary(newSong); 
    }, 2500);
  };

  const remixOptions = [
    { id: '12d_audio', label: '12D Max', icon: <Speaker className="w-5 h-5" />, color: 'cyan', desc: 'Hyper-Immersive' },
    { id: 'bed_slow', label: 'Bed Mode', icon: <Moon className="w-5 h-5" />, color: 'indigo', desc: 'Sleep & Ambient' },
    { id: 'slowed_reverb', label: 'Slowed', icon: <Music className="w-5 h-5" />, color: 'purple', desc: 'Cinematic' },
    { id: 'nightcore', label: 'Nightcore', icon: <Zap className="w-5 h-5" />, color: 'pink', desc: 'Fast & High' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Colorful Title */}
      <div className="text-center mb-6">
        <h2 className="text-4xl font-display font-bold rainbow-text pb-2">
           Magic Studio
        </h2>
        <p className="text-gray-400">Next-Gen Audio Manipulation</p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-dark-card/50 backdrop-blur-lg p-1.5 rounded-2xl border border-white/10 flex gap-2 shadow-2xl">
            <button onClick={() => setMode('remix')} className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'remix' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Music className="w-4 h-4" /> Remix
            </button>
            <button onClick={() => setMode('mashup')} className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'mashup' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Layers className="w-4 h-4" /> Mashup
            </button>
            <button onClick={() => setMode('lyric')} className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${mode === 'lyric' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}>
                <Mic2 className="w-4 h-4" /> Lyric Lab
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-7 space-y-6">
             <div className="bg-dark-card/50 backdrop-blur border border-white/5 rounded-3xl p-6">
                <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-yellow-400" />
                    {mode === 'remix' && 'Upload Track'}
                    {mode === 'mashup' && 'Fusion Engine (2 Tracks)'}
                    {mode === 'lyric' && 'Voice Cloning & Text Edit'}
                </h2>

                {/* Upload Slot 1 */}
                <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 group ${file1 ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 hover:border-gray-500 bg-black/20'}`}>
                    <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, 1)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center relative z-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                            {file1 ? <Music className="w-8 h-8 text-green-400" /> : <Upload className="w-8 h-8 text-gray-400" />}
                        </div>
                        <p className="font-bold text-white text-lg">{file1 ? file1.name : (mode === 'mashup' ? 'Track 1 (Beat)' : 'Drop Your Song')}</p>
                        {!file1 && <p className="text-sm text-gray-500 mt-2">MP3, WAV, FLAC</p>}
                    </div>
                </div>

                {/* Mashup Upload Slot 2 */}
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
                                <p className="font-bold text-white text-lg">{file2 ? file2.name : 'Track 2 (Vocals)'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lyric Inputs */}
                {mode === 'lyric' && (
                    <div className="mt-4 bg-black/20 border border-white/5 rounded-2xl p-6 space-y-4 animate-fade-in-up">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                            <Type className="w-5 h-5" />
                            <span className="font-bold">Text-to-Voice Replacement</span>
                        </div>
                        <Input 
                            label="Original Line to Change"
                            placeholder="e.g., 'The stars are shining bright'"
                            value={targetLyric}
                            onChange={(e) => setTargetLyric(e.target.value)}
                        />
                        <div className="flex justify-center text-gray-600">
                             ↓
                        </div>
                        <Input 
                            label="New Lyrics (AI Voice)"
                            placeholder="e.g., 'The rainbow lights are glowing'"
                            value={replacementLyric}
                            onChange={(e) => setReplacementLyric(e.target.value)}
                            className="border-yellow-500/30 focus:border-yellow-500 focus:ring-yellow-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">* The AI will simulate the voice to perform the new text.</p>
                    </div>
                )}
             </div>
          </div>

          {/* Right Panel: Controls & Action */}
          <div className="lg:col-span-5 space-y-6">
             {mode === 'remix' && (
                 <div className="bg-dark-card/50 backdrop-blur border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Select Style</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {remixOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setProcessingType(opt.id as ProcessingType)}
                                className={`p-4 rounded-xl border text-left transition-all ${processingType === opt.id ? `bg-${opt.color}-500/10 border-${opt.color}-500 text-white ring-1 ring-${opt.color}-500` : 'border-gray-800 text-gray-500 hover:bg-white/5'}`}
                            >
                                <div className={`text-${opt.color}-500 mb-2`}>{opt.icon}</div>
                                <div className="font-bold text-sm">{opt.label}</div>
                                <div className="text-[10px] opacity-60">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                 </div>
             )}

             <div className="pt-4">
                <Button 
                    onClick={handleGenerate}
                    disabled={isProcessing || !file1 || (mode === 'mashup' && !file2) || (mode === 'lyric' && !targetLyric)}
                    isLoading={isProcessing}
                    fullWidth
                    className={`h-16 text-lg font-bold tracking-wide shadow-xl ${isProcessing ? 'opacity-70' : 'bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 border-none'}`}
                >
                    {isProcessing ? 'Processing Audio...' : mode === 'mashup' ? 'Mix Tracks' : mode === 'lyric' ? 'Synthesize Voice' : 'Generate Remix'} <Sparkles className="w-5 h-5 ml-2 fill-white" />
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
                                <Download className="w-4 h-4 mr-2" /> Save to Gallery
                            </Button>
                        </div>
                    </div>
                </div>
             )}
          </div>
      </div>
    </div>
  );
};