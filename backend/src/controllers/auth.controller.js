const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../utils/prisma");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAccessToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      companyId: user.companyId,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

// REGISTER
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

if (
  typeof username !== "string" ||
  typeof password !== "string" ||
  typeof confirmPassword !== "string"
) {
  return res.status(400).json({
    message: "Username, password, and confirm password are required.",
  });
}

const normalizedUsername = username.trim();

if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(normalizedUsername)) {
  return res.status(400).json({
    message:
      "Username must be 3–30 characters and contain only letters, numbers, dots, underscores, or hyphens.",
  });
}

if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
  return res.status(400).json({
    message:
      "Password must contain at least 12 characters and cannot exceed 72 UTF-8 bytes.",
  });
}

if (password !== confirmPassword) {
  return res.status(400).json({
    message: "Passwords do not match.",
  });
}

const existingUser = await prisma.user.findUnique({
  where: { username: normalizedUsername },
});

if (existingUser) {
  return res.status(409).json({
    message: "Username already exists.",
  });
}

const passwordHash = await bcrypt.hash(password, 12);

await prisma.user.create({
  data: {
    username: normalizedUsername,
    passwordHash,
    role: "EMPLOYEE",
    isActive: true,
  },
});

return res.status(201).json({
  message: "Registration successful. Please log in.",
});
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }

console.error("Registration error:", error.message);

return res.status(500).json({
  message: "Unable to register at this time.",
});
  }
};

// LOGIN
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

if (
  typeof username !== "string" ||
  typeof password !== "string" ||
  !username.trim() ||
  !password
) {
  return res.status(400).json({
    message: "Username and password are required.",
  });
}

const user = await prisma.user.findUnique({
  where: { username: username.trim() },
});

if (
  !user ||
  !user.passwordHash ||
  !(await bcrypt.compare(password, user.passwordHash))
) {
  return res.status(401).json({
    message: "Invalid username or password.",
  });
}

if (!user.isActive) {
  return res.status(403).json({
    message: "Your account is inactive.",
  });
}

const accessToken = generateAccessToken(user);
const refreshToken = generateRefreshToken(user);

await prisma.refreshToken.create({
  data: {
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

return res.status(200).json({
  message: "Login successful.",
  accessToken,
  refreshToken,
  user: {
    id: user.id,
    username: user.username,
    role: user.role,
    companyId: user.companyId,
  },
});

  } catch (error) {
    console.error("Login error:", error.message);

return res.status(500).json({
  message: "Unable to log in at this time.",
});
  }
};

// LOGOUT
// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

if (typeof refreshToken !== "string" || !refreshToken) {
  return res.status(400).json({
    message: "Refresh token is required.",
  });
}

let payload;

try {
  payload = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );
} catch {
  return res.status(200).json({
    message: "Logged out successfully.",
  });
}

if (payload.type !== "refresh" || !payload.sub) {
  return res.status(200).json({
    message: "Logged out successfully.",
  });
}

await prisma.refreshToken.updateMany({
  where: {
    tokenHash: hashToken(refreshToken),
    userId: Number(payload.sub),
    revokedAt: null,
  },
  data: {
    revokedAt: new Date(),
  },
});

return res.status(200).json({
  message: "Logged out successfully.",
});
  } catch (error) {
    console.error("Logout error:", error.message);

return res.status(500).json({
  message: "Unable to log out at this time.",
});
  }
};

module.exports = {
  register,
  login,
  logout,
};
