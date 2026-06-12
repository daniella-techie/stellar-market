#533 Refactor dispute state transitions with explicit error codes
Repo Avatar
stellarmarket-labs/stellar-market
Overview
The dispute contract uses generic panics in several places. Replace all panics with typed ContractError variants to improve debuggability and allow the frontend to display meaningful error messages.

Requirements
Define DisputeError enum covering all failure modes
Replace all panic! and unwrap() calls in non-test code
Return Result from all public functions
Map error codes to human-readable strings in docs/errors.md
Acceptance Criteria
No panic! or unwrap() in src/ (only tests)
All error variants documented
Error codes stable across contract upgrades
Tests assert specific error variants on failure paths

#534 Implement reputation score decay over time
Repo Avatar
stellarmarket-labs/stellar-market
Overview
Reputation scores should decay gradually for inactive users to prevent early adopters from having a permanent advantage and to keep scores reflecting recent activity.

Requirements
Apply a decay factor (e.g., 1% per 30 days) to scores not updated within a threshold
Decay is computed lazily on next score read/write (not a cron)
Store last_updated_ledger: u32 alongside each score
Decay formula: new_score = score \* decay_rate ^ periods_elapsed
Acceptance Criteria
Decay computed correctly using integer math (no floats)
last_updated_ledger updated on every score change
Test with 0 elapsed periods (no decay), 1 period, 10 periods
Decay rate configurable by admin

#535 Add skill endorsement system to reputation contract
Repo Avatar
stellarmarket-labs/stellar-market
Overview
Users should be able to endorse each other for specific skills (e.g., "Rust", "Smart Contracts", "UI Design"). Endorsements contribute to a skill-specific reputation breakdown.

Requirements
Store Map> of endorsers per skill per user
Add endorse(target: Address, skill: String) — one endorsement per (endorser, skill, target) triple
Add get_skill_score(user: Address, skill: String) -> u32 view function
Endorsements from high-reputation users should carry more weight
Acceptance Criteria
Duplicate endorsement prevention (same endorser, skill, target)
Weighted endorsement calculation
Skill score view function returns correct value
Tests for endorsement, duplicate rejection, weight calculation

#536 Implement stake-weighted reputation scoring
Repo Avatar
stellarmarket-labs/stellar-market
Overview
Reputation scores should factor in how much a user has staked in the system. Higher stake = higher trust = higher score multiplier.

Requirements
Query staked balance from a staking contract (or store locally)
Apply a multiplier based on stake tier (e.g., <100 XLM: 1x, 100-1000 XLM: 1.2x, >1000 XLM: 1.5x)
Score = base_score \* stake_multiplier
Tiers configurable by admin
Acceptance Criteria
Stake tiers defined and configurable
Multiplier applied correctly at score retrieval
Tests for each stake tier boundary
Score never exceeds a defined maximum (e.g., 10,000)
