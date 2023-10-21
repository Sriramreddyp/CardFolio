const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");
const jwt = require("jsonwebtoken");

//** Global variables */
let prescription;

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

      console.log(errors);

      //? Grabbing values from req and database
      let doc_id = req.body.service_id;
      let pass = await dboperations.loginDoctor(doc_id);

      //? CheckUp for authenticity
      if (pass == false || pass != req.body.pin) {
        errors = "Invalid credentials";
        throw errors;
      }

      //?Cookie Generation
      jwt.sign(
        { doc: doc_id },
        process.env.REFRESH_TOKEN_DOCTOR,
        { expiresIn: "10m" },
        (err, token) => {
          if (err) {
            errors = err;
            throw errors;
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
      res.json({ status: errors });
    }
  }
);

module.exports = DocRouter;
