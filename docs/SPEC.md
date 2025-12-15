# Enlivora Commerce Pass — Implementation Spec (MVP)

> **Focus:** This MVP is **Starknet-first**: Product Passport + Loyalty Points + (optional) USDC Rewards, delivered via a Shopify app / Woo plugin.

---

## 0) MVP Goal

Deliver a **working testnet (Sepolia) flow** that proves the core value and is grant-ready:

1. **Merchant enables Passport** for a product → **mint** on Starknet  
2. **Customer verifies** the Passport → reads token data  
3. **Customer claims** the Passport → ownership transfers  
4. *(Optional v1.1)* `order/paid` webhook → **credits points** onchain  
5. *(Optional v1.2)* **redeem USDC** from a merchant-funded vault

**Non-goal (MVP):** replacing Shopify/Woo checkout. Payments remain unchanged; we add an onchain layer.

---

## 1) System Architecture (High Level)

### Components

**A) Starknet Contracts (Cairo + Scarb)**
- `Passport721`: product passport NFT/digital twin  
- `LoyaltyPoints`: non-transferable points ledger (per merchant)  
- `RewardsVault`: Multi-token reward pool (USDC, STRK) + redeem (optional; phase 1.2)

**B) Enlivora Cloud (Backend API + DB)**
- merchant/store records (Shopify installs)
- product ↔ token mapping
- claim-code issuance + hosted passport pages
- basic event indexing + analytics
- *(later)* paymaster / sponsored gas (UX improvements)

**C) Shopify App (Admin UI + Webhooks + Theme Block)**
- OAuth install + embedded admin UI
- products list + “Enable Passport”
- webhooks: `orders/paid` (points), `refunds/*` (debit) *(optional)*
- storefront theme block: “Verify Passport” link/button

> **MVP target:** Shopify-first. Woo adapters can follow after the core works.

---

## 2) Repo / Folder Structure (Monorepo)

Recommended monorepo layout:

```text
enlivora/
  README.md
  SPEC.md
  .env.example

  contracts/
    Scarb.toml
    src/
      passport_721.cairo
      loyalty_points.cairo
      rewards_vault_usdc.cairo        # phase 1.2
      interfaces/
        ipassport.cairo
        iloyalty.cairo
        ierc20.cairo
      lib/
        access_control.cairo
        errors.cairo
        events.cairo
    scripts/
      deploy_sepolia.sh
      mint_demo.sh
    tests/
      passport_test.cairo
      loyalty_test.cairo

  backend/
    package.json
    src/
      index.ts
      config.ts
      db.ts
      routes/
        auth_shopify.ts
        merchants.ts
        products.ts
        passport.ts
        webhooks_shopify.ts
      services/
        shopify.ts
        starknet.ts
        claim_codes.ts
        signer.ts
      models/
        merchant.ts
        product.ts
        passport.ts
        points.ts
      jobs/
        index_events.ts                # optional
    prisma/
      schema.prisma
    migrations/

  shopify-app/
    package.json
    shopify.app.toml
    app/
      routes/
        app.tsx
        products.tsx
      components/
        EnablePassportButton.tsx
      lib/
        api.ts
        shopify.ts
        auth.ts
    extensions/
      theme-app-extension/
        blocks/
          passport-verify.liquid
      checkout-ui-extension/           # optional (later)
    web/
      public/

  frontend-passport/
    package.json
    app/
      (public)/
        v/[claimCode]/page.tsx
        claim/[claimCode]/page.tsx
        success/[tokenId]/page.tsx
      lib/
        api.ts
        starknet.ts
        security.ts
```

---

## 3) Contract Design (MVP)

### 3.1 `Passport721` (Core)

**Purpose:** One passport token per product instance (serial).

**Storage (minimum)**
- `merchant_admin: ContractAddress` — who can mint/revoke  
- `token_to_product_hash: Map<u256, felt252>` — hash of SKU/serial/materials, etc.  
- `token_status: Map<u256, u8>` — `0=active`, `1=revoked`  
- *(optional)* `token_uri_hash: Map<u256, felt252>`

**Functions**
- `mint(to: ContractAddress, token_id: u256, product_hash: felt252)`  
  - access: `onlyMerchantAdmin`
- `revoke(token_id: u256)`  
  - access: `onlyMerchantAdmin`
- `verify(token_id: u256)` (view)  
  - returns: `owner`, `status`, `product_hash`
- `claim(token_id: u256, to: ContractAddress)`  
  - MVP approach: token is initially minted to a **merchant escrow address**; customer claim triggers a transfer  
  - safer v2: claim requires a backend-signed permit (prevents link-sharing abuse)

**Events**
- `PassportMinted(token_id, to, product_hash)`
- `PassportRevoked(token_id)`
- `PassportClaimed(token_id, from, to)` *(or rely on ERC721 Transfer events + optional custom)*

---

### 3.2 `LoyaltyPoints` (Phase 1.1)

**Purpose:** Non-transferable points per merchant.

**Storage**
- `points_balance: Map<(merchantId, userAddr), u256>`
- `total_issued: Map<merchantId, u256>`
- `merchant_signer: Map<merchantId, felt252>` *(public key for signed credits)*  
- `nonce: Map<(merchantId, userAddr), u256>`

**Functions**
- `credit_with_sig(merchantId, userAddr, amount, orderHash, nonce, signature)`
- `debit_with_sig(merchantId, userAddr, amount, refundHash, nonce, signature)` *(refund handling)*
- `balance_of(merchantId, userAddr)` (view)

