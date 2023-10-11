const express = require("express");
const dotenv = require("dotenv");
const BodyParser = require("body-parser");
const DocRouter = require("./Routes/doctor.js");
const test = require("./Routes/testRoutes.js");
const app = express();
require("./DB/Server.js");

app.use(express.json());
app.use(BodyParser.urlencoded({ extended: true }));
dotenv.config();

app.get("/", (req, res) => {
  res.send("API is running!!!");
});

app.use("/doctor", DocRouter);
app.use("/test", test);

app.listen(process.env.PORT, () => {
  console.log(`API Listening on Port : ${process.env.PORT}`);
});
