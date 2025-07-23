-- CreateTable
CREATE TABLE "ms_campaign_names" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ms_campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "campaign_name_id" INTEGER,
    "range_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "business_unit_id" INTEGER,
    "year" INTEGER NOT NULL,
    "playback_id" TEXT,
    "burst" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_campaigns_campaign_name_id_fkey" FOREIGN KEY ("campaign_name_id") REFERENCES "ms_campaign_names" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "ms_ranges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "ms_countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "ms_business_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ms_campaigns" ("burst", "business_unit_id", "country_id", "created_at", "id", "name", "playback_id", "range_id", "updated_at", "year") SELECT "burst", "business_unit_id", "country_id", "created_at", "id", "name", "playback_id", "range_id", "updated_at", "year" FROM "ms_campaigns";
DROP TABLE "ms_campaigns";
ALTER TABLE "new_ms_campaigns" RENAME TO "ms_campaigns";
CREATE UNIQUE INDEX "ms_campaigns_name_range_id_country_id_year_burst_key" ON "ms_campaigns"("name", "range_id", "country_id", "year", "burst");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ms_campaign_names_name_key" ON "ms_campaign_names"("name");
