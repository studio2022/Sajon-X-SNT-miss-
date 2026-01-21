import React, { useState } from 'react';
import { User, Song, ProcessingStats, SystemConfig } from './types';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Player } from './views/Player';
import { Admin } from './views/Admin';
import { Library } from './views/Library';
import { Wallet } from './views/Wallet';
import { LayoutDashboard, LogOut, Settings, Music2, Library as LibraryIcon, WalletCards, Home as HomeIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'player' | 'library' | 'wallet'>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [myLibrary, setMyLibrary] = useState<Song[]>([]);
  
  // Admin Config State
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

  // Stats
  const [stats] = useState<ProcessingStats>({
    totalUsers: 1243,
    activeUsers: 842,
    songsProcessed: 5432,
    serverLoad: 42,
    revenue: 15400
  });

  const [recentUploads, setRecentUploads] = useState<Song[]>([
    { id: '1', title: 'Midnight City (Slowed)', artist: 'User_88', duration: '4:20', uploadDate: '2023-10-24', status: 'ready', type: 'slowed_reverb' },
  ]);

  const handleLogin = (user: User) => {
    // Grant configured free credits
    setCurrentUser({ ...user, credits: systemConfig.freeCreditAmount });
    setCurrentView('home');
  };

  const handleAddCredits = (amount: number) => {
      if(currentUser) {
          setCurrentUser({...currentUser, credits: currentUser.credits + amount});
      }
  };

  const handleSpendCredit = () => {
      if(currentUser && currentUser.credits > 0) {
          setCurrentUser({...currentUser, credits: currentUser.credits - 1});
      }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setCurrentSong(null);
  };

  const handleDeleteSong = (id: string) => {
    setRecentUploads(prev => prev.filter(s => s.id !== id));
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setCurrentView('player');
  };

  if (!currentUser) {
    if (systemConfig.maintenanceMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white text-center p-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-neon-pink">Maintenance Mode</h1>
                    <p>The system is currently undergoing upgrades. Please check back later.</p>
                </div>
            </div>
        );
    }
    return <Login onLogin={handleLogin} />;
  }

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
                onSaveToLibrary={(s) => setMyLibrary(p => [s, ...p])} 
                userCredits={currentUser.credits}
                onSpendCredit={handleSpendCredit}
                onNavigateToWallet={() => setCurrentView('wallet')}
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
                recentUploads={recentUploads} 
                onDelete={handleDeleteSong} 
                config={systemConfig}
                onUpdateConfig={setSystemConfig}
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