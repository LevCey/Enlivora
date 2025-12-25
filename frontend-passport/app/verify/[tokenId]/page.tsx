'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPassportData } from '@/lib/contracts';

type PassportData = { productHash: string; isRevoked: boolean; owner: string } | null;

export default function VerifyPage({ params }: { params: { tokenId: string } }) {
  const [passport, setPassport] = useState<PassportData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPassportData(params.tokenId).then(data => {
      setPassport(data);
      setLoading(false);
    });
  }, [params.tokenId]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ color: '#888' }}>Verifying on Starknet...</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>❌</div>
        <h1 className="title">Not Found</h1>
        <p className="subtitle">Token #{params.tokenId} does not exist</p>
        <Link href="/" className="link">← Back to Home</Link>
      </div>
    );
  }

  const shortOwner = `${passport.owner.slice(0, 8)}...${passport.owner.slice(-6)}`;

  return (
    <div className="card">
      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className={`status-badge ${passport.isRevoked ? 'status-revoked' : 'status-verified'}`}>
          {passport.isRevoked ? '⚠️ REVOKED' : '✓ VERIFIED AUTHENTIC'}
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '0.2em', marginBottom: '8px' }}>DIGITAL PASSPORT</p>
        <h1 className="title">Token #{params.tokenId}</h1>
      </div>

      {/* Details */}
      <div className="info-row">
        <span className="info-label">Owner</span>
        <span className="info-value">{shortOwner}</span>
      </div>

      <div className="info-row">
        <span className="info-label">Network</span>
        <span style={{ color: '#a855f7' }}>🟣 Starknet Sepolia</span>
      </div>

      <div className="info-row">
        <span className="info-label">Contract</span>
        <a 
          href="https://sepolia.starkscan.co/contract/0x060691688c40f8b98fd8d23e9a2c9864ddece643cf195a095e8b9d6d54210839"
          target="_blank"
          className="link"
          style={{ fontSize: '12px', fontFamily: 'monospace' }}
        >
          0x0606...0839 ↗
        </a>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '32px' }}>
        <Link href={`/claim/${params.tokenId}`} className="btn">
          Claim Ownership
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/" className="link" style={{ fontSize: '14px' }}>← Back to Home</Link>
      </div>
    </div>
  );
}
