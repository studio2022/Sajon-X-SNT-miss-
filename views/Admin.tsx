import React, { useState, useEffect } from 'react';
import { Users, Music4, Server, Trash2, TrendingUp, CreditCard, Save, Lock, Megaphone, UserX, Gift, Settings, Globe, Shield, RefreshCw } from 'lucide-react';
import { ProcessingStats, Song, SystemConfig } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface AdminProps {
  stats: ProcessingStats;
  recentUploads: Song[];
  onDelete: (id: string) => void;
  config: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
}

export const Admin: React.FC<AdminProps> = ({ stats, recentUploads, onDelete, config, onUpdateConfig }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
      setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    setIsSaving(true);
    // Instant Update via Prop Callback
    onUpdateConfig(localConfig);
    setTimeout(() => {
        setIsSaving(false);
    }, 500);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Admin Control</h2>
          <p className="text-gray-400">Master Panel (Simulated Real-time)</p>
        </div>
        <div className="flex bg-dark-card p-1 rounded-xl border border-gray-800">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={<Users className="text-neon-blue" />} label="Total Users" value={stats.totalUsers || '0'} />
                <StatCard icon={<TrendingUp className="text-green-500" />} label="Active Now" value={stats.activeUsers || '0'} />
                <StatCard icon={<Music4 className="text-neon-purple" />} label="Songs Created" value={stats.songsProcessed || recentUploads.length} />
                <StatCard icon={<CreditCard className="text-yellow-500" />} label="Revenue (BDT)" value={stats.revenue || 0} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-neon-pink"/> Broadcast Message</h3>
                    <div className="space-y-3">
                        <textarea 
                            className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-neon-pink outline-none" 
                            rows={3} 
                            placeholder="Send notification to all active users..."
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                        />
                        <Button fullWidth variant="secondary" onClick={() => {alert(`Sent: ${broadcastMsg}`); setBroadcastMsg('')}}>Send Broadcast</Button>
                    </div>
                </div>

                <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-red-500"/> Emergency Controls</h3>
                    <div className="space-y-3">
                        <ToggleRow 
                            label="Maintenance Mode" 
                            desc="Lock app for all users immediately"
                            active={localConfig.maintenanceMode} 
                            onToggle={() => {
                                const newVal = !localConfig.maintenanceMode;
                                const newConfig = {...localConfig, maintenanceMode: newVal};
                                setLocalConfig(newConfig);
                                onUpdateConfig(newConfig);
                            }} 
                        />
                        <ToggleRow 
                            label="Auto-Approve Payments" 
                            desc="Skip manual check"
                            active={localConfig.autoApprovePayments} 
                            onToggle={() => {
                                const newVal = !localConfig.autoApprovePayments;
                                const newConfig = {...localConfig, autoApprovePayments: newVal};
                                setLocalConfig(newConfig);
                                onUpdateConfig(newConfig);
                            }} 
                        />
                    </div>
                </div>

                 <div className="bg-dark-card border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <Server className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-white font-bold">System Health</h3>
                    <p className="text-green-400 font-mono mt-1">Status: Operational</p>
                    <p className="text-gray-500 text-xs mt-2">Server Load: {stats.serverLoad || 24}%</p>
                    <button className="mt-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Restart Server</button>
                </div>
            </div>
          </>
      )}

      {activeTab === 'settings' && (
          <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                 <h3 className="text-xl font-bold text-white">Global Configuration</h3>
                 <Button onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4"/>}>Save & Apply Instantly</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Payment & Credits</h4>
                      <Input label="Bkash Number" value={localConfig.bkashNumber} onChange={(e) => setLocalConfig({...localConfig, bkashNumber: e.target.value})} />
                      <Input label="Nagad Number" value={localConfig.nagadNumber} onChange={(e) => setLocalConfig({...localConfig, nagadNumber: e.target.value})} />
                      <Input label="Upay Number" value={localConfig.upayNumber} onChange={(e) => setLocalConfig({...localConfig, upayNumber: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="Credit Price (10 Cr)" type="number" value={localConfig.creditPrice} onChange={(e) => setLocalConfig({...localConfig, creditPrice: parseInt(e.target.value)})} />
                          <Input label="Free Gift (New User)" type="number" value={localConfig.freeCreditAmount} onChange={(e) => setLocalConfig({...localConfig, freeCreditAmount: parseInt(e.target.value)})} />
                      </div>
                  </div>

                  <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">App Limits & Region</h4>
                      <div className="bg-black/20 p-4 rounded-xl space-y-4 border border-gray-800">
                          <div>
                              <label className="text-sm text-gray-400 block mb-2">Server Region</label>
                              <select 
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white"
                                value={localConfig.serverRegion}
                                onChange={(e) => setLocalConfig({...localConfig, serverRegion: e.target.value as any})}
                              >
                                  <option value="asia">Asia (Singapore)</option>
                                  <option value="usa">USA (Virginia)</option>
                                  <option value="eu">Europe (Frankfurt)</option>
                              </select>
                          </div>
                          <Input label="Max Upload Size (MB)" type="number" value={localConfig.maxUploadSizeMB} onChange={(e) => setLocalConfig({...localConfig, maxUploadSizeMB: parseInt(e.target.value)})} />
                      </div>

                      <div className="space-y-3 pt-4">
                           <ToggleRow 
                                label="Show Ads Banner" 
                                desc="Enable monetization ads"
                                active={localConfig.showAds} 
                                onToggle={() => setLocalConfig({...localConfig, showAds: !localConfig.showAds})} 
                            />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-dark-card border border-gray-800 rounded-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Recent Tracks & Users</h3>
            <div className="flex gap-2">
                 <input placeholder="Search user..." className="bg-black/20 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white" />
            </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                <tr>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                {recentUploads.map((song) => (
                    <tr key={song.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-medium text-white">{song.title}</div>
                        <span className="text-xs bg-gray-800 px-1 rounded text-gray-400">{song.type}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{song.artist}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(song.uploadDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button title="Ban User" className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"><UserX className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(song.id)} className="p-2 bg-gray-700/50 text-gray-400 rounded hover:bg-gray-700 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
    <div className="bg-dark-card border border-gray-800 p-4 rounded-2xl relative overflow-hidden flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase">{label}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
    </div>
);

const ToggleRow = ({ label, desc, active, onToggle }: any) => (
    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-gray-800">
        <div>
            <div className="text-sm font-bold text-white">{label}</div>
            <div className="text-xs text-gray-500">{desc}</div>
        </div>
        <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? 'bg-green-500' : 'bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);