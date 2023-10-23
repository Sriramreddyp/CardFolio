const sql = require('mysql');

const con = sql.createConnection({
    host: "localhost",
    user:"root",
    password:"root",
    database:"estonia"
});

con.connect((err) => {
    if (err == null) console.log("SQL DataBase Connected!!");
    else console.log("SQL DataBase Not Connected!!");
});

module.exports = con;