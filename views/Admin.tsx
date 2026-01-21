import React from 'react';
import { Users, Music4, Server, Trash2, TrendingUp } from 'lucide-react';
import { ProcessingStats, Song } from '../types';

interface AdminProps {
  stats: ProcessingStats;
  recentUploads: Song[];
  onDelete: (id: string) => void;
}

export const Admin: React.FC<AdminProps> = ({ stats, recentUploads, onDelete }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Admin Dashboard</h2>
          <p className="text-gray-400">System overview and content moderation</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          System Online
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-neon-blue" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Users</p>
            <h3 className="text-4xl font-display font-bold text-white mt-2">{stats.totalUsers.toLocaleString()}</h3>
            <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this week
            </p>
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Music4 className="w-24 h-24 text-neon-purple" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Songs Processed</p>
            <h3 className="text-4xl font-display font-bold text-white mt-2">{stats.songsProcessed.toLocaleString()}</h3>
            <p className="text-neon-purple text-sm mt-2">
              86.5 TB Data Generated
            </p>
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="w-24 h-24 text-neon-pink" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Server Load</p>
            <h3 className="text-4xl font-display font-bold text-white mt-2">{stats.serverLoad}%</h3>
            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-neon-pink" style={{ width: `${stats.serverLoad}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Recent Uploads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Track Info</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentUploads.map((song) => (
                <tr key={song.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{song.title}</div>
                    <div className="text-sm text-gray-500">{song.artist}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">
                      {song.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Ready
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(song.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(song.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};