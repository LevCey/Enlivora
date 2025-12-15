import Link from 'next/link';

export default function VerifyPage({ params }: { params: { claimCode: string } }) {
  // Mock Data (In real app, fetch from Backend API using claimCode)
  const product = {
    name: "Limited Edition Sneaker #42",
    brand: "Satoshi Steps",
    image: "https://via.placeholder.com/400x400",
    mintDate: "2025-12-15",
    contract: "0x04...a1b2",
    tokenId: "101",
    status: "Active"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-64 bg-gray-100">
        {/* Product Image Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
           [Product Image]
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-2 text-green-600 font-medium text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Authenticity Verified</span>
        </div>

        <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-gray-500">{product.brand}</p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-500">Token ID</span>
                <span className="font-mono">{product.tokenId}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Network</span>
                <span>Starknet Sepolia</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Mint Date</span>
                <span>{product.mintDate}</span>
            </div>
        </div>

        <div className="pt-4">
            <Link 
                href={`/claim/${params.claimCode}`}
                className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
                Claim Ownership
            </Link>
            <p className="text-xs text-center text-gray-400 mt-3">
                This digital passport proves you own the authentic item.
            </p>
        </div>
      </div>
    </div>
  );
}
