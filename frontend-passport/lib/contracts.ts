import { RpcProvider, Contract } from 'starknet';

// Sepolia Testnet
export const PASSPORT_ADDRESS = '0x06aba07f78f114a0d554605928d25a4994cc48c57c0ee5a77fa52f68ffa7b54d';
export const LOYALTY_ADDRESS = '0x06873cd3080ec8e7789fd7770239e38ffffcdd1ca22486edd0b1d64edda21af9';

export const provider = new RpcProvider({ 
  nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://rpc.starknet-testnet.lava.build' 
});

// Minimal ABI for read operations
const PASSPORT_ABI = [
  {
    name: 'get_passport_data',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'core::integer::u256' }],
    outputs: [{ type: '(core::felt252, core::bool)' }],
    state_mutability: 'view',
  },
  {
    name: 'owner_of',
    type: 'function', 
    inputs: [{ name: 'token_id', type: 'core::integer::u256' }],
    outputs: [{ type: 'core::starknet::contract_address::ContractAddress' }],
    state_mutability: 'view',
  },
] as const;

export const passportContract = new Contract(PASSPORT_ABI, PASSPORT_ADDRESS, provider);

export async function getPassportData(tokenId: string) {
  try {
    const [productHash, isRevoked] = await passportContract.get_passport_data({ low: tokenId, high: '0' });
    const owner = await passportContract.owner_of({ low: tokenId, high: '0' });
    return { productHash: productHash.toString(), isRevoked, owner: '0x' + owner.toString(16) };
  } catch {
    return null;
  }
}
