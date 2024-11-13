const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Product CRUD routes

// Define CRUD operations here, as we did in the previous response.
// Example for creating a product:
// Route to get all products
router.get("/", async (req, res) => {
  try {
    // Asegúrate de que el user_dni en products tenga una relación con el id en users
    const query = `
        SELECT products.*, users.username 
        FROM products 
        JOIN users ON products.user_dni = users.dni
      `;
    const [products] = await db.promise().query(query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { serviceName, description, availability } = req.body;
  const userDni = req.user.dni;

  try {
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO products (service_name, description, availability, user_dni) VALUES (?, ?, ?, ?)",
        [serviceName, description, availability, userDni]
      );
    res.status(201).json({
      message: "Product created successfully",
      productId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update product
// Update product route in products.js
router.put("/:id", authenticateToken, async (req, res) => {
  const { serviceName, description, availability } = req.body;
  const userDni = req.user.dni;
  const productId = req.params.id;

  try {
    // Check if the product belongs to the user
    const [product] = await db
      .promise()
      .query("SELECT user_dni FROM products WHERE id = ?", [productId]);

    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product[0].user_dni !== userDni) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this product" });
    }

    // Proceed with the update
    await db
      .promise()
      .query(
        "UPDATE products SET service_name = ?, description = ?, availability = ? WHERE id = ?",
        [serviceName, description, availability, productId]
      );

    res.status(200).json({ message: "Product updated successfully" }); // Ensure a clear response
  } catch (error) {
    console.error("Error updating product:", error); // Log error to server console
    res.status(500).json({ error: "Database error" });
  }
});

// Delete product
router.delete("/:id", authenticateToken, async (req, res) => {
  const userDni = req.user.dni; // Retrieved from the decoded token
  const productId = req.params.id;

  try {
    // Check if the product belongs to the user
    const [product] = await db
      .promise()
      .query("SELECT user_dni FROM products WHERE id = ?", [productId]);

    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Verify the product ownership
    if (product[0].user_dni !== userDni) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this product" });
    }

    // Proceed with the delete operation
    await db.promise().query("DELETE FROM products WHERE id = ?", [productId]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Add other routes for retrieving, updating, and deleting products...

module.exports = router;
