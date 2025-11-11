-- Update companies.category_id by matching category_slug with categories.slug
UPDATE companies
SET category_id = categories.id
FROM categories
WHERE companies.category_slug = categories.slug
AND companies.category_id IS NULL;
