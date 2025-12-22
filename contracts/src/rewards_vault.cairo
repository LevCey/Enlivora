#[starknet::contract]
mod RewardsVault {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        // Tracks how much of a specific token is available in the vault
        // Map<TokenAddress, Balance>
        vault_balance: LegacyMap<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        Deposit: Deposit,
        Redeem: Redeem,
        Withdraw: Withdraw
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        token: ContractAddress,
        amount: u256,
        depositor: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct Redeem {
        token: ContractAddress,
        recipient: ContractAddress,
        amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct Withdraw {
        token: ContractAddress,
        recipient: ContractAddress,
        amount: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        
        // --- Merchant Functions ---

        #[external(v0)]
        fn deposit(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            // Determine who is depositing (likely the merchant admin)
            let caller = get_caller_address();
            let this_contract = get_contract_address();

            // Transfer tokens FROM caller TO this contract
            // Caller must have approved this contract beforehand!
            let token = IERC20Dispatcher { contract_address: token_address };
            token.transfer_from(caller, this_contract, amount);

            // Update internal tracking
            let current_balance = self.vault_balance.read(token_address);
            self.vault_balance.write(token_address, current_balance + amount);

            self.emit(Deposit { token: token_address, amount, depositor: caller });
        }

        #[external(v0)]
        fn withdraw(ref self: ContractState, token_address: ContractAddress, amount: u256) {
            // Only owner can withdraw funds back
            self.ownable.assert_only_owner();
            
            let caller = get_caller_address(); // Owner
            let current_balance = self.vault_balance.read(token_address);
            assert(current_balance >= amount, 'Insufficient vault balance');

            let token = IERC20Dispatcher { contract_address: token_address };
            token.transfer(caller, amount);

            self.vault_balance.write(token_address, current_balance - amount);
            self.emit(Withdraw { token: token_address, recipient: caller, amount });
        }

        // --- Admin/Backend Action ---

        #[external(v0)]
        fn redeem_rewards(
            ref self: ContractState, 
            token_address: ContractAddress, 
            recipient: ContractAddress, 
            amount: u256
        ) {
            // Only backend (owner) can trigger a payout
            self.ownable.assert_only_owner();

            let current_balance = self.vault_balance.read(token_address);
            assert(current_balance >= amount, 'Insufficient funds for reward');

            // Send tokens to the user
            let token = IERC20Dispatcher { contract_address: token_address };
            token.transfer(recipient, amount);

            // Update balance
            self.vault_balance.write(token_address, current_balance - amount);

            self.emit(Redeem { token: token_address, recipient, amount });
        }

        // --- View ---

        #[external(v0)]
        fn get_vault_balance(self: @ContractState, token_address: ContractAddress) -> u256 {
            self.vault_balance.read(token_address)
        }
    }
}
