import re

with open("contracts/reputation/src/lib.rs", "r") as f:
    content = f.read()

content = re.sub(
    r"pub struct UserReputation \{\s+pub user: Address,\s+pub total_score: u64,\s+pub total_weight: u64,\s+pub review_count: u32,\s+\}",
    """pub struct UserReputation {
    pub user: Address,
    pub total_score: u64,
    pub total_weight: u64,
    pub review_count: u32,
    pub last_updated_ledger: u32,
}""",
    content
)

with open("contracts/reputation/src/lib.rs", "w") as f:
    f.write(content)

with open("contracts/dispute/src/lib.rs", "r") as f:
    content = f.read()

content = re.sub(
    r"pub struct UserReputation \{\s+pub user: Address,\s+pub total_score: u64,\s+pub total_weight: u64,\s+pub review_count: u32,\s+\}",
    """pub struct UserReputation {
    pub user: Address,
    pub total_score: u64,
    pub total_weight: u64,
    pub review_count: u32,
    pub last_updated_ledger: u32,
}""",
    content
)

with open("contracts/dispute/src/lib.rs", "w") as f:
    f.write(content)

