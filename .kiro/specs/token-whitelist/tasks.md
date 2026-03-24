# Implementation Plan: Token Whitelist

## Overview

This implementation adds a token whitelist security feature to the Soroban escrow smart contract. The work involves migrating from Symbol-based storage keys to a DataKey enum, implementing admin access control, adding whitelist management functions, integrating token validation into job creation, and comprehensive testing with both unit tests and property-based tests.

## Tasks

- [ ] 1. Set up DataKey enum and migrate storage keys
  - Create DataKey enum with JobCount, Job(u64), Admins, and AllowedTokens variants
  - Add #[contracttype] attribute to DataKey enum
  - Migrate existing storage access from Symbol-based keys to DataKey enum
  - Update get_job_key() function to return DataKey instead of (Symbol, u64)
  - Update all storage.get() and storage.set() calls to use DataKey
  - _Requirements: 1.1_

- [ ]* 1.1 Write unit tests for DataKey migration
  - Test that existing jobs can still be retrieved after migration
  - Test that job count persists correctly with new DataKey
  - _Requirements: 1.1_

- [ ] 2. Implement error handling for token whitelist
  - Add TokenNotAllowed = 12 to EscrowError enum
  - Ensure error numbering is sequential and doesn't conflict
  - _Requirements: 4.2_

- [ ] 3. Implement admin access control
  - [ ] 3.1 Create initialize function
    - Accept admin Address parameter
    - Store admin in Vec<Address> using DataKey::Admins in instance storage
    - Initialize default tokens (XLM and USDC testnet addresses)
    - Store default tokens using DataKey::AllowedTokens in instance storage
    - Implement TTL bumping for instance storage
    - _Requirements: 1.2_
  
  - [ ]* 3.2 Write unit tests for initialize function
    - Test that deployer is set as initial admin
    - Test that default tokens (XLM, USDC) are present after initialization
    - _Requirements: 1.2, 9.6_
  
  - [ ] 3.3 Create require_admin helper function
    - Call caller.require_auth() to verify signature
    - Load admins Vec from instance storage using DataKey::Admins
    - Check if caller exists in admins Vec
    - Return Unauthorized error if caller is not an admin
    - _Requirements: 2.2, 3.2_
  
  - [ ] 3.4 Implement add_admin function
    - Accept caller and new_admin Address parameters
    - Call require_admin to verify caller is authorized
    - Load admins Vec from instance storage
    - Append new_admin to Vec using push_back
    - Save updated Vec to instance storage
    - Bump instance storage TTL
    - _Requirements: 2.2_
  
  - [ ] 3.5 Implement remove_admin function
    - Accept caller and admin_to_remove Address parameters
    - Call require_admin to verify caller is authorized
    - Load admins Vec from instance storage
    - Filter out admin_to_remove from Vec
    - Save filtered Vec to instance storage
    - Bump instance storage TTL
    - _Requirements: 3.2_
  
  - [ ] 3.6 Implement is_admin view function
    - Accept address Address parameter
    - Load admins Vec from instance storage
    - Return true if address exists in Vec, false otherwise
    - No authentication required (read-only)
    - _Requirements: 2.2, 3.2_
  
  - [ ]* 3.7 Write unit tests for admin management
    - Test that admin can add new admins
    - Test that admin can remove admins
    - Test that non-admin cannot add admins (returns Unauthorized)
    - Test that non-admin cannot remove admins (returns Unauthorized)
    - Test is_admin returns correct values
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 4. Implement token whitelist management
  - [ ] 4.1 Create add_allowed_token function
    - Accept caller and token Address parameters
    - Call require_admin to verify caller is authorized
    - Load tokens Vec from instance storage using DataKey::AllowedTokens
    - Append token to Vec using push_back (allow duplicates)
    - Save updated Vec to instance storage
    - Emit TokenAdded event with token address
    - Bump instance storage TTL
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 4.2 Write property test for add_allowed_token
    - **Property 2: Admin-Only Token Addition**
    - **Validates: Requirements 2.2, 2.3**
    - For any address that is not an admin, attempting to call add_allowed_token should return an Unauthorized error
    - _Requirements: 2.2, 2.3_
  
  - [ ]* 4.3 Write property test for token addition appends to whitelist
    - **Property 3: Token Addition Appends to Whitelist**
    - **Validates: Requirements 2.4**
    - For any token address, when an admin successfully adds it, get_allowed_tokens should return a list containing that token
    - _Requirements: 2.4_
  
  - [ ]* 4.4 Write property test for TokenAdded event emission
    - **Property 4: TokenAdded Event Emission**
    - **Validates: Requirements 2.5, 7.1, 7.2**
    - For any token address successfully added by an admin, the contract should emit a TokenAdded event containing that exact token address
    - _Requirements: 2.5, 7.1, 7.2_
  
  - [ ] 4.5 Create remove_allowed_token function
    - Accept caller and token Address parameters
    - Call require_admin to verify caller is authorized
    - Load tokens Vec from instance storage
    - Filter out token from Vec (remove all occurrences)
    - Save filtered Vec to instance storage
    - Emit TokenRemoved event with token address
    - Bump instance storage TTL
    - Operation succeeds even if token not in whitelist (idempotent)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 4.6 Write property test for remove_allowed_token
    - **Property 5: Admin-Only Token Removal**
    - **Validates: Requirements 3.2, 3.3**
    - For any address that is not an admin, attempting to call remove_allowed_token should return an Unauthorized error
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 4.7 Write property test for token removal
    - **Property 6: Token Removal Removes from Whitelist**
    - **Validates: Requirements 3.4**
    - For any token address that exists in the whitelist, when an admin removes it, get_allowed_tokens should not contain that token
    - _Requirements: 3.4_
  
  - [ ]* 4.8 Write property test for TokenRemoved event emission
    - **Property 7: TokenRemoved Event Emission**
    - **Validates: Requirements 3.5, 7.3, 7.4**
    - For any token address successfully removed by an admin, the contract should emit a TokenRemoved event containing that exact token address
    - _Requirements: 3.5, 7.3, 7.4_
  
  - [ ]* 4.9 Write unit tests for whitelist management
    - Test adding tokens to whitelist
    - Test removing tokens from whitelist
    - Test adding duplicate tokens succeeds
    - Test removing non-existent token succeeds (idempotent)
    - Test TokenAdded event is emitted with correct address
    - Test TokenRemoved event is emitted with correct address
    - _Requirements: 2.6, 3.6_

