const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");
const validatingOperations = require("../Operations/operations.js");
const dboperations = require("../Operations/DataBaseOperations.js");

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
  name: "Miles",
  id_card: "VenomSucks69",
  password: "HaileySucks23",
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
      //! PROBLEM WITH PRESCRIPTION CONSOLIDATION
      const medicalInfo = userInfo[0].medical;
      const prescriptionInfo = medicalInfo.prescription;
      const prescriptions = [];
      for (let i = 0; i < prescriptionInfo.length; i++) {
        prescriptions.push(await UserModel.findById(prescriptionInfo[i].id));
      }
      res.json({
        medical: medicalInfo,
        prescription_Info: prescriptionInfo,
        prescriptions: prescriptions,
      });
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
      else res.json({ status: "Values Not Inserted" });
    } catch (errors) {
      res.status(500).json({ status: errors });
    }
  }
);

//** Permission Addtion route to permissions table */
TestRouter.post(
  "/permissionAdd",
  [
    body("role_id", "Enter the service id in correct format")
      .exists()
      .isLength({ min: 12, max: 12 }),
    body("role", "Role is mandatory").exists(),
    body("access", "access should be either only-read or edit").equals(
      "edit" || "only-read"
    ),
  ],
  async (req, res) => {
    try {
      //? Input Validation
      let errors = validationResult(req);

      if (!errors.isEmpty()) throw errors;

      //? Retrieving Values
      let role_id = req.body.role_id;
      let role = req.body.role;
      let access = req.body.access;

      //? Query Execution
      let checkInserted = await dboperations.createPermission(
        role_id,
        role,
        access
      );

      //? Acknoledgment
      if (checkInserted == true) res.json({ status: "Values Inserted" });
      else res.json({ status: "Values Not Inserted" });
    } catch (errors) {
      res.status(500).json({ status: errors });
    }
  }
);

module.exports = TestRouter;
