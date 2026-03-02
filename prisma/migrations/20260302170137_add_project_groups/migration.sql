-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('CHAIR', 'SECRETARY', 'MEMBER');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "meeting_actions" ADD COLUMN     "target_project_id" TEXT;

-- AlterTable
ALTER TABLE "meeting_notes" ADD COLUMN     "group_id" TEXT,
ALTER COLUMN "project_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "project_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "department" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_group_links" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_group_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_groups_created_by_id_idx" ON "project_groups"("created_by_id");

-- CreateIndex
CREATE INDEX "project_groups_status_idx" ON "project_groups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "project_group_links_group_id_idx" ON "project_group_links"("group_id");

-- CreateIndex
CREATE INDEX "project_group_links_project_id_idx" ON "project_group_links"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_group_links_group_id_project_id_key" ON "project_group_links"("group_id", "project_id");

-- CreateIndex
CREATE INDEX "meeting_notes_group_id_idx" ON "meeting_notes"("group_id");

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "project_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_groups" ADD CONSTRAINT "project_groups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "project_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_group_links" ADD CONSTRAINT "project_group_links_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "project_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_group_links" ADD CONSTRAINT "project_group_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
