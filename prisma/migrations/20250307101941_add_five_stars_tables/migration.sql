-- CreateTable
CREATE TABLE "five_stars_criteria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "five_stars_ratings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "criterion_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "comments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "five_stars_ratings_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "five_stars_criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "five_stars_ratings_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "five_stars_ratings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "five_stars_ratings_criterion_id_country_id_brand_id_month_key" ON "five_stars_ratings"("criterion_id", "country_id", "brand_id", "month");
