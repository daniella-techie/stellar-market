# Escrow Contract Events

This document describes all events emitted by the Stellar Market Escrow contract for off-chain indexing, analytics, and frontend reactivity.

## Overview

The escrow contract emits structured Soroban events at every significant state transition. All events follow a consistent topic scheme with two elements: a contract identifier symbol and an event type symbol.

## Topic Structure

All events use a two-element topic tuple:

```rust
(symbol_short!("escrow"), symbol_short!("event_type"))
```

- **Topic 0**: `"escrow"` — Contract identifier (7 characters, uses `symbol_short!`)
- **Topic 1**: Event-specific identifier (varies by event)

## Event Catalog

### 1. EscrowCreated

**When emitted**: When a new escrow job is created via `create_job()`

**Triggering action**: Client creates a new job with milestones, freelancer assignment, and payment token

**Topics**:
```rust
(symbol_short!("escrow"), symbol_short!("created"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier for the newly created job |
| `client` | `Address` | Address of the client who created the job |
| `freelancer` | `Address` | Address of the assigned freelancer |
| `token` | `Address` | Payment token contract address |
| `total_amount` | `i128` | Total escrow amount (sum of all milestone amounts) |

**Example**:
```rust
// Topics: ("escrow", "created")
// Data: (1u64, client_addr, freelancer_addr, token_addr, 3000i128)
```

**Notes for indexers**:
- This is always the first event in a job's lifecycle
- `job_id` is monotonically increasing and unique across all jobs
- `total_amount` equals the sum of all milestone amounts at creation time

---

### 2. EscrowFunded

**When emitted**: When the client funds the escrow via `fund_job()`

**Triggering action**: Client transfers the full `total_amount` to the escrow contract

**Topics**:
```rust
(symbol_short!("escrow"), symbol_short!("funded"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier of the funded job |
| `client` | `Address` | Address of the client who funded the job |
| `freelancer` | `Address` | Address of the assigned freelancer |
| `token` | `Address` | Payment token contract address |
| `total_amount` | `i128` | Total amount transferred to escrow |

**Example**:
```rust
// Topics: ("escrow", "funded")
// Data: (1u64, client_addr, freelancer_addr, token_addr, 3000i128)
```

**Notes for indexers**:
- Emitted exactly once per job (job status transitions from `Created` to `Funded`)
- After this event, the escrow contract holds `total_amount` tokens
- The job becomes eligible for milestone submissions after funding

---

### 3. MilestoneReleased

**When emitted**: When the client approves a milestone via `approve_milestone()`

**Triggering action**: Client approves a submitted milestone, releasing payment to the freelancer

**Topics**:
```rust
(symbol_short!("escrow"), symbol_short!("milestone"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier of the job |
| `milestone_id` | `u32` | Index of the approved milestone (0-based) |
| `client` | `Address` | Address of the client who approved the milestone |
| `freelancer` | `Address` | Address of the freelancer receiving payment |
| `amount` | `i128` | Gross milestone amount (before fee deduction) |

**Example**:
```rust
// Topics: ("escrow", "milestone")
// Data: (1u64, 0u32, client_addr, freelancer_addr, 1000i128)
```

**Notes for indexers**:
- Emitted once per milestone approval
- `amount` is the gross amount; actual freelancer payment is `amount - fee`
- A separate `fee` event is emitted if `fee_bps > 0`
- Multiple milestone approvals for the same job will emit multiple events with different `milestone_id` values

---

### 4. EscrowRefunded

**When emitted**: When the client claims a refund via `claim_refund()`

**Triggering action**: Client claims a refund for an abandoned job past the deadline + grace period

**Topics**:
```rust
(symbol_short!("escrow"), symbol_short!("refund"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier of the refunded job |
| `refund_amount` | `i128` | Amount refunded to the client |
| `client` | `Address` | Address of the client receiving the refund |
| `freelancer` | `Address` | Address of the freelancer (for reference) |

**Example**:
```rust
// Topics: ("escrow", "refund")
// Data: (1u64, 2500i128, client_addr, freelancer_addr)
```

**Notes for indexers**:
- `refund_amount` = `total_amount` - sum of already-approved milestone amounts
- Job status transitions to `Cancelled` after this event
- Only emitted when the job deadline + grace period has passed and no pending milestones exist

---

### 5. EscrowDisputed

**When emitted**: When a dispute is resolved via `resolve_dispute_callback()`

**Triggering action**: Dispute contract calls back to resolve a disputed job and distribute remaining funds

**Topics**:
```rust
(symbol_short!("escrow"), symbol_short!("dispute"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier of the disputed job |
| `resolution` | `DisputeResolution` | Resolution outcome (enum) |
| `client` | `Address` | Address of the client |
| `freelancer` | `Address` | Address of the freelancer |
| `token` | `Address` | Payment token contract address |

**Resolution enum values**:
- `ClientWins` — Remaining funds refunded to client, job status → `Cancelled`
- `FreelancerWins` — Remaining funds paid to freelancer, job status → `Completed`
- `RefundBoth` — Remaining funds split 50/50, job status → `Cancelled`
- `RefundSplit(u32)` — Remaining funds split by percentage, job status → `Cancelled`
- `Escalate` — No funds transferred, job status unchanged (awaiting higher-level resolution)
- `MaliciousFiling` — Remaining funds sent to treasury, job status → `Cancelled`

**Example**:
```rust
// Topics: ("escrow", "dispute")
// Data: (1u64, DisputeResolution::ClientWins, client_addr, freelancer_addr, token_addr)
```

**Notes for indexers**:
- Only emitted when a dispute is resolved (not when a dispute is opened)
- The `resolution` field determines fund distribution and final job status
- If all milestones were already approved before dispute resolution, only the job status is updated (no token transfers)

---

### 6. EscrowCompleted

**When emitted**: When all milestones are approved and the job reaches `Completed` status

**Triggering action**: Final milestone approval via `approve_milestone()`, `approve_milestones_batch()`, `finalize_inactivity_approval()`, or `release_partial_payment()`

**Topics**:
```rust
(symbol_short!("escrow"), Symbol::new(&env, "pmt_released"))
```

**Data fields**:
| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `u64` | Unique identifier of the completed job |
| `freelancer` | `Address` | Address of the freelancer who completed the job |
| `amount` | `i128` | Amount released in the final payment (net after fees) |

**Example**:
```rust
// Topics: ("escrow", "pmt_released")
// Data: (1u64, freelancer_addr, 1500i128)
```

**Notes for indexers**:
- This event is emitted **in addition to** the `MilestoneReleased` event for the final milestone
- Signals that the job has transitioned to `Completed` status
- `amount` is the net freelancer payment for the final milestone(s) (after fee deduction)
- For batch approvals, `amount` is the total net payment for all milestones in the batch
- This is the terminal event for a successfully completed job

---

## Additional Events

The escrow contract also emits several auxiliary events for specific operations:

### Top-Up Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("top_up"))`

**Data**: `(job_id, client, amount, new_funded_amount)`

**When emitted**: Client incrementally tops up escrow balance via `top_up_escrow()`

### Fee Collection Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("fee"))`

**Data**: `(job_id, milestone_id, fee_amount, treasury)`

**When emitted**: Platform fee is deducted during milestone approval

### Batch Fee Collection Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("fee_batch"))`

**Data**: `(job_id, fee_amount, treasury)`

**When emitted**: Platform fee is deducted during batch milestone approval

### Batch Approval Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("batch"))`

**Data**: `(job_id, milestone_indices, total_released, client, freelancer)`

**When emitted**: Multiple milestones are approved at once via `approve_milestones_batch()`

### Partial Payment Event

**Topics**: `(symbol_short!("escrow"), Symbol::new(&env, "partial_pmt"))`

**Data**: `(job_id, milestone_index, amount, client, freelancer)`

**When emitted**: Client releases a partial payment for a milestone via `release_partial_payment()`

### Job Cancelled Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("cancelled"))`

**Data**: `(job_id, client, freelancer, refund_amount)`

**When emitted**: Client cancels a funded job with no work in progress via `cancel_job()`

### Job Expired Event

**Topics**: `(symbol_short!("escrow"), Symbol::new(&env, "job_expired"))`

**Data**: `(job_id, client, freelancer, token, refund_amount)`

**When emitted**: Job deadline passes and is expired via `expire_job()`

### Deadline Extension Event

**Topics**: `(symbol_short!("escrow"), symbol_short!("deadline"))`

**Data**: `(job_id, milestone_id, new_deadline)`

**When emitted**: Milestone deadline is extended via `extend_deadline()`

### Revision Proposal Events

**Topics**: `(Symbol::new(&env, "revision_proposed"),)`

**Data**: `(job_id, proposer, client, freelancer, new_total)`

**When emitted**: Either party proposes a job revision via `propose_revision()`

---

**Topics**: `(Symbol::new(&env, "revision_accepted"),)`

**Data**: `(job_id, acceptor, client, freelancer, new_total, delta)`

**When emitted**: Non-proposing party accepts a revision via `accept_revision()`

---

**Topics**: `(Symbol::new(&env, "revision_rejected"),)`

**Data**: `(job_id, rejector, client, freelancer)`

**When emitted**: Non-proposing party rejects a revision via `reject_revision()`

---

**Topics**: `(Symbol::new(&env, "revision_cancelled"),)`

**Data**: `(job_id, proposer, client, freelancer)`

**When emitted**: Proposer cancels their own revision via `cancel_revision_proposal()`

### Inactivity Events

**Topics**: `(symbol_short!("escrow"), Symbol::new(&env, "inact_trig"))`

**Data**: `(job_id, milestone_id, caller, auto_approve_at)`

**When emitted**: Inactivity extension is triggered via `trigger_inactivity_extension()`

---

**Topics**: `(symbol_short!("escrow"), Symbol::new(&env, "inact_final"))`

**Data**: `(job_id, milestone_id, caller)`

**When emitted**: Inactivity-based auto-approval is finalized via `finalize_inactivity_approval()`

### Multi-Sig Admin Events

**Topics**: `(symbol_short!("msig"), symbol_short!("proposed"))`

**Data**: `(proposal_id, proposer, action)`

**When emitted**: Admin action is proposed via `propose_admin_action()`

---

**Topics**: `(symbol_short!("msig"), symbol_short!("approved"))`

**Data**: `(proposal_id, approver)`

**When emitted**: Admin action is approved via `approve_admin_action()`

---

**Topics**: `(symbol_short!("msig"), symbol_short!("executed"))`

**Data**: `(proposal_id, action)`

**When emitted**: Admin action is executed via `execute_proposal()`

### Pause/Unpause Events

**Topics**: `(symbol_short!("paused"),)`

**Data**: `(contract_address, timestamp)`

**When emitted**: Contract is paused via multi-sig admin action

---

**Topics**: `(symbol_short!("unpaused"),)`

**Data**: `(contract_address, timestamp)`

**When emitted**: Contract is unpaused via multi-sig admin action

### Emergency Withdrawal Event

**Topics**: `(symbol_short!("escrow"), Symbol::new(&env, "emrg_wdrw"))`

**Data**: `(job_id, recipient, withdrawable, client, freelancer)`

**When emitted**: Emergency withdrawal is executed via multi-sig admin action (contract must be paused)

---

## Event Ordering Guarantees

Events are emitted in the order they occur within a transaction. For operations that emit multiple events (e.g., milestone approval with fee collection), the order is:

1. Fee collection event (if applicable)
2. Milestone approval event
3. Payment released event (if job completed)

## Deduplication

All events include `job_id` as the first data field, allowing indexers to group events by job. The combination of `job_id` and event type provides a natural deduplication key for most events. For milestone-specific events, the combination of `job_id` and `milestone_id` provides uniqueness.

## Indexing Recommendations

1. **Index by job_id**: Primary key for grouping all events related to a specific job
2. **Index by event type**: Filter events by topic[1] for specific event types
3. **Index by addresses**: Track all jobs for a specific client or freelancer
4. **Index by timestamp**: Use ledger sequence or timestamp for chronological ordering
5. **Track job state**: Maintain a state machine based on event sequence to derive current job status

## Event Schema Version

This document describes the event schema as of escrow contract version **0.1.0** using **soroban-sdk 21.7.5**.

## Related Documentation

- [Escrow Contract README](../contracts/escrow/README.md) — Contract features and TTL strategy
- [Contributing Guide](./CONTRIBUTING.md) — Development setup and coding standards
