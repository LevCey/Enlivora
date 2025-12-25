import { RpcProvider, Contract } from 'starknet';

// Sepolia Testnet
export const PASSPORT_ADDRESS = '0x060691688c40f8b98fd8d23e9a2c9864ddece643cf195a095e8b9d6d54210839';
export const LOYALTY_ADDRESS = '0x0733ceef104572b040eef659f697a2d4931c13ac1446b103f0e0a9c4b7613841';

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
