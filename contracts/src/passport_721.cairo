#[starknet::contract]
mod Passport721 {
    use starknet::ContractAddress;
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Required for v0.20.0+
    impl ERC721HooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {}

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        
        // Custom storage
        token_product_hash: Map<u256, felt252>,
        token_revoked: Map<u256, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        PassportMinted: PassportMinted,
        PassportRevoked: PassportRevoked,
    }

    #[derive(Drop, starknet::Event)]
    struct PassportMinted {
        token_id: u256,
        recipient: ContractAddress,
        product_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PassportRevoked {
        token_id: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "Enlivora Passport";
        let symbol = "ENL";
        let base_uri = "https://api.enlivora.com/passport/";

        self.erc721.initializer(name, symbol, base_uri);
        self.ownable.initializer(owner);
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn mint_passport(
            ref self: ContractState, 
            recipient: ContractAddress, 
            token_id: u256, 
            product_hash: felt252
        ) {
            // Only owner (merchant backend) can mint
            self.ownable.assert_only_owner();
            
            // Mint the token
            self.erc721.mint(recipient, token_id);
            
            // Store product metadata hash
            self.token_product_hash.write(token_id, product_hash);
            
            // Emit event
            self.emit(PassportMinted { token_id, recipient, product_hash });
        }

        #[external(v0)]
        fn revoke_passport(ref self: ContractState, token_id: u256) {
            self.ownable.assert_only_owner();
            self.token_revoked.write(token_id, true);
            self.emit(PassportRevoked { token_id });
        }

        #[external(v0)]
        fn get_passport_data(self: @ContractState, token_id: u256) -> (felt252, bool) {
            // Returns (product_hash, is_revoked)
            let hash = self.token_product_hash.read(token_id);
            let revoked = self.token_revoked.read(token_id);
            (hash, revoked)
        }
    }
}
