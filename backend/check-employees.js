require("dotenv").config();

const prisma = require("./src/utils/prisma");

async function main() {
  const employee = await prisma.employee.findFirst({
    where: {
      id: 1,
      isActive: true,
      user: { is: null }
    },
    select: { id: true }
  });

  console.log("Employee 1 eligible:", employee !== null);
}

main()
  .catch((error) => console.error("Query failed:", error.message))
  .finally(() => prisma["$disconnect"]());
