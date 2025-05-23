-- CreateTable
CREATE TABLE "ms_upload_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "record_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
