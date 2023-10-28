const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");
const jwt = require("jsonwebtoken");
const validatingOperations = require("../Operations/operations.js");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const middle = require("../Utils/middleware.js");

//* Base Route
DocRouter.get("/", (req, res) => {
  res.send("Doctor Route is Working Fine!!");
});

//* Login Route for Doctor Portal
DocRouter.post(
  "/login",
  [
    body("service_id", "Enter the service_id in required format")
      .exists()
      .isLength({ min: 12, max: 12 }),
    body("pin", "Plese enter the PIN in required format")
      .exists()
      .isNumeric()
      .isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      //? Validation Handling
      let errors = validationResult(req);
      if (!errors.isEmpty()) throw errors;

      //? Grabbing values from req and database
      let doc_id = req.body.service_id;
      let pass = await dboperations.loginDoctor(doc_id);

      //? CheckUp for authenticity
      if (pass == false || pass != req.body.pin) throw "Invalid credentials";

      //?Cookie Generation
      jwt.sign(
        { doc: doc_id },
        process.env.REFRESH_TOKEN_DOCTOR,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Unable to create cookie";
          } else {
            res
              .cookie("access_token_doctor", token, {
                httpOnly: true,
                sameSite: "None",
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
              })
              .json({ status: "Login Sucessfull" });
          }
        }
      );
    } catch (errors) {
      res.status(500).json({ status: errors });
    }
  }
);

//* UserInfo Retrieval Route
DocRouter.post(
  "/userInfo",
  [
    body("id", "Please enter the id in correct format")
      .exists()
      .isLength({ min: 12, max: 12 }),
  ],
  async (req, res) => {
    try {
      //? Validation Handling
      let errors = validationResult(req);
      if (!errors.isEmpty()) throw errors;

      // //?Cookies Generation and parsing
      jwt.sign(
        { user: req.body.id },
        process.env.REFRESH_TOKEN_USER,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Unable to create cookie";
          } else {
            res.cookie("access_token_user", token, {
              httpOnly: true,
              sameSite: "None",
              secure: true,
              maxAge: 24 * 60 * 60 * 1000,
            });
          }
        }
      );

      //? Retrieve Details
      const userInfo = await UserModel.find({ id_card: req.body.id });

      // //? Handling User Exception of document not found
      if (userInfo.length == 0)
        throw "unable to find the user with given user_id";

      //?Consolidating information
      //! PROBLEM WITH PRESCRIPTION CONSOLIDATION
      const medicalInfo = userInfo[0].medical;
      const prescriptionInfo = medicalInfo.prescription;
      const prescriptions = [];

      for (let i = 0; i < prescriptionInfo.length; i++) {
        prescriptions.push(await UserModel.findById(prescriptionInfo[i].id));
      }

      //?Returning the consolidated information
      res.json({
        medical: medicalInfo,
        prescription_Info: prescriptionInfo,
        prescriptions: prescriptions,
      });
    } catch (msg) {
      res.clearcookie("access_token_user");
      res.status(500).json({ status: msg });
    }
  }
);

//* Doc prescription addition route with user updation
DocRouter.post(
  "/presAdd",

  [body("medicines").exists(), body("diseases").exists()],

  async (req, res) => {
    //?Authentication for cookie
    try {
      //? For Holding id's
      let User_ID;
      let Docter_ID;

      //? Retriving cookies -- Error Case - if there are no cookies
      const docterToken = req.cookies.access_token_doctor;
      const userToken = req.cookies.access_token_user;

      if (!docterToken || !userToken)
        throw "can't access without authentication";

      //?Block to catch verifying exceptions - error case jwt expire
      try {
        const docterData = jwt.verify(
          docterToken,
          process.env.REFRESH_TOKEN_DOCTOR
        );

        const userData = jwt.verify(userToken, process.env.REFRESH_TOKEN_USER);

        User_ID = userData.user;
        Docter_ID = docterData.doc;
      } catch (err) {
        res.status(500).json({ status: "JWT Expired" });
      }

      try {
        //?validation handling
        let errors = validationResult(req);
        if (!errors.isEmpty()) throw errors;

        //? Retieving user details -- error case - no retrival

        let user = await UserModel.find({ id_card: User_ID });
        if (!user) throw "User Not Found";

        //?Forming medicine object from comma seperated file and extracting disease
        let medicines = validatingOperations.extractMedicines(
          req.body.medicines
        );

        let Disease = req.body.diseases;

        //? Forming prescription schema
        const prescription = new PresModel({
          user_id: User_ID,
          doctor_id: Docter_ID,
          diagnosis: [{ Disease, medicines }],
        });

        //? Query Execution Handling

        const pres_id = await prescription.save();
        const id = pres_id._id;

        //?Updating the user with new prescription Id
        user[0].medical.prescription.push({ id });

        //? Updating the user with new prescription id's
        let newUser = await UserModel.findOneAndUpdate(
          { id_card: User_ID },
          { $set: user[0] },
          { new: true }
        );

        res.status(200).json({ newUser });
      } catch (err) {
        res
          .status(500)
          .json({ status: "unable to store prescription", error: err });
      }
    } catch (err) {
      res
        .status(500)
        .json({ msg: "Unable to store prescription", status: err });
    }
  }
);

module.exports = DocRouter;
