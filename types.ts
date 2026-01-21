export interface User {
  email: string;
  role: 'admin' | 'user';
}

export type ProcessingType = 'slowed_reverb' | 'lofi' | 'nightcore' | '8d_audio' | '12d_audio' | 'bed_slow' | 'mashup' | 'lyric_swap';

export interface PlaybackConfig {
  speed: number;
  preservesPitch: boolean;
  bassBoost: number; // dB
  reverbMix: number; // 0 to 1 (wetness)
  filterType?: 'lowpass' | 'highpass' | 'none';
  filterFreq?: number; // Hz
  isSurround?: boolean; // Covers 8D and 12D logic
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  uploadDate: string;
  status: 'processing' | 'ready';
  type: ProcessingType;
  audioUrl?: string; 
  mashupUrl?: string; // New: Second track for Mashups
  config?: PlaybackConfig;
  // New fields for lyric swapping
  originalLyrics?: string;
  newLyrics?: string;
}

export interface ProcessingStats {
  totalUsers: number;
  songsProcessed: number;
  serverLoad: number;
}