const express = require("express");
const prisma = require("../utils/prisma");

const router = express.Router();

router.get("/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

module.exports = router;
