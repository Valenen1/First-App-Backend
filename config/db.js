const mysql = require("mysql2");

const db = mysql.createConnection(
  "mysql://root:FXaIkrALijoyjhwaIjIUACAPjDaljUwX@autorack.proxy.rlwy.net:24692/railway"
);

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

module.exports = db;
