#[starknet::contract]
mod LoyaltyPoints {
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::ERC20Component;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::IERC20Metadata;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    
    // We only expose view functions from ERC20 (balanceOf, etc.)
    // We DO NOT expose transfer/transferFrom to make it non-transferable (SBT-like)
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        PointsCredited: PointsCredited,
        PointsRedeemed: PointsRedeemed,
    }

    #[derive(Drop, starknet::Event)]
    struct PointsCredited {
        user: ContractAddress,
        amount: u256,
        reason_hash: felt252 // e.g. Order ID hash
    }

    #[derive(Drop, starknet::Event)]
    struct PointsRedeemed {
        user: ContractAddress,
        amount: u256,
        reward_id: felt252
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "Enlivora Loyalty";
        let symbol = "ELP";
        
        self.erc20.initializer(name, symbol);
        self.ownable.initializer(owner);
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        
        // --- View Functions ---

        #[external(v0)]
        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc20.balance_of(account)
        }

        // --- Admin Actions (Called by Backend) ---

        #[external(v0)]
        fn credit_points(
            ref self: ContractState, 
            recipient: ContractAddress, 
            amount: u256, 
            reason_hash: felt252
        ) {
            self.ownable.assert_only_owner();
            self.erc20.mint(recipient, amount);
            self.emit(PointsCredited { user: recipient, amount, reason_hash });
        }

        #[external(v0)]
        fn debit_points(
            ref self: ContractState, 
            user: ContractAddress, 
            amount: u256, 
            reward_id: felt252
        ) {
            // Used when a user redeems a reward via the app
            self.ownable.assert_only_owner();
            self.erc20.burn(user, amount);
            self.emit(PointsRedeemed { user, amount, reward_id });
        }
    }
}
