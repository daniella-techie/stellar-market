-- Add isSuspiciousReporter flag to User model
ALTER TABLE "User" ADD COLUMN "isSuspiciousReporter" BOOLEAN NOT NULL DEFAULT false;

-- Add requiresReview flag to Report model
ALTER TABLE "Report" ADD COLUMN "requiresReview" BOOLEAN NOT NULL DEFAULT false;
