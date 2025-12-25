'use client';

import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useState, useEffect } from 'react';
import { Contract } from 'starknet';
import { LOYALTY_ADDRESS, provider } from '../../lib/contracts';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const LOYALTY_ABI = [
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view',
  },
] as const;

export default function RedeemPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<number>(0);
  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'redeeming' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      const contract = new Contract(LOYALTY_ABI, LOYALTY_ADDRESS, provider);
      contract.balance_of(address)
        .then((bal: bigint) => setBalance(Number(bal)))
        .catch(() => setBalance(0));
    }
  }, [address, status]);

  const handleRedeem = async () => {
    if (!address || !redeemAmount) return;
    const points = parseInt(redeemAmount);
    if (points <= 0 || points > balance) return;

    setStatus('redeeming');
    try {
      const res = await fetch(`${API_URL}/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          pointsAmount: points,
          rewardToken: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', // STRK token
          rewardAmount: points * 1000000000000000 // 0.001 STRK per point
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Redeem failed');

      setTxHash(data.transactions?.rewardTx || '');
      setStatus('success');
      setRedeemAmount('');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  if (!isConnected) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <h1 className="title">Redeem Points</h1>
        <p className="subtitle">Connect wallet to redeem your ELP for STRK</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          {connectors.map((c) => (
            <button key={c.id} onClick={() => connect({ connector: c })} className="btn">
              {c.id === 'argentX' ? 'Argent X' : 'Braavos'}
            </button>
          ))}
        </div>
        <Link href="/" style={{ display: 'block', marginTop: '24px', color: '#888', fontSize: '14px' }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
      <h1 className="title">Redeem Points</h1>

      <div className="info-row">
        <span className="info-label">Your Balance</span>
        <span className="info-value" style={{ color: '#D4AF37', fontSize: '24px' }}>{balance} ELP</span>
      </div>

      {status === 'idle' && (
        <>
          <div style={{ margin: '24px 0' }}>
            <input
              type="number"
              placeholder="Points to redeem"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              max={balance}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                textAlign: 'center'
              }}
            />
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              Rate: 1 ELP = 0.001 STRK
            </p>
          </div>

          <button
            onClick={handleRedeem}
            disabled={!redeemAmount || parseInt(redeemAmount) <= 0 || parseInt(redeemAmount) > balance}
            className="btn"
            style={{ opacity: (!redeemAmount || parseInt(redeemAmount) > balance) ? 0.5 : 1 }}
          >
            Redeem for STRK
          </button>
        </>
      )}

      {status === 'redeeming' && (
        <div style={{ padding: '20px 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#D4AF37' }}>Processing redemption...</p>
        </div>
      )}

      {status === 'success' && (
        <div style={{ padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#22c55e', marginBottom: '12px' }}>Redeemed!</h3>
          <a href={`https://sepolia.starkscan.co/tx/${txHash}`} target="_blank" className="link">
            View Transaction ↗
          </a>
          <button onClick={() => setStatus('idle')} className="btn" style={{ marginTop: '16px', background: '#333' }}>
            Redeem More
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
          <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}

      <button onClick={() => disconnect()} style={{ marginTop: '24px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>
        Disconnect
      </button>

      <Link href="/loyalty" style={{ display: 'block', marginTop: '16px', color: '#888', fontSize: '14px' }}>
        ← Back to Loyalty
      </Link>
    </div>
  );
}
