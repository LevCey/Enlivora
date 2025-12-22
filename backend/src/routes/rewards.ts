import { Router } from 'express';
import { StarknetService } from '../services/starknet';

const router = Router();
const starknetService = new StarknetService();

// POST /rewards/redeem
router.post('/redeem', async (req, res) => {
    try {
        const { userAddress, pointsAmount, rewardToken, rewardAmount } = req.body;

        if (!userAddress || !pointsAmount || !rewardToken || !rewardAmount) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log(`Processing redeem request for ${userAddress}`);

        const result = await starknetService.redeemReward(
            userAddress,
            pointsAmount,
            rewardToken,
            rewardAmount
        );

        res.json({
            success: true,
            message: "Reward redeemed successfully",
            transactions: result
        });

    } catch (error: any) {
        console.error("Redeem endpoint error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
