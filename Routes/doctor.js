const express = require("express");
const DocRouter = express.Router();

//* Base Route
DocRouter.get("/", (req, res) => {
  res.send("Doctor Route is Working Fine!!");
});

//* Login Route for Doctor Portal
DocRouter.post("/login", [], async (req, res) => {});

module.exports = DocRouter;
