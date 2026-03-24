# Requirements Document

## Introduction

This document defines the requirements for an admin moderation system in a freelance marketplace platform. The system enables administrators to moderate content and users by flagging jobs, removing inappropriate content, and suspending user accounts. The feature includes both backend API endpoints with role-based access control and a frontend admin dashboard for managing moderation activities.

## Glossary

- **Admin**: A user with the ADMIN role who has elevated privileges to moderate content and users
- **User**: An entity in the system with a role (CLIENT, FREELANCER, or ADMIN) and authentication credentials
- **Job**: A work posting created by clients that can be flagged for moderation
- **Flagged_Job**: A job that has been marked by an admin as requiring review or action
- **Suspended_User**: A user account that has been temporarily disabled by an admin
- **Moderation_System**: The backend and frontend components that handle admin moderation functionality
- **Admin_Dashboard**: The frontend interface accessible only to admins for viewing and managing flagged content
- **Auth_Middleware**: The authentication and authorization layer that validates admin access

## Requirements

### Requirement 1: Admin Role Management

**User Story:** As a system administrator, I want users to have an ADMIN role option, so that I can designate which users have moderation privileges.

#### Acceptance Criteria

1. THE User_Model SHALL include a role field with ADMIN, CLIENT, and FREELANCER variants
2. WHEN a User is created with ADMIN role, THE Moderation_System SHALL grant access to admin endpoints
3. THE User_Model SHALL persist the role value in the database

### Requirement 2: Content Flagging Capability

**User Story:** As an admin, I want to flag jobs and users with reasons, so that I can track problematic content for review.

#### Acceptance Criteria

1. THE Job_Model SHALL include an isFlagged boolean field and a flagReason optional string field
2. THE User_Model SHALL include an isFlagged boolean field and a flagReason optional string field
3. WHEN an admin flags a Job, THE Moderation_System SHALL set isFlagged to true and store the provided flagReason
4. WHEN an admin flags a User, THE Moderation_System SHALL set isFlagged to true and store the provided flagReason

### Requirement 3: Job Flagging Endpoint

**User Story:** As an admin, I want to flag a job with a reason, so that I can mark it for review or action.

#### Acceptance Criteria

1. THE Moderation_System SHALL provide a POST /api/admin/jobs/:id/flag endpoint
2. WHEN a valid admin requests to flag a job with a reason, THE Moderation_System SHALL update the job's isFlagged field to true and store the flagReason
3. WHEN a non-admin user attempts to access the endpoint, THE Auth_Middleware SHALL return a 403 status code
4. WHEN the job ID does not exist, THE Moderation_System SHALL return a 404 status code
5. WHEN the flagReason is not provided, THE Moderation_System SHALL return a 400 status code

### Requirement 4: Job Removal Endpoint

**User Story:** As an admin, I want to remove or unpublish flagged jobs, so that I can take action on inappropriate content.

#### Acceptance Criteria

1. THE Moderation_System SHALL provide a POST /api/admin/jobs/:id/remove endpoint
2. WHEN a valid admin requests to remove a job, THE Moderation_System SHALL unpublish or delete the job
3. WHEN a non-admin user attempts to access the endpoint, THE Auth_Middleware SHALL return a 403 status code
4. WHEN the job ID does not exist, THE Moderation_System SHALL return a 404 status code

### Requirement 5: User Suspension Endpoint

**User Story:** As an admin, I want to suspend user accounts, so that I can prevent problematic users from accessing the platform.

#### Acceptance Criteria

1. THE Moderation_System SHALL provide a POST /api/admin/users/:id/suspend endpoint
2. WHEN a valid admin requests to suspend a user with a reason, THE Moderation_System SHALL mark the user account as suspended and store the suspension reason
3. WHEN a non-admin user attempts to access the endpoint, THE Auth_Middleware SHALL return a 403 status code
4. WHEN the user ID does not exist, THE Moderation_System SHALL return a 404 status code
5. WHEN the suspension reason is not provided, THE Moderation_System SHALL return a 400 status code

### Requirement 6: User Restoration Endpoint

**User Story:** As an admin, I want to restore suspended accounts, so that I can reinstate users after reviewing their cases.

