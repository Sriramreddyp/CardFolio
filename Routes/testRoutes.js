const express = require("express");
const PresModel = require("../Models/Prescription");
const UserModel = require("../Models/User");
const TestRouter = express.Router();

TestRouter.get("/", (req, res) => {
  res.json("Connection Successfull");
});

//**Doc addition route to the user Schema */
TestRouter.post("/addUser", async (req, res) => {
  const user = new UserModel(req.body);

  try {
    await user.save();
    console.log(user);
    res.json({ status: "Sucessfull!!" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Not Inserted" });
  }
});

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
