# Design Document: Token Whitelist

## Overview

The token whitelist feature adds security controls to the escrow smart contract by restricting job creation to approved token addresses. This prevents malicious or untrusted tokens from being used in escrow transactions. The design introduces a storage-backed whitelist managed by contract administrators, with validation enforced during job creation.

The implementation extends the existing Soroban escrow contract with:
- A DataKey enum for organized storage access
- Admin role management using contract instance storage
- Token whitelist storage and management functions
- Validation logic integrated into the create_job flow
- Query functions for frontend integration

## Architecture

### Storage Architecture

The contract will use Soroban's storage tiers strategically:

**Instance Storage** (contract-level, persistent across upgrades):
- Admin addresses (Set<Address>)
- Allowed tokens whitelist (Vec<Address>)

**Persistent Storage** (existing):
- Job data (unchanged from current implementation)

### DataKey Enum Design

```rust
#[contracttype]
pub enum DataKey {
    // Existing keys migrated from Symbol
    JobCount,
    Job(u64),
    
    // New whitelist keys
    Admins,
    AllowedTokens,
}
```

This enum provides type-safe storage access and replaces the current Symbol-based keys (`symbol_short!("JOB_CNT")`, `symbol_short!("JOB")`).

### Admin Access Control

Admins are stored as a `Vec<Address>` in instance storage. The contract will initialize with a single admin (the deployer) and provide functions to add/remove admins.

**Authorization Pattern**:
```rust
fn require_admin(env: &Env, caller: &Address) -> Result<(), EscrowError> {
    caller.require_auth();
    let admins: Vec<Address> = env.storage()
        .instance()
        .get(&DataKey::Admins)
        .unwrap_or(Vec::new(env));
    
    if !admins.contains(caller) {
        return Err(EscrowError::Unauthorized);
    }
    Ok(())
}
```

### Token Whitelist Management

The whitelist is stored as `Vec<Address>` in instance storage. The design allows duplicate addresses (as per requirements) to simplify implementation, though duplicates provide no functional benefit.

**Default Initialization**:
- Native XLM: `Address::from_string("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC")`
- USDC Testnet: `Address::from_string("CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA")`

These addresses are Stellar testnet asset addresses and will be added during contract initialization.

## Components and Interfaces

### Error Types

Extend the existing `EscrowError` enum:

```rust
#[contracterror]
pub enum EscrowError {
    // Existing errors (1-11)
    JobNotFound = 1,
    Unauthorized = 2,
    InvalidStatus = 3,
    MilestoneNotFound = 4,
    InsufficientFunds = 5,
    AlreadyFunded = 6,
    InvalidDeadline = 7,
    MilestoneDeadlineExceeded = 8,
    HasPendingMilestone = 9,
    NoRefundDue = 10,
    GracePeriodNotMet = 11,
    
    // New errors
    TokenNotAllowed = 12,
}
```

### Contract Functions

#### Admin Management

```rust
/// Initialize contract with deployer as first admin and default tokens
pub fn initialize(env: Env, admin: Address) -> Result<(), EscrowError>

/// Add a new admin (admin-only)
pub fn add_admin(env: Env, caller: Address, new_admin: Address) -> Result<(), EscrowError>

/// Remove an admin (admin-only)
pub fn remove_admin(env: Env, caller: Address, admin_to_remove: Address) -> Result<(), EscrowError>

/// Check if an address is an admin (view function)
pub fn is_admin(env: Env, address: Address) -> bool
```

#### Whitelist Management

```rust
/// Add a token to the whitelist (admin-only)
pub fn add_allowed_token(env: Env, caller: Address, token: Address) -> Result<(), EscrowError>

/// Remove a token from the whitelist (admin-only)
pub fn remove_allowed_token(env: Env, caller: Address, token: Address) -> Result<(), EscrowError>

/// Get all allowed tokens (view function)
pub fn get_allowed_tokens(env: Env) -> Vec<Address>

/// Check if a token is allowed (view function)
pub fn is_token_allowed(env: Env, token: Address) -> bool
```

#### Modified create_job Function

The existing `create_job` function will be modified to add token validation as the first check:

