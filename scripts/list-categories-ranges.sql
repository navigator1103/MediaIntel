-- List all categories and their associated ranges
SELECT c.id AS category_id, c.name AS category_name, r.id AS range_id, r.name AS range_name
FROM ms_categories c
LEFT JOIN ms_ranges r ON r.category_id = c.id
ORDER BY c.name, r.name;
