'use client';

import { useState } from 'react';
// Note: In a real implementation, we would import StarknetKit here
// import { connect } from 'starknetkit';

export default function ClaimPage({ params }: { params: { claimCode: string } }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'claiming' | 'success'>('idle');
  const [txHash, setTxHash] = useState('');

  const handleConnectAndClaim = async () => {
    setStatus('connecting');
    
    // Simulate wallet connection delay
    setTimeout(() => {
        setStatus('claiming');
        
        // Simulate contract interaction delay
        setTimeout(() => {
            setStatus('success');
            setTxHash('0x71...c9a2'); // Mock Hash
        }, 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-center">
        
        <div className="space-y-2">
            <h1 className="text-2xl font-bold">Claim Your Passport</h1>
            <p className="text-gray-500">Connect your Starknet wallet to receive your digital certificate.</p>
        </div>

        {status === 'idle' && (
            <button 
                onClick={handleConnectAndClaim}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
            >
                Connect Wallet & Claim
            </button>
        )}

        {status === 'connecting' && (
            <div className="py-10 text-gray-500 animate-pulse">Connecting to Argent/Braavos...</div>
        )}

        {status === 'claiming' && (
            <div className="py-10 text-blue-600 animate-pulse">
                Transferring Passport onchain...
            </div>
        )}

        {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-green-800">Passport Claimed!</h3>
                <p className="text-sm text-green-700">
                    The asset is now in your wallet.
                </p>
                <div className="text-xs bg-white p-2 rounded border border-green-100 font-mono break-all text-gray-500">
                    Tx: {txHash}
                </div>
            </div>
        )}

        <div className="text-xs text-gray-400 pt-10">
            Powered by Enlivora on Starknet
        </div>
    </div>
  );
}
