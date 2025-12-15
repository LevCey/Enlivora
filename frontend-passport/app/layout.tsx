import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enlivora Passport Verify",
  description: "Verify product authenticity on Starknet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="p-4 border-b bg-white flex justify-between items-center">
                <div className="font-bold text-xl tracking-tight">ENLIVORA</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Secure Commerce Layer</div>
            </header>
            <main className="max-w-md mx-auto p-4 pt-10">
                {children}
            </main>
        </div>
      </body>
    </html>
  );
}
