const express = require("express");
const { body, validationResult } = require("express-validator");
const PharRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");
const jwt = require("jsonwebtoken");
const validatingOperations = require("../Operations/operations.js");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");

//* Base Route
PharRouter.get("/", (req, res) => {
  res.send("Pharmacist Route is Working Fine!!");
});

//* Login Route for Doctor Portal
PharRouter.post(
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
      let pass = await dboperations.loginServiceProvider(doc_id);

      //? CheckUp for authenticity
      if (pass == false || pass != req.body.pin) throw "Invalid credentials";

      //?Cookie Generation
      jwt.sign(
        { doc: doc_id },
        process.env.REFRESH_TOKEN_PHARMACIST,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Unable to create cookie";
          } else {
            res
              .cookie("access_token_pharmacist", token, {
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

//?PrescriptionInfo Retrival Route from user_Id

PharRouter.post(
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
      const userPresInfo = await PresModel.find({ user_id: req.body.id });

      // //? Handling User Exception of document not found
      if (userPresInfo.length == 0)
        throw "unable to find the user with given user_id";

      //?Getting docter_id's
      const docterIds = validatingOperations.extractDocterIDs(userPresInfo);

      const docterNames = [];
      const docterAuthIds = [];
      //?Grabbing name and auth_id for each docter
      try {
        for (let i = 0; i < docterIds.length; i++) {
          let conObj = await dboperations.grabNameAndAuthID(docterIds[i]);

          if (conObj != false) {
            docterNames.push(conObj.name);
            docterAuthIds.push(conObj.auth_id);
          } else {
            throw "Invalid Details for provided docter_id";
          }
        }
      } catch (err) {
        return res.status(500).json({ status: err });
      }

      //?Retriving all the diagnosis details
      const diagnosis = [];
      for (let i = 0; i < userPresInfo.length; i++) {
        diagnosis.push(userPresInfo[i].diagnosis);
      }

      //?Consolidating information
      const ConsolidatedInfo = validatingOperations.consolidationForPharmacist(
        docterIds,
        docterNames,
        docterAuthIds,
        diagnosis
      );

      //?Returning the consolidated information
      res.json({
        Information: ConsolidatedInfo,
      });
    } catch (msg) {
      res.status(500).json({ status: msg });
    }
  }
);

module.exports = PharRouter;
