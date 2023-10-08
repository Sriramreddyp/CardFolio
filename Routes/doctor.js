const express = require("express");
const DocRouter = express.Router();

DocRouter.get("/", (req, res) => {
  res.send("Doctor Route is Working Fine!!");
});
module.exports = DocRouter;
