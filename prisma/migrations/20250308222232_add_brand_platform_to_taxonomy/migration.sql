-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_taxonomy_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "country_id" INTEGER NOT NULL,
    "brand_id" INTEGER,
    "platform" TEXT,
    "month" TEXT NOT NULL,
    "l1_score" INTEGER NOT NULL,
    "l2_score" INTEGER NOT NULL,
    "l3_score" INTEGER NOT NULL,
    "average_score" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "taxonomy_scores_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "taxonomy_scores_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_taxonomy_scores" ("average_score", "country_id", "created_at", "id", "l1_score", "l2_score", "l3_score", "month", "updated_at") SELECT "average_score", "country_id", "created_at", "id", "l1_score", "l2_score", "l3_score", "month", "updated_at" FROM "taxonomy_scores";
DROP TABLE "taxonomy_scores";
ALTER TABLE "new_taxonomy_scores" RENAME TO "taxonomy_scores";
CREATE UNIQUE INDEX "taxonomy_scores_country_id_brand_id_platform_month_key" ON "taxonomy_scores"("country_id", "brand_id", "platform", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
