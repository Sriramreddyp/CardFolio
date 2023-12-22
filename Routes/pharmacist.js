const express = require("express");
const { body, validationResult } = require("express-validator");
const PharRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");
const jwt = require("jsonwebtoken");
const validatingOperations = require("../Operations/operations.js");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User.js");
const auth = require("../Utils/middleware.js");

//** Dynamic Variable to render errors */
var errormsg;

//* Base Route
PharRouter.get("/", auth.loginRedirectPharmacist, (req, res) => {
  res.render("/app/views/Pharmacist/MLogin", { alert: errormsg });
});

//**DashBoard Route */
PharRouter.get("/dash", (req, res) => {
  res.render("/app/views/Pharmacist/MHome");
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
      .isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      //? Validation Handling
      let errors = validationResult(req);
      if (!errors.isEmpty()) throw "Enter the credentials in correct Format!!";

      //? Grabbing values from req and database
      let phar_id = req.body.service_id;
      let pass = await dboperations.loginServiceProvider(phar_id);

      //? CheckUp for authenticity
      if (pass == false || pass != parseInt(req.body.pin))
        throw "Invalid credentials";

      //?Cookie Generation
      jwt.sign(
        { phar: phar_id },
        process.env.REFRESH_TOKEN_PHARMACIST,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Internal Server Error, Please try again after sometime!";
          } else {
            res
              .cookie("access_token_pharmacist", token, {
                httpOnly: true,
                sameSite: "None",
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
              })
              .redirect("/phar/dash");
          }
        }
      );
    } catch (errors) {
      errormsg = errors;
      res.status(500).redirect("/phar");
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
        { pharmacist: req.body.id },
        process.env.REFRESH_TOKEN_PHARMACIST,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Unable to create cookie";
          } else {
            res.cookie("access_token_pharmacist", token, {
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

      // console.log(userInfo);

      //? Retrieve Details
      const userPresInfo = await PresModel.find({ user_id: req.body.id });

      // //? Handling User Exception of document not found
      if (userPresInfo.length == 0)
        throw "unable to find the user with given user_id";

      // console.log(userPresInfo);

      //?Getting docter_id's
      const docterIds = validatingOperations.extractDocterIDs(userPresInfo);
      const prescriptionIds =
        validatingOperations.extractPrescriptionIDs(userPresInfo);
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
        prescriptionIds,
        docterIds,
        docterNames,
        diagnosis
      );
      console.log(ConsolidatedInfo);
      //?Returning the consolidated information
      res.json({
        name: userInfo[0].name,
        Information: ConsolidatedInfo,
      });
    } catch (msg) {
      res.status(500).json({ status: msg });
    }
  }
);

//* Route for updating medical status
PharRouter.post("/presUpdate", async (req, res) => {
  //?Authentication for cookie
  try {
    //? For Holding id's
    var Pharmacist_ID;

    //? Retriving cookies -- Error Case - if there are no cookies
    const PharmacistToken = req.cookies.access_token_pharmacist;
    if (!PharmacistToken) throw "can't access without authentication";

    //?Block to catch verifying exceptions - error case jwt expire
    try {
      const pharmacistData = jwt.verify(
        PharmacistToken,
        process.env.REFRESH_TOKEN_PHARMACIST
      );
      Pharmacist_ID = pharmacistData.pharmacist;
    } catch (err) {
      return res.status(500).json({ status: "JWT Expired" });
    }
  } catch (err) {
    return res.status(500).json({ status: false });
  }

  // //?Checking for permission in permission database
  // // try {
  // let permissionCheck = await dboperations.checkPermission(Pharmacist_ID);
  // console.log(permissionCheck);
  // // if (permissionCheck != "edit")
  // //   throw "Pharmacist is not permitted to edit..";
  // // } catch (err) {
  // //   return res.status(500).json({ status: err });
  // // }

  try {
    //? Retrieve Details
    const userInfo = await PresModel.findById(req.body.id);

    //? Handling User Exception of document not found
    if (userInfo.length == 0)
      throw "unable to find the user with given user_id";

    //?Consolidating information
    for (let i = 0; i < userInfo.diagnosis[0].medicines.length; i++) {
      userInfo.diagnosis[0].medicines[i].status = true;
    }
    //? Updating the prescription with updated status
    let newPres = await PresModel.findOneAndUpdate(
      { _id: req.body.id },
      { $set: userInfo },
      { new: true }
    );
    //?Execption Handling
    if (!newPres) throw "Document not updated!!";
    //?Returning the consolidated information
    res.json({
      status: true,
    });
  } catch (msg) {
    res.status(500).json({ status: false });
  }
});

PharRouter.get("/logout", auth.authorizationPhar, (req, res) => {
  res.clearCookie("access_token_pharmacist").redirect("/phar");
});

module.exports = PharRouter;
