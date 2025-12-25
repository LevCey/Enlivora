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
const contractAddress = process.env.PASSPORT_721_ADDRESS || "";
const loyaltyContractAddress = process.env.LOYALTY_POINTS_ADDRESS || "";
const rewardsContractAddress = process.env.REWARDS_CONTRACT_ADDRESS || "";

const account = new Account({
    provider,
    address: merchantAddress,
    signer: privateKey
});

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
  },
  {
    "type": "function",
    "name": "transfer_from",
    "inputs": [
      { "name": "from", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "to", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "token_id", "type": "core::integer::u256" }
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
  },
  {
    "type": "function",
    "name": "debit_points",
    "inputs": [
      { "name": "user", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "amount", "type": "core::integer::u256" },
      { "name": "reward_id", "type": "core::felt252" }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

const rewardsAbi = [
  {
    "type": "function",
    "name": "redeem_rewards",
    "inputs": [
      { "name": "token_address", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "recipient", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "amount", "type": "core::integer::u256" }
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
     */
    async mintPassport(tokenId: string, productHash: string) {
        try {
            console.log(`Minting TokenID: ${tokenId} with Hash: ${productHash}...`);

            const uint256TokenId = cairo.uint256(tokenId);

            // Execute mint transaction using account directly
            const tx = await account.execute({
                contractAddress: contractAddress,
                entrypoint: "mint_passport",
                calldata: CallData.compile({
                    recipient: merchantAddress,
                    token_id: uint256TokenId,
                    product_hash: productHash
                })
            });

            console.log("Transaction sent:", tx.transaction_hash);
            await provider.waitForTransaction(tx.transaction_hash);
            console.log("Transaction confirmed on L2");

            return tx.transaction_hash;

        } catch (error) {
            console.error("Minting failed:", error);
            throw error;
        }
    }

    /**
     * Transfers a Passport NFT from merchant to customer (claim)
     */
    async transferPassport(tokenId: string, toAddress: string) {
        try {
            console.log(`Transferring Token #${tokenId} to ${toAddress}...`);

            const tx = await account.execute({
                contractAddress: contractAddress,
                entrypoint: "transfer_from",
                calldata: CallData.compile({
                    from: merchantAddress,
                    to: toAddress,
                    token_id: cairo.uint256(tokenId)
                })
            });

            console.log("Transfer sent:", tx.transaction_hash);
            await provider.waitForTransaction(tx.transaction_hash);
            console.log("Transfer confirmed");

            return tx.transaction_hash;
        } catch (error) {
            console.error("Transfer failed:", error);
            throw error;
        }
    }

    /**
     * Credits loyalty points to a user for a purchase
     */
    async creditPoints(userAddress: string, amount: number, orderId: string) {
        try {
            console.log(`Crediting ${amount} points to ${userAddress} for Order ${orderId}...`);

            if (!loyaltyContractAddress) {
                throw new Error("LOYALTY_CONTRACT_ADDRESS not configured");
            }

            const contract = new Contract({
                abi: loyaltyAbi,
                address: loyaltyContractAddress,
                providerOrAccount: account
            });

            const reasonHash = "0x1"; // Mock hash

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

    /**
     * Redeems points for a token reward
     * 1. Debits (burns) points from user
     * 2. Sends reward tokens (USDC/STRK) to user
     */
    async redeemReward(userAddress: string, pointsAmount: number, rewardToken: string, rewardAmount: number) {
        try {
            console.log(`Redeeming ${pointsAmount} points for ${rewardAmount} tokens...`);

            if (!loyaltyContractAddress || !rewardsContractAddress) {
                throw new Error("Contract addresses not configured");
            }

            // 1. Debit Points
            const loyaltyContract = new Contract({
                abi: loyaltyAbi,
                address: loyaltyContractAddress,
                providerOrAccount: account
            });
            
            const rewardIdHash = "0x99"; // Mock reward ID

            console.log("Step 1: Debiting points...");
            const debitTx = await loyaltyContract.debit_points(
                userAddress,
                cairo.uint256(pointsAmount),
                rewardIdHash
            );
            
            console.log("Debit Tx Sent:", debitTx.transaction_hash);
            // Wait for debit to be at least received to ensure order
            await provider.waitForTransaction(debitTx.transaction_hash);

            // 2. Send Reward
            const rewardsContract = new Contract({
                abi: rewardsAbi,
                address: rewardsContractAddress,
                providerOrAccount: account
            });

            console.log("Step 2: Sending reward tokens...");
            const rewardTx = await rewardsContract.redeem_rewards(
                rewardToken,
                userAddress,
                cairo.uint256(rewardAmount)
            );

            console.log("Reward Tx Sent:", rewardTx.transaction_hash);

            return {
                debitTx: debitTx.transaction_hash,
                rewardTx: rewardTx.transaction_hash
            };

        } catch (error) {
            console.error("Redeem failed:", error);
            throw error;
        }
    }
}

