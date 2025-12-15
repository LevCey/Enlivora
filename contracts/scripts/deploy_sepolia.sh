#!/bin/bash
# Basic deployment script for Starknet Sepolia using Starkli

echo "Deploying Enlivora Passport to Sepolia..."

# 1. Declare the class
# starkli declare target/dev/enlivora_contracts_Passport721.contract_class.json

# 2. Deploy the contract (Constructor args: owner_address)
# OWNER_ADDR="0x..."
# starkli deploy <CLASS_HASH> $OWNER_ADDR

echo "Please update the script with your actual wallet/rpc details."
