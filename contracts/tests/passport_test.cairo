#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};

    // Define the interface locally for testing purposes
    // In a real project, this would be imported from src/interfaces/ipassport.cairo
    #[starknet::interface]
    trait IPassport721<TContractState> {
        fn mint_passport(ref self: TContractState, recipient: ContractAddress, token_id: u256, product_hash: felt252);
        fn revoke_passport(ref self: TContractState, token_id: u256);
        fn get_passport_data(self: @TContractState, token_id: u256) -> (felt252, bool);
    }

    fn deploy_contract(name: ByteArray) -> ContractAddress {
        let contract = declare(name).unwrap().contract_class();
        // Deploy with the current contract address as owner (admin)
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();
        let (contract_address, _) = contract.deploy(@array![owner.into()]).unwrap();
        contract_address
    }

    #[test]
    fn test_mint_and_verify() {
        let contract_address = deploy_contract("Passport721");
        let dispatcher = IPassport721Dispatcher { contract_address };
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();

        // Start acting as the owner
        start_cheat_caller_address(contract_address, owner);

        let recipient: ContractAddress = starknet::contract_address_const::<0x456>();
        let token_id: u256 = 1;
        let product_hash: felt252 = 'metadata_hash_123';

        // 1. Mint Passport
        dispatcher.mint_passport(recipient, token_id, product_hash);

        // 2. Verify Data
        let (hash, is_revoked) = dispatcher.get_passport_data(token_id);
        
        assert(hash == product_hash, 'Product hash mismatch');
        assert(is_revoked == false, 'Should not be revoked');

        stop_cheat_caller_address(contract_address);
    }

    #[test]
    fn test_revoke() {
        let contract_address = deploy_contract("Passport721");
        let dispatcher = IPassport721Dispatcher { contract_address };
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();

        start_cheat_caller_address(contract_address, owner);

        let recipient: ContractAddress = starknet::contract_address_const::<0x456>();
        let token_id: u256 = 2;
        let product_hash: felt252 = 'hash_2';

        // Mint first
        dispatcher.mint_passport(recipient, token_id, product_hash);

        // Revoke
        dispatcher.revoke_passport(token_id);

        // Check status
        let (_, is_revoked) = dispatcher.get_passport_data(token_id);
        assert(is_revoked == true, 'Should be revoked');

        stop_cheat_caller_address(contract_address);
    }
}
