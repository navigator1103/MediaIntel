-- CreateTable
CREATE TABLE "ms_sub_regions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ms_countries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sub_region_id" INTEGER NOT NULL,
    "cluster" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_countries_sub_region_id_fkey" FOREIGN KEY ("sub_region_id") REFERENCES "ms_sub_regions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ms_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ms_ranges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_ranges_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ms_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ms_media_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ms_media_subtypes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "media_type_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_media_subtypes_media_type_id_fkey" FOREIGN KEY ("media_type_id") REFERENCES "ms_media_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ms_campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "range_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "playback_id" TEXT,
    "burst" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ms_campaigns_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "ms_ranges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ms_campaigns_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "ms_countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ms_campaign_media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaign_id" INTEGER NOT NULL,
    "media_subtype_id" INTEGER NOT NULL,
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
    CONSTRAINT "ms_campaign_media_media_subtype_id_fkey" FOREIGN KEY ("media_subtype_id") REFERENCES "ms_media_subtypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ms_sub_regions_name_key" ON "ms_sub_regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_countries_name_key" ON "ms_countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_categories_name_key" ON "ms_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_ranges_name_category_id_key" ON "ms_ranges"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_media_types_name_key" ON "ms_media_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ms_media_subtypes_name_media_type_id_key" ON "ms_media_subtypes"("name", "media_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_campaigns_name_range_id_country_id_year_burst_key" ON "ms_campaigns"("name", "range_id", "country_id", "year", "burst");