#### Acceptance Criteria

1. THE Moderation_System SHALL provide a POST /api/admin/users/:id/restore endpoint
2. WHEN a valid admin requests to restore a user, THE Moderation_System SHALL remove the suspension status from the user account
3. WHEN a non-admin user attempts to access the endpoint, THE Auth_Middleware SHALL return a 403 status code
4. WHEN the user ID does not exist, THE Moderation_System SHALL return a 404 status code

### Requirement 7: Flagged Content Listing Endpoint

**User Story:** As an admin, I want to view all flagged jobs and suspended users, so that I can review and manage moderation cases.

#### Acceptance Criteria

1. THE Moderation_System SHALL provide a GET /api/admin/flagged endpoint
2. WHEN a valid admin requests the flagged content list, THE Moderation_System SHALL return all jobs where isFlagged is true and all users where suspended status is true
3. THE Moderation_System SHALL include job title, client information, flag reason, and flagged date for each flagged job
4. THE Moderation_System SHALL include username, wallet address, and suspension reason for each suspended user
5. WHEN a non-admin user attempts to access the endpoint, THE Auth_Middleware SHALL return a 403 status code

### Requirement 8: Admin Route Protection

**User Story:** As a system administrator, I want all admin endpoints protected by role verification, so that only authorized admins can access moderation functionality.

#### Acceptance Criteria

1. THE Auth_Middleware SHALL verify the user has ADMIN role before processing requests to /api/admin/* routes
2. WHEN a user without ADMIN role attempts to access any /api/admin/* endpoint, THE Auth_Middleware SHALL return a 403 status code
3. WHEN an unauthenticated user attempts to access any /api/admin/* endpoint, THE Auth_Middleware SHALL return a 401 status code
4. THE Auth_Middleware SHALL apply to all endpoints matching the /api/admin/* pattern

### Requirement 9: Suspended User Login Prevention

**User Story:** As a system administrator, I want suspended users to be unable to log in, so that account suspensions are enforced.

#### Acceptance Criteria

1. WHEN a suspended user attempts to log in, THE Auth_Middleware SHALL return a 403 status code
2. WHEN a suspended user attempts to log in, THE Moderation_System SHALL return an error message indicating the account is suspended
3. WHEN a non-suspended user attempts to log in, THE Auth_Middleware SHALL process the login normally

### Requirement 10: Admin Dashboard Page

**User Story:** As an admin, I want a dedicated admin dashboard page, so that I can access moderation tools in one place.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL be accessible at the /admin route
2. WHEN a user with ADMIN role navigates to /admin, THE Admin_Dashboard SHALL render the moderation interface
3. WHEN a user without ADMIN role attempts to access /admin, THE Admin_Dashboard SHALL redirect to an unauthorized page or return a 403 error
4. THE Admin_Dashboard SHALL display statistics including total jobs count, flagged jobs count, and suspended users count

### Requirement 11: Flagged Jobs Management Interface

**User Story:** As an admin, I want to view and manage flagged jobs in a table, so that I can review and take action on problematic content.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a table of flagged jobs
2. THE Admin_Dashboard SHALL show job title, client name, flag reason, and flagged date for each flagged job
3. THE Admin_Dashboard SHALL provide a Remove button for each flagged job that calls the job removal endpoint
4. THE Admin_Dashboard SHALL provide a Dismiss button for each flagged job that removes the flag without deleting the job
5. WHEN an admin clicks Remove, THE Admin_Dashboard SHALL update the table to remove the deleted job
6. WHEN an admin clicks Dismiss, THE Admin_Dashboard SHALL update the table to remove the dismissed job from the flagged list

### Requirement 12: Suspended Users Management Interface

**User Story:** As an admin, I want to view and manage suspended users in a table, so that I can restore accounts when appropriate.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a table of suspended users
2. THE Admin_Dashboard SHALL show username, wallet address, and suspension reason for each suspended user
3. THE Admin_Dashboard SHALL provide a Restore button for each suspended user that calls the user restoration endpoint
4. WHEN an admin clicks Restore, THE Admin_Dashboard SHALL update the table to remove the restored user from the suspended list
