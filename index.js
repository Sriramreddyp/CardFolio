const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

require("./DB/Mongo.js");
require('./DB/SQL.js');

const app = express();
dotenv.config();
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.send("API is running!!!");
});

app.use("/api/doctor",require('./Routes/Doctors.js'));
app.use("/api/user",require('./Routes/Users.js'));

app.listen(process.env.PORT,()=>{
    console.log(`Server Running on port ${process.env.PORT}`);
})