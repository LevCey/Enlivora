'use client';

import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { Contract } from 'starknet';
import { LOYALTY_ADDRESS, provider } from '../../lib/contracts';
import Link from 'next/link';

const LOYALTY_ABI = [
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view',
  },
] as const;

export default function LoyaltyPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setLoading(true);
      const contract = new Contract(LOYALTY_ABI, LOYALTY_ADDRESS, provider);
      contract.balance_of(address)
        .then((bal: bigint) => setBalance(bal.toString()))
        .catch(() => setBalance('0'))
        .finally(() => setLoading(false));
    }
  }, [address]);

  if (!isConnected) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
        <h1 className="title">Loyalty Points</h1>
        <p className="subtitle">Connect your wallet to view your ELP balance</p>
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
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
      <h1 className="title">Loyalty Points</h1>
      
      <div className="info-row">
        <span className="info-label">Wallet</span>
        <span className="info-value" style={{ fontSize: '12px' }}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">ELP Balance</span>
        <span className="info-value" style={{ color: '#D4AF37', fontSize: '24px' }}>
          {loading ? '...' : balance ?? '0'}
        </span>
      </div>

      <p style={{ color: '#666', fontSize: '12px', marginTop: '16px' }}>
        Earn points with every purchase. Non-transferable.
      </p>

      <button onClick={() => disconnect()} className="btn" style={{ marginTop: '24px', background: '#333' }}>
        Disconnect
      </button>

      <Link href="/" style={{ display: 'block', marginTop: '16px', color: '#888', fontSize: '14px' }}>
        ← Back to Home
      </Link>
    </div>
  );
}
