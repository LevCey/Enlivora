import { Account, RpcProvider, json, Contract, CallData, hash } from 'starknet';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // 1. Setup Provider & Account
    const provider = new RpcProvider({ 
        nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.infura.io/v3/9e3447c4f4ec49fc90b240bd4fe3a8b7" 
    });

    const privateKey = process.env.MERCHANT_PRIVATE_KEY;
    const accountAddress = process.env.MERCHANT_ACCOUNT_ADDRESS;

    if (!privateKey || !accountAddress) {
        throw new Error("⚠️ MERCHANT_PRIVATE_KEY or MERCHANT_ACCOUNT_ADDRESS missing in .env");
    }

    // Force V3 Transaction (STRK Fee)
    const account = new Account(provider, accountAddress, privateKey, undefined, "0x3");
    console.log(`🚀 Deploying with Account: ${accountAddress} (Tx Version: v3/STRK)`);

    // 2. Read Contract Files (Sierra & CASM)
    const sierraPath = path.join(__dirname, '../../contracts/target/dev/enlivora_contracts_Passport721.contract_class.json');
    const casmPath = path.join(__dirname, '../../contracts/target/dev/enlivora_contracts_Passport721.compiled_contract_class.json');

    const sierra = json.parse(fs.readFileSync(sierraPath).toString('ascii'));
    const casm = json.parse(fs.readFileSync(casmPath).toString('ascii'));

    // 3. Declare Contract (Class)
    console.log("📦 Declaring Passport721 Contract...");

    try {
        // Pre-calculate Class Hash (Good practice and debugging aid)
        const computedClassHash = hash.computeContractClassHash(sierra);
        console.log(`ℹ️ Computed Class Hash: ${computedClassHash}`);

        // Try to check if already declared?
        try {
            const existingClass = await provider.getClassByHash(computedClassHash);
            if (existingClass) {
                console.log("⚠️ Class already declared on-chain. Skipping declaration.");
                await deployInstance(account, provider, computedClassHash, accountAddress);
                return;
            }
        } catch (e) {
            // Ignore error, means class not found, proceed to declare
        }

        // Explicitly setting resourceBounds for V3 transaction to bypass estimateFee issues
        // We provide generous limits for Declare
        const declareOptions = {
            version: "0x3",
            resourceBounds: {
                l1_gas: { max_amount: '0x186A0', max_price_per_unit: '0x4A817C800' }, // 100k gas, 20 Gwei
                l2_gas: { max_amount: '0x0', max_price_per_unit: '0x0' },
                l1_data_gas: { max_amount: '0x0', max_price_per_unit: '0x0' } // Explicitly zeroing data gas if needed
            }
        };

        const declareResponse = await account.declare(
            { contract: sierra, casm: casm }, 
            declareOptions
        );
        
        console.log(`✅ Declare Tx Hash: ${declareResponse.transaction_hash}`);
        console.log(`🔑 Class Hash: ${declareResponse.class_hash}`);
        
        console.log("⏳ Waiting for Declare confirmation...");
        await provider.waitForTransaction(declareResponse.transaction_hash);
        
        const classHash = declareResponse.class_hash;
        await deployInstance(account, provider, classHash, accountAddress);

    } catch (error: any) {
        if (error.message.includes("Class already declared")) {
             console.log("⚠️ Class already declared (caught via error). Proceeding to deploy...");
             const computedClassHash = hash.computeContractClassHash(sierra);
             await deployInstance(account, provider, computedClassHash, accountAddress);
        } else {
            console.error("❌ Deployment failed:", error);
        }
    }
}

async function deployInstance(account: any, provider: any, classHash: string, ownerAddress: string) {
    console.log(`🚀 Deploying Passport721 Instance from Class Hash: ${classHash}...`);
    
    // Explicit resourceBounds for Deploy
    const deployOptions = {
        version: "0x3",
        resourceBounds: {
            l1_gas: { max_amount: '0x186A0', max_price_per_unit: '0x4A817C800' }, // 100k gas, 20 Gwei
            l2_gas: { max_amount: '0x0', max_price_per_unit: '0x0' },
            l1_data_gas: { max_amount: '0x0', max_price_per_unit: '0x0' }
        }
    };

    const deployResponse = await account.deploy(
        {
            classHash: classHash,
            constructorCalldata: CallData.compile([ownerAddress]) 
        },
        deployOptions
    );

    console.log(`✅ Deploy Tx Hash: ${deployResponse.transaction_hash}`);
    console.log("⏳ Waiting for Deploy confirmation...");
    
    await provider.waitForTransaction(deployResponse.transaction_hash);

    // Get contract address from receipt or response
    // contract_address array usually populated in deploy response object in v5/v6
    const contractAddress = deployResponse.contract_address;

    console.log(`🎉 Contract Deployed at: ${contractAddress}`);
    console.log(`👉 Add this address to your .env file as CONTRACT_ADDRESS`);
}

main();
