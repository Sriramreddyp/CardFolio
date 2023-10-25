const Prescription = require('../Models/Prescription');

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

function validateUser(User) {
    const UserRegex = /^\d+$/;
    const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]+$/; //! PROBLEM WITH THIS!!
    let userCheck;
    let passCheck;
    let user_id = User.id_card;
    let password = User.password;

    //? Validating User_id
    if (user_id.length == 12 && UserRegex.test(user_id)) userCheck = true;

    //? Validating User password
    if (password.length >= 12) passCheck = true;

    //? Final return Value
    if (passCheck == true && userCheck == true) return true;
    else return false;
}

function extractMedicines(medicines){
    let medicinalArray = medicines.split(",");
    let finalArray = [];
    for(let i=0;i<medicinalArray.length;i++){
        finalArray.push({name: medicinalArray[i],status: false});
    }
    return finalArray;
}

// async function fetchPrescriptions(presArray) {
//     const prescriptionObjects = [];
    
//     for (const pres_id of presArray) {
//         const prescription = await Prescription.findById(pres_id);
//         console.log(prescription);
//         prescriptionObjects.push(prescription);
//     }
//     return prescriptionObjects;
// }

async function fetchPrescriptions(pres_id){
    return await Prescription.findById(pres_id);
}

module.exports = {validatePrescription, validateUser, extractMedicines, fetchPrescriptions};