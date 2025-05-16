/*
  Warnings:

  - You are about to drop the column `stripeCustumerId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripeCustumerId",
ADD COLUMN     "stripeCustomerId" TEXT;
