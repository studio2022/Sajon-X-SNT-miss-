export interface User {
  email: string;
  role: 'admin' | 'user';
  credits: number;
  isBanned?: boolean;
}

export type ProcessingType = 'slowed_reverb' | 'lofi' | 'nightcore' | '8d_audio' | 'mashup' | 'lyric_swap' | 'dj_mode';

export interface PlaybackConfig {
  // Core Audio Params
  speed: number;
  pitch: number;
  bassBoost: number;
  reverbMix: number;
  is8D: boolean;
  
  // High Quality Presets
  isLofi: boolean;     // Triggers Bitcrusher + Lowpass
  isHighQuality: boolean; // Enables Oversampling
  
  // Internal
  mashupBalance: number; 
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
  config?: Partial<PlaybackConfig>;
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
  bkashNumber: string;
  nagadNumber: string;
  upayNumber: string;
  creditPrice: number;
  autoApprovePayments: boolean;
  maintenanceMode: boolean;
  broadcastMessage: string;
  freeCreditAmount: number;
  maxUploadSizeMB: number;
  serverRegion: 'asia' | 'usa' | 'eu';
  showAds: boolean;
}