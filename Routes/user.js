const express = require("express");
const { body, validationResult } = require("express-validator");
const user = express.Router();
const bcrypt = require("bcryptjs");
const UserModel = require("../Models/User.js");
const PresModel = require("../Models/Prescription.js");
const jwt = require("jsonwebtoken");
const auth = require("../Utils/middleware.js");
const validators = require("../Operations/operations.js");
const dboperations = require("../Operations/DataBaseOperations.js");

//**Dynamic variables for Errormsg rendering */
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

// user.get("/", (req, res) => {
//   res.send("User Side is working Fine!!");
// });

//** User Creation Route */
user.post(
  "/createUser",
  [
    body("name").exists(),
    body("id_no").isLength({ min: 12, max: 12 }),
    body("password").isLength({ min: 5 }),
    body("weight").isNumeric(),
    body("height").isNumeric(),
    body("blood_grp").isLength({ min: 2, max: 3 }),
    body("diabetic").isBoolean(),
    body("cholestrol").isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await UserModel.findOne({ id_card: req.body.id_no });
      if (user) {
        res.status(400).json({ error: "User Already Exists" });
      }

      const salt = await bcrypt.genSalt(10);
      let secPass = await bcrypt.hash(req.body.password, salt);

      user = new UserModel({
        name: req.body.name,
        id_card: req.body.id_no,
        password: secPass,
        medical: {
          Body_weight: req.body.weight,
          Body_height: req.body.height,
          Blood_Group: req.body.blood_grp,
          Diabetic_Status: req.body.diabetic,
          Colestrol_level: req.body.cholestrol,
          prescription: [],
        },
        status: true,
      });

      const savedUser = await user.save();

      jwt.sign(
        { user: savedUser.id_card },
        process.env.REFRESH_TOKEN_USER,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            throw "Internal Server Error, Please try again!!";
          } else {
            res
              .cookie("access_token_user", token, {
                httpOnly: true,
                sameSite: "None",
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
              })
              .status(200)
              .json({ status: "Creation & Login Sucessfull" });
          }
        }
      );
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

//**User mail route */
user.get("/", auth.loginRedirectUser, (req, res) => {
  res.render("/app/views/User/Login", { alert: errormsg });
});

//**User DashBoard Rendering Route */
user.get("/dash", auth.authorizationUser, (req, res) => {
  res.render("/app/views/User/Home", {
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

//** Login Route for User */
user.post(
  "/login",
  [body("id_no").isLength({ min: 12, max: 12 }), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        throw "Please provide the credentials in required format";

      let user = await UserModel.findOne({ id_card: req.body.id_no });
      if (!user) throw "Invalid Credentials!!";

      let pwdCompare = await bcrypt.compare(req.body.password, user.password);
      if (!pwdCompare) throw "Invalid Credentials!!";

      jwt.sign(
        { user: user.id_card },
        process.env.REFRESH_TOKEN_USER,
        { expiresIn: "10m" },
        (err, token) => {
          if (err)
            throw "Internal Server Error, Please try again after sometime!!";
          else {
            res
              .cookie("access_token_user", token, {
                httpOnly: true,
                sameSite: "None",
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
              })
              .status(200)
              .redirect("/user/userInfo");
          }
        }
      );
    } catch (error) {
      errormsg = error;
      console.log(error);
      res.redirect("/user");
    }
  }
);

//** Route for Retriveing User info */
user.get("/userInfo", auth.authorizationUser, async (req, res) => {
  try {
    //? Retrieve Details
    const userInfo = await UserModel.find({ id_card: req.user_id });

    // //? Handling User Exception of document not found
    if (userInfo.length == 0)
      throw "unable to find the user with given user_id";

    //?Consolidating information
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
    const userPresInfo = await PresModel.find({ user_id: req.user_id });

    // //? Handling User Exception of document not found
    if (userPresInfo.length == 0) {
      ack = "No Prescriptions Found!!";
      res.redirect("/user/dash");
    }

    //?Getting docter_id's
    const docterIds = validators.extractDocterIDs(userPresInfo);
    const prescriptionIds = validators.extractPrescriptionIDs(userPresInfo);
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
      return res.send(err);
    }

    //?Retriving all the diagnosis details
    const diagnosis = [];
    for (let i = 0; i < userPresInfo.length; i++) {
      diagnosis.push(userPresInfo[i].diagnosis);
    }
    console.log(diagnosis);

    //?Consolidating information
    const ConsolidatedInfo = validators.consolidationForPharmacist(
      prescriptionIds,
      docterIds,
      docterNames,
      diagnosis
    );
    diagnosisArray = ConsolidatedInfo;
    errormsg = "";
    //?Returning the consolidated information
    res.status(200).redirect("/user/dash");
  } catch (msg) {
    res.clearCookie("access_token_user");
    errormsg = msg;
    res.redirect("/user");
  }
});

//** Logout User */
user.get("/logout", auth.authorizationUser, (req, res) => {
  res.clearCookie("access_token_user").redirect("/user");
});

module.exports = user;
