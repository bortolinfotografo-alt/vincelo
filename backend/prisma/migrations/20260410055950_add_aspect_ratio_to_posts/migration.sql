-- CreateEnum
CREATE TYPE "AspectRatio" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "aspectRatio" "AspectRatio" DEFAULT 'LANDSCAPE';
