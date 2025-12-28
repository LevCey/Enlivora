import { Account, RpcProvider, json, CallData, hash } from 'starknet';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const provider = new RpcProvider({
        nodeUrl: process.env.STARKNET_RPC_URL!
    });

    const privateKey = process.env.MERCHANT_PRIVATE_KEY;
    const accountAddress = process.env.MERCHANT_ACCOUNT_ADDRESS;

    if (!privateKey || !accountAddress) {
        throw new Error("⚠️ MERCHANT_PRIVATE_KEY or MERCHANT_ACCOUNT_ADDRESS missing in .env");
    }

    const account = new Account(provider, accountAddress, privateKey);
    console.log("✅ Account connected:", accountAddress);

    // Load compiled contract
    const contractPath = path.join(__dirname, '../../contracts/target/dev');
    const sierraPath = path.join(contractPath, 'enlivora_contracts_RewardsVault.contract_class.json');
    const casmPath = path.join(contractPath, 'enlivora_contracts_RewardsVault.compiled_contract_class.json');

    if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
        throw new Error("Contract files not found. Run 'scarb build' first.");
    }

    const sierra = json.parse(fs.readFileSync(sierraPath, 'utf-8'));
    const casm = json.parse(fs.readFileSync(casmPath, 'utf-8'));

    // Declare contract
    console.log("📝 Declaring contract...");
    const declareResponse = await account.declare({ contract: sierra, casm });
    console.log("✅ Declared:", declareResponse.class_hash);

    // Deploy contract
    console.log("🚀 Deploying contract...");
    const deployResponse = await account.deployContract({
        classHash: declareResponse.class_hash,
        constructorCalldata: CallData.compile([accountAddress]) // owner
    });

    await provider.waitForTransaction(deployResponse.transaction_hash);
    console.log("✅ Deployed at:", deployResponse.contract_address);
}

main().catch(console.error);
