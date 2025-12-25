import { Account, RpcProvider, cairo } from 'starknet';

const provider = new RpcProvider({ nodeUrl: 'https://starknet-sepolia.g.alchemy.com/v2/4ZrA3JnOqgWjIxeDdzuGN' });
const account = new Account({
  provider, 
  address: '0x0215fe25AA8fB847baBFf3c35aE6281C550c9decF17ec1D7b58f59b58B13f04c', 
  signer: '0x053a0b3eb86c432eacb06ee8fbadb101fdf4b0462e1ee39b3f1b4c822f06b335'
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
  console.log('Approve TX:', approveTx.transaction_hash);
  await provider.waitForTransaction(approveTx.transaction_hash);

  // 2. Deposit to vault
  console.log('Depositing to vault...');
  const depositTx = await account.execute({
    contractAddress: VAULT,
    entrypoint: 'deposit',
    calldata: [STRK, cairo.uint256(10n * 10n**18n)] // 10 STRK
  });
  console.log('Deposit TX:', depositTx.transaction_hash);
  await provider.waitForTransaction(depositTx.transaction_hash);
  
  console.log('Done! 10 STRK deposited to vault');
}

deposit().catch(console.error);
