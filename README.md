# Enlivora Commerce Pass

Enlivora Commerce Pass is a Starknet-native infrastructure that enables Shopify and WooCommerce merchants to issue digital product passports and onchain loyalty points. It bridges traditional e-commerce with blockchain transparency without disrupting the user checkout experience.

## Overview

This repository contains the full monorepo implementation of the Enlivora MVP. The system consists of three main components:

1.  **Starknet Smart Contracts:** Manages product authenticity (NFTs) and loyalty points.
2.  **Enlivora Cloud (Backend):** A Node.js middleware that orchestrates interactions between Shopify webhooks and the Starknet blockchain.
3.  **Shopify App:** An embedded admin dashboard for merchants to manage passports and view loyalty data.

## Project Structure

*   `contracts/`: Starknet smart contracts (Cairo) managed with Scarb.
    *   `Passport721`: ERC721-based product digital twin.
    *   `LoyaltyPoints`: Non-transferable token system for customer rewards.
*   `backend/`: Node.js/Express API service.
    *   Handles Shopify OAuth and Webhooks (`orders/paid`).
    *   Manages Starknet transaction signing (Minting/Crediting).
*   `shopify-app/`: Remix-based Shopify Admin application.
*   `frontend-passport/`: Next.js application for the customer-facing "Verify & Claim" interface.
*   `docs/`: Project specifications and grant proposals.

## Prerequisites

*   **Node.js**: v18 or higher
*   **Scarb**: Cairo package manager (for contract compilation)
*   **Starkli**: Starknet CLI tool (for deployment)
*   **Starknet Wallet**: Argent X or Braavos (for testing claims)

## Installation & Setup

### 1. Smart Contracts

Navigate to the contracts directory to build and test the Cairo contracts.

```bash
cd contracts
scarb build
scarb test
```

To deploy to the Sepolia testnet, configure your wallet in `scripts/deploy_sepolia.sh` and run the script.

### 2. Backend Service

The backend requires a connection to both Shopify (API Keys) and Starknet (RPC & Private Key).

```bash
cd backend
cp .env.example .env
# Edit .env with your specific configuration
npm install
npm run dev
```

### 3. Frontend Applications

Install dependencies for the Passport claim interface and the Shopify app.

```bash
# Passport Interface
cd frontend-passport
npm install
npm run dev

# Shopify Admin App
cd ../shopify-app
npm install
npm run dev
```

## Architecture Details

### Product Passport Flow
1.  Merchant clicks "Enable Passport" in the Shopify Admin.
2.  Backend generates a unique token ID and mints a `Passport721` NFT on Starknet to the merchant's escrow.
3.  A unique claim link is generated for the product.
4.  Customer receives the product, scans the QR code/link, and claims the NFT to their personal wallet.

### Loyalty System
1.  Customer completes a purchase on Shopify.
2.  Shopify sends an `orders/paid` webhook to the Enlivora Backend.
3.  Backend calculates points (e.g., 10 points per $1) and calls the `credit_points` function on the `LoyaltyPoints` contract.

## Documentation

For detailed technical specifications and the project roadmap, please refer to the `docs/` directory:
*   [Implementation Spec (MVP)](docs/SPEC.md)
*   [Grant One-Pager](docs/Grant_One-Pager.md)

## License

MIT