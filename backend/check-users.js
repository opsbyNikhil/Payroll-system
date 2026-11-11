require("dotenv").config();

const prisma = require("./src/utils/prisma");

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      passwordHash: true,
      email: true,
      employeeId: true,
    },
  });

  console.table(
    users.map((user) => ({
      id: user.id,
      hasPasswordHash: Boolean(user.passwordHash),
      hasEmail: Boolean(user.email),
      employeeId: user.employeeId,
    }))
  );
}

main()
  .catch((error) => {
    console.error("Query failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
