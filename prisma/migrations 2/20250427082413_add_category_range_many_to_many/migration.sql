/*
  Warnings:

  - You are about to drop the column `category_id` on the `ms_ranges` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ms_category_to_range" (
    "category_id" INTEGER NOT NULL,
    "range_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("category_id", "range_id"),
    CONSTRAINT "ms_category_to_range_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ms_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_category_to_range_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "ms_ranges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ms_ranges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_ms_ranges" ("created_at", "id", "name", "updated_at") SELECT "created_at", "id", "name", "updated_at" FROM "ms_ranges";
DROP TABLE "ms_ranges";
ALTER TABLE "new_ms_ranges" RENAME TO "ms_ranges";
CREATE UNIQUE INDEX "ms_ranges_name_key" ON "ms_ranges"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
