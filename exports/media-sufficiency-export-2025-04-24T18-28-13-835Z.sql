-- Media Sufficiency Data Export
-- Generated: 2025-04-24T18:28:13.837Z

-- PostgreSQL setup
BEGIN;

-- Create tables

CREATE TABLE IF NOT EXISTS "ms_sub_regions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS "ms_countries" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "sub_region_id" INTEGER NOT NULL,
  "cluster" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("sub_region_id") REFERENCES "ms_sub_regions"("id")
);


CREATE TABLE IF NOT EXISTS "ms_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS "ms_ranges" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("category_id") REFERENCES "ms_categories"("id"),
  UNIQUE("name", "category_id")
);


CREATE TABLE IF NOT EXISTS "ms_media_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS "ms_media_subtypes" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "media_type_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("media_type_id") REFERENCES "ms_media_types"("id"),
  UNIQUE("name", "media_type_id")
);


CREATE TABLE IF NOT EXISTS "ms_business_units" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS "ms_pm_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);


CREATE TABLE IF NOT EXISTS "ms_campaigns" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "country_id" INTEGER NOT NULL,
  "range_id" INTEGER NOT NULL,
  "business_unit_id" INTEGER,
  "playback_id" TEXT,
  "burst" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("country_id") REFERENCES "ms_countries"("id"),
  FOREIGN KEY ("range_id") REFERENCES "ms_ranges"("id"),
  FOREIGN KEY ("business_unit_id") REFERENCES "ms_business_units"("id")
);


CREATE TABLE IF NOT EXISTS "ms_campaign_media" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL,
  "media_subtype_id" INTEGER NOT NULL,
  "pm_type_id" INTEGER,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "total_budget" DOUBLE PRECISION NOT NULL,
  "q1_budget" DOUBLE PRECISION,
  "q2_budget" DOUBLE PRECISION,
  "q3_budget" DOUBLE PRECISION,
  "q4_budget" DOUBLE PRECISION,
  "trps" DOUBLE PRECISION,
  "reach_1_plus" DOUBLE PRECISION,
  "reach_3_plus" DOUBLE PRECISION,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("campaign_id") REFERENCES "ms_campaigns"("id"),
  FOREIGN KEY ("media_subtype_id") REFERENCES "ms_media_subtypes"("id"),
  FOREIGN KEY ("pm_type_id") REFERENCES "ms_pm_types"("id")
);

