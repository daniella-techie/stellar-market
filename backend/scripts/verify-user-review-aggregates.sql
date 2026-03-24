SELECT
  u.id,
  u.username,
  u."reviewCount" AS stored_review_count,
  COALESCE(sub.cnt, 0) AS computed_review_count,
  u."averageRating" AS stored_average_rating,
  COALESCE(ROUND(sub.avg::numeric, 2)::double precision, 0) AS computed_average_rating
FROM "User" u
LEFT JOIN (
  SELECT
    "revieweeId",
    COUNT(id)::int AS cnt,
    AVG(rating) AS avg
  FROM "Review"
  GROUP BY "revieweeId"
) sub ON sub."revieweeId" = u.id
WHERE u."reviewCount" <> COALESCE(sub.cnt, 0)
   OR u."averageRating" <> COALESCE(ROUND(sub.avg::numeric, 2)::double precision, 0)
ORDER BY u.id;
