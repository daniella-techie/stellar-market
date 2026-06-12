# Stellar Market Escrow Contract

Smart contract for milestone-based escrow payments on Stellar.

## Features

- Milestone-based job structure with individual deadlines
- Multi-signature admin controls with time-locked proposals
- Job revision proposals with escrow balance adjustments
- Dispute resolution integration
- Inactivity-based auto-approval for unresponsive clients
- Partial milestone payments
- Token allowlist for payment currencies
- Comprehensive event emission for off-chain indexing

## Storage TTL Strategy

### Why TTL Extension is Necessary

Soroban smart contracts use a rent-based storage model where persistent storage entries have a Time-To-Live (TTL) measured in ledgers. When a storage entry's TTL expires, it is archived and becomes inaccessible until restored. To prevent escrow data from being archived, the contract must periodically extend the TTL of its persistent storage entries.

### TTL Values

The contract uses the following TTL parameters based on Stellar's approximate 5-second ledger close time:

- **Ledgers per day**: 17,280 (86,400 seconds/day ÷ 5 seconds/ledger)
- **TTL Threshold**: 259,200 ledgers (~15 days)
  - When storage TTL falls below this threshold, it will be extended
- **TTL Extend To**: 518,400 ledgers (~30 days)
  - Target TTL value after extension

These values ensure that:
- Storage is extended when it has ~15 days remaining
- After extension, storage is valid for ~30 days
- For active escrows, regular operations will keep storage alive indefinitely
- For inactive escrows, storage remains accessible for audit/historical purposes

### Maximum TTL Limit

Soroban SDK 21.7.5 enforces a maximum TTL limit. The chosen values (518,400 ledgers for extend_to) are well within this limit and provide a reasonable balance between storage costs and maintenance frequency.

### Functions with Automatic TTL Extension

The following state-mutating functions automatically extend TTL for the storage keys they modify:

#### Job Lifecycle Functions
- `create_job` — extends job storage and instance storage (job count)
- `fund_job` — extends job storage
- `top_up_escrow` — extends job storage
- `cancel_job` — extends job storage
- `claim_refund` — extends job storage
- `expire_job` — extends job storage

#### Milestone Functions
- `submit_milestone` — extends job storage and milestone timestamp storage
- `approve_milestone` — extends job storage
- `approve_milestones_batch` — extends job storage
- `release_partial_payment` — extends job storage
- `trigger_inactivity_extension` — extends job storage and inactivity timestamp storage
- `finalize_inactivity_approval` — extends job storage

#### Revision Functions
- `propose_revision` — extends job storage and revision proposal storage
- `accept_revision` — extends job storage, revision proposal storage, and revision history storage
- `reject_revision` — extends job storage and revision proposal storage
- `cancel_revision_proposal` — extends job storage (removal, no TTL needed for deleted keys)

#### Admin Functions
- `extend_deadline` — extends job storage
- `execute_proposal_internal` (EmergencyWithdraw action) — extends job storage

#### Dispute Resolution
- `resolve_dispute_callback` — extends job storage

### Permissionless TTL Maintenance: `bump_escrow`

For long-running escrows or escrows approaching TTL expiry, the contract provides a permissionless maintenance function:

```rust
pub fn bump_escrow(env: Env, escrow_id: u64) -> Result<(), EscrowError>
```

**Who can call it**: Anyone — no authorization required

**When to use it**:
- Long-running escrows (e.g., multi-month projects) approaching the 15-day threshold
- Completed/cancelled escrows that need to remain accessible for audit or dispute purposes
- Preventive maintenance before expected periods of inactivity

**What it does**:
- Verifies the escrow exists
- Extends the TTL of the escrow's main storage key to ~30 days
- Does not modify escrow state or emit events
- Returns `EscrowError::JobNotFound` if the escrow doesn't exist

**Terminal state handling**: The function can be called for escrows in any state, including terminal states (Completed, Cancelled, Expired). This allows historical escrow data to remain accessible for audit trails and dispute resolution even after the escrow has concluded.

**Example invocation** (Stellar CLI):
```bash
stellar contract invoke \
  --id <ESCROW_CONTRACT_ID> \
  --source-account <ANY_ACCOUNT> \
  --network testnet \
  -- \
  bump_escrow \
  --escrow_id 42
```

### Storage Key Coverage

The automatic TTL extension strategy covers:

1. **Job storage** (`DataKey::Job(job_id)`) — extended by all job-modifying functions and `bump_escrow`
2. **Revision proposals** (`DataKey::RevisionProposal(job_id)`) — extended when proposals are created, accepted, or rejected
3. **Revision history** (`DataKey::RevisionHistory(job_id)`) — extended when revisions are accepted
4. **Milestone timestamps** (`DataKey::MilestoneSubmittedAt(job_id, milestone_id)`) — extended when milestones are submitted
5. **Inactivity timestamps** (`DataKey::InactivityAutoApproveAt(job_id, milestone_id)`) — extended when inactivity extensions are triggered
6. **Instance storage** (job count, admin config) — extended by initialization and job creation

Ephemeral keys (proposals, timestamps) are automatically extended by their respective functions when accessed, so `bump_escrow` only needs to maintain the main job storage key.

### Best Practices

1. **For active escrows**: No manual intervention needed — regular operations (milestone submissions, approvals, etc.) automatically extend TTL
2. **For long-running escrows**: Consider calling `bump_escrow` periodically (e.g., every 2-3 weeks) to ensure continuous availability
3. **For completed escrows**: If historical data must remain accessible beyond 30 days, call `bump_escrow` before the TTL expires
4. **For monitoring**: Off-chain services can track escrow TTLs and proactively call `bump_escrow` for escrows approaching expiry

## Build

```bash
cargo build --release --target wasm32-unknown-unknown -p stellar-market-escrow
```

## Test

```bash
cargo test -p stellar-market-escrow
```

## Deploy

See `contracts/README.md` for deployment instructions.
