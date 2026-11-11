const express = require("express");
const router = express.Router();

const { register, login, logout } = require("../controllers/auth.controller");

// Register a new user
router.post("/register", register);

// Login with username and password
router.post("/login", login);

// Logout and revoke the refresh token
router.post("/logout", logout);

module.exports = router;
