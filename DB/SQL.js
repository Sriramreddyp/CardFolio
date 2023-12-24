const SQL = require("mysql2");

const con = SQL.createConnection({
  host: "sql_container",
  user: "root",
  password: "mauFJcuf5dhRMQrjj",
  database: "estonian_card",
  waitForConnection: true,
});

con.connect();

module.exports = con;
