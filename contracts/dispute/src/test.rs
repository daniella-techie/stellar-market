#![cfg(test)]

use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, Env, String};

#[contract]
pub struct DummyEscrow;

#[contractimpl]
impl DummyEscrow {
    pub fn resolve_dispute_callback(_env: Env, _job_id: u64, _resolution: DisputeResolution) {}
}

// Mock reputation contract for testing
#[contract]
pub struct MockReputationContract;

#[contractimpl]
impl MockReputationContract {
    pub fn get_reputation(
        _env: Env,
        user: Address,
    ) -> Result<reputation::UserReputation, soroban_sdk::Error> {
        // Mock: Return high reputation for all users in tests
        // In real tests, you would use more sophisticated mocking
        Ok(reputation::UserReputation {
            user: user.clone(),
            total_score: 500,
            total_weight: 10,
            review_count: 5,
        })
    }
}

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    // Verify initialization by checking if we can set min reputation
    client.set_min_voter_reputation(&admin, &400);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);
    // Try to initialize again - should fail
    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);
}

#[test]
fn test_set_min_voter_reputation() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);
    client.set_min_voter_reputation(&admin, &500);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_set_min_voter_reputation_non_admin_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);
    // Non-admin tries to set min reputation - should fail
    client.set_min_voter_reputation(&non_admin, &500);
}

#[test]
fn test_is_eligible_voter_high_reputation() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    let voter = Address::generate(&env);

    let is_eligible = client.is_eligible_voter(&voter);
    // Mock returns high reputation for all users
    assert_eq!(is_eligible, true);
}

#[test]
fn test_vote_with_reputation_check() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );

    // Vote with reputation check - should succeed with mock
    let voter = Address::generate(&env);

    client.cast_vote(
        &dispute_id,
        &voter,
        &VoteChoice::Client,
        &String::from_str(&env, "Vote"),
    );

    let dispute = client.get_dispute(&dispute_id);
    assert_eq!(dispute.votes_for_client, 1);
}

#[test]
fn test_raise_dispute() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Work not delivered"),
        &3u32,
        &None,
    );

    assert_eq!(dispute_id, 1);

    let dispute = client.get_dispute(&dispute_id);
    assert_eq!(dispute.job_id, 1);
    assert_eq!(dispute.status, DisputeStatus::Open);
    assert_eq!(dispute.min_votes, 3);
}

#[test]
fn test_vote_and_resolve() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &freelancer,
        &String::from_str(&env, "Payment not released"),
        &3u32,
        &None,
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "Work was done"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "Agree with freelancer"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "Incomplete work"),
    );

    let result = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(result, DisputeStatus::ResolvedForFreelancer);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_resolve_without_enough_votes() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );

    let voter = Address::generate(&env);
    client.cast_vote(
        &dispute_id,
        &voter,
        &VoteChoice::Client,
        &String::from_str(&env, "Reason"),
    );

    client.resolve_dispute(&dispute_id, &escrow_contract_id);
}

#[test]
fn test_tie_break_favor_client() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let voter4 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &4u32, // min_votes set to 4
        &Some(TieBreakMethod::FavorClient),
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "C1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "C2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter4,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F2"),
    );

    let status = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(status, DisputeStatus::ResolvedForClient);
}

#[test]
fn test_tie_break_favor_freelancer() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let voter4 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &4u32,
        &Some(TieBreakMethod::FavorFreelancer),
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "C1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "C2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter4,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F2"),
    );

    let status = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(status, DisputeStatus::ResolvedForFreelancer);
}

#[test]
fn test_tie_break_refund_both() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let voter4 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &4u32,
        &Some(TieBreakMethod::RefundBoth),
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "C1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "C2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter4,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F2"),
    );

    let status = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(status, DisputeStatus::RefundedBoth);
}

#[test]
fn test_tie_break_escalate() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let voter4 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &4u32,
        &Some(TieBreakMethod::Escalate),
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "C1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "C2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter4,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F2"),
    );

    let status = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(status, DisputeStatus::Escalated);
}

#[test]
fn test_tie_break_default_refund_both() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let voter4 = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &4u32,
        &None, // Should default to RefundBoth
    );

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "C1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "C2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter4,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "F2"),
    );

    let status = client.resolve_dispute(&dispute_id, &escrow_contract_id);
    assert_eq!(status, DisputeStatus::RefundedBoth);
}

// ── Pause mechanism tests ─────────────────────────────────────────────────────

#[test]
fn test_pause_and_unpause() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    // Create a dispute first
    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );
    assert_eq!(dispute_id, 1);

    // Pause the contract
    client.pause(&admin);

    // Unpause the contract
    client.unpause(&admin);

    // Now raising another dispute should work
    let dispute_id2 = client.raise_dispute(
        &2u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue 2"),
        &3u32,
        &None,
    );
    assert_eq!(dispute_id2, 2);
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")] // NotAdmin
fn test_pause_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    // Try to pause with non-admin address
    client.pause(&non_admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")] // ContractPaused
fn test_raise_dispute_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);
    client.pause(&admin);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")] // ContractPaused
fn test_cast_vote_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );

    client.pause(&admin);

    let voter = Address::generate(&env);
    client.cast_vote(
        &dispute_id,
        &voter,
        &VoteChoice::Client,
        &String::from_str(&env, "Vote"),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")] // ContractPaused
fn test_resolve_dispute_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );

    // Add some votes
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);

    client.cast_vote(
        &dispute_id,
        &voter1,
        &VoteChoice::Client,
        &String::from_str(&env, "Vote 1"),
    );
    client.cast_vote(
        &dispute_id,
        &voter2,
        &VoteChoice::Freelancer,
        &String::from_str(&env, "Vote 2"),
    );
    client.cast_vote(
        &dispute_id,
        &voter3,
        &VoteChoice::Client,
        &String::from_str(&env, "Vote 3"),
    );

    client.pause(&admin);

    client.resolve_dispute(&dispute_id, &escrow_contract_id);
}

#[test]
fn test_read_only_functions_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let dispute_contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &dispute_contract_id);

    let reputation_contract_id = env.register_contract(None, MockReputationContract);
    let escrow_contract_id = env.register_contract(None, DummyEscrow);
    let admin = Address::generate(&env);

    client.initialize(&admin, &reputation_contract_id, &300, &escrow_contract_id);

    let user_client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let dispute_id = client.raise_dispute(
        &1u64,
        &user_client,
        &freelancer,
        &user_client,
        &String::from_str(&env, "Issue"),
        &3u32,
        &None,
    );

    client.pause(&admin);

    // Read-only functions should still work when paused
    let dispute = client.get_dispute(&dispute_id);
    assert_eq!(dispute.id, dispute_id);

    let count = client.get_dispute_count();
    assert_eq!(count, 1);

    let votes = client.get_votes(&dispute_id);
    assert_eq!(votes.len(), 0);

    let is_excluded = client.is_excluded_voter(&dispute_id, &Address::generate(&env));
    assert_eq!(is_excluded, false);
}
