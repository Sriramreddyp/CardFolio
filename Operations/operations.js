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

module.exports = validatePrescription;
