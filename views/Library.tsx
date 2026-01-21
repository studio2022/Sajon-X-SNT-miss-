import React from 'react';
import { Play, Download, Clock, Music, Mic2, Layers } from 'lucide-react';
import { Song } from '../types';

interface LibraryProps {
  songs: Song[];
  onPlay: (song: Song) => void;
}

export const Library: React.FC<LibraryProps> = ({ songs, onPlay }) => {
  if (songs.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 bg-dark-card rounded-full flex items-center justify-center border border-gray-800">
                <Music className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white">Your library is empty</h3>
            <p className="text-gray-400 max-w-sm">
                Create a Remix, Mashup, or Edit Lyrics in the Studio to see your songs here.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
            <h2 className="text-3xl font-display font-bold text-white">My Library</h2>
            <p className="text-gray-400">All your generated masterpieces.</p>
        </div>
        <div className="text-sm text-gray-500 font-mono">
            {songs.length} Tracks
        </div>
      </div>

      <div className="grid gap-4">
        {songs.map((song) => (
            <div key={song.id} className="bg-dark-card border border-gray-800 hover:border-gray-600 rounded-xl p-4 flex items-center gap-4 group transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {song.type === 'mashup' ? <Layers className="w-6 h-6 text-neon-blue" /> : 
                     song.type === 'lyric_swap' ? <Mic2 className="w-6 h-6 text-neon-pink" /> :
                     <Music className="w-6 h-6 text-neon-purple" />}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate text-lg">{song.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="uppercase tracking-wider border border-gray-700 px-1.5 rounded bg-gray-900">
                            {song.type.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(song.uploadDate).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onPlay(song)}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <button className="p-3 bg-dark-surface text-white border border-gray-700 rounded-full hover:bg-white/10 transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};