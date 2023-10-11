const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DataBaseOperations.js");

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
      .isLength({ min: 12 }),
    body("pin", "Plese enter the PIN in required format")
      .exists()
      .isNumeric()
      .isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      //? Validation Handling
      let errors = validationResult(req.body);
      if (!errors.isEmpty()) throw errors;

      //? Grabbing values from req and database
      let doc_id = req.body.service_id;
      let pass = await dboperations.loginDoctor(doc_id);

      //? CheckUp for authenticity
      if (pass != false && pass == req.body.password) {
        res.json({ status: "login SucessFull!!" });
      } else {
        errors = "Invalid credentials";
        throw errors;
      }
    } catch (errors) {
      res.json({ status: errors });
    }
  }
);

module.exports = DocRouter;