**Events**
- `PointsCredited(merchantId, user, amount, orderHash)`
- `PointsDebited(merchantId, user, amount, refundHash)`

> MVP shortcut: initially allow a backend admin role to credit/debit, then migrate to signature verification.

---

### 3.3 `RewardsVault` (Phase 1.2, Optional)

**Purpose:** Merchant funds a reward pool (USDC for stability, STRK for gas/ecosystem alignment). Customers redeem points for these tokens via signed permits.

**Storage**
- `supported_tokens: Map<ContractAddress, bool>` (whitelist: USDC, STRK)
- `merchant_pool_balance: Map<(merchantId, tokenAddr), u256>`
- `daily_cap: Map<(merchantId, tokenAddr), u256>`
- `used_nonces: Map<(merchantId, userAddr), u256>`
- `merchant_signer: Map<merchantId, felt252>`

**Functions**
- `deposit(merchantId, tokenAddr, amount)` — `IERC20.transferFrom(merchant, vault, amount)`
- `redeem_with_sig(merchantId, tokenAddr, user, amount, nonce, signature)`
- `withdraw(merchantId, tokenAddr, amount)` — only merchant admin

**Events**
- `RewardsDeposited(merchantId, token, amount)`
- `RewardsRedeemed(merchantId, user, token, amount)`
- `RewardsWithdrawn(merchantId, token, amount)`

---

## 4) Backend (Enlivora Cloud) — API Spec

### 4.1 Auth & Merchant
- `POST /auth/shopify/callback` — OAuth callback handler
- `GET /me` — current merchant profile

**DB (minimum tables)**
- `merchants`: `id`, `shop_domain`, `access_token`, `created_at`
- `products`: `id`, `merchant_id`, `shopify_product_id`, `sku`, `product_hash`
- `passports`: `id`, `merchant_id`, `product_id`, `token_id`, `contract_address`, `status`, `claim_code`, `created_at`
- `claims`: `claim_code`, `token_id`, `state` (`created|claimed|expired`), `expires_at`

### 4.2 Merchant Endpoints
- `GET /products` — fetch from Shopify + local mappings
- `POST /products/:shopifyProductId/enable-passport`
  - generates `token_id`, mints passport, creates `claim_code`, stores mapping
  - returns: `{ tokenId, claimUrl }`

### 4.3 Customer Endpoints (Hosted Passport Pages)
- `GET /passport/verify/:claimCode`
  - returns safe view model: product name, image, tokenId, status, official domain message
- `POST /passport/claim/:claimCode`
  - validates claimCode (single-use, not expired)
  - returns client params for wallet tx (contract address, tokenId, calldata)

### 4.4 Shopify Webhooks (Phase 1.1)
- `POST /webhooks/orders/paid`
  - compute points → call `credit` (admin or signature)
- `POST /webhooks/refunds/create`
  - call `debit` and enforce cooldowns

---

## 5) Shopify App — MVP Features

### Admin Screens
**1) Products**
- list products
- actions per row:
  - `Enable Passport`
  - `View Claim Link`
- show: tokenId, status

### Storefront Theme Block
- minimal UI on product page:
  - “Authenticity Passport available”
  - “Verify” link to hosted passport page (Enlivora domain)

### Security UX (Must-have)
- Do **not** email “Connect wallet” links
- Start claim flow from:
  - Shopify order status page, **or**
  - package QR (later)
- Passport pages must show:
  - official domain message
  - “We never ask for seed phrase/private key”

---

## 6) Development Order (Practical Checklist)

### Phase 0 (Today) — Grant-ready PoC
- [ ] Implement `Passport721` + tests
- [ ] Deploy to Sepolia (record contract address)
- [ ] Mint 1 demo token via script
- [ ] Build a minimal verify page reading `owner/status/product_hash`
- [ ] Add claim button (wallet connect + transfer)
- [ ] Record a 2–3 minute demo video + update README

### Phase 1 (MVP) — Shopify Integration
- [ ] Shopify app OAuth install
- [ ] Products list + Enable Passport
- [ ] Backend endpoint `enable-passport`
- [ ] Theme block “Verify Passport” link

### Phase 1.1 — Points (Onchain)
- [ ] `orders/paid` webhook → credit points
- [ ] `refunds/*` webhook → debit points
- [ ] Basic admin UI view points history

### Phase 1.2 — Rewards (USDC / STRK)
- [ ] Implement `RewardsVault` (Multi-Token)
- [ ] Merchant deposit flow (support both tokens)
- [ ] Customer redeem flow + limits

---

## 7) Risks & Minimum Security Controls (MVP)

- `claim_code` must be **single-use** and **expiring**
- Verify/claim pages must show clear **anti-phishing** messaging and official domain
- Verify Shopify webhooks using HMAC signature
- Refund events must reverse points (or apply cooldown)
- Reward redeem (USDC/STRK) must include:
  - daily/monthly cap
  - cooldown period
  - nonces to prevent replay

---

## 8) Definition of Done (MVP)

MVP is considered complete when:
- Contract deployed on Sepolia + explorer link documented
- Shopify app can “Enable Passport” for a product → mint happens onchain
- Customer verify page shows the correct token data
- Customer can claim the passport (ownership changes)
- README contains: demo link, contract addresses, setup instructions
