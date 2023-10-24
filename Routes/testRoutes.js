const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");
const validatingOperations = require("../Operations/operations.js");
const dboperations = require("../Operations/DataBaseOperations.js");
const { response } = require("express");

//* Consolidated prescription object - For Test purpose will be removed later
let prescription = {
  user_id: "243456567876",
  doctor_id: "123456781234",
  diagnosis: [
    { Disease: "Diarrea", medicines: [{ name: "eldopher", status: true }] },
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
    Blood_Group: "A-",
    Diabetic_status: false,
    "Colestrol level": 77,
    prescription: [],
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
      try {
        await user.save();
        res.json({ status: "Sucessfull!!" });
      } catch (err) {
        res.json({ status: "UnSucessfull - User Exists" });
      }
    }
  } catch (error) {
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
      //? Retreiving the user from user's schema
      let user = await UserModel.find({ id_card: User.id_card });
      //? Creation of schema object
      const pres = new PresModel(prescription);
      //? Query Execution Handling
      try {
        const pres_id = await pres.save();
        const id = pres_id._id;
        // //?Updating the user with new prescription Id
        user[0].medical.prescription.push({ id });
        console.log(user);
        let newUser = await UserModel.findOneAndUpdate(
          { id_card: User.id_card },
          { $set: user[0] },
          { new: true }
        );
        res.status(200).json({ newUser });
      } catch (err) {
        console.log(err);
        res.status(400).json({ error: "unable to store prescription" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Not Inserted" });
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
