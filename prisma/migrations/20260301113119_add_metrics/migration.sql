-- CreateTable
CREATE TABLE "metric_definitions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "lower_bound" DOUBLE PRECISION,
    "upper_bound" DOUBLE PRECISION,
    "target" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_data_points" (
    "id" TEXT NOT NULL,
    "metric_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_definitions_project_id_idx" ON "metric_definitions"("project_id");

-- CreateIndex
CREATE INDEX "metric_data_points_metric_id_idx" ON "metric_data_points"("metric_id");

-- CreateIndex
CREATE INDEX "metric_data_points_recorded_at_idx" ON "metric_data_points"("recorded_at");

-- AddForeignKey
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_data_points" ADD CONSTRAINT "metric_data_points_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metric_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_data_points" ADD CONSTRAINT "metric_data_points_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
