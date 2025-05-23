-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rule_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "country_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "trend" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL DEFAULT 'NA',
    "status" TEXT NOT NULL DEFAULT 'Normal',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "scores_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "scores_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "scores_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_scores" ("brand_id", "country_id", "created_at", "evaluation", "id", "month", "platform", "rule_id", "score", "trend", "updated_at") SELECT "brand_id", "country_id", "created_at", "evaluation", "id", "month", "platform", "rule_id", "score", "trend", "updated_at" FROM "scores";
DROP TABLE "scores";
ALTER TABLE "new_scores" RENAME TO "scores";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
