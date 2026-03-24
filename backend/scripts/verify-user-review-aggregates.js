const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const prisma = new PrismaClient();
const queryPath = path.join(__dirname, "./verify-user-review-aggregates.sql");
const query = fs.readFileSync(queryPath, "utf8");

async function main () {
    const rows = await prisma.$queryRawUnsafe(query);

    if (!Array.isArray(rows) || rows.length === 0) {
        console.log("No review aggregate mismatches found.");
        return;
    }

    console.error(`Found ${rows.length} review aggregate mismatches.`);
    console.table(rows);
    process.exitCode = 1;
}

main()
    .catch((error) => {
        console.error("Failed to verify user review aggregates:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
