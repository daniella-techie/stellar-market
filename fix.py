import re
import sys

def fix_file(path):
    with open(path, "r") as f:
        content = f.read()

    content = re.sub(
        r"UserReputation \{\s*user: ([^,]+),\s*total_score: 0,\s*total_weight: 0,\s*review_count: 0,\s*\}",
        r"UserReputation {\n\t\t\t\t\tuser: \1,\n\t\t\t\t\ttotal_score: 0,\n\t\t\t\t\ttotal_weight: 0,\n\t\t\t\t\treview_count: 0,\n\t\t\t\t\tlast_updated_ledger: env.ledger().sequence(),\n\t\t\t\t}",
        content
    )
    with open(path, "w") as f:
        f.write(content)

fix_file("contracts/reputation/src/lib.rs")
fix_file("contracts/dispute/src/lib.rs")
