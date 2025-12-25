import type { Metadata } from "next";
import "./globals.css";
import { StarknetProvider } from "./providers";

export const metadata: Metadata = {
  title: "Enlivora | Digital Passport",
  description: "Blockchain-verified product authenticity on Starknet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StarknetProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}>
            <header style={{ padding: '24px 32px', borderBottom: '1px solid #333' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.2em', color: '#D4AF37' }}>ENLIVORA</span>
                <span style={{ fontSize: '12px', color: '#666' }}>🟢 Starknet Sepolia</span>
              </div>
            </header>
            
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
              {children}
            </main>

            <footer style={{ padding: '24px 32px', borderTop: '1px solid #333', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#666' }}>© 2025 Enlivora Protocol • Powered by Starknet</p>
            </footer>
          </div>
        </StarknetProvider>
      </body>
    </html>
  );
}
