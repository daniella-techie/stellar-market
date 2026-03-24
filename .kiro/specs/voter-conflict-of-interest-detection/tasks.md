# Implementation Plan: Voter Conflict of Interest Detection

## Overview

This implementation extends the dispute contract with conflict of interest detection by integrating with the escrow contract to identify voters with prior working relationships with disputing parties. The approach uses eager conflict detection at dispute creation time, stores exclusions in the Dispute struct, and validates voters at vote-casting time.

## Tasks

- [x] 1. Set up data structures and storage keys
  - Add `excluded_voters: Vec<Address>` field to Dispute struct
  - Add `EscrowContract` variant to DataKey enum
  - Add `ConflictOfInterest = 10` error variant to DisputeError enum
  - _Requirements: 1.1, 3.1, 6.2_

- [ ] 2. Implement escrow contract initialization
  - [x] 2.1 Modify initialize function to accept escrow_contract parameter
    - Add `escrow_contract: Address` parameter to initialize function signature
    - Store escrow_contract address using DataKey::EscrowContract in instance storage
    - Extend TTL for escrow_contract storage entry
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write unit tests for escrow initialization
    - Test initialize stores escrow address correctly
    - Test TTL is extended for escrow address
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Implement conflict detection logic
  - [x] 3.1 Create detect_conflicts internal function
    - Implement function signature: `fn detect_conflicts(env: &Env, escrow_contract: &Address, client: &Address, freelancer: &Address) -> Vec<Address>`
    - Query get_job_count from escrow contract with error handling
    - Return empty Vec if count is 0 or query fails
    - Iterate through jobs 1 to job_count
    - For each job, call get_job and handle failures gracefully
    - Extract client and freelancer from each Job struct
    - Build conflicts list by comparing job participants with disputing parties
    - Deduplicate addresses before returning
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 10.2, 10.3, 10.4_

  - [ ]* 3.2 Write property test for complete conflict detection
    - **Property 7: Complete Conflict Detection**
    - **Validates: Requirements 7.3**
    - Generate random job histories with controlled conflicts
    - Verify all conflicted addresses appear in exclusion list
    - _Requirements: 7.3_

  - [ ]* 3.3 Write property test for no duplicate exclusions
    - **Property 8: No Duplicate Exclusions**
    - **Validates: Requirements 7.4**
    - Generate job histories with duplicate conflicts
    - Verify no address appears twice in exclusion list
    - _Requirements: 7.4_

  - [ ]* 3.4 Write property test for resilient job query
    - **Property 9: Resilient Job Query**
    - **Validates: Requirements 8.3, 10.2, 10.4**
    - Generate job histories with random query failures
    - Verify dispute creation succeeds despite failures
    - _Requirements: 8.3, 10.2, 10.4_

- [ ] 4. Integrate conflict detection into raise_dispute
  - [x] 4.1 Modify raise_dispute to call detect_conflicts
    - Load escrow_contract address from storage
    - Call detect_conflicts after creating dispute struct
    - Set dispute.excluded_voters to returned list
    - Initialize excluded_voters as empty Vec if escrow not configured
    - Store dispute with populated excluded_voters
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2, 7.3, 10.1_

  - [ ]* 4.2 Write unit tests for raise_dispute conflict detection
    - Test dispute creation with mock escrow returning jobs
    - Test excluded_voters is populated correctly
    - Test dispute creation succeeds with empty job history
    - Test dispute creation succeeds when escrow queries fail
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.3, 10.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement manual voter exclusion
  - [x] 6.1 Create add_excluded_voter function
    - Implement function signature: `pub fn add_excluded_voter(env: Env, dispute_id: u64, caller: Address, voter: Address) -> Result<(), DisputeError>`
    - Require authentication for caller
    - Load dispute by dispute_id, return DisputeNotFound if missing
    - Verify caller is either client or freelancer, return Unauthorized otherwise
    - Check dispute status is Open, return VotingClosed otherwise
    - Append voter to dispute.excluded_voters
    - Store updated dispute
    - Extend TTL for dispute
    - Emit exclusion event
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Write property test for unauthorized exclusion rejected
    - **Property 3: Unauthorized Exclusion Rejected**
    - **Validates: Requirements 4.2**
    - Generate random addresses that are not disputing parties
    - Verify Unauthorized error is returned
    - _Requirements: 4.2_

  - [ ]* 6.3 Write property test for exclusion only during open status
    - **Property 4: Exclusion Only During Open Status**
    - **Validates: Requirements 4.3**
    - Generate disputes with various non-Open statuses
    - Verify VotingClosed error is returned
    - _Requirements: 4.3_

  - [ ]* 6.4 Write property test for manual exclusion adds voter
    - **Property 5: Manual Exclusion Adds Voter**
    - **Validates: Requirements 4.4**
    - Generate random voter addresses
    - Verify addresses appear in exclusion list after add_excluded_voter
    - _Requirements: 4.4_

  - [ ]* 6.5 Write unit tests for add_excluded_voter
    - Test client can add excluded voter during Open status
    - Test freelancer can add excluded voter during Open status
    - Test unauthorized caller is rejected
    - Test exclusion during non-Open status is rejected
    - Test exclusion event is emitted
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.5, 9.6_

