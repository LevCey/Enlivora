import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { StarknetService } from '../src/services/starknet';

async function main() {
    console.log("Starting manual mint test...");
    
    console.log("Debug Env:");
    console.log("RPC URL:", process.env.STARKNET_RPC_URL || "Using default (Fallback)");
    console.log("Merchant Address Present:", !!process.env.MERCHANT_ACCOUNT_ADDRESS);
    console.log("Contract Address Present:", !!process.env.PASSPORT_721_ADDRESS);

    const service = new StarknetService();
    
    // Generate random large integer for TokenID (as string)
    const tokenId = Math.floor(Math.random() * 1000000000).toString();
    // Mock Product Hash (felt252 compatible)
    const productHash = "0x123456789abcdef"; 

    try {
        console.log(`Attempting to mint Token ID: ${tokenId}`);
        const txHash = await service.mintPassport(tokenId, productHash);
        console.log("SUCCESS! Mint Tx Hash:", txHash);
    } catch (error) {
        console.error("FAILED to mint:", error);
    }
}

main();
