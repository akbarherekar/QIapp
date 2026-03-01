-- CreateEnum
CREATE TYPE "InboxMessageChannel" AS ENUM ('MANUAL', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "InboxMessageStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'REVIEWED', 'APPLIED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "InboxActionType" AS ENUM ('CREATE_TASK', 'UPDATE_TASK', 'COMPLETE_TASK', 'ADD_NOTE', 'STATUS_UPDATE');

-- CreateEnum
CREATE TYPE "InboxActionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FAILED');

-- AlterEnum
ALTER TYPE "ActivitySource" ADD VALUE 'AI_INBOX';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "inbox_auto_apply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inbox_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inbox_shortcode" TEXT;

-- CreateTable
CREATE TABLE "inbox_messages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "channel" "InboxMessageChannel" NOT NULL,
    "status" "InboxMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "sender_identifier" TEXT NOT NULL,
    "subject" TEXT,
    "raw_body" TEXT NOT NULL,
    "processed_summary" TEXT,
    "classification" TEXT,
    "llm_response" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_actions" (
    "id" TEXT NOT NULL,
    "inbox_message_id" TEXT NOT NULL,
    "action_type" "InboxActionType" NOT NULL,
    "status" "InboxActionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "applied_data" JSONB,
    "target_task_id" TEXT,
    "created_task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "inbox_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbox_messages_project_id_idx" ON "inbox_messages"("project_id");

-- CreateIndex
CREATE INDEX "inbox_messages_status_idx" ON "inbox_messages"("status");

-- CreateIndex
CREATE INDEX "inbox_messages_created_at_idx" ON "inbox_messages"("created_at");

-- CreateIndex
CREATE INDEX "inbox_actions_inbox_message_id_idx" ON "inbox_actions"("inbox_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_inbox_shortcode_key" ON "projects"("inbox_shortcode");

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_actions" ADD CONSTRAINT "inbox_actions_inbox_message_id_fkey" FOREIGN KEY ("inbox_message_id") REFERENCES "inbox_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
