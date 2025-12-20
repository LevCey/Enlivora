const { ethers } = require('ethers');
const fs = require('fs');

async function extract() {
    try {
        const keystorePath = '/home/levent/.starkli-wallets/deployer/keystore.json';
        const password = 'iamwinner';
        
        if (!fs.existsSync(keystorePath)) {
            console.error("❌ Keystore dosyası bulunamadı!");
            return;
        }

        const json = fs.readFileSync(keystorePath).toString();
        
        console.log("Decrypting keystore...");
        const wallet = await ethers.Wallet.fromEncryptedJson(json, password);
        
        console.log("\n🔑 İŞTE PRIVATE KEY'İNİZ (Bunu kopyalayın):");
        console.log(wallet.privateKey);
        console.log("\n⚠️ Bu key'i kimseyle paylaşmayın!");
        console.log("Address:", wallet.address);

    } catch (error) {
        console.error("❌ Hata:", error.message);
    }
}

extract();