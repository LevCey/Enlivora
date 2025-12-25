import { Router } from 'express';

const router = Router();

// GET /passport/:tokenId - NFT Metadata (ERC721 standard)
router.get('/:tokenId', (req, res) => {
    const { tokenId } = req.params;

    const metadata = {
        name: `Enlivora Passport #${tokenId}`,
        description: "Digital Product Passport - Verify authenticity on Starknet blockchain",
        image: "https://pass.enlivora.com/genesis-card.jpg",
        external_url: `https://pass.enlivora.com/verify/${tokenId}`,
        attributes: [
            { trait_type: "Status", value: "Active" },
            { trait_type: "Network", value: "Starknet" },
            { trait_type: "Type", value: "Product Passport" }
        ]
    };

    res.json(metadata);
});

export default router;
