import { Account, RpcProvider, json, CallData, hash } from 'starknet';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const provider = new RpcProvider({
        nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.infura.io/v3/9e3447c4f4ec49fc90b240bd4fe3a8b7"
    });

    const privateKey = process.env.MERCHANT_PRIVATE_KEY;
    const accountAddress = process.env.MERCHANT_ACCOUNT_ADDRESS;

    if (!privateKey || !accountAddress) {
        throw new Error("⚠️ MERCHANT_PRIVATE_KEY or MERCHANT_ACCOUNT_ADDRESS missing in .env");
    }

    // Force V3 Transaction
    const account = new Account(provider, accountAddress, privateKey, undefined, "0x3");
    console.log(`🚀 Deploying RewardsVault with Account: ${accountAddress} (Tx Version: v3)`);

    const baseDir = path.resolve(__dirname, "../../contracts/target/dev");
    const sierraPath = path.join(baseDir, 'enlivora_contracts_RewardsVault.contract_class.json');
    const casmPath = path.join(baseDir, 'enlivora_contracts_RewardsVault.compiled_contract_class.json');

    if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
        throw new Error("❌ Files not found. Run 'scarb build' first.");
    }

    const sierra = json.parse(fs.readFileSync(sierraPath).toString('ascii'));
    const casm = json.parse(fs.readFileSync(casmPath).toString('ascii'));

    // Verified CASM Hash from starkli
    const CORRECT_CASM_HASH = "0x073110ae681deff2a8287723a0e91e3f90b99dd892431a2bf16ac1e69e2e6c2d";
    console.log(`ℹ️ Using Verified CASM Hash: ${CORRECT_CASM_HASH}`);

    let classHash = "0x037248686127fce9e538f8bb79cd10bc36f7ac20abee6a2ba9d531263fac0e65"; // Default if declare skips

    try {
        // Generous Resource Bounds for V3
        const v3Details = {
            version: "0x3",
            resourceBounds: {
                l2_gas: { max_amount: '0xF4240', max_price_per_unit: '0x174876E800' }, // 100 Gwei
                l1_gas: { max_amount: '0x1388', max_price_per_unit: '0x174876E800' }, // 5000 gas, 100 Gwei
                l1_data_gas: { max_amount: '0x1388', max_price_per_unit: '0x174876E800' } // 5000 data gas
            }
        };

        console.log("📦 Declaring RewardsVault...");
        const declareResponse = await account.declare(
            {
                contract: sierra,
                casm: casm,
                compiledClassHash: CORRECT_CASM_HASH
            },
            v3Details
        );

        console.log(`✅ Declare Tx: ${declareResponse.transaction_hash}`);
        await provider.waitForTransaction(declareResponse.transaction_hash);
        classHash = declareResponse.class_hash;

    } catch (error: any) {
        if (error.message.includes("is already declared") || error.message.includes("Class already declared")) {
             console.log("⚠️ Class already declared. Proceeding to deploy...");
             classHash = hash.computeContractClassHash(sierra);
        } else {
            console.error("❌ Declaration failed:", error);
            // We exit here because if declare fails, deploy likely fails or uses wrong hash
            process.exit(1); 
        }
    }

    console.log(`🔑 Class Hash: ${classHash}`);
    await deployInstance(account, provider, classHash, accountAddress);
}

async function deployInstance(account: any, provider: any, classHash: string, ownerAddress: string) {
    console.log(`🚀 Deploying Instance...`);

    const v3Details = {
        version: "0x3",
        resourceBounds: {
            l2_gas: { max_amount: '0xF4240', max_price_per_unit: '0x174876E800' }, 
            l1_gas: { max_amount: '0x1388', max_price_per_unit: '0x174876E800' },
            l1_data_gas: { max_amount: '0x1388', max_price_per_unit: '0x174876E800' }
        }
    };

    const deployResponse = await account.deploy(
        {
            classHash: classHash,
            constructorCalldata: CallData.compile([ownerAddress]) 
        },
        v3Details
    );

    console.log(`✅ Deploy Tx: ${deployResponse.transaction_hash}`);
    console.log("⏳ Waiting for confirmation...");

    await provider.waitForTransaction(deployResponse.transaction_hash);

    const contractAddress = deployResponse.contract_address;
    console.log(`
🎉 RewardsVault Deployed at: ${contractAddress}\n`);

    const envPath = path.resolve(__dirname, "../../backend/.env");
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes("REWARDS_CONTRACT_ADDRESS=")) {
        envContent = envContent.replace(/REWARDS_CONTRACT_ADDRESS=.*/, `REWARDS_CONTRACT_ADDRESS="${contractAddress}"`);
    } else {
        envContent += `\nREWARDS_CONTRACT_ADDRESS="${contractAddress}"`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`📝 Updated backend/.env`);
}

main();
