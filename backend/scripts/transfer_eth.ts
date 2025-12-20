import { Account, RpcProvider, Contract, cairo, uint256 } from "starknet";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
    const rpcUrl = process.env.STARKNET_RPC_URL;
    const accountAddress = process.env.MERCHANT_ACCOUNT_ADDRESS;
    const privateKey = process.env.MERCHANT_PRIVATE_KEY;

    if (!rpcUrl || !accountAddress || !privateKey) {
        throw new Error("Missing environment variables (STARKNET_RPC_URL, MERCHANT_ACCOUNT_ADDRESS, MERCHANT_PRIVATE_KEY)");
    }

    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const account = new Account(provider, accountAddress, privateKey);

    const ethTokenAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    const recipientAddress = "0x05f6d82ec54c8ac42fbca730731644c17c645d1ccd835813be9b0100ccc11cd4";
    const amount = 0.05; 
    const amountWei = BigInt(amount * 10**18); // 0.05 ETH in Wei
    const amountUint256 = uint256.bnToUint256(amountWei);

    console.log(`Checking balance for ${accountAddress}...`);
    const ethContract = new Contract(
        [
            {
                name: "balanceOf",
                type: "function",
                inputs: [{ name: "account", type: "felt" }],
                outputs: [{ name: "balance", type: "Uint256" }],
                stateMutability: "view"
            }
        ],
        ethTokenAddress,
        provider
    );

    const balanceResult = await ethContract.balanceOf(accountAddress);
    const balance = uint256.uint256ToBN(balanceResult.balance);
    console.log(`Current Balance: ${balance.toString()} Wei (${Number(balance) / 10**18} ETH)`);

    if (balance < amountWei) {
        throw new Error(`Insufficient balance! Need ${amountWei} Wei but have ${balance} Wei.`);
    }

    console.log(`Sending ${amount} ETH from ${accountAddress} to ${recipientAddress}...`);
    console.log(`Amount in Wei: ${amountWei.toString()}`);

    try {
        const { transaction_hash } = await account.execute({
            contractAddress: ethTokenAddress,
            entrypoint: "transfer",
            calldata: {
                recipient: recipientAddress,
                amount: amountUint256
            }
        });

        console.log("Transaction submitted successfully!");
        console.log(`Transaction Hash: ${transaction_hash}`);
        console.log(`Explorer: https://sepolia.starkscan.co/tx/${transaction_hash}`);
        
        console.log("Waiting for transaction acceptance...");
        await provider.waitForTransaction(transaction_hash);
        console.log("Transaction accepted!");

    } catch (error) {
        console.error("Error executing transfer:", error);
    }
}

main();
