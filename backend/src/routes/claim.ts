import { Router } from 'express';
import { StarknetService } from '../services/starknet';

const router = Router();
const starknetService = new StarknetService();

// POST /claim/:tokenId
router.post('/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: "walletAddress required" });
        }

        console.log(`Claim request: Token #${tokenId} to ${walletAddress}`);

        const txHash = await starknetService.transferPassport(tokenId, walletAddress);

        res.json({
            success: true,
            tokenId,
            newOwner: walletAddress,
            txHash
        });
    } catch (error: any) {
        console.error("Claim error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
