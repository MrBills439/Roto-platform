-- Add new enum value for notifications
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SHIFT_EXPIRED';

-- Create enum for assignment status
DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status/expiry tracking to assignments
ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3);

-- Existing assignments predate the accept flow: mark them as accepted
UPDATE "Assignment" SET "status" = 'ACCEPTED' WHERE "status" = 'PENDING';
