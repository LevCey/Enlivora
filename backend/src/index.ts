import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhooks_shopify';
import { StarknetService } from './services/starknet';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Register Routes
app.use('/webhooks', webhookRouter);

app.get('/', (req, res) => {
  res.send('Enlivora Cloud Backend API');
});

// Merchant Auth (Placeholder)
app.post('/auth/shopify/callback', (req, res) => {
  res.json({ message: 'Auth callback received' });
});

import { StarknetService } from './services/starknet';

const starknetService = new StarknetService();

// Enable Passport for a product
app.post('/products/:productId/enable-passport', async (req, res) => {
  const { productId } = req.params;
  
  try {
      // 1. Generate a unique Token ID (In production, map this to DB ID)
      // Using a random number for MVP demo purposes
      const tokenId = Math.floor(Math.random() * 1000000).toString();
      
      // 2. Hash of the product metadata (Mock for now)
      // In real app: hash(SKU + Name + ImageURL)
      const productHash = "0x123456789abcdef"; 

      // 3. Trigger Mint on Starknet
      const txHash = await starknetService.mintPassport(tokenId, productHash);

      // 4. Generate Claim Link
      // In production, save tokenId + claimCode to DB here
      const claimCode = `claim-${tokenId}`; 

      res.json({ 
        success: true,
        productId,
        tokenId,
        txHash,
        claimUrl: `https://enlivora.com/claim/${claimCode}` 
      });

  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
