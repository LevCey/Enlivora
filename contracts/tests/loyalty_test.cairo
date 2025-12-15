#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};

    #[starknet::interface]
    trait ILoyaltyPoints<TContractState> {
        fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
        fn credit_points(ref self: TContractState, recipient: ContractAddress, amount: u256, reason_hash: felt252);
        fn debit_points(ref self: TContractState, user: ContractAddress, amount: u256, reward_id: felt252);
    }

    fn deploy_loyalty() -> ContractAddress {
        let contract = declare("LoyaltyPoints").unwrap().contract_class();
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();
        let (contract_address, _) = contract.deploy(@array![owner.into()]).unwrap();
        contract_address
    }

    #[test]
    fn test_credit_points() {
        let contract_address = deploy_loyalty();
        let dispatcher = ILoyaltyPointsDispatcher { contract_address };
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();

        start_cheat_caller_address(contract_address, owner);

        let user: ContractAddress = starknet::contract_address_const::<0x456>();
        let amount: u256 = 100;
        let reason: felt252 = 'order_1';

        // 1. Credit Points
        dispatcher.credit_points(user, amount, reason);

        // 2. Check Balance
        let balance = dispatcher.balance_of(user);
        assert(balance == 100, 'Balance mismatch after credit');

        stop_cheat_caller_address(contract_address);
    }

    #[test]
    fn test_debit_points() {
        let contract_address = deploy_loyalty();
        let dispatcher = ILoyaltyPointsDispatcher { contract_address };
        let owner: ContractAddress = starknet::contract_address_const::<0x123>();

        start_cheat_caller_address(contract_address, owner);

        let user: ContractAddress = starknet::contract_address_const::<0x456>();
        
        // Setup: Credit 100 points first
        dispatcher.credit_points(user, 100, 'setup');
        
        // Action: Debit 40 points
        dispatcher.debit_points(user, 40, 'reward_redemption');

        // Check Balance
        let balance = dispatcher.balance_of(user);
        assert(balance == 60, 'Balance mismatch after debit');

        stop_cheat_caller_address(contract_address);
    }
}
