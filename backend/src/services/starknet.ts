import { Account, RpcProvider, Contract, CallData, cairo } from 'starknet';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Provider (Sepolia)
const provider = new RpcProvider({ 
    nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io" 
});

// Initialize Account (Merchant Admin)
const merchantAddress = process.env.MERCHANT_ACCOUNT_ADDRESS || "";
const privateKey = process.env.MERCHANT_PRIVATE_KEY || "";
const passportContractAddress = process.env.PASSPORT_721_ADDRESS || "";
const loyaltyContractAddress = process.env.LOYALTY_POINTS_ADDRESS || "";

const account = new Account(provider, merchantAddress, privateKey);

// ABI snippet for the mint function (simplified for direct use)
const contractAbi = [
  {
    "type": "function",
    "name": "mint_passport",
    "inputs": [
      { "name": "recipient", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "token_id", "type": "core::integer::u256" },
      { "name": "product_hash", "type": "core::felt252" }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

const loyaltyAbi = [
  {
    "type": "function",
    "name": "credit_points",
    "inputs": [
      { "name": "recipient", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "amount", "type": "core::integer::u256" },
      { "name": "reason_hash", "type": "core::felt252" }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

export class StarknetService {
    
    constructor() {
        if (!merchantAddress || !privateKey) {
            console.warn("Starknet credentials missing in .env");
        }
    }

    /**
     * Mints a new Passport NFT to the merchant's address (as initial inventory)
     * @param tokenId Unique ID for the passport (e.g. hash of SKU + Serial)
     * @param productHash Metadata hash (IPFS hash or similar)
     */
    async mintPassport(tokenId: string, productHash: string) {
        try {
            console.log(`Minting TokenID: ${tokenId} with Hash: ${productHash}...`);

            // Connect to contract
            const contract = new Contract(contractAbi, passportContractAddress, provider);
            contract.connect(account);

            // Execute mint transaction
            // We mint to 'merchantAddress' first. The customer will 'claim' (transfer) it later.
            // Using cairo.uint256 to handle large numbers safely
            const tx = await contract.mint_passport(
                merchantAddress, 
                cairo.uint256(tokenId), 
                productHash
            );

            console.log("Transaction sent:", tx.transaction_hash);
            
            // Wait for transaction acceptance (optional, depends on UX speed requirements)
            await provider.waitForTransaction(tx.transaction_hash);
            console.log("Transaction confirmed on L2");

            return tx.transaction_hash;

        } catch (error) {
            console.error("Minting failed:", error);
            throw error;
        }
    }

    /**
     * Credits loyalty points to a user for a purchase
     * @param userAddress The customer's Starknet wallet address
     * @param amount Number of points to credit
     * @param orderId Shopify Order ID (used as reason)
     */
    async creditPoints(userAddress: string, amount: number, orderId: string) {
        try {
            console.log(`Crediting ${amount} points to ${userAddress} for Order ${orderId}...`);

            if (!loyaltyContractAddress) {
                throw new Error("LOYALTY_POINTS_ADDRESS not configured");
            }

            const contract = new Contract(loyaltyAbi, loyaltyContractAddress, provider);
            contract.connect(account);

            // Mock hashing for orderId (in real app, use proper hash)
            // If orderId is numeric string, we can use it directly if it fits felt252, 
            // otherwise hash it. For MVP, assuming a simple felt representation.
            const reasonHash = "0x1"; 

            const tx = await contract.credit_points(
                userAddress,
                cairo.uint256(amount),
                reasonHash
            );

            console.log("Loyalty Transaction sent:", tx.transaction_hash);
            return tx.transaction_hash;

        } catch (error) {
            console.error("Credit points failed:", error);
            throw error;
        }
    }
}

