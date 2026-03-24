# Cross-Contract Integration Tests

This package contains comprehensive integration tests that verify end-to-end workflows across the Stellar Market smart contracts (Escrow, Dispute, and Reputation).

## Overview

While each contract has individual unit tests, these integration tests simulate realistic multi-contract scenarios to ensure proper interaction and state consistency across the entire system.

## Test Coverage

### 1. Happy Path Scenarios

- **`test_happy_path_job_completion_with_reputation`**
  - Complete job lifecycle: creation → funding → milestone submission → approval → completion
  - Mutual reputation reviews between client and freelancer
  - Verifies fund transfers and reputation score accumulation

- **`test_multiple_jobs_with_reputation_accumulation`**
  - Multiple jobs with the same freelancer and different clients
  - Reputation accumulation across multiple completed jobs
  - Weighted average rating calculation

### 2. Dispute Resolution Workflows

- **`test_dispute_resolved_for_freelancer`**
  - Job creation and funding
  - Freelancer submits work, client raises dispute
  - Community voting favors freelancer
  - Funds transferred to freelancer upon resolution

- **`test_dispute_resolved_for_client`**
  - Partial milestone completion (first milestone approved)
  - Dispute raised on second milestone
  - Community voting favors client
  - Remaining funds returned to client

- **`test_dispute_with_all_milestones_approved`**
  - Dispute raised before milestone approval
  - Resolution transfers funds based on vote outcome

### 3. Cancellation and Refund

- **`test_full_workflow_with_partial_completion_and_cancellation`**
  - Job with multiple milestones
  - First milestone completed and paid
  - Client cancels job
  - Remaining funds refunded to client

### 4. Error Handling

- **`test_reputation_review_before_job_completion_fails`**
  - Verifies that reviews cannot be submitted before job completion
  - Tests cross-contract validation

- **`test_duplicate_vote_on_dispute_fails`**
  - Ensures voters cannot vote twice on the same dispute
  - Tests dispute contract state management

## Running the Tests

From the `contracts` directory:

```bash
# Run all integration tests
cargo test --package stellar-market-integration-tests

# Run a specific test
cargo test --package stellar-market-integration-tests test_happy_path_job_completion_with_reputation

# Run with output
cargo test --package stellar-market-integration-tests -- --nocapture
```

## Test Architecture

### Multi-Contract Environment

The tests use `soroban-sdk` test features to:

- Register multiple contract instances in a single test environment
- Simulate cross-contract calls
- Mock authentication for all participants
- Create and manage test tokens

### Test Helpers

- **`create_token_contract`**: Creates a Stellar asset contract for testing payments
- **`mint_tokens`**: Mints test tokens to participant addresses

### Verified Behaviors

Each test verifies:

1. **State transitions**: Job status, milestone status, dispute status
2. **Fund flows**: Token transfers between client, freelancer, and escrow
3. **Cross-contract interactions**: Dispute resolution callbacks, reputation validation
4. **Event emissions**: Contract events are properly published
5. **Error conditions**: Invalid operations are properly rejected

## Key Insights

These integration tests demonstrate:

- **Atomic operations**: Fund transfers and state updates happen atomically
- **Cross-contract security**: Reputation contract validates job completion via escrow contract
- **Dispute resolution**: Community voting mechanism with callback to escrow for fund distribution
- **Partial completion**: System handles partial milestone completion with proper refunds
- **Reputation integrity**: Reviews can only be submitted by actual job participants after completion

## Future Enhancements

Potential additions to the test suite:

- Time-based scenarios (deadline enforcement)
- Edge cases with zero-amount milestones
- Concurrent dispute scenarios
- Gas/resource consumption analysis
- Stress testing with many milestones
