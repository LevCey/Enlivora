import { Account, json, RpcProvider, CallData, hash } from 'starknet';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const RPC_URL = process.env.STARKNET_RPC || "https://starknet-sepolia.infura.io/v3/9e3447c4f4ec49fc90b240bd4fe3a8b7";
const ACCOUNT_ADDRESS = process.env.OWNER_ADDRESS; 
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const KEYSTORE_PATH = process.env.KEYSTORE_PATH;
const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD;

async function main() {
    console.log("🚀 Starting deployment script...");
    console.log(`RPC: ${RPC_URL}`);

    let account;
    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    if (PRIVATE_KEY && ACCOUNT_ADDRESS) {
        console.log(`👤 Using Private Key for account: ${ACCOUNT_ADDRESS}`);
        account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
    } else if (KEYSTORE_PATH && KEYSTORE_PASSWORD && ACCOUNT_ADDRESS) {
        console.log(`🔐 Using Keystore file: ${KEYSTORE_PATH}`);
        if (!fs.existsSync(KEYSTORE_PATH)) {
            console.error("❌ Keystore file not found!");
            process.exit(1);
        }
        const keystore = json.parse(fs.readFileSync(KEYSTORE_PATH, 'utf8'));
        // Starknet.js has methods to decrypt keystore, usually via `Account.fromEncryptedJson` (if supported in v6)
        // or we use a separate decrypt function. 
        // Actually, Account constructor doesn't take keystore. 
        // We assume standard starknet-keystore format.
        
        // Since we are in a rush, let's use the `starkli` account which is OpenZeppelin.
        // But decrypting it manually in JS requires libraries.
        
        // WAIT! The user has 'starkli' installed. We can ask starkli to export the private key!
        console.error("⚠️ JS Keystore decryption is complex. Please export private key using `starkli account private-key <KEYSTORE_FILE>`");
        process.exit(1);
    } else {
        console.error("❌ Error: Missing credentials. Provide (OWNER_ADDRESS + PRIVATE_KEY).");
        process.exit(1);
    }

    // Manual Max Fee to avoid estimateFee (which causes l1_data_gas error)
    // 0.001 ETH is usually more than enough for declare/deploy on Sepolia
    const MANUAL_MAX_FEE = "1000000000000000"; 


    console.log(`👤 Deploying with account: ${ACCOUNT_ADDRESS}`);

    const baseDir = path.resolve(__dirname, "../../contracts/target/dev");
    
    // --- Passport721 ---
    console.log("\n-------------------------------------------");
    console.log("📦 Processing Passport721...");
    await deployContract(account, baseDir, "enlivora_contracts_Passport721", [ACCOUNT_ADDRESS]);

    // --- LoyaltyPoints ---
    console.log("\n-------------------------------------------");
    console.log("📦 Processing LoyaltyPoints...");
    await deployContract(account, baseDir, "enlivora_contracts_LoyaltyPoints", [ACCOUNT_ADDRESS]);
}

async function deployContract(account: Account, baseDir: string, contractName: string, constructorArgs: any[]) {
    try {
        const sierraPath = path.join(baseDir, `${contractName}.contract_class.json`);
        const casmPath = path.join(baseDir, `${contractName}.compiled_contract_class.json`);

        if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
            console.error(`❌ Files not found for ${contractName}`);
            return;
        }

        const compiledSierra = json.parse(fs.readFileSync(sierraPath).toString('ascii'));
        const compiledCasm = json.parse(fs.readFileSync(casmPath).toString('ascii'));

        // 1. Declare with V3 Transaction settings
        console.log(`   ⏳ Declaring ${contractName}...`);
        
        let classHash;
        try {
            // Manual Resource Bounds for V3 Transaction
            // Bypasses estimateFee() to avoid l1_data_gas errors
            // Import EDataAvailabilityMode if available, or use integers. 
            // In starknet.js v6, it is usually an enum or "L1"/"L2" string.
            // Let's use 'L1' as string which is standard.

            const v3Details: any = {
                version: 3,
                resourceBounds: {
                    // Current network price is ~35,000 Gwei.
                    // We set max price to 50,000 Gwei (0x2D79883D2000)
                    // We set amount to 800 units (0x320)
                    // Total cost per L1 part: 0.04 ETH. (Within 0.051 ETH balance)
                    
                    l2_gas: { max_amount: '0xF4240', max_price_per_unit: '0x2D79883D2000' }, 
                    l1_gas: { max_amount: '0x320', max_price_per_unit: '0x2D79883D2000' },
                    l1_data_gas: { max_amount: '0x320', max_price_per_unit: '0x2D79883D2000' }
                }
            };

            // MANUAL FIX FOR PASSPORT721 & LOYALTYPOINTS:
            // We force the correct CASM hash expected by the network (Infura).
            
            let forcedCasmHash;
            if (contractName.includes("Passport721")) {
                // Expected: 0x1cd98b471db6e2ed65d12af2b5f118a58a0c3560a60f615575c351bda9f93ee
                forcedCasmHash = "0x1cd98b471db6e2ed65d12af2b5f118a58a0c3560a60f615575c351bda9f93ee";
            } else if (contractName.includes("LoyaltyPoints")) {
                // Expected: 0x2085f131e4f79838f3546abefeadaa3f2007a13afc33b4a0615c875aa599788
                forcedCasmHash = "0x2085f131e4f79838f3546abefeadaa3f2007a13afc33b4a0615c875aa599788";
            }

            const declareResponse = await account.declare({
                contract: compiledSierra,
                casm: compiledCasm,
                compiledClassHash: forcedCasmHash 
            }, v3Details);
            
            console.log(`   ✅ Declare Tx Hash: ${declareResponse.transaction_hash}`);
            await account.waitForTransaction(declareResponse.transaction_hash);
            classHash = declareResponse.class_hash;
            
        } catch (error: any) {
            if (error.message.includes("is already declared") || error.message.includes("Class already declared")) {
                console.log("   ⚠️ Class already declared. Computing hash locally...");
                classHash = hash.computeContractClassHash(compiledSierra);
            } else {
                throw error;
            }
        }
        
        console.log(`   🔑 Class Hash: ${classHash}`);

        // 2. Deploy
        console.log(`   ⏳ Deploying instance...`);
        const myCallData = new CallData(compiledSierra.abi);
        const constructorCalldata = myCallData.compile("constructor", {
            owner: constructorArgs[0]
        });

        // Use same V3 details for deploy
        const deployOptions: any = {
             version: 3,
             resourceBounds: {
                l2_gas: { max_amount: '0xF4240', max_price_per_unit: '0x2D79883D2000' }, 
                l1_gas: { max_amount: '0x320', max_price_per_unit: '0x2D79883D2000' },
                l1_data_gas: { max_amount: '0x320', max_price_per_unit: '0x2D79883D2000' }
            }
        };

        const deployResponse = await account.deploy({
            classHash: classHash,
            constructorCalldata: constructorCalldata
        }, deployOptions);

        console.log(`   ✅ Deploy Tx Hash: ${deployResponse.transaction_hash}`);
        await account.waitForTransaction(deployResponse.transaction_hash);

        console.log(`   🎉 Contract Deployed at: ${deployResponse.contract_address}`);
        
        fs.appendFileSync(path.resolve(__dirname, "../../backend/.env"), `\nSTARKNET_${contractName.replace('enlivora_contracts_', '').toUpperCase()}_ADDRESS=${deployResponse.contract_address}`);
        
    } catch (error) {
        console.error(`   ❌ Failed to deploy ${contractName}:`, error);
    }
}

main();
