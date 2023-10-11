const SQL = require("mysql2");

const con = SQL.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "creditsys",
});

con.connect((err) => {
  if (err == null) console.log("SQL DataBase Connected!!");
  else console.log("SQL DataBase Not Connected!!");
});

module.exports = con;
