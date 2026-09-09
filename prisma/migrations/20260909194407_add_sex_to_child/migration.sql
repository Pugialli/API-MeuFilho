-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "sex" "Sex" NOT NULL DEFAULT 'UNKNOWN';
