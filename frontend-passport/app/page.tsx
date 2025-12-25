import Link from 'next/link';

export default function Home() {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <img 
          src="/starknet-card.jpg" 
          alt="Starknet Genesis" 
          style={{ 
            width: '200px', 
            height: 'auto', 
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)'
          }} 
        />
      </div>
      
      <h1 className="title">Digital Passport</h1>
      <p className="subtitle">Verify product authenticity on Starknet blockchain</p>

      <div className="info-row">
        <span className="info-label">Demo Token</span>
        <span className="info-value">#1</span>
      </div>

      <div className="info-row">
        <span className="info-label">Status</span>
        <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🟢 Active
        </span>
      </div>

      <div style={{ marginTop: '24px' }}>
        <Link href="/verify/1" className="btn">
          Verify Passport
        </Link>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Link href="/loyalty" className="btn" style={{ background: '#333' }}>
          🎁 View Loyalty Points
        </Link>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', color: '#666' }}>
        <span>⚡ STARK Proven</span>
        <span>✓ Immutable</span>
      </div>
    </div>
  );
}
