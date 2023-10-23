const mongoose = require("mongoose");

//** Establishing Connection with Local MongoDB */
mongoose.connect("mongodb://127.0.0.1:27017/Estonian_DB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//**Checking the authenticity of the connection */
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error :")); // Error Generated

db.once("open", () => {
  console.log("Mongo Connected Sucessfully!!"); //Mesg upon Successfull connection
});