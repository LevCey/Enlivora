import { Account, RpcProvider, cairo } from 'starknet';

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
const account = new Account({
  provider, 
  address: process.env.MERCHANT_ACCOUNT_ADDRESS!, 
  signer: process.env.MERCHANT_PRIVATE_KEY!
});

const STRK = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const VAULT = '0x02d647fa20fbe4cd177364953bf1b7057135f5712380c1477fb4328f1c67fc96';

async function deposit() {
  // 1. Approve vault to spend STRK
  console.log('Approving vault...');
  const approveTx = await account.execute({
    contractAddress: STRK,
    entrypoint: 'approve',
    calldata: [VAULT, cairo.uint256(10n * 10n**18n)] // 10 STRK
  });
  await provider.waitForTransaction(approveTx.transaction_hash);
  console.log('Approved:', approveTx.transaction_hash);

  // 2. Deposit to vault
  console.log('Depositing to vault...');
  const depositTx = await account.execute({
    contractAddress: VAULT,
    entrypoint: 'deposit',
    calldata: [STRK, cairo.uint256(10n * 10n**18n)]
  });
  await provider.waitForTransaction(depositTx.transaction_hash);
  console.log('Deposited:', depositTx.transaction_hash);
}

deposit().catch(console.error);
