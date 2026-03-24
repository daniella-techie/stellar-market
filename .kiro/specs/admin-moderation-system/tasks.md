# Implementation Plan: Admin Moderation System

## Overview

This implementation plan breaks down the admin moderation system into discrete coding tasks. The system adds content moderation capabilities through backend API endpoints with role-based access control and a frontend admin dashboard. Implementation follows a bottom-up approach: database schema → authentication → API endpoints → frontend components.

## Tasks

- [ ] 1. Set up database schema and migrations
  - [x] 1.1 Extend Prisma User model with admin and moderation fields
    - Add role field with ADMIN, CLIENT, FREELANCER enum
    - Add isFlagged, flagReason fields for user flagging
    - Add isSuspended, suspendReason, suspendedAt fields for suspension
    - _Requirements: 1.1, 1.3, 2.2, 2.4_
  
  - [x] 1.2 Extend Prisma Job model with flagging fields
    - Add isFlagged, flagReason, flaggedAt, flaggedBy fields
    - _Requirements: 2.1, 2.3_
  
  - [x] 1.3 Create and run database migration
    - Generate Prisma migration for schema changes
    - Apply migration to development database
    - _Requirements: 1.3_

- [ ] 2. Implement authentication middleware extensions
  - [x] 2.1 Create requireAdmin middleware
    - Verify user has ADMIN role from JWT token
    - Return 401 for unauthenticated requests
    - Return 403 for non-admin users
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 2.2 Write property test for requireAdmin middleware
    - **Property 1: Admin role grants access to admin endpoints**
    - **Property 2: Non-admin users are denied access to admin endpoints**
    - **Property 3: Unauthenticated requests to admin endpoints are rejected**
    - **Validates: Requirements 1.2, 8.1, 8.2, 8.3**
  
  - [x] 2.3 Create checkSuspension middleware for login protection
    - Query user suspension status during authentication
    - Return 403 with suspension message for suspended users
    - Allow non-suspended users to proceed
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 2.4 Write property test for checkSuspension middleware
    - **Property 14: Suspended users cannot authenticate**
    - **Property 15: Non-suspended users can authenticate normally**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 3. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement admin API routes and controllers
  - [x] 4.1 Create Zod validation schemas
    - Define flagJobSchema with flagReason validation
    - Define suspendUserSchema with suspendReason validation
    - _Requirements: 3.5, 5.5_
  
  - [x] 4.2 Implement POST /api/admin/jobs/:id/flag endpoint
    - Validate request body with flagJobSchema
    - Update job isFlagged to true and store flagReason
    - Return 404 for non-existent job IDs
    - Return 400 for missing flagReason
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ]* 4.3 Write property test for job flagging
    - **Property 4: Flagging a job sets flag status and stores reason**
    - **Property 9: Non-existent resource IDs return 404**
    - **Property 10: Missing required fields return 400**
    - **Validates: Requirements 2.3, 3.2, 3.4, 3.5**
  
  - [x] 4.4 Implement POST /api/admin/jobs/:id/remove endpoint
    - Delete or mark job as unpublished
    - Return 404 for non-existent job IDs
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [ ]* 4.5 Write property test for job removal
    - **Property 8: Removing a job makes it inaccessible**
    - **Validates: Requirements 4.2_
  
  - [x] 4.6 Implement POST /api/admin/jobs/:id/dismiss endpoint
    - Set job isFlagged to false and clear flagReason
    - Return 404 for non-existent job IDs
    - _Requirements: 11.4, 11.6_
  
  - [x] 4.7 Implement POST /api/admin/users/:id/suspend endpoint
    - Validate request body with suspendUserSchema
    - Update user isSuspended to true and store suspendReason
    - Set suspendedAt timestamp
    - Return 404 for non-existent user IDs
    - Return 400 for missing suspendReason
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [ ]* 4.8 Write property test for user suspension
    - **Property 6: Suspending a user sets suspension status and stores reason**
    - **Validates: Requirements 5.2, 5.4, 5.5**
  
  - [x] 4.9 Implement POST /api/admin/users/:id/restore endpoint
    - Set user isSuspended to false and clear suspendReason
    - Clear suspendedAt timestamp
    - Return 404 for non-existent user IDs
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 4.10 Write property test for user restoration
    - **Property 7: Restoring a user removes suspension status**
    - **Validates: Requirements 6.2, 6.4**
  
  - [x] 4.11 Implement GET /api/admin/flagged endpoint
    - Query all jobs where isFlagged is true
    - Query all users where isSuspended is true
    - Include job title, client info, flag reason, flagged date
    - Include username, wallet address, suspension reason
    - Return structured response with flaggedJobs and suspendedUsers arrays
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 4.12 Write property test for flagged content query
    - **Property 11: Flagged content query returns only flagged items**
    - **Property 12: Flagged job responses contain all required fields**
    - **Property 13: Suspended user responses contain all required fields**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [x] 4.13 Implement GET /api/admin/stats endpoint
    - Query total jobs count
    - Query flagged jobs count
    - Query total users count
    - Query suspended users count
    - Return AdminStatsResponse
    - _Requirements: 10.4_
  
  - [x] 4.14 Wire admin routes with requireAdmin middleware
    - Apply requireAdmin middleware to all /api/admin/* routes
    - Register routes in Express app
    - _Requirements: 8.1, 8.4_

- [ ] 5. Checkpoint - Ensure API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement frontend admin dashboard
  - [ ] 6.1 Create admin route protection middleware
    - Create Next.js middleware to check /admin routes
    - Verify JWT token and decode user role
    - Redirect non-admin users to unauthorized page
    - _Requirements: 10.3_
  
  - [ ]* 6.2 Write property test for admin route protection
    - **Property 17: Admin dashboard denies access to non-admin users**
    - **Validates: Requirements 10.3**
  
  - [ ] 6.3 Create admin dashboard page component
    - Create app/admin/page.tsx as Server Component
    - Fetch statistics from GET /api/admin/stats
    - Fetch flagged content from GET /api/admin/flagged
    - Display statistics cards (total jobs, flagged jobs, total users, suspended users)
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [ ]* 6.4 Write property test for admin dashboard access
    - **Property 16: Admin dashboard is accessible to admin users**
    - **Validates: Requirements 10.2, 10.4**
  
  - [ ] 6.5 Create FlaggedJobsTable component
    - Accept initialJobs prop with FlaggedJob array
    - Display table with columns: title, client name, flag reason, flagged date
    - Add Remove button for each job
    - Add Dismiss button for each job
    - Implement client-side state management for table updates
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 6.6 Implement Remove button handler in FlaggedJobsTable
    - Call POST /api/admin/jobs/:id/remove on click
    - Show confirmation dialog before removal
    - Update table state to remove deleted job
    - Display success toast notification
    - Handle errors with error toast
    - _Requirements: 11.3, 11.5_
  
  - [ ]* 6.7 Write property test for Remove button functionality
    - **Property 18: Remove button deletes job and updates UI**
    - **Validates: Requirements 11.3, 11.5**
  
  - [ ] 6.8 Implement Dismiss button handler in FlaggedJobsTable
    - Call POST /api/admin/jobs/:id/dismiss on click
    - Update table state to remove dismissed job
    - Display success toast notification
    - Handle errors with error toast
    - _Requirements: 11.4, 11.6_
  
  - [ ]* 6.9 Write property test for Dismiss button functionality
    - **Property 19: Dismiss button unflags job and updates UI**
    - **Validates: Requirements 11.4, 11.6**
  
  - [ ] 6.10 Create SuspendedUsersTable component
    - Accept initialUsers prop with SuspendedUser array
    - Display table with columns: username, wallet address, suspension reason
    - Add Restore button for each user
    - Implement client-side state management for table updates
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 6.11 Implement Restore button handler in SuspendedUsersTable
    - Call POST /api/admin/users/:id/restore on click
    - Show confirmation dialog before restoration
    - Update table state to remove restored user
    - Display success toast notification
    - Handle errors with error toast
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 6.12 Write property test for Restore button functionality
    - **Property 20: Restore button unsuspends user and updates UI**
    - **Validates: Requirements 12.3, 12.4**

- [ ] 7. Implement error handling and user feedback
  - [ ] 7.1 Add error handling to all admin API endpoints
    - Return consistent ErrorResponse format
    - Handle database errors with 500 status
    - Handle validation errors with 400 status
    - Handle authorization errors with 401/403 status
    - Log errors for debugging
    - _Requirements: All requirements (error handling)_
  
  - [ ] 7.2 Add loading states to dashboard components
    - Show loading spinners during API calls
    - Disable buttons during async operations
    - Prevent duplicate submissions
    - _Requirements: 11.3, 11.4, 12.3_
  
  - [ ] 7.3 Add toast notification system to dashboard
    - Implement success toasts for completed actions
    - Implement error toasts for failed operations
    - Add retry options for network errors
    - _Requirements: All frontend requirements_

- [ ] 8. Integration and final wiring
  - [x] 8.1 Integrate checkSuspension middleware into login flow
    - Add checkSuspension to authentication route
    - Ensure suspended users receive 403 with message
    - Test login flow with suspended and active users
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 8.2 Add TypeScript types and interfaces
    - Export all API response types
    - Export component prop interfaces
    - Ensure type safety across frontend and backend
    - _Requirements: All requirements (type safety)_
  
  - [ ]* 8.3 Write integration tests for complete flows
    - Test flow: flag job → view in dashboard → dismiss flag
    - Test flow: suspend user → verify login blocked → restore user → verify login works
    - Test flow: remove job → verify 404 on subsequent access
    - _Requirements: All requirements (integration)_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- All admin endpoints are protected by requireAdmin middleware
- Frontend uses Next.js 13+ App Router with Server Components for initial data fetching
- Database changes require Prisma migrations before API implementation
