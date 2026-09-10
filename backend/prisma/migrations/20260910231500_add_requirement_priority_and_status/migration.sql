-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "requirements" ADD COLUMN "priority" "RequirementPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT';
