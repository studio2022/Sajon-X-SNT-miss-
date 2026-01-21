import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Coins, CheckCircle, Smartphone } from 'lucide-react';

interface WalletProps {
    config: SystemConfig;
    onAddCredits: (amount: number) => void;
}

export const Wallet: React.FC<WalletProps> = ({ config, onAddCredits }) => {
    const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'upay'>('bkash');
    const [trxId, setTrxId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePurchase = () => {
        if(!trxId) return;
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onAddCredits(10);
            setShowSuccess(true);
            setTrxId('');
            setTimeout(() => setShowSuccess(false), 3000);
        }, 2000);
    };

    const getNumber = () => {
        if(selectedMethod === 'bkash') return config.bkashNumber;
        if(selectedMethod === 'nagad') return config.nagadNumber;
        return config.upayNumber;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 mb-24">
            <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-white mb-2">My Wallet</h2>
                <p className="text-gray-400">Top up credits to create more music.</p>
            </div>

            {/* Credit Package Card */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/50 rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Coins className="w-32 h-32 text-yellow-500" /></div>
                <h3 className="text-2xl font-bold text-white relative z-10">Standard Pack</h3>
                <div className="text-4xl font-bold text-yellow-400 my-4 relative z-10">10 Credits</div>
                <div className="text-xl text-white font-medium relative z-10">Price: {config.creditPrice} BDT</div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {['bkash', 'nagad', 'upay'].map((method) => (
                        <button
                            key={method}
                            onClick={() => setSelectedMethod(method as any)}
                            className={`py-3 rounded-xl border font-bold capitalize transition-all ${selectedMethod === method ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                        >
                            {method}
                        </button>
                    ))}
                </div>

                <div className="bg-white/5 p-4 rounded-xl mb-6 text-center">
                    <p className="text-sm text-gray-400 mb-1">Send Money to this {selectedMethod} Personal Number:</p>
                    <p className="text-2xl font-mono text-neon-blue font-bold tracking-wider select-all">{getNumber()}</p>
                </div>

                <div className="space-y-4">
                    <Input 
                        label="Transaction ID (TrxID)"
                        placeholder="e.g. 8X301..."
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                    />
                    <Button 
                        fullWidth 
                        onClick={handlePurchase} 
                        isLoading={isProcessing} 
                        disabled={!trxId}
                        className="h-14 bg-green-600 border-green-600 text-white hover:bg-green-500"
                    >
                        Verify & Add Credits
                    </Button>
                </div>
            </div>

            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-card border border-green-500 p-8 rounded-2xl text-center max-w-sm mx-4 shadow-2xl shadow-green-500/20">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                        <p className="text-gray-400">10 Credits have been added to your account.</p>
                    </div>
                </div>
            )}
        </div>
    );
};