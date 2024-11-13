const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Database connection
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

const router = express.Router();

// Register endpoint
router.post("/register", async (req, res) => {
  const { dni, username, password, role } = req.body;
  try {
    // Check if user already exists
    const [rows] = await db
      .promise()
      .query("SELECT dni FROM users WHERE dni = ?", [dni]);

    if (rows.length > 0) {
      console.log("User already exists with dni:", dni);
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password and insert the user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .promise()
      .query(
        "INSERT INTO users (dni, username, password, role) VALUES (?, ?, ?, ?)",
        [dni, username, hashedPassword, role || "user"]
      );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Database error during registration:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const [rows] = await db
    .promise()
    .query("SELECT * FROM users WHERE username = ?", [username]);
  if (rows.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  const user = rows[0];

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign({ dni: user.dni, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ message: "Login successful", token });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token in verifyToken middleware:", token); // Log to verify token presence

  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach token payload (dni, role) to req.user
    next();
  } catch (err) {
    console.log("JWT verification error:", err); // Log any JWT errors
    res.status(400).json({ error: "Invalid token" });
  }
};

// Route to get user profile data
router.get("/profile", verifyToken, async (req, res) => {
  const { dni } = req.user;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT dni, username, role FROM users WHERE dni = ?", [dni]);

    if (rows.length === 0) {
      console.log("User not found for DNI:", dni);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User profile data retrieved:", rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error("Database error during profile retrieval:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Route to update username if user is admin
router.put("/update-username", verifyToken, async (req, res) => {
  const { username } = req.body;
  const { dni, role } = req.user;

  if (role !== "admin") return res.status(403).json({ error: "Forbidden" });

  try {
    // Check if the username is taken
    const [existingUser] = await db
      .promise()
      .query("SELECT username FROM users WHERE username = ?", [username]);

    if (existingUser.length > 0)
      return res.status(400).json({ error: "Username already taken" });

    // Update the username
    await db
      .promise()
      .query("UPDATE users SET username = ? WHERE dni = ?", [username, dni]);

    res.json({ message: "Username updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Route to delete user account
router.delete("/delete-account", verifyToken, async (req, res) => {
  const { dni } = req.user;
  console.log("Attempting to delete account for DNI:", dni); // Log the DNI for confirmation

  try {
    // Delete user from database
    const [result] = await db
      .promise()
      .query("DELETE FROM users WHERE dni = ?", [dni]);

    if (result.affectedRows === 0) {
      console.log("No user found for deletion with DNI:", dni);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Account deleted successfully for DNI:", dni);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Database error during account deletion:", error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
