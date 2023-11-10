//* function for validating consolidated prescription obj
function validatePrescription(prescription) {
  const regex = /^\d+$/;
  let userCheck;
  let doctorCheck;
  let user_id = prescription.user_id;
  let doctor_id = prescription.doctor_id;

  //? Validating User_id
  if (user_id.length == 12 && regex.test(user_id)) userCheck = true;

  //? Validating doctor_id
  if (doctor_id.length == 12 && regex.test(doctor_id)) doctorCheck = true;

  //? Final return Value
  if (doctorCheck == true && userCheck == true) return true;
  else return false;
}

//** function for validating consolidated user obj */
function validateUser(User) {
  // const UserRegex = /^\d+$/;
  // const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]+$/; //! PROBLEM WITH THIS!!
  let userCheck;
  let passCheck;
  let user_id = User.id_card;
  let password = User.password;

  //? Validating User_id
  if (user_id.length == 12) userCheck = true;

  //? Validating User password
  if (password.length >= 12) passCheck = true;

  //? Final return Value
  if (passCheck == true && userCheck == true) return true;
  else return false;
}

//* Function to seggragate medicine
function extractMedicines(medicines) {
  let medicinalArray = medicines.split(",");
  let finalArray = [];
  for (let i = 0; i < medicinalArray.length; i++) {
    finalArray.push({ name: medicinalArray[i], status: false });
  }
  return finalArray;
}

//* Function to seggregate docterID's
function extractDocterIDs(user) {
  let docterIds = [];
  for (let i = 0; i < user.length; i++) {
    docterIds.push(user[i].doctor_id);
  }
  return docterIds;
}

//* Function to consolidate information (User-side) for pharmacist
function consolidationForPharmacist(docterids, docternames, diagnosis) {
  let consolidatedInfo = [];
  for (let i = 0; i < docterids.length; i++) {
    let medicines = [];
    let status = [];
    let disease = diagnosis[i][0].Disease;

    for (let j = 0; j < diagnosis[i][0].medicines.length; j++) {
      medicines.push(diagnosis[i][0].medicines[j].name);
      status.push(diagnosis[i][0].medicines[j].status);
    }

    let obj = {
      name: docternames[i],
      disease: disease,
      medicines: medicines,
      status: status,
    };

    consolidatedInfo.push(obj);
  }
  return consolidatedInfo;
}

module.exports = {
  validatePrescription,
  validateUser,
  extractMedicines,
  extractDocterIDs,
  consolidationForPharmacist,
};
