export interface User {
  email: string;
  role: 'admin' | 'user';
  credits: number;
  isBanned?: boolean;
}

export type ProcessingType = 'slowed_reverb' | 'lofi' | 'nightcore' | '8d_audio' | '12d_audio' | 'bed_slow' | 'mashup' | 'lyric_swap';

export interface PlaybackConfig {
  // Basic
  speed: number;
  preservesPitch: boolean;
  volume: number;
  
  // EQ & Dynamics
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  gainBoost: number;
  
  // Spatial
  isSurround: boolean; // 8D/12D
  surroundSpeed: number;
  stereoWidth: number;
  
  // Effects
  reverbMix: number;
  reverbDecay: number;
  filterType: 'lowpass' | 'highpass' | 'none';
  filterFreq: number;
  
  // Ambience
  vinylNoise: number;
  rainInterference: number;
  lofiBitrate: boolean;

  // Edit Tools
  isReverse: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
  trimStart: number;
  trimEnd: number;
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
  mashupUrl?: string; 
  config?: Partial<PlaybackConfig>; // Use Partial to allow flexible defaults
  originalLyrics?: string;
  newLyrics?: string;
}

export interface ProcessingStats {
  totalUsers: number;
  activeUsers: number;
  songsProcessed: number;
  serverLoad: number;
  revenue: number;
}

export interface SystemConfig {
  // Payments
  bkashNumber: string;
  nagadNumber: string;
  upayNumber: string;
  creditPrice: number;
  autoApprovePayments: boolean;
  
  // System Controls
  maintenanceMode: boolean;
  broadcastMessage: string;
  freeCreditAmount: number;
  maxUploadSizeMB: number;
  serverRegion: 'asia' | 'usa' | 'eu';
  showAds: boolean;
}