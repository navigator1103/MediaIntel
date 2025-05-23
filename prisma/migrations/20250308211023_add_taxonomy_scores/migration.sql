-- CreateTable
CREATE TABLE "taxonomy_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "country_id" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "l1_score" INTEGER NOT NULL,
    "l2_score" INTEGER NOT NULL,
    "l3_score" INTEGER NOT NULL,
    "average_score" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "taxonomy_scores_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_scores_country_id_month_key" ON "taxonomy_scores"("country_id", "month");
