const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();
const { body, validationResult } = require("express-validator");

TestRouter.get("/", (req, res) => {
  res.json("Connection Successfull");
});

//**Doc addition route to the user Schema */
TestRouter.post(
  "/addUser",
  [
    //? Validation Parameters
    body("id_card", "Please enter the number in required format")
      .exists()
      .isNumeric()
      .isLength({ min: 12 }),
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
  const pres = new PresModel(req.body);
  try {
    await pres.save();
    console.log(pres);
    res.json({ status: "Sucessfull!!" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Not Inserted" });
  }
});

module.exports = TestRouter;
