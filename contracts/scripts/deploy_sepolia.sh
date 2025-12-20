#!/bin/bash
set -e

# Load environment variables if .env exists
if [ -f ../backend/.env ]; then
    echo "Loading env from backend/.env..."
    export $(grep -v '^#' ../backend/.env | xargs)
fi

# Check for required tools
if ! command -v starkli &> /dev/null; then
    echo "Error: starkli is not installed."
    exit 1
fi

if ! command -v scarb &> /dev/null; then
    echo "Error: scarb is not installed."
    exit 1
fi

# Build contracts using specific Scarb version
echo "Building contracts with Scarb v2.11.0..."
/home/levent/.local/bin/scarb build

# Check if RPC and Account are set
# We will use --network sepolia which uses default integration RPCs
if [ -z "$STARKNET_RPC" ]; then
    echo "Info: STARKNET_RPC is not set. Will use --network sepolia flag."
fi

if [ -z "$STARKNET_ACCOUNT" ] || [ -z "$STARKNET_KEYSTORE" ]; then
    echo "Error: STARKNET_ACCOUNT and STARKNET_KEYSTORE environment variables must be set."
    echo "Example:"
    echo "export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json"
    echo "export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json"
    exit 1
fi

echo "Using Account: $STARKNET_ACCOUNT"

# Get the signer address (owner) from the account file
# Assuming standard starkli JSON format, usually we can get address from `starkli account` command or just use the user input
# For automation, we'll try to extract it or ask user to provide OWNER_ADDRESS env var.
if [ -z "$OWNER_ADDRESS" ]; then
    echo "Extracting address from account file..."
    OWNER_ADDRESS=$(cat $STARKNET_ACCOUNT | grep -o '"deployment": *{[^}]*"address": *"[^"]*"' | grep -o '"address": *"[^"]*"' | cut -d'"' -f4)
    if [ -z "$OWNER_ADDRESS" ]; then
         # Try another format or fallback
         OWNER_ADDRESS=$(cat $STARKNET_ACCOUNT | grep -o '"address": *"[^"]*"' | head -n 1 | cut -d'"' -f4)
    fi
    
    if [ -z "$OWNER_ADDRESS" ]; then
        echo "Could not auto-detect owner address. Please run:"
        echo "export OWNER_ADDRESS=<your_account_address>"
        exit 1
    fi
fi

echo "Deploying with Owner Address: $OWNER_ADDRESS"

# --- Deploy Passport721 ---
echo "----------------------------------------------------------------"
echo "Declaring Passport721..."
PASSPORT_CLASS_HASH=$(starkli declare target/dev/enlivora_contracts_Passport721.contract_class.json --network sepolia)
echo "Passport721 Class Hash: $PASSPORT_CLASS_HASH"

echo "Deploying Passport721..."
PASSPORT_ADDR=$(starkli deploy $PASSPORT_CLASS_HASH $OWNER_ADDRESS --network sepolia)
echo "✅ Passport721 Deployed at: $PASSPORT_ADDR"


# --- Deploy LoyaltyPoints ---
echo "----------------------------------------------------------------"
echo "Declaring LoyaltyPoints..."
LOYALTY_CLASS_HASH=$(starkli declare target/dev/enlivora_contracts_LoyaltyPoints.contract_class.json --network sepolia)
echo "LoyaltyPoints Class Hash: $LOYALTY_CLASS_HASH"

echo "Deploying LoyaltyPoints..."
LOYALTY_ADDR=$(starkli deploy $LOYALTY_CLASS_HASH $OWNER_ADDRESS --network sepolia)
echo "✅ LoyaltyPoints Deployed at: $LOYALTY_ADDR"

echo "----------------------------------------------------------------"
echo "Deployment Complete!"
echo "Please save these addresses to your backend/.env file:"
echo ""
echo "STARKNET_PASSPORT_ADDRESS=$PASSPORT_ADDR"
echo "STARKNET_LOYALTY_ADDRESS=$LOYALTY_ADDR"