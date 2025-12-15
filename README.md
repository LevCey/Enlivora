# Enlivora Commerce Pass

Starknet-native Product Passport + Loyalty Points system for Shopify/WooCommerce merchants.

## Project Structure

- **`contracts/`**: Starknet smart contracts (Cairo) managed with Scarb.
  - `src/passport_721.cairo`: The main Product Passport NFT contract.
- **`backend/`**: Node.js/Express backend for handling merchant auth and claiming logic.
- **`shopify-app/`**: Shopify App boilerplate (Remix/Node).
- **`frontend-passport/`**: Next.js app for the customer "Verify & Claim" pages.

## Getting Started

### 1. Contracts (Starknet)

Prerequisites: [Scarb](https://docs.swmansion.com/scarb/) and [Starkli](https://github.com/xJonathanLEI/starkli).

```bash
cd contracts

# Build the contract
scarb build

# Run tests
scarb test
```

To deploy to Sepolia, edit `scripts/deploy_sepolia.sh` with your wallet details and run it.

### 2. Backend (Enlivora Cloud)

Prerequisites: Node.js (v18+).

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The server will run at `http://localhost:3000`.

## Roadmap Phase 0 (Current)

- [x] Project scaffolding
- [x] Passport721 Contract implementation
- [x] Backend API skeleton
- [ ] Deploy to Sepolia Testnet
- [ ] Connect Backend to Starknet (using starknet.js)

See `SPEC.md` for the full specification.
