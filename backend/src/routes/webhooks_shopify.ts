import { Router } from 'express';
import { StarknetService } from '../services/starknet';

const router = Router();
const starknetService = new StarknetService();

// Webhook: orders/paid
router.post('/orders/paid', async (req, res) => {
    try {
        const order = req.body;
        console.log(`Webhook received: Order ${order.id} paid. Total: ${order.total_price}`);

        // 1. Identify User Wallet
        // In a real app, we look up the user's wallet address from our DB 
        // using order.email or order.customer.id.
        // For MVP, we'll check if the customer added their wallet as a "Note" or "Custom Attribute".
        // MOCK: using a hardcoded wallet if none found, or extracting from note.
        const userWallet = order.note_attributes?.find((a: any) => a.name === "starknet_wallet")?.value 
                           || "0x0123...mock_user_wallet"; 

        if (!userWallet || userWallet.length < 10) {
            console.log("No wallet address found for this order. Skipping loyalty points.");
            return res.status(200).send("No wallet linked");
        }

        // 2. Calculate Points
        // Rule: 1 USD = 10 Points
        const points = Math.floor(parseFloat(order.total_price) * 10);

        // 3. Credit Points on Starknet
        // This is async; we don't wait for block confirmation to reply to Shopify
        starknetService.creditPoints(userWallet, points, order.id.toString())
            .then(tx => console.log(`Points credited. Tx: ${tx}`))
            .catch(err => console.error("Points credit failed:", err));

        res.status(200).send("Webhook processed");

    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Server Error");
    }
});

export default router;