- [ ] 7. Implement exclusion query function
  - [x] 7.1 Create is_excluded_voter function
    - Implement function signature: `pub fn is_excluded_voter(env: Env, dispute_id: u64, voter: Address) -> bool`
    - Load dispute by dispute_id, return false if not found
    - Check if voter exists in dispute.excluded_voters
    - Return true if found, false otherwise
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.2 Write property test for exclusion query correctness
    - **Property 6: Exclusion Query Correctness**
    - **Validates: Requirements 5.2, 5.3**
    - Generate random disputes and voters
    - Verify is_excluded_voter matches list membership
    - _Requirements: 5.2, 5.3_

  - [ ]* 7.3 Write unit tests for is_excluded_voter
    - Test returns true for excluded voters
    - Test returns false for non-excluded voters
    - Test returns false for non-existent disputes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.7_

- [ ] 8. Integrate exclusion check into cast_vote
  - [ ] 8.1 Modify cast_vote to check excluded_voters
    - After loading dispute and before other validations, check if voter is in excluded_voters
    - Return ConflictOfInterest error if voter is excluded
    - Continue with existing validations if voter is not excluded
    - _Requirements: 2.4, 6.1, 6.2, 6.3_

  - [ ]* 8.2 Write property test for conflicted voters are rejected
    - **Property 1: Conflicted Voters Are Rejected**
    - **Validates: Requirements 2.4, 6.2**
    - Generate random job histories where voter shares jobs with disputing parties
    - Verify ConflictOfInterest error is returned
    - _Requirements: 2.4, 6.2_

  - [ ]* 8.3 Write property test for non-conflicted voters can vote
    - **Property 2: Non-Conflicted Voters Can Vote**
    - **Validates: Requirements 2.5**
    - Generate random job histories where voter has no shared jobs
    - Verify vote proceeds without ConflictOfInterest error
    - _Requirements: 2.5, 6.3_

  - [ ]* 8.4 Write unit tests for cast_vote exclusion check
    - Test excluded voter from job history cannot cast vote
    - Test manually excluded voter cannot cast vote
    - Test non-excluded voter can cast vote
    - Test conflict check happens before reputation check
    - _Requirements: 2.4, 2.5, 6.1, 6.2, 6.3, 9.2, 9.3, 9.8_

- [ ] 9. Create test infrastructure
  - [ ] 9.1 Create mock escrow contract for testing
    - Implement MockEscrow contract with get_job_count and get_job functions
    - Add helper function to populate test jobs
    - Add helper to simulate query failures
    - _Requirements: 9.1_

  - [ ]* 9.2 Set up property-based testing framework
    - Add proptest dependency to Cargo.toml
    - Create test data generators for addresses, jobs, and job histories
    - Configure proptest to run minimum 100 iterations per property
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses eager conflict detection at dispute creation time to minimize gas costs at vote time
- Cross-contract calls implement graceful degradation to ensure system availability
