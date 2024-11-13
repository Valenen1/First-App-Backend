const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "adminadmin";

const authenticateToken = (req, res, next) => {
  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    console.log("Token recibido:", token);
    if (err) return res.status(403).send({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
