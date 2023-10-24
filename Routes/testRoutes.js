const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");
const validatingOperations = require("../Operations/operations.js");
const dboperations = require("../Operations/DataBaseOperations.js");

//* Consolidated prescription object - For Test purpose will be removed later
let prescription = {
  user_id: "20BCN7006",
  doctor_id: "rydh374hddadasd",
  diagnosis: [
    { Disease: "Diarrea", medicines: [{ name: "enyon", status: true }] },
  ],
};

//* Consolidated user object - For Test purpose will be removed later
let User = {
  name: "Miles",
  id_card: "VenomSucks69",
  password: "HaileySucks23",
  medical: {
    Body_weight: 150,
    Body_height: 200,
    Blood_Group: "A-",
    Diabetic_status: "No",
    "Colestrol level": "Node",
    prescription: [{ prescription_id: "dsadh34h1kn2" }],
    status: "true",
  },
};

TestRouter.get("/", (req, res) => {
  res.json("Connection Successfull");
});

//**Doc addition route to the user Schema */
TestRouter.post("/addUser", async (req, res) => {
  try {
    //? Validation for consolidated user object
    if (!validatingOperations.validateUser(User)) {
      console.log("Validation error");
      res.json({ status: "Not Inserted" });
    } else {
      //? Creation of schema object
      const user = new UserModel(User);
      //? Query Execution and Handling
      await user.save();
      console.log(user);
      res.json({ status: "Sucessfull!!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: "Not Inserted" });
  }
});

//** Doc Retreival Route for retreiving User's info by id  */
TestRouter.post(
  "/getUser",
  [
    body("id", "Enter the user_id in required format.")
      .exists()
      .isLength({ min: 12, max: 12 }),
  ],
  async (req, res) => {
    try {
      //? Input Validation
      let errors = validationResult(req);
      if (!errors.isEmpty()) throw errors;

      //? Retrieve Details
      const userInfo = await UserModel.find({ id_card: req.body.id });

      // //? Handling User Exception of document not found
      if (userInfo.length == 0) res.json({ status: "Document Not Found!!" });

      //?Consolidating information
      const medicalInfo = userInfo[0].medical;
      const prescriptionInfo = medicalInfo.prescription;

      res.json({ medical: medicalInfo, prescription_Info: prescriptionInfo });
    } catch (errors) {
      res.json({ status: errors });
    }
  }
);

//**Doc addition route to the prescription Schema - utility*/
TestRouter.post("/presAdd", async (req, res) => {
  try {
    //? Validation for consolidated Prescription object
    if (!validatingOperations.validatePrescription(prescription)) {
      console.log("Validation Fault!!");
      res.json({ status: "Not Inserted" });
    } else {
      //? Creation of schema object
      const pres = new PresModel(prescription);
      //? Query Execution Handling
      await pres.save();
      console.log(pres);
      res.json({ status: "Sucessfull!!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: "Not Inserted" });
  }
});

//** Doc Addtion route to service_provider table */
TestRouter.post(
  "/docterAdd",
  [
    body("service_id", "Enter the service id in correct format")
      .exists()
      .isLength({ min: 12, max: 12 }),
    body("pin", "Pin should contain only six numbers")
      .exists()
      .isNumeric()
      .isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      //? Input Validation
      let errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) throw errors;

      //? Retrieving Values
      let service_id = req.body.service_id;
      let name = req.body.name;
      let pin = req.body.pin;

      //? Query Execution
      let checkInserted = await dboperations.createDocter(
        service_id,
        name,
        pin
      );

      //? Acknoledgment
      if (checkInserted == true) res.json({ status: "Values Inserted" });
      else res.json({ status: checkInserted });
    } catch (errors) {
      res.json({ status: "Wrong Input Format" });
    }
  }
);

module.exports = TestRouter;
