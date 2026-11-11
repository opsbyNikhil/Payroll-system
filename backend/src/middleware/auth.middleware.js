const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// Verify the access token.
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access token is required",
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired access token",
      });
    }

    if (!payload.sub) {
      return res.status(401).json({
        message: "Invalid access token",
      });
    }

    // Check the current account state instead of trusting token claims alone.
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        employeeId: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user || !user.isActive || !user.isEmailVerified) {
      return res.status(401).json({
        message: "Account is inactive or email is not verified",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

// Restrict access to specified roles.
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
