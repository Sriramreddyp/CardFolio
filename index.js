const express = require("express");
const dotenv = require("dotenv");
const BodyParser = require("body-parser");
const DocRouter = require("./Routes/doctor.js");
const test = require("./Routes/testRoutes.js");
const pharmac = require("./Routes/pharmacist.js");
const cookieParser = require("cookie-parser");
const app = express();
const ej = require("ejs");

require("./DB/Server.js");
require("./DB/SQL.js");

app.use(express.static("./public"));
app.engine("html", ej.renderFile);
app.set("view engine", "ejs");

app.use(express.json());
app.use(cookieParser());
app.use(BodyParser.urlencoded({ extended: true }));
dotenv.config();

app.get("/", (req, res) => {
  res.send("API is running!!!");
});

app.use("/doctor", DocRouter.DocRouter);
app.use("/test", test);
app.use("/phar", pharmac);

// app.get("/docter", (req, res) => {
//   res.render("Docter/DLogin");
// });
app.get("/phar", (req, res) => {
  res.render("Pharmacist/MLogin");
});

app.listen(process.env.PORT, () => {
  console.log(`API Listening on Port : ${process.env.PORT}`);
});
