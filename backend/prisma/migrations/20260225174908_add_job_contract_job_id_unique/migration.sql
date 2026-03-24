/*
  Warnings:

  - You are about to drop the column `coverLetter` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `proposedBudget` on the `Application` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractJobId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bidAmount` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDuration` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposal` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadline` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('UNFUNDED', 'FUNDED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "coverLetter",
DROP COLUMN "proposedBudget",
ADD COLUMN     "bidAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedDuration" TEXT NOT NULL,
ADD COLUMN     "proposal" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "contractJobId" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'UNFUNDED',
ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedBy" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[];

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "contractDeadline" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "onChainIndex" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "suspendReason" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Job_contractJobId_key" ON "Job"("contractJobId");