```rust
pub fn create_job(
    env: Env,
    client: Address,
    freelancer: Address,
    token: Address,  // This will be validated
    milestones: Vec<(String, i128, u64)>,
    job_deadline: u64,
    auto_refund_after: u64,
) -> Result<u64, EscrowError> {
    client.require_auth();
    
    // NEW: Token validation (first check)
    if !Self::is_token_allowed(env.clone(), token.clone()) {
        return Err(EscrowError::TokenNotAllowed);
    }
    
    // Existing validation and logic continues...
}
```

### Events

Define new event types for whitelist changes:

```rust
// Event topics
(symbol_short!("token"), symbol_short!("added"))   // TokenAdded
(symbol_short!("token"), symbol_short!("removed")) // TokenRemoved

// Event data
TokenAdded: (token: Address)
TokenRemoved: (token: Address)
```

## Data Models

### Storage Keys

```rust
#[contracttype]
pub enum DataKey {
    JobCount,           // u64 counter
    Job(u64),          // Job struct
    Admins,            // Vec<Address>
    AllowedTokens,     // Vec<Address>
}
```

### Storage Layout

| Key | Type | Storage Tier | TTL Strategy |
|-----|------|--------------|--------------|
| DataKey::JobCount | u64 | Instance | Bump on access |
| DataKey::Job(id) | Job | Persistent | Bump on access |
| DataKey::Admins | Vec<Address> | Instance | Bump on modification |
| DataKey::AllowedTokens | Vec<Address> | Instance | Bump on modification |

Instance storage is appropriate for Admins and AllowedTokens because:
- They are contract-level configuration (not per-job)
- They need to persist across contract upgrades
- Access frequency is moderate (not per-transaction)
- Size is bounded (limited number of admins/tokens)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Whitelist Persistence

*For any* token address added to the whitelist, querying the whitelist in a subsequent contract invocation should include that token address.

**Validates: Requirements 1.3**

### Property 2: Admin-Only Token Addition

*For any* address that is not an admin, attempting to call add_allowed_token should return an Unauthorized error.

**Validates: Requirements 2.2, 2.3**

### Property 3: Token Addition Appends to Whitelist

*For any* token address, when an admin successfully adds it to the whitelist, calling get_allowed_tokens should return a list containing that token address.

**Validates: Requirements 2.4**

### Property 4: TokenAdded Event Emission

*For any* token address successfully added by an admin, the contract should emit a TokenAdded event containing that exact token address.

**Validates: Requirements 2.5, 7.1, 7.2**

### Property 5: Admin-Only Token Removal

*For any* address that is not an admin, attempting to call remove_allowed_token should return an Unauthorized error.

**Validates: Requirements 3.2, 3.3**

### Property 6: Token Removal Removes from Whitelist

*For any* token address that exists in the whitelist, when an admin removes it, calling get_allowed_tokens should return a list that does not contain that token address.

**Validates: Requirements 3.4**

### Property 7: TokenRemoved Event Emission

*For any* token address successfully removed by an admin, the contract should emit a TokenRemoved event containing that exact token address.

**Validates: Requirements 3.5, 7.3, 7.4**

### Property 8: Non-Whitelisted Token Rejection

*For any* token address not in the whitelist, attempting to create a job with that token should return a TokenNotAllowed error.

**Validates: Requirements 4.1, 4.2**

### Property 9: Whitelisted Token Acceptance

*For any* token address in the whitelist, creating a job with that token and valid parameters should succeed (not fail with TokenNotAllowed).

**Validates: Requirements 4.3**

### Property 10: Token Validation Priority

*For any* job creation attempt with a non-whitelisted token and other invalid parameters (e.g., invalid deadline), the contract should return TokenNotAllowed before other validation errors.

**Validates: Requirements 4.4**

### Property 11: Complete Whitelist Retrieval

*For any* set of token addresses added to the whitelist, calling get_allowed_tokens should return all of those addresses.

**Validates: Requirements 5.2**

### Property 12: get_allowed_tokens Read-Only

*For any* contract state, calling get_allowed_tokens multiple times should return the same result and not modify the whitelist.

**Validates: Requirements 5.3**

### Property 13: is_token_allowed Correctness

*For any* token address, is_token_allowed should return true if and only if that address exists in the whitelist returned by get_allowed_tokens.

