-- CreateEnum
CREATE TYPE "UserStoryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "user_stories" ADD COLUMN IF NOT EXISTS "priority" "UserStoryPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS "storyPoints" INTEGER;
