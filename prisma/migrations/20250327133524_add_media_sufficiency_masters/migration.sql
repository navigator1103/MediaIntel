-- CreateTable
CREATE TABLE "ms_pm_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ms_business_units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ms_clusters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ms_campaign_media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaign_id" INTEGER NOT NULL,
    "media_subtype_id" INTEGER NOT NULL,
    "pm_type_id" INTEGER,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "total_budget" REAL NOT NULL,
    "q1_budget" REAL,
    "q2_budget" REAL,
    "q3_budget" REAL,
    "q4_budget" REAL,
    "trps" REAL,
    "reach_1plus" REAL,
    "reach_3plus" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_campaign_media_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ms_campaigns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaign_media_media_subtype_id_fkey" FOREIGN KEY ("media_subtype_id") REFERENCES "ms_media_subtypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaign_media_pm_type_id_fkey" FOREIGN KEY ("pm_type_id") REFERENCES "ms_pm_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ms_campaign_media" ("campaign_id", "created_at", "end_date", "id", "media_subtype_id", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "reach_1plus", "reach_3plus", "start_date", "total_budget", "trps", "updated_at") SELECT "campaign_id", "created_at", "end_date", "id", "media_subtype_id", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "reach_1plus", "reach_3plus", "start_date", "total_budget", "trps", "updated_at" FROM "ms_campaign_media";
DROP TABLE "ms_campaign_media";
ALTER TABLE "new_ms_campaign_media" RENAME TO "ms_campaign_media";
CREATE TABLE "new_ms_campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "range_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "business_unit_id" INTEGER,
    "year" INTEGER NOT NULL,
    "playback_id" TEXT,
    "burst" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_campaigns_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "ms_ranges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "ms_countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "ms_business_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ms_campaigns" ("burst", "country_id", "created_at", "id", "name", "playback_id", "range_id", "updated_at", "year") SELECT "burst", "country_id", "created_at", "id", "name", "playback_id", "range_id", "updated_at", "year" FROM "ms_campaigns";
DROP TABLE "ms_campaigns";
ALTER TABLE "new_ms_campaigns" RENAME TO "ms_campaigns";
CREATE UNIQUE INDEX "ms_campaigns_name_range_id_country_id_year_burst_key" ON "ms_campaigns"("name", "range_id", "country_id", "year", "burst");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ms_pm_types_name_key" ON "ms_pm_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_business_units_name_key" ON "ms_business_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_clusters_name_key" ON "ms_clusters"("name");
