import re

with open("contracts/reputation/src/lib.rs", "r") as f:
    content = f.read()

# 1. Add new errors
content = re.sub(
    r"AppealAlreadyResolved = 22,",
    "AppealAlreadyResolved = 22,\n    AlreadyEndorsed = 23,",
    content
)

# 2. Add new DataKeys
content = re.sub(
    r"DisputeContract,",
    "DisputeContract,\n    Endorsement(Address, String, Address),\n    SkillEndorsers(Address, String),\n    StakeTiers,",
    content
)

# 3. Add StakeTier struct
structs = """
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakeTier {
    pub threshold: i128,
    pub multiplier: u32,
}
"""
content = re.sub(
    r"pub struct UserReputation \{",
    structs + "\n#[contracttype]\n#[derive(Clone, Debug, Eq, PartialEq)]\npub struct UserReputation {",
    content
)

# 4. Implement get_decayed_totals and lazy_decay properly
decay_code = """
    fn apply_lazy_decay(env: &Env, rep: &mut UserReputation) {
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

    fn get_decayed_totals(env: &Env, user: Address) -> (u64, u64, u32) {
        let rep_key = DataKey::Reputation(user.clone());
        let mut rep: UserReputation = env.storage().persistent().get(&rep_key).unwrap_or(UserReputation {
            user: user.clone(),
            total_score: 0,
            total_weight: 0,
            review_count: 0,
            last_updated_ledger: env.ledger().sequence(),
        });
        
        Self::apply_lazy_decay(env, &mut rep);
        (rep.total_score, rep.total_weight, rep.review_count)
    }
"""

content = re.sub(
    r"fn get_decayed_totals\(env: &Env, user: Address\) -> \(u64, u64, u32\) \{.*?(?=pub fn get_average_rating)",
    decay_code + "\n    ",
    content,
    flags=re.DOTALL
)

# 5. Fix submit_review to apply lazy decay before updating
submit_review_update = """
        let rep_key = DataKey::Reputation(reviewee.clone());
        let mut reputation: UserReputation =
            env.storage()
                .persistent()
                .get(&rep_key)
                .unwrap_or(UserReputation {
                    user: reviewee.clone(),
                    total_score: 0,
                    total_weight: 0,
                    review_count: 0,
                    last_updated_ledger: env.ledger().sequence(),
                });

        Self::apply_lazy_decay(&env, &mut reputation);

        reputation.total_score += (rating as u64) * weight;
        reputation.total_weight += weight;
        reputation.review_count += 1;
        reputation.last_updated_ledger = env.ledger().sequence();
"""
content = re.sub(
    r"let rep_key = DataKey::Reputation\(reviewee\.clone\(\)\);.*?reputation\.review_count \+= 1;",
    submit_review_update,
    content,
    flags=re.DOTALL
)

# 6. Add Endorsement functions
endorsement_funcs = """
    pub fn endorse(env: Env, endorser: Address, target: Address, skill: String) -> Result<(), ReputationError> {
        endorser.require_auth();
        require_not_paused(&env)?;
        
        let key = DataKey::Endorsement(target.clone(), skill.clone(), endorser.clone());
        if env.storage().persistent().has(&key) {
            return Err(ReputationError::AlreadyEndorsed);
        }
        
        env.storage().persistent().set(&key, &true);
        
        let list_key = DataKey::SkillEndorsers(target.clone(), skill.clone());
        let mut endorsers: Vec<Address> = env.storage().persistent().get(&list_key).unwrap_or(Vec::new(&env));
        endorsers.push_back(endorser.clone());
        env.storage().persistent().set(&list_key, &endorsers);
        
        Ok(())
    }

    pub fn get_skill_score(env: Env, user: Address, skill: String) -> u32 {
        let list_key = DataKey::SkillEndorsers(user.clone(), skill.clone());
        let endorsers: Vec<Address> = env.storage().persistent().get(&list_key).unwrap_or(Vec::new(&env));
        
        let mut score = 0;
        for endorser in endorsers.iter() {
            let avg_rating = Self::get_average_rating(env.clone(), endorser.clone()).unwrap_or(0);
            let weight = if avg_rating > 0 { avg_rating / 100 } else { 1 };
            score += weight as u32;
        }
        
        score
    }
"""

content = re.sub(
    r"pub fn get_average_rating",
    endorsement_funcs + "\n    pub fn get_average_rating",
    content
)

# 7. Add Stake Tiers functions and modify get_average_rating
stake_funcs = """
    pub fn set_stake_tiers(env: Env, admin: Address, tiers: Vec<StakeTier>) -> Result<(), ReputationError> {
        admin.require_auth();
        if !is_signer(&env, &admin) {
            return Err(ReputationError::NotAdmin);
        }
        env.storage().instance().set(&DataKey::StakeTiers, &tiers);
        Ok(())
    }

    pub fn get_stake_multiplier(env: &Env, user: &Address) -> u32 {
        let balance_key = DataKey::StakeBalance(user.clone());
        let balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        
        let tiers: Vec<StakeTier> = env.storage().instance().get(&DataKey::StakeTiers).unwrap_or(Vec::new(env));
        let mut multiplier = 100; // Default 1x
        
        for tier in tiers.iter() {
            if balance >= tier.threshold {
                multiplier = tier.multiplier;
            }
        }
        multiplier
    }
"""

content = re.sub(
    r"pub fn get_average_rating\(env: Env, user: Address\) -> Result<u64, ReputationError> \{",
    stake_funcs + """
    pub fn get_average_rating(env: Env, user: Address) -> Result<u64, ReputationError> {
        let multiplier = Self::get_stake_multiplier(&env, &user);
""",
    content
)

content = re.sub(
    r"Ok\(\(total_score \* 100\) / total_weight\)",
    r"let base_score = (total_score * 100) / total_weight;\n        Ok((base_score * (multiplier as u64)) / 100)",
    content
)

with open("contracts/reputation/src/lib.rs", "w") as f:
    f.write(content)
