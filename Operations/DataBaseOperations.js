const con = require("../DB/SQL.js");

//** SQL DB operation to grap password login operation */
async function loginDoctor(docter_id) {
  var pass;
  dbOper = new Promise((resolve, _reject) => {
    con.query(
      `SELECT pin FROM service_provider WHERE service_id='${docter_id}' `,
      (err, result) => {
        if (err) {
          resolve(false);
        }
        pass = result[0].PASSWORD;
        resolve(pass);
      }
    );
  });
  return await dbOper;
}

module.exports = { loginDoctor };
