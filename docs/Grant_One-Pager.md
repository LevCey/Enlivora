# Enlivora Commerce Pass

**Starknet-native Product Passport + Loyalty Points + Optional USDC Rewards (Shopify/Woo plugin)**

## 1) Problem

Premium/limited boutiques and DTC brands struggle to scale because:

* **Trust / authenticity / resale:** Buyers hesitate (“Is this real?”) and brands lose control and credibility in resale markets.
* **Loyalty / repeat purchases:** Existing loyalty tools are fragmented, expensive, and hard to automate and measure.
* **Rewards / payments friction:** Cashback, deposits, and reward operations are manual and messy, creating inconsistent customer experiences.

## 2) Solution

**Enlivora Commerce Pass** adds an onchain “trust + loyalty” layer **without replacing the merchant’s existing store** (Shopify/Woo).

### A) Onchain Product Passport (Digital Twin)

* A **passport token** (NFT/serial) is created on Starknet for each product item
* After purchase, the buyer **claims** the passport
* The passport is **transferable** (provenance/ownership proof for resale)
* Merchant panel supports **mint / revoke / view**

### B) Onchain Loyalty Points + Optional USDC Rewards

* When an order is completed, the customer receives **non-transferable onchain points**
* Customers can optionally **redeem points for STRK** from a merchant-funded reward pool
* Wallet friction is minimized: wallet connection is needed **only at claim/redeem**, reducing UX and phishing risk

**No checkout replacement in MVP.** Shopify/Woo payments stay unchanged; we add a **passport + points + redeem** layer.

## 3) Why Starknet

* **Account Abstraction** enables “gasless / Web2-like” claim & redeem flows
* Onchain records make passport + loyalty **transparent, portable, and auditable**
* **STRK rails** enable a clear, measurable payments adoption narrative (rewards, deposits later)
* Directly maps to ecosystem KPIs: **transactions, active users, USDC flow**

## 4) Product Architecture (MVP)

* **Shopify App / Woo Plugin:** merchant installation, product mapping, order webhooks
* **Enlivora Cloud:** merchant dashboard, hosted passport pages, event indexing, analytics
* **Starknet Contracts:**

  * `Passport721` (mint/claim/transfer/revoke)
  * `LoyaltyPoints` (credit/debit + redeem gating)
  * `RewardsVault` (STRK reward pool + limits)

## 5) MVP Definition (smallest working demo) — Testnet Flow

1. Merchant clicks **Enable Passport** → mint on Starknet
2. Customer **Verify Passport** → view token data
3. Customer **Claim** → passport ownership transfers
4. Simulated `order/paid` → **points credited**
5. *(Optional)* **Redeem STRK** → payout from the reward vault

## 6) 8-Week Milestone Plan

* **W1–W2:** Contracts v1 + Sepolia deploy + basic verify/claim demo
* **W3–W4:** Shopify App MVP (products list + enable passport + order webhook)
* **W5–W6:** LoyaltyPoints + RewardsVault (STRK) + redeem UI + limits/refund handling
* **W7:** Pilot onboarding (≥1 merchant) + analytics + documentation
* **W8:** Mainnet readiness plan + security review checklist + grant KPI report

## 7) Success KPIs (Grant/VC-ready)

* **Pilot merchants onboarded:** 2–5
* **Passports minted/claimed/transferred:** target **200+ claims**
* **Points credits / redeems:** target **300+ points tx**, **50+ redeems**
* **STRK rewards distributed:** target **$200–$1,000** (testnet equivalent)
* **Activation → repeat purchase uplift:** baseline vs. post-launch (merchant-reported)

## 8) Go-to-Market (first 90 days)

* **Target ICP:** premium/limited accessories—jewelry, bags, shoes, niche luxury DTC
* **Distribution:** Shopify App (primary) + Woo adapter
* **Pricing tiers:**

  * **Starter:** Passport
  * **Growth:** Passport + Points
  * **Pro:** Passport + Points + USDC Rewards

## 9) Why Us / Proof

* Built and shipped **Enlivora Commerce Pass** with working Starknet Sepolia deployment
* Live demo: `https://pass.enlivora.com` | API: `https://api.enlivora.com`
* Repo: `https://github.com/LevCey/Enlivora`

## 10) Funding Ask (example)

* **Seed Grant request:** **$25k equivalent in STRK** (contracts + Shopify MVP + pilots + security)
* Use of funds:

  * **40%** engineering (contracts + app)
  * **20%** testing/security
  * **20%** pilot onboarding + support
  * **20%** infra + analytics + documentation

**Contact:** Levent / Enlivora — (email) — (telegram) — (demo link)

---

## Bonus: “application-ready” snippets

### 200-word short description

Enlivora Commerce Pass is a Starknet-native add-on for premium/limited boutiques and DTC brands, delivered as a Shopify app and Woo plugin. We help merchants scale by adding an onchain “trust + loyalty” layer without changing their existing checkout. Each product item can be minted as an onchain Product Passport (digital twin). After purchase, customers can verify and claim the passport, and transfer it later to prove provenance in resale. On top of this, Enlivora issues non-transferable onchain loyalty points based on completed orders. Customers can optionally redeem points for USDC from a merchant-funded reward pool, enabling a measurable stablecoin payments narrative. Starknet’s Account Abstraction enables a gasless, Web2-like user experience, reducing friction while creating consistent onchain activity (mint/claim/transfer, points credit, redeem). Our 8-week plan delivers a Sepolia testnet MVP, Shopify integration, pilots with 2–5 merchants, and mainnet readiness, with clear KPIs around merchant adoption, passport claims, points transactions, and USDC reward distribution.

### 5 Milestones

1. Deploy Passport721 on Sepolia + verify/claim demo
2. Shopify app MVP: product mapping + “Enable Passport”
3. LoyaltyPoints v1 + order-paid webhook crediting
4. RewardsVault STRK + redeem UI + limits
5. Pilot onboarding + analytics + mainnet readiness checklist

### 5 KPIs

* # merchants onboarded
* # passports claimed
* # passport transfers
* # points credits / # redeems
* $STRK rewards distributed

### Budget line items (USD)

* Engineering (contracts + Shopify app + backend): **$10,000**
* Testing + security review tools/audit prep: **$5,000**
* Pilot onboarding + support (merchant setup, docs): **$5,000**
* Infra + analytics + monitoring: **$5,000**
