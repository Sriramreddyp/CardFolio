const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");
const jwt = require("jsonwebtoken");
const validatingOperations = require("../Operations/operations.js");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const auth = require("../Utils/middleware.js");

//* Dynamic Variable for error msg's and acknowlegments
var errormsg;
var ack;

//* Dynamic Variable for value population
var Username;
var height;
var weight;
var group;
var diabetic;
var colestrol;
var diagnosisArray = [];

//* Base Route
DocRouter.get("/", auth.loginRedirectDocter, (req, res) => {
  res.render("Docter/DLogin", { alert: errormsg });
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
      .isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      //? Validation Handling
      let errors = validationResult(req);
      if (!errors.isEmpty())
        throw "Plese enter the credentials in requried format!!";

      //? Grabbing values from req and database
      let doc_id = req.body.service_id;
      let pass = await dboperations.loginServiceProvider(doc_id);

      //? CheckUp for authenticity
      if (pass == false || pass != parseInt(req.body.pin))
        throw "Invalid credentials";

      //?Cookie Generation
      jwt.sign(
        { doc: doc_id },
        process.env.REFRESH_TOKEN_DOCTOR,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Internal Server error , Please try again after sometime!!";
          } else {
            res
              .cookie("access_token_doctor", token, {
                httpOnly: true,
                sameSite: "None",
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
              })
              .redirect("/doctor/dash");
          }
        }
      );
    } catch (errors) {
      console.log(errors);
      errormsg = errors;
      res.status(500).redirect("/doctor");
    }
  }
);

//** DashBoard display Route */
DocRouter.get("/dash", auth.authorizationDoctor, (req, res) => {
  res.render("Docter/DHome", {
    alert: errormsg,
    Username: Username,
    weight: weight,
    height: height,
    group: group,
    diabetic: diabetic,
    colestrol: colestrol,
    TableTrans: diagnosisArray,
    UpdationACK: ack,
  });
});

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
      if (!errors.isEmpty()) throw "Enter user id in correct format!!";

      // //?Cookies Generation and parsing
      jwt.sign(
        { user: req.body.id },
        process.env.REFRESH_TOKEN_USER,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Internal Server Error!! Please try again after sometime";
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
      Username = userInfo[0].name;
      weight = userInfo[0].medical.Body_weight;
      height = userInfo[0].medical.Body_height;
      group = userInfo[0].medical.Blood_Group;
      diabetic = userInfo[0].medical.Diabetic_Status;
      colestrol = userInfo[0].medical.Colestrol_level;

      // const prescriptionInfo = medicalInfo.prescription;
      // const prescriptions = [];

      // for (let i = 0; i < prescriptionInfo.length; i++) {
      //   prescriptions.push(await UserModel.findById(prescriptionInfo[i].id));
      // }

      //  //? Retrieve Details
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
        errormsg = err;
        res.redirect("/doctor/dash");
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
        diagnosis
      );

      diagnosisArray = ConsolidatedInfo;

      //?Returning the consolidated information
      res.status(200).redirect("/doctor/dash");
    } catch (msg) {
      // res.clearcookie("access_token_user");
      errormsg = msg;
      res.status(200).redirect("/doctor/dash");
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

      console.log(userToken);
      console.log(docterToken);
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
        errormsg = "Please login again (Session expired)!!";
        res.clearCookie("access_token_user");
        res.clearCookie("access_token_doctor");
        res.redirect("/doctor");
      }

      //?Checking for permission in permission database
      try {
        let permissionCheck = await dboperations.checkPermission(Docter_ID);

        if (permissionCheck != "edit")
          throw "Doctor is not permitted to edit..";
      } catch (err) {
        if (!err)
          err = "Internal Server Error, Please try again after sometime";
        else ack = err;
        return res.redirect("/doctor/dash");
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

        //?Creating and formatting date and time for prescription
        const currentDate = new Date();

        //? Create an instance of the Intl.DateTimeFormat object for the IST time zone.
        const istDateTime = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          dateStyle: "full",
          timeStyle: "long",
        });

        //? Format the current date and time in IST.
        const istDateAndTime = istDateTime.format(currentDate);

        //? Forming prescription schema
        const prescription = new PresModel({
          user_id: User_ID,
          doctor_id: Docter_ID,
          diagnosis: [{ Disease, medicines }],
          timestamp: istDateAndTime,
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

        ack = "Prescription Updated!!";
        res.redirect("/doctor/dash");
      } catch (err) {
        if (!err)
          err = "Internal Server Error, Please try again after sometime";
        else ack = err;
        return res.redirect("/doctor/dash");
      }
    } catch (err) {
      if (!err) err = "Internal Server Error, Please try again after sometime";
      else ack = err;
      return res.redirect("/doctor/dash");
    }
  }
);

DocRouter.get("/logout", auth.authorizationDoctor, (req, res) => {
  if (req.cookies.access_token_user) res.clearCookie("access_token_user");
  res.clearCookie("access_token_doctor").redirect("/doctor");
});

module.exports = { DocRouter };
