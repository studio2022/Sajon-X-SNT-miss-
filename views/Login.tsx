import React, { useState } from 'react';
import { Music2, Lock, Mail, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void; 
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate Network Delay
    setTimeout(() => {
        setIsLoading(false);
        
        // Validation Logic
        if (email.length > 3 && password.length > 3) {
            
            // Check for Admin Access
            // Specific credentials for Sk0 Admin
            let isAdmin = false;
            if (email === 'sksajonvai90@gmail.com' && password === '42685123') {
                isAdmin = true;
            }

            const mockUser: User = {
                email: email,
                role: isAdmin ? 'admin' : 'user', 
                credits: isSignUp ? 50 : 20, // Increased default credits
            };
            
            onLogin(mockUser);
        } else {
            setError('Email and Password must be at least 4 characters.');
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-neon-blue/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-neon-purple/20">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">MelodyMix</h1>
          <p className="text-gray-400">
            {isSignUp ? 'Join the Revolution' : 'Login to Studio'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-pulse">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} icon={isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#12121a] text-gray-500">or</span>
            </div>
          </div>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-neon-blue hover:text-neon-purple transition-colors text-sm font-medium flex items-center justify-center gap-2 w-full"
            >
              {isSignUp ? (
                <>Already have an account? Log in</>
              ) : (
                <>Don't have an account? Sign Up</>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};