- [ ] 5. Implement whitelist query functions
  - [ ] 5.1 Create get_allowed_tokens view function
    - Load tokens Vec from instance storage using DataKey::AllowedTokens
    - Return Vec<Address> (return empty Vec if not initialized)
    - No authentication required (read-only)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 5.2 Create is_token_allowed view function
    - Accept token Address parameter
    - Load tokens Vec from instance storage
    - Use iter().any() to check if token exists in Vec
    - Return boolean result
    - No authentication required (read-only)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 5.3 Write property test for get_allowed_tokens
    - **Property 11: Complete Whitelist Retrieval**
    - **Validates: Requirements 5.2**
    - For any set of token addresses added to the whitelist, get_allowed_tokens should return all of those addresses
    - _Requirements: 5.2_
  
  - [ ]* 5.4 Write property test for get_allowed_tokens read-only
    - **Property 12: get_allowed_tokens Read-Only**
    - **Validates: Requirements 5.3**
    - For any contract state, calling get_allowed_tokens multiple times should return the same result and not modify the whitelist
    - _Requirements: 5.3_
  
  - [ ]* 5.5 Write property test for is_token_allowed correctness
    - **Property 13: is_token_allowed Correctness**
    - **Validates: Requirements 6.2, 6.3**
    - For any token address, is_token_allowed should return true if and only if that address exists in get_allowed_tokens
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 5.6 Write property test for is_token_allowed read-only
    - **Property 14: is_token_allowed Read-Only**
    - **Validates: Requirements 6.4**
    - For any contract state, calling is_token_allowed multiple times should return the same result and not modify the whitelist
    - _Requirements: 6.4_
  
  - [ ]* 5.7 Write unit tests for query functions
    - Test get_allowed_tokens returns correct list
    - Test is_token_allowed returns true for whitelisted tokens
    - Test is_token_allowed returns false for non-whitelisted tokens
    - Test query functions work without authentication
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 6. Integrate token validation into create_job
  - [ ] 6.1 Add token validation to create_job function
    - Add token validation as first check in create_job (before client.require_auth())
    - Call is_token_allowed(env.clone(), token.clone())
    - Return TokenNotAllowed error if token is not whitelisted
    - Ensure validation happens before any other checks (deadline, milestones, etc.)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 6.2 Write property test for non-whitelisted token rejection
    - **Property 8: Non-Whitelisted Token Rejection**
    - **Validates: Requirements 4.1, 4.2**
    - For any token address not in the whitelist, attempting to create a job should return a TokenNotAllowed error
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 6.3 Write property test for whitelisted token acceptance
    - **Property 9: Whitelisted Token Acceptance**
    - **Validates: Requirements 4.3**
    - For any token address in the whitelist, creating a job with valid parameters should succeed (not fail with TokenNotAllowed)
    - _Requirements: 4.3_
  
  - [ ]* 6.4 Write property test for token validation priority
    - **Property 10: Token Validation Priority**
    - **Validates: Requirements 4.4**
    - For any job creation with a non-whitelisted token and other invalid parameters, the contract should return TokenNotAllowed first
    - _Requirements: 4.4_
  
  - [ ]* 6.5 Write unit tests for job creation integration
    - Test job creation succeeds with whitelisted token
    - Test job creation fails with TokenNotAllowed for non-whitelisted token
    - Test TokenNotAllowed is returned before other validation errors
    - _Requirements: 9.1, 9.2_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Verify no compilation errors or warnings
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 8. Write comprehensive property-based tests
  - [ ]* 8.1 Write property test for whitelist persistence
    - **Property 1: Whitelist Persistence**
    - **Validates: Requirements 1.3**
    - For any token address added to the whitelist, querying the whitelist in a subsequent invocation should include that token
    - _Requirements: 1.3_
  
  - [ ]* 8.2 Write property test for add-remove round trip
    - **Property 15: Add-Remove Round Trip**
    - **Validates: Requirements 2.4, 3.4**
    - For any token address, adding it to the whitelist and then removing it should result in the whitelist not containing that address
    - _Requirements: 2.4, 3.4_