-- SubRegion data
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (17, 'ANZ', '2025-04-24T07:03:19.395Z', '2025-04-24T07:03:19.395Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (18, 'APAC', '2025-04-24T07:03:19.396Z', '2025-04-24T07:03:19.396Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (19, 'Europe', '2025-04-24T07:03:19.397Z', '2025-04-24T07:03:19.397Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (20, 'North America', '2025-04-24T07:03:19.398Z', '2025-04-24T07:03:19.398Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (21, 'LATAM', '2025-04-24T07:03:19.399Z', '2025-04-24T07:03:19.399Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (22, 'MENAT', '2025-04-24T07:03:19.400Z', '2025-04-24T07:03:19.400Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (23, 'AME', '2025-04-24T07:03:19.400Z', '2025-04-24T07:03:19.400Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (24, 'ASEAN', '2025-04-24T07:03:19.401Z', '2025-04-24T07:03:19.401Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (25, 'INDIA', '2025-04-24T07:03:19.402Z', '2025-04-24T07:03:19.402Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (26, 'BRAZIL', '2025-04-24T07:03:19.403Z', '2025-04-24T07:03:19.403Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (27, 'MEXICO', '2025-04-24T07:03:19.404Z', '2025-04-24T07:03:19.404Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (28, 'COLOMBIA', '2025-04-24T07:03:19.405Z', '2025-04-24T07:03:19.405Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (29, 'CHILE', '2025-04-24T07:03:19.405Z', '2025-04-24T07:03:19.405Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (30, 'PERU', '2025-04-24T07:03:19.406Z', '2025-04-24T07:03:19.406Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (31, 'TURKEY', '2025-04-24T07:03:19.407Z', '2025-04-24T07:03:19.407Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (32, 'RSA', '2025-04-24T07:03:19.408Z', '2025-04-24T07:03:19.408Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- MSCountry data
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (81, 'Australia', 17, 'India + ANZ', '2025-04-24T07:03:19.408Z', '2025-04-24T07:03:19.408Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (82, 'New Zealand', 17, 'India + ANZ', '2025-04-24T07:03:19.409Z', '2025-04-24T07:03:19.409Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (83, 'Singapore', 24, 'SEA', '2025-04-24T07:03:19.410Z', '2025-04-24T07:03:19.410Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (84, 'Malaysia', 24, 'SEA', '2025-04-24T07:03:19.411Z', '2025-04-24T07:03:19.411Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (85, 'Thailand', 24, 'SEA', '2025-04-24T07:03:19.411Z', '2025-04-24T07:03:19.411Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (86, 'Vietnam', 24, 'SEA', '2025-04-24T07:03:19.412Z', '2025-04-24T07:03:19.412Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (87, 'Indonesia', 24, 'SEA', '2025-04-24T07:03:19.413Z', '2025-04-24T07:03:19.413Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (88, 'Germany', 19, 'DACH', '2025-04-24T07:03:19.414Z', '2025-04-24T07:03:19.414Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (89, 'France', 19, 'Western Europe', '2025-04-24T07:03:19.415Z', '2025-04-24T07:03:19.415Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (90, 'USA', 20, 'NA', '2025-04-24T07:03:19.415Z', '2025-04-24T07:03:19.415Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (91, 'Brazil', 26, 'LATAM', '2025-04-24T07:03:19.416Z', '2025-04-24T07:03:19.416Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (92, 'Mexico', 27, 'LATAM', '2025-04-24T07:03:19.417Z', '2025-04-24T07:03:19.417Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (93, 'Colombia', 28, 'LATAM', '2025-04-24T07:03:19.418Z', '2025-04-24T07:03:19.418Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (94, 'Chile', 29, 'LATAM', '2025-04-24T07:03:19.419Z', '2025-04-24T07:03:19.419Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (95, 'Peru', 30, 'LATAM', '2025-04-24T07:03:19.419Z', '2025-04-24T07:03:19.419Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (96, 'Egypt', 22, 'MENAT', '2025-04-24T07:03:19.420Z', '2025-04-24T07:03:19.420Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (97, 'Morocco', 22, 'North Africa', '2025-04-24T07:03:19.421Z', '2025-04-24T07:03:19.421Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (98, 'Turkey', 31, 'MENAT', '2025-04-24T07:03:19.422Z', '2025-04-24T07:03:19.422Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (99, 'India', 25, 'India + ANZ', '2025-04-24T07:03:19.423Z', '2025-04-24T07:03:19.423Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (100, 'South Africa', 32, 'AME', '2025-04-24T07:03:19.423Z', '2025-04-24T07:03:19.423Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;

-- Category data
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (29, 'Deo', '2025-04-24T07:03:19.424Z', '2025-04-24T07:03:19.424Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (30, 'Face Care', '2025-04-24T07:03:19.425Z', '2025-04-24T07:03:19.425Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (31, 'Body Care', '2025-04-24T07:03:19.426Z', '2025-04-24T07:03:19.426Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (32, 'Hair Care', '2025-04-24T07:03:19.426Z', '2025-04-24T07:03:19.426Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (33, 'Sun Care', '2025-04-24T07:03:19.427Z', '2025-04-24T07:03:19.427Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (34, 'Lip Care', '2025-04-24T07:03:19.428Z', '2025-04-24T07:03:19.428Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (35, 'Shower', '2025-04-24T07:03:19.429Z', '2025-04-24T07:03:19.429Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (36, 'Men Care', '2025-04-24T07:03:19.429Z', '2025-04-24T07:03:19.429Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (37, 'Hand Care', '2025-04-24T07:03:19.430Z', '2025-04-24T07:03:19.430Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (38, 'Baby Care', '2025-04-24T07:03:19.431Z', '2025-04-24T07:03:19.431Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (39, 'Hand Body', '2025-04-24T07:03:19.644Z', '2025-04-24T07:03:19.644Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (40, 'Face Cleansing', '2025-04-24T07:03:19.656Z', '2025-04-24T07:03:19.656Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (41, 'Sun', '2025-04-24T07:03:19.660Z', '2025-04-24T07:03:19.660Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (42, 'Men', '2025-04-24T07:03:19.663Z', '2025-04-24T07:03:19.663Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (43, 'Lip', '2025-04-24T07:03:19.672Z', '2025-04-24T07:03:19.672Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (44, 'X-Cat', '2025-04-24T07:03:19.675Z', '2025-04-24T07:03:19.675Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- Range data
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (97, 'Black & White', 29, '2025-04-24T07:03:19.432Z', '2025-04-24T07:03:19.432Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (98, 'Deep', 29, '2025-04-24T07:03:19.433Z', '2025-04-24T07:03:19.433Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (99, 'Derma Control', 29, '2025-04-24T07:03:19.434Z', '2025-04-24T07:03:19.434Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (100, 'Pearl & Beauty', 29, '2025-04-24T07:03:19.435Z', '2025-04-24T07:03:19.435Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (101, 'Fresh', 29, '2025-04-24T07:03:19.435Z', '2025-04-24T07:03:19.435Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (102, 'Dry Comfort', 29, '2025-04-24T07:03:19.436Z', '2025-04-24T07:03:19.436Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (103, 'Cellular', 30, '2025-04-24T07:03:19.437Z', '2025-04-24T07:03:19.437Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (104, 'Q10', 30, '2025-04-24T07:03:19.438Z', '2025-04-24T07:03:19.438Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (105, 'Aqua Sensation', 30, '2025-04-24T07:03:19.439Z', '2025-04-24T07:03:19.439Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (106, 'Naturally Good', 30, '2025-04-24T07:03:19.439Z', '2025-04-24T07:03:19.439Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (107, 'Hydra IQ', 31, '2025-04-24T07:03:19.440Z', '2025-04-24T07:03:19.440Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (108, 'Cocoa Butter', 31, '2025-04-24T07:03:19.441Z', '2025-04-24T07:03:19.441Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (109, 'Soft', 31, '2025-04-24T07:03:19.442Z', '2025-04-24T07:03:19.442Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (110, 'Repair & Care', 32, '2025-04-24T07:03:19.442Z', '2025-04-24T07:03:19.442Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (111, 'Volume & Strength', 32, '2025-04-24T07:03:19.443Z', '2025-04-24T07:03:19.443Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (112, 'Color Protect', 32, '2025-04-24T07:03:19.444Z', '2025-04-24T07:03:19.444Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (113, 'UV Protection', 33, '2025-04-24T07:03:19.445Z', '2025-04-24T07:03:19.445Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (114, 'After Sun', 33, '2025-04-24T07:03:19.446Z', '2025-04-24T07:03:19.446Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (115, 'Kids Protection', 33, '2025-04-24T07:03:19.447Z', '2025-04-24T07:03:19.447Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (116, 'Original', 34, '2025-04-24T07:03:19.447Z', '2025-04-24T07:03:19.447Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (117, 'Fruity Shine', 34, '2025-04-24T07:03:19.448Z', '2025-04-24T07:03:19.448Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (118, 'Cream Care', 35, '2025-04-24T07:03:19.449Z', '2025-04-24T07:03:19.449Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (119, 'Fresh', 35, '2025-04-24T07:03:19.450Z', '2025-04-24T07:03:19.450Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (120, 'Sensitive', 36, '2025-04-24T07:03:19.451Z', '2025-04-24T07:03:19.451Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (121, 'Active Energy', 36, '2025-04-24T07:03:19.452Z', '2025-04-24T07:03:19.452Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (122, 'Intensive', 37, '2025-04-24T07:03:19.452Z', '2025-04-24T07:03:19.452Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (123, 'Soft Wash', 38, '2025-04-24T07:03:19.453Z', '2025-04-24T07:03:19.453Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (124, 'Sensitive', 38, '2025-04-24T07:03:19.454Z', '2025-04-24T07:03:19.454Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (125, 'Epigenetics', 30, '2025-04-24T07:03:19.640Z', '2025-04-24T07:03:19.640Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (126, 'Facial', 30, '2025-04-24T07:03:19.641Z', '2025-04-24T07:03:19.641Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (127, 'Luminous 630', 30, '2025-04-24T07:03:19.642Z', '2025-04-24T07:03:19.642Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (128, 'Rose Care', 30, '2025-04-24T07:03:19.643Z', '2025-04-24T07:03:19.643Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (129, 'Aloe', 39, '2025-04-24T07:03:19.645Z', '2025-04-24T07:03:19.645Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (130, 'Crème', 39, '2025-04-24T07:03:19.646Z', '2025-04-24T07:03:19.646Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (131, 'Deep', 39, '2025-04-24T07:03:19.647Z', '2025-04-24T07:03:19.647Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (132, 'Even Tone Care', 39, '2025-04-24T07:03:19.648Z', '2025-04-24T07:03:19.648Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (133, 'Luminous 630', 39, '2025-04-24T07:03:19.648Z', '2025-04-24T07:03:19.648Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (134, 'Milk', 39, '2025-04-24T07:03:19.649Z', '2025-04-24T07:03:19.649Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (135, 'Natural Glow', 39, '2025-04-24T07:03:19.650Z', '2025-04-24T07:03:19.650Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (136, 'Ozoino', 39, '2025-04-24T07:03:19.651Z', '2025-04-24T07:03:19.651Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (137, 'Q10', 39, '2025-04-24T07:03:19.652Z', '2025-04-24T07:03:19.652Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (138, 'Radiant Beauty', 39, '2025-04-24T07:03:19.652Z', '2025-04-24T07:03:19.652Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (139, 'Repair & Care', 39, '2025-04-24T07:03:19.653Z', '2025-04-24T07:03:19.653Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (140, 'Soft', 39, '2025-04-24T07:03:19.654Z', '2025-04-24T07:03:19.654Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (141, 'Vitamin Range', 39, '2025-04-24T07:03:19.655Z', '2025-04-24T07:03:19.655Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (142, 'Vitamin Serum', 39, '2025-04-24T07:03:19.655Z', '2025-04-24T07:03:19.655Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (143, 'Acne', 40, '2025-04-24T07:03:19.657Z', '2025-04-24T07:03:19.657Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (144, 'Daily Essentials', 40, '2025-04-24T07:03:19.658Z', '2025-04-24T07:03:19.658Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (145, 'Luminous 630', 40, '2025-04-24T07:03:19.659Z', '2025-04-24T07:03:19.659Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (146, 'Micellar', 40, '2025-04-24T07:03:19.659Z', '2025-04-24T07:03:19.659Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (147, 'Protect & Moisture', 41, '2025-04-24T07:03:19.661Z', '2025-04-24T07:03:19.661Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (148, 'Sun', 41, '2025-04-24T07:03:19.662Z', '2025-04-24T07:03:19.662Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (149, 'UV Face', 41, '2025-04-24T07:03:19.662Z', '2025-04-24T07:03:19.662Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (150, 'Acne', 42, '2025-04-24T07:03:19.664Z', '2025-04-24T07:03:19.664Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (151, 'Extra Bright', 42, '2025-04-24T07:03:19.665Z', '2025-04-24T07:03:19.665Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (152, 'Men', 42, '2025-04-24T07:03:19.666Z', '2025-04-24T07:03:19.666Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (153, 'Sensitive', 42, '2025-04-24T07:03:19.666Z', '2025-04-24T07:03:19.666Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (154, 'Cool Kick', 29, '2025-04-24T07:03:19.668Z', '2025-04-24T07:03:19.668Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (155, 'Deo Male', 29, '2025-04-24T07:03:19.669Z', '2025-04-24T07:03:19.669Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (156, 'Even Tone', 29, '2025-04-24T07:03:19.670Z', '2025-04-24T07:03:19.670Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (157, 'Hijab Fresh', 29, '2025-04-24T07:03:19.671Z', '2025-04-24T07:03:19.671Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (158, 'Skin Hero', 29, '2025-04-24T07:03:19.672Z', '2025-04-24T07:03:19.672Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (159, 'All', 43, '2025-04-24T07:03:19.673Z', '2025-04-24T07:03:19.673Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (160, 'Lip', 43, '2025-04-24T07:03:19.674Z', '2025-04-24T07:03:19.674Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (161, 'All', 44, '2025-04-24T07:03:19.676Z', '2025-04-24T07:03:19.676Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;

-- MediaType data
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (7, 'Digital', '2025-04-24T07:03:19.455Z', '2025-04-24T07:03:19.455Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (8, 'TV', '2025-04-24T07:03:19.456Z', '2025-04-24T07:03:19.456Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (9, 'OOH', '2025-04-24T07:03:19.456Z', '2025-04-24T07:03:19.456Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (10, 'Radio', '2025-04-24T07:03:19.457Z', '2025-04-24T07:03:19.457Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (11, 'Print', '2025-04-24T07:03:19.458Z', '2025-04-24T07:03:19.458Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (12, 'Traditional', '2025-04-24T07:03:19.459Z', '2025-04-24T07:03:19.459Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- MediaSubtype data
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (25, 'PM & FF', 7, '2025-04-24T07:03:19.459Z', '2025-04-24T07:03:19.459Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (26, 'Influencers', 7, '2025-04-24T07:03:19.460Z', '2025-04-24T07:03:19.460Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (27, 'Influencers Amplification', 7, '2025-04-24T07:03:19.461Z', '2025-04-24T07:03:19.461Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (28, 'Influencers Organic', 7, '2025-04-24T07:03:19.462Z', '2025-04-24T07:03:19.462Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (29, 'Social Media', 7, '2025-04-24T07:03:19.463Z', '2025-04-24T07:03:19.463Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (30, 'Search', 7, '2025-04-24T07:03:19.464Z', '2025-04-24T07:03:19.464Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (31, 'Other Digital', 7, '2025-04-24T07:03:19.464Z', '2025-04-24T07:03:19.464Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (32, 'Open TV', 8, '2025-04-24T07:03:19.465Z', '2025-04-24T07:03:19.465Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (33, 'Paid TV', 8, '2025-04-24T07:03:19.466Z', '2025-04-24T07:03:19.466Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (34, 'Cable TV', 8, '2025-04-24T07:03:19.467Z', '2025-04-24T07:03:19.467Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (35, 'OOH', 9, '2025-04-24T07:03:19.468Z', '2025-04-24T07:03:19.468Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (36, 'Billboards', 9, '2025-04-24T07:03:19.469Z', '2025-04-24T07:03:19.469Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (37, 'Transit', 9, '2025-04-24T07:03:19.470Z', '2025-04-24T07:03:19.470Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (38, 'AM/FM', 10, '2025-04-24T07:03:19.470Z', '2025-04-24T07:03:19.470Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (39, 'Podcasts', 10, '2025-04-24T07:03:19.471Z', '2025-04-24T07:03:19.471Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (40, 'Print', 11, '2025-04-24T07:03:19.472Z', '2025-04-24T07:03:19.472Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (41, 'Magazines', 11, '2025-04-24T07:03:19.473Z', '2025-04-24T07:03:19.473Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (42, 'Newspapers', 11, '2025-04-24T07:03:19.474Z', '2025-04-24T07:03:19.474Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (43, 'Mixed', 12, '2025-04-24T07:03:19.475Z', '2025-04-24T07:03:19.475Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;

-- BusinessUnit data
INSERT INTO "ms_business_units" ("id", "name", "created_at", "updated_at") 
VALUES (1, 'Nivea', '2025-04-22T22:51:43.830Z', '2025-04-22T22:51:43.830Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_business_units" ("id", "name", "created_at", "updated_at") 
VALUES (2, 'Derma', '2025-04-22T22:51:43.901Z', '2025-04-22T22:51:43.901Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_business_units" ("id", "name", "created_at", "updated_at") 
VALUES (3, 'DERMA', '2025-04-22T22:51:43.962Z', '2025-04-22T22:51:43.962Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- PMType data
INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (1, 'Full Funnel Advanced', '2025-04-22T22:51:43.830Z', '2025-04-22T22:51:43.830Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (2, 'Non PM', '2025-04-22T22:51:43.835Z', '2025-04-22T22:51:43.835Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (3, 'GR Only', '2025-04-22T22:51:43.857Z', '2025-04-22T22:51:43.857Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (4, 'Full Funnel Basic', '2025-04-22T22:51:43.878Z', '2025-04-22T22:51:43.878Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (5, 'PM Advanced', '2025-04-22T22:51:43.991Z', '2025-04-22T22:51:43.991Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- Campaign data
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4498, 'Black & White', 2025, 81, 97, NULL, 'GL005', 1, '2025-04-24T07:03:19.477Z', '2025-04-24T07:03:19.477Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4499, 'Deep', 2025, 81, 98, NULL, 'EM019', 1, '2025-04-24T07:03:19.480Z', '2025-04-24T07:03:19.480Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4500, 'Derma Control', 2025, 81, 99, NULL, 'EM015', 1, '2025-04-24T07:03:19.482Z', '2025-04-24T07:03:19.482Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4501, 'Pearl & Beauty', 2025, 81, 100, NULL, 'EM035', 1, '2025-04-24T07:03:19.484Z', '2025-04-24T07:03:19.484Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4502, 'Cellular Filler', 2025, 81, 103, NULL, 'GL079', 1, '2025-04-24T07:03:19.486Z', '2025-04-24T07:03:19.486Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4503, 'Black & White', 2025, 88, 97, NULL, 'GL005', 1, '2025-04-24T07:03:19.488Z', '2025-04-24T07:03:19.488Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4504, 'Q10 Anti-Aging', 2025, 88, 104, NULL, 'FC001', 1, '2025-04-24T07:03:19.491Z', '2025-04-24T07:03:19.491Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4505, 'Cellular', 2025, 88, 103, NULL, 'GL167', 3, '2025-04-24T07:03:19.493Z', '2025-04-24T07:03:19.493Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4506, 'Naturally Good Premium', 2026, 81, 106, NULL, 'FC668', 3, '2025-04-24T07:03:19.497Z', '2025-04-24T07:03:19.497Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4507, 'Sensitive New', 2025, 100, 120, NULL, 'GL133', 2, '2025-04-24T07:03:19.501Z', '2025-04-24T07:03:19.501Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4508, 'Color Protect', 2024, 91, 112, NULL, 'GL664', 2, '2025-04-24T07:03:19.503Z', '2025-04-24T07:03:19.503Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4509, 'Pearl & Beauty', 2025, 95, 100, NULL, 'FC158', 2, '2025-04-24T07:03:19.506Z', '2025-04-24T07:03:19.506Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4510, 'Cellular', 2024, 81, 103, NULL, 'EM685', 2, '2025-04-24T07:03:19.509Z', '2025-04-24T07:03:19.509Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4511, 'Derma Control', 2024, 89, 99, NULL, 'HC553', 3, '2025-04-24T07:03:19.511Z', '2025-04-24T07:03:19.511Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4512, 'Naturally Good', 2026, 90, 106, NULL, 'GL613', 3, '2025-04-24T07:03:19.513Z', '2025-04-24T07:03:19.513Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4513, 'UV Protection Relaunch', 2025, 99, 113, NULL, 'BC622', 1, '2025-04-24T07:03:19.515Z', '2025-04-24T07:03:19.515Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4514, 'Cocoa Butter Special', 2026, 83, 108, NULL, 'SC399', 2, '2025-04-24T07:03:19.518Z', '2025-04-24T07:03:19.518Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4515, 'Cocoa Butter', 2024, 93, 108, NULL, 'FC637', 3, '2025-04-24T07:03:19.520Z', '2025-04-24T07:03:19.520Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4516, 'Pearl & Beauty Special', 2025, 94, 100, NULL, 'BC866', 1, '2025-04-24T07:03:19.523Z', '2025-04-24T07:03:19.523Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4517, 'Cream Care', 2025, 85, 118, NULL, 'FC485', 1, '2025-04-24T07:03:19.525Z', '2025-04-24T07:03:19.525Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4518, 'Q10 Premium', 2024, 89, 104, NULL, 'SC701', 1, '2025-04-24T07:03:19.529Z', '2025-04-24T07:03:19.529Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4519, 'Cocoa Butter', 2025, 85, 108, NULL, 'GL537', 3, '2025-04-24T07:03:19.534Z', '2025-04-24T07:03:19.534Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4520, 'Deep New', 2024, 83, 98, NULL, 'SC923', 2, '2025-04-24T07:03:19.536Z', '2025-04-24T07:03:19.536Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4521, 'Soft Wash', 2026, 82, 123, NULL, 'FC232', 2, '2025-04-24T07:03:19.543Z', '2025-04-24T07:03:19.543Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4522, 'Volume & Strength', 2025, 93, 111, NULL, 'GL872', 1, '2025-04-24T07:03:19.547Z', '2025-04-24T07:03:19.547Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4523, 'Sensitive', 2024, 88, 120, NULL, 'EM663', 1, '2025-04-24T07:03:19.548Z', '2025-04-24T07:03:19.548Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4524, 'Cocoa Butter New', 2024, 82, 108, NULL, 'BC598', 3, '2025-04-24T07:03:19.552Z', '2025-04-24T07:03:19.552Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4525, 'Q10', 2025, 91, 104, NULL, 'HC839', 3, '2025-04-24T07:03:19.556Z', '2025-04-24T07:03:19.556Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4526, 'Sensitive', 2024, 86, 124, NULL, 'HC905', 1, '2025-04-24T07:03:19.559Z', '2025-04-24T07:03:19.559Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4527, 'Active Energy', 2025, 85, 121, NULL, 'SC484', 2, '2025-04-24T07:03:19.561Z', '2025-04-24T07:03:19.561Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4528, 'Naturally Good Relaunch', 2024, 84, 106, NULL, 'BC809', 2, '2025-04-24T07:03:19.564Z', '2025-04-24T07:03:19.564Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4529, 'Hydra IQ', 2025, 100, 107, NULL, 'GL446', 1, '2025-04-24T07:03:19.566Z', '2025-04-24T07:03:19.566Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4530, 'Soft Wash Relaunch', 2026, 98, 123, NULL, 'GL059', 1, '2025-04-24T07:03:19.570Z', '2025-04-24T07:03:19.570Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4531, 'Sensitive', 2026, 94, 120, NULL, 'BC426', 2, '2025-04-24T07:03:19.574Z', '2025-04-24T07:03:19.574Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4532, 'After Sun Refresh', 2024, 92, 114, NULL, 'BC400', 3, '2025-04-24T07:03:19.576Z', '2025-04-24T07:03:19.576Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4533, 'Repair & Care', 2026, 88, 110, NULL, 'FC271', 1, '2025-04-24T07:03:19.579Z', '2025-04-24T07:03:19.579Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4534, 'Active Energy', 2024, 92, 121, NULL, 'BC916', 1, '2025-04-24T07:03:19.581Z', '2025-04-24T07:03:19.581Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4535, 'Original', 2024, 95, 116, NULL, 'SC679', 1, '2025-04-24T07:03:19.585Z', '2025-04-24T07:03:19.585Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4536, 'Volume & Strength New', 2026, 88, 111, NULL, 'FC225', 3, '2025-04-24T07:03:19.587Z', '2025-04-24T07:03:19.587Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4537, 'Cocoa Butter', 2024, 88, 108, NULL, 'FC719', 1, '2025-04-24T07:03:19.590Z', '2025-04-24T07:03:19.590Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4538, 'Fresh', 2025, 94, 101, NULL, 'BC161', 3, '2025-04-24T07:03:19.594Z', '2025-04-24T07:03:19.594Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4539, 'Kids Protection', 2025, 94, 115, NULL, 'EM336', 3, '2025-04-24T07:03:19.597Z', '2025-04-24T07:03:19.597Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4540, 'Soft New', 2026, 96, 109, NULL, 'FC393', 1, '2025-04-24T07:03:19.599Z', '2025-04-24T07:03:19.599Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4541, 'Soft Wash', 2024, 97, 123, NULL, 'HC598', 3, '2025-04-24T07:03:19.602Z', '2025-04-24T07:03:19.602Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4542, 'Q10', 2025, 100, 104, NULL, 'SC564', 3, '2025-04-24T07:03:19.606Z', '2025-04-24T07:03:19.606Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4543, 'Color Protect', 2026, 83, 112, NULL, 'FC353', 3, '2025-04-24T07:03:19.607Z', '2025-04-24T07:03:19.607Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4544, 'Deep', 2024, 87, 98, NULL, 'EM325', 3, '2025-04-24T07:03:19.610Z', '2025-04-24T07:03:19.610Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4545, 'Sensitive', 2024, 89, 120, NULL, 'FC792', 1, '2025-04-24T07:03:19.613Z', '2025-04-24T07:03:19.613Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4546, 'Soft Wash New', 2024, 95, 123, NULL, 'FC915', 2, '2025-04-24T07:03:19.616Z', '2025-04-24T07:03:19.616Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4547, 'Q10 Relaunch', 2024, 81, 104, NULL, 'BC741', 3, '2025-04-24T07:03:19.619Z', '2025-04-24T07:03:19.619Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4548, 'Kids Protection', 2026, 91, 115, NULL, 'GL670', 1, '2025-04-24T07:03:19.621Z', '2025-04-24T07:03:19.621Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4549, 'Kids Protection', 2026, 97, 115, NULL, 'BC526', 3, '2025-04-24T07:03:19.623Z', '2025-04-24T07:03:19.623Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4550, 'Cellular Special', 2026, 99, 103, NULL, 'GL711', 1, '2025-04-24T07:03:19.625Z', '2025-04-24T07:03:19.625Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4551, 'Derma Control', 2024, 98, 99, NULL, 'FC449', 2, '2025-04-24T07:03:19.627Z', '2025-04-24T07:03:19.627Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4552, 'Cream Care', 2024, 84, 118, NULL, 'HC142', 1, '2025-04-24T07:03:19.629Z', '2025-04-24T07:03:19.629Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4553, 'Fresh Special', 2026, 100, 101, NULL, 'HC039', 2, '2025-04-24T07:03:19.632Z', '2025-04-24T07:03:19.632Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (4554, 'Black & White', 2025, 88, 97, NULL, 'BC761', 2, '2025-04-24T07:03:19.633Z', '2025-04-24T07:03:19.633Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;

-- CampaignMedia data
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4547, 4498, 25, NULL, '2025-02-01T00:00:00.000Z', '2025-04-30T00:00:00.000Z', 429, 286, 143, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.478Z', '2025-04-24T07:03:19.478Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4548, 4498, 26, NULL, '2025-02-01T00:00:00.000Z', '2025-04-30T00:00:00.000Z', 67, 45, 22, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.479Z', '2025-04-24T07:03:19.479Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4549, 4499, 25, NULL, '2025-03-01T00:00:00.000Z', '2025-04-30T00:00:00.000Z', 110, 55, 55, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.481Z', '2025-04-24T07:03:19.481Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4550, 4500, 32, NULL, '2025-09-01T00:00:00.000Z', '2025-10-30T00:00:00.000Z', 336, NULL, NULL, 168, 168, NULL, NULL, NULL, '2025-04-24T07:03:19.483Z', '2025-04-24T07:03:19.483Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4551, 4500, 25, NULL, '2025-08-01T00:00:00.000Z', '2025-11-30T00:00:00.000Z', 460, NULL, NULL, 230, 230, NULL, NULL, NULL, '2025-04-24T07:03:19.484Z', '2025-04-24T07:03:19.484Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4552, 4501, 25, NULL, '2025-05-01T00:00:00.000Z', '2025-07-30T00:00:00.000Z', 245, NULL, 163, 82, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.485Z', '2025-04-24T07:03:19.485Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4553, 4502, 32, NULL, '2025-04-01T00:00:00.000Z', '2025-05-30T00:00:00.000Z', 323, NULL, 323, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.487Z', '2025-04-24T07:03:19.487Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4554, 4503, 25, NULL, '2025-02-01T00:00:00.000Z', '2025-04-30T00:00:00.000Z', 650, 400, 250, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.489Z', '2025-04-24T07:03:19.489Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4555, 4503, 32, NULL, '2025-03-01T00:00:00.000Z', '2025-05-30T00:00:00.000Z', 800, 300, 500, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.490Z', '2025-04-24T07:03:19.490Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4556, 4504, 29, NULL, '2025-06-01T00:00:00.000Z', '2025-08-30T00:00:00.000Z', 420, NULL, 200, 220, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.492Z', '2025-04-24T07:03:19.492Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4557, 4504, 41, NULL, '2025-07-01T00:00:00.000Z', '2025-09-30T00:00:00.000Z', 180, NULL, 60, 120, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.493Z', '2025-04-24T07:03:19.493Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4558, 4505, 35, NULL, '2025-06-22T00:00:00.000Z', '2025-07-22T00:00:00.000Z', 413.28, NULL, 206.64, 206.64, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.495Z', '2025-04-24T07:03:19.495Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4559, 4505, 43, NULL, '2025-10-19T00:00:00.000Z', '2025-12-19T00:00:00.000Z', 759.59, NULL, NULL, NULL, 759.59, NULL, NULL, NULL, '2025-04-24T07:03:19.495Z', '2025-04-24T07:03:19.495Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4560, 4505, 43, NULL, '2025-05-15T00:00:00.000Z', '2025-08-15T00:00:00.000Z', 880.86, NULL, 440.43, 440.43, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.496Z', '2025-04-24T07:03:19.496Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4561, 4506, 43, NULL, '2026-11-30T00:00:00.000Z', '2026-12-31T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.498Z', '2025-04-24T07:03:19.498Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4562, 4506, 41, NULL, '2026-10-13T00:00:00.000Z', '2027-04-13T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.499Z', '2025-04-24T07:03:19.499Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4563, 4506, 40, NULL, '2026-06-24T00:00:00.000Z', '2026-12-24T00:00:00.000Z', 911.73, NULL, 130.25, 390.74, 390.74, NULL, NULL, NULL, '2025-04-24T07:03:19.500Z', '2025-04-24T07:03:19.500Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4564, 4507, 32, NULL, '2025-04-12T00:00:00.000Z', '2025-06-12T00:00:00.000Z', 672.48, NULL, 672.48, NULL, NULL, 307.31, 81.09, 22.45, '2025-04-24T07:03:19.502Z', '2025-04-24T07:03:19.502Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4565, 4508, 26, NULL, '2024-04-13T00:00:00.000Z', '2024-10-13T00:00:00.000Z', 910.98, NULL, 390.42, 390.42, 130.14, NULL, NULL, NULL, '2025-04-24T07:03:19.504Z', '2025-04-24T07:03:19.504Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4566, 4508, 39, NULL, '2024-08-15T00:00:00.000Z', '2024-09-15T00:00:00.000Z', 586.06, NULL, NULL, 586.06, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.504Z', '2025-04-24T07:03:19.504Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4567, 4508, 40, NULL, '2024-01-18T00:00:00.000Z', '2024-04-18T00:00:00.000Z', 732.88, 549.66, 183.22, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.505Z', '2025-04-24T07:03:19.505Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4568, 4509, 38, NULL, '2025-10-26T00:00:00.000Z', '2025-11-26T00:00:00.000Z', 270.38, NULL, NULL, NULL, 270.38, NULL, NULL, NULL, '2025-04-24T07:03:19.507Z', '2025-04-24T07:03:19.507Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4569, 4509, 42, NULL, '2025-09-23T00:00:00.000Z', '2025-12-23T00:00:00.000Z', 59.4, NULL, NULL, 14.85, 44.55, NULL, NULL, NULL, '2025-04-24T07:03:19.508Z', '2025-04-24T07:03:19.508Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4570, 4510, 34, NULL, '2024-11-21T00:00:00.000Z', '2025-02-21T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 242.56, 70.9, 13.31, '2025-04-24T07:03:19.510Z', '2025-04-24T07:03:19.510Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4571, 4510, 36, NULL, '2024-08-19T00:00:00.000Z', '2024-10-19T00:00:00.000Z', 163.49, NULL, NULL, 108.99, 54.5, NULL, NULL, NULL, '2025-04-24T07:03:19.510Z', '2025-04-24T07:03:19.510Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4572, 4511, 34, NULL, '2024-02-11T00:00:00.000Z', '2024-05-11T00:00:00.000Z', 543.54, 271.77, 271.77, NULL, NULL, 250.24, 81.91, 17.42, '2025-04-24T07:03:19.512Z', '2025-04-24T07:03:19.512Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4573, 4512, 41, NULL, '2026-08-19T00:00:00.000Z', '2026-10-19T00:00:00.000Z', 278.02, NULL, NULL, 185.35, 92.67, NULL, NULL, NULL, '2025-04-24T07:03:19.514Z', '2025-04-24T07:03:19.514Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4574, 4513, 42, NULL, '2025-12-14T00:00:00.000Z', '2026-01-14T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.516Z', '2025-04-24T07:03:19.516Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4575, 4513, 29, NULL, '2025-07-19T00:00:00.000Z', '2025-12-19T00:00:00.000Z', 748.64, NULL, NULL, 374.32, 374.32, NULL, NULL, NULL, '2025-04-24T07:03:19.517Z', '2025-04-24T07:03:19.517Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4576, 4513, 31, NULL, '2025-07-15T00:00:00.000Z', '2025-11-15T00:00:00.000Z', 377.4, NULL, NULL, 226.44, 150.96, NULL, NULL, NULL, '2025-04-24T07:03:19.518Z', '2025-04-24T07:03:19.518Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4577, 4514, 32, NULL, '2026-02-21T00:00:00.000Z', '2026-04-21T00:00:00.000Z', 311.59, 207.73, 103.86, NULL, NULL, 122.09, 79.73, 41.67, '2025-04-24T07:03:19.519Z', '2025-04-24T07:03:19.519Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4578, 4515, 33, NULL, '2024-10-01T00:00:00.000Z', '2025-02-01T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 122.63, 51.22, 29.28, '2025-04-24T07:03:19.521Z', '2025-04-24T07:03:19.521Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4579, 4515, 37, NULL, '2024-09-10T00:00:00.000Z', '2025-01-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.522Z', '2025-04-24T07:03:19.522Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4580, 4516, 29, NULL, '2025-01-24T00:00:00.000Z', '2025-05-24T00:00:00.000Z', 701.01, 420.61, 280.4, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.524Z', '2025-04-24T07:03:19.524Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4581, 4516, 30, NULL, '2025-05-07T00:00:00.000Z', '2025-11-07T00:00:00.000Z', 433.89, NULL, 123.97, 185.95, 123.97, NULL, NULL, NULL, '2025-04-24T07:03:19.525Z', '2025-04-24T07:03:19.525Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4582, 4517, 27, NULL, '2025-04-11T00:00:00.000Z', '2025-07-11T00:00:00.000Z', 424.56, NULL, 318.42, 106.14, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.527Z', '2025-04-24T07:03:19.527Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4583, 4518, 26, NULL, '2024-12-04T00:00:00.000Z', '2025-01-04T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.531Z', '2025-04-24T07:03:19.531Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4584, 4518, 40, NULL, '2024-02-26T00:00:00.000Z', '2024-06-26T00:00:00.000Z', 934.4, 373.76, 560.64, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.532Z', '2025-04-24T07:03:19.532Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4585, 4518, 33, NULL, '2024-03-19T00:00:00.000Z', '2024-08-19T00:00:00.000Z', 734.16, 122.36, 367.08, 244.72, NULL, 155.02, 46.8, 14.29, '2025-04-24T07:03:19.533Z', '2025-04-24T07:03:19.533Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4586, 4519, 42, NULL, '2025-04-18T00:00:00.000Z', '2025-09-18T00:00:00.000Z', 172.54, NULL, 86.27, 86.27, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.535Z', '2025-04-24T07:03:19.535Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4587, 4520, 31, NULL, '2024-06-06T00:00:00.000Z', '2024-07-06T00:00:00.000Z', 880.14, NULL, 440.07, 440.07, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.537Z', '2025-04-24T07:03:19.537Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4588, 4520, 30, NULL, '2024-04-22T00:00:00.000Z', '2024-09-22T00:00:00.000Z', 501.44, NULL, 250.72, 250.72, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.538Z', '2025-04-24T07:03:19.538Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4589, 4521, 35, NULL, '2026-12-17T00:00:00.000Z', '2027-03-17T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.544Z', '2025-04-24T07:03:19.544Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4590, 4521, 28, NULL, '2026-07-21T00:00:00.000Z', '2027-01-21T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.545Z', '2025-04-24T07:03:19.545Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4591, 4521, 43, NULL, '2026-08-23T00:00:00.000Z', '2026-09-23T00:00:00.000Z', 703.34, NULL, NULL, 703.34, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.546Z', '2025-04-24T07:03:19.546Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4592, 4522, 40, NULL, '2025-11-10T00:00:00.000Z', '2026-03-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.548Z', '2025-04-24T07:03:19.548Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4593, 4523, 39, NULL, '2024-05-22T00:00:00.000Z', '2024-07-22T00:00:00.000Z', 586.95, NULL, 391.3, 195.65, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.549Z', '2025-04-24T07:03:19.549Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4594, 4523, 28, NULL, '2024-09-05T00:00:00.000Z', '2024-11-05T00:00:00.000Z', 519.47, NULL, NULL, 173.16, 346.31, NULL, NULL, NULL, '2025-04-24T07:03:19.550Z', '2025-04-24T07:03:19.550Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4595, 4523, 26, NULL, '2024-05-16T00:00:00.000Z', '2024-09-16T00:00:00.000Z', 856.6, NULL, 342.64, 513.96, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.551Z', '2025-04-24T07:03:19.551Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4596, 4524, 28, NULL, '2024-08-20T00:00:00.000Z', '2025-01-20T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.553Z', '2025-04-24T07:03:19.553Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4597, 4524, 37, NULL, '2024-06-21T00:00:00.000Z', '2024-12-21T00:00:00.000Z', 770.12, NULL, 110.02, 330.05, 330.05, NULL, NULL, NULL, '2025-04-24T07:03:19.554Z', '2025-04-24T07:03:19.554Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4598, 4524, 38, NULL, '2024-06-25T00:00:00.000Z', '2024-08-25T00:00:00.000Z', 283.06, NULL, 94.35, 188.71, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.555Z', '2025-04-24T07:03:19.555Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4599, 4525, 31, NULL, '2025-04-06T00:00:00.000Z', '2025-09-06T00:00:00.000Z', 552.44, NULL, 276.22, 276.22, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.557Z', '2025-04-24T07:03:19.557Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4600, 4526, 43, NULL, '2024-07-20T00:00:00.000Z', '2024-10-20T00:00:00.000Z', 187.94, NULL, NULL, 140.95, 46.99, NULL, NULL, NULL, '2025-04-24T07:03:19.560Z', '2025-04-24T07:03:19.560Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4601, 4526, 29, NULL, '2024-01-22T00:00:00.000Z', '2024-05-22T00:00:00.000Z', 301.94, 181.16, 120.78, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.560Z', '2025-04-24T07:03:19.560Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4602, 4527, 40, NULL, '2025-04-20T00:00:00.000Z', '2025-08-20T00:00:00.000Z', 911.1700000000001, NULL, 546.7, 364.47, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.562Z', '2025-04-24T07:03:19.562Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4603, 4527, 37, NULL, '2025-08-24T00:00:00.000Z', '2025-09-24T00:00:00.000Z', 958.83, NULL, NULL, 958.83, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.563Z', '2025-04-24T07:03:19.563Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4604, 4527, 33, NULL, '2025-01-26T00:00:00.000Z', '2025-03-26T00:00:00.000Z', 612.77, 612.77, NULL, NULL, NULL, 232.74, 59.89, 18.84, '2025-04-24T07:03:19.563Z', '2025-04-24T07:03:19.563Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4605, 4528, 37, NULL, '2024-09-06T00:00:00.000Z', '2025-03-06T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.565Z', '2025-04-24T07:03:19.565Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4606, 4529, 38, NULL, '2025-09-14T00:00:00.000Z', '2026-02-14T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.568Z', '2025-04-24T07:03:19.568Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4607, 4529, 41, NULL, '2025-01-03T00:00:00.000Z', '2025-03-03T00:00:00.000Z', 584.77, 584.77, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.569Z', '2025-04-24T07:03:19.569Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4608, 4530, 37, NULL, '2026-03-26T00:00:00.000Z', '2026-04-26T00:00:00.000Z', 472.56, 236.28, 236.28, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.571Z', '2025-04-24T07:03:19.571Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4609, 4530, 37, NULL, '2026-07-17T00:00:00.000Z', '2026-12-17T00:00:00.000Z', 977.3, NULL, NULL, 488.65, 488.65, NULL, NULL, NULL, '2025-04-24T07:03:19.573Z', '2025-04-24T07:03:19.573Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4610, 4531, 40, NULL, '2026-07-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z', 730.71, NULL, NULL, 548.03, 182.68, NULL, NULL, NULL, '2025-04-24T07:03:19.575Z', '2025-04-24T07:03:19.575Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4611, 4531, 35, NULL, '2026-08-19T00:00:00.000Z', '2026-10-19T00:00:00.000Z', 170.64, NULL, NULL, 113.76, 56.88, NULL, NULL, NULL, '2025-04-24T07:03:19.575Z', '2025-04-24T07:03:19.575Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4612, 4532, 25, NULL, '2024-12-02T00:00:00.000Z', '2025-01-02T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.577Z', '2025-04-24T07:03:19.577Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4613, 4532, 25, NULL, '2024-12-08T00:00:00.000Z', '2025-01-08T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.578Z', '2025-04-24T07:03:19.578Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4614, 4533, 31, NULL, '2026-10-05T00:00:00.000Z', '2027-01-05T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.580Z', '2025-04-24T07:03:19.580Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4615, 4534, 39, NULL, '2024-04-16T00:00:00.000Z', '2024-09-16T00:00:00.000Z', 895.98, NULL, 447.99, 447.99, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.582Z', '2025-04-24T07:03:19.582Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4616, 4534, 30, NULL, '2024-07-16T00:00:00.000Z', '2025-01-16T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.583Z', '2025-04-24T07:03:19.583Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4617, 4534, 34, NULL, '2024-12-14T00:00:00.000Z', '2025-01-14T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 185.28, 60.98, 10.53, '2025-04-24T07:03:19.584Z', '2025-04-24T07:03:19.584Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4618, 4535, 36, NULL, '2024-08-11T00:00:00.000Z', '2024-11-11T00:00:00.000Z', 882.04, NULL, NULL, 441.02, 441.02, NULL, NULL, NULL, '2025-04-24T07:03:19.586Z', '2025-04-24T07:03:19.586Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4619, 4536, 30, NULL, '2026-06-18T00:00:00.000Z', '2026-07-18T00:00:00.000Z', 209.9, NULL, 104.95, 104.95, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.588Z', '2025-04-24T07:03:19.588Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4620, 4536, 40, NULL, '2026-04-20T00:00:00.000Z', '2026-08-20T00:00:00.000Z', 847.48, NULL, 508.49, 338.99, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.589Z', '2025-04-24T07:03:19.589Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4621, 4536, 34, NULL, '2026-02-06T00:00:00.000Z', '2026-07-06T00:00:00.000Z', 675.2, 225.07, 337.6, 112.53, NULL, 343.98, 85.65, 47.38, '2025-04-24T07:03:19.590Z', '2025-04-24T07:03:19.590Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4622, 4537, 38, NULL, '2024-04-26T00:00:00.000Z', '2024-10-26T00:00:00.000Z', 282.92, NULL, 121.25, 121.25, 40.42, NULL, NULL, NULL, '2025-04-24T07:03:19.591Z', '2025-04-24T07:03:19.591Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4623, 4537, 39, NULL, '2024-10-20T00:00:00.000Z', '2025-03-20T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.592Z', '2025-04-24T07:03:19.592Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4624, 4537, 33, NULL, '2024-10-20T00:00:00.000Z', '2025-04-20T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 410.69, 51.04, 48.85, '2025-04-24T07:03:19.593Z', '2025-04-24T07:03:19.593Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4625, 4538, 43, NULL, '2025-07-13T00:00:00.000Z', '2025-12-13T00:00:00.000Z', 200.1, NULL, NULL, 100.05, 100.05, NULL, NULL, NULL, '2025-04-24T07:03:19.595Z', '2025-04-24T07:03:19.595Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4626, 4538, 34, NULL, '2025-12-12T00:00:00.000Z', '2026-05-12T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 472.28, 77.38, 45.41, '2025-04-24T07:03:19.595Z', '2025-04-24T07:03:19.595Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4627, 4538, 28, NULL, '2025-01-19T00:00:00.000Z', '2025-02-19T00:00:00.000Z', 834.74, 834.74, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.596Z', '2025-04-24T07:03:19.596Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4628, 4539, 27, NULL, '2025-11-27T00:00:00.000Z', '2026-03-27T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.598Z', '2025-04-24T07:03:19.598Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4629, 4539, 43, NULL, '2025-02-24T00:00:00.000Z', '2025-05-24T00:00:00.000Z', 918.62, 459.31, 459.31, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.599Z', '2025-04-24T07:03:19.599Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4630, 4540, 35, NULL, '2026-12-26T00:00:00.000Z', '2027-03-26T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.600Z', '2025-04-24T07:03:19.600Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4631, 4540, 32, NULL, '2026-02-18T00:00:00.000Z', '2026-07-18T00:00:00.000Z', 923.6400000000001, 307.88, 461.82, 153.94, NULL, 212.01, 44.82, 11.46, '2025-04-24T07:03:19.601Z', '2025-04-24T07:03:19.601Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4632, 4540, 27, NULL, '2026-05-04T00:00:00.000Z', '2026-06-04T00:00:00.000Z', 71.39, NULL, 71.39, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.602Z', '2025-04-24T07:03:19.602Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4633, 4541, 34, NULL, '2024-12-03T00:00:00.000Z', '2025-06-03T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 69.41, 78.77, 32.43, '2025-04-24T07:03:19.603Z', '2025-04-24T07:03:19.603Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4634, 4541, 28, NULL, '2024-03-24T00:00:00.000Z', '2024-07-24T00:00:00.000Z', 656.8100000000001, 131.36, 394.09, 131.36, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.604Z', '2025-04-24T07:03:19.604Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4635, 4541, 40, NULL, '2024-07-20T00:00:00.000Z', '2024-09-20T00:00:00.000Z', 718.49, NULL, NULL, 718.49, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.605Z', '2025-04-24T07:03:19.605Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4636, 4542, 27, NULL, '2025-08-31T00:00:00.000Z', '2026-01-31T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.607Z', '2025-04-24T07:03:19.607Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4637, 4543, 32, NULL, '2026-08-17T00:00:00.000Z', '2026-11-17T00:00:00.000Z', 607.26, NULL, NULL, 303.63, 303.63, 76.42, 59.62, 43.54, '2025-04-24T07:03:19.608Z', '2025-04-24T07:03:19.608Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4638, 4543, 34, NULL, '2026-11-26T00:00:00.000Z', '2027-05-26T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 478.41, 71.77, 24.83, '2025-04-24T07:03:19.609Z', '2025-04-24T07:03:19.609Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4639, 4543, 41, NULL, '2026-09-18T00:00:00.000Z', '2027-03-18T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.610Z', '2025-04-24T07:03:19.610Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4640, 4544, 25, NULL, '2024-02-02T00:00:00.000Z', '2024-03-02T00:00:00.000Z', 352.08, 352.08, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.611Z', '2025-04-24T07:03:19.611Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4641, 4544, 35, NULL, '2024-07-25T00:00:00.000Z', '2024-12-25T00:00:00.000Z', 486.84, NULL, NULL, 243.42, 243.42, NULL, NULL, NULL, '2025-04-24T07:03:19.612Z', '2025-04-24T07:03:19.612Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4642, 4544, 34, NULL, '2024-09-10T00:00:00.000Z', '2025-01-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 263.97, 62.81, 30.92, '2025-04-24T07:03:19.613Z', '2025-04-24T07:03:19.613Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4643, 4545, 43, NULL, '2024-03-22T00:00:00.000Z', '2024-07-22T00:00:00.000Z', 579.69, 115.94, 347.81, 115.94, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.614Z', '2025-04-24T07:03:19.614Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4644, 4545, 33, NULL, '2024-05-08T00:00:00.000Z', '2024-06-08T00:00:00.000Z', 668.16, NULL, 668.16, NULL, NULL, 386.49, 87.08, 32.61, '2025-04-24T07:03:19.615Z', '2025-04-24T07:03:19.615Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4645, 4546, 29, NULL, '2024-12-10T00:00:00.000Z', '2025-02-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.617Z', '2025-04-24T07:03:19.617Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4646, 4546, 29, NULL, '2024-10-22T00:00:00.000Z', '2024-12-22T00:00:00.000Z', 942.92, NULL, NULL, NULL, 942.92, NULL, NULL, NULL, '2025-04-24T07:03:19.618Z', '2025-04-24T07:03:19.618Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4647, 4546, 30, NULL, '2024-11-10T00:00:00.000Z', '2025-04-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.618Z', '2025-04-24T07:03:19.618Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4648, 4547, 30, NULL, '2024-12-10T00:00:00.000Z', '2025-03-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.620Z', '2025-04-24T07:03:19.620Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4649, 4548, 33, NULL, '2026-01-02T00:00:00.000Z', '2026-07-02T00:00:00.000Z', 152.32, 65.28, 65.28, 21.76, NULL, 119.45, 45.82, 22.05, '2025-04-24T07:03:19.622Z', '2025-04-24T07:03:19.622Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4650, 4548, 35, NULL, '2026-08-14T00:00:00.000Z', '2026-12-14T00:00:00.000Z', 590.19, NULL, NULL, 236.08, 354.11, NULL, NULL, NULL, '2025-04-24T07:03:19.622Z', '2025-04-24T07:03:19.622Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4651, 4549, 34, NULL, '2026-11-10T00:00:00.000Z', '2027-03-10T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, 346.66, 67.31, 37.83, '2025-04-24T07:03:19.624Z', '2025-04-24T07:03:19.624Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4652, 4550, 42, NULL, '2026-09-06T00:00:00.000Z', '2027-02-06T00:00:00.000Z', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.626Z', '2025-04-24T07:03:19.626Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4653, 4550, 39, NULL, '2026-07-20T00:00:00.000Z', '2026-10-20T00:00:00.000Z', 211.12, NULL, NULL, 158.34, 52.78, NULL, NULL, NULL, '2025-04-24T07:03:19.626Z', '2025-04-24T07:03:19.626Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4654, 4551, 28, NULL, '2024-05-14T00:00:00.000Z', '2024-10-14T00:00:00.000Z', 220.12, NULL, 73.37, 110.06, 36.69, NULL, NULL, NULL, '2025-04-24T07:03:19.628Z', '2025-04-24T07:03:19.628Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4655, 4551, 40, NULL, '2024-10-18T00:00:00.000Z', '2024-12-18T00:00:00.000Z', 250.73, NULL, NULL, NULL, 250.73, NULL, NULL, NULL, '2025-04-24T07:03:19.629Z', '2025-04-24T07:03:19.629Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4656, 4552, 26, NULL, '2024-06-07T00:00:00.000Z', '2024-09-07T00:00:00.000Z', 798.95, NULL, 199.74, 599.21, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.630Z', '2025-04-24T07:03:19.630Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4657, 4552, 27, NULL, '2024-11-09T00:00:00.000Z', '2024-12-09T00:00:00.000Z', 99.36, NULL, NULL, NULL, 99.36, NULL, NULL, NULL, '2025-04-24T07:03:19.631Z', '2025-04-24T07:03:19.631Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4658, 4553, 25, NULL, '2026-08-15T00:00:00.000Z', '2026-12-15T00:00:00.000Z', 749.34, NULL, NULL, 299.74, 449.6, NULL, NULL, NULL, '2025-04-24T07:03:19.633Z', '2025-04-24T07:03:19.633Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4659, 4554, 26, NULL, '2025-03-23T00:00:00.000Z', '2025-04-23T00:00:00.000Z', 50.8, 25.4, 25.4, NULL, NULL, NULL, NULL, NULL, '2025-04-24T07:03:19.634Z', '2025-04-24T07:03:19.634Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;
INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (4660, 4554, 33, NULL, '2025-03-14T00:00:00.000Z', '2025-07-14T00:00:00.000Z', 180.49, 36.1, 108.29, 36.1, NULL, 176, 60.6, 36.71, '2025-04-24T07:03:19.635Z', '2025-04-24T07:03:19.635Z')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;

COMMIT;