**Validates: Requirements 6.2, 6.3**

### Property 14: is_token_allowed Read-Only

*For any* contract state, calling is_token_allowed multiple times with the same address should return the same result and not modify the whitelist.

**Validates: Requirements 6.4**

### Property 15: Add-Remove Round Trip

*For any* token address, adding it to the whitelist and then removing it should result in the whitelist not containing that address (assuming it wasn't already present).

**Validates: Requirements 2.4, 3.4** (Combined round-trip property)

## Error Handling

### Error Scenarios

| Scenario | Error Code | HTTP Equivalent | Recovery Action |
|----------|-----------|-----------------|-----------------|
| Non-admin attempts whitelist modification | Unauthorized (2) | 403 Forbidden | Authenticate as admin |
| Job creation with non-whitelisted token | TokenNotAllowed (12) | 400 Bad Request | Use whitelisted token |
| Contract not initialized | (Panic) | 500 Internal Error | Initialize contract |

### Error Handling Strategy

**Authorization Errors**:
- All admin functions call `require_admin()` before any state modification
- Unauthorized errors are returned immediately without side effects
- Frontend should check `is_admin()` before showing admin UI

**Validation Errors**:
- Token validation occurs first in `create_job` (before deadline checks, etc.)
- Clear error messages distinguish between validation failures
- Frontend should call `is_token_allowed()` before job creation to provide early feedback

**Idempotent Operations**:
- Removing a non-existent token succeeds (no error)
- Adding duplicate tokens is allowed (per requirements)
- Query functions never fail (return empty Vec if uninitialized)

### Event Emission Guarantees

Events are emitted only after successful state changes:
- TokenAdded: emitted after token is appended to storage
- TokenRemoved: emitted after token is removed from storage
- No events on failed operations (errors)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples (e.g., initialization with XLM and USDC)
- Edge cases (e.g., duplicate tokens, removing non-existent tokens)
- Error conditions (e.g., non-admin access attempts)
- Integration with existing job creation flow

**Property-Based Tests** focus on:
- Universal properties across all inputs (e.g., admin-only access for all addresses)
- Round-trip properties (e.g., add then remove)
- Invariants (e.g., read-only functions don't modify state)
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Framework**: Use Rust's `proptest` or `quickcheck` crate for property-based testing in Soroban contracts.

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with comment referencing design property
- Tag format: `// Feature: token-whitelist, Property {number}: {property_text}`

**Example Property Test Structure**:
```rust
#[test]
fn prop_admin_only_token_addition() {
    // Feature: token-whitelist, Property 2: Admin-Only Token Addition
    // For any address that is not an admin, attempting to call 
    // add_allowed_token should return an Unauthorized error.
    
    proptest!(|(random_address: Address, random_token: Address)| {
        // Setup: Initialize contract with different admin
        // Test: Call add_allowed_token with random_address
        // Assert: Returns Unauthorized error
    });
}
```

### Unit Test Coverage

**Initialization Tests**:
- Verify default tokens (XLM, USDC) are present after initialization
- Verify deployer is set as initial admin

**Admin Management Tests**:
- Admin can add tokens
- Admin can remove tokens
- Non-admin cannot add tokens (returns Unauthorized)
- Non-admin cannot remove tokens (returns Unauthorized)

**Whitelist Query Tests**:
- get_allowed_tokens returns all added tokens
- is_token_allowed returns true for whitelisted tokens
- is_token_allowed returns false for non-whitelisted tokens
- Query functions work without authentication

**Job Creation Integration Tests**:
- Job creation succeeds with whitelisted token
- Job creation fails with TokenNotAllowed for non-whitelisted token
- TokenNotAllowed is returned before other validation errors

**Edge Case Tests**:
- Adding duplicate tokens succeeds
- Removing non-existent token succeeds (idempotent)
- Empty whitelist behavior (after removing all tokens)

**Event Tests**:
- TokenAdded event emitted with correct address
- TokenRemoved event emitted with correct address
- No events on failed operations

### Integration Testing

**End-to-End Flows**:
1. Initialize → Add token → Create job with token → Verify success
2. Initialize → Create job with non-whitelisted token → Verify TokenNotAllowed
3. Initialize → Add token → Remove token → Create job → Verify TokenNotAllowed
4. Initialize → Query tokens → Verify default tokens present

**Cross-Contract Testing**:
- Verify token addresses match actual Stellar asset contracts
- Test with real token contracts (not just addresses)
- Verify token.transfer() works with whitelisted tokens

### Test Data

**Test Token Addresses** (Stellar Testnet):
- Native XLM: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- USDC: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`
- EURC: `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU`
- Invalid/Random: Generate using `Address::generate()`

**Test Admin Addresses**:
- Use `Address::generate()` for random admins in property tests
- Use fixed addresses for unit test reproducibility

### Performance Considerations

**Gas/Resource Limits**:
- Vec operations (push, remove) are O(n) where n = whitelist size
- Keep whitelist size reasonable (< 100 tokens recommended)
- Consider using Map<Address, bool> if whitelist grows large

**Storage Costs**:
- Each Address is ~32 bytes
- Vec<Address> with 10 tokens ≈ 320 bytes + overhead
- Instance storage is persistent but has cost implications

### Migration Strategy

**Existing Contract Migration**:
1. Deploy new contract version with whitelist feature
2. Initialize with default tokens (XLM, USDC)
3. Set current contract owner as admin
4. Existing jobs are unaffected (no data migration needed)
5. New jobs must use whitelisted tokens

**Backward Compatibility**:
- Existing job data structure unchanged
- Existing functions (fund_job, approve_milestone, etc.) unchanged
- Only create_job behavior changes (adds validation)

## Implementation Notes

### Soroban SDK Patterns

**Storage Access Pattern**:
```rust
// Read
let tokens: Vec<Address> = env.storage()
    .instance()
    .get(&DataKey::AllowedTokens)
    .unwrap_or(Vec::new(&env));

// Write
env.storage()
    .instance()
    .set(&DataKey::AllowedTokens, &tokens);
```

**TTL Management**:
```rust
const MIN_TTL_THRESHOLD: u32 = 1_000;
const MIN_TTL_EXTEND_TO: u32 = 10_000;

fn bump_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(MIN_TTL_THRESHOLD, MIN_TTL_EXTEND_TO);
}
```

### Vec Operations in Soroban

**Adding to Vec**:
```rust
let mut tokens = get_allowed_tokens_internal(&env);
tokens.push_back(token);
env.storage().instance().set(&DataKey::AllowedTokens, &tokens);
```

**Removing from Vec**:
```rust
let mut tokens = get_allowed_tokens_internal(&env);
// Filter out the token to remove
let filtered: Vec<Address> = tokens.iter()
    .filter(|t| t != &token)
    .collect();
env.storage().instance().set(&DataKey::AllowedTokens, &filtered);
```

**Checking Membership**:
```rust
let tokens = get_allowed_tokens_internal(&env);
tokens.iter().any(|t| t == &token)
```

### Security Considerations

**Admin Key Management**:
- Admins should use hardware wallets or secure key management
- Consider multi-sig for admin operations in production
- Implement admin removal carefully (don't lock out all admins)

**Token Address Validation**:
- Whitelist only validates addresses, not token behavior
- Malicious token contracts could still cause issues (e.g., failing transfers)
- Consider additional validation (e.g., checking token contract code hash)

**Denial of Service**:
- Whitelist size should be bounded to prevent gas exhaustion
- Consider rate limiting admin operations if needed
- Vec operations are O(n), so large whitelists impact performance

### Frontend Integration

**Recommended UI Flow**:
1. On job creation page, call `get_allowed_tokens()` to populate dropdown
2. Display token symbols/names (requires off-chain token metadata)
3. Before submitting, call `is_token_allowed()` for client-side validation
4. Handle TokenNotAllowed error gracefully with user-friendly message

**Admin Dashboard**:
1. Check `is_admin(current_user)` to show/hide admin features
2. Display current whitelist with `get_allowed_tokens()`
3. Provide add/remove token forms for admins
4. Show event history for audit trail (TokenAdded, TokenRemoved)

**Error Messages**:
- TokenNotAllowed: "This token is not approved for escrow. Please select from the approved token list."
- Unauthorized: "You don't have permission to modify the token whitelist. Admin access required."
