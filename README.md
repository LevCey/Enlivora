# Enlivora Commerce Pass

Enlivora Commerce Pass is a Starknet-native infrastructure designed to bridge traditional e-commerce with blockchain transparency. It enables Shopify and WooCommerce merchants to issue digital product passports (NFTs) and onchain loyalty points without disrupting the existing user checkout experience.

## Problem & Solution

Premium boutiques and Direct-to-Consumer (DTC) brands face significant challenges in scaling due to lack of trust in resale markets and fragmented loyalty systems.

*   **Problem:** Buyers hesitate to purchase premium items due to authenticity concerns ("Is this real?"). Brands lose visibility and control once a product enters the secondary market.
*   **Solution:** Enlivora creates an onchain "Digital Twin" for each physical product. This passport proves authenticity and ownership history. Additionally, an onchain loyalty system rewards customers with non-transferable points that can be redeemed for USDC or STRK, creating a verifiable and portable rewards ecosystem.

## Key Features

*   **Product Passport (ERC-721):** A mintable digital asset linked to physical inventory. Supports ownership transfer and revocation by the issuer.
*   **Loyalty Ledger (Non-transferable Token):** An onchain points system where merchants can credit points based on fiat purchases (e.g., 10 points per $1).
*   **Shopify Integration:** A native Shopify App that listens to `orders/paid` webhooks to automate minting and point crediting.
*   **Multi-Token Rewards:** A flexible vault system allowing customers to redeem points for stablecoins (USDC) or network tokens (STRK).
*   **Gasless Experience:** Designed with Account Abstraction in mind to minimize Web3 friction for end-users.

## System Architecture

The system operates as a middleware between the Web2 e-commerce platform and the Starknet Layer 2 validity rollup.

```text
+----------------+       +--------------------+       +-------------------------+
|  E-Commerce    |       |   Enlivora Cloud   |       |    Starknet (L2)        |
| (Shopify/Woo)  |       |   (Node.js API)    |       |                         |
+----------------+       +--------------------+       +-------------------------+
|                |       |                    |       |                         |
|  Order Paid    | ----> |  Webhook Handler   | ----> |  LoyaltyPoints.cairo    |
|   (Webhook)    |       |   (Calculate Pts)  |       |    (Credit Points)      |
|                |       |                    |       |                         |
|  "Enable Pass" | ----> |  Mint Service      | ----> |  Passport721.cairo      |
|   (Admin UI)   |       |   (Sign Tx)        |       |    (Mint Token)         |
|                |       |                    |       |                         |
+----------------+       +--------------------+       +-------------------------+
                                   |
                                   v
                         +--------------------+
                         |  Customer Frontend |
                         | (Next.js / Wallet) |
                         +--------------------+
```

## Project Structure

This repository follows a monorepo structure:

*   `contracts/`: Starknet smart contracts written in Cairo (managed with Scarb).
*   `backend/`: Node.js/Express service for off-chain logic and transaction signing.
*   `shopify-app/`: Remix-based embedded application for the merchant admin panel.
*   `frontend-passport/`: Next.js application for customers to verify and claim their digital assets.
*   `docs/`: Detailed specifications and grant proposals.

## Prerequisites

*   **Node.js**: v18.0.0 or higher
*   **Scarb**: Cairo package manager (v2.4+)
*   **Starkli**: Starknet CLI tool
*   **Starknet Wallet**: Argent X or Braavos

## Installation & Development

### 1. Smart Contracts

Navigate to the contracts directory to build and test the Cairo contracts.

```bash
cd contracts
scarb build
scarb test
```

To deploy to the Sepolia testnet, ensure you have a funded Starknet account and configure the deployment scripts in `backend/scripts/`.

### 2. Backend Service

The backend acts as the bridge. It requires configuration for both the blockchain provider and the e-commerce platform.

```bash
cd backend
cp .env.example .env
# Edit .env with your Starknet Private Key and RPC URL
npm install
npm run dev
```

### 3. Frontend Applications

Install dependencies for the customer-facing interface and the merchant dashboard.

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

## Documentation

For a deeper dive into the technical implementation and roadmap, please refer to the `docs/` directory:
*   [Implementation Spec (MVP)](docs/SPEC.md)
*   [Grant Proposal One-Pager](docs/Grant_One-Pager.md)

## License

MIT
