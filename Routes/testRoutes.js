const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");
const validatePrescription = require("../Operations/operations.js");

//* Consolidated prescription object - For Test purpose will be removed later
let prescription = {
  user_id: "20BCN7002",
  doctor_id: "rydh374hd",
  diagnosis: [
    { Disease: "Diarrea", medicines: [{ name: "enyon", status: true }] },
  ],
};

TestRouter.get("/", (req, res) => {
  res.json("Connection Successfull");
});

//**Doc addition route to the user Schema */
TestRouter.post(
  "/addUser",
  [
    //? Validation Parameters
    body("id_card", "Please enter the Id in required format")
      .exists()
      .isLength({ min: 12, max: 12 }),
    body("password", "Please Enter the Password in required Format")
      .exists()
      .isLength({ min: 0, max: 12 })
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]+$/),
  ],
  async (req, res) => {
    try {
      //? Input Validation For id_card and password.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw errors;
      }

      //? Creation of schema object
      const user = new UserModel(req.body);

      //? Query Execution and Handlin
      await user.save();
      console.log(user);
      res.json({ status: "Sucessfull!!" });
    } catch (error) {
      console.log(error);
      res.json({ status: "Not Inserted" });
    }
  }
);

//**Doc addition route to the prescription Schema */
TestRouter.post("/presAdd", async (req, res) => {
  try {
    //? Validation for consolidated Prescription object
    if (!validatePrescription(prescription)) {
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
