import { Account, RpcProvider, CallData, hash, stark, ec } from 'starknet';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const OZ_ACCOUNT_CLASS_HASH = "0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564";
const ETH_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

async function main() {
    const provider = new RpcProvider({ 
        nodeUrl: process.env.STARKNET_RPC_URL!
    });
    
    // Read keystore to get private key
    const keystore = JSON.parse(fs.readFileSync('/home/levent/.starkli-wallets/enlivora-new/keystore.json', 'utf-8'));
    
    // The public key from account.json
    const publicKey = "0x14370ccdbbb6ac941007a61249c992f5a4ac11454b3ee00a67de78ea018432";
    const salt = "0x3ef84ba03cee233bdace1ad3b64509fcfda15fdecfef98f871f41ca6e22d40c";
    
    // Calculate address
    const constructorCalldata = CallData.compile([publicKey]);
    const accountAddress = hash.calculateContractAddressFromHash(
        salt,
        OZ_ACCOUNT_CLASS_HASH,
        constructorCalldata,
        0
    );
    
    console.log("Account address:", accountAddress);
    
    // We need the actual private key - let's derive it from keystore
    // For now, let's just check the balance
    const ethContract = await provider.getClassAt(ETH_ADDRESS);
    
    // Check balance using call
    const result = await provider.callContract({
        contractAddress: ETH_ADDRESS,
        entrypoint: "balanceOf",
        calldata: [accountAddress]
    });
    
    const balance = BigInt(result[0]);
    console.log("Balance:", Number(balance) / 1e18, "ETH");
    
    if (balance > 0n) {
        console.log("\n✅ Account has ETH! But we need the private key to deploy and transfer.");
        console.log("The keystore is encrypted with password 'enlivora2025'");
        console.log("\nNew Argent address to send to: 0x007E5DB55016E21eAF022F0A9C0a7b8a56421DEFcb30CBf7E8A5f1A565A774e2");
    }
}

main().catch(console.error);
