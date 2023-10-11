const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");
const validatingOperations = require("../Operations/operations.js");

//* Consolidated prescription object - For Test purpose will be removed later
let prescription = {
  user_id: "20BCN7002",
  doctor_id: "rydh374hddadasd",
  diagnosis: [
    { Disease: "Diarrea", medicines: [{ name: "enyon", status: true }] },
  ],
};

//* Consolidated user object - For Test purpose will be removed later
let User = {
  name: "Atreus",
  id_card: "243456567876",
  password: "Amman3213dadasdadsa",
  medical: {
    Body_weight: 150,
    Body_height: 200,
    Blood_Group: "He is God!",
    Diabetic_status: "He is God!",
    "Colestrol level": "Just Like his enemies Blood",
    prescription: [{ prescription_id: "2hd76fsjasd87" }],
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

//**Doc addition route to the prescription Schema */
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

module.exports = TestRouter;
