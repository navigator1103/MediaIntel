-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_change_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "score_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "requested_score" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted for Review',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "change_requests_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "scores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_change_requests" ("comments", "created_at", "id", "requested_score", "score_id", "status", "updated_at") SELECT "comments", "created_at", "id", "requested_score", "score_id", "status", "updated_at" FROM "change_requests";
DROP TABLE "change_requests";
ALTER TABLE "new_change_requests" RENAME TO "change_requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
