const con = require("../DB/SQL.js");
const unid = require("generate-unique-id");

//** SQL DB operation to grap password login operation */
async function loginDoctor(docter_id) {
  var pass;
  //? Promise created to resolve the retreived value
  dbOper = new Promise((resolve, _reject) => {
    //? Query Execution
    con.query(
      `SELECT pin FROM service_provider WHERE service_id='${docter_id}' `,
      (err, result) => {
        if (err) {
          resolve(false);
        }
        pass = result[0].pin;
        console.log(pass);
        resolve(pass);
      }
    );
  });
  return await dbOper;
}

//** SQL DB Operation for Docter Addition */
async function createDocter(service_id, name, pin) {
  //? Server Generated Auth_ID
  let auth_id = unid({ length: 15, useLetters: true, useNumbers: true });

  //? Promise created to resolve the whether inserted or not
  dbOper = new Promise((resolve, _reject) => {
    //? Query
    let sql = "INSERT INTO service_provider VALUES(?,?,?,?,?)";
    //? Values
    let values = [service_id, name, "docter", pin, auth_id];
    //? Execution
    con.query(sql, values, (result) => {
      if (result != null) resolve(result.code);
      else resolve(true);
    });
  });
  return await dbOper;
}

//** SQL DB Operation for Permission Addition */
async function createPermission(role_id, role_name, access) {
  //? Promise created to resolve the whether inserted or not
  dbOper = new Promise((resolve, _reject) => {
    //? Query
    let sql = "INSERT INTO permissions VALUES(?,?,?)";
    //? Values
    let values = [role_id, role_name, access];
    //? Execution
    con.query(sql, values, (result) => {
      if (result != null) resolve(result.code);
      else resolve(true);
    });
  });
  return await dbOper;
}

//** SQL DB Operation to retrive Docter's permission from permission table */
async function checkPermission(role_id) {
  var access;
  //? Promise created to resolve the retreived value
  dbOper = new Promise((resolve, _reject) => {
    //? Query Execution
    con.query(
      `SELECT access FROM permissions WHERE role_id='${role_id}' `,
      (err, result) => {
        if (err) resolve(false);
        else {
          access = result[0].access;
          console.log(access);
          resolve(access);
        }
      }
    );
  });
  return await dbOper;
}

module.exports = {
  loginDoctor,
  createDocter,
  createPermission,
  checkPermission,
};
