import React, { useState, useEffect } from 'react';
import { User, Song, ProcessingStats, SystemConfig } from './types';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Player } from './views/Player';
import { Admin } from './views/Admin';
import { Library } from './views/Library';
import { Wallet } from './views/Wallet';
import { LayoutDashboard, LogOut, Settings, Music2, Library as LibraryIcon, WalletCards, Home as HomeIcon, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'player' | 'library' | 'wallet'>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // --- REAL-TIME DATA SIMULATION (Central State) ---
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  
  // Admin Config State (Shared between Admin and User views)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
      bkashNumber: '01700000000',
      nagadNumber: '01800000000',
      upayNumber: '01900000000',
      creditPrice: 50,
      autoApprovePayments: false,
      maintenanceMode: false,
      broadcastMessage: '',
      freeCreditAmount: 10,
      maxUploadSizeMB: 50,
      serverRegion: 'asia',
      showAds: true
  });

  const [stats, setStats] = useState<ProcessingStats>({
    totalUsers: 142,
    activeUsers: 12,
    songsProcessed: 0,
    serverLoad: 24,
    revenue: 12500
  });

  // Mock initial load
  useEffect(() => {
      setTimeout(() => setIsLoadingAuth(false), 1000);
  }, []);

  // --- Handlers ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
  };

  const handleSpendCredit = () => {
      if(currentUser && currentUser.credits > 0) {
          const newCredits = currentUser.credits - 1;
          setCurrentUser({ ...currentUser, credits: newCredits });
          // In a real app, we'd update 'stats.revenue' here too
      }
  };

  const handleAddCredits = (amount: number) => {
      if(currentUser) {
         setCurrentUser({ ...currentUser, credits: currentUser.credits + amount });
         setStats({ ...stats, revenue: stats.revenue + (amount * 5) }); // Mock revenue update
      }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setCurrentSong(null);
  };

  const handleSaveSong = (song: Song) => {
      setAllSongs(prev => [song, ...prev]);
      setStats(prev => ({ ...prev, songsProcessed: prev.songsProcessed + 1 }));
  };

  const handleDeleteSong = (id: string) => {
     setAllSongs(prev => prev.filter(s => s.id !== id));
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setCurrentView('player');
  };

  // This is the key for "Admin changes reflect immediately"
  const handleUpdateConfig = (newConfig: SystemConfig) => {
      setSystemConfig(newConfig);
  };

  // --- Loading Screen ---
  if (isLoadingAuth) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-neon-purple animate-spin" />
          </div>
      );
  }

  // --- Login Screen ---
  if (!currentUser) {
    if (systemConfig.maintenanceMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
                <div className="relative z-10 border border-red-500/30 p-10 rounded-2xl bg-dark-card shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                    <h1 className="text-5xl font-display font-bold mb-4 text-red-500">SYSTEM LOCKED</h1>
                    <p className="text-xl text-gray-300">Maintenance Mode Active</p>
                    <p className="text-gray-500 mt-4 text-sm font-mono">CODE: {systemConfig.broadcastMessage || 'UPGRADING_CORE'}</p>
                </div>
            </div>
        );
    }
    return <Login onLogin={handleLogin} />;
  }

  // Filter My Library locally
  const myLibrary = allSongs.filter(s => 
      // @ts-ignore
      s.createdBy === currentUser.email
  );

  const BottomNavItem = ({ view, icon: Icon, label }: { view: 'home' | 'library' | 'wallet' | 'admin', icon: any, label: string }) => (
    <button 
        onClick={() => setCurrentView(view)}
        className={`flex flex-col items-center justify-center p-2 transition-all ${currentView === view ? 'text-white' : 'text-gray-500'}`}
    >
        <div className={`p-1.5 rounded-xl mb-1 ${currentView === view ? 'bg-white/10' : ''}`}>
            <Icon className={`w-6 h-6 ${currentView === view ? 'fill-current' : ''}`} />
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex flex-col">
      {/* Top Header */}
      {currentView !== 'player' && (
        <header className="h-16 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-40 bg-dark-bg/80 border-b border-white/5">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
             </div>
             <span className="font-display font-bold text-lg text-white tracking-tight">MelodyMix</span>
           </div>
           
           <div className="flex items-center gap-3">
             <div className="text-xs text-right hidden sm:block">
                <div className="text-white font-bold">{currentUser.email.split('@')[0]}</div>
                <div className="text-yellow-500 font-bold">{currentUser.credits} CR</div>
             </div>
             <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
                <LogOut className="w-5 h-5" />
             </button>
           </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden pb-24">
        {/* Ambient Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed" />
        
        <div className="p-4 md:p-8 max-w-4xl mx-auto relative z-10">
          {currentView === 'home' && (
            <div className="animate-fade-in-up">
              <Home 
                onPlay={handlePlaySong} 
                onSaveToLibrary={handleSaveSong} 
                userCredits={currentUser.credits}
                onSpendCredit={handleSpendCredit}
                onNavigateToWallet={() => setCurrentView('wallet')}
                currentUserEmail={currentUser.email}
              />
            </div>
          )}
          
          {currentView === 'library' && (
             <div className="animate-fade-in-up">
                 <Library songs={myLibrary} onPlay={handlePlaySong} />
             </div>
          )}

          {currentView === 'wallet' && (
             <div className="animate-fade-in-up">
                 <Wallet config={systemConfig} onAddCredits={handleAddCredits} />
             </div>
          )}
          
          {currentView === 'admin' && currentUser.role === 'admin' && (
            <div className="animate-fade-in-up">
              <Admin 
                stats={stats} 
                recentUploads={allSongs} 
                onDelete={handleDeleteSong} 
                config={systemConfig}
                onUpdateConfig={handleUpdateConfig}
              />
            </div>
          )}
          
          {currentView === 'player' && currentSong && (
             <div className="fixed inset-0 z-50 bg-dark-bg animate-fade-in">
               <Player song={currentSong} onBack={() => setCurrentView('home')} />
             </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      {currentView !== 'player' && (
          <nav className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe z-40">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                <BottomNavItem view="home" icon={HomeIcon} label="Studio" />
                <BottomNavItem view="library" icon={LibraryIcon} label="Library" />
                <BottomNavItem view="wallet" icon={WalletCards} label="Wallet" />
                {currentUser.role === 'admin' && (
                    <BottomNavItem view="admin" icon={LayoutDashboard} label="Admin" />
                )}
            </div>
          </nav>
      )}
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default App;