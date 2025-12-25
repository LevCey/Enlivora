'use client';

import { useState } from 'react';
import { useConnect, useAccount, useDisconnect } from '@starknet-react/core';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ClaimPage({ params }: { params: { tokenId: string } }) {
  const { connect, connectors } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [status, setStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const handleClaim = async () => {
    if (!address) return;
    setStatus('claiming');
    
    try {
      const res = await fetch(`${API_URL}/claim/${params.tokenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      
      setTxHash(data.txHash);
      setStatus('success');
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
      setStatus('error');
    }
  };

  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';

  return (
    <div className="card">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '0.2em', marginBottom: '8px' }}>CLAIM OWNERSHIP</p>
        <h1 className="title">Token #{params.tokenId}</h1>
      </div>

      <div style={{ padding: '24px 0', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
        
        {!address && status === 'idle' && (
          <div>
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px', fontSize: '14px' }}>
              Connect your Starknet wallet to claim
            </p>
            {connectors.map((connector) => (
              <button key={connector.id} onClick={() => connect({ connector })} className="wallet-btn">
                {connector.name}
              </button>
            ))}
          </div>
        )}

        {address && status === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <div className="info-row" style={{ marginBottom: '20px' }}>
              <span className="info-label">Wallet</span>
              <span className="info-value">{shortAddress}</span>
            </div>
            <button onClick={handleClaim} className="btn">Claim Passport</button>
            <button onClick={() => disconnect()} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>
              Disconnect
            </button>
          </div>
        )}

        {status === 'claiming' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner"></div>
            <p style={{ color: '#D4AF37' }}>Transferring ownership...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#22c55e', fontSize: '20px', marginBottom: '12px' }}>Claimed!</h3>
            <a href={`https://sepolia.starkscan.co/tx/${txHash}`} target="_blank" className="link">
              View Transaction ↗
            </a>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
            <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link href={`/verify/${params.tokenId}`} className="link" style={{ fontSize: '14px' }}>
          ← Back to Verification
        </Link>
      </div>
    </div>
  );
}
