const express = require("express");
// const dotenv = require("dotenv");
const BodyParser = require("body-parser");
const DocRouter = require("./Routes/doctor.js");
const test = require("./Routes/testRoutes.js");
const pharmac = require("./Routes/pharmacist.js");
const user = require("./Routes/user.js");
const cookieParser = require("cookie-parser");
const app = express();
const ej = require("ejs");
const PORT = 80;
require("./DB/Server.js");
require("./DB/SQL.js");

app.use(express.static("/app/public"));
app.engine("html", ej.renderFile);
app.set("view engine", "ejs");

app.use(express.json());
app.use(cookieParser());
app.use(BodyParser.urlencoded({ extended: true }));
// dotenv.config();

app.get("/", (req, res) => {
  res.send("API is running!!!");
});

app.use("/doctor", DocRouter.DocRouter);
app.use("/test", test);
app.use("/phar", pharmac);
app.use("/user", user);

app.listen(process.env.PORT, () => {
  console.log(`API Listening on Port : ${PORT}`);
});
