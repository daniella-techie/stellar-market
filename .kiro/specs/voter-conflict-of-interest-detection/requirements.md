# Requirements Document

## Introduction

This feature adds conflict of interest detection to the dispute contract system to ensure fair and unbiased voting. Voters who have previously worked with either the client or freelancer in a disputed job may have bias that compromises the integrity of the dispute resolution process. The system will detect these relationships by cross-referencing job history in the escrow contract and prevent conflicted voters from participating.

## Glossary

- **Dispute_Contract**: The smart contract that manages dispute resolution through community voting
- **Escrow_Contract**: The smart contract that manages job creation, funding, and milestone payments
- **Voter**: An address attempting to cast a vote on a dispute
- **Disputing_Party**: Either the client or freelancer involved in a dispute
- **Job_History**: The record of all jobs stored in the Escrow_Contract
- **Conflict_Of_Interest**: A prior working relationship between a Voter and a Disputing_Party
- **Excluded_Voter**: A Voter who is explicitly prohibited from voting on a specific dispute
- **Dispute_Creation**: The moment when a dispute is raised and initialized in the system

## Requirements

### Requirement 1: Initialize Escrow Contract Reference

**User Story:** As a system administrator, I want the dispute contract to reference the escrow contract, so that it can query job history for conflict detection

#### Acceptance Criteria

1. THE Dispute_Contract SHALL accept an escrow_contract Address parameter during initialization
2. THE Dispute_Contract SHALL store the escrow_contract Address in persistent storage
3. THE Dispute_Contract SHALL extend storage TTL for the escrow_contract Address using the same thresholds as other persistent data

### Requirement 2: Detect Conflict of Interest Through Job History

**User Story:** As a dispute participant, I want voters with prior working relationships to be excluded, so that the voting process remains unbiased

#### Acceptance Criteria

1. WHEN a Voter attempts to cast a vote, THE Dispute_Contract SHALL query the Escrow_Contract to retrieve the total job count
2. FOR EACH job in the Escrow_Contract, THE Dispute_Contract SHALL check if the Voter appears as either client or freelancer
3. FOR EACH job where the Voter appears, THE Dispute_Contract SHALL check if either Disputing_Party also appears in that same job
4. IF the Voter and any Disputing_Party share a job, THEN THE Dispute_Contract SHALL return error ConflictOfInterest
5. IF no shared job history is found, THE Dispute_Contract SHALL proceed with vote validation

### Requirement 3: Maintain Excluded Voter List

**User Story:** As a dispute initiator, I want to explicitly exclude specific voters, so that I can prevent participation from addresses I know have conflicts

#### Acceptance Criteria

1. THE Dispute_Contract SHALL add an excluded_voters field of type Vec<Address> to the Dispute struct
2. WHEN a dispute is raised, THE Dispute_Contract SHALL initialize excluded_voters as an empty vector
3. THE Dispute_Contract SHALL store excluded_voters with the same TTL management as other Dispute fields

### Requirement 4: Add Voters to Exclusion List

**User Story:** As a dispute participant, I want to add voters to the exclusion list during the open phase, so that I can prevent known conflicts from voting

#### Acceptance Criteria

1. THE Dispute_Contract SHALL provide an add_excluded_voter function accepting dispute_id and voter Address
2. WHEN add_excluded_voter is called, THE Dispute_Contract SHALL verify the caller is either the client or freelancer
3. IF the dispute status is not Open, THEN THE Dispute_Contract SHALL return error VotingClosed
4. IF the caller is authorized and status is Open, THE Dispute_Contract SHALL append the voter Address to excluded_voters
5. THE Dispute_Contract SHALL emit an event when a voter is added to the exclusion list

### Requirement 5: Check Excluded Voter Status

**User Story:** As a system integrator, I want to query if a voter is excluded, so that I can display this information in the user interface

#### Acceptance Criteria

1. THE Dispute_Contract SHALL provide an is_excluded_voter function accepting dispute_id and voter Address
2. THE is_excluded_voter function SHALL return true if the voter Address exists in the excluded_voters list
3. THE is_excluded_voter function SHALL return false if the voter Address does not exist in the excluded_voters list
4. THE is_excluded_voter function SHALL return false if the dispute does not exist

### Requirement 6: Enforce Exclusion During Vote Casting

**User Story:** As a dispute participant, I want excluded voters to be rejected, so that the exclusion list is enforced

#### Acceptance Criteria

1. WHEN a Voter attempts to cast a vote, THE Dispute_Contract SHALL check if the Voter exists in excluded_voters
2. IF the Voter is in excluded_voters, THEN THE Dispute_Contract SHALL return error ConflictOfInterest
3. IF the Voter is not in excluded_voters, THE Dispute_Contract SHALL proceed with other vote validations

### Requirement 7: Populate Exclusion List at Dispute Creation

**User Story:** As a dispute initiator, I want the system to automatically detect conflicts at creation time, so that I don't have to manually identify all conflicted voters

#### Acceptance Criteria

1. WHEN a dispute is raised, THE Dispute_Contract SHALL query the Escrow_Contract for all jobs
2. FOR EACH job, THE Dispute_Contract SHALL identify addresses that appear as client or freelancer with either Disputing_Party
3. THE Dispute_Contract SHALL add all identified conflicted addresses to excluded_voters
4. THE Dispute_Contract SHALL deduplicate addresses in excluded_voters to prevent duplicate entries

### Requirement 8: Cross-Contract Job History Query

**User Story:** As a system developer, I want a reliable method to query job participation, so that conflict detection is accurate

#### Acceptance Criteria

1. THE Dispute_Contract SHALL call get_job_count on the Escrow_Contract to determine the total number of jobs
2. FOR EACH job_id from 1 to job_count, THE Dispute_Contract SHALL call get_job on the Escrow_Contract
3. IF a get_job call fails, THE Dispute_Contract SHALL skip that job and continue checking remaining jobs
4. THE Dispute_Contract SHALL extract client and freelancer addresses from each Job struct returned

### Requirement 9: Unit Test Coverage for Conflict Detection

**User Story:** As a quality assurance engineer, I want comprehensive tests for conflict detection, so that I can verify the feature works correctly

#### Acceptance Criteria

1. THE test suite SHALL include a mock Escrow_Contract that returns configurable job data
2. THE test suite SHALL verify that voters with shared job history are rejected with ConflictOfInterest error
3. THE test suite SHALL verify that voters without shared job history can vote successfully
4. THE test suite SHALL verify that excluded_voters list is correctly populated at dispute creation
5. THE test suite SHALL verify that add_excluded_voter correctly adds voters during Open status
6. THE test suite SHALL verify that add_excluded_voter rejects calls when status is not Open
7. THE test suite SHALL verify that is_excluded_voter returns correct boolean values
8. THE test suite SHALL verify that manually excluded voters are rejected during vote casting

### Requirement 10: Error Handling for Cross-Contract Calls

**User Story:** As a system operator, I want graceful error handling for escrow queries, so that the system remains functional even if some queries fail

#### Acceptance Criteria

1. WHEN the Escrow_Contract is not initialized, THE Dispute_Contract SHALL skip conflict detection and proceed with voting
2. WHEN a get_job call returns an error, THE Dispute_Contract SHALL log the failure and continue checking other jobs
3. WHEN get_job_count returns zero, THE Dispute_Contract SHALL skip job history checks and initialize excluded_voters as empty
4. THE Dispute_Contract SHALL not fail dispute creation or vote casting due to escrow query errors
