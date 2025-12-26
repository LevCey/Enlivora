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

  // Demo mode: show mock data if token doesn't exist
  const isDemo = !passport;
  const displayData = passport || {
    owner: '0x04a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef012345678',
    isRevoked: false,
  };

  const shortOwner = `${displayData.owner.slice(0, 8)}...${displayData.owner.slice(-6)}`;

  return (
    <div className="card">
      {/* Demo Banner */}
      {isDemo && (
        <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '24px', textAlign: 'center' }}>
          <span style={{ color: '#a855f7', fontSize: '13px' }}>🎭 Demo Mode — Sample passport preview</span>
        </div>
      )}

      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className={`status-badge ${displayData.isRevoked ? 'status-revoked' : 'status-verified'}`}>
          {displayData.isRevoked ? '⚠️ REVOKED' : '✓ VERIFIED AUTHENTIC'}
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
