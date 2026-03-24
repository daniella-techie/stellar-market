# Requirements Document

## Introduction

The escrow smart contract currently accepts any arbitrary token address when creating jobs, which poses a security risk. This feature introduces a token whitelist mechanism to restrict job creation to only approved tokens. The whitelist will be managed by administrators and will include popular Stellar assets such as native XLM, USDC, and EURC. This ensures that only vetted, trusted tokens can be used for escrow transactions on the platform.

## Glossary

- **Escrow_Contract**: The Soroban smart contract that manages job creation, funding, milestone tracking, and payment releases between clients and freelancers
- **Token**: A Stellar asset represented by an Address on the Soroban blockchain, used for payments in escrow jobs
- **Whitelist**: A Vec<Address> stored in contract storage containing the list of approved token addresses
- **Admin**: An authorized Address with permission to add or remove tokens from the whitelist
- **Job**: An escrow agreement between a client and freelancer with associated token, milestones, and payment terms
- **DataKey**: An enum used by the Escrow_Contract to organize different types of data in contract storage

## Requirements

### Requirement 1: Token Whitelist Storage

**User Story:** As a platform operator, I want to store a list of allowed token addresses in the contract, so that only approved tokens can be used for escrow jobs.

#### Acceptance Criteria

1. THE Escrow_Contract SHALL store a whitelist as a Vec<Address> in contract storage using DataKey::AllowedTokens
2. THE Escrow_Contract SHALL initialize the whitelist with default token addresses for native XLM and USDC testnet during contract deployment
3. THE Escrow_Contract SHALL persist the whitelist across contract invocations

### Requirement 2: Add Token to Whitelist

**User Story:** As an administrator, I want to add new token addresses to the whitelist, so that additional approved tokens can be used for escrow jobs.

#### Acceptance Criteria

1. THE Escrow_Contract SHALL provide an add_allowed_token function that accepts a token Address parameter
2. WHEN add_allowed_token is invoked, THE Escrow_Contract SHALL verify that the caller is an authorized Admin
3. IF the caller is not an authorized Admin, THEN THE Escrow_Contract SHALL return an Unauthorized error
4. WHEN a valid Admin adds a token, THE Escrow_Contract SHALL append the token Address to the whitelist
5. WHEN a token is successfully added, THE Escrow_Contract SHALL emit a TokenAdded event containing the token Address
6. THE Escrow_Contract SHALL allow duplicate token addresses to be added to the whitelist

### Requirement 3: Remove Token from Whitelist

**User Story:** As an administrator, I want to remove token addresses from the whitelist, so that tokens that are no longer approved cannot be used for new escrow jobs.

#### Acceptance Criteria

1. THE Escrow_Contract SHALL provide a remove_allowed_token function that accepts a token Address parameter
2. WHEN remove_allowed_token is invoked, THE Escrow_Contract SHALL verify that the caller is an authorized Admin
3. IF the caller is not an authorized Admin, THEN THE Escrow_Contract SHALL return an Unauthorized error
4. WHEN a valid Admin removes a token, THE Escrow_Contract SHALL remove the token Address from the whitelist
5. WHEN a token is successfully removed, THE Escrow_Contract SHALL emit a TokenRemoved event containing the token Address
6. IF the token Address is not in the whitelist, THEN THE Escrow_Contract SHALL complete successfully without error

### Requirement 4: Token Validation During Job Creation

**User Story:** As a platform operator, I want to validate that tokens used in job creation are whitelisted, so that only approved tokens can be used for escrow transactions.

#### Acceptance Criteria

1. WHEN create_job is invoked, THE Escrow_Contract SHALL validate that the provided token Address exists in the whitelist
2. IF the token Address is not in the whitelist, THEN THE Escrow_Contract SHALL return a TokenNotAllowed error
3. IF the token Address is in the whitelist, THEN THE Escrow_Contract SHALL proceed with job creation
4. THE Escrow_Contract SHALL perform token validation before any other job creation logic

### Requirement 5: Query Allowed Tokens

**User Story:** As a client or frontend application, I want to retrieve the list of allowed tokens, so that I can display available payment options to users.

#### Acceptance Criteria

1. THE Escrow_Contract SHALL provide a get_allowed_tokens function that returns Vec<Address>
2. WHEN get_allowed_tokens is invoked, THE Escrow_Contract SHALL return the complete list of whitelisted token addresses
3. THE get_allowed_tokens function SHALL be a read-only view function that does not modify contract state
4. THE get_allowed_tokens function SHALL not require authentication

### Requirement 6: Check Token Allowance Status

**User Story:** As a client or frontend application, I want to check if a specific token is allowed, so that I can validate user input before attempting job creation.

#### Acceptance Criteria

1. THE Escrow_Contract SHALL provide an is_token_allowed function that accepts a token Address parameter and returns a boolean
2. WHEN is_token_allowed is invoked with a whitelisted token Address, THE Escrow_Contract SHALL return true
3. WHEN is_token_allowed is invoked with a non-whitelisted token Address, THE Escrow_Contract SHALL return false
4. THE is_token_allowed function SHALL be a read-only view function that does not modify contract state
5. THE is_token_allowed function SHALL not require authentication

### Requirement 7: Token Whitelist Events

**User Story:** As a platform monitoring system, I want to receive events when tokens are added or removed from the whitelist, so that I can track whitelist changes and update off-chain systems.

#### Acceptance Criteria

1. WHEN a token is successfully added to the whitelist, THE Escrow_Contract SHALL emit a TokenAdded event
2. THE TokenAdded event SHALL contain the token Address that was added
3. WHEN a token is successfully removed from the whitelist, THE Escrow_Contract SHALL emit a TokenRemoved event
4. THE TokenRemoved event SHALL contain the token Address that was removed

### Requirement 8: Admin Access Control Testing

**User Story:** As a security auditor, I want comprehensive unit tests for admin access control, so that I can verify that only authorized admins can modify the whitelist.

#### Acceptance Criteria

1. THE test suite SHALL include a test that verifies unauthorized addresses cannot add tokens to the whitelist
2. THE test suite SHALL include a test that verifies unauthorized addresses cannot remove tokens from the whitelist
3. THE test suite SHALL include a test that verifies authorized admins can successfully add tokens
4. THE test suite SHALL include a test that verifies authorized admins can successfully remove tokens

### Requirement 9: Token Validation Testing

**User Story:** As a quality assurance engineer, I want comprehensive unit tests for token validation, so that I can verify that job creation properly enforces the whitelist.

#### Acceptance Criteria

1. THE test suite SHALL include a test that verifies job creation succeeds with a whitelisted token
2. THE test suite SHALL include a test that verifies job creation fails with a TokenNotAllowed error when using a non-whitelisted token
3. THE test suite SHALL include a test that verifies get_allowed_tokens returns the correct list of tokens
4. THE test suite SHALL include a test that verifies is_token_allowed returns true for whitelisted tokens
5. THE test suite SHALL include a test that verifies is_token_allowed returns false for non-whitelisted tokens
6. THE test suite SHALL include a test that verifies the default initialization includes XLM and USDC testnet addresses
