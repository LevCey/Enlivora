#!/bin/bash

# Load environment variables from backend/.env
if [ -f ../backend/.env ]; then
  export $(grep -v '^#' ../backend/.env | xargs)
fi

OWNER_ADDRESS="${MERCHANT_ACCOUNT_ADDRESS}" 
PRIVATE_KEY="${MERCHANT_PRIVATE_KEY}"
RPC_URL="${STARKNET_RPC_URL}"
ACCOUNT_FILE="../temp_account.json"

if [ -z "$OWNER_ADDRESS" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "Error: MERCHANT_ACCOUNT_ADDRESS or MERCHANT_PRIVATE_KEY is not set in backend/.env"
  exit 1
fi

echo "----------------------------------------------------------------"
echo "🚀 Deploying RewardsVault Contract to Starknet Sepolia..."
echo "Owner/Admin will be: $OWNER_ADDRESS"
echo "RPC: $RPC_URL"
echo "----------------------------------------------------------------"

# 1. Build
echo "Building contracts..."
scarb build

SIERRA_FILE="target/dev/enlivora_contracts_RewardsVault.contract_class.json"
CASM_FILE="target/dev/enlivora_contracts_RewardsVault.compiled_contract_class.json"

# 2. Declare
echo "Declaring RewardsVault class..."
# Let starkli handle the CASM compilation to ensure hash match with the network
DECLARE_OUTPUT=$(starkli declare "$SIERRA_FILE" --account "$ACCOUNT_FILE" --private-key "$PRIVATE_KEY" --rpc "$RPC_URL" --watch 2>&1)
echo "$DECLARE_OUTPUT"

# Extract Class Hash
if echo "$DECLARE_OUTPUT" | grep -q "Class hash declared:"; then
    CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep "Class hash declared:" | awk '{print $4}')
elif echo "$DECLARE_OUTPUT" | grep -q "already declared"; then
    echo "⚠️  Class already declared. Computing hash..."
    CLASS_HASH=$(starkli class-hash "$CASM_FILE")
    # starkli class-hash on CASM file gives the compiled class hash, we need the Class Hash (Sierra Hash)
    # Actually, for deploy we need the Class Hash. 
    CLASS_HASH=$(starkli class-hash "$SIERRA_FILE")
fi

# Fallback extraction if above logic missed
if [ -z "$CLASS_HASH" ]; then
     CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oP '0x[0-9a-fA-F]+' | head -n 1)
fi

echo "✅ Using Class Hash: $CLASS_HASH"

if [ -z "$CLASS_HASH" ]; then
    echo "❌ Failed to get Class Hash."
    exit 1
fi

# 3. Deploy
echo "Deploying contract..."
DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" "$OWNER_ADDRESS" --account "$ACCOUNT_FILE" --private-key "$PRIVATE_KEY" --rpc "$RPC_URL" --watch 2>&1)
echo "$DEPLOY_OUTPUT"

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "The contract will be deployed at address" | awk '{print $7}')

if [ -z "$CONTRACT_ADDRESS" ]; then
     # Try capturing from final output line if different
     CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP '0x[0-9a-fA-F]+' | tail -n 1)
fi

# Final Check
if [ -z "$CONTRACT_ADDRESS" ] || [[ "$CONTRACT_ADDRESS" != 0x* ]]; then
    echo "❌ Deployment failed or could not capture address."
    exit 1
fi

echo "----------------------------------------------------------------"
echo "✅ Deployment Complete!"
echo "RewardsVault Address: $CONTRACT_ADDRESS"
echo "----------------------------------------------------------------"

# Update backend/.env
if grep -q "REWARDS_CONTRACT_ADDRESS" ../backend/.env; then
  sed -i "s/REWARDS_CONTRACT_ADDRESS=.*/REWARDS_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"/" ../backend/.env
else
  echo "REWARDS_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"" >> ../backend/.env
fi

echo "👉 Updated backend/.env with new address."
