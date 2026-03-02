-- CreateEnum
CREATE TYPE "MeetingNoteStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'REVIEWED', 'APPLIED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "MeetingActionType" AS ENUM ('CREATE_TASK', 'UPDATE_TASK', 'COMPLETE_TASK', 'ADD_NOTE', 'STATUS_UPDATE');

-- CreateEnum
CREATE TYPE "MeetingActionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "submitted_by_id" TEXT NOT NULL,
    "status" "MeetingNoteStatus" NOT NULL DEFAULT 'RECEIVED',
    "title" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT,
    "duration" INTEGER,
    "raw_transcript" TEXT NOT NULL,
    "processed_summary" TEXT,
    "key_decisions" JSONB,
    "llm_response" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_actions" (
    "id" TEXT NOT NULL,
    "meeting_note_id" TEXT NOT NULL,
    "action_type" "MeetingActionType" NOT NULL,
    "status" "MeetingActionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "applied_data" JSONB,
    "target_task_id" TEXT,
    "created_task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "meeting_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_notes_project_id_idx" ON "meeting_notes"("project_id");

-- CreateIndex
CREATE INDEX "meeting_notes_status_idx" ON "meeting_notes"("status");

-- CreateIndex
CREATE INDEX "meeting_notes_created_at_idx" ON "meeting_notes"("created_at");

-- CreateIndex
CREATE INDEX "meeting_actions_meeting_note_id_idx" ON "meeting_actions"("meeting_note_id");

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_actions" ADD CONSTRAINT "meeting_actions_meeting_note_id_fkey" FOREIGN KEY ("meeting_note_id") REFERENCES "meeting_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