- [ ] 9. Final integration and verification
  - [ ] 9.1 Verify all storage operations use DataKey enum
    - Search for any remaining Symbol-based storage access
    - Ensure all storage.get() and storage.set() use DataKey
    - _Requirements: 1.1_
  
  - [ ] 9.2 Verify TTL management is implemented
    - Ensure instance storage TTL is bumped on modifications
    - Verify TTL constants are defined (MIN_TTL_THRESHOLD, MIN_TTL_EXTEND_TO)
    - _Requirements: 1.3_
  
  - [ ] 9.3 Verify event emission
    - Ensure TokenAdded events are emitted correctly
    - Ensure TokenRemoved events are emitted correctly
    - Verify events contain correct token addresses
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 9.4 Run full test suite
    - Execute all unit tests
    - Execute all property-based tests (minimum 100 iterations each)
    - Verify all tests pass
    - Check test coverage for all new functions
    - _Requirements: All_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests should run minimum 100 iterations per test
- All property tests are tagged with comments referencing design properties
- DataKey migration must be completed before other tasks to ensure consistent storage access
- Token validation in create_job must be the first check to satisfy requirement 4.4
- Instance storage is used for Admins and AllowedTokens for persistence across upgrades
- Default tokens (XLM and USDC testnet) are initialized during contract deployment
