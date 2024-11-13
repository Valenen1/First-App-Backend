const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Loads environment variables from .env

const app = express();
const authRoutes = require("./routes/auth"); // Import auth routes
const productRoutes = require("./routes/products"); // Import product routes

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", // Permite solo el origen de tu frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Ajusta los métodos según lo necesario
    allowedHeaders: ["Content-Type", "Authorization"], // Ajusta los encabezados si usas alguno específico
  })
);

// Routes
app.use("/auth", authRoutes); // Register auth routes under /auth
app.use("/products", productRoutes); // Register product routes under /products

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
