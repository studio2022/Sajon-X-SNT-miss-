import React, { useState } from 'react';
import { User, Song, ProcessingStats } from './types';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Player } from './views/Player';
import { Admin } from './views/Admin';
import { Library } from './views/Library';
import { LayoutDashboard, LogOut, Settings, Music2, Library as LibraryIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'player' | 'library'>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  
  // Playlist State (Library)
  const [myLibrary, setMyLibrary] = useState<Song[]>([]);

  // Mock Admin Data
  const [stats] = useState<ProcessingStats>({
    totalUsers: 1243,
    songsProcessed: 5432,
    serverLoad: 42
  });

  const [recentUploads, setRecentUploads] = useState<Song[]>([
    { id: '1', title: 'Midnight City (Slowed)', artist: 'User_88', duration: '4:20', uploadDate: '2023-10-24', status: 'ready', type: 'slowed_reverb' },
  ]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('home');
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

  const handleSaveToLibrary = (song: Song) => {
      setMyLibrary(prev => [song, ...prev]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const NavButton = ({ view, icon: Icon, label }: { view: 'home' | 'admin' | 'library', icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`
        w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 font-medium
        ${currentView === view 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 scale-105' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 hover:pl-6'
        }
      `}
    >
      <Icon className={`w-5 h-5 ${currentView === view ? 'text-white' : ''}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-gray-800 bg-dark-card flex flex-col fixed h-full z-50">
        <div className="p-8 pb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">MelodyMix</span>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-6">
          <div className="px-5 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Menu</div>
          
          <NavButton view="home" icon={Music2} label="Magic Studio" />
          <NavButton view="library" icon={LibraryIcon} label="My Library" />
          
          {currentUser.role === 'admin' && (
             <NavButton view="admin" icon={LayoutDashboard} label="Admin Dashboard" />
          )}
        </nav>

        <div className="p-6 border-t border-gray-800 bg-black/20">
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold border border-gray-600">
               {currentUser.email[0].toUpperCase()}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Creator</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 min-h-screen relative overflow-hidden">
        {/* Ambient Background Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed" />
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
           <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
             <span className="text-gray-600">App</span>
             <span className="text-gray-600">/</span>
             <span className="text-white capitalize font-bold">{currentView.replace('home', 'Studio')}</span>
           </div>
           <button className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
             <Settings className="w-5 h-5" />
           </button>
        </header>

        <div className="p-10 pb-32 relative z-0 max-w-7xl mx-auto">
          {currentView === 'home' && (
            <div className="animate-fade-in-up">
              <Home onPlay={handlePlaySong} onSaveToLibrary={handleSaveToLibrary} />
            </div>
          )}
          
          {currentView === 'library' && (
             <div className="animate-fade-in-up">
                 <Library songs={myLibrary} onPlay={handlePlaySong} />
             </div>
          )}
          
          {currentView === 'admin' && currentUser.role === 'admin' && (
            <div className="animate-fade-in-up">
              <Admin 
                stats={stats} 
                recentUploads={recentUploads} 
                onDelete={handleDeleteSong} 
              />
            </div>
          )}
          
          {currentView === 'player' && currentSong && (
             <div className="animate-fade-in">
               <Player song={currentSong} onBack={() => setCurrentView('home')} />
             </div>
          )}
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;