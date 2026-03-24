-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "User" u
SET
	"reviewCount" = sub.cnt,
	"averageRating" = ROUND(sub.avg::numeric, 2)::double precision
FROM (
	SELECT "revieweeId", COUNT(id) AS cnt, AVG(rating) AS avg
	FROM "Review"
	GROUP BY "revieweeId"
) sub
WHERE u.id = sub."revieweeId";
