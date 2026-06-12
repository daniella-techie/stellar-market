with open("contracts/reputation/src/lib.rs", "r") as f:
    content = f.read()

# Fix DisputeContract error
content = content.replace("DisputeContract,\n    Endorsement(Address, String, Address),\n    SkillEndorsers(Address, String),\n    StakeTiers, &dispute_contract);", "DisputeContract, &dispute_contract);")

# Remove duplicate AlreadyEndorsed
content = content.replace("AlreadyEndorsed = 23,\n    AlreadyEndorsed = 23,", "AlreadyEndorsed = 23,")

# Define apply_lazy_decay
apply_lazy_decay_code = """
pub fn apply_lazy_decay(env: &Env, rep: &mut UserReputation) {
    let decay_rate: u32 = env.storage().instance().get(&DataKey::DecayRate).unwrap_or(0);
    if decay_rate == 0 || decay_rate >= 100 {
        rep.last_updated_ledger = env.ledger().sequence();
        return;
    }

    let current_ledger = env.ledger().sequence();
    if current_ledger <= rep.last_updated_ledger {
        return;
    }

    let elapsed = current_ledger - rep.last_updated_ledger;
    let periods = elapsed / 518400; // e.g. 30 days

    if periods > 0 {
        let retained = 100_u64.saturating_sub(decay_rate as u64);
        let mut score = rep.total_score;
        let mut weight = rep.total_weight;

        for _ in 0..periods {
            score = (score * retained) / 100;
            weight = (weight * retained) / 100;
            if score == 0 && weight == 0 {
                break;
            }
        }

        rep.total_score = score;
        rep.total_weight = weight;
        rep.last_updated_ledger += periods * 518400;
    }
}

/// Helper function to calculate a decay factor."""
content = content.replace("/// Helper function to calculate a decay factor.", apply_lazy_decay_code)

with open("contracts/reputation/src/lib.rs", "w") as f:
    f.write(content)
